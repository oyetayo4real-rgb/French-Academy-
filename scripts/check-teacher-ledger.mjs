import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = new URL("../tests/teacher-ledger.json", import.meta.url);
const ledger = JSON.parse(await readFile(path, "utf8"));
assert.ok(Array.isArray(ledger.entries), "ledger entries must be an array");
assert.equal(ledger.entries.length, 46, "teacher ledger must contain exactly 46 rows");
const ids = ledger.entries.map(row => row.id);
assert.ok(ids.every(id => typeof id === "string" && id.trim()), "every row must have a non-empty ID");
assert.equal(new Set(ids).size, ids.length, "teacher ledger IDs must be unique");
const pending = [];
for (const row of ledger.entries) {
  assert.ok(["pending", "approved"].includes(row.status), row.id + ": status must be pending or approved");
  assert.ok(typeof row.input === "string" && row.input.trim(), row.id + ": input must be non-empty");
  if (row.status === "pending") pending.push(row.id + " — " + row.input);
  if (row.status === "approved") {
    assert.ok(typeof row.approved_output === "string" && row.approved_output.trim(), row.id + ": approved row requires approved_output");
    assert.ok(typeof row.engine_location === "string" && row.engine_location.trim(), row.id + ": approved row requires engine_location");
    assert.ok(typeof row.test_name === "string" && row.test_name.trim(), row.id + ": approved row requires a test name");
  }
}
console.log("PASS teacher ledger structure: 46 rows; " + (46 - pending.length) + " approved; " + pending.length + " pending.");
console.log("PENDING ROWS (" + pending.length + "):");
for (const row of pending) console.log("- " + row);
