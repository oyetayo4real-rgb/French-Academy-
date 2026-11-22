# Académie Live Voice — Production Release Runbook

**Prepared:** 2026-11-22  
**Release candidate:** PR #35 — `feat/live-voice-conversation`  
**Status:** HOLD — not approved for production deployment

## 1. Release scope and safety boundaries

This release adds Gemini Live voice to the existing Tutor, with an authenticated Groq transcription/Tutor fallback and microphone recovery. It must not change the existing lesson engine, dictionary, class/live-room features, or production Tutor function.

- Work and validate on `feat/live-voice-conversation` and its draft PR #35.
- PR #35 currently targets `feat/bilingual-voice-tutor`, not `main`. Do not merge it directly to production.
- Do not alter production Supabase secrets, production functions, Vercel production environment variables, or production aliases until the release owner approves.
- Do not apply new database migrations as part of the voice-only release unless a separately reviewed migration is approved.
- Gemini is primary. Groq is the only configured voice fallback. Do not add Mistral, OpenRouter, or other paid providers.
- Never put permanent Gemini/Groq credentials in browser code, Vercel public variables, logs, or this document.

## 2. Verified production baseline — rollback reference

### Vercel

| Item | Verified baseline |
|---|---|
| Project | `prj_mhdIZudm7IlD7qtiOQEJWZIdX8ZG` |
| Current production deployment | `dpl_GJ9qWLsG9LeFRxECC3adKDZ5VHqJ` |
| Deployment state | READY |
| Production commit | `e1b5b4c7ce16d08e6a66d7fbf137dfe03b870917` |
| Production aliases | `french-academy-vogtay.vercel.app`, `french-academy-one.vercel.app`, `french-academy-git-main-vogtay.vercel.app` |

This deployment is the immediate Vercel rollback target. Do not delete it or its aliases.

### Supabase production

| Item | Verified baseline |
|---|---|
| Project | `zzphvgkooaylxurwrlqx` |
| Project status | ACTIVE_HEALTHY |
| Region | eu-west-3 |
| `tutor` | ACTIVE v44 — preserve untouched |
| `tutor-v2` | ACTIVE v6 |
| `live-voice-session` | ACTIVE v2, gateway JWT verification enabled |
| `live-voice-groq` | ACTIVE v1, gateway JWT verification disabled; application-level Auth check exists |

Production function source digests captured from Supabase deployment metadata:
- `tutor v44`: `8673ab0357d8784a93c0f46a04461fddb9056a405553ae535f4cc51f5a899174`
- `tutor-v2 v6`: `1f855f0b1d04553f6f486bfb682ece643dd16f4b366582ff8c43f9850f8a3f7e`
- `live-voice-session v2`: `6addcf84e3144c9b5987d97e1f5ce93466d33058b8852465403527edcae4e9de`
- `live-voice-groq v1`: `a2c176f84d93b2fe6161c3e983446b86362f1fabe3daec1bc1d4662fe41ae6a0`

The production and staging `public.tutor_learning_memory` table grants were queried directly: only `postgres` and `service_role` have table privileges; `anon` and `authenticated` have none. Its RLS-enabled/no-policy advisor finding is consistent with this service-only access model.

Production migration ledger currently contains:
- `20261009214634 french_academy_core_schema`
- `20261009214646 move_policy_helpers_to_private_schema`
- `20261010140254 marking_content_calls_schema`
- `20261010140319 seed_answer_keys`
- `20261013195910 ai_tutor_usage_and_dictionary_cache`
- `20261015114039 lower_ai_daily_limits_for_free_tier`
- `20261020192532 revoke_client_privileges_ai_usage`
- `20261122190446 tutor_learning_memory`
- `20261122190453 tutor_learning_memory_rpc`

No new database migration is required by the voice-handler hardening changes currently in this release branch.

## 3. Verified staging target

