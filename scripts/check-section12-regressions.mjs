import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import * as core from "../features/french-intelligence-core-v1.mjs";
import { dictionary } from "../features/french-data.mjs";
import { lookup as compatLookup, translate as compatTranslate } from "../features/french-intelligence-compat.mjs";

function reportFailure(message, input, expected, actual) {
  const payload = { input, expected, actual };
  console.error(JSON.stringify(payload, null, 2));
  throw new Error(message);
}
function equal(message, input, expected, actual) {
  if (!isDeepStrictEqual(actual, expected)) reportFailure(message, input, expected, actual);
}
function truthy(message, input, expected, actual) {
  if (!actual) reportFailure(message, input, expected, actual);
}

const addedHeadwords = ["tout","beau","leurs","leur","vieux","œil","gens","cœur","je","ne","me","ce","que","le","la","falloir","si","quoi","dont","est-ce que","autre","quel","un","heure","an","air","accord","histoire","idée","argent","année","affaire","bras","noir"];
for (const headword of addedHeadwords) {
  const result = core.lookup(headword);
  equal("core lookup must support added headword: " + headword, headword, "supported", result.status);
  equal("core lookup must preserve canonical headword: " + headword, headword, headword, result.word);
  const compatibilityResult = compatLookup(headword);
  truthy("compatibility lookup must support added headword: " + headword, headword, "non-null lookup result", compatibilityResult);
}

for (const input of ["a", "à"]) {
  const result = core.lookup(input);
  equal("core lookup must not reverse-match " + input + " to un/a; an; one", input, "unsupported", result.status);
  equal(input + " must not resolve to un", input, false, result.word === "un");
  equal(input + " must not resolve to the un gloss", input, false, result.meaning === "a; an; one");
  equal("compatibility lookup must not reverse-match " + input + " to un/a; an; one", input, null, compatLookup(input));
}
equal("où must retain its accented canonical headword", "où", "où", core.lookup("où").word);
equal("compatibility lookup must retain où, not alias it to ou", "où", "où", compatLookup("où")?.word);
equal("ou must not alias to où", "ou", "unsupported", core.lookup("ou").status);
equal("compatibility lookup must not alias ou to où", "ou", null, compatLookup("ou"));
equal("TR-046 only includes the adjective sense in core lookup", "noir", "adjective", core.lookup("noir").part);
equal("TR-046 only includes the adjective sense in compatibility lookup", "noir", "adjective", compatLookup("noir")?.part);

// These are deliberately compared against the unchanged legacy browser implementation.
// The compatibility renderer is the public HTML-output adapter over the extracted core.
const legacySource = readFileSync("features/french-intelligence.js", "utf8");
const listeners = {};
const document = {
  addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
  getElementById() { return null; }
};
const window = {};
vm.runInNewContext(legacySource, {
  document, window, console, URL, encodeURIComponent,
  location: { reload() {} }
});
const legacy = window.FrenchIntelligenceCore;
truthy("legacy implementation must expose translate", "legacy API", "translate function", typeof legacy?.translate === "function");

const differentialCases = [
  ["je suis heureux/heureuse", "phrasebook:heureux"],
  ["j'apprends le français", "phrasebook:apprends"],
  ["je suis désolé(e)", "phrasebook:désolé"],
  ["je suis fatigué(e)", "phrasebook:fatigué"],
  ["je t'aime", "phrasebook:aime"],
  ["je parle français", "phrasebook:parle"],
  ["je voudrais de l'eau", "phrasebook:eau"],
  ["à plus tard", "phrasebook:plus-tard"],
  ["quelle heure est-il", "phrasebook:heure"],
  ["où est la gare", "phrasebook:gare"],
  ["Je suis étudiant", "phrasebook:étudiant"],
  ["Bonjour\nJe vais bien.", "edge:newline"],
  ["je\tne\tcomprends\tpas", "edge:tabs"],
  ["a&b<c>d", "edge:angle-chain"],
  ["À bientôt, cœur et sœur.", "edge:accented-words"]
];

for (const [input, label] of differentialCases) {
  const expected = legacy.translate(input, "fr-en");
  const actual = compatTranslate(input, "fr-en");
  equal("core-backed translation must deep-equal legacy output (" + label + ")", input, expected, actual);

  const structured = core.translate(input, "fr-en");
  const hints = Array.isArray(structured.vocabularyHints) ? structured.vocabularyHints : [];
  for (const hint of hints) {
    const resolved = core.lookup(hint.word);
    const canonical = resolved?.word;
    const metadata = canonical ? dictionary[canonical]?.[4] : undefined;
    equal("hint:false dictionary entries must never appear in vocabularyHints (" + label + ")", input, false, metadata?.hint === false);
    equal("vocabularyHints entries must not expose hint:false (" + label + ")", input, false, hint.hint === false);
  }
}

console.log("PASS Section 12 lookup regressions: 34 headwords, homophone collisions, TR-046 adjective-only.");
console.log("PASS Section 12 translation differential: 15 inputs match the unchanged legacy implementation.");
console.log("PASS Section 12 translator hints: no hint:false dictionary entry leaks into vocabularyHints.");
