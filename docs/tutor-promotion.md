# Tutor v2 promotion and rollback runbook

## Promotion gate

This runbook is for the owner-approved promotion of the tested Tutor prompt changes from `feat/m5a-tutor-polish`. Do not promote based only on a passing preview. The owner must approve PR #26, and the approved changes must first be merged into `main`.

The isolated test function `tutor-v2-next` is not the production endpoint. PR #27 is TEST ONLY and must never be merged.

## 1. Promote the approved prompt to the live function

After the owner approves PR #26 and it is merged into `main`:

1. Record the merged `main` commit SHA.
2. Fetch `supabase/functions/tutor-v2/index.ts` from that exact `main` commit. Do not deploy from a feature branch or from a local working copy with uncommitted changes.
3. Compute and print the SHA-256 checksum of the exact `index.ts` bytes before deployment. Record the source commit SHA and checksum in the deployment report.
4. In Supabase project `zzphvgkooaylxurwrlqx`, deploy the single file `index.ts` to the existing function slug `tutor-v2` with `verify_jwt=true`.
5. Do not change or redeploy the legacy `tutor` function. Do not apply database migrations as part of this promotion.

This is a deliberate replacement of the live `tutor-v2` source only after owner approval. It is not an automatic side effect of merging PR #26.

## 2. Confirm the live deployment

In the Supabase Dashboard, open **Edge Functions** for project `zzphvgkooaylxurwrlqx` and inspect the function list. Confirm:

- `tutor-v2` is **ACTIVE**.
- Its version has advanced from the pre-promotion version.
- `verify_jwt` is **true**.
- Its deployed source checksum matches the SHA-256 checksum printed from the merged `main` source.
- The legacy `tutor` function remains at version 44 and was not modified.

The equivalent verification is to list Edge Functions and read the `tutor-v2` function metadata. Do not send a user token or invoke the function merely to verify deployment metadata.

## 3. Roll back to the previous deployed tutor-v2 source

The source that was live immediately before this promotion was deployed from:

- **Source commit:** `f83e804dc88ca9e2978cbc9c0e5ec0b641e8ec86`
- **Previous deployed version:** `4`
- **Previous source SHA-256:** `ef0c516819c5a3f3f20d7be936a82a638b60dcf52823aa368f4c043377f4b3d1`

If rollback is required:

1. Fetch `supabase/functions/tutor-v2/index.ts` from commit `f83e804dc88ca9e2978cbc9c0e5ec0b641e8ec86`.
2. Compute its SHA-256 and verify it equals `ef0c516819c5a3f3f20d7be936a82a638b60dcf52823aa368f4c043377f4b3d1` before deploying.
3. Redeploy that single `index.ts` file to the existing `tutor-v2` slug with `verify_jwt=true`.
4. Confirm the new active deployment's checksum equals the previous checksum above.

Rollback creates a new deployment version; it does not reset the version counter to 4. Do not delete either function and do not use the legacy `tutor` function as a substitute.

## 4. Monitor privacy-safe operational events

Watch these `tutor-v2` log events after promotion:

- `provider_attempt` — inspect provider, model, HTTP status or timeout, and elapsed milliseconds.
- `request_failed` — inspect the error code and retryable flag.

Also investigate `gemini_catalog_unavailable` and `provider_empty_response` if they appear repeatedly. These are operational signals, not a reason to expose request content.

Never log, export, or paste user questions, conversation history, generated answers, provider request/response bodies, authorization headers, JWTs, API keys, or other secrets. Logs must remain limited to operational metadata.

## Current isolated test deployment (reference only)

- Function: `tutor-v2-next`
- Version: `1`
- `verify_jwt=true`
- Source commit: `5e4355baa857ca3d1317d4b2b062ead19d3645c7`
- Source SHA-256: `e8f5ccd72eb54f909cd5381475162f969f126d773706115959ba57eb0a9418dd`

This isolated test function does not change the live `tutor-v2` function and is not the promotion target.
