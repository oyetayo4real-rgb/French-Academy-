# Release Verification Runbook — Académie Française

**Current decision: HOLD.** Keep draft PR #1 open and unmerged. The production website and production Edge Functions have not been changed by this runbook. Static source checks are not end-to-end verification.

## What has been verified

On draft head f73d898, the reported static JavaScript checks and TypeScript parse/transpile checks passed. The live-room source checks enrollment and lecturer role, rejects configured limits above 200 before looking up an existing room, and does not silently fall back to weaker room settings. Production unauthenticated requests returned HTTP 401 for tutor, live-room, and turn-credentials.

The latest redacted Supabase log aggregation available to this review showed only five Edge Function entries in the last 24 hours: two tutor 401s, two live-room 401s, and one turn-credentials 401. This confirms request rejection without credentials; it is not evidence of an authenticated tutor success. No model output, credentials, request bodies, or user identifiers were selected in that aggregation.

## 1. Isolate staging before testing

Do not use the current Vercel preview for authenticated room tests while it points to the production Supabase project.

1. In Vercel, use a non-production deployment/preview with access for authorized test accounts. Do not disable organization-wide SSO or make a deployment public as a workaround.
2. Create or approve a dedicated Supabase staging environment. The current Supabase project has no development branches listed. Before creating a paid branch/project, confirm the target organization and the quoted price with the project owner.
3. Use separate staging authentication users, class/enrollment records, Daily rooms, provider secrets, AI quota, and logs. Do not copy production user data into staging.
4. Configure only the staging Vercel deployment to use the staging Supabase URL and publishable/anon key. Confirm the URL/ref in the browser's network panel before signing in.
5. Confirm staging endpoints have verify_jwt enabled. Do not weaken production auth or share test JWTs in PR comments, chat, screenshots, or logs.

## 2. Verify secret NAMES in the staging Supabase dashboard

Open **Supabase Dashboard → staging project → Edge Functions → Secrets**. Check the names below without copying or revealing secret values. Use the environment's normal secret manager to add missing values; never put values in GitHub, source files, browser variables, screenshots, or this chat.

| Name | Used by | Requirement |
|---|---|---|
| ANTHROPIC_API_KEY | tutor | Required for real AI tutor/dictionary requests |
| DAILY_API_KEY | live-room | Required for Daily room/token calls |
| CF_TURN_KEY_ID | turn-credentials | Required only if Cloudflare TURN credentials are used |
| CF_TURN_API_TOKEN | turn-credentials | Required only if Cloudflare TURN credentials are used |
| TUTOR_MODEL | tutor | Optional override; otherwise source defaults to the documented claude-sonnet-5 API ID |
| MAX_PARTICIPANTS | live-room | Optional; current standard-room path must remain between 2 and 200 and refuses values above 200 |
| DAILY_RECORDING | live-room | Optional; use only after the chosen recording mode is approved and tested |

Supabase normally injects its standard runtime variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) into Edge Functions. Do not create duplicate values blindly. The tutor uses the server-side service-role key for its quota/cache database operations; it must never reach the browser bundle.

A secret-name check does not prove the secret value is valid. Only an authenticated provider request, response classification, and appropriately redacted logs can establish that.

## 3. Run the authenticated AI smoke test locally against staging

A one-request script was added at scripts/smoke-tutor.mjs. It intentionally refuses the known production project reference, uses a fixed low-token A1 prompt, and prints only HTTP status, success/failure, and a stable error code. It never prints the JWT, API key, or model output. It consumes one staging tutor quota/provider call, so use a dedicated staging student.

From the repository root, set the staging values in a local shell without posting them anywhere:

~~~sh
read -r -p "Staging Supabase URL: " SUPABASE_URL
read -r -p "Staging anon/publishable key: " SUPABASE_ANON_KEY
read -r -s -p "Staging test-student JWT: " SUPABASE_TEST_USER_JWT
printf '\n'
export SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_TEST_USER_JWT
node scripts/smoke-tutor.mjs
unset SUPABASE_TEST_USER_JWT SUPABASE_ANON_KEY
~~~

