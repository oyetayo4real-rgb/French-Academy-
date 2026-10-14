#!/usr/bin/env node
/**
 * One-request authenticated tutor smoke test.
 *
 * Run only against an isolated staging Supabase project, never production:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_TEST_USER_JWT=... node scripts/smoke-tutor.mjs
 *
 * Use a dedicated staging student account. The call consumes AI quota/provider usage.
 * Credentials and model output are intentionally never printed.
 */
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_TEST_USER_JWT"];
for (const name of required) {
  if (!process.env[name]) {
    console.error("Missing required environment variable:", name);
    process.exit(2);
  }
}

const base = process.env.SUPABASE_URL.replace(/\/+$/, "");
let host;
try {
  host = new URL(base).hostname;
} catch {
  console.error("SUPABASE_URL must be a valid URL.");
  process.exit(2);
}

// Production guard: do not let an operator accidentally spend production AI quota.
if (host === "zzphvgkooaylxurwrlqx.supabase.co") {
  console.error("Refusing to run against the production Supabase project. Use isolated staging.");
  process.exit(2);
}

let response;
let payload = {};
try {
  response = await fetch(base + "/functions/v1/tutor", {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + process.env.SUPABASE_TEST_USER_JWT,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mode: "chat",
      level: "A1",
      text: "Reply with exactly: tutor smoke test passed."
    }),
    signal: AbortSignal.timeout(30000)
  });
  payload = await response.json().catch(() => ({}));
} catch (error) {
  console.error("Tutor smoke test could not reach staging:", error?.name || "network_error");
  process.exit(1);
}

const ok = response.ok && payload?.ok === true && typeof payload?.text === "string" && payload.text.length > 0;
// Deliberately log only status, boolean outcome and the stable error code; never log tokens or response text.
console.log(JSON.stringify({
  httpStatus: response.status,
  authenticatedTutorRequestSucceeded: ok,
  errorCode: typeof payload?.error === "string" ? payload.error : undefined
}, null, 2));

if (!ok) process.exit(1);
