# French Intelligence Engine — Section 12 Architecture Design

Status: design proposal; no runtime refactor has been made in this commit.

## Goals

1. Preserve the existing `window.FrenchIntelligenceCore` public contract.
2. Move linguistic logic into a pure module with no DOM, window, document, network, storage, or browser API dependencies.
3. Keep rendering, event listeners, navigation, and HTML formatting in a separate UI adapter.
4. Introduce a versioned `v1` API and a uniform, honest result envelope.
5. Preserve the legacy API as an adapter until consumers have migrated and regression tests prove compatibility.

## Current state (verified against the current branch)

- `features/french-intelligence.js` is a single 51 KB IIFE.
- The file contains built-in dictionary/rule/phrase data, language functions, HTML formatting, DOM lookups, event listeners, and the public API.
- The current public object exposes `lookup`, `translate`, `conjugate`, `answerQuestion`, and `checkWriting`.
- The integration test evaluates the existing file in a VM with a stub `document`; it does not yet prove that the linguistic core can execute without browser globals.

## Target file boundaries

- `features/french-intelligence-data.js`: temporary compatibility data module while the source datasets are migrated; no DOM or UI strings.
- `features/french-intelligence-core-v1.js`: pure functions and versioned result contracts. No browser globals, markup generation, network, or side effects.
- `features/french-intelligence-ui.js`: UI rendering, event listeners, HTML escaping, navigation and presentation. This module calls the pure core and formats results.
- `features/french-intelligence.js`: thin legacy bootstrap/adapter that exposes the current global API and delegates to the new UI adapter.

The existing single-file implementation remains the source of truth until the extracted implementation passes the full current test suite. Do not delete or replace it before parity is demonstrated.

## Versioned API contract

Each v1 operation returns an object with:

```js
{
  status: "supported" | "ambiguous" | "unsupported",
  confidence: 0, // finite number from 0 to 1
  rule_id: null, // stable identifier when a rule applies
  explanation: "", // human-readable reason and scope
  sources: [] // source/provenance references; never invent references
}
```

Operation-specific payloads may be included in an additional `result` field. `supported` means the engine has a defined result within its declared scope; it does not mean an unverified linguistic claim is authoritative. `ambiguous` means context is insufficient or multiple readings remain. `unsupported` means no supported operation/data rule applies.

Suggested namespace:

```js
window.FrenchIntelligenceCoreV1 = Object.freeze({
  version: "1.0.0",
  lookup(input) { /* result envelope */ },
  translate(input, options) { /* result envelope */ },
  conjugate(input, options) { /* result envelope */ },
  answerQuestion(input) { /* result envelope */ },
  checkWriting(input, options) { /* result envelope */ }
});
```

The final global name and method argument shapes must be locked by tests before implementation. The legacy global `window.FrenchIntelligenceCore` remains available and keeps its current method names and return shapes during migration.

## Compatibility strategy

1. Add characterization tests for every current public method, including exact return shapes, unsupported inputs, accents and typographic apostrophes.
2. Extract pure data and functions without changing results.
3. Add v1 envelopes as an additive API; do not change legacy return values.
4. Keep UI rendering out of both APIs. The UI adapter converts core results into accessible text/HTML and must escape untrusted text.
5. Run Node tests and the existing Playwright desktop/mobile checks after each extraction.
6. Compare legacy outputs against the pre-refactor baseline. Any intentional behavioural change needs a separate test and explicit review.
7. Remove old implementation code only after parity tests and consumer searches prove that it is unused.

## Data boundary

This section establishes the data-loading boundary but does not yet import new external data. Linguistic datasets should be stored as separate JSON assets in a later approved data/provenance task. Until then, existing data must be migrated without silently changing entries, meanings, licences, or behaviour.

## Required acceptance gates

- The pure core imports/runs in Node without `window`, `document`, DOM stubs, or browser APIs.
- A static check rejects DOM/browser globals in the core module.
- All five legacy methods preserve their existing observable behaviour.
- All five v1 methods return a valid result envelope for supported, ambiguous, and unsupported cases.
- Existing integration/corpus tests pass.
- Existing Playwright desktop/mobile tests pass.
- No production deployment, PR merge, or unrelated roadmap section is part of this change.

## Out of scope

Sections 13–20 remain unstarted. This design does not import dictionary datasets, add tenses, build voice or pronunciation features, add conversation scenarios, change Supabase, or deploy to production.
