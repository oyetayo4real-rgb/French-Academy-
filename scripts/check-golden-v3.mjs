#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const jsonPath="tests/golden/legacy-v3.json";
const shaPath="tests/golden/legacy-v3.sha256";
if(!existsSync(jsonPath)&&!existsSync(shaPath)){console.log("SKIP: approved legacy-v3 files await the [generate-v3] workflow.");process.exit(0);}
assert.ok(existsSync(jsonPath)&&existsSync(shaPath),"legacy-v3 JSON and SHA-256 must exist together");
const v2Text=readFileSync("tests/golden/legacy-v2.json","utf8");
const v3Text=readFileSync(jsonPath,"utf8");
const expectedSha=createHash("sha256").update(v3Text,"utf8").digest("hex");
assert.equal(readFileSync(shaPath,"utf8"),expectedSha+"  "+jsonPath+"\n","legacy-v3 SHA-256 must match exact JSON bytes");
const v2=JSON.parse(v2Text),v3=JSON.parse(v3Text),expected=JSON.parse(v2Text);
const oldRow=expected.inventory.conjugation.verbs.find(row=>row.verb==="courir");
const newRow=v3.inventory.conjugation.verbs.find(row=>row.verb==="courir");
assert.ok(oldRow&&newRow,"v2 and v3 must both contain the courir entry");
assert.equal(oldRow.output.type,"Explicit present-tense paradigm · needs review","v2 must remain unchanged historical evidence");
expected.inventory.conjugation.verbs.find(row=>row.verb==="courir").output.type="Irregular verb · present tense";
assert.deepEqual(v3,expected,"legacy-v3 must differ from legacy-v2 only at conjugate(\"courir\").output.type");
assert.deepEqual(newRow.output.forms,oldRow.output.forms,"courir forms must be unchanged");
assert.deepEqual(newRow.persons,oldRow.persons,"courir person rows must be unchanged");
console.log("PASS legacy-v3 checksum and one-field-only difference from legacy-v2.");
