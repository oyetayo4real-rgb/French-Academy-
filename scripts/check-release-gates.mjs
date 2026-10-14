#!/usr/bin/env node
/**
 * Static release-gate assertions for Académie Française.
 * Run from repository root: node scripts/check-release-gates.mjs
 * This is not an authenticated integration test or a capacity test.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const liveRoom = read("supabase/functions/live-room/index.ts");
const tutor = read("supabase/functions/tutor/index.ts");
const classroom = read("features/ai-classroom.js");
const architecture = read("docs/live-class-1000-architecture.md");

const pass = (name) => console.log("PASS", name);

const capGuard = liveRoom.indexOf("maxParticipants > 200");
const roomLookup = liveRoom.indexOf('const g = await D("/rooms/" + name)');
assert.ok(capGuard >= 0 && roomLookup > capGuard, "participant guard must run before existing-room lookup");
pass("participant cap is checked before room reuse");

assert.ok(liveRoom.includes("student_id=eq."), "students must be checked against class enrollment");
assert.match(liveRoom, /pr\[0\]\.role !== "student"/, "non-student roles must not join as students");
assert.match(liveRoom, /pr\[0\]\.role !== "lecturer"/, "class owners must have lecturer role");
pass("student enrollment and lecturer role authorization are present");

assert.match(liveRoom, /No fallback room was created/, "Daily room configuration errors must fail closed");
pass("room creation has no unsafe fallback");

assert.match(tutor, /ANTHROPIC_API_KEY/, "tutor provider key must be read server-side");
assert.match(tutor, /if \(!uid\).*not_signed_in/s, "tutor must reject missing/unverified authenticated user");
assert.match(tutor, /claude-sonnet-5/, "default tutor model must be a documented API model ID");
pass("tutor requires authenticated identity and a configured provider key");

assert.match(classroom, /updateParticipant\(session, \{ setAudio: false \}\)/, "lecturer action must support remote mute");
assert.doesNotMatch(classroom, /setAudio:\s*true/, "lecturer UI must not remotely unmute students");
assert.doesNotMatch(classroom, /setAudio:\s*!wasOn/, "toggle must not switch from mute to remote unmute");
assert.match(classroom, /Student controls microphone/, "student microphone control must be explicit");
assert.match(classroom, /updateParticipant\(session, \{ eject: true \}\)/, "lecturer removal control must remain");
pass("lecturer can mute/remove, but cannot remotely unmute a student");

assert.match(architecture, /Do not run a 1,000-user test against the production classroom/, "load testing must be staging-only");
assert.match(architecture, /not the finished ILS audience\/stage architecture/i, "standard Daily call must not be represented as completed ILS");
pass("architecture retains ILS, staging, and capacity release gates");

console.log("");
console.log("STATIC CHECKS PASSED. This result does NOT prove authenticated AI, classroom moderation, mobile behavior, Daily ILS entitlement, or participant capacity.");
