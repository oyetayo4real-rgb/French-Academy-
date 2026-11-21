// Authenticated Groq voice-turn adapter. Audio and provider credentials stay server-side.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" }
});
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "invalid_request" }, 405);
  const authorization = req.headers.get("Authorization") || "";
  if (!/^Bearer\\s+\\S+$/i.test(authorization)) return json({ error: "not_signed_in" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");
  // Explicit staging opt-in prevents an unverified Groq account from being used or billed.
  if (Deno.env.get("GROQ_VOICE_ENABLED") !== "true") return json({ error: "groq_voice_disabled" }, 503);
  if (!supabaseUrl || !anonKey || !groqKey) return json({ error: "voice_service_unavailable" }, 503);
  const auth = await fetch(new URL("/auth/v1/user", supabaseUrl), {
    headers: { apikey: anonKey, Authorization: authorization },
    signal: AbortSignal.timeout(8000)
  }).catch(() => null);
  if (!auth?.ok) return json({ error: "not_signed_in" }, 401);
  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: "invalid_request" }, 400); }
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size < 1024 || audio.size > 8 * 1024 * 1024) {
    return json({ error: "invalid_audio" }, 400);
  }
  const allowedTypes = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/mpeg"];
  if (!allowedTypes.some(type => audio.type.toLowerCase().startsWith(type))) return json({ error: "unsupported_audio" }, 415);
  const language = form.get("language") === "en" ? "en" : "fr";
  const groqForm = new FormData();
  groqForm.append("file", audio, audio.name || "voice-turn.webm");
  groqForm.append("model", "whisper-large-v3-turbo");
  groqForm.append("language", language);
  groqForm.append("response_format", "json");
  groqForm.append("temperature", "0");
  const transcription = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: "Bearer " + groqKey },
    body: groqForm,
    signal: AbortSignal.timeout(25000)
  }).catch(() => null);
  if (!transcription?.ok) {
    const status = transcription?.status || 502;
    return json({ error: status === 429 ? "provider_rate_limit" : "transcription_unavailable" }, status === 429 ? 429 : 502);
  }
  const transcriptBody = await transcription.json().catch(() => ({}));
  const transcript = typeof transcriptBody.text === "string" ? transcriptBody.text.trim().slice(0, 1800) : "";
  if (!transcript) return json({ error: "empty_transcription" }, 422);
  let history: unknown[] = [];
  try {
    const raw = form.get("history");
    history = typeof raw === "string" ? JSON.parse(raw) : [];
    if (!Array.isArray(history)) history = [];
  } catch { return json({ error: "invalid_history" }, 400); }
  const level = String(form.get("level") || "A1").slice(0, 8);
  const memory = form.get("useLearningMemory") === "true";
  const tutor = await fetch(supabaseUrl.replace(/\/$/, "") + "/functions/v1/tutor-v2", {
    method: "POST",
    headers: { apikey: anonKey, Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "practice", depth: "quick", level, text: transcript, history,
      useLearningMemory: memory, voiceProvider: "groq"
    }),
    signal: AbortSignal.timeout(35000)
  }).catch(() => null);
  if (!tutor) return json({ error: "provider_unavailable", transcript }, 502);
  const answer = await tutor.json().catch(() => ({}));
  if (!tutor.ok || typeof answer.text !== "string") {
    return json({ error: answer.error || "provider_unavailable", retryable: answer.retryable === true, transcript }, tutor.status || 502);
  }
  return json({ transcript, text: answer.text, learningMemory: answer.learningMemory || null });
});
