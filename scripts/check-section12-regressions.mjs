import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import * as core from "../features/french-intelligence-core-v1.mjs";
import { dictionary } from "../features/french-data.mjs";
import { M1_VOCABULARY_HEADWORDS } from "../features/french-vocabulary-m1.mjs";
import { checkSection12Rules } from "../features/french-section12-rules.mjs";
import { lookup as compatLookup, translate as compatTranslate } from "../features/french-intelligence-compat.mjs";

const failures = [];
function reportFailure(message, input, expected, actual) {
  const ruleId = message.match(/NR-\\d{2}/)?.[0] || "Section12";
  failures.push({ ruleId, input, expected, actual });
}
function equal(message, input, expected, actual) {
  if (!isDeepStrictEqual(actual, expected)) reportFailure(message, input, expected, actual);
}
function truthy(message, input, expected, actual) {
  if (!actual) reportFailure(message, input, expected, actual);
}

const addedHeadwords = ["tout","beau","leurs","leur","vieux","œil","gens","cœur","je","ne","me","ce","que","le","la","falloir","si","quoi","dont","est-ce que","autre","quel","un","heure","an","air","accord","histoire","idée","argent","année","affaire","bras","noir"];
for (const headword of addedHeadwords) {
  const result = core.lookup(headword);
  equal("core lookup must support added headword: " + headword, headword, "supported", result.status);
  equal("core lookup must preserve canonical headword: " + headword, headword, headword, result.word);
  const compatibilityResult = compatLookup(headword);
  truthy("compatibility lookup must support added headword: " + headword, headword, "non-null lookup result", compatibilityResult);
}

for (const input of ["a", "à"]) {
  const result = core.lookup(input);
  equal("core lookup must not reverse-match " + input + " to un/a; an; one", input, "unsupported", result.status);
  equal(input + " must not resolve to un", input, false, result.word === "un");
  equal(input + " must not resolve to the un gloss", input, false, result.meaning === "a; an; one");
  equal("compatibility lookup must not reverse-match " + input + " to un/a; an; one", input, null, compatLookup(input));
}
equal("où must retain its accented canonical headword", "où", "où", core.lookup("où").word);
equal("compatibility lookup must retain où, not alias it to ou", "où", "où", compatLookup("où")?.word);
equal("TR-046 only includes the adjective sense in core lookup", "noir", "adjective", core.lookup("noir").part);
equal("TR-046 only includes the adjective sense in compatibility lookup", "noir", "adjective", compatLookup("noir")?.part);

const oeLigatureCases = [
  ["oeil", "œil"], ["coeur", "cœur"], ["coeurs", "cœurs"], ["soeur", "sœur"], ["soeurs", "sœurs"],
  ["oeuf", "œuf"], ["oeufs", "œufs"], ["noeud", "nœud"], ["noeuds", "nœuds"], ["voeu", "vœu"],
  ["voeux", "vœux"], ["boeuf", "bœuf"], ["boeufs", "bœufs"], ["oeuvre", "œuvre"], ["oeuvres", "œuvres"],
  ["moeurs", "mœurs"], ["manoeuvre", "manœuvre"], ["manoeuvres", "manœuvres"], ["choeur", "chœur"], ["choeurs", "chœurs"]
];
for (const [input, canonical] of oeLigatureCases) {
  equal("normalizeOeLigature maps " + input, input, canonical, core.normalizeOeLigature(input));
}
for (const input of ["coexister", "coexiste", "moelle", "oeillet", "bonjour"]) {
  equal("normalizeOeLigature leaves unlisted word unchanged", input, input, core.normalizeOeLigature(input));
}
equal("normalizeOeLigature preserves uppercase", "OEIL", "ŒIL", core.normalizeOeLigature("OEIL"));
equal("normalizeOeLigature preserves titlecase", "Oeil", "Œil", core.normalizeOeLigature("Oeil"));

