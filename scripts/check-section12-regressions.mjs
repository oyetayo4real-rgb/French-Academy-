import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
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
equal("TR-046 only includes the adjective sense in core lookup", "noir", "adjective", core.lookup("noir").part);
equal("TR-046 only includes the adjective sense in compatibility lookup", "noir", "adjective", compatLookup("noir")?.part);

// The frozen, read-only golden is the output oracle. Do not execute the legacy implementation here.
const golden = JSON.parse(readFileSync("tests/golden/legacy-v3.json", "utf8"));
const goldenOu = golden.inventory.dictionary
  .flatMap(row => row.variants)
  .find(item => item.input === "ou")?.output;
truthy("frozen golden must contain lookup:ou", "ou", "golden lookup:ou output", goldenOu);
equal("compatibility lookup(ou) must deep-equal frozen golden lookup:ou output", "ou", goldenOu, compatLookup("ou"));

const parityInputs = [
  "je suis heureux/heureuse",
  "j'apprends le français",
  "je suis désolé(e)",
  "je suis fatigué(e)",
  "je t'aime",
  "je parle français",
  "je voudrais de l'eau",
  "à plus tard",
  "quelle heure est-il",
  "où est la gare",
  "Je suis étudiant",
  "Bonjour\\nJe vais bien.",
  "je\\tne\\tcomprends\\tpas",
  "a&b<c>d",
  "À bientôt, cœur et sœur."
];
const normalizeHeadword = value => String(value || "").toLocaleLowerCase("fr")
  .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
const hintFalseHeadwords = new Set(
  Object.entries(dictionary)
    .filter(([, entry]) => entry?.[4]?.hint === false)
    .map(([headword]) => normalizeHeadword(headword))
);
for (const input of parityInputs) {
  const actual = core.translate(input, "fr-en");
  const hints = Array.isArray(actual.vocabularyHints) ? actual.vocabularyHints : [];
  for (const hint of hints) {
    const headword = normalizeHeadword(hint.word);
    equal("Section 12 hint:false headword must not appear in vocabularyHints", input, false, hintFalseHeadwords.has(headword));
  }
}

console.log("PASS Section 12 lookup regressions: 34 headwords, homophone collisions, TR-046 adjective-only.");
console.log("PASS Section 12 hint suppression: 15 parity inputs contain no hint:false headword.");
console.log("PASS Section 12 translator hints: no hint:false dictionary entry leaks into vocabularyHints.");
