import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const engine = readFileSync("features/french-intelligence.js", "utf8");
const html = readFileSync("index.html", "utf8");

const checks = [
  ["engine is a strict-mode module", /["']use strict["']/.test(engine)],
  ["engine registers its home entry point", /addEventListener\(["']click["']/.test(engine) && /t\.id===["']hfrenchint["']/.test(engine)],
  ["engine exposes an explicit open function", /window\.FrenchIntelligenceOpen\s*=\s*open/.test(engine)],
  ["engine provides dictionary lookup", /function lookup\(/.test(engine)],
  ["engine provides conjugation", /function conjugate\(/.test(engine)],
  ["engine provides writing checks", /function checkWriting\(/.test(engine)],
  ["engine labels unsupported questions instead of fabricating answers", /couldn't match this question confidently/.test(engine)],
  ["home screen links to French Intelligence", /id=["']hfrenchint["']/.test(html)],
  ["engine script is loaded by the app", /features\/french-intelligence\.js\?v=/.test(html)],
  ["engine script loads before the existing AI classroom module", html.indexOf("features/french-intelligence.js") >= 0 && html.indexOf("features/french-intelligence.js") < html.indexOf("features/ai-classroom.js")],
  ["home navigation hook is present", /FAExitFrenchIntelligence/.test(html)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}
assert.equal(failed, 0, `${failed} French Intelligence integration check(s) failed`);
console.log(`Passed ${checks.length} French Intelligence integration checks.`);
