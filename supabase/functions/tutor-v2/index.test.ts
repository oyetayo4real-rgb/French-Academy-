import { createTutorHandler } from "./index.ts";

const uid = "00000000-0000-4000-8000-000000000001";
const token = "eyJhbGciOiJub25lIn0." +
  btoa(JSON.stringify({ role: "authenticated", sub: uid })).replace(/=/g, "") +
  ".signature";
const request = (depth = "quick") => new Request("https://local.test/functions/v1/tutor-v2", {
  method: "POST",
  headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
  body: JSON.stringify({ mode: "chat", depth, text: "PRIVATE QUESTION TEXT", history: [{ role: "user", content: "PRIVATE HISTORY TEXT" }], research: true })
});
const envValues: Record<string, string> = {
  SUPABASE_URL: "https://supabase.test",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  GEMINI_API_KEY: "test-gemini",
  GROQ_API_KEY: "test-groq",
  MISTRAL_API_KEY: "test-mistral",
  OPENROUTER_API_KEY: "test-openrouter"
};
const env = { get: (name: string) => envValues[name] };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const geminiCatalog = () => ok({ models: [
  { name: "models/gemini-3.5-flash-lite", supportedGenerationMethods: ["generateContent"] },
  { name: "models/gemini-3.1-flash-lite", supportedGenerationMethods: ["generateContent"] }
] });
const reservationOk = () => ok({ allowed: true });
const settlementOk = () => ok({ settled: true, status: "succeeded" });
const completion = (text: string) => ok({ candidates: [{ content: { parts: [{ text }] } }] });
const rpcCalls = (calls: Array<{ name: string; body: any }>) => async (url: string, init?: RequestInit) => {
  if (url.includes("/rpc/ai_use_reserve")) {
    calls.push({ name: "reserve", body: JSON.parse(String(init?.body || "{}")) });
    return reservationOk();
  }
  if (url.includes("/rpc/ai_use_settle")) {
    calls.push({ name: "settle", body: JSON.parse(String(init?.body || "{}")) });
    return settlementOk();
  }
  throw new Error("Unexpected mocked URL");
};
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const run = async (fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>, calls: any[] = [], logs: string[] = []) => {
  const handler = createTutorHandler({
    env,
    fetchImpl: fetchImpl as typeof fetch,
    log: (event, fields) => logs.push(JSON.stringify({ event, fields }))
  });
  return handler(request());
};

Deno.test("first Gemini candidate timeout advances to second candidate", async () => {
  const calls: any[] = [];
  let geminiAttempts = 0;
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/")) return rpcCalls(calls)(url, init);
    if (url === "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000") return geminiCatalog();
    if (url.includes(":generateContent")) {
      geminiAttempts++;
      if (geminiAttempts === 1) throw new DOMException("timeout", "TimeoutError");
      return completion("Second Gemini model answered.");
    }
    throw new Error("Unexpected fetch");
  };
  const response = await run(fetchImpl, calls);
  const body = await response.json();
  assert(response.status === 200 && body.text === "Second Gemini model answered.", "second Gemini candidate did not succeed");
  assert(geminiAttempts === 2, "candidate loop stopped after first timeout");
  assert(calls.filter((x) => x.name === "settle").length === 1 && calls.find((x) => x.name === "settle").body.p_success === true, "success was not settled true exactly once");
});

Deno.test("both Gemini candidates timeout then Groq succeeds", async () => {
  const calls: any[] = [];
  let geminiAttempts = 0;
  let groqAttempts = 0;
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/")) return rpcCalls(calls)(url, init);
    if (url === "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000") return geminiCatalog();
    if (url.includes(":generateContent")) {
      geminiAttempts++;
      throw new DOMException("timeout", "TimeoutError");
    }
    if (url.includes("api.groq.com")) {
      groqAttempts++;
      return ok({ choices: [{ message: { content: "Groq backup answered." } }] });
    }
    throw new Error("Unexpected fetch");
  };
  const response = await run(fetchImpl, calls);
  const body = await response.json();
  assert(response.status === 200 && body.text === "Groq backup answered.", "alternate provider did not answer");
  assert(geminiAttempts === 2 && groqAttempts === 1, "fallback order or Gemini candidate loop is wrong");
});

