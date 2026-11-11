#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const BASE_SHA = "359677eeb3a666c3cf7aee1d58b05504a7b9e9c7";
const jsonPath = "tests/golden/legacy-v4.json";
const shaPath = "tests/golden/legacy-v4.sha256";
assert.ok(existsSync(jsonPath) && existsSync(shaPath), "legacy-v4 JSON and SHA-256 must both exist; v4 is required and may not be skipped");
const v3Text = readFileSync("tests/golden/legacy-v3.json", "utf8");
const v4Text = readFileSync(jsonPath, "utf8");
const expectedSha = createHash("sha256").update(v4Text, "utf8").digest("hex");
assert.equal(readFileSync(shaPath, "utf8"), expectedSha + "  " + jsonPath + "\n", "legacy-v4 SHA-256 must match exact JSON bytes");
const v3 = JSON.parse(v3Text);
const v4 = JSON.parse(v4Text);
const expected = JSON.parse(v3Text);
const approved = [
  { id: "known-error:11", arrayIndex: 10, input: "Beacoup de gens arrivent.", before: "beaucoup de gens arrivent.", after: "Beaucoup de gens arrivent." },
  { id: "known-error:13", arrayIndex: 12, input: "Bonjor, madame.", before: "bonjour, madame.", after: "Bonjour, madame." },
  { id: "known-error:14", arrayIndex: 13, input: "BONJOR !", before: "bonjour !", after: "Bonjour !" },
  { id: "known-error:15", arrayIndex: 14, input: "Merçi beaucoup.", before: "merci beaucoup.", after: "Merci beaucoup." }
];
for (const item of approved) {
  const row = expected.inventory.checkWriting.knownErrors[item.arrayIndex];
  assert.ok(row, item.id + " must exist in v3");
  assert.equal(row.index, Number(item.id.split(":")[1]), item.id + " case index");
  assert.equal(row.sentence, item.input, item.id + " exact input");
  const oldMarkup = '<p class="fi-output">' + item.before + "</p>";
  const newMarkup = '<p class="fi-output">' + item.after + "</p>";
  assert.equal(row.output.split(oldMarkup).length - 1, 1, item.id + " old output must occur exactly once");
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
assert.deepEqual(changedPaths(v3, v4).sort(), allowedPaths, "legacy-v4 must change exactly the four approved JSON paths");
assert.deepEqual(v4, expected, "legacy-v4 must equal legacy-v3 plus only the approved capitalization delta");
assert.deepEqual(v4.inventoryCounts, v3.inventoryCounts, "inventory counts must be unchanged");
for (const group of ["clean", "hardNegative", "knownErrors"]) assert.equal(v4.inventory.checkWriting[group].length, v3.inventory.checkWriting[group].length, group + " count");
assert.equal(v4.inventory.checkWritingCases.length, v3.inventory.checkWritingCases.length, "Writing regression count");
const immutablePaths = [
  "features/french-intelligence.js",
  "tests/golden/legacy-v1.json",
  "tests/golden/legacy-v1.sha256",
  "tests/golden/legacy-v2.json",
  "tests/golden/legacy-v2.sha256",
  "tests/golden/legacy-v3.json",
  "tests/golden/legacy-v3.sha256",
  "scripts/check-golden-v2.mjs",
  "scripts/check-golden-v3.mjs",
  "scripts/generate-golden-v3.mjs",
  ".github/workflows/golden-v3-update.yml",
  ".github/workflows/legacy-golden-integrity.yml"
];
for (const path of immutablePaths) {
  const baseline = execFileSync("git", ["show", BASE_SHA + ":" + path]);
  assert.deepEqual(readFileSync(path), baseline, path + " must remain byte-identical to approved main baseline");
}
console.log("PASS legacy-v4 checksum, exact four-path delta, case counts, and immutable v1/v2/v3/reference/workflow bytes.");
