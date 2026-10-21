import assert from "node:assert/strict";
import { lookup, translate, conjugate, answerQuestion, checkWriting, writingPattern } from "../features/french-intelligence-core-v1.mjs";

// This process deliberately has no window/document globals or DOM stubs.
assert.equal(typeof globalThis.window, "undefined", "test environment must not define window");
assert.equal(typeof globalThis.document, "undefined", "test environment must not define document");
assert.equal(writingPattern("sa va").test("sa va-et-vient"), false, "a hyphenated compound must not end a writing-pattern match");
const found = lookup("bonjour");
assert.equal(found.word, "bonjour");
assert.equal(typeof found.meaning, "string");
assert.equal(typeof translate("Bonjour", "fr-en"), "string");
assert.equal(typeof conjugate("parler"), "object");
assert.equal(typeof answerQuestion("Explain ne pas"), "string");
assert.equal(typeof checkWriting("Je suis faim."), "string");
assert.equal(lookup("this-is-not-a-word"), null);
assert.equal(conjugate("notaverb"), null);
console.log("PASS DOM-free core import and five public methods");
