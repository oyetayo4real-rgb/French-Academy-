// AI tutor + source-first French dictionary for Académie Française.
// The provider and its key are resolved together; never choose another provider's key.
// Secrets must remain server-side and must never be logged or returned.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function subOf(req: Request): string | null {
  try {
    const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const part = bearer.split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    return claims.role === "authenticated" && claims.sub ? String(claims.sub) : null;
  } catch (_) { return null; }
}
const clip = (value: unknown, max: number) => String(value ?? "").slice(0, max);
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
  openrouter: "meta-llama/llama-3.3-70b-instruct:free"
};
const BASES: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1",
  mistral: "https://api.mistral.ai/v1",
  openrouter: "https://openrouter.ai/api/v1"
};

function providerConfig() {
  const configuredProvider = (Deno.env.get("AI_PROVIDER") || "gemini").trim().toLowerCase();
  // Older production configuration used "auto" when Gemini was the configured provider.
  const provider = configuredProvider === "auto" ? "gemini" : configuredProvider;
  const secretNames: Record<string, string[]> = {
    gemini: ["GEMINI_API_KEY", "AI_API_KEY"],
    groq: ["GROQ_API_KEY", "AI_API_KEY"],
    mistral: ["MISTRAL_API_KEY", "AI_API_KEY"],
    openrouter: ["OPENROUTER_API_KEY", "AI_API_KEY"]
  };
  if (!secretNames[provider]) throw new Error("bad_provider");
  const selectedName = secretNames[provider].find((name) => Boolean(Deno.env.get(name)));
  if (!selectedName) throw new Error("not_configured");
  const modelNames: Record<string, string> = { gemini: "GEMINI_MODEL", groq: "GROQ_MODEL", mistral: "MISTRAL_MODEL", openrouter: "OPENROUTER_MODEL" };
  // Keep Gemini on a known supported default; legacy model overrides caused production 404s.
  const configuredModel = provider === "gemini" ? "" : Deno.env.get(modelNames[provider]);
  return { provider, key: Deno.env.get(selectedName)!, selectedName, model: configuredModel || MODELS[provider] };
}

async function callAI(system: string, messages: { role: string; content: string }[], maxTokens: number) {
  const config = providerConfig();
  if (config.provider === "gemini") {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(config.model) + ":generateContent",
      {
        method: "POST",
        headers: { "x-goog-api-key": config.key, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }]
          })),
          // Do not force Gemini thinkingBudget to zero: the Tutor must handle deeper questions.
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );
    if (response.status === 429) throw new Error("rate");
    if (!response.ok) {
      console.error("[tutor] provider request failed", JSON.stringify({ provider: config.provider, status: response.status }));
      throw new Error("provider_http_" + response.status);
    }
    const json = await response.json();
    const candidate = json?.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") throw new Error("blocked");
    return (candidate?.content?.parts || []).map((part: { text?: string }) => part.text || "").join("").trim();
  }

  const response = await fetch(BASES[config.provider] + "/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + config.key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      temperature: 0.4,
      messages: [{ role: "system", content: system }, ...messages]
    }),
    signal: AbortSignal.timeout(30000)
  });
  if (response.status === 429) throw new Error("rate");
  if (!response.ok) {
    console.error("[tutor] provider request failed", JSON.stringify({ provider: config.provider, status: response.status }));
    throw new Error("provider_http_" + response.status);
  }
  const json = await response.json();
  return String(json?.choices?.[0]?.message?.content || "").trim();
}

