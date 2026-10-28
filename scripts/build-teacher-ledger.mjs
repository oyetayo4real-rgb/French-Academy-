import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const sourcePath = new URL("../tests/teacher-ledger.json", import.meta.url);
const outputPath = new URL("../docs/teacher-ledger.json", import.meta.url);
const source = JSON.parse(await readFile(sourcePath, "utf8"));
if (!Array.isArray(source.entries)) throw new Error("teacher ledger source must contain an entries array");
const ledger = {
  schema_version: source.schema_version,
  description: source.description,
  source_note: source.source_note,
  entries: source.entries.map(row => ({
    id: row.id, input: row.input, lookup_input: row.lookup_input ?? row.input,
    candidate_change: row.candidate_change ?? null,
    approved_output: row.approved_output ?? null,
    engine_location: row.engine_location ?? null,
    test_name: row.test_name ?? null,
    status: row.status
  }))
};
await writeFile(outputPath, JSON.stringify(ledger, null, 2) + "\n", "utf8");
console.log("Built docs/teacher-ledger.json from tests/teacher-ledger.json (" + ledger.entries.length + " rows; " + ledger.entries.filter(row => row.status === "pending").length + " pending).");
