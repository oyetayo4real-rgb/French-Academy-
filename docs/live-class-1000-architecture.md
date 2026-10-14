# Académie Française: 1,000+ attendee live-class architecture

Status: design and acceptance criteria for draft PR #1. This document is not evidence of a deployed or load-tested classroom.

## Decision

Use Daily Interactive Live Streaming (ILS) for the audience plane, with a controlled lecturer/stage plane and a custom hand-raise / invite-to-speak workflow. Do not treat a standard Daily room's `max_participants: 200` setting or the existing embedded call UI as proof that a single standard room is ready for 1,000+ lecture attendees.

Daily's public product documentation describes ILS for up to 100,000 real-time participants, with real-time engagement and the ability to bring viewers onto stage. Daily's regular-call guidance says to contact Daily for calls above 200, and its scaling guidance distinguishes ILS from large calls. Before production, obtain confirmation from Daily for the account's ILS entitlement, capacity, room configuration, SDK/API flow, pricing, regional availability, and moderation/co-host limits for this exact education use case.

Provider references:
- https://www.daily.co/products/interactive-live-streaming/
- https://docs.daily.co/guides/configurations-and-settings/setting-up-calls
- https://docs.daily.co/guides/products/prebuilt/customizing-daily-prebuilt
- https://docs.daily.co/reference/daily-js/daily-call-client

## Participant model

- Audience (default): microphone and camera off; receives the lecturer stream; can use text chat and raise a hand.
- Lecturer: owns the room, controls the session, sees raised hands, invites a selected student to speak, and can remove disruptive attendees.
- Invited speaker: temporarily receives a stage/speaker role and microphone permission. Camera stays off unless needed and explicitly enabled.
- After speaking: lecturer returns the student to audience/listener state and revokes stage privileges.
- Moderator: optional separate role for managing the queue and removing attendees without giving broad room-owner powers.

Do not promise remote microphone activation on a student's device. Use a clear invite/permission flow: the lecturer invites the student to stage; the student accepts the prompt and explicitly enables their microphone. A moderator may mute or remove participants where the provider's role/permissions support it.

## Application flow

1. Authenticate the user through existing Académie Française authentication.
2. Call the existing Supabase `live-room` Edge Function; never expose Daily API keys in browser code.
3. The Edge Function validates class membership and lecturer/moderator role, creates or retrieves the correct ILS session, and issues short-lived room-scoped tokens with least privilege.
4. Audience clients join in listener mode with media disabled by default.
5. Hand-raise events enter a server-authorized queue (Supabase Realtime or equivalent); server-side authorization must prevent audience users from inviting speakers, changing roles, or ejecting others.
6. Lecturer selects a raised hand; server validates role and participant/session, then performs the provider-supported invite/promote flow.
7. Speaker accepts and explicitly grants microphone permission; lecturer can mute or remove as allowed by provider APIs.
8. Speaker returns to audience state after their turn. All role changes and moderation actions are audit-logged without recording unnecessary personal data.

## Important implementation gap

The current PR's browser feature bridge embeds a regular Daily call UI. That is a useful prototype, but it is NOT the finished ILS audience/stage architecture. Do not merge it as the 1,000+ implementation until the ILS-specific SDK/API path and server-side role transitions are implemented and verified. Preserve the current production branch and UI while this remains a draft.

## Provider and security gates

- Daily confirms ILS is enabled for this account and the exact room/session model supports at least 1,000 concurrent audience participants plus the planned speakers/moderators.
- Written confirmation of pricing, participant/track limits, and any restrictions for inviting participants onto stage.
- Room tokens are short-lived, scoped to one room/session, and issued only after server-side authorization.
- Audience tokens cannot obtain owner/moderator permissions; do not trust role values supplied by the browser.
- Rate-limit hand raises, chat, invitation actions, and join-token creation.
- Prevent duplicate/forged participant identities and unauthorized room entry.
- Microphone and camera are off by default for audience members; students explicitly accept invitations and grant browser permissions.
- No API keys or provider secrets in frontend bundles or logs.

## Verification plan (required before production)

### Automated
- Unit tests: role authorization, hand-raise queue ordering/deduplication, invitation expiry, accept/decline, return-to-audience, removal, token scope and expiry.
- API tests: unauthenticated requests, non-member access, student attempts to promote/eject, cross-class room IDs, expired tokens, replayed invitations, rate limits.
- UI tests: mobile layout, keyboard/screen-reader accessible hand-raise queue, lecturer controls, reconnect and failure states.

### Staged integration
- Two users first (lecturer + student), then multiple students on mobile and desktop browsers.
- Verify audience joins muted/camera-off; hand raised; lecturer invites; student accepts and explicitly turns on mic; lecturer mutes/removes; invited student returns to audience; removed user cannot immediately rejoin with the same valid session.
- Verify room exit, reconnect, lecturer disconnect/rejoin, stale queue cleanup and provider API failure handling.

### Capacity / soak
- Run a provider-approved staged ramp (100 → 250 → 500 → 1,000+ concurrent attendees) in a dedicated non-production room, then a soak test at the agreed target duration.
- Measure join success/time, audio/video latency for stage, dropped/reconnected sessions, server/Realtime load, moderation action latency, browser memory/CPU and bandwidth across low-end Android devices.
- Validate under Nigerian mobile-network conditions and include audio-only/low-bandwidth fallbacks.
- Do not run a 1,000-user test against the production classroom or production users.
- Production release gate: no unresolved critical/high issues, documented results, confirmed provider capacity and rollback plan.

## Release decision

Keep PR #1 as Draft. A successful Vercel preview deployment and JavaScript syntax checks do not prove ILS behavior, permissions, moderation, or 1,000-user capacity. Merge/deploy only after provider confirmation, implementation of the ILS-specific flow, passing security/integration tests, and recorded capacity-test evidence.
