# Tutor v2 rollout rollback

## Roll back the application

If the Tutor v2 integration causes a production issue after this change is approved and merged:

1. Open the repository on GitHub and select **Pull requests**.
2. Open the merged PR for `feat/switch-tutor-v2`.
3. Open its **Commits** tab and select the single switch commit.
4. On the commit page, select **Revert**. GitHub will prepare a revert change and pull request.
5. Review the generated revert. Confirm that it changes the Tutor function slug back to `tutor` and restores the prior service-worker cache version.
6. Create the revert pull request, run the required checks, and merge that revert PR after review.
7. Confirm the Git-integration deployment for the revert is Ready and the application is again calling `tutor`.

Do not manually edit production function deployments as part of this application rollback.

## Production fallback

The existing Supabase Edge Function `tutor` remains deployed at production version **v44** with JWT verification enabled. This rollout does not modify, redeploy, or delete it. It remains the fallback endpoint when the application slug is reverted to `tutor`.

## Tutor v2 operational monitoring

Monitor structured `tutor-v2` log events:

- `provider_attempt` — provider name, model, status and elapsed time. Use this to identify provider failures, rate limits and slow attempts.
- `request_failed` — sanitized error code and retryability. Use this to track failed requests and determine whether the client should offer a retry.

Inspect event metadata only. Do not log, request, inspect or expose user prompts, conversation history, provider request/response bodies, generated answers, authorization headers, API keys or JWTs.
