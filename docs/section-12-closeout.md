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

## Golden review

| Golden file | Commit SHA | What changed (from the commit diff) | Approval status |
|---|---|---|---|
| `tests/golden/legacy-v2.json` | [`e631d482d47261019d9ceb615078752d18240130`](https://github.com/oyetayo4real-rgb/French-Academy-/commit/e631d482d47261019d9ceb615078752d18240130) | Regenerated v2 outputs and checksum from the compatibility/core behavior. The accompanying diff corrected apostrophe escaping in the unsupported-translation fallback, restricted phrase substitution to exactly one matched phrase, tightened the verb marker check to a word boundary, and wrapped edge-case generation in exception capture. | **PENDING OWNER** |
| `tests/golden/legacy-v3.json` | [`c9535c5fb3e13f4818b2ac9d5407dbfac01b36fd`](https://github.com/oyetayo4real-rgb/French-Academy-/commit/c9535c5fb3e13f4818b2ac9d5407dbfac01b36fd) | One golden-output field differs from v2: `inventory.conjugation.verbs[18]` for `courir` changes `output.type` from `Explicit present-tense paradigm · needs review` to `Irregular verb · present tense`; forms and persons are unchanged. The v3 checksum was updated. | **PENDING OWNER** |

These are historical golden changes, not Section 12 approvals. No golden file or checksum was modified by Section 12 Step 3. Explicit owner review is still required.

# Linguistic sign-off

**Status: pending teacher form.** All 46 entries remain pending, with zero teacher-approved rows. The workflow runs the ledger check and CSV export in report-only mode with `continue-on-error: true`; it prints pending entries and unsupported lookups without blocking the existing checks. No teacher decision is inferred from candidate override data.

