// T1 Tutor v2: isolated, quota-reserved AI generation endpoint.
// Supabase gateway JWT verification is enabled in supabase/config.toml.
// Never log prompts, conversation history, provider payloads, or generated answers.

type Role = "user" | "assistant";
type ChatMessage = { role: Role; content: string };
type ProviderName = "gemini" | "groq" | "mistral" | "openrouter";
type Depth = "quick" | "standard" | "deep";
type QuotaMode = "legacy" | "reservation";
type Env = { get(name: string): string | undefined };
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const GEMINI_CATALOG_URL = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000";
const GEMINI_PREFERRED = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.0-flash",
  "gemini-2.5-flash"
];
const GEMINI_CATALOG_TTL_MS = 10 * 60 * 1000;
const GEMINI_MAX_CANDIDATES = 2;
const ATTEMPT_BUDGET_MS: Record<Depth, number> = {
  quick: 10_000,
  standard: 15_000,
  deep: 25_000
};
// Two Gemini model attempts plus three alternate-provider attempts, and a
// one-second control-plane margin. Each individual attempt remains capped above.
export const OVERALL_DEADLINE_MS: Record<Depth, number> = {
  quick: 40_000,
  standard: 60_000,
  deep: 100_000
};
const MAX_TOKENS: Record<Depth, number> = {
  quick: 1_200,
  standard: 2_400,
  deep: 4_800
};
const PROVIDERS: Array<{
  name: ProviderName;
  key: string;
  model: string;
  base?: string;
}> = [
  { name: "gemini", key: "GEMINI_API_KEY", model: "gemini-3.5-flash-lite" },
  { name: "groq", key: "GROQ_API_KEY", model: "openai/gpt-oss-120b", base: "https://api.groq.com/openai/v1" },
  { name: "mistral", key: "MISTRAL_API_KEY", model: "mistral-small-latest", base: "https://api.mistral.ai/v1" },
  { name: "openrouter", key: "OPENROUTER_API_KEY", model: "meta-llama/llama-3.3-70b-instruct:free", base: "https://openrouter.ai/api/v1" }
];

type FaultCode =
  | "not_signed_in"
  | "invalid_request"
  | "quota_exceeded"
  | "provider_timeout"
  | "provider_rate_limit"
  | "provider_unavailable"
  | "quota_unavailable";

class TutorFault extends Error {
  constructor(
    readonly code: FaultCode,
    readonly retryable: boolean,
    readonly status: number
  ) {
    super(code);
    this.name = "TutorFault";
  }
}

type Dependencies = {
  env?: Env;
  fetchImpl?: Fetcher;
  now?: () => number;
  log?: (event: string, fields?: Record<string, string | number | boolean>) => void;
};
type CatalogEntry = { expiresAt: number; models: string[] };
const catalogCache = new Map<string, CatalogEntry>();

const defaultEnv: Env = { get: (name) => Deno.env.get(name) };
const defaultLog = (event: string, fields: Record<string, string | number | boolean> = {}) => {
  // Only structured operational metadata is allowed here; no content or secrets.
  console.info("[tutor-v2]", JSON.stringify({ event, ...fields }));
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });

