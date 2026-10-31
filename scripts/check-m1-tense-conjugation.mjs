import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { conjugate } from "../features/french-intelligence-core-v1.mjs";
import { VERB_PARADIGMS } from "../features/french-conjugation-paradigms.mjs";

const reference = JSON.parse(readFileSync(new URL("../tests/reference/tense-reference.json", import.meta.url), "utf8"));
const crosscheck = JSON.parse(readFileSync(new URL("../tests/reference/lexique-tense-crosscheck.json", import.meta.url), "utf8"));
const classification = JSON.parse(readFileSync(new URL("../tests/reference/lexique-tense-classification.json", import.meta.url), "utf8"));
const golden = JSON.parse(readFileSync(new URL("../tests/golden/legacy-v3.json", import.meta.url), "utf8"));
const failures = [];
const json = value => JSON.stringify(value);
const record = (step, input, expected, actual) => {
  if (json(expected) !== json(actual)) failures.push({ step, input, expected, actual });
};
const projection = value => value?.status === "supported" ? { v: value.v, forms: value.forms, type: value.type } : null;

// Preserve the exact existing present-tense API projection for every golden verb.
for (const row of golden.inventory.conjugation.verbs) {
  const actual = conjugate(row.verb);
  const explicitPresent = conjugate(row.verb, { tense: "present" });
  const actualProjection = projection(actual);
  record("present-golden", row.verb, row.output, actualProjection);
  record("present-optional-argument", row.verb, actualProjection, projection(explicitPresent));
}

// Check every reference verb and every requested non-present tense.
const tenseNames = ["imparfait", "futur", "conditionnel", "passé composé"];
for (const [verb, entry] of Object.entries(reference.verbs)) {
  const cross = crosscheck.verbs.find(row => row.verb === verb);
  for (const tense of tenseNames) {
    const expectedCheck = cross?.tenses?.[tense];
    const actual = conjugate(verb, { tense });
    const classified = classification.verbs.find(row => row.verb === verb)?.tenses?.[tense] || [];
    const ownerConfirmedContradictions = classified.filter(pair => pair.status === "contradicted" && pair.ownerConfirmedCorrect === "lexique");
    if (ownerConfirmedContradictions.length) {
      record("owner-confirmed-contradiction", { verb, tense }, "unsupported", actual.status);
    } else if (classified.length === 6 && classified.every(pair => ["matched","absent","verb-not-in-pilot","contradicted"].includes(pair.status))) {
      record("tense-status", { verb, tense }, "supported", actual.status);
      const expectedSource = classified.every(pair => pair.status === "matched") ? "lexique-verified" : "rule-generated";
      record("tense-source", { verb, tense }, expectedSource, actual.source);
      if (tense === "passé composé") {
        const expectedParticiple = entry.auxiliary === "avoir" ? [entry.participle[0]] : entry.participle;
        record("passé-composé-auxiliary", verb, entry.auxiliary, actual.auxiliary);
        record("passé-composé-participle", verb, expectedParticiple, actual.participleForms);
        record("passé-composé-agreement-note", verb, true, typeof actual.agreementNote === "string" && /être|avoir/.test(actual.agreementNote) && /Reflexive verbs/.test(actual.agreementNote));
      } else {
        const arrays = [entry[tense], ...(entry[tense + "_variants"] || [])];
        const expectedForms = arrays[expectedCheck.selectedVariant ?? 0];
        record("tense-forms", { verb, tense }, expectedForms, actual.forms);
      }
    } else {
      record("unsupported-tense-status", { verb, tense, crosscheckStatus: expectedCheck?.status }, "unsupported", actual.status);
      record("unsupported-tense-has-no-forms", { verb, tense }, false, Array.isArray(actual.forms));
    }
  }
}


