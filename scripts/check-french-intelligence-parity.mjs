import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as api from "../features/french-intelligence-compat.mjs";

const golden = JSON.parse(readFileSync("tests/golden/legacy-v1.json", "utf8"));
function exact(fn, label) {
  try { return fn(); }
  catch (error) { return { __threw: true, name: error && error.name || "Error", message: String(error && error.message || error), label }; }
}
let compared = 0;
let matched = 0;
const differences = [];
function compare(label, invoke, expected) {
  const actual = exact(invoke, label);
  compared++;
  if (JSON.stringify(actual) === JSON.stringify(expected)) matched++;
  else differences.push({ label, expected, actual });
}
const inv = golden.inventory;
for (const row of inv.dictionary) for (const item of row.variants) compare("lookup:" + item.input, () => api.lookup(item.input), item.output);
for (const row of inv.phrasebook.englishToFrench) compare("translate:en-fr:" + row.key, () => api.translate(row.key, "en-fr"), row.output);
for (const row of inv.phrasebook.frenchToEnglish) compare("translate:fr-en:" + row.key, () => api.translate(row.key, "fr-en"), row.output);
for (const row of inv.phrasebook.regexPatterns) {
  compare("phrase-pattern-fr-en:" + row.index, () => api.translate(row.sample, "fr-en"), row.frEnOutput);
  compare("phrase-pattern-en-fr:" + row.index, () => api.translate(row.englishHint, "en-fr"), row.enFrOutput);
}
for (const row of inv.phrasebook.unsupported) {
  compare("unsupported-en-fr:" + row.input, () => api.translate(row.input, "en-fr"), row.enFrOutput);
  compare("unsupported-fr-en:" + row.input, () => api.translate(row.input, "fr-en"), row.frEnOutput);
}
for (const row of inv.conjugation.verbs) compare("conjugate:" + row.verb, () => api.conjugate(row.verb), row.output);
for (const row of inv.conjugation.unsupported) compare("unsupported-conjugate:" + row.verb, () => api.conjugate(row.verb), row.output);
for (const row of inv.grammar) compare("grammar:" + row.title, () => api.answerQuestion(row.title), row.output);
for (const row of inv.checkWriting.clean) compare("clean:" + row.index, () => api.checkWriting(row.sentence), row.output);
for (const row of inv.checkWriting.hardNegative) compare("hard-negative:" + row.index, () => api.checkWriting(row.sentence), row.output);
for (const row of inv.checkWriting.knownErrors) compare("known-error:" + row.index, () => api.checkWriting(row.sentence), row.output);
for (const row of inv.edgeInputs) {
  const i = row.input, o = row.outputs, n = row.label;
  compare("edge-lookup:" + n, () => api.lookup(i), o.lookup);
  compare("edge-en-fr:" + n, () => api.translate(i, "en-fr"), o.translateEnFr);
  compare("edge-fr-en:" + n, () => api.translate(i, "fr-en"), o.translateFrEn);
  compare("edge-conjugate:" + n, () => api.conjugate(i), o.conjugate);
  compare("edge-answer:" + n, () => api.answerQuestion(i), o.answerQuestion);
  compare("edge-writing:" + n, () => api.checkWriting(i), o.checkWriting);
}
if (differences.length) {
  console.error("FAIL exact golden parity: compared=" + compared + " matched=" + matched + " differences=" + differences.length);
  console.error(JSON.stringify(differences.slice(0, 25), null, 2));
  process.exitCode = 1;
} else {
  assert.equal(compared, 1000, "golden inventory size must remain unchanged");
  console.log("PASS exact golden parity: compared=" + compared + " matched=" + matched + " differences=0");
}
