import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { conjugate } from "../features/french-intelligence-core-v1.mjs";
import { VERB_PARADIGMS } from "../features/french-conjugation-paradigms.mjs";

const reference = JSON.parse(readFileSync(new URL("../tests/reference/tense-reference.json", import.meta.url), "utf8"));
const crosscheck = JSON.parse(readFileSync(new URL("../tests/reference/lexique-tense-crosscheck.json", import.meta.url), "utf8"));
const golden = JSON.parse(readFileSync(new URL("../tests/golden/legacy-v3.json", import.meta.url), "utf8"));
const failures = [];
const json = value => JSON.stringify(value);
const record = (step, input, expected, actual) => {
  if (json(expected) !== json(actual)) failures.push({ step, input, expected, actual });
};
const projection = value => value?.status === "supported" ? { v: value.v, forms: value.forms, type: value.type } : null;

// Preserve the exact existing present-tense API projection for every golden verb.
for (const row of golden.inventory.conjugation.verbs) {
  const actual = conjugate(row.verb);
  const explicitPresent = conjugate(row.verb, { tense: "present" });
  const actualProjection = projection(actual);
  record("present-golden", row.verb, row.output, actualProjection);
  record("present-optional-argument", row.verb, actualProjection, projection(explicitPresent));
}

// Check every reference verb and every requested non-present tense.
const tenseNames = ["imparfait", "futur", "conditionnel", "passé composé"];
for (const [verb, entry] of Object.entries(reference.verbs)) {
  const cross = crosscheck.verbs.find(row => row.verb === verb);
  for (const tense of tenseNames) {
    const expectedCheck = cross?.tenses?.[tense];
    const actual = conjugate(verb, { tense });
    if (expectedCheck?.status === "matched") {
      record("tense-status", { verb, tense }, "supported", actual.status);
      if (tense === "passé composé") {
        const expectedParticiple = entry.auxiliary === "avoir" ? [entry.participle[0]] : entry.participle;
        record("passé-composé-auxiliary", verb, entry.auxiliary, actual.auxiliary);
        record("passé-composé-participle", verb, expectedParticiple, actual.participleForms);
        record("passé-composé-agreement-note", verb, true, typeof actual.agreementNote === "string" && /être|avoir/.test(actual.agreementNote) && /Reflexive verbs/.test(actual.agreementNote));
      } else {
        const arrays = [entry[tense], ...(entry[tense + "_variants"] || [])];
        const expectedForms = arrays[expectedCheck.selectedVariant ?? 0];
        record("tense-forms", { verb, tense }, expectedForms, actual.forms);
      }
    } else {
      record("unsupported-tense-status", { verb, tense, crosscheckStatus: expectedCheck?.status }, "unsupported", actual.status);
      record("unsupported-tense-has-no-forms", { verb, tense }, false, Array.isArray(actual.forms));
    }
  }
}

// Thirty source-driven passé composé cases: all Lexique-verified être-auxiliary verbs
// plus seventeen Lexique-verified avoir-auxiliary verbs from the immutable reference.
const supportedPC = Object.entries(reference.verbs).filter(([verb]) =>
  crosscheck.verbs.find(row => row.verb === verb)?.tenses?.["passé composé"]?.status === "matched"
);
const etreCases = supportedPC.filter(([, entry]) => entry.auxiliary === "être");
const avoirCases = supportedPC.filter(([, entry]) => entry.auxiliary === "avoir");
const pcCases = [...etreCases, ...avoirCases].slice(0, 30);
record("passé-composé-case-count", "reference-derived cases", 30, pcCases.length);
for (const [verb, entry] of pcCases) {
  const actual = conjugate(verb, { tense: "passé composé" });
  const auxForms = VERB_PARADIGMS[entry.auxiliary];
  const participle = entry.auxiliary === "avoir" ? [entry.participle[0]] : entry.participle;
  const expectedForms = entry.auxiliary === "avoir"
    ? auxForms.map(form => form + " " + participle[0])
    : auxForms.map((form, index) => form + " " + (index < 3 ? participle[0] + " / " + participle[1] : participle[2] + " / " + participle[3]));
  record("passé-composé-30-case", verb, {
    status: "supported", auxiliary: entry.auxiliary, participleForms: participle, forms: expectedForms
  }, {
    status: actual.status, auxiliary: actual.auxiliary, participleForms: actual.participleForms, forms: actual.forms
  });
}

const summary = {
  referenceVerbs: Object.keys(reference.verbs).length,
  goldenPresentRows: golden.inventory.conjugation.verbs.length,
  passedComposeCases: pcCases.length,
  lexiqueSourceCommit: crosscheck.source.commit,
  lexiquePilotBlob: crosscheck.source.blobSha,
  support: crosscheck.summary,
  failures: failures.length
};
if (failures.length) {
  console.error(JSON.stringify({ summary, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(summary));
  console.log("PASS M1 tense reference, Lexique coverage, 30 passé composé cases, and unchanged golden present tense.");
}
