import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const path = new URL("../tests/source-verified-ledger.json", import.meta.url);
const ledger = JSON.parse(await readFile(path, "utf8"));
assert.ok(Array.isArray(ledger.rows), "source-verified ledger rows must be an array");
assert.equal(ledger.rows.length, 46, "source-verified ledger must contain exactly 46 rows");
const expectedIds = Array.from({ length: 46 }, (_, index) => "TR-" + String(index + 1).padStart(3, "0"));
const ids = ledger.rows.map(row => row.id);
assert.deepEqual(ids, expectedIds, "ledger IDs must run TR-001 through TR-046 with no gaps or reordering");
assert.equal(new Set(ids).size, 46, "source-verified ledger IDs must be unique");
assert.deepEqual(ledger.status_values, ["source-verified", "reference-pending"], "ledger status values must match the canonical workflow");
let sourceVerified = 0;
let referencePending = 0;
for (const row of ledger.rows) {
  assert.ok(typeof row.input === "string" && row.input.trim(), row.id + ": input must be non-empty");
  assert.ok(["source-verified", "reference-pending"].includes(row.status), row.id + ": invalid status " + row.status);
  if (row.status === "source-verified") {
    sourceVerified += 1;
    assert.ok(Array.isArray(row.sources) && row.sources.some(url => typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))), row.id + ": source-verified row requires at least one source URL");
  } else referencePending += 1;
}
assert.equal(sourceVerified, 9, "expected 9 source-verified rows");
assert.equal(referencePending, 37, "expected 37 reference-pending rows");
console.log("PASS canonical source-verified ledger: 46 unique sequential rows; 9 source-verified; 37 reference-pending.");
console.log("Owner decision: no teacher review or teacher-approved status is used.");
