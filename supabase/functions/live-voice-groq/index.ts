// Authenticated Groq voice-turn adapter. Audio and provider credentials stay server-side.
type Env = { get(name: string): string | undefined };
type GroqDependencies = { env?: Env; fetchImpl?: typeof fetch };

const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "600",
  "Vary": "Origin"
};

export function isAllowedGroqOrigin(origin: string, env: Env): boolean {
  const configured = (env.get("ALLOWED_APP_ORIGINS") || "").split(",").map(x => x.trim()).filter(Boolean);
  if (configured.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" &&
      /^french-academy-[a-z0-9-]+-vogtay\.vercel\.app$/.test(url.hostname);
  } catch {
    return false;
  }
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export function createGroqVoiceHandler(overrides: GroqDependencies = {}) {
  const env = overrides.env || Deno.env;
  const fetchImpl = overrides.fetchImpl || fetch;

  return async (req: Request): Promise<Response> => {
    const requestOrigin = req.headers.get("Origin");
    const allowedOrigin = requestOrigin && isAllowedGroqOrigin(requestOrigin, env) ? requestOrigin : null;
    if (req.method === "OPTIONS") {
      return allowedOrigin
        ? new Response(null, { status: 204, headers: { ...CORS_HEADERS, "Access-Control-Allow-Origin": allowedOrigin } })
        : new Response(null, { status: 403, headers: CORS_HEADERS });
    }
    if (req.method !== "POST") return json({ error: "invalid_request" }, 405, allowedOrigin);
    if (!allowedOrigin) return json({ error: "origin_not_allowed" }, 403, null);

    const authorization = req.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+$/i.test(authorization)) return json({ error: "not_signed_in" }, 401, allowedOrigin);
    const supabaseUrl = env.get("SUPABASE_URL");
    const anonKey = env.get("SUPABASE_ANON_KEY");
    const groqKey = env.get("GROQ_API_KEY");
    if (env.get("GROQ_VOICE_ENABLED") !== "true") return json({ error: "groq_voice_disabled" }, 503, allowedOrigin);
    if (!supabaseUrl || !anonKey || !groqKey) return json({ error: "voice_service_unavailable" }, 503, allowedOrigin);

    let auth: Response | null;
    try {
      auth = await fetchImpl(new URL("/auth/v1/user", supabaseUrl), {
        headers: { apikey: anonKey, Authorization: authorization },
        signal: AbortSignal.timeout(8000)
      });
    } catch {
      return json({ error: "auth_service_unavailable" }, 503, allowedOrigin);
    }
    if (!auth.ok) return json({ error: "not_signed_in" }, 401, allowedOrigin);
    const user = await auth.json().catch(() => null);
    if (!user || typeof user.id !== "string") return json({ error: "not_signed_in" }, 401, allowedOrigin);

    let form: FormData;
    try { form = await req.formData(); } catch { return json({ error: "invalid_request" }, 400, allowedOrigin); }
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size < 1024 || audio.size > 8 * 1024 * 1024) {
      return json({ error: "invalid_audio" }, 400, allowedOrigin);
    }
    const allowedTypes = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/mpeg"];
    if (!allowedTypes.some(type => audio.type.toLowerCase().startsWith(type))) {
      return json({ error: "unsupported_audio" }, 415, allowedOrigin);
    }

    const language = form.get("language") === "auto" ? "" : (form.get("language") === "en" ? "en" : "fr");
    const groqForm = new FormData();
    groqForm.append("file", audio, audio.name || "voice-turn.webm");
    groqForm.append("model", "whisper-large-v3-turbo");
    if (language) groqForm.append("language", language);
    groqForm.append("response_format", "json");
    groqForm.append("temperature", "0");

    let transcription: Response | null;
    try {
      transcription = await fetchImpl("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: "Bearer " + groqKey },
        body: groqForm,
        signal: AbortSignal.timeout(25000)
      });
    } catch {
      return json({ error: "transcription_unavailable" }, 502, allowedOrigin);
    }
    if (!transcription.ok) {
      return json({ error: transcription.status === 429 ? "provider_rate_limit" : "transcription_unavailable" },
        transcription.status === 429 ? 429 : 502, allowedOrigin);
    }
    const transcriptBody = await transcription.json().catch(() => ({}));
    const transcript = typeof transcriptBody.text === "string" ? transcriptBody.text.trim().slice(0, 1800) : "";
    if (!transcript) return json({ error: "empty_transcription" }, 422, allowedOrigin);

    let history: unknown[] = [];
    try {
      const raw = form.get("history");
      const parsed = typeof raw === "string" ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return json({ error: "invalid_history" }, 400, allowedOrigin);
      history = parsed.slice(-6).map(item => ({
        role: item?.role === "assistant" ? "assistant" : "user",
        content: typeof item?.content === "string" ? item.content.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 500) : ""
      })).filter(item => item.content);
    } catch {
      return json({ error: "invalid_history" }, 400, allowedOrigin);
    }
    const level = String(form.get("level") || "A1").slice(0, 8);
    const memory = form.get("useLearningMemory") === "true";

    let tutor: Response | null;
    try {
      tutor = await fetchImpl(supabaseUrl.replace(/\/$/, "") + "/functions/v1/tutor-v2", {
        method: "POST",
        headers: { apikey: anonKey, Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "practice", depth: "quick", level, text: transcript, history,
          useLearningMemory: memory, voiceProvider: "groq"
        }),
        signal: AbortSignal.timeout(35000)
      });
    } catch {
      return json({ error: "provider_unavailable", transcript, retryable: true }, 502, allowedOrigin);
    }
    const answer = await tutor.json().catch(() => ({}));
    if (!tutor.ok || typeof answer.text !== "string") {
      return json({ error: answer.error || "provider_unavailable", retryable: answer.retryable === true, transcript },
        tutor.status || 502, allowedOrigin);
    }
    return json({ transcript, text: answer.text, learningMemory: answer.learningMemory || null }, 200, allowedOrigin);
  };
}

if (import.meta.main) Deno.serve(createGroqVoiceHandler());
