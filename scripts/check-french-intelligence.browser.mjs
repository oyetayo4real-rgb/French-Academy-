import { chromium, devices } from "playwright";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const engineSizeBytes = statSync("features/french-intelligence.js").size;
const swSource = readFileSync("sw.js", "utf8");
const swCacheVersion = swSource.match(/const V="([^"]+)"/)?.[1];
assert.ok(swCacheVersion && swCacheVersion !== "fa-v14", "Service-worker cache version must be bumped from fa-v14");
console.log(`ENGINE SIZE BYTES: ${engineSizeBytes}`);
console.log(`SERVICE WORKER CACHE VERSION: ${swCacheVersion}`);

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
    const engineLoadMs = await page.evaluate(() => {
      const entry = performance.getEntriesByType("resource").find(item => new URL(item.name).pathname === "/features/french-intelligence.js");
      return entry ? Math.round(entry.duration * 100) / 100 : null;
    });
    assert.ok(engineLoadMs !== null, `${profile.name}: engine resource timing must be available`);
    console.log(`ENGINE LOAD TIME ${profile.name}: ${engineLoadMs} ms (Resource Timing duration)`);
    collectingLoadRequests = false;
    const loadLocal = [...new Set(loadRequests.filter(item => item.profile === profile.name).map(item => `${item.method} ${new URL(item.url).pathname}`))];
    console.log(`APP LOAD LOCAL REQUESTS ${profile.name}: ${loadLocal.join(", ") || "(none recorded)"}`);

    if (await page.locator("#hfrenchint").count() === 0) {
      await page.locator("#lgo").click();
    }
    await page.locator("#hfrenchint").first().click();
    await page.getByRole("heading", { name: /French Intelligence/ }).waitFor();
    await page.waitForFunction(() => {
      const api = window.FrenchIntelligenceCore;
      return api && ["lookup", "translate", "conjugate", "answerQuestion", "checkWriting"].every(name => typeof api[name] === "function");
    });
    const runtimeContract = await page.evaluate(() => {
      const api = window.FrenchIntelligenceCore;
      return {
        names: Object.keys(api).sort(),
        lookup: api.lookup("bonjour"),
        translate: api.translate("Thank you", "en-fr"),
        conjugate: api.conjugate("être"),
        answerQuestion: api.answerQuestion(""),
        checkWriting: api.checkWriting("")
      };
    });
    assert.deepEqual(runtimeContract.names, ["answerQuestion", "checkWriting", "conjugate", "lookup", "translate"]);
    assert.equal(runtimeContract.lookup.word, "bonjour", "runtime adapter exposes structured lookup results");
    assert.match(runtimeContract.translate, /Known phrasebook match/, "runtime adapter preserves HTML-string translation output");
    assert.deepEqual(runtimeContract.conjugate.forms, ["suis", "es", "est", "sommes", "êtes", "sont"]);
    assert.equal(runtimeContract.answerQuestion, "Type a question first.");
    assert.match(runtimeContract.checkWriting, /Text received/);
    console.log(`PASS ${profile.name}: runtime compatibility adapter exposes all five legacy methods and preserves representative return shapes`);
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

    // Edge inputs must not throw, hang, or create markup.
    const edgeInputs = [
      { tab: "dict", input: "#fiWord", action: "#fiLookup" },
      { tab: "translate", input: "#fiInput", action: "#fiTranslate" },
      { tab: "verbs", input: "#fiVerb", action: "#fiConjugate" },
      { tab: "grammar", input: "#fiRuleSearch", action: null }
    ];
    for (const item of edgeInputs) {
      await page.locator(`[data-fitab="${item.tab}"]`).click();
      const field = page.locator(item.input);
      for (const value of ["", "a".repeat(5000), "😀🧑🏽‍🎓✨"]) {
        await field.fill(value);
        if (item.action) await page.locator(item.action).click();
        else await page.locator("#fiRuleSearch").waitFor({ state: "visible" });
        await page.waitForTimeout(20);
        assert.equal(await page.locator("#fiAnswer img, #fiAnswer script").count(), 0,
          `${profile.name} ${item.tab}: edge input must not create markup`);
      }
    }
    await page.locator('[data-fitab="dict"]').click();
    await page.locator("#fiWord").fill(String.fromCharCode(0x65, 0x0301) + "cole");
    await page.locator("#fiLookup").click();
    await page.locator("#fiAnswer").getByText(/school/i).first().waitFor();
    console.log(`PASS ${profile.name}: combining accent e + U+0301 matches école`);
    for (const apostrophe of ["S'il vous plaît", "S’il vous plaît", "S＇il vous plaît"]) {
      await page.locator("#fiWord").fill(apostrophe);
      await page.locator("#fiLookup").click();
      await page.locator("#fiAnswer").getByText(/please/i).first().waitFor();
    }
    await page.locator('[data-fitab="translate"]').click();
    await page.locator("#fiInput").fill("J’ai besoin d’aide");
    await page.locator("#fiTranslate").click();
    await page.locator("#fiAnswer .fi-output").getByText(/I need help/i).first().waitFor();

    await page.locator("#fiHome").click();
    await page.locator("#hfrenchint").first().waitFor({ state: "visible" });
    assert.equal(await page.locator("#hfrenchint").count(), 1, "Home screen must render exactly one French Intelligence entry point");

    // Exercise the existing home entry points and both feature renderers without inventing a logged-in user.
    await page.locator("#htutor").click();
    await page.locator("#app").getByText(/sign in/i).first().waitFor();
    await page.evaluate(() => window.FATutorView());
    await page.getByRole("heading", { name: /AI French tutor/i }).waitFor();
    await page.locator("#faSignIn").waitFor();
    await page.locator("#faHome").click();
    await page.locator("#hdict").waitFor({ state: "visible" });
    await page.locator("#hdict").click();
    await page.locator("#app").getByText(/sign in/i).first().waitFor();
    await page.evaluate(() => window.FADictionaryView());
    await page.getByRole("heading", { name: /French reference dictionary/i }).waitFor();
    await page.locator("#faSignIn").waitFor();
    console.log(`PASS ${profile.name}: existing Tutor and Dictionary home entry points, unauthenticated feature views render without console errors`);
    console.log(`PASS ${profile.name}: open, all six tabs, dictionary, translation, conjugation, grammar, input edge cases, XSS inputs`);
    await context.close();
  }
  // Offline service-worker acceptance: warm cache online, confirm controller/cache entries, then disconnect.
  const offlineContext = await browser.newContext({ viewport: { width: 1365, height: 900 }, serviceWorkers: "allow" });
  const offlinePage = await offlineContext.newPage();
  const offlineErrors = [];
  offlinePage.on("pageerror", error => offlineErrors.push(error.message));
  offlinePage.on("console", message => { if (message.type() === "error") offlineErrors.push(message.text()); });
  offlinePage.on("request", request => {
    if (new URL(request.url()).origin !== localOrigin) {
      nonLocalAttempts.push({ profile: "offline", url: request.url(), resourceType: request.resourceType() });
    }
  });
  await offlineContext.route("**/*", async route => {
    if (new URL(route.request().url()).origin !== localOrigin) {
      nonLocalAttempts.push({ profile: "offline", url: route.request().url(), resourceType: route.request().resourceType(), blockedByRoute: true });
      await route.abort("blockedbyclient");
    } else await route.continue();
  });
  await offlinePage.goto(baseURL, { waitUntil: "networkidle", timeout: 30000 });
  await offlinePage.evaluate(async () => { await navigator.serviceWorker.ready; });
  await offlinePage.reload({ waitUntil: "networkidle", timeout: 30000 });
  await offlinePage.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  await offlinePage.evaluate(async () => {
    const cacheNames = await caches.keys();
    if (!cacheNames.includes("fa-v15")) throw new Error("Expected service-worker cache fa-v15");
    const cache = await caches.open("fa-v15");
    const required = [
      "/index.html",
      "/features/french-intelligence.js?v=20261020-2",
      "/features/ai-classroom.js?v=20261017-2",
      "/features/french-intelligence-compat.mjs",
      "/features/french-intelligence-core-v1.mjs"
    ];
    for (const path of required) {
      if (!await cache.match(new URL(path, location.origin).href)) throw new Error("Required offline cache entry missing: " + path);
    }
  });
  if (await offlinePage.locator("#lgo").count()) await offlinePage.locator("#lgo").click();
  if (await offlinePage.locator("#hfrenchint").count() === 0) throw new Error("Could not enter home before offline test");
  await offlinePage.locator("#hfrenchint").first().click();
  await offlinePage.getByRole("heading", { name: /French Intelligence/ }).waitFor();
  await offlinePage.locator('[data-fitab="dict"]').click();
  await offlinePage.locator("#fiWord").fill("école");
  await offlinePage.locator("#fiLookup").click();
  await offlinePage.locator("#fiAnswer").getByText(/school/i).first().waitFor();
  await offlinePage.locator('[data-fitab="translate"]').click();
  await offlinePage.locator("#fiInput").fill("Bonjour");
  await offlinePage.locator("#fiTranslate").click();
  await offlinePage.locator("#fiAnswer .fi-output").getByText(/hello|good morning/i).first().waitFor();
  await offlinePage.locator('[data-fitab="verbs"]').click();
  await offlinePage.locator("#fiVerb").fill("être");
  await offlinePage.locator("#fiConjugate").click();
  await offlinePage.locator("#fiAnswer").getByText("suis", { exact: true }).waitFor();
  await offlinePage.locator('[data-fitab="grammar"]').click();
  await offlinePage.locator("#fiRuleSearch").fill("negation");
  await offlinePage.locator("#fiRules").getByText(/Negation/i).first().waitFor();
  await offlineContext.setOffline(true);
  await offlinePage.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
  await offlinePage.locator("#hfrenchint").first().waitFor({ state: "visible", timeout: 15000 });
  await offlinePage.locator("#hfrenchint").first().click();
  await offlinePage.getByRole("heading", { name: /French Intelligence/ }).waitFor();
  await offlinePage.locator('[data-fitab="dict"]').click();
  await offlinePage.locator("#fiWord").fill("école");
  await offlinePage.locator("#fiLookup").click();
  await offlinePage.locator("#fiAnswer").getByText(/school/i).first().waitFor();
  await offlinePage.locator('[data-fitab="translate"]').click();
  await offlinePage.locator("#fiInput").fill("Bonjour");
  await offlinePage.locator("#fiTranslate").click();
  await offlinePage.locator("#fiAnswer .fi-output").getByText(/hello|good morning/i).first().waitFor();
  await offlinePage.locator('[data-fitab="verbs"]').click();
  await offlinePage.locator("#fiVerb").fill("être");
  await offlinePage.locator("#fiConjugate").click();
  await offlinePage.locator("#fiAnswer").getByText("suis", { exact: true }).waitFor();
  await offlinePage.locator('[data-fitab="grammar"]').click();
  await offlinePage.locator("#fiRuleSearch").fill("negation");
  await offlinePage.locator("#fiRules").getByText(/Negation/i).first().waitFor();
  assert.deepEqual(offlineErrors, [], "Offline browser console/page errors were detected");
  console.log("PASS offline: service worker controlled the page; fa-v15 cached index and both feature scripts; dictionary, translation, conjugation and grammar work offline");
  await offlineContext.close();

  assert.deepEqual(failures, [], "Browser console/page errors were detected");
  assert.deepEqual(nonLocalAttempts, [], "Non-local network requests were attempted; all such requests are blocked");
  console.log("PASS network policy: zero non-local requests attempted; every non-local request is blocked by route policy");
} finally {
  await browser.close();
}
