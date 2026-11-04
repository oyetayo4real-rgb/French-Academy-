import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("supabase/functions/live-room/index.ts", "utf8");
const pos = (needle) => source.indexOf(needle);

assert.ok(pos('if (!uid) return J({ error: "not_signed_in" }, 401);') >= 0, "must require a signed-in user");
assert.ok(pos("/enrollments?class_id=eq.") >= 0 || pos("/rest/v1/enrollments?class_id=eq.") >= 0, "must query class enrollment");
assert.ok(pos('pr[0].role !== "lecturer"') >= 0, "class owner must have lecturer profile role");
assert.ok(pos('pr[0].role !== "student"') >= 0, "non-owner must have student profile role");
assert.ok(pos("Supabase authorization lookup failed.") >= 0, "failed role/enrollment lookups must fail closed");
assert.ok(pos("maxParticipants > 200") >= 0, "regular room maximum must not exceed 200");
assert.ok(pos("maxParticipants > 200") < pos('const g = await D("/rooms/" + name)'), "participant guard must run before existing room reuse");
assert.ok(source.includes("No fallback room was created"), "Daily room errors must not create a weaker fallback");

console.log("PASS: authentication, enrollment, role checks, fail-closed lookups, and room cap ordering");
console.log("NOTE: static assertions are not authenticated integration tests and do not authorize production deployment.");
