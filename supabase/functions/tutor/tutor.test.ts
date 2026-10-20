import { callAI, parseFrenchWikitext, translateFrenchToEnglish, applyDefinitionTranslations } from "./index.ts";

type TestDictionaryEntry = {
  language: string;
  partOfSpeech: string;
  definitions: {
    definition: string;
    examples: string[];
    translationEn?: string;
  }[];
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const catalog = new Response(JSON.stringify({
  models: [
    { name: "models/gemini-3.5-flash-lite", supportedGenerationMethods: ["generateContent"] },
    { name: "models/gemini-3.1-flash-lite", supportedGenerationMethods: ["generateContent"] },
  ],
}), { status: 200, headers: { "Content-Type": "application/json" } });

function generation(text: string): Response {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: text ? [{ text }] : [] } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

async function withFetchMock<T>(mock: typeof fetch, run: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;
  const oldProvider = Deno.env.get("AI_PROVIDER");
  const oldKey = Deno.env.get("GEMINI_API_KEY");
  Deno.env.set("AI_PROVIDER", "gemini");
  Deno.env.set("GEMINI_API_KEY", "isolated-test-key-not-a-real-secret");
  globalThis.fetch = mock;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
    if (oldProvider === undefined) Deno.env.delete("AI_PROVIDER");
    else Deno.env.set("AI_PROVIDER", oldProvider);
    if (oldKey === undefined) Deno.env.delete("GEMINI_API_KEY");
    else Deno.env.set("GEMINI_API_KEY", oldKey);
  }
}

Deno.test("definition translations reject mismatched groups and malformed values", () => {
  const entries: TestDictionaryEntry[] = [
    {
      language: "fr",
      partOfSpeech: "Nom",
      definitions: [
        { definition: "Un lieu d’apprentissage.", examples: [] },
      ],
    },
    {
      language: "fr",
      partOfSpeech: "Verbe",
      definitions: [
        { definition: "Acquérir un savoir.", examples: [] },
      ],
    },
  ];

  applyDefinitionTranslations(entries, [
    { partOfSpeech: "Verbe", translations: ["wrong sense"] },
    { partOfSpeech: "Verbe", translations: [42, "to learn"] },
  ]);

  assert(
    entries[0].definitions[0].translationEn === undefined,
    "mismatched part of speech must not attach a translation",
  );
  assert(
    entries[1].definitions[0].translationEn === undefined,
    "non-string translation must be ignored",
  );

  applyDefinitionTranslations(entries, [
    { partOfSpeech: "Nom", translations: [" school "] },
    { partOfSpeech: "Verbe", translations: ["to learn"] },
  ]);

  assert(
    entries[0].definitions[0].translationEn === "school",
    "valid noun translation should be trimmed",
  );
  assert(
    entries[1].definitions[0].translationEn === "to learn",
    "valid verb translation should be preserved",
  );

  applyDefinitionTranslations(entries, null);
  applyDefinitionTranslations(entries, "malformed");
});

Deno.test("definition translations reject ambiguous duplicate part-of-speech groups", () => {
  const entries: TestDictionaryEntry[] = [
    {
      language: "fr",
      partOfSpeech: "Nom",
      definitions: [
        { definition: "A place where students learn.", examples: [] },
      ],
    },
    {
      language: "fr",
      partOfSpeech: "Nom",
      definitions: [
        { definition: "A physical school building.", examples: [] },
      ],
    },
  ];

  // Both groups have the same part of speech, so positional matching
  // cannot safely identify which source definition each translation belongs to.
  applyDefinitionTranslations(entries, [
    { partOfSpeech: "Nom", translations: ["bâtiment scolaire"] },
    { partOfSpeech: "Nom", translations: ["établissement d’apprentissage"] },
  ]);

  assert(
    entries.every((entry) => entry.definitions.every((sense) => sense.translationEn === undefined)),
    "ambiguous duplicate part-of-speech groups must not receive potentially misaligned translations",
  );
});

Deno.test("definition translations reject incomplete translation groups", () => {
  const entries: TestDictionaryEntry[] = [
    {
      language: "fr",
      partOfSpeech: "Nom",
      definitions: [
        { definition: "Premier sens.", examples: [] },
        { definition: "Deuxième sens.", examples: [] },
      ],
    },
  ];

  applyDefinitionTranslations(entries, [
    { partOfSpeech: "Nom", translations: ["first meaning"] },
  ]);

  assert(
    entries[0].definitions.every((sense) => sense.translationEn === undefined),
    "incomplete translation groups must not partially modify source entries",
  );
});

Deno.test("definition translations reject excess translations", () => {
  const entries: TestDictionaryEntry[] = [
    {
      language: "fr",
      partOfSpeech: "Nom",
      definitions: [
        { definition: "Premier sens.", examples: [] },
      ],
    },
  ];

  applyDefinitionTranslations(entries, [
    { partOfSpeech: "Nom", translations: ["first meaning", "unmatched meaning"] },
  ]);

  assert(
    entries[0].definitions[0].translationEn === undefined,
    "translation groups with extra unmatched senses must be rejected",
  );
});

Deno.test("French parser extracts accented French definitions", () => {
  const entries = parseFrenchWikitext("== français ==\n=== {{S|nom|fr}} ===\n# Établissement où l'on apprend.");
  assert(entries.length === 1, "expected one French entry");
  assert(entries[0].definitions[0].definition.includes("Établissement"), "accented definition was lost");
});