| Item | Verified value |
|---|---|
| Supabase project | `pagytaefoumwdvwaohft` (`french-academy-staging`) |
| Status | ACTIVE_HEALTHY |
| Region | eu-west-3 |
| `live-voice-session` | ACTIVE v8, JWT verification enabled |
| `live-voice-groq` | ACTIVE v3, JWT verification disabled in gateway |
| `tutor-v2` | ACTIVE v8 |

The Vercel preview environment for `feat/live-voice-conversation` points to this staging project. The separate project `zzphvgkooaylxurwrlqx` is the production backend and must not be used for preview tests.

### Staging evidence and outstanding defects

- Staging logs contain successful `live-voice-session` HTTP 200 responses.
- Staging function logs also contain Gemini token-provisioning HTTP 400 failures; the corresponding broker requests returned HTTP 502.
- Historical Groq fallback requests returned HTTP 503. Their root cause has not yet been proven from the HTTP access log alone.
- The hardened branch now uses the SDK model identifier `gemini-3.8-live` (without the REST `models/` prefix), emits sanitized provider error detail to server logs, restricts Groq CORS to approved origins, and bounds request/history sizes.
- Branch tests now cover broker auth, origin policy, request bounds, one-use token issuance, 60-second session-start expiry, 30-minute token expiry, Groq auth, provider routing, rate limits, Gemini failure fallback, and microphone interruption/restart.
- The browser harness must pass against the isolated test page before staging deployment.

## 4. Release blockers — must be closed before approval

- [ ] All required GitHub Actions checks pass on the final PR head, including French Intelligence, Tutor V2 reliability, learning-memory, Deno broker tests, and controlled voice browser tests.
- [ ] Deploy the tested broker and Groq handler to **staging only**; set Groq gateway JWT verification to true as defense in depth while retaining the handler's explicit Supabase Auth check.
- [ ] Confirm staging secrets exist on `pagytaefoumwdvwaohft`: `GEMINI_API_KEY`, `GROQ_API_KEY`, `GROQ_VOICE_ENABLED=true`. Secret values must never be read into logs or shared.
- [ ] Confirm the staging broker returns HTTP 200 and the function log no longer records Gemini token provisioning HTTP 400.
- [ ] Confirm the Groq handler returns a successful authenticated fallback turn; a 503 is a release blocker.
- [ ] Perform a real-device microphone test on the staging preview: Gemini audio in/out, transcript, barge-in, forced Gemini failure to Groq, microphone track interruption, and successful microphone re-request.
- [ ] Confirm production Supabase secrets are separately configured; staging secrets do not count as production configuration.
- [ ] Add production Vercel environment variables before the first production build of this branch: `FA_SUPABASE_URL` must target `https://zzphvgkooaylxurwrlqx.supabase.co`, and `FA_SUPABASE_ANON_KEY` must be that production project's public publishable/anon key. The current Vercel project inventory shows only preview-scoped `FA_SUPABASE_URL` and `FA_SUPABASE_ANON_KEY` for this branch and no production-scoped copies. Without production values, `scripts/build-runtime-config.mjs` will refuse the production build.
- [ ] Set production `ALLOWED_APP_ORIGINS` to the exact approved production origins: `https://french-academy-vogtay.vercel.app`, `https://french-academy-one.vercel.app`, and, if retained, `https://french-academy-git-main-vogtay.vercel.app`. The preview-hostname regular expression does not cover these production aliases.
- [ ] Confirm production `GEMINI_API_KEY`, `GROQ_API_KEY`, and `GROQ_VOICE_ENABLED` on the production Supabase project; do not infer their presence from staging.
- [ ] Review/accept the existing Supabase security-advisor findings before production approval. Current production findings include seven externally callable SECURITY DEFINER functions for authenticated users and leaked-password protection disabled. RLS/no-policy findings on service-only tables require role/grant verification, not blanket policy creation.
- [ ] Confirm production provider billing/quota limits and alerting. Free-tier availability is not a hard spend cap.

