import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import * as api from "../features/french-intelligence-compat.mjs";

const goldenPath = existsSync("tests/golden/legacy-v2.json") ? "tests/golden/legacy-v2.json" : null;
if (!goldenPath) { console.log("SKIP Section 14a parity pending approved legacy-v2 golden; legacy-v1 is preserved."); process.exit(0); }
const golden = JSON.parse(readFileSync(goldenPath, "utf8"));
function exact(fn, label) {
  try { return fn(); }
  catch (error) { return { __threw: true, name: error && error.name || "Error", message: String(error && error.message || error), label }; }
}
const groups = [
  ["dictionary variants", () => golden.inventory.dictionary.reduce((n, row) => n + row.variants.length, 0)],
  ["phrasebook English to French", () => golden.inventory.phrasebook.englishToFrench.length],
  ["phrasebook French to English", () => golden.inventory.phrasebook.frenchToEnglish.length],
  ["phrasebook regex outputs", () => golden.inventory.phrasebook.regexPatterns.length * 2],
  ["unsupported phrase outputs", () => golden.inventory.phrasebook.unsupported.length * 2],
  ["supported conjugations", () => golden.inventory.conjugation.verbs.length],
  ["unsupported conjugations", () => golden.inventory.conjugation.unsupported.length],
  ["grammar topics", () => golden.inventory.grammar.length],
  ["clean writing", () => golden.inventory.checkWriting.clean.length],
  ["hard-negative writing", () => golden.inventory.checkWriting.hardNegative.length],
  ["known-error writing", () => golden.inventory.checkWriting.knownErrors.length],
  ["edge-method outputs", () => golden.inventory.edgeInputs.length * 6]
].map(([name, count]) => ({ name, entries: count(), compared: 0, matched: 0, differences: [] }));
const byName = new Map(groups.map(group => [group.name, group]));
function compare(groupName, label, invoke, expected) {
  const group = byName.get(groupName), actual = exact(invoke, label);
  group.compared++;
  if (JSON.stringify(actual) === JSON.stringify(expected)) group.matched++;
  else group.differences.push({ label, expected, actual });
}
const inv = golden.inventory;
for (const row of inv.dictionary) for (const item of row.variants) compare("dictionary variants", "lookup:" + item.input, () => api.lookup(item.input), item.output);
for (const row of inv.phrasebook.englishToFrench) compare("phrasebook English to French", "translate:en-fr:" + row.key, () => api.translate(row.key, "en-fr"), row.output);
for (const row of inv.phrasebook.frenchToEnglish) compare("phrasebook French to English", "translate:fr-en:" + row.key, () => api.translate(row.key, "fr-en"), row.output);
for (const row of inv.phrasebook.regexPatterns) {
  compare("phrasebook regex outputs", "phrase-pattern-fr-en:" + row.index, () => api.translate(row.sample, "fr-en"), row.frEnOutput);
  compare("phrasebook regex outputs", "phrase-pattern-en-fr:" + row.index, () => api.translate(row.englishHint, "en-fr"), row.enFrOutput);
}
for (const row of inv.phrasebook.unsupported) {
  compare("unsupported phrase outputs", "unsupported-en-fr:" + row.input, () => api.translate(row.input, "en-fr"), row.enFrOutput);
  compare("unsupported phrase outputs", "unsupported-fr-en:" + row.input, () => api.translate(row.input, "fr-en"), row.frEnOutput);
}
for (const row of inv.conjugation.verbs) compare("supported conjugations", "conjugate:" + row.verb, () => api.conjugate(row.verb), row.output);
for (const row of inv.conjugation.unsupported) compare("unsupported conjugations", "unsupported-conjugate:" + row.verb, () => api.conjugate(row.verb), row.output);
for (const row of inv.grammar) compare("grammar topics", "grammar:" + row.title, () => api.answerQuestion(row.title), row.output);
for (const row of inv.checkWriting.clean) compare("clean writing", "clean:" + row.index, () => api.checkWriting(row.sentence), row.output);
for (const row of inv.checkWriting.hardNegative) compare("hard-negative writing", "hard-negative:" + row.index, () => api.checkWriting(row.sentence), row.output);
for (const row of inv.checkWriting.knownErrors) compare("known-error writing", "known-error:" + row.index, () => api.checkWriting(row.sentence), row.output);
for (const row of inv.edgeInputs) {
  const i = row.input, o = row.outputs, n = row.label;
  compare("edge-method outputs", "edge-lookup:" + n, () => api.lookup(i), o.lookup);
  compare("edge-method outputs", "edge-en-fr:" + n, () => api.translate(i, "en-fr"), o.translateEnFr);
  compare("edge-method outputs", "edge-fr-en:" + n, () => api.translate(i, "fr-en"), o.translateFrEn);
  compare("edge-method outputs", "edge-conjugate:" + n, () => api.conjugate(i), o.conjugate);
  compare("edge-method outputs", "edge-answer:" + n, () => api.answerQuestion(i), o.answerQuestion);
  compare("edge-method outputs", "edge-writing:" + n, () => api.checkWriting(i), o.checkWriting);
}
const totalCompared = groups.reduce((n, g) => n + g.compared, 0);
const totalMatched = groups.reduce((n, g) => n + g.matched, 0);
const totalDifferences = groups.reduce((n, g) => n + g.differences.length, 0);
console.log("GOLDEN PARITY TABLE");
console.log("| Golden group | Entries in golden | Compared | Matched |");
console.log("|---|---:|---:|---:|");
for (const g of groups) {
  console.log("| " + g.name + " | " + g.entries + " | " + g.compared + " | " + g.matched + " |");
  assert.equal(g.compared, g.entries, g.name + ": compared count must equal the number of golden expected-output entries");
}
console.log("| TOTAL | " + groups.reduce((n, g) => n + g.entries, 0) + " | " + totalCompared + " | " + totalMatched + " |");
assert.equal(totalCompared, 1000, "golden comparison inventory must remain at 1,000 expected-output entries");
if (totalDifferences) {
  console.error("FAIL exact golden parity: compared=" + totalCompared + " matched=" + totalMatched + " differences=" + totalDifferences);
  for (const g of groups) if (g.differences.length) console.error(g.name + ": " + JSON.stringify(g.differences.slice(0, 10), null, 2));
  process.exitCode = 1;
} else console.log("PASS exact golden parity: compared=" + totalCompared + " matched=" + totalMatched + " differences=0");
