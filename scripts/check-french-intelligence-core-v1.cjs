"use strict";
const assert = require("node:assert/strict");
const contract = require("../features/french-intelligence-core-v1.js");

assert.equal(contract.apiVersion, "v1");
assert.deepEqual(contract.STATUSES, ["supported", "ambiguous", "unsupported"]);
const supported = contract.result({
  status: "supported",
  confidence: 0.8,
  rule_id: "TEST-01",
  explanation: "A deterministic contract test.",
  sources: [{ id: "fixture", licence: "test-only" }],
  value: { answer: "bonjour" }
});
assert.equal(supported.status, "supported");
assert.equal(supported.value.answer, "bonjour");
assert.equal(Object.isFrozen(supported), true);
assert.throws(() => contract.result({ status: "guess", explanation: "invalid" }), /status/);
assert.throws(() => contract.result({ status: "supported", confidence: 1.1, explanation: "invalid" }), /confidence/);
assert.throws(() => contract.result({ status: "supported", explanation: " " }), /explanation/);
assert.equal(contract.unsupported("No dependable match.").status, "unsupported");
assert.equal(contract.ambiguous("Two readings are possible.").status, "ambiguous");
console.log("PASS French Intelligence v1 result contract");
