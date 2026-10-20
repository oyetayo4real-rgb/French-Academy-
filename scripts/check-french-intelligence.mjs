import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

const engine = readFileSync("features/french-intelligence.js", "utf8");
const html = readFileSync("index.html", "utf8");
const listeners = {};
const document = {
  addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
  getElementById: () => null
};
const window = {};
vm.runInNewContext(engine, { document, window, console, URL, encodeURIComponent, location: { reload() {} } });
const core = window.FrenchIntelligenceCore;
assert.ok(core, "Core API must be exposed for deterministic unit tests");

const dictionarySource = engine.match(/const dictionary = \{([\s\S]*?)\n  \};/)?.[1] || "";
const dictionaryKeys = [...dictionarySource.matchAll(/^\s*(?:"([^"]+)"|([\p{L}_$][\p{L}\p{N}_$]*))\s*:/gmu)].map(m => m[1] || m[2]);

const checks = [
  ["engine is a strict-mode module", /["']use strict["']/.test(engine)],
  ["home screen links to French Intelligence", /id=["']hfrenchint["']/.test(html)],
  ["engine script is loaded before AI classroom", html.indexOf("features/french-intelligence.js") >= 0 && html.indexOf("features/french-intelligence.js") < html.indexOf("features/ai-classroom.js")],
  ["navigation hook exists", /FAExitFrenchIntelligence/.test(html)],
  ["dictionary finds an exact French word", core.lookup("bonjour")?.meaning.includes("hello")],
  ["dictionary matches accents flexibly", core.lookup("ecole")?.word === "école"],
  ["dictionary supports a multiword expression", core.lookup("parce que")?.meaning === "because"],
  ["dictionary safely rejects unknown words", core.lookup("xqz-not-a-word") === null],
  ["expanded dictionary includes common contextual noun", core.lookup("famille")?.meaning.includes("family")],
  ["dictionary includes multiword idiom", core.lookup("avoir besoin de")?.meaning.includes("need")],
  ["dictionary preserves canonical accent on new entry", core.lookup("reponse")?.word === "réponse"],
  ["irregular être conjugation is correct", JSON.stringify(Array.from(core.conjugate("être").forms)) === JSON.stringify(["suis","es","est","sommes","êtes","sont"])],
  ["irregular écrire conjugation is correct", JSON.stringify(Array.from(core.conjugate("écrire").forms)) === JSON.stringify(["écris","écris","écrit","écrivons","écrivez","écrivent"])],
  ["regular -er conjugation is correct", JSON.stringify(Array.from(core.conjugate("parler").forms)) === JSON.stringify(["parle","parles","parle","parlons","parlez","parlent"])],
  ["regular -ir finir-pattern conjugation is correct", JSON.stringify(Array.from(core.conjugate("finir").forms)) === JSON.stringify(["finis","finis","finit","finissons","finissez","finissent"])],
  ["regular -re conjugation is correct", JSON.stringify(Array.from(core.conjugate("vendre").forms)) === JSON.stringify(["vends","vends","vend","vendons","vendez","vendent"])],
  ["spelling-adjusted manger conjugation is correct", JSON.stringify(Array.from(core.conjugate("manger").forms)) === JSON.stringify(["mange","manges","mange","mangeons","mangez","mangent"])],
  ["unsupported verb returns no fabricated forms", core.conjugate("xyz") === null],
  ["known English-to-French phrase is translated", core.translate("Thank you", "en-fr").includes("merci")],
  ["expanded phrasebook translates an exact request", core.translate("I need help", "en-fr").includes("j'ai besoin d'aide")],
  ["known French phrase has English output", core.translate("J'ai besoin d'aide", "fr-en").includes("I need help")],
  ["unknown English phrase is not guessed", core.translate("A complicated sentence not in phrasebook", "en-fr").includes("not in the local phrasebook")],
  ["question receives a contextual grammar answer", core.answerQuestion("Explain passé composé").includes("auxiliary avoir or être")],
  ["contextual grammar distinguishes depuis and pendant", core.answerQuestion("What is the difference between depuis and pendant?").includes("continuing now")],
  ["contextual grammar distinguishes savoir and connaître", core.answerQuestion("Difference between savoir and connaître").includes("Use <i>savoir</i> for facts or skills")],
  ["contextual grammar explains y and en", core.answerQuestion("How do I use y and en pronouns?").includes("Y vs en")],
  ["age explanation uses avoir", core.answerQuestion("How do I say my age?").includes("J'ai vingt ans")],
  ["writing checker corrects a common age error", core.checkWriting("Je suis 20 ans").includes("j'ai 20 ans")],
  ["writing checker explains when no listed error is found", core.checkWriting("Bonjour, je m'appelle Léa.").includes("does not prove the sentence is fully correct")],
  ["dictionary accepts typographic apostrophes", core.lookup("S’il vous plaît")?.word === "s'il vous plaît"],
  ["dictionary keeps canonical accented display spelling", core.lookup("école")?.word === "école"],
  ["phrasebook preserves negation in supported English-to-French phrase", core.translate("I don't understand", "en-fr").includes("je ne comprends pas")],
  ["French-to-English phrasebook accepts typographic apostrophes", core.translate("J’ai besoin d’aide", "fr-en").includes("I need help")],
  ["French-to-English phrasebook matches feminine accented adjective", core.translate("Je suis fatiguée.", "fr-en").includes("I am tired")],
  ["conjugation returns complete venir paradigm", JSON.stringify(Array.from(core.conjugate("venir").forms)) === JSON.stringify(["viens","viens","vient","venons","venez","viennent"])],
  ["conjugation returns complete prendre paradigm", JSON.stringify(Array.from(core.conjugate("prendre").forms)) === JSON.stringify(["prends","prends","prend","prenons","prenez","prennent"])],
  ["conjugation returns complete pouvoir paradigm", JSON.stringify(Array.from(core.conjugate("pouvoir").forms)) === JSON.stringify(["peux","peux","peut","pouvons","pouvez","peuvent"])],
  ["writing checker does not flag valid context-sensitive parler le français", core.checkWriting("Je parle le français.") .includes("No issue from the small built-in check list was detected")],
  ["writing checker does not guess the sense of une livre", core.checkWriting("J’achète une livre.") .includes("No issue from the small built-in check list was detected")],
  ["writing checker distinguishes detection from full grammar validation", core.checkWriting("Bien que je suis fatigué, je continue.").includes("does not prove the sentence is fully correct")],
  ["dictionary has no duplicate headword keys", new Set(dictionaryKeys).size === dictionaryKeys.length],
  ["dictionary output escapes HTML-like input", !core.lookup("<img src=x onerror=alert(1)>")],
];

let failed = 0;
for (const [name, passed] of checks) {
  const ok = Boolean(passed);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}
assert.equal(failed, 0, `${failed} French Intelligence functional check(s) failed`);
console.log(`Passed ${checks.length} French Intelligence syntax, integration, and functional checks.`);
