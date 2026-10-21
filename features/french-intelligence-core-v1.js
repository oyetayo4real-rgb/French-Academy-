/* French Intelligence Core v1 — pure result contract.
 * CommonJS export only: this module does not publish globals or access browser APIs.
 * Linguistic operations are migrated into this module in subsequent Section 12 steps.
 */
"use strict";

const STATUSES = Object.freeze(["supported", "ambiguous", "unsupported"]);

function result(options = {}) {
  const { status, confidence = 0, rule_id = null, explanation, sources = [] } = options;
  if (!STATUSES.includes(status)) throw new TypeError("Invalid French Intelligence v1 status.");
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new TypeError("confidence must be a finite number between 0 and 1.");
  }
  if (rule_id !== null && (typeof rule_id !== "string" || !rule_id.trim())) {
    throw new TypeError("rule_id must be a non-empty string or null.");
  }
  if (typeof explanation !== "string" || !explanation.trim()) {
    throw new TypeError("explanation must be a non-empty string.");
  }
  if (!Array.isArray(sources)) throw new TypeError("sources must be an array.");
  const out = { status, confidence, rule_id, explanation, sources: sources.slice() };
  if (Object.prototype.hasOwnProperty.call(options, "value")) out.value = options.value;
  return Object.freeze(out);
}

function unsupported(explanation, sources = []) {
  return result({ status: "unsupported", confidence: 0, rule_id: null, explanation, sources });
}

function ambiguous(explanation, sources = [], confidence = 0) {
  return result({ status: "ambiguous", confidence, rule_id: null, explanation, sources });
}

module.exports = Object.freeze({ apiVersion: "v1", STATUSES, result, unsupported, ambiguous });