function authenticatedUid(req: Request): string | null {
  try {
    const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const payload = bearer.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    return claims.role === "authenticated" && typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

function clip(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

function parseDepth(value: unknown): Depth {
  return value === "deep" || value === "standard" ? value : "quick";
}

function normalizeHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-12).flatMap((item): ChatMessage[] => {
    if (!item || (item.role !== "user" && item.role !== "assistant")) return [];
    const content = clip(item.content, 3_000).trim();
    return content ? [{ role: item.role, content }] : [];
  });
}

export function makeSystemPrompt(mode: string, level: string, depth: Depth): string {
  const learner = level && level !== "none" ? "Optional learner level: " + level + "." : "";
  const formatRules = [
    "Identity and opening: Never present yourself as the Académie française, and never imply endorsement or affiliation with it. Do not open with a welcome or greeting. Start with the answer.",
    "Cross-language claims: Do not make claims comparing French with other languages, or about learner errors caused by other languages, unless certain. Never invent examples in other languages.",
    "Register and labels: Do not label usage as slang, verlan, regional or literary unless certain; when unsure use \"familier\" or say \"I'm not sure\". Verlan means syllable inversion and must not be used loosely.",
    "Sentence-only input: If the user sends only a French sentence without an instruction, answer with: a one-line translation, the tense, a short breakdown (at most 5 bullets), one common mistake, and end with \"Ask me for more depth if you want it.\" Under 250 words.",
    "Formatting rules: use plain-text arrows such as ->; do not use LaTeX or dollar-sign math. No LaTeX or dollar-sign maths.",
    "Do not use horizontal rules (--- or ***). No horizontal rules.",
    "Use tables only when a comparison needs them; maximum 4 columns, one header row, and every table row on its own line.",
    "Use short headings.",
    "Keep answer length proportional to the question; for short questions or A1-A2 requests, stay under 250 words unless the user asks for depth.",
    "If unsure about regional variation or usage claims, say \"I'm not sure\" instead of guessing.",
    "Never present an unsourced claim as established."
  ].join(" ");
  if (depth === "quick") {
    return [
      "You are a precise French-language tutor.",
      "Answer the user's question directly and clearly. Prioritize the core explanation, one useful example, and a concise correction where relevant.",
      "Do not invent sources or claim certainty when uncertain.",
      formatRules,
      learner,
      "Requested task: " + mode + "."
    ].filter(Boolean).join(" ");
  }
  return [
    "You are an expert French-language tutor and linguistics educator.",
    "Give a rigorous, structured answer with definitions, reasoning, examples, exceptions, and relevant contrasts.",
    "Distinguish established facts from interpretation and uncertainty. Never invent citations or sources.",
    formatRules,
    learner,
    "Requested task: " + mode + "."
  ].filter(Boolean).join(" ");
}

function configuredProviderName(env: Env): ProviderName | null {
  const raw = (env.get("AI_PROVIDER") || "gemini").trim().toLowerCase();
  const name = raw === "auto" ? "gemini" : raw;
  return PROVIDERS.some((item) => item.name === name) ? name as ProviderName : null;
}

function getQuotaMode(env: Env): QuotaMode {
  return env.get("QUOTA_MODE")?.trim().toLowerCase() === "reservation"
    ? "reservation" : "legacy";
}

function getGroqModels(env: Env): string[] {
  const configured = (env.get("GROQ_MODELS") || "")
    .split(",")
    .map((model) => model.trim())
    .filter((model) => /^[A-Za-z0-9._:/-]{1,160}$/.test(model));
  return [...new Set(configured.length ? configured : ["openai/gpt-oss-120b"])];
}

function getConfiguredProvider(name: ProviderName, env: Env) {
  const spec = PROVIDERS.find((item) => item.name === name)!;
  const dedicatedKey = env.get(spec.key);
  // AI_API_KEY belongs only to AI_PROVIDER; never reuse it for a fallback host.
  const genericKey = configuredProviderName(env) === name ? env.get("AI_API_KEY") : undefined;
  const key = dedicatedKey || genericKey;
  if (!key) return null;
  const modelEnv = name.toUpperCase() + "_MODEL";
  const model = name === "groq" ? getGroqModels(env)[0] : env.get(modelEnv) || spec.model;
  return { ...spec, key, model };
}

function logProviderAttempt(
  log: Dependencies["log"],
  provider: ProviderName,
  model: string,
  status: number | "timeout",
  startedAt: number,
  now: () => number
) {
  log?.("provider_attempt", {
    provider,
    model,
    status,
    elapsed_ms: Math.max(0, now() - startedAt)
  });
}

function parseProviderTimeout(error: unknown): boolean {
  return error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError" || error.name === "ProviderTimeout");
}

async function geminiModels(
  key: string,
  fetchImpl: Fetcher,
  now: () => number,
  log: Dependencies["log"]
): Promise<string[]> {
  const cached = catalogCache.get(key);
  if (cached && cached.expiresAt > now()) return cached.models;

  let discovered: string[] = [];
  try {
    const response = await fetchImpl(GEMINI_CATALOG_URL, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(800)
    });
    if (response.ok) {
      const body = await response.json();
      const available = (Array.isArray(body?.models) ? body.models : [])
        .filter((item: any) =>
          Array.isArray(item.supportedGenerationMethods) &&
          item.supportedGenerationMethods.includes("generateContent")
        )
        .map((item: any) => String(item.name || "").replace(/^models\//, ""))
        .filter((name: string) =>
          /^gemini-/i.test(name) &&
          !/(embedding|aqa|robotics|tts|image|audio|live|computer-use)/i.test(name)
        );
      discovered = [
        ...GEMINI_PREFERRED.filter((model) => available.includes(model)),
        ...available.filter((model: string) => /flash/i.test(model)),
        ...available
      ];
    } else {
      log?.("gemini_catalog_unavailable", { status: response.status });
    }
  } catch (error) {
    log?.("gemini_catalog_unavailable", { timeout: parseProviderTimeout(error) });
  }

  const models = [...new Set([...discovered, ...GEMINI_PREFERRED])].slice(0, 12);
  catalogCache.set(key, { expiresAt: now() + GEMINI_CATALOG_TTL_MS, models });
  return models;
}

async function callGemini(
  config: NonNullable<ReturnType<typeof getConfiguredProvider>>,
  system: string,
  messages: ChatMessage[],
  depth: Depth,
  deadline: number,
  deps: Required<Pick<Dependencies, "fetchImpl" | "now" | "log">>
): Promise<{ text: string; timedOut: boolean }> {
  const candidates = (await geminiModels(config.key, deps.fetchImpl, deps.now, deps.log))
    .slice(0, GEMINI_MAX_CANDIDATES);
  let timedOut = false;

  for (const model of candidates) {
    const remaining = deadline - deps.now();
    if (remaining <= 0) break;
    const attemptStarted = deps.now();
    try {
      const response = await deps.fetchImpl(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(model) + ":generateContent",
        {
          method: "POST",
          headers: { "x-goog-api-key": config.key, "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }]
            })),
            generationConfig: {
              maxOutputTokens: MAX_TOKENS[depth],
              thinkingConfig: { thinkingLevel: depth === "deep" ? "medium" : "low" }
            }
          }),
          signal: AbortSignal.timeout(Math.min(ATTEMPT_BUDGET_MS[depth], remaining))
        }
      );
      logProviderAttempt(deps.log, "gemini", model, response.status, attemptStarted, deps.now);

      if (response.status === 429) throw new TutorFault("provider_rate_limit", true, 429);
      if (!response.ok) {
        if (response.status >= 500 || response.status === 408) continue;
        throw new TutorFault("provider_unavailable", false, 502);
      }

      const body = await response.json();
      if (body?.candidates?.[0]?.finishReason === "SAFETY") {
        throw new TutorFault("provider_unavailable", false, 502);
      }
      const text = (Array.isArray(body?.candidates?.[0]?.content?.parts)
        ? body.candidates[0].content.parts : [])
        .map((part: any) => typeof part?.text === "string" ? part.text : "")
        .join("").trim();
      if (text) return { text, timedOut };
      deps.log("provider_empty_response", { provider: "gemini" });
    } catch (error) {
      if (error instanceof TutorFault) throw error;
      if (parseProviderTimeout(error)) {
        timedOut = true;
        logProviderAttempt(deps.log, "gemini", model, "timeout", attemptStarted, deps.now);
        // A timeout consumes only this candidate's budget; continue to the next.
        continue;
      }
      logProviderAttempt(deps.log, "gemini", model, 0, attemptStarted, deps.now);
    }
  }
  return { text: "", timedOut };
}