for (const [plain, ligature] of [["oeil", "œil"], ["coeur", "cœur"]]) {
  const plainResult = core.lookup(plain);
  const ligatureResult = core.lookup(ligature);
  equal("lookup supports " + plain, plain, "supported", plainResult.status);
  equal("lookup supports " + ligature, ligature, "supported", ligatureResult.status);
  equal("lookup result is identical for " + plain + "/" + ligature, plain, plainResult, ligatureResult);
}
const newLigatureHeadwords = ["sœur", "œuf", "nœud", "vœu", "bœuf", "œuvre", "mœurs", "manœuvre", "chœur"];
const unligaturedLigatureHeadwords = ["soeur", "oeuf", "noeud", "voeu", "boeuf", "oeuvre", "moeurs", "manoeuvre", "choeur"];
for (let index = 0; index < newLigatureHeadwords.length; index++) {
  const canonical = newLigatureHeadwords[index];
  const unligatured = unligaturedLigatureHeadwords[index];
  const canonicalResult = core.lookup(canonical);
  const unligaturedResult = core.lookup(unligatured);
  equal("ligature lookup must be supported: " + canonical, canonical, "supported", canonicalResult.status);
  equal("unligatured lookup must be supported: " + unligatured, unligatured, "supported", unligaturedResult.status);
  equal("unligatured lookup must resolve to canonical headword: " + unligatured, unligatured, canonical, unligaturedResult.word);
  equal("unligatured lookup must return the same dictionary entry: " + unligatured, unligatured, canonicalResult, unligaturedResult);
  equal("new ligature dictionary entry must suppress translator hints: " + canonical, canonical, false, dictionary[canonical]?.[4]?.hint);
}


const proposedRules = JSON.parse(readFileSync("tests/source-verified-ledger.json", "utf8")).proposed_rules;
const proposedRuleCases = [
  { id: "NR-01", kind: "positive", input: "oeil", expected: "œil", actual: core.normalizeOeLigature("oeil") },
  { id: "NR-01", kind: "positive", input: "coeur", expected: "cœur", actual: core.normalizeOeLigature("coeur") },
  { id: "NR-01", kind: "negative", input: "coexistence", expected: "coexistence", actual: core.normalizeOeLigature("coexistence") },
  { id: "NR-02", kind: "positive", input: "les vieilles gens", expected: "les vieilles gens", actual: core.checkWriting("les vieilles gens").corrected },
  { id: "NR-02", kind: "positive", input: "des gens intéressants", expected: "des gens intéressants", actual: core.checkWriting("des gens intéressants").corrected },
  { id: "NR-02", kind: "negative", input: "des gens intéressantes", expected: "flagged for review", actual: core.checkWriting("des gens intéressantes").rule_id === "writing.review-only" ? "flagged for review" : false },
  { id: "NR-03", kind: "positive", input: "Je leur ai dit.", expected: "Je leur ai dit.", actual: core.checkWriting("Je leur ai dit.").corrected },
  { id: "NR-03", kind: "positive", input: "leurs enfants", expected: "leurs enfants", actual: core.checkWriting("leurs enfants").corrected },
  { id: "NR-03", kind: "negative", input: "Je leurs ai dit.", expected: "Je leur ai dit.", actual: core.checkWriting("Je leurs ai dit.").corrected },
  { id: "NR-04", kind: "positive", input: "Elle est toute contente.", expected: "Elle est toute contente.", actual: core.checkWriting("Elle est toute contente.").corrected },
  { id: "NR-04", kind: "positive", input: "Elle est tout heureuse.", expected: "Elle est tout heureuse.", actual: core.checkWriting("Elle est tout heureuse.").corrected },
  { id: "NR-04", kind: "negative", input: "Elle est tout contente.", expected: "Elle est toute contente.", actual: core.checkWriting("Elle est tout contente.").corrected },
  { id: "NR-05", kind: "positive", input: "un bel arbre", expected: "un bel arbre", actual: core.checkWriting("un bel arbre").corrected },
  { id: "NR-05", kind: "positive", input: "un vieil homme", expected: "un vieil homme", actual: core.checkWriting("un vieil homme").corrected },
  { id: "NR-05", kind: "negative", input: "un beau arbre", expected: "un bel arbre", actual: core.checkWriting("un beau arbre").corrected },
  { id: "NR-05", kind: "negative", input: "un vieux homme", expected: "un vieil homme", actual: core.checkWriting("un vieux homme").corrected },
  { id: "NR-06", kind: "positive", input: "s'il pleut", expected: "s'il pleut", actual: core.checkWriting("s'il pleut").corrected },
  { id: "NR-06", kind: "positive", input: "si elle vient", expected: "si elle vient", actual: core.checkWriting("si elle vient").corrected },
  { id: "NR-06", kind: "negative", input: "s'elle vient", expected: "si elle vient", actual: core.checkWriting("s'elle vient").corrected }
];
for (const test of proposedRuleCases) {
  truthy("proposed-rule regression must reference a ledger rule: " + test.id, test.id, true, proposedRules.some(rule => rule.id === test.id));
  equal("proposed-rule " + test.id + " " + test.kind + ": " + test.input, test.input, test.expected, test.actual);
}

