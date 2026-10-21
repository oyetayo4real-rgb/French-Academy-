/* French Intelligence Core v1 — pure result contract.
 * This module intentionally has no DOM, browser-global, storage, network, or HTML dependencies.
 * Linguistic operations are migrated into this module in subsequent Section 12 steps.
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && typeof root === "object") root.FrenchIntelligenceCoreV1Contract = api;
})(typeof globalThis === "object" ? globalThis : null, function () {
  "use strict";

  const STATUSES = Object.freeze(["supported", "ambiguous", "unsupported"]);

  function result({ status, confidence = 0, rule_id = null, explanation, sources = [], value } = {}) {
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
    if (Object.prototype.hasOwnProperty.call(arguments[0] || {}, "value")) out.value = value;
    return Object.freeze(out);
  }

  function unsupported(explanation, sources = []) {
    return result({ status: "unsupported", confidence: 0, rule_id: null, explanation, sources });
  }

  function ambiguous(explanation, sources = [], confidence = 0) {
    return result({ status: "ambiguous", confidence, rule_id: null, explanation, sources });
  }

  return Object.freeze({ apiVersion: "v1", STATUSES, result, unsupported, ambiguous });
});
