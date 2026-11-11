#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
assert.ok(process.argv.includes("--write"), "Pass --write to explicitly create the owner-approved v4 golden.");
const sourcePath = "tests/golden/legacy-v3.json";
const outputPath = "tests/golden/legacy-v4.json";
const checksumPath = "tests/golden/legacy-v4.sha256";
const sourceText = readFileSync(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const v4 = JSON.parse(sourceText);
const approved = [
  { id: "known-error:11", arrayIndex: 10, input: "Beacoup de gens arrivent.", before: "beaucoup de gens arrivent.", after: "Beaucoup de gens arrivent." },
  { id: "known-error:13", arrayIndex: 12, input: "Bonjor, madame.", before: "bonjour, madame.", after: "Bonjour, madame." },
  { id: "known-error:14", arrayIndex: 13, input: "BONJOR !", before: "bonjour !", after: "Bonjour !" },
  { id: "known-error:15", arrayIndex: 14, input: "Merçi beaucoup.", before: "merci beaucoup.", after: "Merci beaucoup." }
];
for (const item of approved) {
  const row = v4.inventory.checkWriting.knownErrors[item.arrayIndex];
  assert.ok(row, item.id + " must exist in legacy-v3");
  assert.equal(row.index, Number(item.id.split(":")[1]), item.id + " index");
  assert.equal(row.sentence, item.input, item.id + " exact input");
  const oldMarkup = '<p class="fi-output">' + item.before + "</p>";
  const newMarkup = '<p class="fi-output">' + item.after + "</p>";
  assert.equal(row.output.split(oldMarkup).length - 1, 1, item.id + " must contain exactly one approved old output");
  row.output = row.output.replace(oldMarkup, newMarkup);
}
function changedPaths(before, after, path = "") {
  if (before === after) return [];
  if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].sort().flatMap(key => changedPaths(before[key], after[key], path ? path + "." + key : key));
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    if (before.length !== after.length) return [path + ".length"];
    return before.flatMap((value, index) => changedPaths(value, after[index], path + "[" + index + "]"));
  }
  return [path];
}
const allowedPaths = [
  "inventory.checkWriting.knownErrors[10].output",
  "inventory.checkWriting.knownErrors[12].output",
  "inventory.checkWriting.knownErrors[13].output",
  "inventory.checkWriting.knownErrors[14].output"
].sort();
assert.deepEqual(changedPaths(source, v4).sort(), allowedPaths, "v4 must differ from v3 at exactly the four approved output paths");
assert.deepEqual(v4.inventoryCounts, source.inventoryCounts, "v4 inventory counts must remain unchanged");
for (const group of ["clean", "hardNegative", "knownErrors"]) assert.equal(v4.inventory.checkWriting[group].length, source.inventory.checkWriting[group].length, group + " count");
assert.equal(v4.inventory.checkWritingCases.length, source.inventory.checkWritingCases.length, "Writing regression count");
const json = JSON.stringify(v4, null, 2) + "\n";
const sha = createHash("sha256").update(json, "utf8").digest("hex");
writeFileSync(outputPath, json, "utf8");
writeFileSync(checksumPath, sha + "  " + outputPath + "\n", "utf8");
console.log("Generated legacy-v4 from legacy-v3 with exactly four approved sentence-initial capitalization outputs.");
console.log(JSON.stringify({ sourcePath, outputPath, checksumPath, sha256: sha, changedPaths: allowedPaths }, null, 2));