function grabJson(text: string) {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch (_) { return null; }
}
function dictionarySources(query: string) {
  const term = encodeURIComponent(query);
  return [
    { name: "Wiktionnaire (CC BY-SA 4.0)", url: "https://fr.wiktionary.org/wiki/" + term.replace(/%20/g, "_"), licence: "Community-authored content; preserve attribution and the applicable share-alike licence." },
    { name: "Dictionnaire de l’Académie française", url: "https://www.dictionnaire-academie.fr/search/" + term, licence: "Editorial reference; consult the entry at the source rather than copying its text." },
    { name: "CNRTL / TLFi", url: "https://www.cnrtl.fr/definition/" + term, licence: "Historical reference; consult the source for its entry and usage notes." }
  ];
}
async function takeAiAllowance(uid: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return { ok: false, status: 503 };
  const response = await fetch(url + "/rest/v1/rpc/ai_use", {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json" },
    body: JSON.stringify({ p_uid: uid })
  });
  if (!response.ok) {
    console.error("[tutor] quota RPC failed", JSON.stringify({ status: response.status }));
    return { ok: false, status: 503 };
  }
  const allowed = await response.json().catch(() => false);
  return { ok: allowed === true, status: allowed === true ? 200 : 429 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const uid = subOf(req);
    if (!uid) return J({ error: "not_signed_in", message: "Please sign in again." }, 401);
    const body = await req.json().catch(() => ({}));
    const mode = ["chat", "translate", "correct", "practice", "dict", "sources", "examples"].includes(body.mode) ? body.mode : "chat";
    const text = clip(body.text, 1800).trim();
    if (!text && mode !== "examples") return J({ error: "empty", message: "Type something first." }, 400);

    // Dictionary: use source-backed French entries first. Never relabel English entries as French.
    if (mode === "dict" || mode === "sources") {
      let wiki: Record<string, any> | null = null;
      let sourceError = "";
      try {
        const response = await fetch("https://fr.wiktionary.org/api/rest_v1/page/definition/" + encodeURIComponent(text), {
          headers: {
            Accept: "application/json",
            "Api-User-Agent": "AcademieFrancaise/1.0 (French dictionary; https://github.com/oyetayo4real-rgb/French-Academy-)"
          },
          signal: AbortSignal.timeout(7000)
        });
        if (response.ok) wiki = await response.json();
        else sourceError = "Wiktionary returned HTTP " + response.status + ".";
      } catch (_) { sourceError = "Wiktionary is unavailable at the moment."; }

      const frenchGroups = Array.isArray(wiki?.French) ? wiki!.French : Array.isArray(wiki?.fr) ? wiki!.fr : [];
      const entries = frenchGroups
        .filter((group: any) => String(group.language || "").toLowerCase() === "french" && Array.isArray(group.definitions))
        .map((group: any) => ({
          language: "French",
          partOfSpeech: clip(group.partOfSpeech, 80),
          definitions: group.definitions.slice(0, 12).map((definition: any) => ({
            definition: clip(definition.definition, 1800),
            examples: (Array.isArray(definition.examples) ? definition.examples : []).slice(0, 4)
              .map((example: any) => clip(typeof example === "string" ? example : example?.text, 400)),
            parsedExamples: (Array.isArray(definition.parsedExamples) ? definition.parsedExamples : []).slice(0, 2)
          }))
        }))
        .filter((group: any) => group.definitions.some((definition: any) => definition.definition));

      const sources = dictionarySources(text);
      if (mode === "sources") return J({
        ok: true,
        data: { headword: text, entries, sources, sourceStatus: wiki ? "ok" : "unavailable", sourceError }
      });

      if (entries.length) {
        const definitions = entries.flatMap((group: any) => group.definitions.map((definition: any) => definition.definition)).slice(0, 30);
        const examples = entries.flatMap((group: any) => group.definitions.flatMap((definition: any) =>
          definition.examples.map((example: string) => ({ fr: example, en: "" }))
        )).slice(0, 8);
        return J({
          ok: true,
          data: {
            headword: text,
            pos: [...new Set(entries.map((group: any) => group.partOfSpeech).filter(Boolean))].join(", "),
            entries,
            meanings: definitions,
            examples,
            sources,
            notes: "Wiktionnaire entry. Community-edited definitions are licensed under CC BY-SA 4.0; follow the linked page for attribution and licence details."
          }
        });
      }

      // If the source has no French entry, optionally generate a clearly-labelled explanation.
      // It consumes the normal per-user AI quota and is never represented as an official entry.
      let config;
      try { config = providerConfig(); }
      catch (error) {
        if (error instanceof Error && error.message === "bad_provider") {
          return J({ error: "bad_provider", message: "AI_PROVIDER must be gemini, groq, mistral or openrouter." }, 503);
        }
        return J({
          ok: true,
          data: {
            headword: text, entries: [], meanings: [], examples: [], sources,
            notFound: true,
            notes: sourceError || "No French-language entry was available. Check the spelling or try an accented form."
          }
        });
      }
      const allowance = await takeAiAllowance(uid);
      if (!allowance.ok && allowance.status === 503) return J({ error: "quota_unavailable", message: "The Tutor usage-limit service is temporarily unavailable." }, 503);
      if (!allowance.ok) return J({ error: "limit", message: "You have reached today's AI-use limit. Please try again later." }, 429);
      try {
        const generated = await callAI(
          "You are a careful French lexicographer. Explain the queried word or expression using French usage. Return valid JSON only with keys headword, pos, gender, ipa, meanings (array of strings), examples (array of {fr,en}), notes, related (array of strings), and notFound (boolean). Prefer reliable, conventional definitions; do not claim this is an official dictionary entry. Give two original French examples with English translations. If the query is gibberish or cannot be identified as a French word/expression, set notFound=true and explain briefly.",
          [{ role: "user", content: "French dictionary lookup: " + text }],
          1700
        );
        const data = grabJson(generated);
        if (!data || data.notFound || !data.headword) return J({
          ok: true, data: {
            headword: text, entries: [], meanings: [], examples: [], sources,
            notFound: true, notes: data?.reason || "No reliable French entry could be produced. Try another spelling."
          }
        });
        return J({
          ok: true, data: {
            ...data, entries: [], sources: [
              ...sources,
              { name: "AI-generated explanation (not an official dictionary entry)", url: null, licence: "Generated explanation; not copied from an external source." }
            ],
            generated: true,
            notes: (data.notes ? String(data.notes) + " " : "") + "AI-generated explanation, not a verified quotation from an external dictionary."
          }
        });
      } catch (error) {
        console.error("[tutor] dictionary fallback failed", error instanceof Error ? error.message : "unknown");
        return J({ error: "ai_error", message: "The source lookup was empty and the AI fallback failed. Please retry later." }, 502);
      }
    }

    let config;
    try { config = providerConfig(); }
    catch (error) {
      if (error instanceof Error && error.message === "bad_provider") return J({ error: "bad_provider", message: "AI_PROVIDER must be gemini, groq, mistral or openrouter." }, 503);
      return J({ error: "not_configured", message: "No key is configured for the selected AI provider. Check the server-side secret names." }, 503);
    }

    const allowance = await takeAiAllowance(uid);
    if (!allowance.ok && allowance.status === 503) return J({ error: "quota_unavailable", message: "The Tutor usage-limit service is temporarily unavailable." }, 503);
    if (!allowance.ok) return J({ error: "limit", message: "You have reached today's AI-use limit. Please try again later." }, 429);

    const level = LEVELS.includes(body.level) ? body.level : "none";
    const levelNote = level === "none"
      ? "No CEFR restriction. Answer in the depth the question deserves; be comprehensive when helpful."
      : "The learner selected " + level + " as an optional scaffold. Do not remove important nuance, edge cases, exceptions or deeper analysis just because of that preference.";
    const base = "You are Académie Française Intelligence: a rigorous French linguist, lexicographer, grammar specialist, translator, writing editor and research assistant. " +
      levelNote + " Prefer structured, substantial answers for difficult questions. Explain the reasoning and distinctions, rules and exceptions, register and regional variation, original examples with translations, common mistakes and uncertainty. Cite or link sources only when reliable source retrieval actually happened. Never fabricate citations or claim a generated dictionary entry came from an external authority.";
    let system = base;
    let messages: { role: string; content: string }[] = [];

    if (mode === "chat") {
      system += " Answer the question in the depth it deserves. Do not impose a fixed short word limit. Use headings and tables when they improve the explanation.";
      const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
      for (const item of history) if (item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string") {
        messages.push({ role: item.role, content: clip(item.content, 3000) });
      }
      while (messages.length && messages[0].role !== "user") messages.shift();
      if (messages.length && messages[messages.length - 1].role === "user") messages.pop();
      messages.push({ role: "user", content: text });
    } else if (mode === "translate") {
      system += " Translate in the correct direction based on the input language. Show the best contextual translation first, then explain alternatives, idioms, register, ambiguity and relevant grammar when useful.";
      messages = [{ role: "user", content: text }];
    } else if (mode === "correct") {
      system += " Correct French carefully. Show the corrected text first. Explain actual errors separately from stylistic choices; preserve intended meaning and offer alternatives where useful.";
      messages = [{ role: "user", content: text }];
    } else if (mode === "practice") {
      system += " Conduct natural French conversation. Reply in French with context-appropriate depth, then give an English translation and useful language notes. Do not force beginner simplification unless asked.";
      const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
      for (const item of history) if (item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string") {
        messages.push({ role: item.role, content: clip(item.content, 3000) });
      }
      while (messages.length && messages[0].role !== "user") messages.shift();
      if (messages.length && messages[messages.length - 1].role === "user") messages.pop();
      messages.push({ role: "user", content: text });
    } else {
      system += " Generate supplementary French lesson examples. Return valid JSON only with examples as an array of {fr,en} and a short tip.";
      messages = [{
        role: "user",
        content: "Lesson: " + clip(body.title, 120) + "\\nFocus: " + clip(body.focus, 700) + "\\nPhrases: " + clip(body.phrases, 600)
      }];
    }

    try {
      const output = await callAI(system, messages, mode === "chat" ? 4800 : mode === "practice" ? 2000 : 2400);
      if (!output) return J({ error: "ai_empty", message: "The AI provider returned an empty answer. Please retry." }, 502);
      if (mode === "examples") {
        const data = grabJson(output);
        if (!data || !Array.isArray(data.examples)) return J({ error: "invalid_ai_json", message: "The Tutor returned lesson examples in an unexpected format." }, 502);
        return J({ ok: true, data });
      }
      return J({ ok: true, text: output });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      if (message === "rate") return J({ error: "busy", message: "The selected AI provider is rate-limited. Please try again shortly." }, 429);
      if (message === "not_configured") return J({ error: "not_configured", message: "The selected provider key is missing." }, 503);
      if (message === "blocked") return J({ error: "blocked", message: "The provider declined this request under its safety rules. Please rephrase it." }, 422);
      return J({ error: "ai_error", message: "The AI provider could not complete this request. Check the selected provider, model, key validity and quota." }, 502);
    }
  } catch (error) {
    console.error("[tutor] unhandled request failure", error instanceof Error ? error.message : "unknown");
    return J({ error: "server", message: "Something went wrong. Please try again." }, 500);
  }
});
