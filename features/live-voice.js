// Gemini Live primary + authenticated Groq voice fallback. Continuous listening, VAD and barge-in.
(function () {
  "use strict";
  let ws = null, stream = null, audio = null, source = null, processor = null, silent = null;
  let active = false, busy = false, provider = "none", sessionId = 0, playAt = 0;
  let playing = new Set(), recorder = null, chunks = [], speechStarted = 0, lastVoiceAt = 0;
  let groqTurnBusy = false, groqResponseSpeaking = false, lastTranscript = "";
  const $ = id => document.getElementById(id);
  const bridge = () => window.FA_LIVE_VOICE_CONTEXT;
  const now = () => performance.now();
  function status(message, bad) {
    const node = $("faLiveStatus");
    if (node) { node.textContent = message; node.style.color = bad ? "var(--bad)" : "var(--mu)"; }
    const badge = $("faLiveProvider");
    if (badge) badge.textContent = provider === "gemini" ? "Gemini Live" : provider === "groq" ? "Groq Voice backup" : "Not connected";
  }
  function line(who, value) {
    const text = String(value || "").trim();
    if (!text) return;
    const box = $("faLiveTranscript");
    if (box) {
      const p = document.createElement("p");
      p.style.cssText = "padding:8px;background:var(--bg);border-radius:9px;white-space:pre-wrap";
      const b = document.createElement("b"); b.textContent = who + ": ";
      p.append(b, document.createTextNode(text)); box.appendChild(p); box.scrollTop = box.scrollHeight;
    }
    bridge()?.appendTranscript?.(who === "You" ? "user" : "assistant", text);
  }
  function mount() {
    if ($("faLivePanel")) return;
    const heading = [...document.querySelectorAll("h1")].find(n => /Académie French Intelligence|AI French tutor/i.test(n.textContent || ""));
    if (!heading) return;
    const section = document.createElement("section");
    section.id = "faLivePanel"; section.className = "card";
    section.innerHTML = '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><h2 style="margin:0">🎙️ Académie Live Conversation</h2><span id="faLiveProvider" class="mu">Not connected</span></div><p class="mu">Speak naturally in French or English. Académie listens continuously and you can interrupt its response.</p><label class="mu" for="faLiveMode">Teaching style</label><select id="faLiveMode" style="width:100%;padding:10px;border:1px solid var(--bd);border-radius:9px;background:var(--bg);color:var(--tx)"><option value="guided">Guided lesson — teach, practise, correct</option><option value="conversation">Free conversation practice</option></select><div style="display:flex;gap:8px;margin-top:10px"><button id="faLiveStart" type="button">Start speaking</button><button id="faLiveStop" type="button" class="g" disabled>End conversation</button></div><p id="faLiveStatus" class="mu" role="status" aria-live="polite">Ready. Microphone permission is requested only when you start.</p><div id="faLiveTranscript" aria-live="polite" style="max-height:220px;overflow:auto"></div>';
    heading.insertAdjacentElement("afterend", section);
  }
  function b64(bytes) {
    let value = ""; for (let i = 0; i < bytes.length; i++) value += String.fromCharCode(bytes[i]);
    return btoa(value);
  }
  function fromB64(value) {
    const raw = atob(value), bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }
  function pcm16(input) {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) { const x = Math.max(-1, Math.min(1, input[i])); out[i] = x < 0 ? x * 32768 : x * 32767; }
    return new Uint8Array(out.buffer);
  }
  function resample(input, fromRate, toRate) {
    if (fromRate === toRate) return input;
    const ratio = fromRate / toRate, length = Math.floor(input.length / ratio), output = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const start = Math.floor(i * ratio), end = Math.min(input.length, Math.floor((i + 1) * ratio));
      let sum = 0; for (let j = start; j < end; j++) sum += input[j];
      output[i] = sum / Math.max(1, end - start);
    }
    return output;
  }
  let pcmQueue = [];
  function sendGeminiAudio(input) {
    if (ws?.readyState !== WebSocket.OPEN) return;
    const samples = resample(input, audio.sampleRate, 16000);
    for (let i = 0; i < samples.length; i++) pcmQueue.push(samples[i]);
    while (pcmQueue.length >= 1600) {
      const packet = new Float32Array(pcmQueue.splice(0, 1600));
      ws.send(JSON.stringify({ realtimeInput: { audio: { data: b64(pcm16(packet)), mimeType: "audio/pcm;rate=16000" } } }));
    }
  }
  function playPcm(encoded) {
    if (!audio) return;
    const bytes = fromB64(encoded), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const samples = new Float32Array(Math.floor(bytes.byteLength / 2));
    for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
    const buffer = audio.createBuffer(1, samples.length, 24000), channel = buffer.getChannelData(0);
    channel.set(samples);
    const node = audio.createBufferSource(); node.buffer = buffer; node.connect(audio.destination);
    const start = Math.max(audio.currentTime + 0.02, playAt); node.start(start); playAt = start + buffer.duration;
    playing.add(node); node.onended = () => playing.delete(node);
  }
  function stopPlayback() {
    for (const node of playing) { try { node.stop(); } catch {} }
    playing.clear(); playAt = audio ? audio.currentTime : 0;
  }
  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    groqResponseSpeaking = false;
  }
  function speak(text, language) {
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      status("Your browser does not provide speech synthesis. The response is available in the transcript.", true); return;
    }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const wanted = language === "en" ? "en" : "fr";
    const voice = voices.find(v => v.lang.toLowerCase().startsWith(wanted));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || (wanted === "fr" ? "fr-FR" : "en-US");
    utterance.rate = 0.96; utterance.pitch = 1;
    utterance.onstart = () => { groqResponseSpeaking = true; status("Académie is speaking. You can interrupt at any time."); };
    utterance.onend = () => { groqResponseSpeaking = false; if (active && provider === "groq") status("Listening — speak whenever you're ready."); };
    utterance.onerror = () => { groqResponseSpeaking = false; };
    window.speechSynthesis.speak(utterance);
  }
  function config() {
    const ctx = bridge()?.context?.() || {};
    return {
      level: ctx.level || bridge()?.level?.() || "A1",
      mode: $("faLiveMode")?.value || "guided",
      language: $("faVoiceLanguage")?.value === "en-US" ? "en" : "fr",
      topics: ctx.topics || [], recent: ctx.recent || []
    };
  }
  function handleGeminiMessage(event, id) {
    let data; try { data = JSON.parse(event.data); } catch { return; }
    if (id !== sessionId) return;
    if (data.setupComplete) { status("Connected — speak naturally. You can interrupt Académie."); return; }
    const content = data.serverContent;
    if (content) {
      if (content.inputTranscription?.text) {
        const text = content.inputTranscription.text.trim();
        if (text && text !== lastTranscript) {
          lastTranscript = text; line("You", text);
          Promise.resolve(bridge()?.recordVoiceTurn?.(text)).catch(() => status("Voice worked, but learning progress could not be saved.", true));
        }
      }
      if (content.outputTranscription?.text) line("Académie AI", content.outputTranscription.text);
      if (content.interrupted) { stopPlayback(); status("Listening — you interrupted. Go ahead."); }
      for (const part of content.modelTurn?.parts || []) if (part.inlineData?.data) playPcm(part.inlineData.data);
      if (content.turnComplete) status("Your turn — keep speaking whenever you're ready.");
    }
    if (data.goAway) status("Gemini is preparing to close this session. Switching to Groq if needed.");
    if (data.error) fallbackToGroq("Gemini Live reported an error.");
  }
  function connectGemini(token, settings, id) {
    return new Promise((resolve, reject) => {
      const endpoint = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=" + encodeURIComponent(token);
      ws = new WebSocket(endpoint);
      const timeout = setTimeout(() => reject(new Error("Gemini Live connection timed out.")), 18000);
      ws.onopen = () => {
        ws.send(JSON.stringify({ setup: {
          model: "models/gemini-3.8-live",
          generationConfig: { responseModalities: ["AUDIO"] },
          systemInstruction: { parts: [{ text: settings.instructions || "" }] },
          inputAudioTranscription: {}, outputAudioTranscription: {},
          realtimeInputConfig: { automaticActivityDetection: { disabled: false } },
          sessionResumption: {}
        } }));
      };
      ws.onmessage = event => {
        const before = provider !== "gemini";
        handleGeminiMessage(event, id);
        if (before && id === sessionId && event.data && String(event.data).includes("setupComplete")) {
          clearTimeout(timeout); provider = "gemini"; resolve();
        }
      };
      ws.onerror = () => { clearTimeout(timeout); reject(new Error("Gemini Live could not connect.")); };
      ws.onclose = () => {
        clearTimeout(timeout);
        if (id === sessionId && active && provider === "gemini") fallbackToGroq("Gemini Live disconnected.");
      };
    });
  }
  function recorderType() {
    if (!window.MediaRecorder) throw new Error("This browser cannot record audio for the Groq backup.");
    return ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
      .find(type => MediaRecorder.isTypeSupported(type)) || "";
  }
  function beginRecording() {
    if (recorder || !stream || !active || provider !== "groq" || groqTurnBusy) return;
    try {
      const type = recorderType();
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks = []; speechStarted = now();
      recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder?.mimeType || "audio/webm" });
        recorder = null; chunks = [];
        if (blob.size >= 1500 && active && provider === "groq") submitGroqTurn(blob).catch(error => status(error.message || "Groq voice turn failed. Listening continues.", true));
      };
      recorder.start(250);
    } catch (error) { recorder = null; status(error.message || "Could not start microphone recording.", true); }
  }
  function endRecording() {
    if (recorder && recorder.state !== "inactive") { try { recorder.stop(); } catch {} }
  }
  async function submitGroqTurn(blob) {
    if (groqTurnBusy || !active) return;
    groqTurnBusy = true; status("Understanding your speech…");
    try {
      const ctx = bridge()?.context?.() || {}, settings = config(), payload = new FormData();
      payload.append("audio", blob, "voice-turn.webm");
      payload.append("language", settings.language);
      payload.append("level", settings.level);
      payload.append("history", JSON.stringify((ctx.recent || []).slice(-6)));
      payload.append("useLearningMemory", String(!!ctx.memoryEnabled));
      const result = await bridge().groqTurn(payload);
      if (!active || provider !== "groq") return;
      if (result.transcript) { lastTranscript = result.transcript; line("You", result.transcript); }
      if (result.text) { line("Académie AI", result.text); speak(result.text, settings.language); }
      status("Groq backup is active — listening continuously.");
    } finally { groqTurnBusy = false; }
  }
  function onAudioFrame(input) {
    if (!active || !input?.length) return;
    if (provider === "gemini") { sendGeminiAudio(input); return; }
    if (provider !== "groq") return;
    let energy = 0; for (let i = 0; i < input.length; i++) energy += input[i] * input[i];
    const rms = Math.sqrt(energy / input.length);
    const voice = rms > 0.022;
    if (voice) {
      lastVoiceAt = now();
      if (groqResponseSpeaking) { stopSpeech(); status("You interrupted Académie — listening."); }
      if (!groqTurnBusy) beginRecording();
    } else if (recorder && now() - lastVoiceAt > 720 && now() - speechStarted > 450) {
      endRecording();
    }
  }
  function setupAudio() {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    return audio.resume().then(() => {
      source = audio.createMediaStreamSource(stream);
      processor = audio.createScriptProcessor(4096, 1, 1);
      silent = audio.createGain(); silent.gain.value = 0;
      processor.onaudioprocess = event => onAudioFrame(event.inputBuffer.getChannelData(0));
      source.connect(processor); processor.connect(silent); silent.connect(audio.destination);
    });
  }
  async function fallbackToGroq(reason) {
    if (!active || provider === "groq") return;
    provider = "groq";
    if (ws) { const old = ws; ws = null; try { old.close(); } catch {} }
    pcmQueue = []; stopPlayback();
    status(reason + " Switching to Groq Voice automatically.");
    status("Groq backup connected — speak naturally. You can interrupt responses.");
  }
  async function start() {
    if (busy || active) return;
    const app = bridge();
    if (!app?.isSignedIn?.()) { status("Please sign in before starting a live conversation.", true); return; }
    busy = true; $("faLiveStart").disabled = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.WebSocket) throw new Error("Live voice requires a recent browser over HTTPS.");
      status("Requesting microphone permission…");
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      await setupAudio();
      active = true; const id = ++sessionId, settings = config();
      try {
        status("Connecting to Gemini Live…");
        const ticket = await app.request(settings);
        if (!ticket?.ephemeral_token) throw new Error("Gemini Live could not authorize this session.");
        settings.instructions = ticket.instructions || "";
        await connectGemini(ticket.ephemeral_token, settings, id);
        provider = "gemini"; $("faLiveStop").disabled = false;
        status("Gemini Live connected — speak naturally.");
      } catch (error) {
        provider = "none";
        await fallbackToGroq(error.message || "Gemini Live is unavailable.");
        $("faLiveStop").disabled = false;
      }
    } catch (error) {
      await stop(); status(error?.message || "Could not start live conversation.", true);
    } finally { busy = false; if ($("faLiveStart")) $("faLiveStart").disabled = active; }
  }
  async function stop() {
    active = false; provider = "none"; sessionId++;
    stopSpeech(); stopPlayback();
    if (ws) { try { ws.close(); } catch {} ws = null; }
    if (recorder) { try { recorder.onstop = null; recorder.stop(); } catch {} recorder = null; }
    if (processor) { processor.disconnect(); processor.onaudioprocess = null; processor = null; }
    if (source) { source.disconnect(); source = null; }
    if (silent) { silent.disconnect(); silent = null; }
    if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
    if (audio) { try { await audio.close(); } catch {} audio = null; }
    chunks = []; pcmQueue = []; groqTurnBusy = false; groqResponseSpeaking = false;
    if ($("faLiveStart")) $("faLiveStart").disabled = false;
    if ($("faLiveStop")) $("faLiveStop").disabled = true;
    status("Conversation ended. Microphone is off.");
  }
  document.addEventListener("click", event => {
    if (event.target?.id === "faLiveStart") start();
    if (event.target?.id === "faLiveStop") stop();
  });
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  mount(); window.addEventListener("pagehide", stop);
})();
