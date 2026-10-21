import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import * as extracted from "../features/french-intelligence-core-v1.mjs";

// Import the pure module before constructing any legacy/browser test harness.
assert.equal(typeof globalThis.window, "undefined");
assert.equal(typeof globalThis.document, "undefined");
for (const method of ["lookup", "translate", "conjugate", "answerQuestion", "checkWriting"]) {
  assert.equal(typeof extracted[method], "function", `pure core exports ${method}`);
}

// The old implementation is loaded in an isolated VM only as a parity oracle.
// This stub is not available to, and is never passed into, the extracted core.
const listeners = {};
const legacyWindow = {};
const legacyDocument = {
  addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
  getElementById() { return null; }
};
vm.runInNewContext(readFileSync("features/french-intelligence.js", "utf8"), {
  window: legacyWindow,
  document: legacyDocument,
  console,
  URL,
  encodeURIComponent,
  location: { reload() {} }
});
const legacy = legacyWindow.FrenchIntelligenceCore;
assert.ok(legacy, "legacy baseline exposes its public API");

const cases = {
  lookup: [
    ["bonjour"],
    ["ecole"],
    ["école"],
    ["S’il vous plaît"],
    ["hello"],
    ["xqz-not-a-word"],
    [""],
    [null]
  ],
  translate: [
    ["Thank you", "en-fr"],
    ["J'ai besoin d'aide", "fr-en"],
    ["J’ai besoin d’aide", "fr-en"],
    ["Bonjour", "fr-en"],
    ["unfamiliar sentence", "en-fr"],
    ["  ", "en-fr"],
    ["<script>alert(1)</script>", "en-fr"]
  ],
  conjugate: [
    ["être"],
    ["parler"],
    ["manger"],
    ["xyz"],
    [""],
    [null]
  ],
  answerQuestion: [
    ["What is the difference between depuis and pendant?"],
    ["Why is maison feminine?"],
    ["Explain ne pas"],
    ["an obscure unsupported question"],
    [""],
    [null]
  ],
  checkWriting: [
    ["Je suis 20 ans."],
    ["Bien que je suis fatigué, je continue."],
    ["Bonjour, je m'appelle Léa."],
    ["J’ai faim."],
    ["<img src=x onerror=alert(1)>"],
    [""],
    [null]
  ]
};

function comparable(value) {
  return value === undefined ? { __undefined: true } : JSON.parse(JSON.stringify(value));
}

let count = 0;
for (const method of Object.keys(cases)) {
  for (const args of cases[method]) {
    let expected;
    let actual;
    let legacyError;
    let coreError;
    try { expected = legacy[method](...args); } catch (error) { legacyError = error; }
    try { actual = extracted[method](...args); } catch (error) { coreError = error; }
    assert.equal(Boolean(coreError), Boolean(legacyError),
      `${method}(${JSON.stringify(args)}): thrown-error parity`);
    if (legacyError) {
      assert.equal(coreError.name, legacyError.name,
        `${method}(${JSON.stringify(args)}): error type parity`);
    } else {
      assert.deepEqual(comparable(actual), comparable(expected),
        `${method}(${JSON.stringify(args)}): return-shape/value/HTML parity`);
      if (["translate", "answerQuestion", "checkWriting"].includes(method)) {
        assert.equal(typeof actual, "string", `${method} preserves its HTML-string return type`);
        assert.equal(actual, expected, `${method} preserves exact HTML string`);
      }
    }
    count++;
  }
}
console.log(`PASS exact legacy parity: ${count} cases across lookup, translate, conjugate, answerQuestion, and checkWriting`);