// The frozen, read-only golden is the output oracle. Do not execute the legacy implementation here.
const golden = JSON.parse(readFileSync("tests/golden/legacy-v3.json", "utf8"));
const goldenOu = golden.inventory.dictionary
  .flatMap(row => row.variants)
  .find(item => item.input === "ou")?.output;
truthy("frozen golden must contain lookup:ou", "ou", "golden lookup:ou output", goldenOu);
equal("compatibility lookup(ou) must deep-equal frozen golden lookup:ou output", "ou", goldenOu, compatLookup("ou"));

const parityInputs = [
  "je suis heureux/heureuse",
  "j'apprends le français",
  "je suis désolé(e)",
  "je suis fatigué(e)",
  "je t'aime",
  "je parle français",
  "je voudrais de l'eau",
  "à plus tard",
  "quelle heure est-il",
  "où est la gare",
  "Je suis étudiant",
  "Bonjour\\nJe vais bien.",
  "je\\tne\\tcomprends\\tpas",
  "a&b<c>d",
  "À bientôt, cœur et sœur."
];
const normalizeHeadword = value => String(value || "").toLocaleLowerCase("fr")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const hintFalseHeadwords = new Set(
  Object.entries(dictionary)
    .filter(([, entry]) => entry?.[4]?.hint === false)
    .map(([headword]) => normalizeHeadword(headword))
);
for (const headword of newLigatureHeadwords) {
  truthy("new ligature headword must be included in hint:false set: " + headword, headword, true, hintFalseHeadwords.has(normalizeHeadword(headword)));
}
for (const input of parityInputs) {
  const actual = core.translate(input, "fr-en");
  const hints = Array.isArray(actual.vocabularyHints) ? actual.vocabularyHints : [];
  for (const hint of hints) {
    const headword = normalizeHeadword(hint.word);
    equal("Section 12 hint:false headword must not appear in vocabularyHints", input, false, hintFalseHeadwords.has(headword));
  }
}