// Hand-checked first-person-singular oracle across the four requested tenses.
const oracle=[["être","j'étais","je serai","je serais","j'ai été"],["avoir","j'avais","j'aurai","j'aurais","j'ai eu"],["aller","j'allais","j'irai","j'irais","je suis allé(e)"],["faire","je faisais","je ferai","je ferais","j'ai fait"],["venir","je venais","je viendrai","je viendrais","je suis venu(e)"],["tenir","je tenais","je tiendrai","je tiendrais","j'ai tenu"],["obtenir","j'obtenais","j'obtiendrai","j'obtiendrais","j'ai obtenu"],["prendre","je prenais","je prendrai","je prendrais","j'ai pris"],["comprendre","je comprenais","je comprendrai","je comprendrais","j'ai compris"],["pouvoir","je pouvais","je pourrai","je pourrais","j'ai pu"],["vouloir","je voulais","je voudrai","je voudrais","j'ai voulu"],["devoir","je devais","je devrai","je devrais","j'ai dû"],["savoir","je savais","je saurai","je saurais","j'ai su"],["voir","je voyais","je verrai","je verrais","j'ai vu"],["croire","je croyais","je croirai","je croirais","j'ai cru"],["dire","je disais","je dirai","je dirais","j'ai dit"],["écrire","j'écrivais","j'écrirai","j'écrirais","j'ai écrit"],["lire","je lisais","je lirai","je lirais","j'ai lu"],["boire","je buvais","je boirai","je boirais","j'ai bu"],["recevoir","je recevais","je recevrai","je recevrais","j'ai reçu"],["conduire","je conduisais","je conduirai","je conduirais","j'ai conduit"],["mettre","je mettais","je mettrai","je mettrais","j'ai mis"],["connaître","je connaissais","je connaîtrai","je connaîtrais","j'ai connu"],["vivre","je vivais","je vivrai","je vivrais","j'ai vécu"],["suivre","je suivais","je suivrai","je suivrais","j'ai suivi"],["dormir","je dormais","je dormirai","je dormirais","j'ai dormi"],["ouvrir","j'ouvrais","j'ouvrirai","j'ouvrirais","j'ai ouvert"],["finir","je finissais","je finirai","je finirais","j'ai fini"],["courir","je courais","je courrai","je courrais","j'ai couru"],["mourir","je mourais","je mourrai","je mourrais","je suis mort(e)"],["envoyer","j'envoyais","j'enverrai","j'enverrais","j'ai envoyé"],["payer","je payais","je paierai|je payerai","je paierais|je payerais","j'ai payé"],["appeler","j'appelais","j'appellerai","j'appellerais","j'ai appelé"],["jeter","je jetais","je jetterai","je jetterais","j'ai jeté"],["acheter","j'achetais","j'achèterai","j'achèterais","j'ai acheté"],["lever","je levais","je lèverai","je lèverais","j'ai levé"],["changer","je changeais","je changerai","je changerais","j'ai changé"],["manger","je mangeais","je mangerai","je mangerais","j'ai mangé"],["commencer","je commençais","je commencerai","je commencerais","j'ai commencé"],["parler","je parlais","je parlerai","je parlerais","j'ai parlé"],["vendre","je vendais","je vendrai","je vendrais","j'ai vendu"],["descendre","je descendais","je descendrai","je descendrais","je suis descendu(e)"]];
const oracleFailures=[];
const oracleTenses=["imparfait","futur","conditionnel","passé composé"];
for(const [verb,...expected] of oracle){for(let i=0;i<4;i++){
 const actual=conjugate(verb,{tense:oracleTenses[i]}),form=actual?.forms?.[0]||"";
 const candidates=expected[i].split("|").map(x=>x.replace(/^je /u,"").replace(/^j'/u,"").replace(/\(e\)/gu," / e"));
 const ok=actual?.status==="supported"&&candidates.some(x=>form===x||(x.includes(" / e")&&form.startsWith(x.replace(" / e",""))&&form.includes(" / ")));
 if(!ok)oracleFailures.push({verb,tense:oracleTenses[i],expected:expected[i].split("|"),actual:form||null});
}}
const spellingCases=[["manger","present",3,"mangeons"],["commencer","present",3,"commençons"],["appeler","present",3,"appelons"],["acheter","present",3,"achetons"],["payer","present",3,"payons"],["manger","imparfait",3,"mangions"],["commencer","imparfait",3,"commencions"],["appeler","imparfait",3,"appelions"],["acheter","imparfait",3,"achetions"],["payer","imparfait",3,"payions"]];
for(const [verb,tense,index,expected] of spellingCases){const actual=conjugate(verb,tense==="present"?undefined:{tense});if(actual?.forms?.[index]!==expected)oracleFailures.push({verb,tense,expected,actual:actual?.forms?.[index]||null});}
if(oracleFailures.length)failures.push(...oracleFailures.map(x=>({step:"hand-checked-oracle",input:{verb:x.verb,tense:x.tense},expected:x.expected,actual:x.actual})));

const unknownVerb = conjugate("nexiste-pas-dans-la-reference", { tense: "futur" });
record("unknown-verb-remains-unsupported", "nexiste-pas-dans-la-reference", "unsupported", unknownVerb.status);

// Thirty source-driven passé composé cases: all Lexique-verified être-auxiliary verbs
// plus seventeen Lexique-verified avoir-auxiliary verbs from the immutable reference.
const supportedPC = Object.entries(reference.verbs).filter(([verb]) =>
  crosscheck.verbs.find(row => row.verb === verb)?.tenses?.["passé composé"]?.status === "matched"
);
const etreCases = supportedPC.filter(([, entry]) => entry.auxiliary === "être");
const avoirCases = supportedPC.filter(([, entry]) => entry.auxiliary === "avoir");
const pcCases = [...etreCases, ...avoirCases].slice(0, 30);
record("passé-composé-case-count", "reference-derived cases", 30, pcCases.length);
for (const [verb, entry] of pcCases) {
  const actual = conjugate(verb, { tense: "passé composé" });
  const auxForms = VERB_PARADIGMS[entry.auxiliary];
  const participle = entry.auxiliary === "avoir" ? [entry.participle[0]] : entry.participle;
  const expectedForms = entry.auxiliary === "avoir"
    ? auxForms.map(form => form + " " + participle[0])
    : auxForms.map((form, index) => form + " " + (index < 3 ? participle[0] + " / " + participle[1] : participle[2] + " / " + participle[3]));
  record("passé-composé-30-case", verb, {
    status: "supported", auxiliary: entry.auxiliary, participleForms: participle, forms: expectedForms
  }, {
    status: actual.status, auxiliary: actual.auxiliary, participleForms: actual.participleForms, forms: actual.forms
  });
}

const summary = {
  referenceVerbs: Object.keys(reference.verbs).length,
  goldenPresentRows: golden.inventory.conjugation.verbs.length,
  passedComposeCases: pcCases.length,
  lexiqueSourceCommit: crosscheck.source.commit,
  lexiquePilotBlob: crosscheck.source.blobSha,
  support: Object.fromEntries(Object.entries(classification.summary).map(([tense,s])=>[tense,{supportedVerbs:s.supportedVerbs,lexiqueVerifiedVerbs:s.lexiqueVerifiedVerbs,ruleGeneratedVerbs:s.ruleGeneratedVerbs,matchedPersonForms:s.matched,contradictedPersonForms:s.contradicted,absentPersonForms:s.absent,verbNotInPilotPersonForms:s.verbNotInPilot}])),
  oracleVerbs:oracle.length,
  oracleFailures:oracleFailures.length,
  failures: failures.length
};
if (failures.length) {
  console.error(JSON.stringify({ summary, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(summary));
  console.log("PASS M1 tense reference, Lexique coverage, 30 passé composé cases, and unchanged golden present tense.");
}
