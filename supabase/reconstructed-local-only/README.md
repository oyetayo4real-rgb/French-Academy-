# Reconstructed local-only baseline (not historical migrations)

This directory is reserved for a schema baseline reconstructed from the reviewed catalog snapshot. It is intentionally not yet populated with executable SQL: catalog completeness and object-by-object source reconciliation are still open, and generating/applying guessed DDL would risk silently changing security behavior.

Rules:

- Never apply these files to a hosted Supabase project.
- Never use `supabase link` or `supabase db push` for this recovery.
- Do not copy user rows, auth users, app_secrets values, API keys, or other secret values.
- Keep provider tests mocked; do not call Gemini as part of schema replay.
- Mark all reconstructed SQL and assumptions explicitly. Do not backdate it or claim it is one of the six original migration files.
- Before declaring success, replay against a fresh local Supabase stack, compare catalog objects with docs/schema-snapshot, and run role/RLS/function grant tests.

Current state: documentation and read-only catalog metadata are committed; executable baseline SQL and local replay are not yet complete.
