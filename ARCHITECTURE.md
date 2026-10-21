# French Intelligence Engine — Architecture (Section 12)

## Status

Section 12 is in progress. This document defines the compatibility boundary and migration order; it does not claim the existing UI and linguistic functions have already been fully separated.

## Compatibility contract

The current app consumes `window.FrenchIntelligenceCore` with these legacy methods:

- `lookup(query)`
- `translate(text, direction)`
- `conjugate(verb)`
- `answerQuestion(question)`
- `checkWriting(text)`

Keep those names and their current legacy return shapes during migration. Do not silently change markup strings, null behavior, or object properties without a compatibility test. New code should use the versioned API instead.

## Target modules

1. `features/french-intelligence-core-v1.js`: pure engine entry point. No `window`, `document`, DOM, browser storage, fetch, or HTML strings. Functions return structured result envelopes.
2. `features/french-intelligence.js`: UI adapter. Owns DOM lookup, event listeners, rendering and mapping structured engine results to current UI.
3. `data/french-intelligence/v1/`: JSON-only linguistic data, split into lexicon, rules, phrasebook, and verbs. Data provenance/licensing validation is a separate Section 13 task; do not bulk-import data in Section 12.
4. `window.FrenchIntelligenceCore`: compatibility facade. Existing consumers continue to work while new consumers opt into `v1`.

## Result envelope

Every new v1 operation returns:

```js
{
  status: "supported" | "ambiguous" | "unsupported",
  confidence: 0, // finite number in [0, 1], calibrated or conservative
  rule_id: null, // stable string or null when no rule applies
  explanation: "Human-readable, evidence-bounded explanation.",
  sources: [] // structured source references; never invented
}
```

An operation may include a typed `value` field, but must retain the envelope. `unsupported` means no dependable result was found. `ambiguous` means multiple plausible analyses remain. The UI must not render either as a definitive answer. Confidence is not a probability unless it has been calibrated against a representative evaluation set.

## Pure-core restrictions

- Do not read or write browser globals, storage, location, network, or the DOM.
- Do not generate HTML. Return plain data and explanations.
- Do not fetch data dynamically. The caller supplies validated data objects or imports static JSON.
- Normalize input deterministically; do not silently erase meaningful accents or apostrophe distinctions in output.
- Keep operations deterministic for the same input and data version.
- Do not add unverified lexical or grammatical facts from model memory.

## Migration sequence

1. Introduce and test the v1 result-envelope helper without changing legacy behavior.
2. Extract normalization and pure lookup/verb/rule functions into the core, using JSON data and parity tests against the legacy API.
3. Move rendering and browser event wiring to the UI adapter.
4. Implement the compatibility facade and test each legacy method's signature and return shape.
5. Update the app to load the core before the UI adapter; test desktop, mobile, offline cache and no-network behavior.
6. Remove duplicate legacy logic only after parity tests pass.

## Gate criteria

Section 12 is complete only when:
- core module has no browser/DOM dependencies (verified by source inspection and tests);
- each exposed v1 operation returns the envelope and honest status;
- legacy global methods remain compatible under automated regression tests;
- core can be imported and tested in a non-browser runtime;
- desktop/mobile browser and offline checks pass on the exact resulting commit.

No production deployment, merge, or unrelated roadmap section is included in this task.
