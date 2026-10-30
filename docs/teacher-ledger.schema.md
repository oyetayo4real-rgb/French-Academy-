# Source-verified ledger schema

Canonical path: `tests/source-verified-ledger.json`.

The ledger contains 46 rows with sequential IDs `TR-001` through `TR-046` and exactly these statuses:

- `source-verified`: checked against the row's listed source URL(s); every row must have at least one HTTP(S) source URL.
- `reference-pending`: awaiting the automated Lexique/Dicollecte reference cross-check; a match is not a teacher approval.

Top-level fields are `schema`, `generated`, `method`, `status_values`, `rows`, and `proposed_rules`. Rows preserve the reviewed headword/sense, part of speech, gender, English gloss, notes, examples, `engine_action`, status, and sources. The owner's decision is **no teacher**: this workflow has no teacher-approved state and does not infer teacher decisions.
