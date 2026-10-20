# Database migration recovery audit

Date: 2026-10-20

## Scope and safety

This audit was performed using read-only Supabase schema metadata/queries and GitHub repository history. No database writes, migrations, deployments, provider calls, secrets, or user records were accessed.

Target repository: `oyetayo4real-rgb/French-Academy-`
Target branch: `nexus/local-isolated-staging`
Branch HEAD at audit: `16437d3109ebf08a1086a854c2bb1f4de6a8103b`

## Findings

The hosted Supabase project records these applied migration versions:

| Version | Name |
| --- | --- |
| `20261009214634` | `french_academy_core_schema` |
| `20261009214646` | `move_policy_helpers_to_private_schema` |
| `20261010140254` | `marking_content_calls_schema` |
| `20261010140319` | `seed_answer_keys` |
| `20261013195910` | `ai_tutor_usage_and_dictionary_cache` |
| `20261015114039` | `lower_ai_daily_limits_for_free_tier` |

The migration ledger exposes version/name metadata, not the original SQL text.

GitHub tree inspection found no `supabase/migrations/` directory on `main` or `nexus/local-isolated-staging`. The GitHub commits endpoint for the path `supabase/migrations` returned an empty list, so the original migration files are not recoverable from the repository path history checked.

## Live quota schema observed

- `public.ai_usage`: columns `user_id uuid`, `day date`, `n integer`; primary key `(user_id, day)`; foreign key `user_id -> auth.users(id)`; RLS enabled.
- `public.dict_cache`: columns `word text`, `data jsonb`, `created_at timestamptz`; primary key `word`; RLS enabled.
- `public.profiles`: `id uuid`, `full_name text`, `role text`, `created_at timestamptz`; RLS enabled; role check permits `student` and `lecturer`.

The deployed function signature is `public.ai_use(p_uid uuid) returns boolean`. It is PL/pgSQL, `SECURITY DEFINER`, and pins `search_path` to the empty string. It sets a daily limit of 25 by default and 150 when the supplied profile has role `lecturer`, increments `public.ai_usage` for the current date using an upsert, and returns whether the resulting count is within the limit. Its inspected EXECUTE grants are for `service_role` and `postgres`.

The deployed function definition was retrieved read-only from PostgreSQL's catalog. It is useful as a verified reference for reconstruction, but it is not proof of the exact contents of the original migration file.

## Reconciliation decision

**Do not create a guessed replacement for the six historical migrations or apply anything to the hosted database.** The isolated branch currently has no migration baseline; adding only the quota function would not make a clean local database reproduce the application's full schema and security policies.

## Next safe recovery step

1. Recover an authoritative schema-only export from the existing database through an approved export path, or reconstruct all required DDL from PostgreSQL catalogs and review it.
2. Reconcile tables, indexes, constraints, RLS policies, private helper functions, grants, triggers, and seed/reference data against the six migration ledger entries.
3. Create a new, clearly labelled baseline/snapshot for the isolated local environment rather than pretending reconstructed SQL is the original historical migration text.
4. Validate the snapshot on a fresh local Supabase database and run mocked CI. Do not link the local CLI to production, push migrations to the hosted project, copy user data, or make live AI-provider calls.

## Verification boundary

The quota objects and function were inspected in the hosted database. A complete schema-only export, exact original migration SQL, clean local database replay, authenticated end-to-end Tutor request, and live-provider latency measurement have **not** been completed.
