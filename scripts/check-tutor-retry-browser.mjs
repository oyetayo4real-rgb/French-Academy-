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
  const testOrigin = new URL(baseUrl).origin;
  const testDocument = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main id="app"></main></body></html>';
  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== testOrigin) return route.abort();
    // Serve a minimal document on the HTTP origin without loading the real app's
    // inline AUTH bindings; the test installs its own isolated auth fixture.
    if (request.isNavigationRequest() && url.pathname === "/") {
      return route.fulfill({ status: 200, contentType: "text/html", body: testDocument });
    }
    return route.continue();
  });
  // A real HTTP origin enables localStorage while keeping the test page isolated.
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
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
    window.__recognition = null;
    window.SpeechRecognition = class {
      constructor() { window.__recognition = this; }
      start() { this.started = true; }
      stop() { if (this.onend) this.onend(); }
    };
    window.__spoken = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        speak(utterance) {
          window.__spoken.push({ text: utterance.text, lang: utterance.lang });
          if (utterance.onstart) utterance.onstart();
          if (utterance.onend) utterance.onend();
        }
      }
    });
    window.__memoryCalls = [];
    window.api = async (_path, options) => {
      const payload = structuredClone(options.body);
      if (payload.getLearningMemory === true) {
        window.__memoryCalls.push(payload);
        return { memoryEnabled: false, learningMemory: null };
      }
      if (typeof payload.setLearningMemoryEnabled === "boolean") {
        window.__memoryCalls.push(payload);
        return { memoryEnabled: payload.setLearningMemoryEnabled };
      }
      if (payload.clearLearningMemory === true) {
        window.__memoryCalls.push(payload);
        return { memoryCleared: true };
      }
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
  await page.locator("#faMemoryEnabled").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const control = document.querySelector("#faMemoryEnabled");
    return control && !control.disabled;
  });

  await check("learner can opt in to structured persistent memory", async () => {
    assert.equal(await page.locator("#faMemoryEnabled").isChecked(), false);
    await page.locator("#faMemoryEnabled").evaluate((element) => element.click());
    await page.waitForFunction(() => document.querySelector("#faMemoryEnabled")?.checked === true);
    const localState = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith("fa_tutor_local_v1:"));
      return key ? JSON.parse(localStorage.getItem(key)) : null;
    });
    assert(localState && localState.version === 1, "local tutor data was not saved");
    assert.equal(localState.memory.enabled, true, "learning-memory opt-in was not persisted locally");
    assert.match(await page.locator(".fa-memory-panel").innerText(), /saved securely to your account in Supabase/i);
    assert.equal((await page.evaluate(() => window.__memoryCalls)).length, 1, "cloud memory opt-in was not sent to Tutor V2");
  });

  await check("voice input captures French and English speech without auto-submitting", async () => {
    await page.locator("#faTutorMic").click();
    let state = await page.evaluate(() => ({ lang: window.__recognition.lang, started: window.__recognition.started }));
    assert.deepEqual(state, { lang: "fr-FR", started: true });
    await page.evaluate(() => {
      window.__recognition.onresult({
        resultIndex: 0,
        results: Object.assign([[{ transcript: "Je voudrais pratiquer le français." }]], {
          0: Object.assign([{ transcript: "Je voudrais pratiquer le français." }], { isFinal: true })
        })
      });
    });
    assert.equal(await page.locator("#faTutorInput").inputValue(), "Je voudrais pratiquer le français.");
    assert.equal(await page.locator("#faTutorSend").isVisible(), true);
    await page.locator("#faVoiceLanguage").selectOption("en-US");
    await page.locator("#faTutorMic").click();
    state = await page.evaluate(() => ({ lang: window.__recognition.lang, started: window.__recognition.started }));
    assert.deepEqual(state, { lang: "en-US", started: true });
    await page.evaluate(() => window.__recognition.onend());
  });

  await check("retry remains visible and disabled during an in-flight retry without duplicating the user message", async () => {
    await page.locator("#faTutorInput").fill("Explique le subjonctif.");
    await page.locator("#faTutorSend").click();
    await page.locator("#faTutorRetry").waitFor({ state: "visible" });

    assert.equal(await page.locator("#faTutorMessages .card").count(), 1);
    assert.equal(await page.locator("#faTutorMessages .card").innerText(), "You\nExplique le subjonctif.");

    await page.locator("#faTutorRetry").evaluate((element) => element.click());
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
    const savedChat = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith("fa_tutor_local_v1:"));
      if (!key) return null;
      const data = JSON.parse(localStorage.getItem(key));
      const active = data.conversations.find((item) => item.id === data.activeConversationId);
      return active ? { id: active.id, title: active.title, messages: active.messages } : null;
    });
    assert(savedChat && savedChat.messages.length === 2, "user and assistant messages were not saved locally");
    assert.match(savedChat.title, /Explique le subjonctif/i);
    await page.locator("#faNewConversation").click();
    // The new chat has no message records; the UI intentionally renders one
    // instructional empty-state card inside the messages container.
    assert.equal(await page.locator("#faTutorMessages .card").count(), 1, "new conversation should show only its empty-state card");
    assert.match(await page.locator("#faTutorMessages .card").innerText(), /Ask a question/i, "new conversation contains prior chat content");
    await page.locator("#faConversationSelect").selectOption(savedChat.id);
    assert.equal(await page.locator("#faTutorMessages .card").count(), 2, "saved conversation did not reopen with its messages");
    await page.locator('[data-fa-speak="1"]').click();
    const spoken = await page.evaluate(() => window.__spoken);
    assert.equal(spoken.length, 1);
    assert.equal(spoken[0].text, "Le subjonctif exprime notamment le doute.");
    assert.equal(spoken[0].lang, "en-US");
  });
} finally {
  await browser.close();
}

const report = { passed: passed.length, failed: failures.length, tests: passed, failures };
console.log("TUTOR_RETRY_BROWSER_RESULTS_JSON");
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
