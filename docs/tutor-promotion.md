# Tutor v2 promotion and rollback runbook

## Promotion gate

This runbook covers the owner-approved promotion of the Tutor prompt changes from `feat/m5a-tutor-polish`. A passing preview is not approval to change production. The owner must approve PR #26 and merge it into `main` before the production builder performs the deployment.

The isolated test function is `tutor-v2-next2`. Its preview is PR #28, titled **TEST ONLY: preview pointing at tutor-v2-next2 (never merge)**. PR #28 is never to be merged. The earlier `tutor-v2-next` function is also isolated and is not a production endpoint.

## 1. Promote the approved prompt to the live function

Only after the owner approves PR #26 and it has been merged into `main`:

1. Record the exact merged `main` commit SHA.
2. Fetch `supabase/functions/tutor-v2/index.ts` from that exact `main` commit. Do not deploy from the feature branch, PR #28, or an uncommitted local copy.
3. Compute and print the SHA-256 checksum of the exact `index.ts` bytes before deployment. Record the source commit SHA and checksum in the deployment report.
4. In Supabase project `zzphvgkooaylxurwrlqx`, redeploy the single file `index.ts` to the existing function slug `tutor-v2` with `verify_jwt=true`.
5. This is an explicitly approved replacement of the live `tutor-v2` function. Do not modify, redeploy or delete `tutor`, `tutor-v2-next`, or `tutor-v2-next2`. Do not apply database migrations.

Merging PR #26 does not itself perform this deployment. The production builder must wait for owner approval and use the merged `main` source checksum printed in step 3.

## 2. Confirm the live deployment

In the Supabase Dashboard, open **Edge Functions** for project `zzphvgkooaylxurwrlqx`, or use the Supabase function-list and function-source inspection APIs. Confirm:

- `tutor-v2` is **ACTIVE** and its version has advanced from version 4.
- `verify_jwt` is `true`.
- The deployed `index.ts` source read back from Supabase is byte-for-byte identical to the file fetched from the merged `main` SHA.
- The SHA-256 of the deployed `index.ts` bytes equals the checksum printed from the merged `main` file before deployment.
- The legacy `tutor` function remains at version 44.
- `tutor-v2-next` and `tutor-v2-next2` remain isolated and unchanged.

Do not send a user token or invoke the function merely to verify deployment metadata. Provider-secret presence cannot be verified without an authorized token; do not infer provider configuration from a successful deployment.

## 3. Roll back to the previous deployed tutor-v2 source

The source that was live immediately before the approved promotion was deployed from:

- **Source commit:** `f83e804dc88ca9e2978cbc9c0e5ec0b641e8ec86`
- **Previous deployed version:** `4`
- **Previous source SHA-256:** `ef0c516819c5a3f3f20d7be936a82a638b60dcf52823aa368f4c043377f4b3d1`

If rollback is required:

1. Fetch `supabase/functions/tutor-v2/index.ts` from commit `f83e804dc88ca9e2978cbc9c0e5ec0b641e8ec86`.
2. Compute the SHA-256 of its exact bytes and verify it equals `ef0c516819c5a3f3f20d7be936a82a638b60dcf52823aa368f4c043377f4b3d1` before deploying.
3. Redeploy that single `index.ts` file to the existing `tutor-v2` slug with `verify_jwt=true`.
4. Read back the deployed source and confirm its exact content and checksum. Confirm the new active version and retain the rollback report.

Rollback creates a new deployment version; it does not reset the version counter to 4. Do not delete any function and do not use the legacy `tutor` function as a substitute.

## 4. Monitor privacy-safe operational events

After promotion, inspect structured operational events from `tutor-v2`:

- `provider_attempt` — provider, model, status/timeout and elapsed milliseconds.
- `request_failed` — error code and retryable flag.
- `gemini_catalog_unavailable` — Gemini model-catalog availability.
- `provider_empty_response` — provider returned no usable answer.

Watch for sustained increases in provider failures, timeouts, rate limits or empty responses. Use only operational metadata for diagnosis.

Never log, export or paste user questions, conversation history, generated answers, provider request/response bodies, authorization headers, JWTs, API keys or other secrets.

## Isolated test deployments (reference only)

### tutor-v2-next2 — this test

- **Function:** `tutor-v2-next2`
- **Version:** `1`
- **Status:** ACTIVE
- **verify_jwt:** `true`
- **Source commit:** `67821e14854bd960d4e0e4ca7e6bcfcb1148f9cc`
- **Source file:** `supabase/functions/tutor-v2/index.ts` (uploaded as the sole `index.ts`)
- **SHA-256 of exact index.ts bytes:** `d79688619b0a742725e245923b90c36c843a96db52046438380cab53aec27540`
- **Supabase deployment metadata ezbr_sha256:** `9826c3551b5868970c34b49ad6ed722d11935488d5f56b905ae6d694da93a889`
- **Test-only preview PR:** #28 — never merge.

### tutor-v2-next — earlier isolated test

- **Function:** `tutor-v2-next`
- **Version:** `1`
- **verify_jwt:** `true`
- **Source commit recorded at deployment:** `5e4355baa857ca3d1317d4b2b062ead19d3645c7`
- **Supabase deployment metadata ezbr_sha256:** `e8f5ccd72eb54f909cd5381475162f969f126d773706115959ba57eb0a9418dd`

The read-back `index.ts` in `tutor-v2-next` is byte-for-byte identical to the source deployed to `tutor-v2-next2`. There are no source-area differences: prompt rules, provider selection/fallback, authentication, quota handling, deadlines/retries, and privacy-safe logging are the same. The new function is a separately named deployment for the new test route; the old `tutor-v2-next` can be ignored for this test and must remain untouched.

The Supabase `ezbr_sha256` deployment metadata is recorded separately from the SHA-256 calculated over the exact `index.ts` file bytes. The source-file equality check is the byte-for-byte read-back comparison above.
