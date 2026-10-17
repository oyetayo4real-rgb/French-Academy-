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
  gemini: "gemini-3.8-flash",
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
    // Discover models available to this exact API key/project. Model access differs
    // across keys and can change; do not assume a hard-coded ID is available.
    let candidates: string[] = [];
    try {
      const catalog = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
        headers: { "x-goog-api-key": config.key },
        signal: AbortSignal.timeout(4000)
      });
      if (catalog.ok) {
        const json = await catalog.json();
        const available = (Array.isArray(json?.models) ? json.models : [])
          .filter((item: any) => Array.isArray(item.supportedGenerationMethods) && item.supportedGenerationMethods.includes("generateContent"))
          .map((item: any) => String(item.name || "").replace(/^models\//, ""))
          .filter((name: string) => /^gemini-/.test(name) && !/(embedding|aqa|robotics|tts|image|audio|live|computer-use)/i.test(name) && !/^gemini-2\./.test(name));
        const preferred = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
        candidates = [...new Set([
          ...preferred.filter((name) => available.includes(name)),
          ...available.filter((name) => /flash/i.test(name)),
          ...available
        ])];
      } else {
        console.error("[tutor] Gemini model catalog failed", JSON.stringify({ status: catalog.status }));
      }
    } catch (_) {}
    if (config.model && !candidates.includes(config.model)) candidates.unshift(config.model);
    if (!candidates.length) candidates = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
    candidates = [...new Set(candidates)].slice(0, 6);
    let lastStatus = 0;
    for (const model of candidates) {
      let response: Response;
      try {
        response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
        {
          method: "POST",
          headers: { "x-goog-api-key": config.key, "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }]
            })),
            // Gemini 3.x controls reasoning through thinkingConfig; do not send legacy sampling parameters such as temperature.
            generationConfig: { maxOutputTokens: maxTokens, thinkingConfig: { thinkingLevel: maxTokens <= 1800 ? "low" : "medium" } }
          }),
          signal: AbortSignal.timeout(22000)
          }
        );
      } catch (error) {
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new Error("provider_timeout");
        throw error;
      }
      if (response.ok) {
        const json = await response.json();
        const candidate = json?.candidates?.[0];
        if (candidate?.finishReason === "SAFETY") throw new Error("blocked");
        return (candidate?.content?.parts || []).map((part: { text?: string }) => part.text || "").join("").trim();
      }

      const rawError = await response.text().catch(() => "");
      let reason = "";
      try {
        const parsed = JSON.parse(rawError);
        reason = String(parsed?.error?.message || parsed?.error?.status || "");
      } catch (_) {}
      console.error("[tutor] provider request failed", JSON.stringify({
        provider: "gemini",
        model,
        status: response.status,
        reason: clip(reason, 180)
      }));
      if (response.status === 429) throw new Error("rate");
      if (response.status === 404 || response.status === 400) {
        lastStatus = response.status;
        continue;
      }
      // A temporary overload on one Gemini model should not immediately break the Tutor
      // when another model available to this same key may still be healthy.
      if ([500, 502, 503, 504].includes(response.status)) {
        lastStatus = response.status;
        console.error("[tutor] trying next available model after transient provider failure", JSON.stringify({
          status: response.status,
          remainingCandidates: Math.max(0, candidates.length - candidates.indexOf(model) - 1)
        }));
        continue;
      }
      throw new Error("provider_http_" + response.status);
    }
    throw new Error("provider_http_" + (lastStatus || 404));
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
function wikiText(value: unknown, max = 1800): string {
  return clip(String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/a\s*>/gi, "").replace(/<a\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim(), max);
}
function wikiMarkupText(value: unknown, max = 1800): string {
  let text = String(value ?? "").replace(/<!--([\s\S]*?)-->/g, " ");
  for (let i = 0; i < 8 && /\{\{[^{}]*\}\}/.test(text); i++) text = text.replace(/\{\{[^{}]*\}\}/g, " ");
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, "$1")
    .replace(/'{2,5}/g, "")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim();
  return clip(text, max);
}
function parseFrenchWikitext(raw: string) {
  const lines = raw.split(/\r?\n/);
  const byPos = new Map<string, any>();
  const knownPos = new Set([
    "nom", "verbe", "adjectif", "adverbe", "interjection", "pronom", "préposition",
    "conjonction", "déterminant", "article défini", "article indéfini", "numéral",
    "onomatopée", "particule", "locution", "locution nominale", "locution verbale",
    "locution adjectivale", "locution adverbiale", "locution prépositive",
    "locution conjonctive", "locution interjective", "symbole", "lettre", "affixe",
    "préfixe", "suffixe", "expression"
  ]);
  let inFrench = false, currentPos = "";
  for (const line of lines) {
    if (/^==[^=].*==\s*$/.test(line)) {
      inFrench = /\{\{\s*langue\s*\|\s*fr(?:\s*[|}])/i.test(line) || /^==\s*français\s*==\s*$/i.test(line);
      currentPos = "";
      continue;
    }
    if (!inFrench) continue;
    const heading = line.match(/^={3,4}\s*\{\{\s*S\s*\|\s*([^}|]+)(?:\|[^}]*)?\}\}.*$/i);
    if (heading) {
      const key = heading[1].trim().toLowerCase().replace(/_/g, " ");
      currentPos = knownPos.has(key) ? key : "";
      if (currentPos && !byPos.has(currentPos)) byPos.set(currentPos, { language: "French", partOfSpeech: currentPos, definitions: [] });
      continue;
    }
    if (!currentPos) continue;
    const sense = line.match(/^#(?![#*:])\s*(.+)$/);
    if (!sense) continue;
    const definition = wikiMarkupText(sense[1], 1800);
    const target = byPos.get(currentPos);
    if (definition.length < 2) continue;
    if (!target.definitions.some((item: any) => item.definition.toLowerCase() === definition.toLowerCase())) {
      target.definitions.push({ definition, examples: [] });
    }
  }
  return [...byPos.values()].filter((group: any) => group.definitions.length).map((group: any) => ({
    ...group, partOfSpeech: group.partOfSpeech.charAt(0).toUpperCase() + group.partOfSpeech.slice(1),
    definitions: group.definitions.slice(0, 20)
  }));
}
async function lookupReferenceSources(query: string) {
  const term = clip(query, 180).trim();
  const academyPromise = (async () => {
    try {
      const response = await fetch("https://www.dictionnaire-academie.fr/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": "https://www.dictionnaire-academie.fr/search",
          "User-Agent": "FrenchAcademyApp/1.2 (educational lexical references)"
        },
        body: new URLSearchParams({ term, options: "1" }).toString(),
        signal: AbortSignal.timeout(3500)
      });
      if (!response.ok) return [];
      const json = await response.json();
      const results = Array.isArray(json?.result) ? json.result : [];
      const fold = (value: string) => value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase("fr").trim();
      const exact = results.filter((item: any) => fold(String(item?.label || "")) === fold(term));
      return (exact.length ? exact : results.slice(0, 3)).slice(0, 4).map((item: any) => {
        const url = String(item?.url || "");
        if (!url.startsWith("https://www.dictionnaire-academie.fr/article/")) return null;
        const label = clip(item?.label || term, 120);
        const nature = clip(item?.nature || "", 80);
        return {
          name: "Académie française — " + label + (nature ? " (" + nature + ")" : ""),
          url,
          licence: "Entrée officielle trouvée en direct. Le texte éditorial reste sur le site de l’Académie et n’est pas recopié dans l’application."
        };
      }).filter(Boolean);
    } catch (_) { return []; }
  })();
  const cnrtlPromise = (async () => {
    try {
      const response = await fetch("https://www.cnrtl.fr/definition/" + encodeURIComponent(term), {
        headers: { "User-Agent": "FrenchAcademyApp/1.2 (educational lexical references)" },
        signal: AbortSignal.timeout(3500)
      });
      const available = response.ok;
      try { await response.body?.cancel(); } catch (_) {}
      return available;
    } catch (_) { return false; }
  })();
  const [academie, cnrtlAvailable] = await Promise.all([academyPromise, cnrtlPromise]);
  return { academie, cnrtlAvailable };
}
function dictionarySources(query: string, academie: any[] = [], cnrtlAvailable: boolean | null = null) {
  const term = encodeURIComponent(query);
  const slug = term.replace(/%20/g, "_");
  const academySources = academie.length ? academie : [{
    name: "Dictionnaire de l’Académie française — recherche",
    url: "https://www.dictionnaire-academie.fr/search",
    licence: "Portail officiel. L’entrée exacte n’a pas pu être résolue automatiquement ; recherchez le mot sur le site de l’Académie."
  }];
  return [
    { name: "Wiktionnaire — entrée française (CC BY-SA 4.0)", url: "https://fr.wiktionary.org/wiki/" + slug, licence: "Source de définitions chargée en direct depuis le Wiktionnaire francophone. Licence CC BY-SA 4.0 : attribution et partage dans les mêmes conditions." },
    ...academySources,
    { name: cnrtlAvailable === true ? "CNRTL / TLFi — page vérifiée en direct" : "CNRTL / TLFi — référence historique", url: "https://www.cnrtl.fr/definition/" + term, licence: (cnrtlAvailable === true ? "La page de cette entrée répond actuellement. " : "Vérification en direct indisponible ; ") + "Le texte du CNRTL/TLFi n’est pas reproduit ici ; consulter le portail d’origine." }
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

    // Dictionary: use French Wiktionnaire source entries first. Never use English-written definitions as the French dictionary source.
    if (mode === "dict" || mode === "sources") {
      let wiki: Record<string, any> | null = null;
      let wikiTextSource = "";
      let sourceError = "";
      try {
        // French Wiktionnaire serves entries through MediaWiki API, not the
        // English Wiktionary-specific REST definition endpoint.
        const apiUrl = new URL("https://fr.wiktionary.org/w/api.php");
        apiUrl.searchParams.set("action", "parse");
        apiUrl.searchParams.set("page", text);
        apiUrl.searchParams.set("prop", "wikitext");
        apiUrl.searchParams.set("format", "json");
        apiUrl.searchParams.set("redirects", "1");
        const response = await fetch(apiUrl.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "FrenchAcademyApp/1.2 (educational French dictionary; https://github.com/oyetayo4real-rgb/French-Academy-)",
            "Api-User-Agent": "FrenchAcademyApp/1.2 (educational French dictionary; https://github.com/oyetayo4real-rgb/French-Academy-)"
          },
          signal: AbortSignal.timeout(9000)
        });
        if (response.ok) {
          wiki = await response.json();
          wikiTextSource = String(wiki?.parse?.wikitext?.["*"] || (typeof wiki?.parse?.wikitext === "string" ? wiki.parse.wikitext : ""));
          if (!wikiTextSource) sourceError = String(wiki?.error?.info || "Wiktionnaire returned no article text.");
        } else sourceError = "Wiktionnaire API returned HTTP " + response.status + ".";
      } catch (error) {
        sourceError = error instanceof Error && error.name === "TimeoutError"
          ? "Wiktionnaire request timed out."
          : "Wiktionnaire is unavailable at the moment.";
      }
      let entries = wikiTextSource ? parseFrenchWikitext(wikiTextSource) : [];
      let resolvedTitle = String(wiki?.parse?.title || text);
      // If an unaccented spelling has no French entry, try ranked French Wiktionnaire
      // results whose spelling differs only by diacritics (etre -> être, deja -> déjà).
      if (!entries.length) {
        try {
          const searchUrl = new URL("https://fr.wiktionary.org/w/api.php");
          searchUrl.searchParams.set("action", "query");
          searchUrl.searchParams.set("list", "search");
          searchUrl.searchParams.set("srsearch", text);
          searchUrl.searchParams.set("srnamespace", "0");
          searchUrl.searchParams.set("srlimit", "10");
          searchUrl.searchParams.set("srprop", "title");
          searchUrl.searchParams.set("format", "json");
          const searchResponse = await fetch(searchUrl.toString(), {
            headers: { Accept: "application/json", "User-Agent": "FrenchAcademyApp/1.2 (educational French dictionary; https://github.com/oyetayo4real-rgb/French-Academy-)",
            "Api-User-Agent": "FrenchAcademyApp/1.2 (educational French dictionary; https://github.com/oyetayo4real-rgb/French-Academy-)" },
            signal: AbortSignal.timeout(5000)
          });
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
            const candidates = (Array.isArray(searchData?.query?.search) ? searchData.query.search : [])
              .map((item: any) => String(item?.title || ""))
              .filter((title: string) => title && fold(title) === fold(text) && title.toLocaleLowerCase("fr") !== text.toLocaleLowerCase("fr"))
              .slice(0, 6);
            for (const candidateTitle of candidates) {
              const candidateUrl = new URL("https://fr.wiktionary.org/w/api.php");
              candidateUrl.searchParams.set("action", "parse");
              candidateUrl.searchParams.set("page", candidateTitle);
              candidateUrl.searchParams.set("prop", "wikitext");
              candidateUrl.searchParams.set("format", "json");
              candidateUrl.searchParams.set("redirects", "1");
              const candidateResponse = await fetch(candidateUrl.toString(), {
                headers: { Accept: "application/json", "User-Agent": "FrenchAcademyApp/1.2 (educational French dictionary; https://github.com/oyetayo4real-rgb/French-Academy-)",
            "Api-User-Agent": "FrenchAcademyApp/1.2 (educational French dictionary; https://github.com/oyetayo4real-rgb/French-Academy-)" },
                signal: AbortSignal.timeout(7000)
              });
              if (!candidateResponse.ok) continue;
              const candidateData = await candidateResponse.json();
              const candidateWikitext = String(candidateData?.parse?.wikitext?.["*"] || "");
              const candidateEntries = candidateWikitext ? parseFrenchWikitext(candidateWikitext) : [];
              if (candidateEntries.length) {
                wiki = candidateData;
                wikiTextSource = candidateWikitext;
                entries = candidateEntries;
                resolvedTitle = String(candidateData?.parse?.title || candidateTitle);
                sourceError = "";
                break;
              }
            }
          }
        } catch (_) {
          // Keep the direct result when the accent-recovery search fails.
        }
      }
      const referenceCoverage = await lookupReferenceSources(resolvedTitle || text);
      const sources = dictionarySources(resolvedTitle || text, referenceCoverage.academie, referenceCoverage.cnrtlAvailable);
      const sourceStatus = entries.length ? "ok" : (wikiTextSource ? "no_french_entry" : "unavailable");
      if (mode === "sources") return J({
        ok: true,
        data: { headword: resolvedTitle, searchedAs: text, entries, sources, sourceStatus, sourceError }
      });

      if (entries.length) {
        const definitions = entries.flatMap((group: any) => group.definitions.map((definition: any) => definition.definition)).slice(0, 30);
        // Source definitions stay authoritative for the source-backed part of the entry.
        // Enrichment adds useful dictionary metadata, but failure never hides the source entry.
        const data: Record<string, any> = {
          headword: resolvedTitle,
          searchedAs: text,
          pos: [...new Set(entries.map((group: any) => group.partOfSpeech).filter(Boolean))].join(", "),
          entries,
          meanings: definitions,
          examples: [],
          sources,
          notes: "Entrée chargée depuis le Wiktionnaire francophone via son API MediaWiki. Le contenu est sous licence CC BY-SA 4.0 ; consulter la source liée pour l’attribution et le contexte complet."
        };
        try {
          const allowance = await takeAiAllowance(uid);
          if (allowance.ok) {
            const lexical = await callAI(
              "You are a rigorous modern French lexicographer. Return valid JSON only. The input includes a French headword and source-backed definitions. Do NOT rewrite or replace those definitions. Add concise, accurate metadata only: gender (string or empty), ipa (IPA string or empty), grammar (short part-of-speech/form note), forms (array of useful inflected forms as strings), synonyms (array), antonyms (array), collocations (array), related (array of expressions), etymology (short string only if reliably known, otherwise empty), notes (usage/register/region notes; do not overclaim), and examples (array of 2-4 objects {fr,en} with natural contemporary French and faithful English translations). Keep examples idiomatic and genuinely illustrative of the word. Do not fabricate citations or pretend the examples are source quotations. Return JSON only.",
              [{ role: "user", content: JSON.stringify({ headword: resolvedTitle, sourceDefinitions: entries.map((group: any) => ({ partOfSpeech: group.partOfSpeech, definitions: group.definitions.map((item: any) => item.definition).slice(0, 8) })) }) }],
              1400
            );
            const extra = grabJson(lexical);
            if (extra && typeof extra === "object") {
              for (const key of ["gender", "ipa", "grammar", "etymology", "notes"]) {
                if (typeof extra[key] === "string" && extra[key].trim()) data[key] = clip(extra[key], key === "notes" ? 1200 : 500);
              }
              for (const key of ["forms", "synonyms", "antonyms", "collocations", "related"]) {
                if (Array.isArray(extra[key])) data[key] = extra[key].slice(0, 12).map((item: any) => clip(item, 180)).filter(Boolean);
              }
              if (Array.isArray(extra.examples)) {
                data.examples = extra.examples.slice(0, 4).filter((item: any) => item && typeof item.fr === "string" && typeof item.en === "string")
                  .map((item: any) => ({ fr: clip(item.fr, 400), en: clip(item.en, 400), source: "AI-generated example" }));
              }
              data.enriched = true;
            }
          }
        } catch (error) {
          console.error("[tutor] dictionary enrichment unavailable", error instanceof Error ? error.message : "unknown");
        }
        return J({ ok: true, data });
      }

      // A source outage is not the same as a missing word: fail clearly and never
      // disguise AI-generated prose as a source-backed dictionary lookup.
      if (!wikiTextSource && sourceError) return J({
        ok: true,
        data: { headword: text, entries: [], meanings: [], examples: [], sources,
          notFound: true, sourceStatus: "unavailable", sourceError,
          notes: "The live French dictionary source could not be reached. Please retry shortly." }
      });

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
            notes: sourceError || "No French-language entry was available from Wiktionnaire. Check the spelling or try an accented form."
          }
        });
      }
      const allowance = await takeAiAllowance(uid);
      if (!allowance.ok) return J({ ok: true, data: {
        headword: text, entries: [], meanings: [], examples: [], sources,
        notFound: true, sourceStatus: "ai_unavailable",
        sourceError: allowance.status === 503
          ? "The AI usage-limit service is temporarily unavailable."
          : "The daily AI-use limit has been reached.",
        notes: "No source-backed French entry was found for this spelling. The dictionary remains available for source-backed words; try the accented spelling or a related form."
      } });
      try {
        const generated = await callAI(
          "You are a modern French lexicographer. Return valid JSON only with keys headword, pos, gender, ipa, meanings (array of concise strings ordered from common/current to less common or figurative), examples (array of objects with fr and en strings), notes, related (array of strings), and notFound (boolean). Use natural, idiomatic contemporary French and precise English translations. Give 2–4 short, natural French examples, each paired with a faithful English translation; keep punctuation and register consistent. Explain part of speech, gender and usage when relevant. Distinguish standard, formal, informal, regional and dated senses when reliably known. Do not invent etymology, citations or official dictionary authority. If the query is not identifiable as a French word or expression, set notFound=true and explain briefly.",
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
        const reason = error instanceof Error ? error.message : "unknown";
        console.error("[tutor] dictionary fallback failed", reason);
        let message = "The source did not return a French entry and the AI explanation could not be generated. Please try again later.";
        if (reason === "not_configured") message = "The dictionary source had no matching entry and the AI provider is not configured.";
        else if (reason === "rate") message = "The AI provider is temporarily rate-limited or out of quota. The sourced dictionary is still available for entries found in the source.";
        else if (reason === "provider_http_401" || reason === "provider_http_403") message = "The AI provider rejected the configured key or access. Check the selected provider and key permissions in server-side secrets; do not share the key.";
        else if (reason === "provider_http_404") message = "The AI provider could not find an available model for this key/project. Check model access and provider configuration.";
        else if (reason === "provider_http_503") message = "The AI provider is temporarily overloaded (HTTP 503). This is usually a provider availability issue, not proof that quota is exhausted.";
        else if (reason.startsWith("provider_http_")) message = "The AI provider returned an HTTP error (" + reason.slice("provider_http_".length) + "). Check provider status, key permissions and quota.";
        // Dictionary lookups must remain usable when optional AI enrichment fails.
        // Return the source outcome and diagnostic as data rather than failing the entire lookup.
        return J({ ok: true, data: {
          headword: text, entries: [], meanings: [], examples: [], sources,
          notFound: true, sourceStatus: "ai_unavailable", sourceError: message,
          notes: "No source-backed French entry was available for this spelling. AI enrichment is temporarily unavailable; the reference links remain available."
        } });
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
      if (message === "provider_timeout") return J({ error: "provider_timeout", message: "The AI provider did not answer within 22 seconds. Please retry; the request was stopped rather than left hanging." }, 504);
      if (message === "provider_http_401" || message === "provider_http_403") return J({ error: "provider_auth", message: "The AI provider rejected the configured key or its permissions. Check the selected provider and server-side key; never paste the key into chat." }, 502);
      if (message === "provider_http_404") return J({ error: "provider_model", message: "No available model was found for this provider key. Check model access and the provider configuration." }, 502);
      if (message === "provider_http_400") return J({ error: "provider_request", message: "The AI provider rejected the request format or model settings. The backend needs the provider's specific error detail to diagnose this." }, 502);
      if (message.startsWith("provider_http_")) return J({ error: "provider_error", message: "The AI provider returned HTTP " + message.slice("provider_http_".length) + ". Check provider status and quota." }, 502);
      return J({ error: "ai_error", message: "The AI provider request failed. Check provider access, model availability and quota." }, 502);
    }
  } catch (error) {
    console.error("[tutor] unhandled request failure", error instanceof Error ? error.message : "unknown");
    return J({ error: "server", message: "Something went wrong. Please try again." }, 500);
  }
});
