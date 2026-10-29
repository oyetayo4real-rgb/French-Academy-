# Engineering closeout

- **Closeout code head before this documentation/workflow commit:** `bc63a6d5d4b8d1ad42d3549c338c807ba8c7df31`.
- **Section 12 Step 1 audited baseline:** `0aff374df34c13c88d87e793e9538ffb2568d1c4`.
- **Commit A, ledger and checker:** `bc7a475ee7ab8047ea7a8c98dd4ef1ae68ee99a7`.
- **Commit B, teacher form exporter:** `f5b40cefc306f6f77ebca76169118d7eb5a97dcd`.
- **Commit D, canonical ledger:** `bc63a6d5d4b8d1ad42d3549c338c807ba8c7df31`.

## Recorded CI runs for Commit A

- French Intelligence checks: [40722729367](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722729367) — success.
- Legacy golden integrity: [40722729763](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722729763) — success.
- Approved golden v2: [40722729254](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722729254) — success.
- Approved golden v3: [40722729252](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722729252) — success.

## Recorded CI runs for Commit B

- French Intelligence checks: [40722794130](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722794130) — success.
- Legacy golden integrity: [40722794166](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722794166) — success.
- Approved golden v2: [40722793646](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722793646) — success.
- Approved golden v3: [40722793734](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40722793734) — success.

## Parity results

The recorded baseline French Intelligence checks passed exact legacy parity, characterization, desktop/mobile Chromium checks, and browser UI parity. The recorded Step 1f negation example assertion passed. These results predate the teacher-ledger workflow step; the ledger checker and CSV exporter must be evaluated from the new workflow run.

## Golden review (Section 12 Step 3 read-only audit)

