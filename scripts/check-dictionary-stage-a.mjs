import assert from "node:assert/strict";
import importedData from "../data/dictionary/common-3000.json" with { type: "json" };
import * as core from "../features/french-intelligence-core-v1.mjs";
import * as compat from "../features/french-intelligence-compat.mjs";
import { dictionary } from "../features/french-data.mjs";
import { VERB_PARADIGMS, REGULAR_ER_VERBS } from "../features/french-conjugation-paradigms.mjs";

const importedCount=core.registerImportedEntries(importedData);
assert.equal(importedCount,3000,"all generated entries register in the pure core");
const importedKeys=Object.keys(importedData);
const ten=importedKeys.slice(0,10);
assert.equal(ten.length,10);
for(const word of ten){
  assert.equal(Object.hasOwn(dictionary,word),false,word+" must not be a built-in duplicate");
  const result=core.lookup(word);
  assert.equal(result.status,"supported",word+" core lookup");
  assert.equal(result.imported,true,word+" core marks imported data");
  assert.equal(result.word,word,word+" exact imported key");
  const compatResult=compat.lookup(word);
  assert.ok(compatResult,word+" compatibility lookup");
  assert.equal(compatResult.imported,true,word+" compatibility marks imported data");
  assert.equal(compatResult.word,word,word+" compatibility word");
}
console.log("TEN IMPORTED LOOKUPS: "+JSON.stringify(ten));

const norm=s=>String(s).toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().replace(/\s+/g," ");
const collisions=["ou","a","mur","sur","cote","pate","tache","du","mais","foret"];
const collisionReport=[];
for(const input of collisions){
  const coreResult=core.lookup(input);
  const compatResult=compat.lookup(input);
  const report={input,core:{status:coreResult.status,word:coreResult.word||null,builtIn:coreResult.builtIn??false,imported:coreResult.imported??false,matches:coreResult.matches?.map(x=>x.word)||[]},compat:compatResult?{word:compatResult.word,builtIn:compatResult.builtIn,imported:compatResult.imported,matches:compatResult.matches?.map(x=>x.word)||[]}:null};
  collisionReport.push(report);
  assert.equal(compatResult?.word??null,coreResult.status==="supported"?coreResult.word:null,input+" core/compat primary lookup parity");
  if(coreResult.status==="supported"&&coreResult.imported)assert.equal(compatResult.imported,true,input+" imported collision must be displayed");
}
assert.equal(core.lookup("ou").word,"où","golden v3/v4 ou lookup remains the built-in où entry");
assert.equal(core.lookup("ou").builtIn,true);
assert.equal(core.lookup("a").status,"unsupported","short a homophone guard remains unchanged");
assert.equal(core.lookup("sur").word,"sûr","built-in accent-insensitive result wins");
assert.equal(core.lookup("sur").builtIn,true);
assert.equal(core.lookup("cote").word,"côté","built-in accent-insensitive result wins");
assert.equal(core.lookup("cote").builtIn,true);
assert.equal(core.lookup("mais").word,"mais","built-in exact result wins");
assert.equal(core.lookup("mais").builtIn,true);
console.log("ACCENT-LESS COLLISION RESULTS: "+JSON.stringify(collisionReport));

const importedOnly=ten[0];
const importedGloss=String(importedData[importedOnly][0]).split(";")[0];
const reverse=core.lookup(importedGloss);
assert.ok(!reverse.imported,"English reverse lookup must never resolve imported glosses");
const answer=core.answerQuestion("meaning of "+importedOnly);
assert.equal(JSON.stringify(answer).includes(importedGloss),false,"answerQuestion must remain built-in-only");
const translation=core.translate(importedOnly,"fr-en");
assert.equal((translation.vocabularyHints||[]).some(x=>x.word===importedOnly),false,"imported entries must not become translation hints");
const unchanged=core.checkWriting(importedOnly);
assert.equal(unchanged.corrected,importedOnly,"writing checks must ignore imported entries");
const unknownVerb=importedKeys.find(word=>importedData[word][1]==="verb"&&!Object.hasOwn(VERB_PARADIGMS,word)&&!REGULAR_ER_VERBS.has(word));
if(unknownVerb)assert.equal(core.conjugate(unknownVerb).status,"unsupported","imported verbs must not add conjugation paradigms");
console.log("PASS exclusions: reverse English lookup, translation hints, answerQuestion, writing and conjugation");

const normalizedGroups=new Map();
for(const word of importedKeys){const key=norm(word);if(!normalizedGroups.has(key))normalizedGroups.set(key,[]);normalizedGroups.get(key).push(word);}
const ambiguousGroup=[...normalizedGroups.entries()].find(([key,words])=>words.length>1&&!Object.keys(dictionary).some(k=>norm(k)===key));
if(ambiguousGroup){
  const input=ambiguousGroup[0];
  const result=core.lookup(input);
  assert.equal(result.imported,true,"accent-less imported collision resolves after built-ins");
  assert.ok(result.matches.length>1,"all imported collisions are returned");
  const expected=[...ambiguousGroup[1]].sort((a,b)=>(Number(importedData[b][4].lexiqueFrequency)||0)-(Number(importedData[a][4].lexiqueFrequency)||0)||a.localeCompare(b,"fr"));
  assert.deepEqual(result.matches.map(x=>x.word),expected,"imported collision results sort by Lexique frequency");
  console.log("PASS imported multi-match collision: "+JSON.stringify(result.matches.map(x=>({word:x.word,frequency:x.lexiqueFrequency}))));
}else{
  console.log("NO MULTI-ENTRY IMPORTED ACCENT COLLISION IN THIS DATASET; built-in collision priority cases still passed.");
}

const typos=[
  ["bonjor","bonjour"],
  ["maisonn","maison"],
  ["chossir","choisir"],
  ["beacoup","beaucoup"],
  ["etudiant","étudiant"]
];
for(const [input,expected] of typos){
  const suggestions=compat.dictionarySuggestions(input);
  assert.ok(suggestions.length>0,input+" should produce suggestions");
  assert.ok(suggestions.some(x=>x.word===expected),input+" should suggest "+expected+"; got "+JSON.stringify(suggestions));
  assert.ok(suggestions.length<=5,input+" returns at most five suggestions");
}
console.log("PASS deterministic Did-you-mean suggestions: "+JSON.stringify(typos.map(([input])=>({input,suggestions:compat.dictionarySuggestions(input).map(x=>x.word)}))));
console.log("PASS Stage A imported dictionary core and compatibility acceptance");
