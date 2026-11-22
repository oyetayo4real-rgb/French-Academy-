type Env = { get(name: string): string | undefined };
type TokenResult = { name?: string; expireTime?: string };
type SessionDependencies = {
  env?: Env;
  fetchImpl?: typeof fetch;
  now?: () => number;
  createToken?: (apiKey: string, config: Record<string, unknown>) => Promise<TokenResult>;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "600",
  "Vary": "Origin"
};
const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

export function isAllowedVoiceOrigin(origin: string, env: Env): boolean {
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

export function createLiveVoiceSessionHandler(overrides: SessionDependencies = {}) {
  const env = overrides.env || Deno.env;
  const fetchImpl = overrides.fetchImpl || fetch;
  const now = overrides.now || Date.now;
  const createToken = overrides.createToken || (async (apiKey: string, config: Record<string, unknown>) => {
    const { GoogleGenAI } = await import("npm:@google/genai@2.32.0");
    const genai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
    return await genai.authTokens.create({ config: config as never }) as TokenResult;
  });

  return async (req: Request): Promise<Response> => {
    const requestOrigin = req.headers.get("Origin");
    const allowedOrigin = requestOrigin && isAllowedVoiceOrigin(requestOrigin, env) ? requestOrigin : null;

    if (req.method === "OPTIONS") {
      return allowedOrigin
        ? new Response(null, { status: 204, headers: { ...CORS_HEADERS, "Access-Control-Allow-Origin": allowedOrigin } })
        : new Response(null, { status: 403, headers: CORS_HEADERS });
    }
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, allowedOrigin);
    if (!allowedOrigin) return json({ error: "origin_not_allowed" }, 403, null);

    const authorization = req.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+$/i.test(authorization)) return json({ error: "not_signed_in" }, 401, allowedOrigin);

    const supabaseUrl = env.get("SUPABASE_URL");
    const anonKey = env.get("SUPABASE_ANON_KEY");
    const geminiKey = env.get("GEMINI_API_KEY");
    if (!supabaseUrl || !anonKey || !geminiKey) return json({ error: "voice_service_not_configured" }, 503, allowedOrigin);

    let auth: Response;
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

    const declaredLength = Number(req.headers.get("Content-Length") || 0);
    if (declaredLength > 16_384) return json({ error: "request_too_large" }, 413, allowedOrigin);
    let input: Record<string, unknown>;
    try {
      const raw = await req.text();
      if (new TextEncoder().encode(raw).byteLength > 16_384) return json({ error: "request_too_large" }, 413, allowedOrigin);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid_request" }, 400, allowedOrigin);
      input = parsed as Record<string, unknown>;
    } catch {
      return json({ error: "invalid_request" }, 400, allowedOrigin);
    }

    const level = ["none", "A1", "A2", "B1", "B2", "C1", "C2"].includes(String(input.level)) ? String(input.level) : "A1";
    const mode = input.mode === "conversation" ? "conversation" : "guided";
    const support = input.language === "fr" ? "French" : "English";
    const topics = Array.isArray(input.topics) ? input.topics.slice(0, 12).map(x => clean(x, 48)).filter(Boolean) : [];
    const recent = Array.isArray(input.recent)
      ? input.recent.slice(-6).map(x => ({
          role: x?.role === "assistant" ? "Tutor" : "Learner",
          text: clean(x?.content, 500)
        })).filter(x => x.text)
      : [];
    const instructions = [
      "You are Académie AI Live, the spoken French teacher inside Académie. You are one integrated part of the existing French Academy learning system, not a separate generic chatbot.",
      level === "none" ? "Learner level: absolute beginner (pre-A1). Assume no prior French knowledge." : "Learner guidance level: " + level + ". Do not assume mastery from a CEFR label.",
      "Learner explanation language: " + support + ". Teach French progressively. Explain unfamiliar vocabulary in " + support + ".",
      mode === "guided" ? "Teaching mode: guided lesson. Teach one small concept, model it, invite one response, then give supportive correction. Never test a concept before teaching it." : "Teaching mode: natural conversation. Keep the dialogue realistic and adapt to learner ability; briefly explain useful corrections.",
      topics.length ? "Previously recorded practice topics (activity, not proof of mastery): " + topics.join(", ") + "." : "No verified topic history was supplied. Do not invent prior lessons.",
      recent.length ? "Recent Tutor context for continuity (not a mastery record): " + recent.map(x => x.role + ": " + x.text).join(" | ") : "No recent text-Tutor turns were supplied.",
      "Use concise natural speech, one question at a time, and leave space for the learner. Correct one or two high-value mistakes at a time.",
      "Never claim to remember anything beyond the profile and recent context explicitly provided here. Do not claim phonetic or accent scoring from audio unless an explicit assessment is available.",
      "Keep the learner's spoken practice coherent with Académie's dictionary, grammar and conjugation knowledge. If a precise rule is uncertain, say so instead of inventing it."
    ].join("\n");

    const issuedAt = now();
    const requestedExpiry = new Date(issuedAt + 30 * 60 * 1000).toISOString();
    const newSessionExpiry = new Date(issuedAt + 60 * 1000).toISOString();
    try {
      const token = await createToken(geminiKey, {
        uses: 1,
        expireTime: requestedExpiry,
        newSessionExpireTime: newSessionExpiry,
        liveConnectConstraints: {
          model: "models/gemini-3.8-live",
          config: {
            responseModalities: ["AUDIO"],
            sessionResumption: {},
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: { parts: [{ text: instructions }] }
          }
        }
      });
      if (typeof token.name !== "string" || !token.name.startsWith("auth_tokens/")) {
        return json({ error: "voice_session_unavailable" }, 502, allowedOrigin);
      }
      return json({
        ephemeral_token: token.name,
        expires_at: token.expireTime || requestedExpiry,
        model: "models/gemini-3.8-live",
        instructions
      }, 200, allowedOrigin);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[live-voice] Gemini SDK token creation failed", { message: clean(message, 500) });
      return json({ error: "voice_session_unavailable" }, 502, allowedOrigin);
    }
  };
}

if (import.meta.main) Deno.serve(createLiveVoiceSessionHandler());
