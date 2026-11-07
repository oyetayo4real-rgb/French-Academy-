import { createTutorHandler, makeSystemPrompt, OVERALL_DEADLINE_MS } from "./index.ts";

const uid = "00000000-0000-4000-8000-000000000001";
const token = "eyJhbGciOiJub25lIn0." +
  btoa(JSON.stringify({ role: "authenticated", sub: uid })).replace(/=/g, "") +
  ".signature";
const request = (depth = "quick", extra: Record<string, unknown> = {}) => new Request("https://local.test/functions/v1/tutor-v2", {
  method: "POST",
  headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
  body: JSON.stringify({ mode: "chat", depth, text: "PRIVATE QUESTION TEXT", history: [{ role: "user", content: "PRIVATE HISTORY TEXT" }], research: true, ...extra })
});
const envValues: Record<string, string> = {
  SUPABASE_URL: "https://supabase.test",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
  GEMINI_API_KEY: "test-gemini",
  GROQ_API_KEY: "test-groq",
  MISTRAL_API_KEY: "test-mistral",
  OPENROUTER_API_KEY: "test-openrouter",
  QUOTA_MODE: "reservation"
};
const env = { get: (name: string) => envValues[name] };
const makeEnv = (values: Record<string, string | undefined>) => ({ get: (name: string) => values[name] });
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
const run = async (
  fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  calls: any[] = [],
  logs: string[] = [],
  testEnv: { get(name: string): string | undefined } = env,
  req: Request = request()
) => {
  const handler = createTutorHandler({
    env: testEnv,
    fetchImpl: fetchImpl as typeof fetch,
    log: (event, fields) => logs.push(JSON.stringify({ event, fields }))
  });
  return handler(req);
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
  assert(elapsed < 41_000, "quick-depth timeout exceeded the 40-second overall deadline plus one second");
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


Deno.test("every overall deadline is below the 110-second reservation-expiry ceiling", () => {
  const deadlines = Object.entries(OVERALL_DEADLINE_MS);
  assert(deadlines.length === 3, "expected quick, standard, and deep overall deadlines");
  for (const [depth, deadline] of deadlines) {
    assert(deadline < 110_000, `${depth} overall deadline must remain below 110 seconds; got ${deadline}`);
  }
  assert(OVERALL_DEADLINE_MS.quick === 40_000, "quick overall deadline changed unexpectedly");
  assert(OVERALL_DEADLINE_MS.standard === 60_000, "standard overall deadline changed unexpectedly");
  assert(OVERALL_DEADLINE_MS.deep === 100_000, "deep overall deadline changed unexpectedly");
});


Deno.test("T1c acceptance matrix collects all failures as JSON", async () => {
  const failures: Array<{ step: string; test: string; input: string; expected: string; actual: string }> = [];
  const check = async (test: string, input: string, expected: string, fn: () => Promise<void>) => {
    try { await fn(); }
    catch (error) {
      failures.push({
        step: "T1c mocked acceptance",
        test,
        input,
        expected,
        actual: error instanceof Error ? error.message : "unknown failure"
      });
    }
  };
  const base = {
    SUPABASE_URL: "https://supabase.test",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role"
  };

  await check("Groq 404 then success", "GROQ_MODELS=old-model,new-model", "second model succeeds and both attempts are logged", async () => {
    const values = { ...base, AI_PROVIDER: "groq", GROQ_API_KEY: "test-groq", GROQ_MODELS: "old-model,new-model", QUOTA_MODE: "legacy" };
    const calls: any[] = [], logs: string[] = [], seenModels: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/rpc/ai_use")) { calls.push("ai_use"); return ok(true); }
      if (url.includes("api.groq.com")) {
        const model = JSON.parse(String(init?.body || "{}")).model;
        seenModels.push(model);
        if (model === "old-model") return new Response(JSON.stringify({ error: { code: "model_not_found" } }), { status: 404 });
        return ok({ choices: [{ message: { content: "Groq success." } }] });
      }
      throw new Error("unexpected host");
    };
    const response = await run(fetchImpl, calls, logs, makeEnv(values));
    const body = await response.json();
    assert(response.status === 200 && body.text === "Groq success.", "fallback model did not succeed");
    assert(seenModels.join(",") === "old-model,new-model", "models were not attempted in configured order");
    const attempts = logs.map((line) => JSON.parse(line)).filter((line) => line.event === "provider_attempt");
    assert(attempts.length === 2, "each Groq model attempt must be logged");
    assert(attempts.every((line) => Object.keys(line.fields).sort().join(",") === "elapsed_ms,model,provider,status"), "attempt log contains fields beyond provider/model/status/elapsed_ms");
  });

  await check("Groq all 404", "GROQ_MODELS=missing-a,missing-b", "all models attempted then provider_unavailable", async () => {
    const values = { ...base, AI_PROVIDER: "groq", GROQ_API_KEY: "test-groq", GROQ_MODELS: "missing-a,missing-b", QUOTA_MODE: "legacy" };
    const seen: string[] = [], logs: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/rpc/ai_use")) return ok(true);
      if (url.includes("api.groq.com")) {
        seen.push(JSON.parse(String(init?.body || "{}")).model);
        return new Response(JSON.stringify({ error: { code: "model_not_found" } }), { status: 404 });
      }
      throw new Error("unexpected host");
    };
    const response = await run(fetchImpl, [], logs, makeEnv(values));
    const body = await response.json();
    assert(response.status === 502 && body.error === "provider_unavailable", "all-404 result was not provider_unavailable");
    assert(seen.join(",") === "missing-a,missing-b", "not all configured Groq models were attempted");
  });

  await check("provider-specific keys route only to their provider hosts", "one dedicated provider key at a time", "Gemini/Groq/Mistral/OpenRouter each receive only their own key at their own host", async () => {
    const cases = [
      { name: "gemini", key: "GEMINI_API_KEY", host: "generativelanguage.googleapis.com" },
      { name: "groq", key: "GROQ_API_KEY", host: "api.groq.com" },
      { name: "mistral", key: "MISTRAL_API_KEY", host: "api.mistral.ai" },
      { name: "openrouter", key: "OPENROUTER_API_KEY", host: "openrouter.ai" }
    ];
    for (const item of cases) {
      const values: Record<string, string | undefined> = { ...base, AI_PROVIDER: item.name, QUOTA_MODE: "legacy", [item.key]: "only-" + item.name };
      const seen: Array<{ host: string; authorization: string | null; googleKey: string | null }> = [];
      const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/rpc/ai_use")) return ok(true);
        if (url.includes("generativelanguage.googleapis.com") && url.includes("pageSize")) return geminiCatalog();
        if (url.includes("generativelanguage.googleapis.com") || url.includes("api.groq.com") || url.includes("api.mistral.ai") || url.includes("openrouter.ai")) {
          const parsed = new URL(url);
          const headers = new Headers(init?.headers);
          seen.push({ host: parsed.hostname, authorization: headers.get("Authorization"), googleKey: headers.get("x-goog-api-key") });
          if (item.name === "gemini" && url.includes(":generateContent")) return completion("Gemini routed.");
          if (url.includes("/chat/completions")) return ok({ choices: [{ message: { content: "Compatible provider routed." } }] });
          return ok({});
        }
        throw new Error("unexpected host");
      };
      const response = await run(fetchImpl, [], [], makeEnv(values));
      assert(response.status === 200, item.name + " request failed");
      assert(seen.length > 0 && seen.every((entry) => entry.host === item.host), item.name + " key reached an unexpected host");
      if (item.name === "gemini") assert(seen.every((entry) => entry.googleKey === "only-gemini"), "Gemini key was not sent only as x-goog-api-key");
      else assert(seen.every((entry) => entry.authorization === "Bearer only-" + item.name), item.name + " key was not sent as its provider bearer credential");
    }
  });

  await check("generic AI_API_KEY is restricted to AI_PROVIDER", "AI_PROVIDER=mistral with generic key; then AI_PROVIDER=gemini with Gemini failure", "generic key is used only on the selected provider host", async () => {
    const values = { ...base, AI_PROVIDER: "mistral", AI_API_KEY: "generic-only", QUOTA_MODE: "legacy" };
    const hosts: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/rpc/ai_use")) return ok(true);
      hosts.push(new URL(url).hostname);
      if (url.includes("api.mistral.ai")) return ok({ choices: [{ message: { content: "Selected provider only." } }] });
      throw new Error("generic key leaked to another provider");
    };
    const response = await run(fetchImpl, [], [], makeEnv(values));
    assert(response.status === 200 && hosts.every((host) => host === "api.mistral.ai"), "generic key was not restricted to AI_PROVIDER");

    const geminiHosts: string[] = [];
    const geminiValues = { ...base, AI_PROVIDER: "gemini", AI_API_KEY: "generic-gemini-only", QUOTA_MODE: "legacy" };
    const failedGemini = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/rpc/ai_use")) return ok(true);
      geminiHosts.push(new URL(url).hostname);
      if (url.includes("pageSize")) return geminiCatalog();
      if (url.includes("generativelanguage.googleapis.com")) return new Response("unavailable", { status: 503 });
      throw new Error("generic Gemini key reached another provider");
    };
    const failed = await run(failedGemini, [], [], makeEnv(geminiValues));
    assert(failed.status !== 200 && geminiHosts.every((host) => host === "generativelanguage.googleapis.com"), "generic Gemini key was sent to a fallback provider");
  });

  await check("legacy quota success has no settlement", "QUOTA_MODE omitted", "ai_use(p_uid) runs once before generation; no reserve or settle RPC", async () => {
    const values = { ...base, AI_PROVIDER: "groq", GROQ_API_KEY: "test-groq" };
    const rpcNames: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/rpc/")) { rpcNames.push(url.split("/").pop() || ""); return ok(true); }
      if (url.includes("api.groq.com")) return ok({ choices: [{ message: { content: "Legacy quota answer." } }] });
      throw new Error("unexpected host");
    };
    const response = await run(fetchImpl, [], [], makeEnv(values));
    assert(response.status === 200, "legacy quota request failed");
    assert(rpcNames.length === 1 && rpcNames[0] === "ai_use", "legacy mode called the wrong quota RPCs");
  });

  await check("legacy quota denial blocks provider", "ai_use returns false", "quota_exceeded with zero provider calls and no settle", async () => {
    const values = { ...base, AI_PROVIDER: "groq", GROQ_API_KEY: "test-groq" };
    let providerCalls = 0, settles = 0;
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/rpc/ai_use")) return ok(false);
      if (url.includes("/rpc/ai_use_settle")) settles++;
      providerCalls++;
      return ok({});
    };
    const response = await run(fetchImpl, [], [], makeEnv(values));
    const body = await response.json();
    assert(response.status === 429 && body.error === "quota_exceeded", "legacy denial response mismatch");
    assert(providerCalls === 0 && settles === 0, "provider or settle was called after legacy quota denial");
  });

  await check("authenticated health check is non-invasive", "health=true; AI_PROVIDER=groq; GROQ_MODELS set", "booleans, model names, QUOTA_MODE only; no provider or quota calls", async () => {
    const values = { ...base, AI_PROVIDER: "groq", AI_API_KEY: "generic-key", GROQ_MODELS: "groq/model-a,groq/model-b", QUOTA_MODE: "reservation" };
    let fetchCalls = 0;
    const handler = createTutorHandler({ env: makeEnv(values), fetchImpl: async () => { fetchCalls++; throw new Error("health invoked fetch"); } });
    const response = await handler(request("quick", { health: true }));
    const body = await response.json();
    assert(response.status === 200, "health check failed");
    assert(JSON.stringify(body.providerKeys) === JSON.stringify({ gemini: false, groq: true, mistral: false, openrouter: false }), "health provider-key booleans mismatch");
    assert(body.groqModels.join(",") === "groq/model-a,groq/model-b", "health returned wrong Groq model list");
    assert(body.quotaMode === "reservation", "health returned wrong quota mode");
    assert(fetchCalls === 0, "health check called quota or provider endpoint");
  });

  console.log("T1C_ACCEPTANCE_FAILURES_JSON " + JSON.stringify(failures));
  if (failures.length) throw new Error("T1c acceptance matrix failed: " + failures.length + " issue(s)");
});


Deno.test("system prompt enforces the requested formatting and uncertainty rules", () => {
  const failures: Array<{ step: string; test: string; input: string; expected: string; actual: string }> = [];
  const required = [
    "plain-text arrows such as ->",
    "do not use LaTeX or dollar-sign math",
    "Do not use horizontal rules",
    "maximum 4 columns",
    "one header row",
    "every table row on its own line",
    "Use short headings",
    "A1-A2 requests, stay under 250 words",
    `say "I'm not sure" instead of guessing`,
    "Never present an unsourced claim as established"
  ];
  for (const depth of ["quick", "deep"] as const) {
    const prompt = makeSystemPrompt("chat", "A1", depth);
    for (const phrase of required) {
      if (!prompt.includes(phrase)) {
        failures.push({
          step: "T1d tutor-v2 prompt",
          test: "formatting and uncertainty rules",
          input: "depth=" + depth + "; phrase=" + phrase,
          expected: "system prompt contains the exact required rule",
          actual: "required phrase missing"
        });
      }
    }
  }
  console.log("T1D_PROMPT_FAILURES_JSON " + JSON.stringify(failures));
  if (failures.length) throw new Error("Tutor prompt formatting acceptance failed: " + failures.length);
});
