import { readFile, writeFile } from "node:fs/promises";
import { lookup } from "../features/french-intelligence-core-v1.mjs";

const ledgerPath = new URL("../docs/teacher-ledger.json", import.meta.url);
const outputPath = new URL("../docs/teacher-review-form.csv", import.meta.url);
const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
const csvCell = value => {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/u.test(text) ? '"' + text.replace(/"/gu, '""') + '"' : text;
};
function currentOutput(row) {
  try {
    const result = lookup(row.lookup_input || row.input);
    if (result.status === "supported") {
      const details = [result.meaning, result.part ? "part=" + result.part : null, result.notes ? "notes=" + result.notes : null, result.example ? "example=" + result.example : null].filter(Boolean);
      return result.word + ": " + details.join("; ");
    }
    return result.status + " (" + result.rule_id + "): " + result.explanation;
  } catch (error) {
    return "ERROR capturing current output: " + (error instanceof Error ? error.message : String(error));
  }
}
const rows = [["ID", "input", "current engine output", "Accept/Correct/Reject", "correction"]];
for (const row of ledger.entries) rows.push([row.id, row.input, currentOutput(row), "", ""]);
const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
await writeFile(outputPath, csv, "utf8");
console.log("Wrote docs/teacher-review-form.csv with " + ledger.entries.length + " review rows and current built-in lookup outputs.");
console.log("Teacher decision and correction columns are intentionally blank.");