Deno.test("French parser accepts unaccented text in a definition", () => {
  const entries = parseFrenchWikitext("== français ==\n=== {{S|nom|fr}} ===\n# Terme de test sans accent.");
  assert(entries[0]?.definitions[0]?.definition.includes("Terme de test"), "definition not parsed");
});

Deno.test("French parser returns no entries for missing/non-French content", () => {
  const entries = parseFrenchWikitext("== anglais ==\n=== {{S|noun}} ===\n# An English definition.");
  assert(entries.length === 0, "non-French content must not become a French entry");
  assert(parseFrenchWikitext("").length === 0, "empty content must return no entries");
});

Deno.test("translation returns English text for a valid mocked response", async () => {
// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async () => new Response(JSON.stringify({
    responseStatus: 200, responseData: { translatedText: "school" },
  }), { status: 200, headers: { "Content-Type": "application/json" } }), async () => {
    assert(await translateFrenchToEnglish("école") === "school", "expected mocked English translation");
  });
});

Deno.test("translation rejects quota warnings and tolerates HTTP/source outages", async () => {
// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async () => new Response(JSON.stringify({
    responseStatus: 200, responseData: { translatedText: "MYMEMORY WARNING: quota" },
  }), { status: 200, headers: { "Content-Type": "application/json" } }), async () => {
    assert(await translateFrenchToEnglish("école") === "", "quota warning must not be shown as a translation");
  });
// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async () => new Response("unavailable", { status: 503 }), async () => {
    assert(await translateFrenchToEnglish("école") === "", "HTTP failure should return empty translation");
  });
// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async () => { throw new Error("simulated source outage"); }, async () => {
    assert(await translateFrenchToEnglish("école") === "", "network failure should return empty translation");
  });
});

Deno.test("Gemini catalogue ignores malformed model records and falls back safely", async () => {
  // deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async (input) => {
    const url = String(input);
    if (url.includes("/models?pageSize")) {
      return new Response(JSON.stringify({
        models: [
          null,
          "not-a-model-record",
          { name: 42, supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-invalid", supportedGenerationMethods: "generateContent" },
          { name: "models/gemini-3.1-flash-lite", supportedGenerationMethods: ["generateContent"] },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("gemini-3.5-flash-lite:generateContent")) {
      return new Response(
        JSON.stringify({ error: { message: "temporary test failure" } }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("gemini-3.1-flash-lite:generateContent")) {
      return generation("safe fallback answer");
    }
    if (url.includes(":generateContent")) {
      throw new Error("Unexpected model candidate: " + url);
    }
    throw new Error("Unexpected mocked URL: " + url);
  }, async () => {
    const answer = await callAI(
      "system",
      [{ role: "user", content: "hello" }],
      128,
      4800,
      2,
    );
    assert(answer === "safe fallback answer", "malformed catalogue records should be ignored");
  });
});

Deno.test("Gemini empty first response falls back to the next candidate", async () => {
// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async (input) => {
    const url = String(input);
    if (url.includes("/models?pageSize")) return catalog.clone();
    if (url.includes("gemini-3.5-flash-lite:generateContent")) return generation("");
    if (url.includes("gemini-3.1-flash-lite:generateContent")) return generation("fallback answer");
    throw new Error("Unexpected mocked URL: " + url);
  }, async () => {
    const answer = await callAI("system", [{ role: "user", content: "hello" }], 128, 4800, 2);
    assert(answer === "fallback answer", "expected second candidate answer after empty first response");
  });
});

Deno.test("Gemini transient HTTP 503 falls back to the next candidate", async () => {
// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async (input) => {
    const url = String(input);
    if (url.includes("/models?pageSize")) return catalog.clone();
    if (url.includes("gemini-3.5-flash-lite:generateContent")) return new Response("busy", { status: 503 });
    if (url.includes("gemini-3.1-flash-lite:generateContent")) return generation("recovered answer");
    throw new Error("Unexpected mocked URL: " + url);
  }, async () => {
    const answer = await callAI("system", [{ role: "user", content: "hello" }], 128, 4800, 2);
    assert(answer === "recovered answer", "expected fallback after HTTP 503");
  });
});

Deno.test("Gemini timeout falls back; exhausted timeouts return provider_http_504", async () => {
// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async (input) => {
    const url = String(input);
    if (url.includes("/models?pageSize")) return catalog.clone();
    if (url.includes("gemini-3.5-flash-lite:generateContent")) throw new DOMException("simulated timeout", "TimeoutError");
    if (url.includes("gemini-3.1-flash-lite:generateContent")) return generation("after timeout");
    throw new Error("Unexpected mocked URL: " + url);
  }, async () => {
    const answer = await callAI("system", [{ role: "user", content: "hello" }], 128, 4800, 2);
    assert(answer === "after timeout", "expected second candidate after first times out");
  });

// deno-lint-ignore require-await -- fetch mocks must preserve Promise<Response> typing.
  await withFetchMock(async (input) => {
    const url = String(input);
    if (url.includes("/models?pageSize")) return catalog.clone();
    if (url.includes(":generateContent")) throw new DOMException("simulated timeout", "TimeoutError");
    throw new Error("Unexpected mocked URL: " + url);
  }, async () => {
    let caught = "";
    try {
      await callAI("system", [{ role: "user", content: "hello" }], 128, 4800, 2);
    } catch (error) {
      caught = error instanceof Error ? error.message : String(error);
    }
    assert(caught === "provider_http_504", "expected provider_http_504 after all candidates time out; got " + caught);
  });
});
