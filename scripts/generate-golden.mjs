#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import { dirname } from "node:path";

const GOLDEN_SOURCE_SHA = "7316057d6de9cbbdb976f3998d56228e4cf24fa9";
const LEGACY_PATH = "features/french-intelligence.js";
const TEST_PATH = "scripts/check-french-intelligence.mjs";
const OUTPUT_PATH = "tests/golden/legacy-v1.json";
const SHA_PATH = "tests/golden/legacy-v1.sha256";

function extractLiteral(source, marker, opening) {
  const at = source.indexOf(marker);
  if (at < 0) throw new Error("Missing initializer: " + marker);
  const equals = source.indexOf("=", at + marker.length);
  const start = source.indexOf(opening, equals + 1);
  if (equals < 0 || start < 0) throw new Error("Malformed initializer: " + marker);
  const closers = { "{": "}", "[": "]", "(": ")" };
  const stack = [];
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = start; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = "";
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (closers[ch]) stack.push(closers[ch]);
    else if (ch === "}" || ch === "]" || ch === ")") {
      if (stack.pop() !== ch) throw new Error("Mismatched delimiter in " + marker);
      if (!stack.length) return source.slice(start, i + 1);
    }
  }
  throw new Error("Unterminated initializer: " + marker);
}

function extractPhrasePatterns(source) {
  const at = source.indexOf("const phraseMap");
  const start = source.indexOf("[", at);
  const end = source.indexOf("\n  ];", start);
  if (at < 0 || start < 0 || end < 0) throw new Error("Could not locate phraseMap array");
  return source.slice(start, end + 4);
}

function evaluate(literal, label) {
  try { return vm.runInNewContext("(" + literal + ")", Object.create(null), { timeout: 2000 }); }
  catch (error) { throw new Error("Could not parse " + label + ": " + error.message); }
}

