import { checkSection12Rules } from "./french-section12-rules.mjs";
import tenseReference from "../tests/reference/tense-reference.json" with { type: "json" };
import lexiqueTenseCrosscheck from "../tests/reference/lexique-tense-crosscheck.json" with { type: "json" };
import lexiqueTenseClassification from "../tests/reference/lexique-tense-classification.json" with { type: "json" };
import { VERB_PARADIGMS, LEGACY_IRREGULARS, PARADIGM_STATUS, REGULAR_ER_CLASS, REGULAR_ER_VERBS, SPELLING_CHANGE_CLASS, PERSONS } from "./french-conjugation-paradigms.mjs";
/* Pure structured French Intelligence core. No DOM, browser globals, network, storage, or HTML rendering. */

const writingPattern = (source, flags = "gi") => new RegExp("(?<![\\p{L}\\p{N}_'’\\-])(?:" + source + ")(?![\\p{L}\\p{N}_'’\\-])", flags.includes("u") ? flags : flags + "u");
const preserveInitialCase = (match, replacement) => match && /^\p{Lu}/u.test(match) ? replacement.charAt(0).toLocaleUpperCase("fr") + replacement.slice(1) : replacement;

import { dictionary, rules, phraseMap, phrasebookPairs, examples, persons } from "./french-data.mjs";

function norm(s){return String(s||"").replace(/[’‘‛ʼ＇]/g,"'").replace(/[＂“”„]/g,'"').toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().replace(/\s+/g," ");}

function phraseMatcher(re){
    let source=re.source;
    if(source.startsWith("\\b"))source="(?<![\\p{L}\\p{N}_])"+source.slice(2);
    if(source.endsWith("\\b"))source=source.slice(0,-2)+"(?![\\p{L}\\p{N}_])";
    const groups={a:"[aàáâäãå]",c:"[cç]",e:"[eéèêë]",i:"[iîï]",o:"[oôö]",u:"[uùûü]",y:"[yÿ]",n:"[nñ]"};
    source=source.replace(/[àáâäãåçéèêëîïôöùûüÿñ]/gi,ch=>{const base=ch.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();return groups[base]||ch;});
    return new RegExp(source,re.flags.includes("u")?re.flags:re.flags+"u");
  }

