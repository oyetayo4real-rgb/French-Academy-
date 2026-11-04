import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const routes = {
  legacy: "/tests/fixtures/french-intelligence-legacy.html",
  compat: "/tests/fixtures/french-intelligence-compat.html"
};
const tenses = ["present", "imparfait", "futur", "conditionnel", "passé composé"];
const browser = await chromium.launch({ headless: true });

try {
  for (const profile of [
    { name: "desktop", viewport: { width: 1280, height: 900 } },
    { name: "mobile-360", viewport: { width: 360, height: 800 } }
  ]) {
    const pages = {};
    try {
      for (const [kind, route] of Object.entries(routes)) {
        const page = await browser.newPage({ viewport: profile.viewport });
        pages[kind] = page;
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(new URL(route, baseURL).href, { waitUntil: "networkidle" });
        await page.waitForFunction(() => typeof window.FrenchIntelligenceCore?.checkWriting === "function");
        await page.locator("#hfrenchint").click();
        await page.locator('[data-fitab="verbs"]').click();
        await page.locator("#fiVerb").fill("être");
        assert.deepEqual(errors, [], profile.name + " " + kind + " browser errors");
      }

      for (const tense of tenses) {
        for (const page of Object.values(pages)) {
          await page.locator("#fiTense").selectOption(tense);
          await page.locator("#fiConjugate").click();
        }
        const compatHeading = await pages.compat.locator("#fiAnswer .fi-conjugation-heading h3").textContent();
        if (tense === "present") {
          const legacyHTML = await pages.legacy.locator("#fiAnswer").innerHTML();
          const compatHTML = await pages.compat.locator("#fiAnswer").innerHTML();
          assert.equal(compatHTML, legacyHTML, profile.name + " present output remains byte-identical to legacy golden v3");
          assert.equal(compatHeading, "être · present", profile.name + " present heading remains unchanged");
        } else {
          assert.equal(compatHeading, "Verb conjugator", profile.name + " " + tense + " heading");
          assert.doesNotMatch(compatHeading, /present tense/i);
        }
      }

      const dimensions = await pages.compat.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      }));
      assert.ok(dimensions.scroll <= dimensions.client, profile.name + " no horizontal scroll: " + JSON.stringify(dimensions));
      console.log("PASS M3 conjugator title " + profile.name + " (" + tenses.length + " tenses)");
    } finally {
      await Promise.all(Object.values(pages).map(page => page.close()));
    }
  }
  console.log("PASS M3 Part A: all five tense headings; present output byte-identical; desktop and 360px mobile.");
} finally {
  await browser.close();
}