## 5. Backup and rollback protection

### Before production change

1. Freeze the release commit SHA and record the final Vercel deployment ID.
2. Preserve the current Vercel production deployment `dpl_GJ9qWLsG9LeFRxECC3adKDZ5VHqJ` and its aliases.
3. Export/download the currently deployed production source for `live-voice-session v2`, `live-voice-groq v1`, and `tutor-v2 v6`; store these immutable snapshots with the release evidence. Do not overwrite the production `tutor v44` function.
4. In Supabase Dashboard, verify the actual database backup/PITR availability and capture a pre-release backup reference and timestamp. The organization is on the Free plan; do not assume point-in-time recovery or a specific retention window is available.
5. Export the production migration ledger and record the current schema/migration state. If no SQL migration is part of the release, do not run one.
6. Record current production function versions and their verification settings (listed in Section 2).
7. Keep all production secret values out of the backup manifest; record only the secret names and whether each is present.

### Rollback order

1. **Frontend:** reassign the production aliases to the verified Vercel rollback deployment `dpl_GJ9qWLsG9LeFRxECC3adKDZ5VHqJ`. Verify the three production aliases serve the prior release.
2. **Edge Functions:** redeploy the captured production function snapshots at the recorded versions/configuration. Restore `live-voice-session` and `live-voice-groq` first if voice is the failing surface. Restore `tutor-v2` only if its release change caused a regression.
3. **Legacy Tutor:** leave `tutor v44` untouched. It is not part of this release's rollback path.
4. **Secrets/flags:** if Groq is misbehaving, set production `GROQ_VOICE_ENABLED=false` to disable fallback safely. Do not remove or rotate Gemini/Groq keys during an incident unless compromise is suspected.
5. **Database:** only restore the pre-release database backup if an approved schema/data migration was applied and evidence shows data corruption. Do not restore the database for a frontend-only or Edge Function-only regression.
6. Verify login, lesson progress, Dictionary, Tutor text chat, class/live-room features, and the legacy production pages after rollback.

Rollback is not complete until production aliases, Edge Function versions, Auth, Tutor text requests, and core learner workflows are verified.

## 6. Controlled deployment sequence

1. Close all staging blockers and freeze the final branch SHA.
2. Obtain approval to merge PR #35 into its declared base branch `feat/bilingual-voice-tutor`.
3. Run the base-branch integration suite. Then prepare a separate reviewed promotion from the release base to `main`; PR #35 does not target `main` directly.
4. Configure production Vercel runtime variables and production Supabase secrets/origin allowlist only after explicit production approval.
5. Capture backup references and rollback snapshots.
6. Deploy production Edge Functions in a controlled order: broker, Groq fallback (gateway JWT verification enabled), then Tutor V2 if the provider-policy change is included. Verify each function before continuing.
7. Deploy the Vercel production build and verify the new deployment before alias promotion.
8. Promote the deployment to production aliases only after smoke tests pass.
9. Monitor Supabase function logs, Vercel runtime errors, provider 4xx/5xx, and fallback rate for the agreed observation window.
10. Close the release only after post-deployment acceptance and rollback readiness are signed off.

## 7. Release approval record

**Current decision: NOT APPROVED — HOLD**

| Approval | Owner | Status |
|---|---|---|
| Engineering / CI sign-off | Release engineer | Pending final CI |
| Staging runtime acceptance | Product owner / tester | Pending real-device test |
| Security review | Security owner | Pending findings review |
| Backup and rollback readiness | Release engineer | Pending backup reference and function snapshots |
| Production configuration approval | Product owner | Pending explicit approval |
| Production deployment authorization | Product owner | Not granted |

**Release owner decision:** Pending  
**Approved release SHA:** Pending  
**Production deployment ID:** Pending  
**Backup reference and timestamp:** Pending  
**Rollback operator:** Pending  
**Approval timestamp:** Pending

No production deployment is authorized by this runbook's creation.
