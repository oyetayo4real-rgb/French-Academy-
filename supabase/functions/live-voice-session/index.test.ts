import { createLiveVoiceSessionHandler } from "./index.ts";

const origin = "https://french-academy-preview123-vogtay.vercel.app";
const envValues: Record<string, string> = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: "public-test-key",
  GEMINI_API_KEY: "server-only-test-key",
  ALLOWED_APP_ORIGINS: "https://academy.example"
};
const env = { get: (name: string) => envValues[name] };
const validAuth = async () => new Response(JSON.stringify({ id: "user-123" }), { status: 200 });
const request = (options: { method?: string; originValue?: string | null; authorization?: string | null; body?: unknown } = {}) => {
  const headers = new Headers();
  if (options.originValue !== null) headers.set("Origin", options.originValue ?? origin);
  if (options.authorization !== null) headers.set("Authorization", options.authorization ?? "Bearer valid-user-token");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  return new Request("https://edge.test/live-voice-session", {
    method: options.method || "POST",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
};
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};

Deno.test("session broker rejects origins outside the exact allowlist and preview hostname policy", async () => {
  const handler = createLiveVoiceSessionHandler({ env, fetchImpl: validAuth });
  const response = await handler(request({ originValue: "https://evil.example" }));
  assert(response.status === 403, "untrusted origin must be rejected");
  assert(response.headers.get("Access-Control-Allow-Origin") === null, "untrusted origin must not receive CORS access");
});

Deno.test("session broker accepts configured origins and preflight without issuing tokens", async () => {
  let tokenCalls = 0;
  const handler = createLiveVoiceSessionHandler({
    env,
    fetchImpl: validAuth,
    createToken: async () => { tokenCalls++; return { name: "auth_tokens/test" }; }
  });
  const response = await handler(request({ method: "OPTIONS", originValue: "https://academy.example" }));
  assert(response.status === 204, "allowed preflight must return 204");
  assert(response.headers.get("Access-Control-Allow-Origin") === "https://academy.example", "preflight must echo the allowed origin");
  assert(tokenCalls === 0, "preflight must never mint a token");
});

Deno.test("session broker rejects missing and invalid bearer credentials before token issuance", async () => {
  let tokenCalls = 0;
  const handler = createLiveVoiceSessionHandler({
    env,
    fetchImpl: async () => new Response("unauthorized", { status: 401 }),
    createToken: async () => { tokenCalls++; return { name: "auth_tokens/test" }; }
  });
  const missing = await handler(request({ authorization: null }));
  const invalid = await handler(request());
  assert(missing.status === 401, "missing bearer token must return 401");
  assert(invalid.status === 401, "Supabase-invalid bearer token must return 401");
  assert(tokenCalls === 0, "unauthenticated requests must not call Gemini");
});

Deno.test("session broker enforces one-use token and 60-second start / 30-minute expiry", async () => {
  let captured: Record<string, unknown> | null = null;
  const issuedAt = Date.parse("2026-11-22T20:00:00.000Z");
  const handler = createLiveVoiceSessionHandler({
    env,
    now: () => issuedAt,
    fetchImpl: validAuth,
    createToken: async (_key, config) => {
      captured = config;
      return { name: "auth_tokens/one-use", expireTime: "2026-11-22T20:30:00.000Z" };
    }
  });
  const response = await handler(request({ body: { level: "B1", mode: "guided", recent: [{ role: "user", content: "Bonjour" }] } }));
  const body = await response.json();
  assert(response.status === 200, "valid authenticated request must mint a session token");
  assert(body.ephemeral_token === "auth_tokens/one-use", "ephemeral token missing");
  assert(!JSON.stringify(body).includes("server-only-test-key"), "permanent Gemini key leaked to browser");
  assert((captured as any)?.uses === 1, "token must be single-use");
  assert((captured as any)?.expireTime === "2026-11-22T20:30:00.000Z", "token expiry must be 30 minutes");
  assert((captured as any)?.newSessionExpireTime === "2026-11-22T20:01:00.000Z", "session must start within 60 seconds");
  assert((captured as any)?.liveConnectConstraints?.model === "gemini-3.8-live", "unexpected Live model");
});

Deno.test("session broker fails closed when Supabase auth is unreachable", async () => {
  const handler = createLiveVoiceSessionHandler({
    env,
    fetchImpl: async () => { throw new Error("network unavailable"); },
    createToken: async () => { throw new Error("must not be called"); }
  });
  const response = await handler(request({ body: {} }));
  const body = await response.json();
  assert(response.status === 503 && body.error === "auth_service_unavailable", "auth outage must fail closed with 503");
});

Deno.test("session broker bounds request size and handles malformed JSON", async () => {
  const handler = createLiveVoiceSessionHandler({ env, fetchImpl: validAuth, createToken: async () => ({ name: "auth_tokens/test" }) });
  const malformed = new Request("https://edge.test/live-voice-session", {
    method: "POST",
    headers: { Origin: origin, Authorization: "Bearer valid-user-token", "Content-Type": "application/json" },
    body: "{"
  });
  const tooLarge = new Request("https://edge.test/live-voice-session", {
    method: "POST",
    headers: { Origin: origin, Authorization: "Bearer valid-user-token", "Content-Type": "application/json" },
    body: JSON.stringify({ payload: "x".repeat(17_000) })
  });
  assert((await handler(malformed)).status === 400, "malformed JSON must return 400");
  assert((await handler(tooLarge)).status === 413, "oversized body must return 413");
});
