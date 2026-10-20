#!/usr/bin/env node
/**
 * Static audit of reconstructed candidate table GRANT statements against the
 * captured table-grant catalog. This is NOT SQL execution or database parity.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const snapshotPath = "docs/schema-snapshot/09-table-grants.json";
const sqlPath = "supabase/reconstructed-local-only/001_reconstructed_baseline_candidate.sql";
const grants = JSON.parse(readFileSync(snapshotPath, "utf8"));
const sql = readFileSync(sqlPath, "utf8");

const key = (table, grantee, privilege) => [table, grantee, privilege].join("|");
const expected = new Map();
for (const row of grants) {
  const k = key(row.table, row.grantee, row.privilege);
  const value = row.grantable === "YES";
  if (expected.has(k) && expected.get(k) !== value) {
    throw new Error(`Conflicting snapshot ACL rows for ${k}`);
  }
  expected.set(k, value);
}

const actual = new Map();
const grantRe = /^GRANT\s+(.+?)\s+ON TABLE public\."([^"]+)" TO "([^"]+)"( WITH GRANT OPTION)?;$/gm;
for (const match of sql.matchAll(grantRe)) {
  const [, privileges, table, grantee, grantOption] = match;
  for (const privilege of privileges.split(/,\s*/)) {
    const k = key(table, grantee, privilege);
    const value = Boolean(grantOption);
    if (actual.has(k) && actual.get(k) !== value) {
      throw new Error(`Conflicting candidate ACL statements for ${k}`);
    }
    actual.set(k, value);
  }
}

const missing = [...expected].filter(([k, value]) => actual.get(k) !== value);
const extra = [...actual].filter(([k, value]) => expected.get(k) !== value);
assert.equal(missing.length, 0,
  `Candidate is missing or changes ${missing.length} captured table-grant records: ${missing.slice(0, 10).map(([k]) => k).join(", ")}`);
assert.equal(extra.length, 0,
  `Candidate adds or changes ${extra.length} table-grant records not represented by the snapshot: ${extra.slice(0, 10).map(([k]) => k).join(", ")}`);

const triggerInventory = JSON.parse(readFileSync("docs/schema-snapshot/10-triggers-views-sequences-rls.json", "utf8"));
assert(Array.isArray(triggerInventory.triggers), "Snapshot trigger inventory must be an array");
assert.equal(triggerInventory.triggers.length, 0,
  "Trigger inventory changed; manually review trigger DDL before accepting candidate");

assert(sql.includes("-- NOT YET REVIEWED OR REPLAY-VERIFIED"),
  "Candidate must retain the unreviewed/unverified safety banner");
assert(!/\b(?:supabase\s+link|supabase\s+db\s+push)\b/i.test(sql),
  "Candidate must not contain hosted-link or hosted-push commands");

console.log(`PASS: ${expected.size} captured table-grant records match candidate GRANT statements exactly.`);
console.log("PASS: trigger inventory remains empty; no trigger was invented from a function definition.");
console.log("PASS: candidate safety banner remains present.");
console.log("LIMIT: static ACL text comparison only; no SQL parser, local replay, role test, or catalog parity was performed.");
