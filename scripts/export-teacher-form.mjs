import { readFile, writeFile } from "node:fs/promises";
import { lookup } from "../features/french-intelligence-core-v1.mjs";

const ledgerPath = new URL("../tests/teacher-ledger.json", import.meta.url);
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
      return { text: result.word + ": " + details.join("; "), result };
    }
    return { text: result.status + " (" + result.rule_id + "): " + result.explanation, result };
  } catch (error) {
    return { text: "ERROR capturing current output: " + (error instanceof Error ? error.message : String(error)), result: null };
  }
}
function genderOf(part) {
  if (/\bmasculine or feminine\b/i.test(part || "")) return "masculine or feminine";
  if (/\bfeminine\b/i.test(part || "")) return "feminine";
  if (/\bmasculine\b/i.test(part || "")) return "masculine";
  return "";
}
const header = ["ID", "Input", "Current engine output", "Row type", "Headword", "Part of speech", "Gender", "English meaning", "Example sentence", "Teacher notes", "Teacher decision (Accept/Correct/Reject)", "Teacher correction"];
const rows = [header];
const unsupported = [];
let nonEmptyOutputs = 0;
for (const row of ledger.entries) {
  const { text, result } = currentOutput(row);
  if (text.trim()) nonEmptyOutputs += 1;
  const supported = result?.status === "supported";
  if (!supported) unsupported.push({ id: row.id, input: row.input, output: text });
  rows.push([
    row.id, row.input, text,
    supported ? "correct-existing" : "add-missing",
    supported ? result.word : (row.lookup_input || row.input),
    supported ? result.part : "",
    supported ? genderOf(result.part) : "",
    supported ? result.meaning : "",
    supported ? result.example : "",
    supported ? result.notes : "",
    "", ""
  ]);
}
const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
await writeFile(outputPath, csv, "utf8");
console.log("Wrote docs/teacher-review-form.csv with " + ledger.entries.length + " review rows.");
console.log("Rows with non-empty current engine output: " + nonEmptyOutputs + "/" + ledger.entries.length + ".");
console.log("Rows marked add-missing: " + unsupported.length + ".");
console.log("Rows marked correct-existing: " + (ledger.entries.length - unsupported.length) + ".");
console.log("Teacher decisions and corrections remain blank; no row was marked teacher-approved.");
for (const row of unsupported) console.log("ADD-MISSING " + row.id + " | " + row.input + " | " + row.output);