const ruleCases = [
 ["NR-02","des gens intéressantes","review","des gens intéressantes"],["NR-02","des gens gentilles","review","des gens gentilles"],["NR-02","des gens intéressants",null,"des gens intéressants"],["NR-02","les vieilles gens",null,"les vieilles gens"],["NR-02","toutes les vieilles gens",null,"toutes les vieilles gens"],["NR-02","jeunes gens",null,"jeunes gens"],["NR-02","les vieux gens","review","les vieux gens"],
 ["NR-03","Je leurs ai dit.","correction","Je leur ai dit."],["NR-03","leurs enfants",null,"leurs enfants"],["NR-03","leurs clés",null,"leurs clés"],["NR-03","Ils ont leurs clés",null,"Ils ont leurs clés"],["NR-03","Je leur ai dit",null,"Je leur ai dit"],
 ["NR-04","Elle est tout contente.","correction","Elle est toute contente."],["NR-04","Elles sont tout petites.","correction","Elles sont toutes petites."],["NR-04","Elle est toute contente.",null,"Elle est toute contente."],["NR-04","Ils sont tout contents.",null,"Ils sont tout contents."],["NR-04","Elle est tout heureuse.",null,"Elle est tout heureuse."],["NR-04","Il est tout petit.",null,"Il est tout petit."],["NR-04","tout seul",null,"tout seul"],
 ["NR-05","un beau arbre","correction","un bel arbre"],["NR-05","un vieux homme","correction","un vieil homme"],["NR-05","un nouveau appartement","correction","un nouvel appartement"],["NR-05","un beau et grand arbre",null,"un beau et grand arbre"],["NR-05","un bel arbre",null,"un bel arbre"],["NR-05","un beau garçon",null,"un beau garçon"],["NR-05","un beau haricot",null,"un beau haricot"],
 ["NR-06","s'elle vient","correction","si elle vient"],["NR-06","s’elles arrivent","correction","si elles arrivent"],["NR-06","s'il pleut",null,"s'il pleut"],["NR-06","s'ils viennent",null,"s'ils viennent"],["NR-06","si elle vient",null,"si elle vient"]
];
for(const [ruleId,input,expectedKind,expectedText] of ruleCases){
 const findings=checkSection12Rules(input);
 equal(ruleId+" closed-list kind: "+input,input,expectedKind,findings[0]?.kind||null);
 let corrected=input;
 for(const item of [...findings].filter(x=>x.kind==="correction").sort((a,b)=>b.span[0]-a.span[0])) corrected=corrected.slice(0,item.span[0])+item.suggestion+corrected.slice(item.span[1]);
 equal(ruleId+" closed-list output: "+input,input,expectedText,corrected);
 for(const item of findings) equal(ruleId+" finding span: "+input,input,item.found,input.slice(item.span[0],item.span[1]));
}
// Read-only safety net: frozen writing inputs whose legacy oracle reported no issue.
const cleanLegacyText=value=>typeof value==="string"&&value.includes("No issue from the small built-in check list was detected");
const safetyInputs=new Map();
for(const path of ["tests/golden/legacy-v1.json","tests/golden/legacy-v2.json","tests/golden/legacy-v3.json"]){
 const frozen=JSON.parse(readFileSync(path,"utf8")),groups=frozen.inventory?.checkWriting||{};
 for(const groupName of ["clean","hardNegative","knownErrors"]) for(const row of groups[groupName]||[]) if(cleanLegacyText(row.output)) safetyInputs.set(path+":"+groupName+":"+row.index,row.sentence);
 for(const row of frozen.inventory?.checkWritingCases||[]){const input=row.input??row.text??row.sentence,output=row.output??row.expected;if(typeof input==="string"&&(cleanLegacyText(output)||output?.rule_id==="writing.no-listed-issue"||output?.kind==="no-issues"))safetyInputs.set(path+":checkWritingCases:"+input,input);}
}
safetyInputs.set("characterization:clean sentence disclaimer","Bonjour, je m'appelle Léa.");
const safetyFailures=[];
for(const [source,input] of safetyInputs){const findings=checkSection12Rules(input);if(findings.length)safetyFailures.push({ruleId:findings[0].ruleId,input,expected:"zero findings (legacy reported no issue)",actual:findings,source});}
if(safetyFailures.length) failures.push(...safetyFailures.map(({source,...item})=>item));
console.log(JSON.stringify({safetyNetInputs:safetyInputs.size,safetyNetFailures:safetyFailures.length}));


const m1Normalize = value => String(value).toLocaleLowerCase("fr").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
for (const headword of M1_VOCABULARY_HEADWORDS) {
  const canonical = core.lookup(headword);
  equal("M1 vocabulary lookup supported: " + headword, headword, "supported", canonical.status);
  equal("M1 vocabulary canonical headword: " + headword, headword, headword, canonical.word);
  equal("M1 vocabulary gloss remains pending: " + headword, headword, "pending", canonical.glossStatus);
  equal("M1 vocabulary explicit English-pending meaning: " + headword, headword, "English meaning not yet added", canonical.meaning);
  equal("M1 vocabulary translator hint suppression: " + headword, headword, false, dictionary[headword]?.[4]?.hint);
  const accentStripped = m1Normalize(headword);
  const normalized = core.lookup(accentStripped);
  equal("M1 accent-stripped lookup supported: " + headword, accentStripped, "supported", normalized.status);
  equal("M1 accent-stripped lookup canonical headword: " + headword, accentStripped, headword, normalized.word);
  equal("M1 accent-stripped lookup same French info: " + headword, accentStripped, canonical, normalized);
}
const m1NormalizedHeadwords = new Set(M1_VOCABULARY_HEADWORDS.map(m1Normalize));
for (const row of golden.inventory.dictionary || []) {
  for (const variant of row.variants || []) {
    equal("M1 vocabulary must not shadow a frozen golden lookup input: " + variant.input, variant.input, false, m1NormalizedHeadwords.has(m1Normalize(variant.input)));
  }
}

console.log("PASS Section 12 lookup regressions: 34 headwords, homophone collisions, TR-046 adjective-only.");
console.log("PASS Section 12 hint suppression: 15 parity inputs contain no hint:false headword.");
console.log("PASS Section 12 translator hints: no hint:false dictionary entry leaks into vocabularyHints.");

if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}else{console.log("PASS Section 12 regression suite: all assertions passed.");}
