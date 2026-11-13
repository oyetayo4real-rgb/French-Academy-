import { chromium } from "playwright";

const branchURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const mainURL = process.env.MAIN_FRENCH_ACADEMY_URL || "http://127.0.0.1:4174";
const viewport = { width: 360, height: 800 };
const scenarios = [
  { name: "empty", input: null },
  { name: "no-issue", input: "Il a mangé." },
  { name: "highlights", input: "Je leurs ai dit de partir" }
];

const browser = await chromium.launch({ headless: true });
const output = { viewport, mainURL, branchURL, states: [] };

async function openWriting(url) {
  const page = await browser.newPage({ viewport });
  await page.goto(new URL("/tests/fixtures/french-intelligence-compat.html", url).href, {
    waitUntil: "networkidle"
  });
  await page.locator("#hfrenchint").click();
  await page.locator('[data-fitab="correct"]').click();
  await page.locator("#fiInput").waitFor({ state: "visible" });
  return page;
}

async function measure(page) {
  return page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const elements = [document.body, ...document.body.querySelectorAll("*")];
    const offenders = elements.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.right <= clientWidth) return [];
      const style = getComputedStyle(element);
      return [{
        tag: element.tagName.toLowerCase(),
        id: element.id || "",
        class: typeof element.className === "string"
          ? element.className
          : (element.getAttribute("class") || ""),
        computedWidth: style.width,
        right: Math.round(rect.right * 100) / 100
      }];
    });
    return {
      clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      offenders
    };
  });
}

try {
  const main = await openWriting(mainURL);
  const branch = await openWriting(branchURL);
  try {
    for (const scenario of scenarios) {
      const state = { name: scenario.name };
      for (const [label, page] of [["main", main], ["branch", branch]]) {
        try {
          if (scenario.input !== null) {
            await page.locator("#fiInput").fill(scenario.input);
            await page.locator("#fiCheck").click();
            await page.locator("#fiAnswer .fi-answer").waitFor({ state: "visible" });
          }
          state[label] = await measure(page);
        } catch (error) {
          state[label] = { error: error instanceof Error ? error.message : String(error) };
        }
      }
      output.states.push(state);
    }
  } finally {
    await Promise.all([main.close(), branch.close()]);
  }
} catch (error) {
  output.fatal = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  console.log("M3_OVERFLOW_360_JSON " + JSON.stringify(output));
  await browser.close();
}
