// Gemini Live ephemeral-token broker. The permanent key never reaches the browser.
const cors = {"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
function allowed(origin:string, env:(n:string)=>string|undefined) {
 const configured=(env("ALLOWED_APP_ORIGINS")||"").split(",").map(x=>x.trim()).filter(Boolean);
 if(configured.includes(origin)) return true;
 try { const u=new URL(origin); return u.protocol==="https:" && /^french-academy-[a-z0-9-]+-vogtay\.vercel\.app$/.test(u.hostname); } catch { return false; }
}
function reply(body:unknown,status:number,origin:string|null) {
 return new Response(JSON.stringify(body),{status,headers:{...cors,...(origin?{"Access-Control-Allow-Origin":origin}:{}),"Content-Type":"application/json","Cache-Control":"no-store"}});
}
const clean=(value:unknown,max:number)=>typeof value==="string"?value.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"";
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin"), okOrigin=origin&&allowed(origin,n=>Deno.env.get(n))?origin:null;
 if(req.method==="OPTIONS") return okOrigin?new Response(null,{status:204,headers:{...cors,"Access-Control-Allow-Origin":okOrigin}}):new Response(null,{status:403,headers:cors});
 if(req.method!=="POST") return reply({error:"method_not_allowed"},405,okOrigin);
 if(!okOrigin) return reply({error:"origin_not_allowed"},403,null);
 const authHeader=req.headers.get("Authorization")||"";
 if(!/^Bearer\s+\S+$/i.test(authHeader)) return reply({error:"not_signed_in"},401,okOrigin);
 const supabaseUrl=Deno.env.get("SUPABASE_URL"),anonKey=Deno.env.get("SUPABASE_ANON_KEY"),geminiKey=Deno.env.get("GEMINI_API_KEY");
 if(!supabaseUrl||!anonKey||!geminiKey) return reply({error:"voice_service_not_configured"},503,okOrigin);
 const auth=await fetch(new URL("/auth/v1/user",supabaseUrl),{headers:{apikey:anonKey,Authorization:authHeader}});
 if(!auth.ok) return reply({error:"not_signed_in"},401,okOrigin);
 const user=await auth.json(); if(!user||typeof user.id!=="string") return reply({error:"not_signed_in"},401,okOrigin);
 let input:Record<string,unknown>; try{input=await req.json();}catch{return reply({error:"invalid_request"},400,okOrigin);}
 const level=["none","A1","A2","B1","B2","C1","C2"].includes(String(input.level))?String(input.level):"A1";
 const mode=input.mode==="conversation"?"conversation":"guided";
 const support=input.language==="fr"?"French":"English";
 const topics=Array.isArray(input.topics)?input.topics.slice(0,12).map(x=>clean(x,48)).filter(Boolean):[];
 const recent=Array.isArray(input.recent)?input.recent.slice(-6).map(x=>({role:x?.role==="assistant"?"Tutor":"Learner",text:clean(x?.content,500)})).filter(x=>x.text):[];
 const instructions=[
  "You are Académie AI Live, the spoken French teacher inside Académie. You are one integrated part of the existing French Academy learning system, not a separate generic chatbot.",
  level==="none"?"Learner level: absolute beginner (pre-A1). Assume no prior French knowledge.":"Learner guidance level: "+level+". Do not assume mastery from a CEFR label.",
  "Learner explanation language: "+support+". Teach French progressively. Explain unfamiliar vocabulary in "+support+".",
  mode==="guided"?"Teaching mode: guided lesson. Teach one small concept, model it, invite one response, then give supportive correction. Never test a concept before teaching it.":"Teaching mode: natural conversation. Keep the dialogue realistic and adapt to learner ability; briefly explain useful corrections.",
  topics.length?"Previously recorded practice topics (activity, not proof of mastery): "+topics.join(", ")+".":"No verified topic history was supplied. Do not invent prior lessons.",
  recent.length?"Recent Tutor context for continuity (not a mastery record): "+recent.map(x=>x.role+": "+x.text).join(" | "):"No recent text-Tutor turns were supplied.",
  "Use concise natural speech, one question at a time, and leave space for the learner. Correct one or two high-value mistakes at a time.",
  "Never claim to remember anything beyond the profile and recent context explicitly provided here. Do not claim phonetic or accent scoring from audio unless an explicit assessment is available.",
  "Keep the learner's spoken practice coherent with Académie's dictionary, grammar and conjugation knowledge. If a precise rule is uncertain, say so instead of inventing it."
 ].join("\n");
 const now=Date.now();
 const tokenResponse=await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens",{
  method:"POST",headers:{"x-goog-api-key":geminiKey,"Content-Type":"application/json"},
  body:JSON.stringify({
   uses:1,expireTime:new Date(now+30*60*1000).toISOString(),newSessionExpireTime:new Date(now+60*1000).toISOString(),
   liveConnectConstraints:{model:"gemini-3.8-live",config:{responseModalities:["AUDIO"],sessionResumption:{},inputAudioTranscription:{},outputAudioTranscription:{},systemInstruction:{parts:[{text:instructions}]}}}
  })
 });
 const data=await tokenResponse.json().catch(()=>({}));
 if(!tokenResponse.ok||typeof data.name!=="string"){console.error("[live-voice] Gemini token provisioning failed",{status:tokenResponse.status});return reply({error:"voice_session_unavailable"},502,okOrigin);}
 return reply({ephemeral_token:data.name,expires_at:data.expireTime||null,model:"gemini-3.8-live",instructions},200,okOrigin);
});
