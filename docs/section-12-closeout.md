# Section 12 — final closeout

## Final implementation head

- **Step 9 implementation head SHA:** `5e2099882dd6c9ac71f8245d72c4938f4113ffcc`.
- **Step 8c baseline SHA:** `34f119a155e3c478d630a4f5c1ed2e328e895b22`.
- This closeout document is committed immediately after the implementation head; its documentation-only commit is the final repository head for this closeout.
- Additive commits only. No force-push. No golden or checksum edits. No workflow changes. No PR #13, Vercel, or Sections 13–20 changes.

## CI evidence from the validated Step 8c baseline

The following six runs were all completed successfully on Step 8c head `34f119a155e3c478d630a4f5c1ed2e328e895b22`:

| Workflow | Event | Run ID | Conclusion |
|---|---|---:|---|
| French Intelligence checks | push | [41048312431](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/41048312431) | success |
| French Intelligence checks | pull_request | [41048320066](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/41048320066) | success |
| Legacy golden integrity | push | [41048312453](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/41048312453) | success |
| Legacy golden integrity | pull_request | [41048320073](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/41048320073) | success |
| Approved French Intelligence golden v3 | pull_request | [41048320069](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/41048320069) | success |
| Section 14a approved golden v2 | pull_request | [41048320079](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/41048320079) | success |

These six runs document the accepted pre-Step-9 baseline. Step 9 acceptance is separately gated on workflow runs for the exact final Step 9 head; these historical runs are not represented as Step 9 runs.

## Acceptance baseline

- Exact legacy parity: **1,103 / 1,103**, zero differences.
- Legacy characterization: **15 / 15** across all five methods.
- Safety net: **639 inputs / 0 findings**.
- Section 12 regression suite: passed on the validated baseline.
- Golden v2 and v3 integrity and compatibility checks: passed.
- Repository tree sanity check: passed; all required repository files present.
- Desktop and mobile Chromium checks: passed.
- Browser UI parity: **123 checkpoints / 0 unapproved differences**; 55 intentional differences.

## Section 12 Step 9 dictionary and ledger closeout

- Added nine dictionary entries with `hint:false`: sœur, œuf, nœud, vœu, bœuf, œuvre, mœurs, manœuvre, chœur.
- Added positive canonical and unligatured lookup assertions. Unligatured forms must resolve to the same canonical entries through `normalizeOeLigature`.
- Preserved the explicit whitelist behavior; **coexister remains unchanged**.
- Ledger remains exactly **46 unique rows**:
  - **9 source-verified**
  - **34 lexique-confirmed**
  - **3 reference-pending**: TR-005, TR-026, TR-046
- Every source-verified and lexique-confirmed row carries a source/provenance value. Lexique provenance: `Lexique 3.83 pilot, french-engine-data (headword/POS/gender match)`.
- Added root `package.json` with private package metadata and only the pinned Playwright devDependency; no `type` field or scripts.

## Open items

1. Three ledger rows remain reference-pending: TR-005, TR-026, and TR-046 (noun sense).
2. Golden v4 for translator hints is deferred and requires separate owner approval.
3. UI integration of the expanded dictionary and hint behavior has not started.

## Approval boundary

Golden v2 and golden v3 were approved by **Oyerinde Oyetayo on 2026-10-28**. This approval applies only to the reviewed v2/v3 golden artifacts and does not authorize golden v4. No teacher approval is inferred or claimed.
