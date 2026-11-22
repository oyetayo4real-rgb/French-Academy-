// Gemini Live primary + authenticated Groq voice fallback. Continuous listening, VAD and barge-in.
(function () {
  "use strict";
  let ws = null, liveSession = null, stream = null, audio = null, source = null, processor = null, silent = null;
  let active = false, busy = false, provider = "none", sessionId = 0, playAt = 0;
  let playing = new Set(), recorder = null, chunks = [], speechStarted = 0, lastVoiceAt = 0;
  let groqTurnBusy = false, groqResponseSpeaking = false, lastTranscript = "", geminiFailure = "";
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
    if (!liveSession || provider !== "gemini") return;
    const samples = resample(input, audio.sampleRate, 16000);
    for (let i = 0; i < samples.length; i++) pcmQueue.push(samples[i]);
    while (pcmQueue.length >= 1600) {
      const packet = new Float32Array(pcmQueue.splice(0, 1600));
      const bytes = pcm16(packet);
      const media = new Blob([bytes], { type: "audio/pcm;rate=16000" });
      try { liveSession.sendRealtimeInput({ media }); }
      catch (error) { fallbackToGroq(error?.message || "Could not stream microphone audio to Gemini."); return; }
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
      language: "auto",
      topics: ctx.topics || [], recent: ctx.recent || []
    };
  }
  function handleGeminiMessage(data, id) {
    if (id !== sessionId || !data) return;
    const content = data.serverContent || {};
    const inputTranscript = data.inputTranscription?.text || content.inputTranscription?.text;
    const outputTranscript = data.outputTranscription?.text || content.outputTranscription?.text;
    if (inputTranscript) {
      const text = inputTranscript.trim();
      if (text && text !== lastTranscript) {
        lastTranscript = text; line("You", text);
        Promise.resolve(bridge()?.recordVoiceTurn?.(text)).catch(() => status("Voice worked, but learning progress could not be saved.", true));
      }
    }
    if (outputTranscript) line("Académie AI", outputTranscript);
    if (content.interrupted) { stopPlayback(); status("Listening — you interrupted. Go ahead."); }
    for (const part of content.modelTurn?.parts || []) if (part.inlineData?.data) playPcm(part.inlineData.data);
    if (content.turnComplete) status("Listening — speak whenever you're ready.");
    if (data.goAway) status("Gemini is preparing to close this session.");
    if (data.error) fallbackToGroq(data.error.message || data.error.status || "Gemini Live reported an error.");
  }
  async function connectGemini(token, settings, id) {
    const sdkUrl = "https://esm.sh/@google/genai@2.32.0?bundle";
    status("Loading Google's official Live SDK…");
    const { GoogleGenAI } = await import(sdkUrl);
    if (id !== sessionId || !active) throw new Error("Live conversation was cancelled.");
    const ai = new GoogleGenAI({
      apiKey: token,
      httpOptions: { apiVersion: "v1alpha" }
    });
    let settledClose = false;
    let closeError = null;
    const connectPromise = ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: ["AUDIO"],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: { disabled: false }
        },
        sessionResumption: {},
        systemInstruction: { parts: [{ text: settings.instructions || "" }] }
      },
      callbacks: {
        onopen: () => status("Gemini transport opened — configuring live session…"),
        onmessage: message => handleGeminiMessage(message, id),
        onerror: event => {
          const detail = event?.message || event?.error?.message || "WebSocket transport error";
          closeError = new Error("Gemini Live transport: " + String(detail).slice(0, 180));
        },
        onclose: event => {
          settledClose = true;
          const reason = String(event?.reason || "").replace(/[\\u0000-\\u001f\\u007f]/g, " ").slice(0, 140);
          closeError = new Error("Gemini Live closed (code " + (event?.code ?? 1006) + (reason ? ": " + reason : "") + ").");
          if (id === sessionId && active && provider === "gemini") fallbackToGroq(closeError.message);
        }
      }
    });
    let timeoutId;
    try {
      liveSession = await Promise.race([
        connectPromise,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(closeError || new Error("Gemini Live setup timed out after 20 seconds.")), 20000);
        })
      ]);
    } catch (error) {
      try { liveSession?.close(); } catch {}
      liveSession = null;
      throw closeError || error;
    } finally {
      clearTimeout(timeoutId);
    }
    if (id !== sessionId || !active) {
      try { liveSession.close(); } catch {}
      liveSession = null;
      throw new Error("Live conversation was cancelled during connection.");
    }
    if (settledClose) throw closeError || new Error("Gemini Live closed during setup.");
    provider = "gemini";
    status("Gemini Live connected — speak naturally. You can interrupt Académie.");
    return liveSession;
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
        if (blob.size >= 1500 && active && provider === "groq") submitGroqTurn(blob).catch(error => {
        const message = error.message || "Groq voice turn failed.";
        if (/disabled|rate_limit|unavailable|not_signed_in/i.test(message)) {
          provider = "none";
          status((geminiFailure ? geminiFailure + " " : "") + message + " Voice backup has stopped to avoid repeated requests.", true);
        } else status(message, true);
      });
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
      if (result.text) { line("Académie AI", result.text); speak(result.text, "fr"); }
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
    } else if (recorder && ((now() - lastVoiceAt > 720 && now() - speechStarted > 450) || now() - speechStarted > 15000)) {
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
    geminiFailure = String(reason || "Gemini Live connection failed.");
    provider = "groq";
    if (liveSession) { const old = liveSession; liveSession = null; try { old.close(); } catch {} }\n    if (ws) { const old = ws; ws = null; try { old.close(); } catch {} }
    pcmQueue = []; stopPlayback();
    status(reason + " Switching to the Groq voice pipeline automatically.");
    if (!window.MediaRecorder) status("Gemini is unavailable and this browser cannot record audio for the Groq backup.", true);
    else status("Groq backup is ready — speak naturally. You can interrupt spoken responses.");
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
    if (liveSession) { try { liveSession.close(); } catch {} liveSession = null; }\n    if (ws) { try { ws.close(); } catch {} ws = null; }
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
