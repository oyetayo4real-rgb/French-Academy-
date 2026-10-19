# Isolated local verification for French Academy

This workflow uses a separate GitHub Codespace and a local Supabase stack. It does not create a hosted Supabase project/branch and does not deploy to production.

## Safety boundaries

- Work only on branch `nexus/local-isolated-staging`.
- Do not add production API keys, service-role keys, user tokens, or database URLs to Git.
- Do not run `supabase link`, `supabase db push`, or any production deployment command for this workflow.
- A Codespace is a cloud compute environment and may consume the account's included usage or incur charges. Check the GitHub Codespaces usage page before creating it; stop/delete the Codespace when finished.
- Local Supabase containers use local resources only. Real Gemini requests may incur provider usage and are not part of the default tests.

## Create the isolated environment

1. Open the repository and switch to branch `nexus/local-isolated-staging`.
2. Choose **Code → Codespaces → Create codespace on nexus/local-isolated-staging**. The repository includes a devcontainer to install Node, Docker CLI, Supabase CLI, and Deno.
3. In the Codespaces terminal, confirm tools are available:

   ```sh
   supabase --version
   deno --version
   docker info
   ```

4. Start the local Supabase services:

   ```sh
   supabase start
   supabase status
   ```

   Keep all returned URLs local to the Codespace. Do not copy secret keys into chat or repository files.

## Current verification that is safe to run

Run the existing no-live-provider checks from the repository root:

```sh
node scripts/check-tutor-dictionary.mjs
deno test --allow-env=AI_PROVIDER,GEMINI_API_KEY supabase/functions/tutor/tutor.test.ts
```

These tests mock external provider calls. They do not spend Gemini quota or contact the production API.

## Important integration gap to resolve before claiming authenticated end-to-end success

The current repository contains the Tutor Edge Function and unit tests, but no checked-in Supabase database migrations or schema for the `ai_use(p_uid)` quota RPC. The Tutor function calls that RPC and fails closed if it is unavailable. Therefore, starting local Supabase alone is not enough to prove a successful authenticated Tutor request.

Before an end-to-end test, add the approved schema-only migrations needed by the app to this isolated branch, including the real `ai_use` implementation, and provision a dedicated local test user. Do not copy production user data. If the schema exists only in the hosted project, export schema/migrations through an approved read-only path and review it before applying locally.

## Staged test sequence

1. Run the existing unit and static checks.
2. Apply reviewed schema-only migrations to the local stack.
3. Create a dedicated local Auth user and obtain a local access token through Supabase Auth; do not paste the token into chat or logs.
4. Serve the Tutor function locally with local Supabase settings and a provider key supplied only through an untracked local env file or Codespaces secret.
5. Test one Tutor request and one dictionary lookup against the local endpoint.
6. Repeat requests enough times to calculate median and p95 latency. Redact bearer tokens, keys, user IDs, and request contents from logs.
7. Stop the local stack with `supabase stop` and stop/delete the Codespace when finished.

No production deployment or production requests are part of this workflow.
