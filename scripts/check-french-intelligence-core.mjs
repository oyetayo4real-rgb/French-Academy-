import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("features/french-intelligence-core-v1.mjs", "utf8");
for (const forbidden of ["document.", "window.", "innerHTML", "<div", "<span", "<script", "localStorage", "fetch("]) {
  assert.equal(source.includes(forbidden), false, "pure core must not contain " + forbidden);
}
for (const key of ["window", "document", "localStorage", "fetch", "navigator"]) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: undefined });
}
const core = await import("../features/french-intelligence-core-v1.mjs");
for (const key of ["window", "document", "localStorage", "fetch", "navigator"]) assert.equal(globalThis[key], undefined);
for (const method of ["lookup", "translate", "conjugate", "answerQuestion", "checkWriting"]) assert.equal(typeof core[method], "function");
const cases = [
  core.lookup("bonjour"), core.lookup("not-a-word"),
  core.translate("Thank you", "en-fr"), core.translate("not a known phrase", "en-fr"),
  core.conjugate("être"), core.conjugate("notaverb"),
  core.answerQuestion("Explain ne ... pas"), core.answerQuestion("an unsupported question"),
  core.checkWriting("Je suis 20 ans."), core.checkWriting("Bonjour, je m'appelle Léa.")
];
for (const value of cases) {
  assert.ok(value && ["supported", "ambiguous", "unsupported"].includes(value.status));
  assert.equal(typeof value.confidence, "number");
  assert.equal(typeof value.rule_id, "string");
  assert.equal(typeof value.explanation, "string");
  assert.ok(Array.isArray(value.sources));
}
assert.equal(core.lookup("bonjour").word, "bonjour");
assert.equal(core.lookup("not-a-word").status, "unsupported");
assert.deepEqual(core.conjugate("être").forms, ["suis", "es", "est", "sommes", "êtes", "sont"]);
assert.equal(core.translate("Thank you", "en-fr").translation, "merci");
assert.equal(core.checkWriting("Je suis 20 ans.").corrected, "j'ai 20 ans.");
console.log("PASS DOM-free structured core and forbidden-string static check");