A pass requires HTTP success, JSON ok: true, and a non-empty tutor text field. If it fails, share only the printed status/error code and a time window; never share request headers, JWT, provider key, full request body, or model output.

After running, inspect staging only → Edge Functions → Logs for the tutor request. Check the timestamp, status, duration, and redacted error category. Avoid raw request headers/bodies and do not add secrets to debug logs. A 401 means authentication/token setup failed; 503 not_configured points to missing required configuration; 502 ai_error means the provider request failed; a quota 429 is not a successful smoke test. The function currently deliberately returns generic provider errors, so inspect provider/dashboard status separately if a 502 persists.

## 4. Daily ILS: obtain written confirmation before large-class implementation

Public documentation distinguishes:
- Large real-time calls: up to 1,000 participants with all active.
- Interactive Live Streaming (ILS): up to 100,000 participants, with a bounded number of active participants/presenters (the public scaling guide currently lists 25 active).
- RTMP streaming: passive viewers with higher latency.

For a lecture with a large audience and a small invited-speaker group, ILS appears to be the relevant product path. Public product claims are not proof that this Daily account is entitled to ILS or that the planned moderation model is available on its account.

Official sources:
- ILS product overview: https://www.daily.co/products/interactive-live-streaming/
- Daily scaling guide: https://docs.daily.co/docs/guides/scaling-calls
- Daily pricing: https://www.daily.co/pricing/video-sdk/
- Daily sales/general inquiry: https://live.daily.co/general-inquiries

Send this request through Daily's official contact channel and retain the written response in the project records:

**Subject:** Written confirmation requested — ILS capacity, stage controls, and pricing for a 1,000+ attendee education lecture

**Message:**

We are building Académie Française, an online French-learning platform. Our target is a lecture-style class with 1,000+ concurrent attendees, one or a few lecturers, and a limited number of invited student speakers. Most attendees should join as audience/listeners with microphone and camera off; students raise a hand, the lecturer invites a student, the student accepts and explicitly enables their own microphone, and the lecturer can mute or remove a speaker when supported by Daily permissions.

Please confirm in writing:
1. Whether Interactive Live Streaming is enabled and available for our Daily domain/account; if not, the onboarding steps.
2. The recommended current SDK/API architecture for audience listeners plus a lecturer/stage, and whether the regular Daily Prebuilt room is unsuitable for this design.
3. The supported maximum concurrent audience size and active speakers/co-hosts for this account, including any track, subscription, chat, hand-raise, and speaker-promotion limits.
4. Exact supported mechanics and permission requirements for raise-hand, lecturer invitation, student acceptance, granting/revoking speaker permissions, mute, and removal. We will not assume remote microphone activation on a student's device.
5. Pricing for 1,000 attendees across a 60- or 90-minute lecture, including audience minutes, active speaker minutes, streaming/recording options, and any platform minimums or enterprise charges.
6. Regional availability/latency considerations for students connecting from Nigeria on mobile networks, plus any concurrency-test approval/limits.
7. Whether you can approve a non-production load test at 100, 250, 500 and 1,000+ participants, and any required ramp rates or monitoring.

Please state any account-specific restrictions and recommend the exact configuration for this use case.

**Do not report this gate as passed until Daily has actually replied in writing.** No provider contact or entitlement confirmation was obtained by this review.

## 5. Role-based staging test matrix

Use separate lecturer, enrolled student, non-enrolled student, and unrelated account sessions. Capture expected result, actual result, browser/device, timestamp, and redacted request ID. Never use production students or a production room.

