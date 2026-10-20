# Reconstructed local-only baseline — status and reconciliation

**Target branch:** nexus/local-isolated-staging  
**Audit date:** 2026-10-20  
**Status:** catalog artifacts committed; baseline SQL and fresh-local replay are not yet complete.

## Explicit distinction

The original six historical migration SQL files were not found in the inspected repository tree. The hosted migration ledger only provides version and name metadata. Therefore, the work that follows is a **reconstructed local-only baseline**, not a recovery of the original migrations. Do not apply it to any hosted Supabase project or use supabase link / supabase db push as part of this task.

## Evidence captured

See the schema snapshot index at docs/schema-snapshot/README.md and the JSON catalog sections in docs/schema-snapshot/. These capture metadata from read-only catalog queries; no user rows or secret values were selected.

The hosted migration ledger reports:

| Version | Ledger name | What can be concluded from the name alone |
|---|---|---|
| 20261009214634 | french_academy_core_schema | Suggests core schema objects; exact contents are **unverified**. |
| 20261009214646 | move_policy_helpers_to_private_schema | Suggests helper-function relocation; exact changes/grants are **unverified**. |
| 20261010140254 | marking_content_calls_schema | Intent and affected objects are **unverified** from the name alone. |
| 20261010140319 | seed_answer_keys | Suggests answer-key seed data; source-controlled canonical seed values and intended rows must be independently identified. No production seed rows were exported. |
| 20261013195910 | ai_tutor_usage_and_dictionary_cache | Catalog currently includes public.ai_usage, public.dict_cache, and public.ai_use(uuid); exact historical migration body remains **unverified**. |
| 20261015114039 | lower_ai_daily_limits_for_free_tier | Current ai_use function shows a 25 default / 150 lecturer quota. Whether that exactly matches this migration's intended diff is **unverified** without the original SQL. |

Names are labels, not proof of migration contents. Do not invent historical SQL or mark any mapping as exact without a recoverable source diff.

## Application/source comparison so far

- supabase/config.toml uses project ID french-academy-local and sets verify_jwt = true for the Tutor function.
- supabase/functions/tutor/index.ts derives a user subject from the bearer JWT and calls the database quota mechanism. Its provider configuration resolves secrets server-side; the schema snapshot intentionally excludes secret values.
- supabase/functions/tutor/tutor.test.ts and the existing static workflow are mocked/static checks; they are not proof of a fresh database replay, authenticated end-to-end behavior, or live Gemini response quality.
- The inspected repository tree contains no supabase/migrations/ directory. Historical SQL bodies remain a discrepancy.
- The hosted catalog contains 22 public base tables with RLS enabled, 39 public policies, 36 public indexes, 46 constraints, 9 public functions and 7 private helper functions. The captured JSON files include relevant catalog metadata, but are not yet validated against a local database.

## Remaining discrepancies / gates

1. **Historical migration source:** original SQL bodies are missing; exact per-migration diffs cannot be proven.
2. **Complete DDL export:** catalog metadata is preserved in sections, but it is not yet a canonical schema-only dump artifact; completeness review is still required.
3. **Non-sensitive seed content:** determine whether quiz/exam answer keys and other reference content are available in source-controlled assets. Never copy production rows by default.
4. **Baseline generation:** only after review should SQL be authored under an unmistakable local-only path/name. Preserve RLS policies, function bodies/ACLs, schema/table grants, extensions, constraints, indexes, and required Supabase auth integration assumptions.
5. **Fresh local replay:** requires a local Supabase CLI/Docker runtime. This session has no available shell/container connector capable of running that stack, so replay has **not** been executed or verified here. Do not substitute a hosted project/branch; that can incur charges and is outside the safety boundary.
6. **Parity/security tests:** after local replay, compare catalog inventories/definitions and test anon vs authenticated roles, user isolation, lecturer-only actions, quota fail-closed behavior, and function execute grants. Provider tests must remain mocked; no live Gemini calls without explicit approval.

## Safety record

- No production schema changes.
- No migration applied to a hosted database.
- No new paid resources created.
- No user records or secret values exported.
- No live Gemini requests made.

**Completion claim:** schema metadata has been captured into reviewable sections, but baseline SQL, fresh-local replay, parity comparison, and RLS/function security tests remain outstanding.
