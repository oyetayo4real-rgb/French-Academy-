import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as api from "../features/french-intelligence-compat.mjs";
import * as core from "../features/french-intelligence-core-v1.mjs";
import { VERB_PARADIGMS, REGULAR_ER_VERBS, PERSONS } from "../features/french-conjugation-paradigms.mjs";
import { renderGoldenChanges } from "./golden-v2-utils.mjs";
assert.ok(process.argv.includes("--write"),"Pass --write to explicitly create the approved v2 golden.");
const exact=(fn,label)=>{try{return fn();}catch(error){return {__threw:true,name:error&&error.name||"Error",message:String(error&&error.message||error),label};}};
const v1=JSON.parse(readFileSync("tests/golden/legacy-v1.json","utf8"));
const v2=JSON.parse(JSON.stringify(v1));
v2.schemaVersion=2;
v2.goldenSource={path:"features/french-intelligence-compat.mjs",reference:"Section 14a correctness pass",legacyV1:"preserved and not regenerated"};
const inv=v2.inventory;
for(const row of inv.dictionary)for(const item of row.variants)item.output=api.lookup(item.input);
for(const row of inv.phrasebook.englishToFrench)row.output=api.translate(row.key,"en-fr");
for(const row of inv.phrasebook.frenchToEnglish)row.output=api.translate(row.key,"fr-en");
for(const row of inv.phrasebook.regexPatterns){row.frEnOutput=api.translate(row.sample,"fr-en");row.enFrOutput=api.translate(row.englishHint,"en-fr");}
for(const row of inv.phrasebook.unsupported){row.enFrOutput=api.translate(row.input,"en-fr");row.frEnOutput=api.translate(row.input,"fr-en");}
const currentVerbs=new Set(inv.conjugation.verbs.map(x=>x.verb));
const extraVerbs=[...new Set([...Object.keys(VERB_PARADIGMS),...REGULAR_ER_VERBS])].filter(v=>!currentVerbs.has(v)).sort((a,b)=>a.localeCompare(b,"fr"));
for(const verb of extraVerbs)inv.conjugation.verbs.push({verb,output:null,persons:[]});
for(const row of inv.conjugation.verbs){row.output=api.conjugate(row.verb);row.persons=row.output?.forms?PERSONS.map((person,i)=>({person,form:row.output.forms[i]})):[];}
const falsePositives=["hier","soir","livre","super","hiver","noir","mère","xyz"];
const unsupportedSet=new Set(inv.conjugation.unsupported.map(x=>x.verb));
for(const verb of falsePositives)if(!unsupportedSet.has(verb))inv.conjugation.unsupported.push({verb,output:null});
for(const row of inv.conjugation.unsupported)row.output=api.conjugate(row.verb);
for(const row of inv.grammar)row.output=api.answerQuestion(row.title);
for(const row of inv.checkWriting.clean)row.output=api.checkWriting(row.sentence);
for(const row of inv.checkWriting.hardNegative)row.output=api.checkWriting(row.sentence);
for(const row of inv.checkWriting.knownErrors)row.output=api.checkWriting(row.sentence);
for(const row of inv.edgeInputs){const i=row.input,n=row.label;row.outputs={lookup:exact(()=>api.lookup(i),"edge-lookup:"+n),translateEnFr:exact(()=>api.translate(i,"en-fr"),"edge-en-fr:"+n),translateFrEn:exact(()=>api.translate(i,"fr-en"),"edge-fr-en:"+n),conjugate:exact(()=>api.conjugate(i),"edge-conjugate:"+n),answerQuestion:exact(()=>api.answerQuestion(i),"edge-answer:"+n),checkWriting:exact(()=>api.checkWriting(i),"edge-writing:"+n)};}
inv.answerQuestions=["What is the best way to learn the language?","How do I write a message?","Comment utiliser dans et en ?","What does ans mean?","How do I say my age?","How old am I?","Quel âge as-tu ?"].map(input=>({input,output:api.answerQuestion(input)}));
inv.translateCoverage=[{input:"Je suis étudiant",direction:"fr-en"},{input:"Je suis fatiguée.",direction:"fr-en"},{input:"J’ai besoin d’aide",direction:"fr-en"},{input:"Bonjour",direction:"fr-en"},{input:"Bonjour madame",direction:"fr-en"},{input:"Comment utiliser dans et en ?",direction:"fr-en"}].map(row=>({...row,output:api.translate(row.input,row.direction)}));
inv.checkWritingCases=["Je suis 20 ans","Sa va bien","Son va-et-vient constant m'inquiète."].map(input=>({input,output:api.checkWriting(input)}));
v2.inventoryCounts={
 dictionaryHeadwords:inv.dictionary.length,dictionaryLookupVariants:inv.dictionary.reduce((n,r)=>n+r.variants.length,0),
 phrasebookEnglishKeys:inv.phrasebook.englishToFrench.length,phrasebookFrenchValues:inv.phrasebook.frenchToEnglish.length,
 phrasebookRegexPatterns:inv.phrasebook.regexPatterns.length,unsupportedPhraseInputs:inv.phrasebook.unsupported.length,unsupportedPhraseCalls:inv.phrasebook.unsupported.length*2,
 conjugationVerbs:inv.conjugation.verbs.length,unsupportedConjugationVerbs:inv.conjugation.unsupported.length,grammarTopics:inv.grammar.length,
 cleanSentences:inv.checkWriting.clean.length,hardNegativeSentences:inv.checkWriting.hardNegative.length,knownErrorSentences:inv.checkWriting.knownErrors.length,
 edgeInputs:inv.edgeInputs.length,edgeMethodCalls:inv.edgeInputs.length*6,answerQuestionCases:inv.answerQuestions.length,translationCoverageCases:inv.translateCoverage.length,writingRegressionCases:inv.checkWritingCases.length
};
for(const [verb,forms] of Object.entries(VERB_PARADIGMS)){assert.equal(forms.length,6,verb);assert.deepEqual(core.conjugate(verb).forms,forms,verb+" must match the explicit table before golden generation");}
const json=JSON.stringify(v2,null,2)+"\n",sha=createHash("sha256").update(json,"utf8").digest("hex");
writeFileSync("tests/golden/legacy-v2.json",json,"utf8");
writeFileSync("tests/golden/legacy-v2.sha256",sha+"  tests/golden/legacy-v2.json\n","utf8");
writeFileSync("docs/golden-changes.md",renderGoldenChanges(v1,v2),"utf8");
console.log("Generated tests/golden/legacy-v2.json and checksum.");
console.log("V1 inventory preserved: tests/golden/legacy-v1.json was read only.");
console.log("Explicit paradigms in table: "+Object.keys(VERB_PARADIGMS).length+"; non-specified forms carry needs_review.");