| Test | Expected behavior |
|---|---|
| Unauthenticated request to live-room and tutor | Rejected with 401 |
| Enrolled student joins a class after lecturer opens its room | Receives least-privilege student token; media starts off |
| Non-enrolled student requests the same class room | Rejected with 403; no room token returned |
| Student tries to join as lecturer / set owner role in browser payload | Ignored/rejected; role comes from server-side profile/class ownership |
| Lecturer joins the class they own | Lecturer-only controls appear |
| Student raises hand | Queue appears to lecturer; duplicate/forged cross-class requests rejected |
| Lecturer invites a raised-hand student | Invite is bound to current class/session and expires |
| Student declines or accepts the invite | Decline leaves them as audience; accept shows clear UI and requires student to explicitly enable microphone |
| Lecturer mutes a speaking student | Mute succeeds only with provider-supported permissions |
| Lecturer clicks remove | Participant is removed; enrolment remains unchanged; attempted rejoin follows explicit policy |
| Student attempts mute/remove/promote another user | Rejected; no lecturer control or server permission |
| Lecturer disconnects/rejoins; student reconnects | Queue, permissions, and roster recover without stale invitations or privilege escalation |
| Mobile Safari/Chrome and low-bandwidth Android | Layout usable; audience media remains off by default; network loss/reconnect is handled |
| Tutor, dictionary, lesson expansion | Authenticated request succeeds; quota applies; provider failure is generic and does not leak secrets |

**Current known gap:** the UI bridge still embeds a standard Daily call. It does not implement the final ILS audience/stage role-transition service, server-authorized hand-raise/invitation state machine, or capacity proof. Do not mark those rows complete based on source inspection alone.

## 6. Load test and release gates

Only after Daily has approved the exact architecture/capacity and staging is isolated:
1. Run 2-user lecturer/student tests first.
2. Ramp 100 → 250 → 500 → 1,000+ concurrent audience participants under provider-approved rates.
3. At every step measure join success/time, stage audio latency, reconnects/dropped sessions, resource load, moderation latency, and mobile/browser CPU-memory-bandwidth. Include Nigerian mobile-network conditions and audio-only/low-bandwidth fallbacks.
4. Run the agreed-duration soak test at target load, then export a redacted report with test build SHA, staging project/ref, provider configuration (no keys), concurrency profile, results, incidents, and stop criteria.
5. Do not attempt 1,000+ on a regular room whose code deliberately caps at 200. Do not load-test production.

## 7. Rollback plan

- **While the release is on HOLD:** keep PR #1 in draft. Production remains on the current main and current production Supabase functions. Do not merge or deploy.
- **Staging failure:** stop the load test, close the staging session, disable the staging preview from tester access, and redeploy the last known-good staging deployment. Restore only staging environment variables from their recorded configuration; rotate any credential that appeared in logs.
- **Future production release (only after gates pass):** record current Vercel deployment and Supabase function versions before release. Use the platform's previous-deployment rollback for the frontend and redeploy the recorded prior function sources for backend rollback. Verify production homepage, login, existing lessons/progress, and existing live-class flow after rollback.
- Keep the change set additive and retain a release decision record. No rollback or production action is being performed by this document.

## 8. Additional Supabase security advisor findings

A review on 2026-10-14 showed:
- Seven RLS-enabled tables without policies: ai_usage, app_secrets, custom_keys, dict_cache, exam_crit, exam_keys, quiz_keys.
- Seven SECURITY DEFINER RPCs callable by authenticated users: become_lecturer, delete_my_account, grade_submission, join_class, save_custom_lesson, submit_exam, submit_quiz.
- Leaked-password protection disabled.

The answer-key exposure is an actionable finding. The draft now contains a reviewable SQL patch at supabase/patches/20261014_remove_exam_answer_key_responses.sql: it removes the lkeys/rkeys fields from submit_exam responses, removes the answer array from submit_quiz responses, rejects null auth.uid() in both scoring RPCs, and limits execution to the authenticated role (revoking PUBLIC/anon grants). The current app exam screen uses score/criteria fields only; the quiz sync path ignores the RPC return body. Apply this patch in staging first and verify both response payloads before planning production rollout.

This patch is intentionally stored under supabase/patches, not represented as an automatically applied migration, because the repository currently lacks the original migration history that created the production RPCs. Do not apply it directly to production from this PR. The remaining project-wide findings still need a reviewed remediation plan. Do not blindly revoke the other RPCs or add broad policies: first inspect each function body, intended caller, grants, and app call sites in staging; then apply least-privilege grants/policies in a reviewed migration. Enable leaked-password protection in Auth settings after validating the sign-in/password-reset experience in staging.
