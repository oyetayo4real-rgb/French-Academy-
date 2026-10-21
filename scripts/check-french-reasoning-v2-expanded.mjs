/**
 * Expanded adversarial checks for French Reasoning V2.
 *
 * These are engineering-review examples, not independent teacher approval.
 * Their purpose is to test exact outputs, source metadata, scope boundaries,
 * apostrophe/case handling, ambiguity, and no-auto-correction behavior.
 */
"use strict";
import assert from "node:assert/strict";
import "../features/french-reasoning-v2.js";

const engine = globalThis.FrenchReasoningV2;
assert.ok(engine, "FrenchReasoningV2 must be loaded");

let failures = 0;
let total = 0;
function check(name, fn) {
  total++;
  try {
    fn();
    console.log("PASS " + name);
  } catch (error) {
    failures++;
    console.error("FAIL " + name + ": " + error.message);
  }
}

const exactVariants = [
  ["uppercase spelling preserves case", "MERÇI !", "MERCI !", "SP-001"],
  ["mixed-case spelling preserves initial capitalization", "Merçi, monsieur.", "Merci, monsieur.", "SP-001"],
  ["spelling correction preserves surrounding text", "Bonjour. Beacoup de gens arrivent !", "Bonjour. Beaucoup de gens arrivent !", "SP-002"],
  ["accent correction preserves surrounding text", "Une reponse claire.", "Une réponse claire.", "SP-003"],
  ["curly apostrophe subjunctive form", "Bien qu’il a tort.", "Bien qu’il ait tort.", "GR-001"],
  ["curly apostrophe first-person subjunctive", "Bien que j’ai peur.", "Bien que j’aie peur.", "GR-002"],
  ["subject and past participle correction", "Elles sont arrivé hier.", "Elles sont arrivées hier.", "AG-001"],
  ["preceding direct object agreement", "Les crêpes qu’elle a mangé sont froides.", "Les crêpes qu’elle a mangées sont froides.", "AG-002"],
  ["subject verb comma correction", "Les enfants, jouent dehors.", "Les enfants jouent dehors.", "PU-001"]
];

for (const [name, input, expected, ruleId] of exactVariants) {
  check(name, () => {
    const result = engine.check(input);
    assert.equal(result.status, "corrected");
    assert.equal(result.correction, expected);
    const finding = result.findings.find((f) => f.ruleId === ruleId);
    assert.ok(finding, "expected rule finding " + ruleId);
    assert.ok(finding.explanation && finding.explanation.length > 10);
  });
}

const doNotRewrite = [
  "Sa vache est dans le pré.",
  "Sa valise est lourde.",
  "Sa vaisselle est propre.",
  "Sa mère va bien.",
  "Il avance pas à pas.",
  "Je ne comprends pas encore.",
  "Je ne comprends pas du tout.",
  "Bien qu'il ait tort, il reste calme.",
  "Après qu'il est arrivé, nous avons commencé.",
  "Les enfants jouent dans le parc.",
  "Elles sont arrivées hier.",
  "Les crêpes qu'elle a mangées sont froides.",
  "Je parle français à l'école.",
  "Je suis allé à Paris hier.",
  "Nous avons faim après le voyage.",
  "Ça va bien.",
  "Merci pour votre réponse."
];

for (const input of doNotRewrite) {
  check("hard negative is not auto-corrected: " + input, () => {
    const result = engine.check(input);
    assert.notEqual(result.status, "corrected");
    assert.equal(result.correction, null);
  });
}

const uncertainCases = [
  ["J'achète une livre.", "SEM-001"],
  ["Je parle le français à l'école.", "SEM-003"]
];
for (const [input, ruleId] of uncertainCases) {
  check("meaning/context stays uncertain: " + input, () => {
    const result = engine.check(input);
    assert.equal(result.status, "not_sure");
    assert.equal(result.correction, null);
    assert.ok(result.findings.some((f) => f.ruleId === ruleId));
    assert.ok(result.alternatives.length >= 2);
  });
}

const grammarNotes = [
  "Il parle lentement pour qu'il va comprendre.",
  "Il parle lentement pour qu’il va comprendre.",
  "Je répète afin que je vais comprendre."
];
for (const input of grammarNotes) {
  check("aller + infinitive is a note, not an automatic rewrite: " + input, () => {
    const result = engine.check(input);
    assert.equal(result.status, "needs_review");
    assert.equal(result.correction, null);
    assert.equal(result.findings[0].ruleId, "GR-006");
  });
}

check("source-backed corrections include a source URL", () => {
  for (const [input, ruleId] of [
    ["Beacoup de gens arrivent.", "SP-002"],
    ["Merci pour votre reponse.", "SP-003"],
    ["Je suis faim.", "WR-002"],
    ["Je suis soif.", "WR-003"],
    ["Bien qu'il a tort.", "GR-001"],
    ["Elles sont arrivé hier.", "AG-001"],
    ["Les crêpes qu'elle a mangé sont froides.", "AG-002"]
  ]) {
    const result = engine.check(input);
    const finding = result.findings.find((f) => f.ruleId === ruleId);
    assert.ok(finding, "missing finding " + ruleId);
    assert.ok(typeof finding.source === "string" && finding.source.startsWith("https://"), "missing source URL for " + ruleId);
  }
});

check("empty and whitespace-only input never produce a correction", () => {
  for (const input of ["", " ", "\n\t"]) {
    const result = engine.check(input);
    assert.equal(result.status, "not_sure");
    assert.equal(result.correction, null);
    assert.equal(result.confidence, 0);
  }
});

console.log("Expanded adversarial suite: " + total + " checks; " + failures + " failed.");
console.log("These are engineering-authored adversarial tests, not a substitute for independent qualified linguistic review.");
if (failures) process.exitCode = 1;
