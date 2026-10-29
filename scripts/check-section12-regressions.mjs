import assert from "node:assert/strict";
import * as core from "../features/french-intelligence-core-v1.mjs";
import { lookup as compatLookup } from "../features/french-intelligence-compat.mjs";

const addedHeadwords = ["tout","beau","leurs","leur","vieux","œil","gens","cœur","je","ne","me","ce","que","le","la","falloir","si","quoi","dont","est-ce que","autre","quel","un","heure","an","air","accord","histoire","idée","argent","année","affaire","bras","noir"];
for (const headword of addedHeadwords) {
  const result = core.lookup(headword);
  assert.equal(result.status, "supported", "core lookup must support added headword: " + headword);
  assert.equal(result.word, headword, "core lookup must preserve canonical headword: " + headword);
  assert.ok(compatLookup(headword), "compatibility lookup must support added headword: " + headword);
}
for (const input of ["a", "à"]) {
  const result = core.lookup(input);
  assert.equal(result.status, "unsupported", "core lookup must not reverse-match " + input + " to un/a; an; one");
  assert.notEqual(result.word, "un", input + " must not resolve to un");
  assert.notEqual(result.meaning, "a; an; one", input + " must not resolve to the un gloss");
  assert.equal(compatLookup(input), null, "compatibility lookup must not reverse-match " + input + " to un/a; an; one");
}
assert.equal(core.lookup("où").word, "où", "où must retain its accented canonical headword");
assert.equal(compatLookup("où")?.word, "où", "compatibility lookup must retain où, not alias it to ou");
assert.equal(core.lookup("ou").status, "unsupported", "ou must not alias to où");
assert.equal(compatLookup("ou"), null, "compatibility lookup must not alias ou to où");
assert.equal(core.lookup("noir").part, "adjective", "TR-046 only includes the adjective sense");
assert.equal(compatLookup("noir")?.part, "adjective", "compatibility TR-046 only includes the adjective sense");
const hintCases = [
  ["je suis heureux/heureuse", "je"],
  ["j'apprends le français", "le"],
  ["à plus tard", "à"],
  ["à bientôt", "cœur"]
];
for (const [input, forbiddenWord] of hintCases) {
  const result = core.translate(input, "fr-en");
  assert.ok(Array.isArray(result.vocabularyHints), "expected ambiguous translation hints for " + input);
  assert.equal(result.vocabularyHints.some(hint => hint.word.toLocaleLowerCase("fr") === forbiddenWord), false, "hint:false entry leaked into translation hints for " + input);
}
console.log("PASS Section 12 lookup regressions: 34 headwords, homophone collisions, TR-046 adjective-only.");
console.log("PASS Section 12 translator hints: hint:false entries are suppressed without disabling direct lookup.");
