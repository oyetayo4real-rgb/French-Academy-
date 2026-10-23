import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const routes = { legacy: "/tests/fixtures/french-intelligence-legacy.html", compat: "/tests/fixtures/french-intelligence-compat.html" };
const browser = await chromium.launch({ headless: true });
const pages = {};
let compared = 0, differences = 0;
const differenceDetails = [];
async function snapshot(page) {
  return page.evaluate(() => {
    const app = document.querySelector("#app"), active = document.activeElement;
    return {
      visibleText: (app?.innerText || "").replace(/\s+/g, " ").trim(),
      innerHTML: (app?.innerHTML || "").replace(/>\s+</g, "><").replace(/\s+/g, " ").replace(/=\s*"([^"]*)"/g, '="$1"').trim(),
      activeElement: active?.id || active?.getAttribute("data-fitab") || active?.getAttribute("data-fiprompt") || active?.tagName || ""
    };
  });
}
async function compareState(label) {
  const [legacy, compat] = await Promise.all([snapshot(pages.legacy), snapshot(pages.compat)]);
  compared++;
  if (legacy.visibleText !== compat.visibleText || legacy.innerHTML !== compat.innerHTML || legacy.activeElement !== compat.activeElement) {
    differences++;
    differenceDetails.push({ label, legacy, compat });
  }
}
async function clickTab(page, tab) { await page.locator('[data-fitab="' + tab + '"]').click(); }
async function fillAndRun(page, selector, value, action) {
  await page.locator(selector).fill(value);
  if (action) await page.locator(action).click();
}
try {
  for (const [name, path] of Object.entries(routes)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    pages[name] = page;
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(new URL(path, baseURL).href, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const api = window.FrenchIntelligenceCore;
      return !!api && ["lookup", "translate", "conjugate", "answerQuestion", "checkWriting"].every(key => typeof api[key] === "function");
    }, null, { timeout: 15000 });
    await page.locator("#hfrenchint").click();
    await page.getByRole("heading", { name: /French Intelligence/ }).waitFor();
    assert.deepEqual(errors, [], name + " engine emitted browser errors");
  }
  await compareState("initial ask tab");
  const cases = [
    { tab: "ask", selector: "#fiInput", action: "#fiAsk", values: ["Explain ne … pas", "When do I use tu and vous?", "Explain passé composé", "Why is maison feminine?", "Why is bonjour used?", ""] },
    { tab: "dict", selector: "#fiWord", action: "#fiLookup", values: ["bonjour", "école", "s'il vous plaît", "amour", "unknown-word-xyz", ""] },
    { tab: "translate", selector: "#fiInput", action: "#fiTranslate", values: ["Bonjour", "Merci", "Thank you", "Je suis étudiant", "unknown phrase xyz", ""] },
    { tab: "verbs", selector: "#fiVerb", action: "#fiConjugate", values: ["être", "avoir", "aller", "parler", "finir", "unknownverb", ""] },
    { tab: "correct", selector: "#fiInput", action: "#fiCheck", values: ["Bonjour.", "sa va", "je sui fatigue", "Merci beaucoup", "<img src=x onerror=alert(1)>", ""] }
  ];
  for (const item of cases) {
    for (const page of Object.values(pages)) await clickTab(page, item.tab);
    await compareState(item.tab + " tab open");
    for (const value of item.values) {
      for (const page of Object.values(pages)) await fillAndRun(page, item.selector, value, item.action);
      await compareState(item.tab + " input " + JSON.stringify(value));
    }
  }
  for (const page of Object.values(pages)) await clickTab(page, "translate");
  for (const direction of ["fr-en", "en-fr"]) {
    for (const page of Object.values(pages)) {
      await page.locator("#fiDirection").selectOption(direction);
      await page.locator("#fiInput").fill(direction === "fr-en" ? "Bonjour" : "Good morning");
      await page.locator("#fiTranslate").click();
    }
    await compareState("translation direction " + direction);
  }
  for (const page of Object.values(pages)) await clickTab(page, "grammar");
  await compareState("grammar tab open");
  for (const query of ["", "negation", "verb", "past", "agreement", "conditional", "nonexistent-rule"]) {
    for (const page of Object.values(pages)) await page.locator("#fiRuleSearch").fill(query);
    await compareState("grammar filter " + JSON.stringify(query));
  }
  for (const page of Object.values(pages)) {
    await clickTab(page, "ask");
    await page.locator("#fiHome").focus();
    await page.keyboard.press("Tab");
  }
  await compareState("keyboard Tab focus from home button");
  for (const page of Object.values(pages)) await page.keyboard.press("Enter");
  await compareState("keyboard Enter activates focused tab");
  for (const page of Object.values(pages)) {
    await clickTab(page, "dict");
    await page.locator("#fiWord").fill("bonjour");
    await page.locator("#fiWord").press("Enter");
  }
  await compareState("keyboard Enter submits dictionary lookup");
  for (const page of Object.values(pages)) await page.locator("#fiHome").click();
  await compareState("back-to-home");
  if (differences) console.error(JSON.stringify(differenceDetails.slice(0, 20), null, 2));
  assert.equal(differences, 0, "legacy and compatibility UI output must match at every checkpoint");
  console.log("PASS browser UI parity: compared=" + compared + " differences=" + differences + " (visible text, normalised innerHTML, active focus)");
} catch (error) {
  console.error("FAIL browser UI parity: compared=" + compared + " differences=" + differences);
  throw error;
} finally { await browser.close(); }
