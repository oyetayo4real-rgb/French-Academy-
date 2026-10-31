import { chromium, devices } from "playwright";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const engineSizeBytes = statSync("features/french-intelligence-compat.mjs").size;
const swSource = readFileSync("sw.js", "utf8");
const goldenV3 = JSON.parse(readFileSync("tests/golden/legacy-v3.json", "utf8"));
const htmlSource = readFileSync("index.html", "utf8");
const swCacheVersion = swSource.match(/const V="([^"]+)"/)?.[1];
assert.ok(swCacheVersion, "Service-worker cache version V must be declared in sw.js");
assert.notEqual(swCacheVersion, "fa-v13", "Service-worker cache version must differ from production fa-v13");
const coreMatch = swSource.match(/CORE=\[(.*?)\];/);
assert.ok(coreMatch, "Service-worker CORE precache list must be declared");
const corePaths = [...coreMatch[1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
const reachable = new Set();
const pending = ["/features/french-intelligence-compat.mjs"];
while (pending.length) {
  const route = pending.pop();
  if (reachable.has(route)) continue;
  reachable.add(route);
  const source = readFileSync(route.slice(1), "utf8");
  const imports = [
    ...source.matchAll(/^\s*import\s+(?:[^'"\n]*?\s+from\s+)?["']([^"']+)["']/gm),
    ...source.matchAll(/^\s*export\s+[^'"\n]*?\s+from\s+["']([^"']+)["']/gm)
  ];
  for (const match of imports) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;
    const pathname = new URL(specifier, "https://local.invalid" + route).pathname;
    if (pathname.endsWith(".mjs") || pathname.endsWith(".js")) pending.push(pathname);
  }
}
const missingCore = [...reachable].filter(path => !corePaths.includes(path)).sort();
assert.deepEqual(missingCore, [], "Static imports reachable from french-intelligence-compat.mjs missing from sw.js CORE: " + missingCore.join(", "));
const compatTag = htmlSource.indexOf('src="/features/french-intelligence-compat.mjs"');
const classroomTag = htmlSource.indexOf('src="/features/ai-classroom.js');
assert.ok(compatTag >= 0 && classroomTag > compatTag, "Compat module must be declared before AI classroom");
assert.equal(htmlSource.includes('<script src="/features/french-intelligence.js'), false, "Legacy engine remains a reference file, not a runtime script");
assert.ok(swSource.includes('"/features/french-intelligence-core-v1.mjs"') && swSource.includes('"/features/french-intelligence-compat.mjs"'), "Both split modules must be precached");
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
    await page.waitForFunction(() => { const api = window.FrenchIntelligenceCore; return !!api && ["lookup", "translate", "conjugate", "answerQuestion", "checkWriting"].every(name => typeof api[name] === "function"); }, null, { timeout: 15000 });
    await page.locator("#app").waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    const engineLoadMs = await page.evaluate(() => {
      const entry = performance.getEntriesByType("resource").find(item => new URL(item.name).pathname === "/features/french-intelligence-compat.mjs");
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
    const expectedPresent = goldenV3.inventory.conjugation.verbs.find(row => row.verb === "être")?.output;
    const actualPresent = await page.evaluate(() => window.FrenchIntelligenceCore.conjugate("être"));
    assert.deepEqual(actualPresent, expectedPresent, `${profile.name}: default present API remains byte-identical to golden v3`);
    assert.equal(await page.locator("#fiTense").inputValue(), "present", `${profile.name}: default tense is present`);
    const tenseCases = [
      { tense: "imparfait", cases: [{ verb: "trouver", expected: "trouvais" }, { verb: "être", expected: "étais" }] },
      { tense: "futur", cases: [{ verb: "trouver", expected: "trouverai" }, { verb: "être", expected: "serai" }] },
      { tense: "conditionnel", cases: [{ verb: "trouver", expected: "trouverais" }, { verb: "être", expected: "serais" }] },
      { tense: "passé composé", cases: [{ verb: "arriver", expected: "je suis arrivé(e)" }, { verb: "faire", expected: "ai fait" }] }
    ];
    for (const group of tenseCases) {
      for (const item of group.cases) {
        await page.locator("#fiTense").selectOption(group.tense);
        await page.locator("#fiVerb").fill(item.verb);
        await page.locator("#fiConjugate").click();
        const output = await page.locator("#fiAnswer").innerText();
        assert.ok(output.includes(item.expected), `${profile.name}: ${item.verb} ${group.tense} contains ${item.expected}; actual=${output}`);
      }
    }
    await page.locator("#fiTense").selectOption("present");
    await page.locator("#fiVerb").fill("être");
    await page.locator("#fiConjugate").click();
    assert.deepEqual(await page.evaluate(() => window.FrenchIntelligenceCore.conjugate("être")), expectedPresent, `${profile.name}: returning to present restores golden output`);

    await page.locator('[data-fitab="correct"]').click();
    const section12WritingCases = [
      { input: "Je leurs ai dit de partir", expected: "Je leur ai dit de partir" },
      { input: "un vieux homme", expected: "un vieil homme" },
      { input: "Je leur ai dit", noIssue: true }
    ];
    for (const item of section12WritingCases) {
      await page.locator("#fiInput").fill(item.input);
      await page.locator("#fiCheck").click();
      if (item.noIssue) {
        assert.match(await page.locator("#fiAnswer").innerText(), /No issue from the small built-in check list was detected/, `${profile.name}: clean NR-03 negative remains unchanged`);
        assert.equal(await page.locator("#fiAnswer .fi-output").count(), 0);
      } else {
        assert.equal((await page.locator("#fiAnswer .fi-output").innerText()).trim(), item.expected, `${profile.name}: Section 12 correction`);
      }
    }
    console.log(`PASS ${profile.name}: Writing tab applies NR-03 and NR-05 and preserves the NR-03 negative`);

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
  await offlinePage.evaluate(async (expectedCacheVersion) => {
    const cacheNames = await caches.keys();
    const versionedCaches = cacheNames.filter(name => /^fa-v\d+$/.test(name));
    if (!versionedCaches.includes(expectedCacheVersion)) throw new Error("Active service-worker cache missing: " + expectedCacheVersion);
    if (versionedCaches.some(name => name === "fa-v13")) throw new Error("Production cache fa-v13 must not be active in this test");
    if (versionedCaches.length !== 1 || versionedCaches[0] !== expectedCacheVersion) throw new Error("Browser active cache name does not equal sw.js V: expected " + expectedCacheVersion + "; found " + versionedCaches.join(", "));
    const cache = await caches.open(expectedCacheVersion);
    const required = [
      "/index.html",
      "/features/ai-classroom.js?v=20261017-2",
      "/features/french-intelligence-compat.mjs",
      "/features/french-intelligence-core-v1.mjs",
      "/features/french-data.mjs",
      "/features/french-conjugation-paradigms.mjs"
    ];
    for (const path of required) {
      if (!await cache.match(new URL(path, location.origin).href)) throw new Error("Required offline cache entry missing: " + path);
    }
  }, swCacheVersion);
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
  console.log("PASS offline: service worker controlled the page; " + swCacheVersion + " precached the index and both split modules; dictionary, translation, conjugation and grammar work offline");
  await offlineContext.close();

  assert.deepEqual(failures, [], "Browser console/page errors were detected");
  assert.deepEqual(nonLocalAttempts, [], "Non-local network requests were attempted; all such requests are blocked");
  console.log("PASS network policy: zero non-local requests attempted; every non-local request is blocked by route policy");
} finally {
  await browser.close();
}
