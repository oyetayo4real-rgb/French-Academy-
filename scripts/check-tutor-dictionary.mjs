#!/usr/bin/env node
/**
 * Focused static regression checks for the Tutor and dictionary reliability repair.
 * Run from the repository root: node scripts/check-tutor-dictionary.mjs
 * These checks do not call AI providers and are not authenticated integration tests.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const tutor = readFileSync("supabase/functions/tutor/index.ts", "utf8");
const classroom = readFileSync("features/ai-classroom.js", "utf8");
const pass = (name) => console.log("PASS", name);

// Keep model discovery and each model attempt bounded so sequential fallback fits
// within the frontend's practical request budget.
assert.match(tutor, /timeoutMs = 4800, maxCandidates = 2/);
assert.match(tutor, /AbortSignal\.timeout\(1000\)/);
assert.match(tutor, /slice\(0, Math\.max\(1, Math\.min\(maxCandidates, 3\)\)\)/);
pass("Gemini model discovery and candidate attempts have bounded timeouts");

// A successful HTTP status with no text is not a successful answer; try the next
// allowed candidate and preserve the existing safe error path if all candidates fail.
assert.match(tutor, /Gemini model returned an empty response; trying fallback/);
assert.match(tutor, /if \(output\) return output;[\s\S]*?continue;/);
assert.match(tutor, /\[500, 502, 503, 504\]\.includes\(response\.status\)/);
pass("Empty model output and transient provider failures can reach fallback");

// Dictionary source outages should not trigger the accent-recovery search, and all
// external source calls must remain bounded.
assert.match(tutor, /if \(!entries\.length && wikiTextSource\)/);
assert.match(tutor, /AbortSignal\.timeout\(6000\)/);
assert.match(tutor, /AbortSignal\.timeout\(2500\)/);
assert.match(tutor, /AbortSignal\.timeout\(3000\)/);
pass("Dictionary outage handling avoids unnecessary recovery requests and bounds lookup waits");

// Quota infrastructure failures are classified as unavailable, not unhandled 500s.
assert.match(tutor, /\[tutor\] quota RPC unavailable/);
assert.match(tutor, /return \{ ok: false, status: 503 \};/);
assert.match(tutor, /AbortSignal\.timeout\(2500\)/);
pass("Quota checks have a timeout and fail closed");

// The UI must show backend error messages and never save an empty model response
// as if it were a valid assistant answer.
assert.match(classroom, /if \(response && response\.error\)/);
assert.match(classroom, /fallbackMessages/);
assert.match(classroom, /typeof response\.text !== "string" \|\| !response\.text\.trim\(\)/);
assert.match(classroom, /FA_AI\.messages\.push\(\{ role: "assistant", content: response\.text\.trim\(\) \}\)/);
pass("Tutor UI exposes backend errors and rejects empty answers");

const syntax = spawnSync(process.execPath, ["--check", "features/ai-classroom.js"], { encoding: "utf8" });
assert.equal(syntax.status, 0, "Frontend JavaScript syntax check failed: " + (syntax.stderr || syntax.stdout));
pass("Frontend JavaScript parses with Node.js");

console.log("");
console.log("STATIC CHECKS PASSED. No network calls or provider requests were made.");
console.log("Not covered: Deno TypeScript type-checking, authenticated Supabase requests, provider latency/quota, live dictionary source availability, and translation quality.");
