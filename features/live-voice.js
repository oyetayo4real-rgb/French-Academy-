// Gemini Live API browser client. Continuous PCM audio, barge-in and Tutor context bridge.
(function(){
"use strict";
let ws=null,stream=null,context=null,source=null,processor=null,silent=null,active=false,busy=false,playAt=0,playing=new Set(),sessionId=0;
const $=id=>document.getElementById(id), app=()=>window.FA_LIVE_VOICE_CONTEXT;
function status(s,bad){const n=$("faLiveStatus");if(n){n.textContent=s;n.style.color=bad?"var(--bad)":"var(--mu)";}}
function line(who,s){if(!s)return;const box=$("faLiveTranscript");if(!box)return;const p=document.createElement("p");p.style.cssText="padding:8px;background:var(--bg);border-radius:9px;white-space:pre-wrap";const b=document.createElement("b");b.textContent=who+": ";p.append(b,document.createTextNode(s));box.appendChild(p);box.scrollTop=box.scrollHeight;const bridge=app();if(bridge&&bridge.appendTranscript)bridge.appendTranscript(who==="You"?"user":"assistant",s);}
function mount(){if($("faLivePanel"))return;const h=[...document.querySelectorAll("h1")].find(n=>/Académie French Intelligence|AI French tutor/i.test(n.textContent||""));if(!h)return;
const section=document.createElement("section");section.id="faLivePanel";section.className="card";section.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><h2 style="margin:0">🎙️ Académie Live Conversation</h2><span class="mu">Gemini Live</span></div><p class="mu">Speak naturally in French or English. The same Académie Tutor context and learning profile guide this conversation.</p><label class="mu" for="faLiveMode">Teaching style</label><select id="faLiveMode" style="width:100%;padding:10px;border:1px solid var(--bd);border-radius:9px;background:var(--bg);color:var(--tx)"><option value="guided">Guided lesson — teach, practise, correct</option><option value="conversation">Free conversation practice</option></select><div style="display:flex;gap:8px;margin-top:10px"><button id="faLiveStart" type="button">Start speaking</button><button id="faLiveStop" type="button" class="g" disabled>End conversation</button></div><p id="faLiveStatus" class="mu" role="status" aria-live="polite">Ready. Microphone permission is requested only when you start.</p><div id="faLiveTranscript" aria-live="polite" style="max-height:220px;overflow:auto"></div>';h.insertAdjacentElement("afterend",section);}
function b64(bytes){let s="";for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s);}
function fromB64(s){const raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
function pcm16(float32){const out=new Int16Array(float32.length);for(let i=0;i<float32.length;i++){const x=Math.max(-1,Math.min(1,float32[i]));out[i]=x<0?x*32768:x*32767;}return new Uint8Array(out.buffer);}
function resample(input,fromRate,toRate){if(fromRate===toRate)return input;const ratio=fromRate/toRate,len=Math.floor(input.length/ratio),out=new Float32Array(len);for(let i=0;i<len;i++){const start=Math.floor(i*ratio),end=Math.min(input.length,Math.floor((i+1)*ratio));let sum=0;for(let j=start;j<end;j++)sum+=input[j];out[i]=sum/Math.max(1,end-start);}return out;}
function sendAudio(float32){if(ws?.readyState!==WebSocket.OPEN)return;const samples=resample(float32,context.sampleRate,16000);ws.send(JSON.stringify({realtimeInput:{audio:{data:b64(pcm16(samples)),mimeType:"audio/pcm;rate=16000"}}}));}
function playPcm(encoded){if(!context)return;const bytes=fromB64(encoded),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),samples=new Float32Array(Math.floor(bytes.byteLength/2));for(let i=0;i<samples.length;i++)samples[i]=view.getInt16(i*2,true)/32768;const buffer=context.createBuffer(1,samples.length,24000),channel=buffer.getChannelData(0);channel.set(samples);const node=context.createBufferSource();node.buffer=buffer;node.connect(context.destination);const start=Math.max(context.currentTime+0.02,playAt);node.start(start);playAt=start+buffer.duration;playing.add(node);node.onended=()=>playing.delete(node);}
function stopPlayback(){for(const node of playing){try{node.stop()}catch{}}playing.clear();playAt=context?context.currentTime:0;}
function receive(message){let data;try{data=JSON.parse(message.data)}catch{return;}
if(data.setupComplete){status("Connected — speak naturally. You can interrupt Académie at any time.");return;}
if(data.serverContent){const c=data.serverContent;
if(c.inputTranscription?.text){line("You",c.inputTranscription.text);app()?.recordVoiceTurn?.(c.inputTranscription.text).catch(()=>status("Voice worked, but learning progress could not be saved.",true));}
if(c.outputTranscription?.text)line("Académie AI",c.outputTranscription.text);
if(c.interrupted){stopPlayback();status("Listening — you interrupted. Go ahead.");}
if(c.modelTurn?.parts)for(const part of c.modelTurn.parts)if(part.inlineData?.data)playPcm(part.inlineData.data);
if(c.turnComplete)status("Your turn — keep speaking whenever you're ready.");
}
if(data.toolCall){status("Académie is checking its learning tools…");handleTools(data.toolCall);}
if(data.goAway){status("Reconnecting before this voice session expires…");}
if(data.error){status("Gemini Live returned an error. End the session and retry.",true);}
}
function setupConfig(){const bridge=app(),ctx=bridge?.context?bridge.context():{};const lang=$("faVoiceLanguage")?.value==="en-US"?"English":"French";const mode=$("faLiveMode")?.value||"guided";
const level=ctx.level||bridge?.level?.()||"A1";const topics=ctx.topics||[];const recent=ctx.recent||[];
return {level,mode,language:lang==="French"?"fr":"en",topics,recent};}
async function handleTools(call){const responses=[];for(const fc of call.functionCalls||[]){let result={error:"This learning tool is not available yet."};if(app()?.runTool){try{result=await app().runTool(fc.name,fc.args||{});}catch(e){result={error:e.message||"Tool failed"};}}responses.push({id:fc.id,name:fc.name,response:{result}});}
if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify({toolResponse:{functionResponses:responses}}));}
function setupSocket(token,config,myId){return new Promise((resolve,reject)=>{const endpoint="wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token="+encodeURIComponent(token);ws=new WebSocket(endpoint);
const timeout=setTimeout(()=>reject(Error("Gemini Live connection timed out.")),20000);
ws.onopen=()=>{ws.send(JSON.stringify({setup:{model:"models/gemini-3.8-live",responseModalities:["AUDIO"],inputAudioTranscription:{},outputAudioTranscription:{},realtimeInputConfig:{automaticActivityDetection:{disabled:false}},sessionResumption:{}}}));
ws.onmessage=e=>{if(myId!==sessionId)return;const before=!active;receive(e);if(before&&JSON.parse(e.data||"{}").setupComplete){clearTimeout(timeout);resolve();}};
ws.onerror=()=>{clearTimeout(timeout);reject(Error("Could not connect to Gemini Live. Check the staging API key and network."));};
ws.onclose=()=>{if(myId===sessionId&&active)status("Voice connection closed. End the session and reconnect.",true);};
});}
async function start(){if(busy||active)return;const bridge=app();if(!bridge?.isSignedIn?.()){status("Please sign in before starting a live conversation.",true);return;}busy=true;$("faLiveStart").disabled=true;
try{if(!navigator.mediaDevices?.getUserMedia||!window.WebSocket)throw Error("Live audio requires a recent browser over HTTPS.");status("Requesting microphone permission…");stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
const config=setupConfig(),ticket=await bridge.request(config);if(!ticket?.ephemeral_token)throw Error("Gemini could not authorize the voice session. Check the staging GEMINI_API_KEY secret.");config.instructions=ticket.instructions||"";
context=new (window.AudioContext||window.webkitAudioContext)();await context.resume();source=context.createMediaStreamSource(stream);processor=context.createScriptProcessor(4096,1,1);silent=context.createGain();silent.gain.value=0;processor.onaudioprocess=e=>{if(active&&ws?.readyState===WebSocket.OPEN)sendAudio(e.inputBuffer.getChannelData(0));};source.connect(processor);processor.connect(silent);silent.connect(context.destination);
const id=++sessionId;await setupSocket(ticket.ephemeral_token,config,id);active=true;$("faLiveStop").disabled=false;status("Connected — speak naturally. Gemini will listen and respond automatically.");
}catch(e){await stop();status(e?.message||"Could not start live conversation.",true);}finally{busy=false;if($("faLiveStart"))$("faLiveStart").disabled=active;}}
async function stop(){active=false;sessionId++;if(ws){try{ws.close()}catch{}ws=null;}if(processor){processor.disconnect();processor.onaudioprocess=null;processor=null;}if(source){source.disconnect();source=null;}if(silent){silent.disconnect();silent=null;}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}stopPlayback();if(context){try{await context.close()}catch{}context=null;}if($("faLiveStart"))$("faLiveStart").disabled=false;if($("faLiveStop"))$("faLiveStop").disabled=true;status("Conversation ended. Microphone is off.");}
document.addEventListener("click",e=>{if(e.target?.id==="faLiveStart")start();if(e.target?.id==="faLiveStop")stop();});new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});mount();window.addEventListener("pagehide",stop);
})();