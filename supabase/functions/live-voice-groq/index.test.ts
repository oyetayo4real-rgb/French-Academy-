import { createGroqVoiceHandler } from "./index.ts";

const origin = "https://french-academy-preview123-vogtay.vercel.app";
const envValues: Record<string, string> = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: "public-test-key",
  GROQ_API_KEY: "server-only-groq-key",
  GROQ_VOICE_ENABLED: "true",
  SUPABASE_SERVICE_ROLE_KEY: "server-only-service-role-key",
  ALLOWED_APP_ORIGINS: "https://academy.example"
};
const env = { get: (name: string) => envValues[name] };
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const makeRequest = (options: { originValue?: string; authorization?: string | null; audio?: boolean } = {}) => {
  const form = new FormData();
  if (options.audio !== false) form.append("audio", new File([new Uint8Array(2048)], "voice.webm", { type: "audio/webm" }));
  form.append("language", "auto");
  form.append("level", "A1");
  form.append("history", JSON.stringify([{ role: "user", content: "Bonjour" }]));
  form.append("useLearningMemory", "false");
  const headers = new Headers({ Origin: options.originValue || origin });
  if (options.authorization !== null) headers.set("Authorization", options.authorization || "Bearer valid-user-token");
  return new Request("https://edge.test/live-voice-groq", { method: "POST", headers, body: form });
};

Deno.test("Groq adapter denies untrusted origins and does not reflect them", async () => {
  let calls = 0;
  const handler = createGroqVoiceHandler({ env, fetchImpl: async () => { calls++; return new Response("{}", { status: 200 }); } });
  const response = await handler(makeRequest({ originValue: "https://evil.example" }));
  assert(response.status === 403, "untrusted origin must be rejected");
  assert(response.headers.get("Access-Control-Allow-Origin") === null, "untrusted origin must not receive CORS access");
  assert(calls === 0, "untrusted origin must not reach Supabase or Groq");
});

Deno.test("Groq adapter rejects missing and invalid user authentication before provider calls", async () => {
  let calls = 0;
  const handler = createGroqVoiceHandler({
    env,
    fetchImpl: async () => { calls++; return new Response("unauthorized", { status: 401 }); }
  });
  const missing = await handler(makeRequest({ authorization: null }));
  const invalid = await handler(makeRequest());
  assert(missing.status === 401, "missing bearer token must return 401");
  assert(invalid.status === 401, "invalid Supabase user token must return 401");
  assert(calls === 1, "only the supplied invalid token should reach Supabase Auth");
});

Deno.test("Groq adapter remains disabled unless the explicit voice opt-in is true", async () => {
  const disabledEnv = { get: (name: string) => name === "GROQ_VOICE_ENABLED" ? "false" : envValues[name] };
  let calls = 0;
  const handler = createGroqVoiceHandler({ env: disabledEnv, fetchImpl: async () => { calls++; return new Response("{}", { status: 200 }); } });
  const response = await handler(makeRequest());
  const body = await response.json();
  assert(response.status === 503 && body.error === "groq_voice_disabled", "disabled fallback must return 503");
  assert(calls === 0, "disabled fallback must not call external services");
});

Deno.test("Groq adapter transcribes audio and forces the Tutor V2 Groq provider", async () => {
  const calls: Array<{ url: string; body?: string }> = [];
  const handler = createGroqVoiceHandler({
    env,
    fetchImpl: async (input, init) => {
      const url = String(input);
      calls.push({ url, body: typeof init?.body === "string" ? init.body : undefined });
      if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-123" }), { status: 200 });
      if (url.endsWith("/rpc/ai_use_voice_preflight")) {
        assert(JSON.parse(String(init?.body || "{}")).p_uid === "user-123", "quota preflight must use the authenticated user id");
        assert(new Headers(init?.headers).get("Authorization") === "Bearer server-only-service-role-key", "quota preflight must use server-side service credentials");
        return new Response("true", { status: 200 });
      }
      if (url.includes("/audio/transcriptions")) return new Response(JSON.stringify({ text: "Bonjour, je m'appelle Tayo." }), { status: 200 });
      if (url.endsWith("/functions/v1/tutor-v2")) {
        const payload = JSON.parse(String(init?.body || "{}"));
        assert(payload.voiceProvider === "groq", "fallback request must explicitly select Groq");
        assert(payload.text === "Bonjour, je m'appelle Tayo.", "transcript must reach Tutor V2");
        assert(payload.useLearningMemory === false, "disabled learner memory must remain disabled");
        return new Response(JSON.stringify({ text: "Enchanté ! Comment allez-vous ?" }), { status: 200 });
      }
      throw new Error("Unexpected URL: " + url);
    }
  });
  const response = await handler(makeRequest());
  const body = await response.json();
  assert(response.status === 200, "successful Groq fallback should return 200");
  assert(body.transcript === "Bonjour, je m'appelle Tayo.", "transcript missing from response");
  assert(body.text === "Enchanté ! Comment allez-vous ?", "Tutor response missing");
  assert(response.headers.get("Access-Control-Allow-Origin") === origin, "response must echo allowed origin only");
  assert(calls.length === 4, "expected auth, quota preflight, transcription, and Tutor calls");
  assert(!JSON.stringify(body).includes("server-only-groq-key"), "Groq API key leaked to browser");
});

Deno.test("Groq quota exhaustion is rejected before any paid transcription call", async () => {
  let transcriptionCalls = 0;
  const handler = createGroqVoiceHandler({
    env,
    fetchImpl: async input => {
      const url = String(input);
      if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-123" }), { status: 200 });
      if (url.endsWith("/rpc/ai_use_voice_preflight")) return new Response("false", { status: 200 });
      if (url.includes("/audio/transcriptions")) transcriptionCalls++;
      throw new Error("Unexpected URL: " + url);
    }
  });
  const response = await handler(makeRequest());
  const body = await response.json();
  assert(response.status === 429 && body.error === "quota_exceeded", "quota exhaustion must return 429");
  assert(transcriptionCalls === 0, "Groq must not receive audio when quota is exhausted");
});

Deno.test("Groq rate limits are surfaced without attempting a Tutor generation", async () => {
  let tutorCalls = 0;
  const handler = createGroqVoiceHandler({
    env,
    fetchImpl: async input => {
      const url = String(input);
      if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-123" }), { status: 200 });
      if (url.endsWith("/rpc/ai_use_voice_preflight")) return new Response("true", { status: 200 });
      if (url.includes("/audio/transcriptions")) return new Response("rate limited", { status: 429 });
      if (url.endsWith("/functions/v1/tutor-v2")) tutorCalls++;
      throw new Error("Unexpected URL: " + url);
    }
  });
  const response = await handler(makeRequest());
  const body = await response.json();
  assert(response.status === 429 && body.error === "provider_rate_limit", "Groq 429 must be preserved");
  assert(tutorCalls === 0, "Tutor must not run when transcription is rate limited");
});