| Golden file | Commit SHA | What changed (from the commit diff) | Approval status |
|---|---|---|---|
| `tests/golden/legacy-v2.json` | [`e631d482d47261019d9ceb615078752d18240130`](https://github.com/oyetayo4real-rgb/French-Academy-/commit/e631d482d47261019d9ceb615078752d18240130) | Regenerated v2 outputs and checksum from the compatibility/core behavior. The accompanying diff corrected apostrophe escaping in the unsupported-translation fallback, restricted phrase substitution to exactly one matched phrase, tightened the verb marker check to a word boundary, and wrapped edge-case generation in exception capture. | APPROVED. Approved by Oyerinde Oyetayo, repository owner, 2026-10-28 |
| `tests/golden/legacy-v3.json` | [`c9535c5fb3e13f4818b2ac9d5407dbfac01b36fd`](https://github.com/oyetayo4real-rgb/French-Academy-/commit/c9535c5fb3e13f4818b2ac9d5407dbfac01b36fd) | One golden-output field differs from v2: `inventory.conjugation.verbs[18]` for `courir` changes `output.type` from `Explicit present-tense paradigm · needs review` to `Irregular verb · present tense`; forms and persons are unchanged. The v3 checksum was updated. | APPROVED. Approved by Oyerinde Oyetayo, repository owner, 2026-10-28 |

These are historical golden changes. The owner approvals below apply only to these two files at these exact commits; any golden v4 requires separate approval. No golden file or checksum was modified by Section 12 Step 4 retry 2.

## Step 3 read-only lookup reproduction

The legacy lookup returns `null` for each of `oeil`, `œil`, `coeur`, and `cœur`. The structured core returns `status: unsupported`, `rule_id: dictionary.no-match`, and preserves each exact query. Current normalization lowercases and removes combining accent marks; it does not normalize `oe` to `œ`. No engine or golden file was changed for this reproduction.

## Step 3 expected-unsupported cross-check

The 37 reference-pending lookup inputs in the source-verified ledger were checked against the expected-unsupported arrays in golden v1/v2/v3 and the explicit characterization/parity tests. No input is an expected-unsupported *dictionary lookup* case in those sources. The one exact ID overlap is **TR-046 (`noir`)** in golden v2 and v3's `inventory.conjugation.unsupported`; that is a conjugation case, not a dictionary lookup case. The characterization corpus and parity test source contain no exact teacher-ledger unsupported lookup input as a dedicated expected-unsupported lookup case.

The golden review statuses above are approved by the repository owner on 2026-10-28 for `tests/golden/legacy-v2.json` at commit `e631d482d47261019d9ceb615078752d18240130` and `tests/golden/legacy-v3.json` at commit `c9535c5fb3e13f4818b2ac9d5407dbfac01b36fd` only. Any golden v4 requires separate owner approval. No teacher decisions were inferred.


## Section 12 Step 4 retry 2 — pre-change parity baseline

- Branch head before Step 4 retry 2 changes: `3d3c6138951e5bdd98c095d3fe70b88357706408`.
- Pre-change French Intelligence CI run: [40760967079](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/40760967079) (PR merge checkout `4bc15e023f66c50266a60ce74e6335b2b14c46bb`, containing the branch head).
- Exact legacy parity: **1,103 compared / 1,103 matched / 0 differences**.
- Legacy characterization: **15 cases passed across all five methods**.
- French Intelligence checks, legacy golden integrity, approved golden v2, and approved golden v3 all passed in the pre-change check.
- This is the baseline only; post-addition parity is gated separately. No golden file or checksum is to be edited by this step.

## Step 4 read-only Lexique/Dicollecte cross-check

- Source repository: `oyetayo4real-rgb/french-engine-data`, branch `main`; pilot data is derived from Lexique 3.83. Its cross-check manifest reports Dicollecte/Grammalecte 7.7 matched 2,709 of 2,710 pilot forms, with `marchées` the sole unknown form.
- Of the 37 reference-pending rows, **34 match Lexique pilot headword/POS/gender**, and **3 have mismatches or partial coverage**: TR-005 (`que`, conjunction) because the pilot has pronoun entries but no conjunction entry; TR-026 (`mort`, adjective/noun) because the pilot entry is feminine noun only; and TR-046 (`noir`, adjective/noun) because the pilot confirms the adjective but not the noun sense. The Dicollecte pilot cross-check is form-level only and does not establish POS/gender. TR-005 and TR-026 remain skipped with the reason: **“Lexique pilot subset lacks the conjunction / adjective sense; cross-check against Wiktionnaire first”.** TR-046 includes only the adjective sense in the data module; the noun sense remains reference-pending. These are read-only findings; no ledger row was changed.


## Section 12 Step 5 — Parity incident and frozen-golden repair

- At commit `c3a39175b768e854ded98ed9503ba2c55ff5e9d4`, exact parity fell to **1,088/1,103**, with 15 unique affected outputs. The reported incident categories are **11 function-word-noise findings, 3 accent-collision findings, and 2 genuine improvements**; one case is shared between the function-word-noise and accent-collision categories, so these category counts describe 15 unique cases rather than 16 separate cases.
- Repair: each of the 34 Section 12 dictionary additions is tagged `hint:false`; the French-to-English vocabulary-hint generator skips those entries while direct lookup remains available. Short ambiguous lookups `a`, `à`, and `ou` are prevented from reverse-gloss/accent-normalization collisions. TR-046 (`noir`) retains only the adjective sense; the noun sense remains reference-pending. TR-005 and TR-026 remain skipped pending a Wiktionnaire cross-check.
- No golden files or checksums were changed. **Golden v4 is deferred and is not approved.** The required gate is exact parity **1,103/1,103** and legacy characterization **15/15** before the oe→œ whitelist or proposed-rule regression suite can be added.

# Linguistic sign-off

**Linguistic sign-off: source-verified review, no teacher.** The canonical ledger contains 9 source-verified rows and 37 reference-pending rows. No teacher review or teacher approval was requested or inferred. The automated checker validates structure, statuses, unique row IDs, and source URLs only.

