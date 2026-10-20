# Full schema reconciliation — read-only inventory

Audit date: 2026-10-20  
Repository: `oyetayo4real-rgb/French-Academy-`  
Branch: `nexus/local-isolated-staging`  
Hosted project inspected read-only: `zzphvgkooaylxurwrlqx` (`vogtay french Academy`)

## Safety

This document records schema metadata only. The inspection used read-only catalog queries and Supabase metadata APIs. No DDL, data writes, migration application, deployment, user-row export, or AI-provider request was performed. Do not run `supabase link`, `supabase db push`, hosted migration apply, or deployment commands as part of local recovery.

## Confirmed migration ledger

| Version | Name |
| --- | --- |
| `20261009214634` | `french_academy_core_schema` |
| `20261009214646` | `move_policy_helpers_to_private_schema` |
| `20261010140254` | `marking_content_calls_schema` |
| `20261010140319` | `seed_answer_keys` |
| `20261013195910` | `ai_tutor_usage_and_dictionary_cache` |
| `20261015114039` | `lower_ai_daily_limits_for_free_tier` |

The migration ledger is present in the hosted database and provides version/name metadata only; the original migration SQL files are absent from the checked repository branch history.

## Object inventory counts

- Public base tables: 22
- Public tables with RLS enabled: 22
- Public RLS policies: 39
- Public indexes: 36
- Public constraints: 46
- Public SQL functions: 9
- Private SQL helper functions: 7

Public base tables:
`ai_usage`, `app_secrets`, `assignments`, `attempts`, `attendance`, `audio_clips`, `classes`, `custom_keys`, `custom_lessons`, `dict_cache`, `enrollments`, `exam_crit`, `exam_keys`, `lesson_media`, `live_sessions`, `profiles`, `progress`, `quiz_keys`, `recordings`, `signals`, `submissions`, `user_state`.

## Private helper function inventory

All seven inspected functions are `SECURITY DEFINER`:
- `private.in_class(c uuid) returns boolean`
- `private.in_session(sid uuid) returns boolean`
- `private.is_lecturer() returns boolean`
- `private.my_role() returns text`
- `private.owns_class(c uuid) returns boolean`
- `private.owns_session(sid uuid) returns boolean`
- `private.teaches(s uuid) returns boolean`

These functions and their grants are part of the security contract. Recreating tables without the helpers, RLS policies, and grants would not reproduce production behavior.

## AI quota/cache objects verified

- `public.ai_usage`: `user_id uuid`, `day date`, `n integer`; primary key `(user_id, day)`; foreign key to `auth.users(id)`; RLS enabled.
- `public.dict_cache`: `word text`, `data jsonb`, `created_at timestamptz`; primary key `word`; RLS enabled.
- `public.ai_use(p_uid uuid) returns boolean`: deployed PL/pgSQL `SECURITY DEFINER` function with empty search path. It uses the current date, applies the configured student/lecturer daily quota, increments `public.ai_usage`, and returns whether the quota is within limit. The definition and grants were inspected read-only; this is a reference for reconstruction, not proof of the exact original migration source.

## Remaining reconciliation items before any migration SQL is authored

1. Capture a complete, reviewed schema-only artifact for all 22 public tables, their columns/defaults, all 46 constraints, all 36 indexes, all 39 policies, all 16 public/private functions, and object/function grants.
2. Inspect view/materialized-view definitions, sequences, custom types, enum/domain definitions, and schema ownership/usage grants, plus auth/storage integration assumptions.
3. Identify the exact schema needed by the app versus Supabase-managed system schemas; exclude credentials and all user data.
4. Review reference/seed tables (`quiz_keys`, `exam_keys`, `exam_crit`, and custom lesson/key structures) separately. Schema recovery does not authorize copying production rows; decide which non-sensitive canonical seed content can be recreated from source-controlled app assets.
5. Build a clearly labelled **reconstructed local baseline**, not falsely named as the recovered original historical migrations.
6. Apply only to a fresh local Supabase stack; verify schema inventory parity and RLS/function behavior. Only after that should authenticated local Tutor tests be attempted, with mocked provider tests as the default and no live Gemini calls without explicit approval.

## Completion status

**Partial schema inventory completed; full schema-only export and parity replay remain outstanding.** No production mutation has occurred.
