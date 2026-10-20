# Schema and application-source reconciliation — milestone report

**Date:** 2026-10-20  
**Branch:** `nexus/local-isolated-staging`  
**Status:** partial reconciliation complete; SQL candidate generated; review, replay, parity, and security tests still blocked.

## Application references inspected

The following checked-in application sources were inspected:
- `index.html` (main application; direct PostgREST and RPC URL references)
- `features/ai-classroom.js` (AI classroom frontend)
- `supabase/functions/tutor/index.ts` (Tutor/dictionary edge function)
- `supabase/functions/tutor/tutor.test.ts` (mocked provider tests)
- `supabase/config.toml`

A text scan of `index.html` found direct PostgREST table endpoints:
`assignments`, `attendance`, `audio_clips`, `classes`, `enrollments`, `lesson_media`, `live_sessions`, `profiles`, `progress`, `recordings`, `signals`, `submissions`, and `user_state`.
It also found RPC endpoints named `become_lecturer`, `join_class`, `submit_quiz`, `submit_exam`, `delete_my_account`, and `grade_submission` (some references occur more than once).

These table names are represented in the captured public catalog. This is a source-reference cross-check, not a proof that every dynamic request, storage object, function call, or policy path has been enumerated. `index.html` also accesses the Supabase Storage `recordings` bucket; the catalog snapshot does not capture Storage bucket policy/configuration.

## Candidate SQL generated

`supabase/reconstructed-local-only/001_reconstructed_baseline_candidate.sql` was generated from the snapshot metadata and contains candidate DDL for:
- 22 public tables / 105 captured columns
- 46 constraints and 36 indexes
- 39 public RLS policies
- 16 captured function definitions and function EXECUTE grants
- 616 table-grant records
- captured schema grants and RLS enable/force flags

The SQL is explicitly labelled as a reconstructed local-only candidate. It is **not** the recovered historical migration sequence and has not been executed or manually approved statement-by-statement. Do not apply it to a hosted project.

## Security and grant reconciliation: outstanding

The snapshot contains table-level grants, selected schema ACLs, function ACLs, and policy expressions. Remaining gaps before calling the baseline complete:
1. Database- and role-level grants/default privileges were not captured as a canonical dump.
2. Non-table object ACL coverage (including Storage objects and other Supabase-managed schemas) is not established.
3. The catalog's custom type inventory is empty, but that alone does not establish all required types and objects are captured.
4. Storage bucket `recordings` and its object policies require a separate local-only inventory.
5. The security assumptions for `auth.uid()`, JWT claims, `authenticated` / `anon` / `service_role`, and private SECURITY DEFINER helpers must be tested on a fresh local stack.
6. The original six migration SQL bodies remain missing; their exact historical contents cannot be inferred from ledger names.
7. Seed/reference data for quiz and exam answer keys has not been reconstructed; production rows must not be copied by default.

## Execution status

| Gate | Status |
|---|---|
| Read-only catalog snapshot committed | Complete |
| Source endpoint scan against captured table inventory | Partial |
| Candidate SQL generated in isolated path | Complete, unreviewed |
| Manual SQL review | Not complete |
| Fresh local Supabase replay | Not run — no local Docker/Supabase runtime available in this tool session |
| Catalog parity comparison | Not run |
| Anonymous/authenticated RLS tests | Not run |
| Function EXECUTE ACL tests | Not run |
| Cross-user isolation tests | Not run |
| Quota RPC fail-closed / daily-limit integration tests | Not run |

## Next safe execution procedure

Use a disposable local Supabase stack only, with no `supabase link`, `supabase db push`, hosted branch creation, production data, production credentials, or live AI provider requests. First review the candidate SQL and reconcile the blockers above; then replay locally, dump the resulting local schema for comparison, and test role separation using dedicated local Auth users and synthetic records. Preserve redacted logs and record actual command outputs before changing any status to passed.