async function callCompatibleProvider(
  config: NonNullable<ReturnType<typeof getConfiguredProvider>>,
  system: string,
  messages: ChatMessage[],
  depth: Depth,
  deadline: number,
  fetchImpl: Fetcher,
  now: () => number,
  log: Dependencies["log"]
): Promise<{ text: string; timedOut: boolean }> {
  const remaining = deadline - now();
  if (remaining <= 0) return { text: "", timedOut: true };
  const attemptStarted = now();
  try {
    const response = await fetchImpl(config.base + "/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: MAX_TOKENS[depth],
        messages: [{ role: "system", content: system }, ...messages]
      }),
      signal: AbortSignal.timeout(Math.min(ATTEMPT_BUDGET_MS[depth], remaining))
    });

    logProviderAttempt(log, config.name, config.model, response.status, attemptStarted, now);
    if (response.status === 429) throw new TutorFault("provider_rate_limit", true, 429);
    if (!response.ok) {
      return { text: "", timedOut: response.status >= 500 || response.status === 408 };
    }

    const body = await response.json();
    const text = String(body?.choices?.[0]?.message?.content || "").trim();
    return { text, timedOut: false };
  } catch (error) {
    if (error instanceof TutorFault) throw error;
    if (parseProviderTimeout(error)) {
      logProviderAttempt(log, config.name, config.model, "timeout", attemptStarted, now);
      return { text: "", timedOut: true };
    }
    logProviderAttempt(log, config.name, config.model, 0, attemptStarted, now);
    return { text: "", timedOut: false };
  }
}

