#!/usr/bin/env node
/**
 * Validate the committed schema-catalog snapshot before it is used for
 * reconstruction. This checks artifact integrity and expected inventory counts;
 * it does NOT prove that the snapshot is a complete schema-only dump or that
 * reconstructed SQL is equivalent to the hosted database.
 *
 * Run from repository root: node scripts/check-schema-snapshot.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Invalid or unreadable JSON at ${path}: ${error.message}`);
  }
};
const pass = (label) => console.log("PASS", label);
const files = [
  "01-columns-a-g.json",
  "02-columns-h-p.json",
  "03-columns-q-z.json",
  "04-constraints.json",
  "05-indexes.json",
  "06-policies.json",
  "07-functions.json",
  "08-schema-grants-types.json",
  "09-table-grants.json",
  "10-triggers-views-sequences-rls.json",
];
const root = "docs/schema-snapshot/";
const data = Object.fromEntries(files.map((name) => [name, readJson(root + name)]));
pass(`All ${files.length} schema snapshot JSON artifacts parse`);

const array = (name, value) => {
  assert(Array.isArray(value), `${name} must be an array`);
  return value;
};
const columns = [
  ...array("01 columns", data["01-columns-a-g.json"]),
  ...array("02 columns", data["02-columns-h-p.json"]),
  ...array("03 columns", data["03-columns-q-z.json"]),
];
assert.equal(columns.length, 105, "Column inventory changed; review the expected count");
assert(columns.some((c) => c.schema === "public" && c.table === "profiles" && c.column === "id"),
  "Expected public.profiles.id is missing");
assert(columns.some((c) => c.schema === "public" && c.table === "ai_usage" && c.column === "user_id"),
  "Expected public.ai_usage.user_id is missing");
pass("105 column records and critical application columns are present");

const constraints = array("constraints", data["04-constraints.json"]);
const indexes = array("indexes", data["05-indexes.json"]);
const policies = array("policies", data["06-policies.json"]);
const functions = array("functions", data["07-functions.json"]);
const tableGrants = array("table grants", data["09-table-grants.json"]);
const metadata = data["08-schema-grants-types.json"];
const inventory = data["10-triggers-views-sequences-rls.json"];
assert.equal(constraints.length, 46, "Constraint count changed; review the expected count");
assert.equal(indexes.length, 36, "Index count changed; review the expected count");
assert.equal(policies.length, 39, "Policy count changed; review the expected count");
assert.equal(functions.length, 16, "Function count changed; review the expected count");
assert(tableGrants.length > 0, "Table grant inventory is unexpectedly empty");
assert(array("schema ACL", metadata.schema_acl).length > 0, "Schema ACL inventory is empty");
assert(array("extensions", metadata.extensions).length > 0, "Extension inventory is empty");
assert.equal(array("table RLS", inventory.table_rls).length, 22, "RLS table count changed");
assert(inventory.table_rls.every((table) => table.rls_enabled === true),
  "At least one captured public table has RLS disabled");
pass("Constraint, index, policy, function, grant, extension, and RLS inventories are structurally present");

assert(functions.some((fn) => fn.schema === "public" && fn.name === "ai_use"),
  "Quota function public.ai_use is missing from function inventory");
assert(functions.some((fn) => fn.schema === "private" && fn.name === "my_role"),
  "Expected private helper private.my_role is missing from function inventory");
pass("Quota function and private helper function are represented");

console.log("");
console.log("SCHEMA SNAPSHOT INTEGRITY CHECKS PASSED.");
console.log("Scope limit: this does not establish full schema completeness, historical migration recovery, SQL replay, or database parity.");
