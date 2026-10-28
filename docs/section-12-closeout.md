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

## Golden-change review note

The golden v2 and v3 files and their approved update workflows predate Section 12 Step 1. They are not Section 12 deliverables. Their prior successful CI runs do not constitute approval for Section 12; the owner must explicitly review and approve those historical golden changes. This work does not edit golden files.

# Linguistic sign-off

**Status: pending teacher form.** All 46 entries remain pending, with zero teacher-approved rows. The workflow runs the ledger check and CSV export in report-only mode with `continue-on-error: true`; it prints pending entries and unsupported lookups without blocking the existing checks. No teacher decision is inferred from candidate override data.

