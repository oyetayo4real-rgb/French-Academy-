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
const answerKeyPatch = read("supabase/patches/20261014_remove_exam_answer_key_responses.sql");

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

assert.ok(tutor.includes("function providerConfig()"), "provider and API key must be selected together");
assert.ok(tutor.includes('gemini: ["GEMINI_API_KEY", "AI_API_KEY"]'), "Gemini must use its dedicated or explicit generic key");
assert.ok(tutor.includes("No CEFR restriction"), "Tutor must support unrestricted detailed answers");
assert.ok(!tutor.includes("thinkingBudget: 0"), "Tutor must not force the thinking budget to zero");
assert.ok(tutor.includes("if (!uid)"), "Tutor must require authenticated identity");
pass("provider/key pairing, unrestricted Tutor default and authentication guard are present");

// Dictionary regressions: use only French lexical groups, never English entries as French.
assert.ok(tutor.includes("const frenchGroups = Array.isArray(wiki?.fr)"), "dictionary must read French lexical groups only");
assert.ok(!tutor.includes("wiki.en"), "dictionary must not fall back to English definitions");
assert.ok(tutor.includes("CC BY-SA 4.0"), "Wiktionnaire licence/attribution must be preserved");
assert.ok(classroom.includes("Sources & attribution"), "dictionary UI must show source links and licence notes");
assert.ok(classroom.includes("Unrestricted · full depth"), "Tutor UI must offer unrestricted answers");
assert.ok(classroom.includes("No reliable French dictionary entry"), "dictionary UI must show an honest not-found state");
pass("French-only dictionary results, attribution, not-found state, and unrestricted Tutor UI are present");

assert.match(classroom, /updateParticipant\(session, \{ setAudio: false \}\)/, "lecturer action must support remote mute");
assert.doesNotMatch(classroom, /setAudio:\s*true/, "lecturer UI must not remotely unmute students");
assert.doesNotMatch(classroom, /setAudio:\s*!wasOn/, "toggle must not switch from mute to remote unmute");
assert.match(classroom, /Student controls microphone/, "student microphone control must be explicit");
assert.match(classroom, /updateParticipant\(session, \{ eject: true \}\)/, "lecturer removal control must remain");
pass("lecturer can mute/remove, but cannot remotely unmute a student");

assert.match(architecture, /Do not run a 1,000-user test against the production classroom/, "load testing must be staging-only");
assert.match(architecture, /not the finished ILS audience\/stage architecture/i, "standard Daily call must not be represented as completed ILS");
pass("architecture retains ILS, staging, and capacity release gates");

const returnBlocks = answerKeyPatch.match(/return jsonb_build_object\([\s\S]*?\);/gi) || [];
assert.equal(returnBlocks.length, 2, "SQL patch must define both scoring response payloads");
assert.doesNotMatch(returnBlocks[0], /\x27lkeys\x27|\x27rkeys\x27/, "exam RPC must not return listening/reading answer keys");
assert.doesNotMatch(returnBlocks[1], /\x27answers\x27/, "quiz RPC must not return the answer array");
assert.match(answerKeyPatch, /REVOKE EXECUTE ON FUNCTION public\.submit_exam\(jsonb\) FROM PUBLIC, anon/);
assert.match(answerKeyPatch, /REVOKE EXECUTE ON FUNCTION public\.submit_quiz\(text, jsonb\) FROM PUBLIC, anon/);
pass("SQL patch removes answer-key responses and limits scoring RPCs to authenticated use");

console.log("");
console.log("STATIC CHECKS PASSED. This result does NOT prove authenticated AI, classroom moderation, mobile behavior, Daily ILS entitlement, or participant capacity.");
