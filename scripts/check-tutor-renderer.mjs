import { readFileSync } from "node:fs";
import vm from "node:vm";
import { chromium } from "playwright";

const source = readFileSync("features/ai-classroom.js", "utf8");
const cssPath = "features/ai-classroom.css";
const baseURL = process.env.FRENCH_ACADEMY_URL || "http://127.0.0.1:4173";
const failures = [];
const check = (ok, test, input, expected, actual) => {
  if (!ok) failures.push({ step: "M4a tutor renderer", test, input, expected, actual });
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[ch]);
const start = source.indexOf("  function faMathCleanup(value) {");
const end = source.indexOf("  // Explicit entry points", start);
if (start < 0 || end < 0) throw new Error("Could not isolate the production Tutor renderer");
const rendererSource = source.slice(start, end);
const render = vm.runInNewContext(
  "(() => { const faSafe = value => escape(value == null ? '' : String(value)); " +
  rendererSource + "\nreturn faMarkdown; })()",
  { escape: escapeHtml }
);

function legacyRender(value) {
  const escaped = escapeHtml(String(value == null ? "" : value));
  const inline = line => line
    .replace(/\x60([^\x60]+)\x60/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  const lines = escaped.split(/\r?\n/), out = [];
  let list = "", paragraph = [];
  const flush = () => { if (paragraph.length) { out.push("<p>" + inline(paragraph.join(" ")) + "</p>"); paragraph = []; } };
  const close = () => { if (list) { out.push("</" + list + ">"); list = ""; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); close(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) { flush(); close(); const n = Math.min(heading[1].length + 1, 5); out.push("<h" + n + ">" + inline(heading[2]) + "</h" + n + ">"); continue; }
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) { flush(); if (list !== "ul") { close(); list = "ul"; out.push("<ul>"); } out.push("<li>" + inline(bullet[1]) + "</li>"); continue; }
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) { flush(); if (list !== "ol") { close(); list = "ol"; out.push("<ol>"); } out.push("<li>" + inline(numbered[1]) + "</li>"); continue; }
    paragraph.push(line);
  }
  flush(); close(); return out.join("");
}

const emphasisInputs = [
  "Il a mangé *une pomme*.",
  "Il a mangé une **pomme**.",
  "Il a mangé _une_ pomme."
];
const emphasisResults = emphasisInputs.map(input => ({ input, before: legacyRender(input), after: render(input) }));
check(emphasisResults[0].after === "<p>Il a mangé <em>une pomme</em>.</p>", "single-asterisk emphasis preserves spaces", emphasisInputs[0], "<p>Il a mangé <em>une pomme</em>.</p>", emphasisResults[0].after);
check(emphasisResults[1].after === "<p>Il a mangé une <strong>pomme</strong>.</p>", "bold emphasis preserves spaces", emphasisInputs[1], "<p>Il a mangé une <strong>pomme</strong>.</p>", emphasisResults[1].after);
check(emphasisResults[2].after === "<p>Il a mangé <em>une</em> pomme.</p>", "underscore emphasis preserves spaces", emphasisInputs[2], "<p>Il a mangé <em>une</em> pomme.</p>", emphasisResults[2].after);

const mathInput = "$$\\text{Subject} + \\text{Auxiliary (avoir/être)} + \\text{Past Participle} = \\text{Passé Composé}$$";
const mathResult = { input: mathInput, before: legacyRender(mathInput), after: render(mathInput) };
check(mathResult.after === "<p>Subject + Auxiliary (avoir/être) + Past Participle = Passé Composé</p>", "display math becomes plain text", mathInput, "<p>Subject + Auxiliary (avoir/être) + Past Participle = Passé Composé</p>", mathResult.after);
check(render("Il a mangé $\\rightarrow$ Il mangea") === "<p>Il a mangé → Il mangea</p>", "math arrows become Unicode", "Il a mangé $\\rightarrow$ Il mangea", "<p>Il a mangé → Il mangea</p>", render("Il a mangé $\\rightarrow$ Il mangea"));

const oneLineTable = "| Feature | Analysis | | :--- | :--- | | **Sentence** | Il a mangé. | | **Translation** | He ate / He has eaten. | | **Tense** | Passé Composé |";
const oneLineHtml = render(oneLineTable);
check(oneLineHtml.includes('<div class="fa-table-scroll"') && oneLineHtml.includes("<table>") && oneLineHtml.includes('<th scope="col">Feature</th>') && oneLineHtml.includes("<strong>Sentence</strong>"), "single-line pipe table renders as semantic HTML table", oneLineTable, "scroll wrapper, table, scoped header cells", oneLineHtml);

