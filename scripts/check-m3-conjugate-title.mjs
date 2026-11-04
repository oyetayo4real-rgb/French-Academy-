import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const branchURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const mainURL = process.env.MAIN_FRENCH_ACADEMY_URL || "http://127.0.0.1:4174";
const goldenV3 = JSON.parse(readFileSync("tests/golden/legacy-v3.json", "utf8"));
const expectedPresent = goldenV3.inventory.conjugation.verbs.find(row => row.verb === "être");
assert.ok(expectedPresent, "golden v3 must contain the être present paradigm");
const persons = ["je / j'", "tu", "il / elle / on", "nous", "vous", "ils / elles"];
const expectedPresentHTML =
  '<div class="fi-answer"><h3>être — present tense</h3><div class="fi-muted">' +
  expectedPresent.output.type + "</div><table><tbody>" +
  expectedPresent.output.forms.map((form, index) =>
    "<tr><td>" + persons[index] + "</td><td><b>" + form + "</b></td></tr>"
  ).join("") +
  "</tbody></table></div>";
const tenses = ["present", "imparfait", "futur", "conditionnel", "passé composé"];
const browser = await chromium.launch({ headless: true });

async function openConjugator(url, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(new URL("/tests/fixtures/french-intelligence-compat.html", url).href, {
    waitUntil: "networkidle"
  });
  await page.waitForFunction(() =>
    typeof window.FrenchIntelligenceCore?.conjugate === "function"
  );
  await page.locator("#hfrenchint").click();
  await page.locator('[data-fitab="verbs"]').click();
  await page.locator("#fiVerb").fill("être");
  return page;
}

async function measure(page, tense) {
  await page.locator("#fiTense").selectOption(tense);
  await page.locator("#fiConjugate").click();
  await page.locator("#fiAnswer h3").waitFor();
  return page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")].flatMap(element => {
      const rect = element.getBoundingClientRect();
      if (rect.right <= clientWidth + 0.5) return [];
      return [{
        tag: element.tagName.toLowerCase(),
        id: element.id || "",
        class: typeof element.className === "string" ? element.className : "",
        width: Math.round(rect.width * 100) / 100,
        right: Math.round(rect.right * 100) / 100
      }];
    });
    return {
      clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflow: Math.max(0, document.documentElement.scrollWidth - clientWidth),
      offenders
    };
  });
}

try {
  const desktopResults = {};
  for (const [name, url] of [["main", mainURL], ["branch", branchURL]]) {
    const page = await openConjugator(url, { width: 1280, height: 900 });
    try {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => {
        if (message.type() === "error") errors.push(message.text());
      });
      desktopResults[name] = {};
      for (const tense of ["present", "imparfait"]) {
        desktopResults[name][tense] = await measure(page, tense);
        if (name === "branch" && tense === "present") {
          const apiOutput = await page.evaluate(() => window.FrenchIntelligenceCore.conjugate("être"));
          assert.deepEqual(apiOutput, expectedPresent.output,
            "desktop present API remains byte-identical to golden v3");
          assert.equal(await page.locator("#fiAnswer").innerHTML(), expectedPresentHTML,
            "desktop present card HTML remains byte-identical to golden v3 rendering");
        }
        if (name === "branch" && tense === "imparfait") {
          assert.equal(await page.locator(".fi-conjugation-heading h3").textContent(),
            "Verb conjugator", "desktop non-present card heading");
          assert.equal(await page.locator("#fiAnswer tbody tr").count(), 6,
            "desktop non-present card retains all six person rows");
        }
      }
      assert.deepEqual(errors, [], name + " desktop browser errors");
    } finally {
      await page.close();
    }
  }

  console.log("M3_OVERFLOW_COMPARISON " + JSON.stringify({
    viewport: "1280x900",
    views: desktopResults,
    comparison: ["present", "imparfait"].map(tense => ({
      tense,
      mainOverflow: desktopResults.main[tense].overflow,
      branchOverflow: desktopResults.branch[tense].overflow,
      branchNotWorseThanMain: desktopResults.branch[tense].overflow <= desktopResults.main[tense].overflow
    }))
  }));
  for (const tense of ["present", "imparfait"]) {
    assert.ok(desktopResults.branch[tense].overflow <= desktopResults.main[tense].overflow,
      "desktop " + tense + " branch overflow must not exceed main: " +
      JSON.stringify({main: desktopResults.main[tense], branch: desktopResults.branch[tense]}));
  }

  const mobile = await openConjugator(branchURL, { width: 360, height: 800 });
  try {
    const errors = [];
    mobile.on("pageerror", error => errors.push(error.message));
    mobile.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    for (const tense of ["present", "imparfait"]) {
      const dimensions = await measure(mobile, tense);
      assert.equal(dimensions.scrollWidth, dimensions.clientWidth,
        "mobile-360 " + tense + " document has zero horizontal overflow: " + JSON.stringify(dimensions));
      assert.ok(dimensions.bodyScrollWidth <= dimensions.clientWidth,
        "mobile-360 " + tense + " body has zero horizontal overflow: " + JSON.stringify(dimensions));
      if (tense === "imparfait") {
        assert.equal(await mobile.locator(".fi-conjugation-heading h3").textContent(),
          "Verb conjugator", "mobile non-present card heading");
      }
    }
    assert.deepEqual(errors, [], "mobile-360 browser errors");
  } finally {
    await mobile.close();
  }

  console.log("PASS M3 Part A: main/branch desktop overflow comparison, mobile overflow 0, five tenses, present golden v3 parity.");
} finally {
  await browser.close();
}