function result(status, confidence, rule_id, explanation, fields = {}) {
  return { status, confidence, rule_id, explanation, sources: ["built-in French reference set"], ...fields };
}
function findDictionaryEntry(word) {
  const q = String(word || "").trim();
  if (!q) return null;
  const exactInput = q.toLocaleLowerCase("fr");
  // These short homophones must not collapse into dictionary reverse-gloss matches.
  if (exactInput === "a" || exactInput === "à") return null;
  let foundKey = q.toLocaleLowerCase("fr");
  let found = dictionary[foundKey];
  if (!found) {
    const key = Object.keys(dictionary).find(k => norm(k) === norm(q));
    if (key) { foundKey = key; found = dictionary[key]; }
  }
  if (found) { const metadata = found[4] && typeof found[4] === "object" ? found[4] : null; const glossPending = metadata?.gloss === "pending" || metadata?.gloss === "drafted-pending-review"; return { word: foundKey, meaning: found[0], part: found[1], example: found[2], notes: found[3], builtIn: true, ...(glossPending ? { glossStatus: metadata.gloss, gender: metadata.gender, lexiquePos: metadata.lexiquePos, lemmaFrequency: metadata.lemmaFrequency, source: metadata.source, licence: metadata.licence } : {}) }; }
  const rev = Object.keys(dictionary).find(k => dictionary[k]?.[4]?.gloss !== "pending" && dictionary[k]?.[4]?.gloss !== "drafted-pending-review" && norm(dictionary[k][0].split(";")[0]) === norm(q));
  if (rev) return { word: rev, meaning: dictionary[rev][0], part: dictionary[rev][1], example: dictionary[rev][2], notes: dictionary[rev][3], builtIn: true };
  return null;
}
function lookup(word) {
  const entry = findDictionaryEntry(word);
  if (entry) return result("supported", 1, "dictionary." + entry.word, entry.notes, entry);
  if (!entry) {
    const input = String(word ?? "").trim();
    const normalized = normalizeOeLigature(input);
    if (normalized !== input) {
      const normalizedEntry = findDictionaryEntry(normalized);
      if (normalizedEntry) return result("supported", 1, "dictionary." + normalizedEntry.word, normalizedEntry.notes, normalizedEntry);
    }
  }
  return result("unsupported", 0, "dictionary.no-match", "No built-in dictionary entry matched this input.", { query: String(word || "").trim() });
}
function translate(text, direction) {
  const q = String(text || "").trim();
  if (!q) return result("unsupported", 0, "translation.empty", "Enter some text first.", { kind: "empty", input: q });
  if (direction === "en-fr") {
    const exact = Object.keys(phrasebookPairs).find(k => norm(k) === norm(q));
    if (exact) return result("supported", 1, "phrasebook.en-fr.exact", "Known phrasebook match.", { kind: "en-fr-exact", input: q, translation: phrasebookPairs[exact], matchedKey: exact });
    return result("unsupported", 0, "phrasebook.en-fr.no-match", "This phrase is not in the local phrasebook yet. I won't guess a full translation.", { kind: "en-fr-unsupported", input: q });
  }
  const candidates = [];
  for (const [re, english] of phraseMap) {
    const matcher = phraseMatcher(re); matcher.lastIndex = 0; let match;
    while ((match = matcher.exec(q))) { candidates.push({ start: match.index, end: match.index + match[0].length, english }); if (!match[0].length) matcher.lastIndex++; }
  }
  candidates.sort((a,b) => a.start - b.start || (b.end-b.start) - (a.end-a.start));
  const selected = []; let cursor = -1;
  for (const candidate of candidates) { if (candidate.start < cursor) continue; selected.push(candidate); cursor = candidate.end; }
  const covered = new Array(q.length).fill(false);
  for (const match of selected) for (let i=match.start;i<match.end;i++) covered[i]=true;
  let uncoveredToken = false;
  for (let i=0;i<q.length;i++) if (/[\p{L}\p{N}]/u.test(q[i]) && !covered[i]) uncoveredToken = true;
  const words = q.match(/[\p{L}’'-]+/gu) || [];
  const hints = words.map(w => ({ word: w, entry: findDictionaryEntry(w) })).filter(x => x.entry && dictionary[x.entry.word]?.[4]?.hint !== false).map(x => ({ word: x.word, meaning: x.entry.meaning }));
  if (selected.length === 1 && !uncoveredToken) {
    let translation = "", last = 0;
    for (const match of selected) { translation += q.slice(last,match.start) + match.english; last=match.end; }
    translation += q.slice(last);
    return result("supported", 0.9, "phrasebook.fr-en.covered", "Every word in the input is covered by a local phrase pattern.", { kind: "fr-en-covered", input: q, translation, matches: [...new Set(selected.map(x=>x.english))] });
  }
  return result("ambiguous", 0.45, "phrasebook.fr-en.incomplete-coverage", "Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.", { kind: "fr-en-vocabulary", input: q, vocabularyHints: hints, matchedPhrases: [...new Set(selected.map(x=>x.english))] });
}
function conjugatePresent(raw) {
  const v = String(raw || "").toLocaleLowerCase("fr").trim().replace(/^to /, "");
  if (!v) return result("unsupported", 0, "conjugation.empty", "No verb was supplied.", { query: v });
  let forms = VERB_PARADIGMS[v] ? [...VERB_PARADIGMS[v]] : null;
  let status = PARADIGM_STATUS[v] || null;
  let type = LEGACY_IRREGULARS.has(v) ? "Irregular verb · present tense" : ["manger","commencer"].includes(v) ? "Regular -er pattern with spelling adjustment" : ["finir","choisir","réussir","grandir","remplir","obéir","réfléchir"].includes(v) ? "Regular -ir verb · present tense (finir pattern)" : ["vendre","attendre","entendre","répondre","perdre","rendre","descendre"].includes(v) ? "Regular -re verb · present-tense pattern (verify exceptions)" : status === "verified" ? "Explicit verified present-tense paradigm" : "Explicit present-tense paradigm · needs review";
  if (!forms && /er$/u.test(v) && v.length > 3 && REGULAR_ER_VERBS.has(v) && !SPELLING_CHANGE_CLASS.test(v)) {
    const stem = v.slice(0, -2);
    forms = [stem+"e",stem+"es",stem+"e",stem+"ons",stem+"ez",stem+"ent"];
    status = REGULAR_ER_CLASS.status; type = REGULAR_ER_CLASS.type;
  }
  if (!forms) return result("unsupported", 0, "conjugation.no-paradigm", "No explicit present-tense paradigm is available for this verb.", { query: v });
  return result("supported", status === "verified" ? 0.99 : 0.75, "conjugation.present." + status, type, { v, forms, type, paradigmStatus: status, persons: [...PERSONS] });
}

const lexiqueTenseByVerb = new Map(lexiqueTenseCrosscheck.verbs.map(row => [row.verb, row]));
const lexiqueTenseClassificationByVerb = new Map(lexiqueTenseClassification.verbs.map(row => [row.verb, row]));
function conjugate(raw, options = undefined) {
  const tense = options?.tense ?? "present";
  if (tense === "present") return conjugatePresent(raw);
  const v = String(raw || "").toLocaleLowerCase("fr").trim().replace(/^to /, "");
  if (!v) return result("unsupported", 0, "conjugation.empty", "No verb was supplied.", { query: v, tense });
  if (!["imparfait", "futur", "conditionnel", "passé composé"].includes(tense)) return result("unsupported", 0, "conjugation.unsupported-tense", "This tense is not supported.", { query: v, tense });
  const reference = tenseReference.verbs?.[v];
  if (!reference) return result("unsupported", 0, "conjugation.no-reference", "This verb is not in the approved 111-verb tense reference.", { query: v, tense });
  const pairs = lexiqueTenseClassificationByVerb.get(v)?.tenses?.[tense] || [];
  const ownerConfirmed = pairs.filter(pair => pair.status === "contradicted" && pair.ownerConfirmedCorrect === "lexique");
  if (ownerConfirmed.length) return result("unsupported", 0, "conjugation.owner-confirmed-contradiction", "The owner confirmed the Lexique form for this person; this pair is unsupported.", { query:v,v,tense,contradictedPairs:ownerConfirmed });
  const source = pairs.length === PERSONS.length && pairs.every(pair => pair.status === "matched") ? "lexique-verified" : "rule-generated";
  const crosscheck = lexiqueTenseByVerb.get(v)?.tenses?.[tense];
  if (tense === "passé composé") {
    const auxiliary = reference.auxiliary;
    const auxiliaryForms = VERB_PARADIGMS[auxiliary] ? [...VERB_PARADIGMS[auxiliary]] : null;
    if (!auxiliaryForms || auxiliaryForms.length !== PERSONS.length) return result("unsupported", 0, "conjugation.auxiliary-unavailable", "The required auxiliary paradigm is unavailable.", { query:v,v,tense,auxiliary });
    const participleForms = auxiliary === "avoir" ? [reference.participle[0]] : [...reference.participle];
    const forms = auxiliary === "avoir" ? auxiliaryForms.map(form => form + " " + participleForms[0]) : auxiliaryForms.map((form,index) => form + " " + (index < 3 ? participleForms[0] + " / " + participleForms[1] : participleForms[2] + " / " + participleForms[3]));
    const agreementNote = auxiliary === "être" ? "With être, the past participle agrees with the subject in gender and number. Reflexive verbs also use être; agreement depends on the reflexive construction and the position of a direct object." : "With avoir, the past participle normally does not agree with the subject; it agrees with a preceding direct object. Reflexive verbs use être and follow reflexive-agreement rules.";
    const referenceNote = reference.note || "";
    return result("supported", source === "lexique-verified" ? 0.99 : 0.85, "conjugation.passe-compose." + source, source === "lexique-verified" ? "Passé composé · Lexique 3.83 participle cross-checked" : "Passé composé · rule-generated from the approved reference", { v,tense,forms,auxiliary,participleForms,agreementNote,note:[referenceNote,agreementNote].filter(Boolean).join(" "),type:"Passé composé · " + source,source,persons:[...PERSONS] });
  }
  const candidates=[reference[tense],...(reference[tense+"_variants"]||[])];
  const selected=candidates[crosscheck?.selectedVariant??0]||candidates[0];
  if(!Array.isArray(selected)||selected.length!==PERSONS.length)return result("unsupported",0,"conjugation.reference-invalid","The approved reference does not contain six forms for this tense.",{query:v,v,tense});
  const type=tense.charAt(0).toLocaleUpperCase("fr")+tense.slice(1)+" · "+source;
  return result("supported",source==="lexique-verified"?0.99:0.85,"conjugation."+tense+"."+source,type,{v,tense,forms:[...selected],type,source,persons:[...PERSONS]});
}

function answerQuestion(q) {
  const n = norm(q);
  if (!q.trim()) return result("unsupported", 0, "question.empty", "Type a question first.", { kind: "empty", input: q });
  if (/depuis/.test(n) && /pendant/.test(n)) return result("supported", 0.9, "question.depuis-pendant", "Depuis links a past starting point to a situation continuing now; pendant frames a duration.", { kind: "depuis-pendant", title: "Depuis vs pendant" });
  if (/savoir/.test(n) && /connaitre|connaître/.test(n)) return result("supported", 0.9, "question.savoir-connaitre", "Savoir is used for facts or skills; connaître is used for familiarity.", { kind: "savoir-connaitre", title: "Savoir vs connaître" });
  if (/\by\b/.test(n) && /\ben\b/.test(n) && /(pronoun|pronom|difference|différence|use|utilis)/.test(n)) return result("supported", 0.9, "question.y-en", "Y often replaces à plus a thing or place; en often replaces de plus a thing or a quantity.", { kind: "y-en", title: "Y vs en" });
  if (/conditionnel|conditional/.test(n)) return result("supported", 0.9, "question.conditional", "The conditional is used for polite requests and hypotheses.", { kind: "conditional", title: "Conditional for polite requests and hypotheses" });
  const matched = rules.find(r => n.includes(norm(r.title).replace("ne ... pas", "ne")) || (n.includes("negation") && r.title.startsWith("Negation")) || (n.includes("tu") && n.includes("vous") && r.title === "Tu and vous"));
  if (matched) return result("supported", 0.9, "grammar." + matched.title, matched.body, { kind: "grammar-rule", title: matched.title, body: matched.body });
  if (/maison/.test(n) && /(feminin|gender|genre|why|pourquoi)/.test(n)) return result("supported", 0.85, "question.maison-gender", "Grammatical gender is a property of each noun and is not always predictable from meaning. Learn the noun with its article: la maison. The ending -on does not reliably indicate gender.", { kind: "maison-gender" });
  if (/\b(?:âge|age|ans|years old)\b/u.test(n) && (/[?？]/u.test(String(q)) || /^(?:how|what|quel(?:le)?|comment|à quel|at what)\b/u.test(n)) && /(?:\bhow old\b|\bwhat (?:is|was) (?:my|your|his|her) age\b|\b(?:my|your|his|her) age\b|\bquel(?:le)? (?:âge|age)\b|\bà quel(?:le)? (?:âge|age)\b|\bat what age\b|\bsay (?:my|your|his|her) age\b|\bask about age\b|\bexpress age\b|\bhow many years old\b)/u.test(n)) return result("supported", 0.9, "question.age", "French uses avoir, not être, to express age.", { kind: "age" });
  if (/translate|translation|tradui|meaning|signif/.test(n)) {
    const entry = findDictionaryEntry(q.replace(/^(what does|meaning of|translate)\s+/i, "").replace(/[?!.]$/, ""));
    if (entry) return result("supported", 0.9, "question.dictionary." + entry.word, entry.notes, { kind: "dictionary", entry });
  }
  if (/grammar|grammaire|tense|temps verbal/.test(n)) return result("unsupported", 0.2, "question.grammar-guide", "Choose the Grammar Guide to browse ten core rules, or ask about a specific structure.", { kind: "grammar-guide" });
  if (/bonjour|salut|merci|au revoir/.test(n)) {
    const entry = findDictionaryEntry(q.replace(/[?!.]$/, ""));
    if (entry) return result("supported", 0.85, "question.dictionary." + entry.word, entry.notes, { kind: "dictionary", entry });
  }
  return result("unsupported", 0.1, "question.no-confident-match", "I couldn't match this question confidently yet, so I won't invent an answer.", { kind: "fallback", input: q });
}

function checkWriting(q){
  let suggestions=[],corrected=q;
  const subjunctiveVerbs = [
    { name: "être", indicative: ["suis","es","est","sommes","êtes","sont"], subjunctive: ["sois","sois","soit","soyons","soyez","soient"] },
    { name: "avoir", indicative: ["ai","as","a","avons","avez","ont"], subjunctive: ["aie","aies","ait","ayons","ayez","aient"] },
    { name: "aller", indicative: ["vais","vas","va","allons","allez","vont"], subjunctive: ["aille","ailles","aille","allions","alliez","aillent"] },
    { name: "faire", indicative: ["fais","fais","fait","faisons","faites","font"], subjunctive: ["fasse","fasses","fasse","fassions","fassiez","fassent"] },
    { name: "pouvoir", indicative: ["peux","peux","peut","pouvons","pouvez","peuvent"], subjunctive: ["puisse","puisses","puisse","puissions","puissiez","puissent"] },
    { name: "savoir", indicative: ["sais","sais","sait","savons","savez","savent"], subjunctive: ["sache","saches","sache","sachions","sachiez","sachent"] },
    { name: "vouloir", indicative: ["veux","veux","veut","voulons","voulez","veulent"], subjunctive: ["veuille","veuilles","veuille","voulions","vouliez","veuillent"] }
  ];
  const subjunctiveTriggers = "(?:bien\\s+que|bien\\s+qu['’]|quoique|quoiqu['’]|pour\\s+que|pour\\s+qu['’]|afin\\s+que|afin\\s+qu['’]|avant\\s+que|avant\\s+qu['’]|à\\s+moins\\s+que|à\\s+moins\\s+qu['’]|jusqu['’]à\\s+ce\\s+que|jusqu['’]à\\s+ce\\s+qu['’]|sans\\s+que|sans\\s+qu['’])";
  const indicativeForms = [...new Set(subjunctiveVerbs.flatMap(v => v.indicative))].sort((a,b) => b.length-a.length).join("|");
  // Unicode-aware word boundaries; apostrophes remain part of French elisions.
  // Hyphen is intentionally omitted from the blocked boundary class, so it separates words.
  const subjunctivePattern = new RegExp("(?<![\\p{L}\\p{N}_'’])(" + subjunctiveTriggers + ")\\s*(j['’]|je|tu|il|elle|nous|vous|ils|elles)\\s*(" + indicativeForms + ")(?![\\p{L}\\p{N}_'’])", "giu");
  const infinitiveIrregulars = new Set(["être","avoir","faire","aller","venir","tenir","prendre","mettre","dire","lire","écrire","boire","voir","pouvoir","vouloir","devoir","savoir","connaître","comprendre","apprendre","sortir","partir","dormir","ouvrir","offrir","recevoir","courir","vivre","suivre","naître","mourir","croire","rire","sourire"]);
  const isInfinitive = word => /(?:er|ir|re|oir)$/iu.test(word) || infinitiveIrregulars.has(word.toLocaleLowerCase("fr"));
  corrected = corrected.replace(subjunctivePattern, (match, trigger, subject, verb, offset, source) => {
    const subjectLower = subject.toLocaleLowerCase("fr");
    const subjectIndex = ({je:0,"j'":0,"j’":0,tu:1,il:2,elle:2,nous:3,vous:4,ils:5,elles:5})[subjectLower];
    const verbRule = subjunctiveVerbs.find(v => v.indicative.includes(verb.toLocaleLowerCase("fr")));
    if (subjectIndex === undefined || !verbRule) return match;
    const nextWord = source.slice(offset + match.length).match(/^\s+([\p{L}]+)(?![\p{L}])/u)?.[1];
    if (verbRule.name === "aller" && nextWord && isInfinitive(nextWord)) {
      suggestions.push({before: match, why: "After this conjunction the subjunctive is required. Because aller is followed by an infinitive, do not change vais/vas/va/allons/allez/vont to aille. Rewrite using the infinitive verb's own subjunctive (for example, « pour que je comprenne »).", messageOnly: true});
      return match;
    }
    suggestions.push({before: match, why: "After this conjunction, use the subjunctive mood rather than the indicative in this clause."});
    const form = verbRule.subjunctive[subjectIndex];
    const elided = subjectLower === "j'" || subjectLower === "j’";
    const replacement = elided ? subject + form : subjectLower === "je" && /^[aeiouàâäéèêëîïôöùûüÿœ]/iu.test(form) ? "j'" + form : subject + " " + form;
    return match.slice(0, match.length - subject.length - verb.length - (elided ? 0 : 1)) + replacement;
  });
  const checks=[
    [writingPattern("je suis (\\d+) ans(?!\\s+(?:plus|moins)\\b)"),(m,n)=>preserveInitialCase(m,"j'ai "+n+" ans"),"French uses avoir for age."],
    [writingPattern("je suis faim"),(m)=>preserveInitialCase(m,"j'ai faim"),"French says avoir faim (to be hungry)."],
    [writingPattern("je suis soif"),(m)=>preserveInitialCase(m,"j'ai soif"),"French says avoir soif (to be thirsty)."],
    [writingPattern("sa va(?!-et-vient)"),(m)=>preserveInitialCase(m,"ça va"),"The expression is ça va, with ç; preserve the compound va-et-vient."],
    [writingPattern("beacoup"),()=>"beaucoup","Spelling: beaucoup."],
    [writingPattern("bonjor"),()=>"bonjour","Spelling: bonjour."],
    [writingPattern("merçi"),()=>"merci","Merci is written without a cedilla."],
    [writingPattern("je ne comprends pas pas"),null,"Repeated adjacent pas is flagged for review; no automatic correction.",true],
  ];
  for(const [re,rep,why,messageOnly=false] of checks){if(re.test(corrected)){re.lastIndex=0;const before=corrected;if(!messageOnly)corrected=corrected.replace(re,rep);suggestions.push({before,why,messageOnly});}}
  if (!suggestions.length) {
    const ruleFindings = checkSection12Rules(q);
    if (ruleFindings.length) {
      let ruleCorrected = q;
      for (const item of [...ruleFindings].filter(x => x.kind === "correction").sort((a,b) => b.span[0] - a.span[0])) ruleCorrected = ruleCorrected.slice(0,item.span[0]) + item.suggestion + ruleCorrected.slice(item.span[1]);
      const ruleSuggestions = ruleFindings.map(item => ({before:item.found,why:item.explanation,messageOnly:item.kind==="review",ruleId:item.ruleId,suggestion:item.suggestion}));
      const hasRuleCorrection = ruleFindings.some(item => item.kind === "correction");
      return result(hasRuleCorrection ? "supported" : "ambiguous",hasRuleCorrection ? 0.82 : 0.55,hasRuleCorrection ? "writing.correction" : "writing.review-only",ruleFindings.map(item=>item.explanation).join(" "),{kind:"suggestions",input:q,corrected:ruleCorrected,suggestions:ruleSuggestions,hasCorrection:hasRuleCorrection});
    }
    return result("supported", 0.72, "writing.no-listed-issue", "No issue from the small built-in check list was detected. That does not prove the sentence is fully correct; this is not a full grammar checker.", {
      kind: "no-issues", input: q, corrected: q, suggestions: [], hasCorrection: false
    });
  }
  const hasCorrection = suggestions.some(s => !s.messageOnly);
  return result(hasCorrection ? "supported" : "ambiguous", hasCorrection ? 0.82 : 0.55,
    hasCorrection ? "writing.correction" : "writing.review-only",
    suggestions.map(s => s.why).join(" "),
    { kind: "suggestions", input: q, corrected, suggestions, hasCorrection });
}

const oeLigatureTable = new Map([
  ["oeil", "œil"], ["coeur", "cœur"], ["coeurs", "cœurs"], ["soeur", "sœur"], ["soeurs", "sœurs"],
  ["oeuf", "œuf"], ["oeufs", "œufs"], ["noeud", "nœud"], ["noeuds", "nœuds"], ["voeu", "vœu"],
  ["voeux", "vœux"], ["boeuf", "bœuf"], ["boeufs", "bœufs"], ["oeuvre", "œuvre"], ["oeuvres", "œuvres"],
  ["moeurs", "mœurs"], ["manoeuvre", "manœuvre"], ["manoeuvres", "manœuvres"], ["choeur", "chœur"], ["choeurs", "chœurs"]
]);

export function normalizeOeLigature(word) {
  const input = String(word ?? "");
  const canonical = oeLigatureTable.get(input.toLocaleLowerCase("fr"));
  if (!canonical) return input;
  if (input === input.toLocaleUpperCase("fr")) return canonical.toLocaleUpperCase("fr");
  const characters = Array.from(input);
  const first = characters[0];
  const rest = characters.slice(1).join("");
  if (first === first.toLocaleUpperCase("fr") && rest === rest.toLocaleLowerCase("fr")) {
    return canonical.charAt(0).toLocaleUpperCase("fr") + canonical.slice(1);
  }
  return canonical;
}

export { lookup, translate, conjugate, answerQuestion, checkWriting, writingPattern };

export const FrenchIntelligenceCoreV1 = Object.freeze({ lookup, translate, conjugate, answerQuestion, checkWriting });