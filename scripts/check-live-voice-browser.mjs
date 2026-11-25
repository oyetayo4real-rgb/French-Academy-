import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const failures = [];
const passed = [];
const check = async (name, fn) => {
  try { await fn(); passed.push(name); console.log("PASS:", name); }
  catch (error) { failures.push({ test: name, error: error?.stack || String(error) }); console.error("FAIL:", name, error); }
};

try {
  const page = await browser.newPage();
  const testOrigin = new URL(baseUrl).origin;
  const minimalDocument = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main><h1>AI French tutor</h1></main></body></html>';
  await page.route("**/*", route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== testOrigin) return route.abort();
    if (request.isNavigationRequest() && url.pathname === "/") {
      return route.fulfill({ status: 200, contentType: "text/html", body: minimalDocument });
    }
    return route.continue();
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    class FakeTrack extends EventTarget {
      kind = "audio";
      stop() { this.stopped = true; }
    }
    class FakeAudioContext extends EventTarget {
      sampleRate = 48000;
      currentTime = 0;
      state = "running";
      destination = {};
      async resume() { this.state = "running"; }
      async close() { this.state = "closed"; this.dispatchEvent(new Event("statechange")); }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createScriptProcessor() {
        const processor = { onaudioprocess: null, connect() {}, disconnect() {} };
        window.__processor = processor;
        return processor;
      }
      createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
      createBuffer() { return { getChannelData: () => new Float32Array(1), duration: 0.01 }; }
      createBufferSource() { return { connect() {}, start() {}, stop() {}, onended: null }; }
    }
    class FakeMediaRecorder {
      static isTypeSupported() { return true; }
      constructor(_stream, options = {}) { this.state = "inactive"; this.mimeType = options.mimeType || "audio/webm"; }
      start() { this.state = "recording"; }
      stop() {
        if (this.state === "inactive") return;
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["x".repeat(2048)], { type: this.mimeType }) });
        this.onstop?.();
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
    window.MediaRecorder = FakeMediaRecorder;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    window.speechSynthesis = {
      cancel() {},
      getVoices: () => [{ lang: "fr-FR" }],
      speak(utterance) { utterance.onstart?.(); utterance.onend?.(); }
    };
    window.__getUserMediaCalls = 0;
    window.__tracks = [];
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          window.__getUserMediaCalls++;
          const track = new FakeTrack();
          window.__tracks.push(track);
          return { getAudioTracks: () => [track], getTracks: () => [track] };
        }
      }
    });
    window.__groqCalls = 0;
    window.__sessionRequests = [];
    window.FA_LIVE_VOICE_CONTEXT = {
      isSignedIn: () => true,
      level: () => "A1",
      context: () => ({ level: "A1", topics: [], recent: [], memoryEnabled: false }),
      request: async body => { window.__sessionRequests.push(body); return { ephemeral_token: "mock-one-use-token", instructions: "Test teacher" }; },
      groqTurn: async () => {
        window.__groqCalls++;
        return { transcript: "Bonjour, je voudrais pratiquer.", text: "Très bien ! Comment allez-vous ?" };
      },
      appendTranscript: () => {},
      recordVoiceTurn: async () => {}
    };
  });

  await page.route("https://esm.sh/@google/genai@2.32.0?bundle", route => route.fulfill({
    status: 200,
    contentType: "text/javascript",
    body: 'export class GoogleGenAI { constructor(){ this.live={connect:async({callbacks})=>{ if(window.__geminiConnectMode==="open"){window.__geminiCallbacks=callbacks;return {sendRealtimeInput(){},close(){}};} throw new Error("controlled Gemini outage"); }}; } }'
  }));
  await page.addScriptTag({ url: baseUrl + "/features/live-voice.js" });
  await page.locator("#faLivePanel").waitFor({ state: "visible" });

  await check("Gemini connection failure automatically activates Groq fallback", async () => {
    await page.locator("#faLiveStart").click();
    await page.waitForFunction(() => document.querySelector("#faLiveProvider")?.textContent === "Groq Voice backup");
    assert.match(await page.locator("#faLiveStatus").innerText(), /Voice backup is selected/i);
    assert.equal(await page.evaluate(() => window.__getUserMediaCalls), 1);
  });

  await check("Groq fallback records a speech turn and returns a tutor response", async () => {
    await page.evaluate(() => {
      const audio = new Float32Array(4096).fill(0.12);
      window.__processor.onaudioprocess({ inputBuffer: { getChannelData: () => audio } });
    });
    await page.waitForTimeout(850);
    await page.evaluate(() => {
      const silence = new Float32Array(4096);
      window.__processor.onaudioprocess({ inputBuffer: { getChannelData: () => silence } });
    });
    await page.waitForFunction(() => window.__groqCalls === 1);
    await page.waitForFunction(() => document.querySelector("#faLiveTranscript")?.innerText.includes("Très bien"));
    assert.match(await page.locator("#faLiveTranscript").innerText(), /Bonjour, je voudrais pratiquer/);
    assert.match(await page.locator("#faLiveTranscript").innerText(), /Très bien/);
  });

  await check("microphone track loss stops stale resources and allows permission recovery", async () => {
    await page.evaluate(() => window.__tracks[0].dispatchEvent(new Event("ended")));
    await page.waitForFunction(() => document.querySelector("#faLiveStart")?.disabled === false);
    assert.match(await page.locator("#faLiveStatus").innerText(), /Microphone disconnected/i);
    await page.evaluate(() => { window.__geminiConnectMode = "open"; });
    await page.locator("#faLiveStart").click();
    await page.waitForFunction(() => document.querySelector("#faLiveProvider")?.textContent === "Gemini Live");
    assert.equal(await page.evaluate(() => window.__getUserMediaCalls), 2, "restart should request a fresh microphone stream");
  });

  await check("Gemini session interruption reconnects with a fresh one-use token and preserves the microphone", async () => {
    await page.evaluate(() => {
      window.__geminiCallbacks.onmessage({ sessionResumptionUpdate: { resumable: true, newHandle: "mock-resume-handle" } });
      window.__geminiCallbacks.onclose({ code: 1011, reason: "controlled transient failure" });
    });
    await page.waitForFunction(() => document.querySelector("#faLiveStatus")?.innerText.includes("reconnected"), { timeout: 8000 });
    assert.equal(await page.evaluate(() => window.__getUserMediaCalls), 2, "Gemini recovery must preserve the existing microphone stream");
    assert.equal(await page.locator("#faLiveProvider").innerText(), "Gemini Live");
    assert.equal(await page.evaluate(() => window.__sessionRequests.at(-1)?.resumeHandle), "mock-resume-handle", "reconnect must request a fresh token bound to the latest resume handle");
  });

  await check("bounded Gemini reconnect failure falls back to Groq without looping", async () => {
    await page.evaluate(() => { window.__geminiConnectMode = "closed"; window.__geminiCallbacks.onclose({ code: 1011, reason: "controlled persistent failure" }); });
    await page.waitForFunction(() => document.querySelector("#faLiveProvider")?.textContent === "Groq Voice backup", { timeout: 10000 });
    assert.match(await page.locator("#faLiveStatus").innerText(), /Voice backup is selected/i);
    assert.equal(await page.evaluate(() => window.__getUserMediaCalls), 2, "fallback must keep the same microphone stream");
  });
} finally {
  await browser.close();
}

const report = { passed: passed.length, failed: failures.length, tests: passed, failures };
console.log("LIVE_VOICE_BROWSER_RESULTS_JSON");
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