async function callGroqModels(
  config: NonNullable<ReturnType<typeof getConfiguredProvider>>,
  models: string[],
  system: string,
  messages: ChatMessage[],
  depth: Depth,
  deadline: number,
  fetchImpl: Fetcher,
  now: () => number,
  log: Dependencies["log"]
): Promise<{ text: string; timedOut: boolean }> {
  let timedOut = false;
  for (const model of models) {
    const remaining = deadline - now();
    if (remaining <= 0) {
      timedOut = true;
      break;
    }
    const attemptStarted = now();
    try {
      const response = await fetchImpl(config.base + "/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + config.key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS[depth],
          messages: [{ role: "system", content: system }, ...messages]
        }),
        signal: AbortSignal.timeout(Math.min(ATTEMPT_BUDGET_MS[depth], remaining))
      });
      const errorBody = response.ok ? null : await response.clone().json().catch(() => null);
      const errorCode = String(errorBody?.error?.code || errorBody?.error?.type || errorBody?.code || "").toLowerCase();
      logProviderAttempt(log, "groq", model, response.status, attemptStarted, now);

      if (response.status === 429) throw new TutorFault("provider_rate_limit", true, 429);
      if (response.status === 404 || errorCode === "model_not_found") continue;
      if (!response.ok) return { text: "", timedOut: response.status >= 500 || response.status === 408 };

      const body = await response.json();
      const text = String(body?.choices?.[0]?.message?.content || "").trim();
      if (text) return { text, timedOut };
    } catch (error) {
      if (error instanceof TutorFault) throw error;
      if (parseProviderTimeout(error)) {
        timedOut = true;
        logProviderAttempt(log, "groq", model, "timeout", attemptStarted, now);
        continue;
      }
      logProviderAttempt(log, "groq", model, 0, attemptStarted, now);
    }
  }
  return { text: "", timedOut };
}

async function generateAnswer(
  system: string,
  messages: ChatMessage[],
  depth: Depth,
  deps: Required<Pick<Dependencies, "env" | "fetchImpl" | "now" | "log">>
): Promise<string> {
  const startedAt = deps.now();
  const deadline = startedAt + OVERALL_DEADLINE_MS[depth];
  let timedOut = false;
  let attempted = false;

  const gemini = getConfiguredProvider("gemini", deps.env);
  if (gemini) {
    attempted = true;
    const result = await callGemini(gemini, system, messages, depth, deadline, deps);
    if (result.text) return result.text;
    timedOut ||= result.timedOut;
  }

  for (const name of ["groq", "mistral", "openrouter"] as const) {
    if (deps.now() >= deadline) {
      timedOut = true;
      break;
    }
    const config = getConfiguredProvider(name, deps.env);
    if (!config) continue;
    attempted = true;
    const result = name === "groq"
      ? await callGroqModels(config, getGroqModels(deps.env), system, messages, depth, deadline, deps.fetchImpl, deps.now, deps.log)
      : await callCompatibleProvider(config, system, messages, depth, deadline, deps.fetchImpl, deps.now, deps.log);
    if (result.text) return result.text;
    timedOut ||= result.timedOut;
  }

  if (!attempted) throw new TutorFault("provider_unavailable", false, 503);
  if (timedOut || deps.now() >= deadline) {
    throw new TutorFault("provider_timeout", true, 504);
  }
  throw new TutorFault("provider_unavailable", true, 502);
}