const comparisonTable = "| Tense / Mood | French Form | English Equivalent | | :--- | :--- | :--- | | Présent | Il mange | He eats |";
const comparisonHtml = render(comparisonTable);
check(comparisonHtml.includes('<th scope="col">Tense / Mood</th>') && comparisonHtml.includes("<td>Présent</td>"), "single-line three-column comparison table", comparisonTable, "three semantic columns", comparisonHtml);

const codePipeTable = "| Code | Meaning | | :--- | :--- | | \x60a|b\x60 | literal pipe |";
const codePipeHtml = render(codePipeTable);
check(codePipeHtml.includes("<code>a|b</code>") && (codePipeHtml.match(/<td>/g) || []).length === 2, "pipe inside code span is not a cell delimiter", codePipeTable, "one data row with two cells", codePipeHtml);

const tenseContrastInput = "Tense Contrasts\nThe passé composé contrasts with other past tenses:";
const tenseContrastHtml = render(tenseContrastInput);
check(tenseContrastHtml === "<p>Tense Contrasts<br>The passé composé contrasts with other past tenses:</p>",
  "single newline inside paragraph renders as a line break",
  tenseContrastInput, "<p>Tense Contrasts<br>The passé composé contrasts with other past tenses:</p>", tenseContrastHtml);

const agreementInput = "Agreement with Avoir\nEstablished fact: When the auxiliary";
const agreementHtml = render(agreementInput);
check(agreementHtml === "<p>Agreement with Avoir<br>Established fact: When the auxiliary</p>",
  "agreement example preserves the single-line break",
  agreementInput, "<p>Agreement with Avoir<br>Established fact: When the auxiliary</p>", agreementHtml);


const mobileProductionTable = [
  "| Critère | Depuis | Pendant |",
  "| :--- | :--- | :--- |",
  "| Statut de l'action | Continue (commencée dans le passé et se poursuit) | Terminée (limitée à une période précise) |",
  "| Temps du verbe associé | Généralement le présent | Généralement un temps du passé ou du futur |",
  "| Question posée | Depuis quand ? | Pendant combien de temps ? |"
].join("\n");
const mobileProductionHtml = render(mobileProductionTable);
check((mobileProductionHtml.match(/<th scope="col">/g) || []).length === 3 &&
  (mobileProductionHtml.match(/<td>/g) || []).length === 9,
  "exact production depuis/pendant table renders all cells",
  mobileProductionTable, "3 headers and 9 data cells", mobileProductionHtml);

const multiLineTable = [
  "| Column A | Column B | Column C |",
  "| :--- | :--- | :--- |",
  "| Alpha | A longer description that requires the table wrapper to scroll on a narrow phone | First row |",
  "| Beta | Second row | Detail B |",
  "| Gamma | Third row | Detail C |",
  "| Delta | Fourth row | Detail D |"
].join("\n");
const multiLineHtml = render(multiLineTable);
check((multiLineHtml.match(/<tr>/g) || []).length === 5 && (multiLineHtml.match(/<th scope="col">/g) || []).length === 3, "three-column five-row multiline table", multiLineTable, "5 rows and 3 scoped headers", multiLineHtml);

const hrInput = "First paragraph\n---\nSecond paragraph";
check(render(hrInput) === "<p>First paragraph</p><hr><p>Second paragraph</p>", "horizontal rule is rendered as hr", hrInput, "<p>First paragraph</p><hr><p>Second paragraph</p>", render(hrInput));

const orderedInput = "3. First\n4. Second\n\nA paragraph interruption.\n\n- A sub-bullet\n5. Third";
const orderedHtml = render(orderedInput);
check(orderedHtml.includes('<ol start="3"><li>First</li><li>Second</li></ol>') &&
  orderedHtml.includes('<ol start="5"><li>Third</li></ol>'),
  "ordered numbering continues after paragraph and sub-bullet interruptions",
  orderedInput, "ordered lists start at 3 and resume at 5", orderedHtml);

