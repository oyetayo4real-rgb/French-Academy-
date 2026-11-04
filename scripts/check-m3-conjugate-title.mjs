import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const baseURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const goldenV3 = JSON.parse(readFileSync("tests/golden/legacy-v3.json", "utf8"));
const expectedPresent = goldenV3.inventory.conjugation.verbs.find(row => row.verb === "être");
assert.ok(expectedPresent, "golden v3 must contain the être present paradigm");
const persons = ["je / j'", "tu", "il / elle / on", "nous", "vous", "ils / elles"];
const expectedPresentHTML =
  '<div class="fi-answer"><h3>être — present tense</h3><div class="fi-muted">' +
  expectedPresent.output.type + "</div><table><tbody>" +
  expectedPresent.output.forms.map((form, index) =>
    "<tr><td>" + persons[index] + "</td><td><b>" + form + "</b></td></tr>"
  ).join("") +
  "</tbody></table></div>";
const tenses = ["present", "imparfait", "futur", "conditionnel", "passé composé"];
const browser = await chromium.launch({ headless: true });

try {
  for (const profile of [
    { name: "desktop", viewport: { width: 1280, height: 900 } },
    { name: "mobile-360", viewport: { width: 360, height: 800 } }
  ]) {
    const page = await browser.newPage({ viewport: profile.viewport });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    try {
      await page.goto(new URL("/tests/fixtures/french-intelligence-compat.html", baseURL).href, {
        waitUntil: "networkidle"
      });
      await page.waitForFunction(() =>
        typeof window.FrenchIntelligenceCore?.conjugate === "function"
      );
      await page.locator("#hfrenchint").click();
      await page.locator('[data-fitab="verbs"]').click();
      await page.locator("#fiVerb").fill("être");

      for (const tense of tenses) {
        await page.locator("#fiTense").selectOption(tense);
        await page.locator("#fiConjugate").click();
        const answer = page.locator("#fiAnswer");
        await answer.locator("h3").waitFor();

        if (tense === "present") {
          const apiOutput = await page.evaluate(() => window.FrenchIntelligenceCore.conjugate("être"));
          assert.deepEqual(apiOutput, expectedPresent.output,
            profile.name + " present API remains byte-identical to golden v3");
          assert.equal(await answer.innerHTML(), expectedPresentHTML,
            profile.name + " present card HTML remains byte-identical to golden v3 rendering");
        } else {
          assert.equal(
            await answer.locator(".fi-conjugation-heading h3").textContent(),
            "Verb conjugator",
            profile.name + " " + tense + " card heading"
          );
          assert.equal(await answer.locator("tbody tr").count(), 6,
            profile.name + " " + tense + " retains all six person rows");
          await page.locator("#fiVerb").fill("xyz");
          await page.locator("#fiConjugate").click();
          assert.equal(await answer.locator("h3").textContent(), "Verb conjugator",
            profile.name + " unsupported " + tense + " card heading");
          await page.locator("#fiVerb").fill("être");
        }
      }

      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));
      assert.ok(dimensions.scroll <= dimensions.client && dimensions.body <= dimensions.client,
        profile.name + " no horizontal scroll: " + JSON.stringify(dimensions));
      assert.deepEqual(errors, [], profile.name + " browser errors");
      console.log("PASS M3 conjugator title " + profile.name + " (" + tenses.length + " tenses)");
    } finally {
      await page.close();
    }
  }
  console.log("PASS M3 Part A: all five tenses; present card/API byte-identical to golden v3; desktop and 360px mobile.");
} finally {
  await browser.close();
}