async function rpc(
  name: "ai_use" | "ai_use_reserve" | "ai_use_settle",
  body: Record<string, unknown>,
  deps: Required<Pick<Dependencies, "env" | "fetchImpl">>
): Promise<any> {
  const url = deps.env.get("SUPABASE_URL");
  const serviceKey = deps.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new TutorFault("quota_unavailable", true, 503);

  const response = await deps.fetchImpl(url.replace(/\/$/, "") + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new TutorFault("quota_unavailable", true, 503);
  return response.json();
}

export function createTutorHandler(overrides: Dependencies = {}) {
  const deps = {
    env: overrides.env || defaultEnv,
    fetchImpl: overrides.fetchImpl || fetch,
    now: overrides.now || (() => Date.now()),
    log: overrides.log || defaultLog
  };

  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
    if (req.method !== "POST") return json({ error: "invalid_request", retryable: false }, 405);

    const uid = authenticatedUid(req);
    if (!uid) return json({ error: "not_signed_in", retryable: false }, 401);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_request", retryable: false }, 400);
    }

    if (body?.health === true) {
      const providerKeys = Object.fromEntries(PROVIDERS.map((provider) => [
        provider.name,
        Boolean(getConfiguredProvider(provider.name, deps.env))
      ]));
      return json({
        providerKeys,
        groqModels: getGroqModels(deps.env),
        quotaMode: getQuotaMode(deps.env)
      });
    }

    const mode = ["chat", "translate", "correct", "practice", "examples"].includes(body?.mode)
      ? body.mode : "chat";
    const question = clip(body?.text, 1_800).trim();
    if (!question) return json({ error: "invalid_request", retryable: false }, 400);

    const depth = parseDepth(body?.depth);
    const history = normalizeHistory(body?.history);
    const messages: ChatMessage[] = [...history, { role: "user", content: question }];
    const quotaMode = getQuotaMode(deps.env);
    const requestId = quotaMode === "reservation" ? crypto.randomUUID() : "";
    let reserved = false;

    try {
      if (quotaMode === "reservation") {
        const reservation = await rpc("ai_use_reserve", {
          p_uid: uid,
          p_request_id: requestId
        }, deps);
        if (reservation?.allowed !== true) {
          return json({ error: "quota_exceeded", retryable: false }, 429);
        }
        reserved = true;
      } else {
        // Match production tutor's existing ai_use(uuid) quota contract exactly.
        const allowed = await rpc("ai_use", { p_uid: uid }, deps);
        if (allowed !== true) return json({ error: "quota_exceeded", retryable: false }, 429);
      }

      let answer = "";
      try {
        answer = await generateAnswer(
          makeSystemPrompt(mode, clip(body?.level, 8), depth),
          messages,
          depth,
          deps
        );
        if (!answer.trim()) throw new TutorFault("provider_unavailable", true, 502);
      } catch (error) {
        if (reserved) {
          await rpc("ai_use_settle", {
            p_uid: uid,
            p_request_id: requestId,
            p_success: false
          }, deps).catch(() => null);
          reserved = false;
        }
        throw error;
      }

      if (reserved) {
        const settled = await rpc("ai_use_settle", {
          p_uid: uid,
          p_request_id: requestId,
          p_success: true
        }, deps);
        reserved = false;
        if (settled?.settled !== true || settled?.status !== "succeeded") {
          throw new TutorFault("quota_unavailable", true, 503);
        }
      }
      return json({ text: answer, depth });
    } catch (error) {
      if (reserved) {
        await rpc("ai_use_settle", {
          p_uid: uid,
          p_request_id: requestId,
          p_success: false
        }, deps).catch(() => null);
      }
      if (error instanceof TutorFault) {
        deps.log("request_failed", { code: error.code, retryable: error.retryable });
        return json({ error: error.code, retryable: error.retryable }, error.status);
      }
      deps.log("request_failed", { code: "provider_unavailable", retryable: true });
      return json({ error: "provider_unavailable", retryable: true }, 502);
    }
  };
}

if (import.meta.main) {
  Deno.serve(createTutorHandler());
}
