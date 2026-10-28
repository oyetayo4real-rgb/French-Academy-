import { readFile } from "node:fs/promises";

const sourcePath = new URL("../tests/teacher-ledger.json", import.meta.url);
const source = JSON.parse(await readFile(sourcePath, "utf8"));
if (!Array.isArray(source.entries)) throw new Error("teacher ledger source must contain an entries array");
if (source.entries.length !== 46) throw new Error("teacher ledger must contain exactly 46 rows; got " + source.entries.length);
console.log("Canonical teacher ledger: tests/teacher-ledger.json (" + source.entries.length + " rows; " + source.entries.filter(row => row.status === "approved").length + " approved; " + source.entries.filter(row => row.status === "pending").length + " pending).");
