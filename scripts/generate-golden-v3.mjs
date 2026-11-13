#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

assert.ok(process.argv.includes("--write"), "Pass --write to explicitly create the approved v3 golden.");
const v2Text=readFileSync("tests/golden/legacy-v2.json","utf8");
const v2=JSON.parse(v2Text);
const v3=JSON.parse(v2Text);
const oldRow=v2.inventory.conjugation.verbs.find(row=>row.verb==="courir");
const newRow=v3.inventory.conjugation.verbs.find(row=>row.verb==="courir");
assert.ok(oldRow&&newRow,"legacy-v2 must contain the courir conjugation entry");
assert.equal(oldRow.output.type,"Explicit present-tense paradigm · needs review","only the documented v2 label may be corrected");
newRow.output.type="Irregular verb · present tense";
assert.deepEqual(newRow.output.forms,oldRow.output.forms,"courir forms must remain byte-for-byte equivalent");
assert.deepEqual(newRow.persons,oldRow.persons,"courir person rows must remain unchanged");
const json=JSON.stringify(v3,null,2)+"\n";
const sha=createHash("sha256").update(json,"utf8").digest("hex");
writeFileSync("tests/golden/legacy-v3.json",json,"utf8");
writeFileSync("tests/golden/legacy-v3.sha256",sha+"  tests/golden/legacy-v3.json\n","utf8");
console.log("Generated legacy-v3 from legacy-v2 with exactly one correction: conjugate(\"courir\").output.type.");
