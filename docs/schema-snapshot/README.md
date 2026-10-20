# Read-only schema snapshot

**Status: catalog metadata captured; not yet a replayable SQL dump.**

Captured from the hosted French Academy project using read-only catalog queries on 2026-10-20. This directory contains schema metadata only; it does not contain application table rows, auth users, app_secrets values, API keys, or other secret values.

## Sections

- 01-columns-a-g.json, 02-columns-h-p.json, 03-columns-q-z.json: column order, data types, nullability, defaults, identity/generated metadata.
- 04-constraints.json: constraint definitions and validation state.
- 05-indexes.json: index definitions.
- 06-policies.json: RLS policy commands, roles, USING and WITH CHECK expressions.
- 07-functions.json: function definitions, identity arguments, result types, language, SECURITY DEFINER state, settings, and function ACL metadata.
- 08-schema-grants-types.json: schema ownership/ACL, selected type/domain/enum metadata, extension names and versions.
- 09-table-grants.json: table privileges and grantability.
- 10-triggers-views-sequences-rls.json: triggers, views, sequences, and table RLS flags.

## Boundaries and known gaps

This is an inspectable catalog capture, not a byte-for-byte PostgreSQL schema-only dump. The snapshot must still be checked for completeness and reconciled against all source references. In particular, review role/database-level grants, policies and grants for non-table objects, custom type/composite details, auth/storage integration assumptions, and any objects outside public/private that belong to the application contract. Catalog metadata alone does not reconstruct historical migration file contents.

The migration ledger has six version/name entries, but the original SQL files were not found in the checked repository tree. Any future SQL generated from this snapshot must be labelled a **reconstructed local-only baseline**, never represented as the recovered original migrations.

## Safety

No production DDL or data mutation was performed. No user records or secret values were exported. No migrations were applied, no paid resources were created, and no live Gemini requests were made.
