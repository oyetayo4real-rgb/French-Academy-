import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const failures = [];
const passed = [];
let page;

async function check(name, fn) {
  try {
    await fn();
    passed.push(name);
    console.log("PASS:", name);
  } catch (error) {
    failures.push({ test: name, error: error?.stack || String(error) });
    console.error("FAIL:", name, error);
  }
}

try {
  page = await browser.newPage();
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseUrl).origin) return route.continue();
    return route.abort();
  });
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main id="app"></main></body></html>');
  await page.evaluate(() => {
    window.AUTH = { user: { id: "mock-user" } };
    // The production feature bridge is loaded after these globals in index.html.
    window.startCall = null;
    window.callView = null;
    window.endCall = null;
    window.view = "tutor";
    window.$ = document.getElementById("app");
    window.esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
    })[char]);
    window.__tutorRequests = [];
    window.__retryResolve = null;
    window.api = async (_path, options) => {
      const payload = structuredClone(options.body);
      window.__tutorRequests.push(payload);
      if (window.__tutorRequests.length === 1) {
        return { error: "provider_unavailable", retryable: true };
      }
      return new Promise((resolve) => { window.__retryResolve = resolve; });
    };
    window.render = () => window.FATutorView();
  });
  await page.addScriptTag({ url: baseUrl + "/features/ai-classroom.js" });
  await page.evaluate(() => window.FATutorView());

  await check("retry remains visible and disabled during an in-flight retry without duplicating the user message", async () => {
    await page.locator("#faTutorInput").fill("Explique le subjonctif.");
    await page.locator("#faTutorSend").click();
    await page.locator("#faTutorRetry").waitFor({ state: "visible" });

    assert.equal(await page.locator("#faTutorMessages .card").count(), 1);
    assert.equal(await page.locator("#faTutorMessages .card").innerText(), "You\nExplique le subjonctif.");

    await page.locator("#faTutorRetry").click();
    await page.locator("#faTutorRetry").waitFor({ state: "visible" });
    assert.equal(await page.locator("#faTutorRetry").isDisabled(), true);
    assert.equal(await page.locator("#faTutorRetry").getAttribute("aria-disabled"), "true");
    assert.equal((await page.locator("#faTutorRetry").innerText()).trim(), "Trying again...");
    assert.equal(await page.locator("#faTutorMessages .card").count(), 1);

    const requests = await page.evaluate(() => window.__tutorRequests);
    assert.equal(requests.length, 2, "retry must issue exactly one second request");
    assert.equal(requests[0].text, requests[1].text, "retry must reuse the original question");
    assert.deepEqual(requests[0].history, requests[1].history, "retry must reuse the original history");

    await page.evaluate(() => window.__retryResolve({ text: "Le subjonctif exprime notamment le doute." }));
    await page.locator("#faTutorMessages .card").nth(1).waitFor({ state: "visible" });
    assert.equal(await page.locator("#faTutorMessages .card").count(), 2);
    assert.equal(await page.locator("#faTutorRetry").count(), 0);
  });
} finally {
  await browser.close();
}

const report = { passed: passed.length, failed: failures.length, tests: passed, failures };
console.log("TUTOR_RETRY_BROWSER_RESULTS_JSON");
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
