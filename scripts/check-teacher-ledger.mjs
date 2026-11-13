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
assert.deepEqual(ledger.status_values, ["source-verified", "lexique-confirmed", "reference-pending"], "ledger status values must match the canonical workflow");
const counts = { "source-verified": 0, "lexique-confirmed": 0, "reference-pending": 0 };
for (const row of ledger.rows) {
  assert.ok(typeof row.input === "string" && row.input.trim(), row.id + ": input must be non-empty");
  assert.ok(Object.hasOwn(counts, row.status), row.id + ": invalid status " + row.status);
  counts[row.status] += 1;
  if (row.status === "source-verified" || row.status === "lexique-confirmed") {
    assert.ok(Array.isArray(row.sources) && row.sources.some(source => typeof source === "string" && source.trim()), row.id + ": verified row requires a non-empty source");
    if (row.status === "source-verified") assert.ok(row.sources.some(source => /^https?:\/\//.test(source)), row.id + ": source-verified row requires an HTTP(S) URL");
    else assert.ok(row.sources.includes("Lexique 3.83 pilot, french-engine-data (headword/POS/gender match)"), row.id + ": lexique-confirmed row requires exact provenance");
  }
}
assert.deepEqual(counts, { "source-verified": 9, "lexique-confirmed": 34, "reference-pending": 3 }, "ledger status counts must match closeout");
assert.deepEqual(ledger.rows.filter(row => row.status === "reference-pending").map(row => row.id), ["TR-005", "TR-026", "TR-046"], "only TR-005, TR-026 and TR-046 may remain pending");
console.log("PASS canonical ledger: 46 unique sequential rows; 9 source-verified; 34 lexique-confirmed; 3 reference-pending.");
console.log("Owner decision: no teacher review or teacher-approved status is used.");