const unsafeTable = "| Field | Value | | :--- | :--- | | Script | <script>alert(1)</script> | | Event | <img src=x onerror=alert(1)> | | Link | [click](javascript:alert(1)) |";
const unsafeHeading = "# [heading](javascript:alert(1)) <img src=x onerror=alert(1)>";
const unsafeLink = "[click](javascript:alert(1))";
const unsafeHtml = render(unsafeTable + "\n\n" + unsafeHeading + "\n\n" + unsafeLink);
check(!/<script\b/i.test(unsafeHtml) && !/<img\b/i.test(unsafeHtml) && !/href\s*=\s*["']javascript:/i.test(unsafeHtml),
  "untrusted HTML and javascript URLs remain inert in tables, links and headings",
  "script/onerror/javascript fixtures", "no active script, image or javascript href", unsafeHtml);
const safeLinkHtml = render("[reference](https://example.com)");
check(safeLinkHtml.includes('href="https://example.com"') && safeLinkHtml.includes('rel="noopener noreferrer"'),
  "safe HTTPS Markdown links render with safe rel attributes", "[reference](https://example.com)", "safe external anchor", safeLinkHtml);

const noteText = "AI answers can contain mistakes. Check important points in a dictionary or grammar reference.";
check(source.includes(noteText) && source.includes('class="fa-tutor-answer-note"') && source.includes('m.role === "assistant" ?'),
  "app-owned note is appended to assistant answers", noteText, "static note after each assistant answer", "note source marker missing");
const cacheSource = readFileSync("sw.js", "utf8");
const cacheVersionMatch = cacheSource.match(/const\s+V\s*=\s*"(fa-v\d+)"/);
const cacheVersion = cacheVersionMatch?.[1] || "missing";
const corePrecacheMatch = cacheSource.match(/CORE=\[(.*?)\];/s);
const corePrecachePaths = corePrecacheMatch ? [...corePrecacheMatch[1].matchAll(/"([^"]+)"/g)].map(match => match[1]) : [];
const requiredPrecachePaths = [
  "/features/ai-classroom.js",
  "/features/ai-classroom.css",
  "/features/french-intelligence-compat.mjs",
  "/features/french-section12-rules.mjs",
  "/features/french-vocabulary-m1.mjs",
  "/index.html"
];
check(cacheVersion !== "missing", "service-worker cache version is parsed from sw.js", "const V=\\\"fa-vNN\\\"", cacheVersion, cacheVersion);
check(!!corePrecacheMatch && requiredPrecachePaths.every(path => corePrecachePaths.includes(path)),
  "all required Tutor and French Intelligence files are in the service-worker precache",
  requiredPrecachePaths.join(", "), "all six paths in CORE", corePrecachePaths.join(", "));

function colorParts(value) {
  const match = String(value).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}
function luminance(rgb) {
  const channels = rgb.map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const browser = await chromium.launch({ headless: true });
let contrastResults = [];
let layoutResults = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ path: cssPath });
  const fixture = '<main class="w">' +
    '<div id="faTutorMessages"><div class="card"><div class="fa-answer">' + oneLineHtml + mobileProductionHtml + multiLineHtml + '</div>' +
    '<p class="fa-tutor-answer-note" role="note">' + noteText + '</p></div></div>' +
    '<footer id="lexique-credits" style="box-sizing:border-box;max-width:1120px;width:calc(100% - 32px);margin:24px auto;padding:18px 20px;border:1px solid rgba(127,127,127,.28);border-radius:14px">' +
    '<a href="https://www.lexique.org/">Lexique</a> <a href="https://creativecommons.org/licenses/by-sa/4.0/">Licence</a></footer>' +
    '<section class="card fa-dictionary-entry"><section class="fa-references-attribution"><h3>References and attribution</h3>' +
    '<a href="https://example.com/reference">Reference</a> <a href="https://example.com/attribution">Attribution</a></section>' +
    '<div class="card fa-dictionary-sources"><h3>Dictionary sources</h3>' +
    '<a href="https://example.com/dictionary">Dictionary</a> <a href="https://example.com/source">Source</a></div></section></main>';
  await page.evaluate(markup => { document.body.innerHTML = markup; }, fixture);
  await page.setViewportSize({ width: 1280, height: 900 });
  layoutResults.push(await page.evaluate(() => ({
    viewport: window.innerWidth,
    pageWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    tableCount: document.querySelectorAll(".fa-table-scroll table").length,
    scopedHeaders: document.querySelectorAll(".fa-table-scroll thead th[scope=col]").length,
    rows: document.querySelectorAll(".fa-table-scroll tbody tr").length
  })));
  check(layoutResults[0].pageWidth <= 1280, "desktop renderer has no page-level horizontal overflow", "1280px", "<= 1280", layoutResults[0].pageWidth);
  await page.setViewportSize({ width: 360, height: 800 });
  layoutResults.push(await page.evaluate(() => {
    const wrappers = [...document.querySelectorAll(".fa-table-scroll")];
    return {
      viewport: window.innerWidth,
      pageWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      wrappers: wrappers.map(el => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, overflowX: getComputedStyle(el).overflowX }))
    };
  }));
  check(layoutResults[1].pageWidth <= 360, "360px renderer has no sideways page scroll", "360px", "<= 360", layoutResults[1].pageWidth);
  check(layoutResults[1].wrappers.every(x => x.scrollWidth <= x.clientWidth + 1),
    "360px tables wrap without inner horizontal scrolling", "exact production table and existing fixtures", "every wrapper scrollWidth <= clientWidth + 1", layoutResults[1].wrappers);
  const mobileCells = await page.locator(".fa-table-scroll").nth(1).locator("th,td").evaluateAll(cells => cells.map(cell => {
    const rect = cell.getBoundingClientRect();
    return { textLength: cell.textContent.trim().length, right: rect.right, width: rect.width };
  }));
  check(mobileCells.length === 12 && mobileCells.every(cell => cell.right <= 360),
    "every production table cell fits within the 360px viewport", "exact production table", "12 cells with right edge <= 360px", mobileCells);
  check(layoutResults[0].tableCount >= 2 && layoutResults[0].scopedHeaders >= 5 && layoutResults[0].rows === 7,
    "table structure and header semantics survive DOM parsing", "table fixture", "two tables, scoped headers, four body rows", layoutResults[0]);

  const noteStyle = await page.evaluate(() => {
    const el = document.querySelector(".fa-tutor-answer-note");
    const style = getComputedStyle(el);
    return { borderLeftWidth: style.borderLeftWidth, padding: style.padding, background: style.backgroundColor, fontSize: style.fontSize };
  });
  check(noteStyle.borderLeftWidth === "3px" && noteStyle.fontSize === "13px" && noteStyle.padding.includes("8px"),
    "Tutor note matches Writing checker note styling", noteText, "3px accent border, 8px padding, 13px text", noteStyle);

  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => document.documentElement.setAttribute("data-theme", value), theme);
    const measurements = await page.evaluate(() => {
      const groups = [
        ["credits", "#lexique-credits a"],
        ["references", ".fa-references-attribution a"],
        ["dictionary-sources", ".fa-dictionary-sources a"]
      ];
      const bgFor = element => {
        let node = element;
        while (node) {
          const color = getComputedStyle(node).backgroundColor;
          if (color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)") return color;
          node = node.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      return groups.flatMap(([container, selector]) => [...document.querySelectorAll(selector)].map((link, index) => {
        link.focus();
        const style = getComputedStyle(link);
        const fg = style.color.match(/rgba?\([^)]+\)/)?.[0] || style.color;
        const bg = bgFor(link);
        const toRgb = value => {
          const m = String(value).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
          return m ? m.slice(1,4).map(Number) : null;
        };
        return {
          theme: document.documentElement.dataset.theme,
          container,
          index,
          foreground: fg,
          background: bg,
          foregroundRgb: toRgb(fg),
          backgroundRgb: toRgb(bg),
          underline: style.textDecorationLine.includes("underline"),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth
        };
      }));
    });
    for (const result of measurements) {
      const ratio = result.foregroundRgb && result.backgroundRgb ? contrast(result.foregroundRgb, result.backgroundRgb) : 0;
      contrastResults.push({ theme, container: result.container, link: result.index + 1, contrast: Number(ratio.toFixed(2)), foreground: result.foreground, background: result.background, underline: result.underline, outline: result.outlineStyle + " " + result.outlineWidth });
      check(ratio >= 4.5, "reference link contrast is at least 4.5:1", theme + "/" + result.container + "/" + result.index, ">= 4.5:1", Number(ratio.toFixed(2)));
      check(result.underline, "reference links are underlined", theme + "/" + result.container + "/" + result.index, "underline", result.underline);
      check(result.outlineStyle !== "none" && result.outlineWidth !== "0px", "reference link has visible keyboard focus outline", theme + "/" + result.container + "/" + result.index, "visible outline", result.outlineStyle + " " + result.outlineWidth);
    }
  }
  const securityDom = await page.evaluate(markup => {
    const host = document.createElement("div");
    host.className = "fa-answer";
    host.innerHTML = markup;
    document.body.appendChild(host);
    return {
      scripts: host.querySelectorAll("script").length,
      images: host.querySelectorAll("img").length,
      onerrorAttributes: host.querySelectorAll("[onerror]").length,
      javascriptLinks: host.querySelectorAll('a[href^="javascript:" i]').length
    };
  }, unsafeHtml);
  check(securityDom.scripts === 0 && securityDom.images === 0 && securityDom.onerrorAttributes === 0 && securityDom.javascriptLinks === 0,
    "browser DOM contains no executable injected elements", "XSS fixtures in tables, links and headings", "0 script, img, onerror and javascript href nodes", securityDom);
  await browser.close();
} catch (error) {
  failures.push({ step: "M4a tutor renderer", test: "browser harness", input: "Playwright desktop/mobile/contrast", expected: "browser checks complete", actual: String(error && error.message || error) });
  await browser.close();
}

console.log("FA_TUTOR_RENDERER_FAILURES_JSON " + JSON.stringify(failures));
console.log("FA_TUTOR_RENDERER_RESULTS_JSON " + JSON.stringify({ emphasisResults, mathResult, layoutResults, contrastResults }));
if (failures.length) throw new Error("Tutor renderer acceptance failed: " + failures.length + " finding(s).");
console.log("PASS Tutor renderer, HTML safety, tables, math cleanup, ordered lists, note, contrast and 360px layout.");
