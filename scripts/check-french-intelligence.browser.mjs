import { chromium, devices } from "playwright";
import assert from "node:assert/strict";

const baseURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const localOrigin = new URL(baseURL).origin;
const browser = await chromium.launch({ headless: true });
const failures = [];
const nonLocalAttempts = [];
const loadRequests = [];
const xssPayloads = [
  '<script>window.__fiXssExecuted = true</script>',
  '<img src=x onerror="window.__fiXssExecuted = true">'
];

try {
  for (const profile of [
    { name: "desktop", viewport: { width: 1365, height: 900 } },
    { name: "mobile", ...devices["iPhone 13"] }
  ]) {
    const context = await browser.newContext(profile);
    const page = await context.newPage();
    let collectingLoadRequests = true;
    page.on("request", request => {
      const url = request.url();
      if (new URL(url).origin !== localOrigin) {
        nonLocalAttempts.push({ profile: profile.name, url, resourceType: request.resourceType() });
      } else if (collectingLoadRequests) {
        loadRequests.push({ profile: profile.name, method: request.method(), url });
      }
    });
    await page.route("**/*", async route => {
      const url = route.request().url();
      if (new URL(url).origin !== localOrigin) {
        // Record and block every non-local attempt. The test fails below even though it was blocked.
        nonLocalAttempts.push({ profile: profile.name, url, resourceType: route.request().resourceType(), blockedByRoute: true });
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });
    page.on("pageerror", error => failures.push(`${profile.name} pageerror: ${error.message}`));
    page.on("console", message => {
      if (message.type() === "error") failures.push(`${profile.name} console.error: ${message.text()}`);
    });

    await page.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
    await page.locator("#app").waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    collectingLoadRequests = false;
    const loadLocal = [...new Set(loadRequests.filter(item => item.profile === profile.name).map(item => `${item.method} ${new URL(item.url).pathname}`))];
    console.log(`APP LOAD LOCAL REQUESTS ${profile.name}: ${loadLocal.join(", ") || "(none recorded)"}`);

    if (await page.locator("#hfrenchint").count() === 0) {
      await page.locator("#lgo").click();
    }
    await page.locator("#hfrenchint").first().click();
    await page.getByRole("heading", { name: /French Intelligence/ }).waitFor();
    assert.match(await page.locator(".fi-note").first().innerText(), /do not call Gemini|do not require an AI API key/i);

    const cases = [
      { tab: "ask", input: "#fiInput", action: "#fiAsk" },
      { tab: "dict", input: "#fiWord", action: "#fiLookup" },
      { tab: "translate", input: "#fiInput", action: "#fiTranslate" },
      { tab: "verbs", input: "#fiVerb", action: "#fiConjugate" },
      { tab: "correct", input: "#fiInput", action: "#fiCheck" },
      { tab: "grammar", input: "#fiRuleSearch", action: null }
    ];
    for (const item of cases) {
      await page.locator(`[data-fitab="${item.tab}"]`).click();
      const field = page.locator(item.input);
      await field.waitFor({ state: "visible" });
      for (const payload of xssPayloads) {
        await field.fill(payload);
        assert.equal(await field.inputValue(), payload, `${profile.name} ${item.tab}: input must retain literal payload`);
        if (item.action) await page.locator(item.action).click();
        await page.waitForTimeout(50);
        assert.equal(await page.locator("#fiAnswer img, #fiAnswer script").count(), 0,
          `${profile.name} ${item.tab}: payload must not create executable HTML nodes`);
        assert.notEqual(await page.evaluate(() => window.__fiXssExecuted === true), true,
          `${profile.name} ${item.tab}: injected code must not execute`);
      }
    }

    // Exercise normal flows after the adversarial inputs, still under strict network blocking.
    await page.locator('[data-fitab="dict"]').click();
    await page.locator("#fiWord").fill("bonjour");
    await page.locator("#fiLookup").click();
    await page.locator("#fiAnswer").getByText(/hello|good morning/i).first().waitFor();

    await page.locator('[data-fitab="translate"]').click();
    await page.locator("#fiInput").fill("Bonjour");
    await page.locator("#fiTranslate").click();
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
    console.log(`PASS ${profile.name}: open, all six tabs, dictionary, translation, conjugation, grammar filter, return navigation, XSS inputs`);
    await context.close();
  }
  assert.deepEqual(failures, [], "Browser console/page errors were detected");
  assert.deepEqual(nonLocalAttempts, [], "Non-local network requests were attempted; all such requests are blocked");
  console.log("PASS network policy: zero non-local requests attempted; every non-local request is blocked by route policy");
} finally {
  await browser.close();
}
