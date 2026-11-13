import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Characterization tests intentionally exercise the existing legacy bootstrap.
// They record observable behaviour before pure-core extraction; this is not
// the DOM-free acceptance test, which will be added with the extracted core.
const source = readFileSync("features/french-intelligence.js", "utf8");
const listeners = {};
const document = {
  addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
  getElementById() { return null; }
};
const window = {};
vm.runInNewContext(source, {
  document, window, console, URL, encodeURIComponent,
  location: { reload() {} }
});
const core = window.FrenchIntelligenceCore;
assert.ok(core, "legacy core API is exposed");
assert.deepEqual(Object.keys(core).sort(), [
  "answerQuestion", "checkWriting", "conjugate", "lookup", "translate"
].sort(), "legacy API method names remain stable");

const cases = [
  ["lookup: canonical entry", () => core.lookup("bonjour"), value =>
    assert.deepEqual(JSON.parse(JSON.stringify(value)), {
      word: "bonjour", meaning: "hello; good morning", part: "interjection",
      example: "Bonjour, comment allez-vous ?",
      notes: "A standard greeting; use bonsoir in the evening.", builtIn: true
    })],
  ["lookup: accent-insensitive entry", () => core.lookup("ecole"), value =>
    assert.equal(value?.word, "école")],
  ["lookup: unsupported entry", () => core.lookup("xqz-not-a-word"), value =>
    assert.equal(value, null)],
  ["translate: English to French known phrase", () => core.translate("Thank you", "en-fr"), value => {
    assert.equal(typeof value, "string");
    assert.match(value, /French:/);
    assert.match(value, /merci/);
    assert.match(value, /Known phrasebook match/);
  }],
  ["translate: French to English known phrase", () => core.translate("J'ai besoin d'aide", "fr-en"), value => {
    assert.equal(typeof value, "string");
    assert.match(value, /I need help/);
  }],
  ["translate: empty input", () => core.translate("  ", "en-fr"), value =>
    assert.equal(value, "Enter some text first.")],
  ["conjugate: irregular verb", () => core.conjugate("être"), value =>
    assert.deepEqual(JSON.parse(JSON.stringify(value)), {
      v: "être", forms: ["suis", "es", "est", "sommes", "êtes", "sont"],
      type: "Irregular verb · present tense"
    })],
  ["conjugate: regular -er verb", () => core.conjugate("parler"), value =>
    assert.deepEqual(JSON.parse(JSON.stringify(value)), {
      v: "parler", forms: ["parle", "parles", "parle", "parlons", "parlez", "parlent"],
      type: "Regular -er verb · present tense"
    })],
  ["conjugate: unsupported verb", () => core.conjugate("xyz"), value =>
    assert.equal(value, null)],
  ["answerQuestion: supported grammar distinction", () =>
    core.answerQuestion("What is the difference between depuis and pendant?"), value => {
      assert.equal(typeof value, "string");
      assert.match(value, /Depuis vs pendant/);
      assert.match(value, /continuing now/);
    }],
  ["answerQuestion: unknown question uses safe fallback", () =>
    core.answerQuestion("Explain a very obscure French construction"), value => {
      assert.equal(typeof value, "string");
      assert.match(value, /couldn't match this question confidently/);
    }],
  ["answerQuestion: empty question", () => core.answerQuestion(""), value =>
    assert.equal(value, "Type a question first.")],
  ["checkWriting: known correction", () => core.checkWriting("Je suis 20 ans."), value => {
    assert.equal(typeof value, "string");
    assert.match(value, /Suggested text/);
    assert.match(value, /j'ai 20 ans/);
  }],
  ["checkWriting: known grammar note", () =>
    core.checkWriting("Bien que je suis fatigué, je continue."), value => {
      assert.match(value, /sois/);
      assert.match(value, /Suggested text|Grammar note/);
    }],
  ["checkWriting: clean sentence disclaimer", () =>
    core.checkWriting("Bonjour, je m'appelle Léa."), value => {
      assert.match(value, /No issue from the small built-in check list was detected/);
      assert.match(value, /does not prove the sentence is fully correct/);
    }]
];

for (const [name, invoke, verify] of cases) {
  const result = invoke();
  verify(result);
  console.log("PASS " + name);
}
console.log(`Passed ${cases.length} legacy characterization cases across all five methods.`);
