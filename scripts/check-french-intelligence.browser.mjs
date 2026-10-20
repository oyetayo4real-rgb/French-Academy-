import { chromium, devices } from "playwright";
import assert from "node:assert/strict";

const baseURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const profile of [
    { name: "desktop", viewport: { width: 1365, height: 900 } },
    { name: "mobile", ...devices["iPhone 13"] }
  ]) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    page.on("pageerror", error => failures.push(`${profile.name} pageerror: ${error.message}`));
    page.on("console", message => {
      if (message.type() === "error") failures.push(`${profile.name} console.error: ${message.text()}`);
    });
    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
    await page.locator("#app").waitFor({ state: "visible" });
    // A fresh browser context starts on the public landing page; enter guest mode first.
    if (await page.locator("#hfrenchint").count() === 0) {
      await page.locator("#lgo").click();
    }
    await page.locator("#hfrenchint").first().click();
    await page.getByRole("heading", { name: /French Intelligence/ }).waitFor();
    assert.match(await page.locator(".fi-note").first().innerText(), /do not call Gemini|do not require an AI API key/i);

    await page.locator('[data-fitab="dict"]').click();
    await page.locator("#fiWord").fill("bonjour");
    await page.locator("#fiLookup").click();
    await page.locator("#fiAnswer").getByText(/hello|good morning/i).first().waitFor();

    await page.locator('[data-fitab="translate"]').click();
    await page.locator("#fiInput").fill("Bonjour");
    await page.locator("#fiTranslate").click();
    // Assert the actual translation output, not the explanatory metadata that repeats it.
    await page.locator("#fiAnswer .fi-output").getByText(/hello|good morning/i).first().waitFor();

    await page.locator('[data-fitab="verbs"]').click();
    await page.locator("#fiVerb").fill("être");
    await page.locator("#fiConjugate").click();
    await page.locator("#fiAnswer").getByText("suis", { exact: true }).waitFor();

    await page.locator('[data-fitab="grammar"]').click();
    await page.locator("#fiRuleSearch").fill("negation");
    await page.locator("#fiRules").getByText(/Negation/i).first().waitFor();

    await page.locator("#fiHome").click();
    await page.locator("#hfrenchint").first().waitFor({ state: "visible" });
    assert.equal(await page.locator("#hfrenchint").count(), 1, "Home screen must render exactly one French Intelligence entry point");
    console.log(`PASS ${profile.name}: open, dictionary, translation, conjugation, grammar filter, return navigation`);
    await context.close();
  }
  assert.deepEqual(failures, [], "Browser console/page errors were detected");
} finally {
  await browser.close();
}
