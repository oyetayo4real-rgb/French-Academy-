import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dictionary } from "../features/french-data.mjs";
import { M1_VOCABULARY_HEADWORDS } from "../features/french-vocabulary-m1.mjs";
import { lookup } from "../features/french-intelligence-core-v1.mjs";

const immutableFiles = new Map([
  ["data/m1-glosses-draft.json", "6a445026ae30437be525b2e0cb4e6f84ab46fc94dea337aff40fcac728059dc3"],
  ["tests/reference/tense-reference.json", "4bf5fe499f30dad033dd8e535d5fb9ef424636745b0459be8402c135e717de8f"]
]);
for (const [path, expected] of immutableFiles) {
  const bytes = readFileSync(new URL("../" + path, import.meta.url));
  const actual = createHash("sha256").update(bytes).digest("hex");
  assert.equal(actual, expected, path + " SHA-256 changed; only the repository owner may update this reference and its pinned checksum.");
}
assert.equal(existsSync(new URL("../m1-glosses-draft.json", import.meta.url)), false, "owner gloss draft must be moved out of the repository root");
assert.equal(existsSync(new URL("../tense-reference.json", import.meta.url)), false, "owner tense reference must be moved out of the repository root");

const draft = JSON.parse(readFileSync(new URL("../data/m1-glosses-draft.json", import.meta.url), "utf8"));
assert.equal(draft.entries.length, 128, "expected exactly 128 owner-supplied gloss entries");
assert.equal(M1_VOCABULARY_HEADWORDS.length, 128, "expected exactly 128 M1 headwords");
assert.deepEqual([...draft.entries.map(entry => entry.headword)].sort(), [...M1_VOCABULARY_HEADWORDS].sort(), "owner gloss headwords must exactly match M1 vocabulary");
for (const item of draft.entries) {
  const result = lookup(item.headword);
  assert.equal(result.status, "supported", item.headword + " must resolve");
  assert.equal(result.meaning, item.gloss, item.headword + " meaning must match owner draft");
  assert.equal(result.part, item.pos_label, item.headword + " POS must match owner draft");
  assert.equal(result.notes, item.note, item.headword + " note must match owner draft");
  assert.equal(result.glossStatus, "drafted-pending-review", item.headword + " gloss status");
  const metadata = dictionary[item.headword]?.[4];
  assert.equal(metadata?.hint, false, item.headword + " translator hint must remain frozen");
  assert.equal(metadata?.gloss, "drafted-pending-review", item.headword + " metadata gloss status");
  assert.equal(metadata?.source, "Lexique 3.83", item.headword + " source metadata");
  assert.equal(metadata?.licence, "CC BY-SA 4.0", item.headword + " licence metadata");
  assert.ok(metadata?.lexiquePos, item.headword + " Lexique POS metadata must remain");
  assert.ok(Number.isFinite(metadata?.lemmaFrequency), item.headword + " lemma frequency metadata must remain");
  for (const field of [result.meaning, result.part, result.notes]) {
    assert.doesNotMatch(field, /Lexique 3\.83 classifies|frequency rank score/i, item.headword + " learner-facing text contains source metadata");
  }
}
console.log(JSON.stringify({immutableReferences: 2, m1GlossEntries: draft.entries.length, m1Headwords: M1_VOCABULARY_HEADWORDS.length, hintFalse: draft.entries.length, glossStatus: "drafted-pending-review"}));
