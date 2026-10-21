"use strict";
const assert = require("node:assert/strict");
const engine = require("../features/french-reasoning-v2.js");

const exactCorrections = [
  ["spelling", "Merçi beaucoup.", "Merci beaucoup.", "SP-001"],
  ["spelling", "Beacoup de gens arrivent.", "Beaucoup de gens arrivent.", "SP-002"],
  ["diacritics", "Merci pour votre reponse.", "Merci pour votre réponse.", "SP-003"],
  ["spelling", "Bonjor, madame.", "Bonjour, madame.", "SP-004"],
  ["usage", "Je suis 20 ans.", "J'ai 20 ans.", "WR-001"],
  ["usage", "Je suis faim.", "J'ai faim.", "WR-002"],
  ["usage", "Je suis soif.", "J'ai soif.", "WR-003"],
  ["spelling", "Sa va bien.", "Ça va bien.", "WR-004"],
  ["syntax", "Je ne comprends pas pas.", "Je ne comprends pas.", "WR-005"],
  ["conjugation", "Bien qu'il a tort.", "Bien qu'il ait tort.", "GR-001"],
  ["conjugation", "Bien que j'ai peur.", "Bien que j'aie peur.", "GR-002"],
  ["conjugation", "Bien que nous avons faim.", "Bien que nous ayons faim.", "GR-003"],
  ["conjugation", "Bien que vous êtes prêts.", "Bien que vous soyez prêts.", "GR-004"],
  ["conjugation", "Bien qu'ils sont fatigués.", "Bien qu'ils soient fatigués.", "GR-005"],
  ["agreement", "Elles sont arrivé hier.", "Elles sont arrivées hier.", "AG-001"],
  ["agreement", "Les crêpes qu'elle a mangé sont froides.", "Les crêpes qu'elle a mangées sont froides.", "AG-002"],
  ["punctuation", "Les enfants, jouent dans le parc.", "Les enfants jouent dans le parc.", "PU-001"]
];

const noFlag = [
  "Sa vache est dans le pré.",
  "Sa valise est lourde.",
  "Sa vaisselle est propre.",
  "Sa mère va bien.",
  "Il avance pas à pas.",
  "Bien que très fatigué, il continue.",
  "Après qu'il est arrivé, nous avons commencé.",
  "Je sais que tu es prêt, et je veux que tout soit terminé.",
  "Naturellement, il est inquiet."
];

const ambiguous = [
  "J'achète une livre de beurre.",
  "Je parle le français à l'école."
];

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("PASS " + name); }
  catch (error) { failed++; console.error("FAIL " + name + ": " + error.message); }
}

for (const [category, input, expected, ruleId] of exactCorrections) {
  check("exact " + category + " correction: " + input, () => {
    const result = engine.check(input);
    assert.equal(result.status, "corrected");
    assert.equal(result.correction, expected);
    assert.ok(result.findings.some((finding) => finding.ruleId === ruleId));
    assert.ok(result.findings.every((finding) => typeof finding.explanation === "string" && finding.explanation.length > 10));
    assert.ok(result.findings.every((finding) => finding.confidence >= 0.9));
  });
}

for (const input of noFlag) {
  check("no automatic correction: " + input, () => {
    const result = engine.check(input);
    assert.notEqual(result.status, "corrected");
    assert.equal(result.correction, null);
  });
}

for (const input of ambiguous) {
  check("explicit uncertainty: " + input, () => {
    const result = engine.check(input);
    assert.equal(result.status, "not_sure");
    assert.equal(result.correction, null);
    assert.ok(result.findings.length > 0);
  });
}

check("aller + infinitive produces a grammar note, not a local rewrite", () => {
  const result = engine.check("Il parle lentement pour qu'il va comprendre.");
  assert.equal(result.status, "needs_review");
  assert.equal(result.correction, null);
  assert.equal(result.findings[0].ruleId, "GR-006");
});

check("tokenizer identifies contractions and punctuation", () => {
  const result = engine.analyze("J'ai faim, mais je ne comprends pas.");
  assert.ok(result.contractions.some((item) => item.token.toLowerCase().includes("'")));
  assert.ok(result.tokens.some((item) => item.value === ","));
  assert.ok(result.negation.some((item) => item.role === "negation-particle"));
  assert.ok(result.negation.some((item) => item.role === "negative-marker"));
});

check("analysis exposes clauses and verb candidates", () => {
  const result = engine.analyze("Bien que j'aie peur, je reste.");
  assert.ok(Array.isArray(result.clauses));
  assert.ok(result.clauses.length > 0);
  assert.ok(Array.isArray(result.verbForms));
  assert.ok(result.grammaticalRoles.length > 0);
});

check("empty input is explicitly not sure", () => {
  const result = engine.check("   ");
  assert.equal(result.status, "not_sure");
  assert.equal(result.confidence, 0);
});

console.log("Phase 2 alpha: " + (exactCorrections.length + noFlag.length + ambiguous.length + 4) + " assertions across spelling, diacritics, conjugation, agreement, syntax, punctuation, meaning, and analysis.");
console.log("Exact correction cases: " + exactCorrections.length + "; no-auto-correction cases: " + noFlag.length + "; uncertainty cases: " + ambiguous.length + ".");
if (failed) process.exitCode = 1;
else console.log("All Phase 2 alpha tests passed.");
