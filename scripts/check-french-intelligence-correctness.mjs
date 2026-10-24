import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as core from "../features/french-intelligence-core-v1.mjs";
import * as compat from "../features/french-intelligence-compat.mjs";
import { rules } from "../features/french-data.mjs";
import { VERB_PARADIGMS, LEGACY_IRREGULARS, PARADIGM_STATUS, VERIFIED_PARADIGMS } from "../features/french-conjugation-paradigms.mjs";
const exactForms = [
 ["connaître",["connais","connais","connaît","connaissons","connaissez","connaissent"]],
 ["comprendre",["comprends","comprends","comprend","comprenons","comprenez","comprennent"]],
 ["apprendre",["apprends","apprends","apprend","apprenons","apprenez","apprennent"]],
 ["tenir",["tiens","tiens","tient","tenons","tenez","tiennent"]],
 ["voir",["vois","vois","voit","voyons","voyez","voient"]],
 ["vivre",["vis","vis","vit","vivons","vivez","vivent"]],
 ["suivre",["suis","suis","suit","suivons","suivez","suivent"]],
 ["acheter",["achète","achètes","achète","achetons","achetez","achètent"]],
 ["préférer",["préfère","préfères","préfère","préférons","préférez","préfèrent"]],
 ["appeler",["appelle","appelles","appelle","appelons","appelez","appellent"]],
 ["voyager",["voyage","voyages","voyage","voyageons","voyagez","voyagent"]],
 ["changer",["change","changes","change","changeons","changez","changent"]],
 ["lancer",["lance","lances","lance","lançons","lancez","lancent"]],
 ["envoyer",["envoie","envoies","envoie","envoyons","envoyez","envoient"]],
 ["mourir",["meurs","meurs","meurt","mourons","mourez","meurent"]],
 ["promettre",["promets","promets","promet","promettons","promettez","promettent"]],
 ["conduire",["conduis","conduis","conduit","conduisons","conduisez","conduisent"]]
];
assert.equal(LEGACY_IRREGULARS.size,21,"all 21 original irregular paradigms remain explicit");
for(const [verb,expected] of exactForms){assert.deepEqual(core.conjugate(verb).forms,expected,verb);assert.deepEqual(compat.conjugate(verb).forms,expected,verb+" compat");assert.equal(PARADIGM_STATUS[verb],"verified");assert.ok(VERIFIED_PARADIGMS.has(verb));}
for(const [verb,forms] of Object.entries(VERB_PARADIGMS)){assert.equal(forms.length,6,verb+" must contain six persons");assert.equal(core.conjugate(verb).status,"supported",verb);assert.deepEqual(core.conjugate(verb).forms,forms,verb+" table parity");if(!VERIFIED_PARADIGMS.has(verb))assert.equal(PARADIGM_STATUS[verb],"needs_review",verb+" review status");}
for(const verb of ["hier","soir","livre","super","hiver","noir","mère","xyz","zarbler"]){assert.equal(core.conjugate(verb).status,"unsupported",verb);assert.equal(compat.conjugate(verb),null,verb+" compat must not fabricate forms");}
assert.equal(core.conjugate("parler").status,"supported");
assert.equal(core.conjugate("parler").paradigmStatus,"needs_review");
for(const q of ["What is the best way to learn the language?","How do I write a message?","Comment utiliser dans et en ?","What does ans mean?"]){assert.notEqual(core.answerQuestion(q).rule_id,"question.age",q);assert.doesNotMatch(compat.answerQuestion(q),/Talking about age/,q);}
assert.equal(core.answerQuestion("How do I say my age?").rule_id,"question.age");
assert.equal(core.answerQuestion("Quel âge as-tu ?").rule_id,"question.age");
assert.equal(core.lookup("pays").part,"noun (masculine)");
assert.equal(core.lookup("pays").notes,"Always masculine: un pays. Country names such as la France have their own gender.");
assert.equal(core.lookup("enfant").part,"noun (masculine or feminine; same form)");
assert.equal(core.lookup("enfant").notes,"The form is the same for boys and girls; the article follows the child (un enfant, une enfant); un enfant is the usual generic form.");
assert.ok(rules.some(rule => rule.body.includes("J'ai décidé de ne pas partir.")), "infinitive-negation rule retains the expected example in shared French data");
assert.equal(core.checkWriting("Je suis 20 ans").corrected,"J'ai 20 ans");
assert.equal(core.checkWriting("Sa va bien").corrected,"Ça va bien");
assert.equal(core.checkWriting("Son va-et-vient constant m'inquiète").corrected,"Son va-et-vient constant m'inquiète");
assert.match(compat.checkWriting("Je suis 20 ans"),/J&#39;ai 20 ans|J&#x27;ai 20 ans|J'ai 20 ans/);
assert.match(compat.checkWriting("Sa va bien"),/Ça va bien/);
assert.equal((readFileSync("features/french-intelligence-core-v1.mjs","utf8").match(/const writingPattern/g)||[]).length,1);
assert.equal((readFileSync("features/french-intelligence-compat.mjs","utf8").match(/const writingPattern/g)||[]).length,1);
const partial=core.translate("Je suis étudiant","fr-en");
assert.equal(partial.status,"ambiguous");
assert.equal("translation" in partial,false);
assert.match(compat.translate("Je suis étudiant","fr-en"),/Ambiguous — no full translation offered/);
assert.doesNotMatch(compat.translate("Je suis étudiant","fr-en"),/I am student/);
assert.match(core.translate("J’ai besoin d’aide","fr-en").translation,/I need help/i);
assert.equal(core.translate("Je suis fatiguée.","fr-en").status,"supported");
console.log("PASS Section 14a correctness: explicit paradigms, age intent, dictionary notes, grammar example, capitalization and complete-coverage translation");
