# Reconstructed local-only baseline (candidate; not historical migrations)

This directory contains a **candidate** baseline generated from the captured hosted catalog snapshot. It is not a recovery of the six original migration files, and it is **not yet reviewed for safe replay**.

## Artifacts

- `001_reconstructed_baseline_candidate.sql`: generated DDL candidate for the 22 public tables and the captured columns, constraints, indexes, RLS policies, function definitions, table grants, selected schema grants, function execute grants, and captured RLS flags.

## Evidence and current checks

- Source snapshot: `docs/schema-snapshot/`, captured from read-only catalog queries on 2026-10-20.
- The candidate was generated from 105 column records, 46 constraints, 36 indexes, 39 policies, 16 functions, 616 table-grant records, and 22 RLS-enabled table records.
- These counts describe captured metadata, not proof of completeness or parity.
- The existing CI snapshot-integrity test validates the JSON artifacts only; it does not parse or execute this SQL candidate.
- **No local Supabase replay has been run.** There is no local Supabase/Docker execution runtime available in the current tool session.
- **No RLS, function-permission, user-isolation, or quota integration tests have been run against a reconstructed database.**

## Known blockers before replay

1. Reconcile all application source references and complete the object inventory, including database/role-level grants, non-table object ACLs, schemas beyond the captured scope, and Supabase Auth/Storage integration assumptions.
2. Review each generated statement against the source catalog. The SQL is generated, not hand-reviewed; treat it as untrusted until review is complete.
3. Validate policy/function ordering and privileges against a disposable local Supabase instance.
4. Compare a fresh local catalog with the source snapshot and resolve every meaningful mismatch.
5. Add automated tests for anonymous vs authenticated access, user-to-user isolation, lecturer-only operations, function EXECUTE ACLs, and quota fail-closed behavior.

## Safety rules

- Never apply these files to a hosted Supabase project.
- Never use `supabase link` or `supabase db push` for this recovery.
- Do not copy user rows, auth users, `app_secrets` values, API keys, or other secret values.
- Keep provider tests mocked; do not call Gemini as part of schema replay.
- Do not merge or deploy this candidate as a production migration.
- Do not backdate reconstructed SQL or claim it is one of the six original migration files.

**Status: candidate SQL generated; review, local replay, catalog parity, and security tests remain incomplete.**