function variantsFor(word) {
  const out = new Set([word]);
  const apostrophes = (value) => {
    const chars = [...value], positions = [];
    chars.forEach((ch, i) => { if (ch === "'" || ch === "’") positions.push(i); });
    if (positions.length > 8) {
      out.add(value.replace(/[’]/g, "'"));
      out.add(value.replace(/[']/g, "’"));
      return;
    }
    for (let mask = 0; mask < (1 << positions.length); mask++) {
      const copy = chars.slice();
      positions.forEach((pos, bit) => { copy[pos] = (mask & (1 << bit)) ? "’" : "'"; });
      out.add(copy.join(""));
    }
  };
  apostrophes(word);
  const plain = word.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
  out.add(plain);
  apostrophes(plain);
  return [...out].sort((a, b) => a.localeCompare(b, "fr"));
}

function regexSample(regex) {
  let s = regex.source.replace(/^\^|\$$/g, "").replace(/\\b/g, "");
  s = s.replace(/\\s[+*?]?/g, " ").replace(/\\d/g, "1").replace(/\\p\{L\}/g, "a");
  s = s.replace(/\[(?:\\.|[^\]])*\]/g, (part) => part.slice(1, -1).replace(/\\(.)/g, "$1").replace(/^\^/, "").charAt(0) || "a");
  s = s.replace(/\(\?:/g, "(").replace(/\(([^()|]+)\|[^()]*\)/g, "$1");
  s = s.replace(/\\(.)/g, "$1").replace(/[?+*{}]/g, "").replace(/[()]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

function loadLegacy(source) {
  const listeners = {};
  const document = {
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    getElementById() { return null; }
  };
  const window = {};
  vm.runInNewContext(source, {
    document, window, console, URL, encodeURIComponent,
    location: { reload() {} }
  }, { timeout: 5000, displayErrors: true });
  const api = window.FrenchIntelligenceCore;
  for (const name of ["lookup", "translate", "conjugate", "answerQuestion", "checkWriting"]) {
    if (!api || typeof api[name] !== "function") throw new Error("Missing legacy API method: " + name);
  }
  return api;
}

function exact(fn, label) {
  try { return fn(); }
  catch (error) { return { __threw: true, name: error && error.name || "Error", message: String(error && error.message || error), label }; }
}

function main() {
  const legacySource = execFileSync("git", ["show", GOLDEN_SOURCE_SHA + ":" + LEGACY_PATH], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const testSource = readFileSync(TEST_PATH, "utf8");
  const api = loadLegacy(legacySource);
  const dictionary = evaluate(extractLiteral(legacySource, "const dictionary", "{"), "dictionary");
  const irregular = evaluate(extractLiteral(legacySource, "const irregular", "{"), "irregular verbs");
  const rules = evaluate(extractLiteral(legacySource, "const rules", "["), "grammar rules");
  const pairs = evaluate(extractLiteral(legacySource, "const pairs", "{"), "phrasebook pairs");
  const phraseMap = evaluate(extractPhrasePatterns(legacySource), "phrasebook regex patterns");
  const clean = evaluate(extractLiteral(testSource, "const cleanSentenceCorpus", "["), "clean sentence corpus");
  const hardNegative = evaluate(extractLiteral(testSource, "const hardNegativeSentences", "["), "hard-negative corpus");
  const knownErrors = evaluate(extractLiteral(testSource, "const knownErrors", "["), "known-error corpus");

  const dictionaryInventory = Object.keys(dictionary).sort((a, b) => a.localeCompare(b, "fr")).map(headword => ({
    headword,
    variants: variantsFor(headword).map(input => ({ input, output: exact(() => api.lookup(input), "lookup:" + input) }))
  }));
  const enFr = Object.keys(pairs).sort().map(key => ({ key, output: exact(() => api.translate(key, "en-fr"), "translate:en-fr:" + key) }));
  const frEn = Object.keys(pairs).sort().map(key => ({ sourceEnglishKey: key, key: pairs[key], output: exact(() => api.translate(pairs[key], "fr-en"), "translate:fr-en:" + pairs[key]) }));
  const patternInventory = phraseMap.map((pair, index) => {
    const sample = regexSample(pair[0]);
    return {
      index, pattern: pair[0].source, flags: pair[0].flags, englishHint: pair[1], sample,
      frEnOutput: exact(() => api.translate(sample, "fr-en"), "phrase-pattern-fr-en:" + index),
      enFrOutput: exact(() => api.translate(pair[1], "en-fr"), "phrase-pattern-en-fr:" + index)
    };
  });
  const unsupportedPhrases = Array.from({ length: 30 }, (_, i) => "qzxv-unsupported-phrase-" + String(i + 1).padStart(2, "0")).map(input => ({
    input,
    enFrOutput: exact(() => api.translate(input, "en-fr"), "unsupported-en-fr:" + input),
    frEnOutput: exact(() => api.translate(input, "fr-en"), "unsupported-fr-en:" + input)
  }));

  const persons = ["je / j'", "tu", "il / elle / on", "nous", "vous", "ils / elles"];
  const verbKeys = Object.keys(dictionary).filter(key => /verb/i.test(String(dictionary[key][1] || "")));
  const verbs = [...new Set([...Object.keys(irregular), ...verbKeys, "manger", "commencer"])].sort((a, b) => a.localeCompare(b, "fr")).map(verb => {
    const result = exact(() => api.conjugate(verb), "conjugate:" + verb);
    const forms = result && Array.isArray(result.forms) ? result.forms : null;
    return { verb, output: result, persons: forms ? persons.map((person, i) => ({ person, form: forms[i] })) : [] };
  });
  const unsupportedVerbs = Array.from({ length: 30 }, (_, i) => "qzxvverb" + String(i + 1).padStart(2, "0") + "x").map(verb => ({
    verb, output: exact(() => api.conjugate(verb), "unsupported-conjugate:" + verb)
  }));
  const grammar = rules.map(rule => ({ title: rule.title, body: rule.body, output: exact(() => api.answerQuestion(rule.title), "grammar:" + rule.title) }));
  const cleanResults = clean.map((sentence, i) => ({ index: i + 1, sentence, output: exact(() => api.checkWriting(sentence), "clean:" + (i + 1)) }));
  const hardResults = hardNegative.map((sentence, i) => ({ index: i + 1, sentence, output: exact(() => api.checkWriting(sentence), "hard-negative:" + (i + 1)) }));
  const errorResults = knownErrors.map((item, i) => ({
    index: i + 1, rule: item.rule, sentence: item.sentence, expected: item.expected,
    messageOnly: Boolean(item.messageOnly), output: exact(() => api.checkWriting(item.sentence), "known-error:" + (i + 1))
  }));

  const edgeInputs = [
    { label: "empty", input: "" },
    { label: "whitespace-only", input: "   \t  " },
    { label: "5000-characters", input: "A".repeat(5000) },
    { label: "emoji-only", input: "😀🧑🏽‍🚀🇫🇷" },
    { label: "emoji-with-text", input: "J'aime 🇫🇷 😊." },
    { label: "combining-acute", input: "e\u0301cole" },
    { label: "combining-cedilla", input: "garc\u0327on" },
    { label: "angle-ampersand-quotes", input: "<tag> & \"double\" 'single'" },
    { label: "straight-apostrophes", input: "j'ai besoin d'aide" },
    { label: "curly-apostrophes", input: "j’ai besoin d’aide" },
    { label: "guillemets", input: "« bonjour »" },
    { label: "uppercase-accent", input: "ÉCOLE" },
    { label: "punctuation", input: "!!! ??? … —" },
    { label: "newline", input: "Bonjour\nJe vais bien." },
    { label: "tabs", input: "je\tne\tcomprends\tpas" },
    { label: "null", input: null },
    { label: "number", input: 12345 },
    { label: "false", input: false },
    { label: "zero-width-space", input: "bon\u200Bjour" },
    { label: "combining-marks-only", input: "\u0301\u0327" },
    { label: "script-like", input: "<script>alert(\"x\")</script>" },
    { label: "angle-chain", input: "a&b<c>d" },
    { label: "curly-double-quotes", input: "“l'école”" },
    { label: "modifier-apostrophe", input: "jʼai" },
    { label: "curly-elision", input: "l’école" },
    { label: "accented-words", input: "À bientôt, cœur et sœur." },
    { label: "emoji-plus-combining", input: "e\u0301😀" },
    { label: "nonbreaking-space", input: "bonjour\u00A0madame" },
    { label: "punctuation-wrapped", input: "« … bonjour !!! »" },
    { label: "mixed-entities-quotes", input: "\"<&>\" '« & »' \u00A0" }
  ];
  const edges = edgeInputs.map((item, i) => ({
    index: i + 1, label: item.label, input: item.input,
    outputs: {
      lookup: exact(() => api.lookup(item.input), "edge-lookup:" + item.label),
      translateEnFr: exact(() => api.translate(item.input, "en-fr"), "edge-en-fr:" + item.label),
      translateFrEn: exact(() => api.translate(item.input, "fr-en"), "edge-fr-en:" + item.label),
      conjugate: exact(() => api.conjugate(item.input), "edge-conjugate:" + item.label),
      answerQuestion: exact(() => api.answerQuestion(item.input), "edge-answer:" + item.label),
      checkWriting: exact(() => api.checkWriting(item.input), "edge-writing:" + item.label)
    }
  }));

  const counts = {
    dictionaryHeadwords: Object.keys(dictionary).length,
    dictionaryLookupVariants: dictionaryInventory.reduce((n, row) => n + row.variants.length, 0),
    phrasebookEnglishKeys: Object.keys(pairs).length,
    phrasebookFrenchValues: Object.keys(pairs).length,
    phrasebookRegexPatterns: phraseMap.length,
    unsupportedPhraseInputs: unsupportedPhrases.length,
    unsupportedPhraseCalls: unsupportedPhrases.length * 2,
    conjugationVerbs: verbs.length,
    unsupportedConjugationVerbs: unsupportedVerbs.length,
    grammarTopics: grammar.length,
    cleanSentences: cleanResults.length,
    hardNegativeSentences: hardResults.length,
    knownErrorSentences: errorResults.length,
    edgeInputs: edges.length,
    edgeMethodCalls: edges.length * 6
  };
  const payload = {
    schemaVersion: 1,
    goldenSource: {
      commit: GOLDEN_SOURCE_SHA,
      path: LEGACY_PATH,
      retrieval: "git show " + GOLDEN_SOURCE_SHA + ":" + LEGACY_PATH,
      domStub: "same minimal document/window/location stub as scripts/characterize-french-intelligence.mjs"
    },
    inventoryCounts: counts,
    inventory: {
      dictionary: dictionaryInventory,
      phrasebook: { englishToFrench: enFr, frenchToEnglish: frEn, regexPatterns: patternInventory, unsupported: unsupportedPhrases },
      conjugation: { persons, verbs, unsupported: unsupportedVerbs },
      grammar,
      checkWriting: { clean: cleanResults, hardNegative: hardResults, knownErrors: errorResults },
      edgeInputs: edges
    }
  };
  const jsonText = JSON.stringify(payload, null, 2) + "\n";
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, jsonText, "utf8");
  const digest = createHash("sha256").update(jsonText, "utf8").digest("hex");
  writeFileSync(SHA_PATH, digest + "  " + OUTPUT_PATH + "\n", "utf8");
  console.log("Golden source SHA: " + GOLDEN_SOURCE_SHA);
  for (const [name, count] of Object.entries(counts)) console.log("INVENTORY " + name + ": " + count);
  console.log("Wrote " + OUTPUT_PATH + " and " + SHA_PATH);
}
main();
