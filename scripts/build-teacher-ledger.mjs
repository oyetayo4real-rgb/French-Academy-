import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const path = new URL("../tests/source-verified-ledger.json", import.meta.url);
const ledger = JSON.parse(await readFile(path, "utf8"));
assert.ok(Array.isArray(ledger.rows), "canonical ledger rows must be an array");
assert.equal(ledger.rows.length, 46, "canonical ledger must contain 46 rows");
assert.equal(new Set(ledger.rows.map(row => row.id)).size, 46, "canonical ledger IDs must be unique");
console.log("Canonical source-verified ledger: tests/source-verified-ledger.json (46 rows; 9 source-verified; 37 reference-pending; no teacher review).");
