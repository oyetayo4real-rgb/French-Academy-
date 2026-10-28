# Teacher ledger schema (Section 12)

The ledger is a review queue, not an authority for linguistic decisions. Until the teacher's approved 46-item review is recovered, every entry must remain `pending`. The 46 inputs currently document 42 pilot override candidates plus four refill candidates; that set is explicitly provisional and must not be described as the teacher-approved list.

## Record fields

- `id`: stable unique string (currently `TR-001` … `TR-046`).
- `input`: exact item presented to the teacher.
- `lookup_input`: input passed to the current built-in lookup to capture the present output; it may differ from the display input where the latter includes POS annotations.
- `candidate_change`: unapproved provenance note only; never treated as a decision.
- `approved_output`: teacher-approved value; must be non-empty for `approved`, otherwise `null`.
- `engine_location`: source/runtime location for the implemented behavior; required for `approved`.
- `test_name`: named regression test for the approved behavior; required for `approved`.
- `status`: `pending` or `approved`.

## Validation

The checker requires exactly 46 records, unique non-empty IDs, and rejects any `approved` row missing `approved_output`, `engine_location`, or `test_name`. Pending rows are permitted and must be enumerated in the check output. No linguistic approval is inferred from a pilot override, generated worksheet, or data-import diagnostic.