Deno.test("429 returns provider_rate_limit without trying another provider", async () => {
  const calls: any[] = [];
  let providerCalls = 0;
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/")) return rpcCalls(calls)(url, init);
    if (url === "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000") return geminiCatalog();
    if (url.includes(":generateContent")) {
      providerCalls++;
      return new Response(JSON.stringify({ error: "rate limited" }), { status: 429 });
    }
    if (url.includes("api.groq.com")) providerCalls++;
    throw new Error("Unexpected fetch");
  };
  const response = await run(fetchImpl, calls);
  const body = await response.json();
  assert(response.status === 429 && body.error === "provider_rate_limit", "429 was not classified separately");
  assert(providerCalls === 1, "429 incorrectly entered a provider retry loop");
  assert(calls.some((x) => x.name === "settle" && x.body.p_success === false), "429 did not settle failure");
});

Deno.test("all provider timeouts return provider_timeout within the deadline plus one second", async () => {
  const calls: any[] = [];
  const started = performance.now();
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/")) return rpcCalls(calls)(url, init);
    if (url === "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000") return geminiCatalog();
    if (url.includes(":generateContent") || url.includes("/chat/completions")) {
      throw new DOMException("timeout", "TimeoutError");
    }
    throw new Error("Unexpected fetch");
  };
  const response = await run(fetchImpl, calls);
  const elapsed = performance.now() - started;
  const body = await response.json();
  assert(response.status === 504 && body.error === "provider_timeout", "all-timeout result was not provider_timeout");
  assert(elapsed < 52_000, "quick-depth timeout exceeded the 51-second overall deadline plus one second");
  assert(calls.some((x) => x.name === "settle" && x.body.p_success === false), "all-timeout path did not settle false");
});

Deno.test("failure settles false and successful non-empty answer settles true only", async () => {
  const failureCalls: any[] = [];
  const failedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/")) return rpcCalls(failureCalls)(url, init);
    if (url === "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000") return geminiCatalog();
    if (url.includes(":generateContent") || url.includes("/chat/completions")) {
      return new Response("unavailable", { status: 503 });
    }
    throw new Error("Unexpected fetch");
  };
  const failed = await run(failedFetch, failureCalls);
  assert(failed.status !== 200, "failed generation unexpectedly succeeded");
  assert(failureCalls.filter((x) => x.name === "settle").every((x) => x.body.p_success === false), "failure path settled success");

  const successCalls: any[] = [];
  const successFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/")) return rpcCalls(successCalls)(url, init);
    if (url === "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000") return geminiCatalog();
    if (url.includes(":generateContent")) return completion("A real answer.");
    throw new Error("Unexpected fetch");
  };
  const succeeded = await run(successFetch, successCalls);
  assert(succeeded.status === 200, "non-empty answer did not succeed");
  const settlements = successCalls.filter((x) => x.name === "settle");
  assert(settlements.length === 1 && settlements[0].body.p_success === true, "success was not settled true exactly once");
});

Deno.test("reservation denial returns quota_exceeded without calling a provider", async () => {
  const calls: any[] = [];
  let providerCalls = 0;
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/ai_use_reserve")) {
      calls.push({ name: "reserve", body: JSON.parse(String(init?.body || "{}")) });
      return ok({ allowed: false, reason: "too_many_failures" });
    }
    if (url.includes("/rpc/ai_use_settle")) calls.push({ name: "settle", body: JSON.parse(String(init?.body || "{}")) });
    else providerCalls++;
    return ok({});
  };
  const response = await run(fetchImpl, calls);
  const body = await response.json();
  assert(response.status === 429 && body.error === "quota_exceeded", "denial was not returned as quota_exceeded");
  assert(providerCalls === 0, "provider was called after reservation denial");
  assert(!calls.some((x) => x.name === "settle"), "denied reservation was incorrectly settled");
});

Deno.test("question, history, and answer content never appear in logs", async () => {
  const calls: any[] = [];
  const logs: string[] = [];
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/rpc/")) return rpcCalls(calls)(url, init);
    if (url === "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000") return geminiCatalog();
    if (url.includes(":generateContent")) return completion("PRIVATE ANSWER TEXT");
    throw new Error("Unexpected fetch");
  };
  await run(fetchImpl, calls, logs);
  const joined = logs.join("\n");
  assert(!joined.includes("PRIVATE QUESTION TEXT"), "question leaked into logs");
  assert(!joined.includes("PRIVATE HISTORY TEXT"), "history leaked into logs");
  assert(!joined.includes("PRIVATE ANSWER TEXT"), "answer leaked into logs");
});
