import assert from "node:assert/strict";
import importedData from "../data/dictionary/common-3000.json" with { type: "json" };
import * as core from "../features/french-intelligence-core-v1.mjs";
import * as compat from "../features/french-intelligence-compat.mjs";
import { dictionary } from "../features/french-data.mjs";
import goldenV4 from "../tests/golden/legacy-v4.json" with { type: "json" };
import { VERB_PARADIGMS, REGULAR_ER_VERBS } from "../features/french-conjugation-paradigms.mjs";
import overrides from "../tools/dictionary/overrides.json" with { type: "json" };
import generatedMeta from "../data/dictionary/common-3000.meta.json" with { type: "json" };

const importedCount=core.registerImportedEntries(importedData);
assert.equal(importedCount,Object.keys(importedData).length,"all generated entries register in the pure core");
assert.equal(importedCount,3000,"Stage A rebuild retains 3,000 entries");
const schemaVersion=Number(generatedMeta.schemaVersion||0);
function schema3Assertion(label,run){if(schemaVersion>=3)run();else console.log(`SKIP (schemaVersion ${schemaVersion} < 3): ${label}`);}
const importedKeys=Object.keys(importedData);
const ten=importedKeys.filter(word=>core.lookup(word).imported).slice(0,10);
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
const goldenV4Lookups=new Map((goldenV4.inventory?.dictionary||[]).flatMap(row=>(row.variants||[]).map(variant=>[variant.input,variant.output])));
const collisionReport=[];
for(const input of collisions){
  const coreResult=core.lookup(input);
  const compatResult=compat.lookup(input);
  const goldenExpected=goldenV4Lookups.get(input)||null;
  const report={input,goldenV4:goldenExpected,core:{status:coreResult.status,word:coreResult.word||null,builtIn:coreResult.builtIn??false,imported:coreResult.imported??false,matches:coreResult.matches?.map(x=>x.word)||[]},compat:compatResult?{word:compatResult.word,builtIn:compatResult.builtIn,imported:compatResult.imported,matches:compatResult.matches?.map(x=>x.word)||[]}:null};
  if(goldenExpected){const actual={word:coreResult.word,meaning:coreResult.meaning,part:coreResult.part,example:coreResult.example,notes:coreResult.notes,builtIn:coreResult.builtIn};assert.deepEqual(actual,goldenExpected,input+" remains byte-for-field compatible with golden v4");}
  collisionReport.push(report);
  assert.equal(compatResult?.word??null,coreResult.status==="supported"?coreResult.word:null,input+" core/compat primary lookup parity");
  if(coreResult.status==="supported"&&coreResult.imported)assert.equal(compatResult.imported,true,input+" imported collision must be displayed");
}
assert.equal(core.lookup("ou").word,"où","golden v3/v4 ou lookup remains the built-in où entry");
assert.equal(core.lookup("ou").builtIn,true);
assert.equal(core.lookup("a").status,"unsupported","short a homophone guard remains unchanged");
assert.equal(core.lookup("la").word,"la","exact built-in la must remain distinct from là");
assert.equal(core.lookup("la").builtIn,true);
assert.equal(core.lookup("sur").word,"sûr","built-in accent-insensitive result wins over exact imported-unreviewed sur");
assert.equal(core.lookup("sur").builtIn,true);
assert.equal(core.lookup("fatigue").word,"fatigué","built-in accent-insensitive result wins over exact imported-unreviewed fatigue");
assert.equal(core.lookup("fatigue").builtIn,true);
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
  const expected=[...ambiguousGroup[1]];
  assert.deepEqual(result.matches.map(x=>x.word),expected,"imported collision results preserve builder Lexique-frequency insertion order");
  console.log("PASS imported multi-match collision insertion order: "+JSON.stringify(result.matches.map(x=>x.word)));
}else{
  console.log("NO MULTI-ENTRY IMPORTED ACCENT COLLISION IN THIS DATASET; built-in collision priority cases still passed.");
}

const typos=[
  ["bonjor","bonjour"],
  ["maisonn","maison"],["maisson","maison"],
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
for(const [input,canonical] of [["oeil","œil"],["coeur","cœur"]]){
 const expected=dictionary[canonical];
 assert.ok(expected,canonical+" must exist in the immutable built-in dictionary");
 for(const [layer,name] of [[core,"core"],[compat,"compat"]]){
  const result=layer.lookup(input);
  assert.ok(result,name+" "+input+" resolves");
  assert.equal(result.word,canonical,name+" "+input+" resolves to canonical built-in headword");
  assert.equal(result.builtIn,true,name+" "+input+" must be built-in, not imported");
  assert.equal(result.meaning,expected[0],name+" "+input+" meaning exactly matches built-in entry");
  assert.equal(result.part,expected[1],name+" "+input+" POS exactly matches built-in entry");
  assert.equal(result.example,expected[2],name+" "+input+" example exactly matches built-in entry");
  assert.equal(result.notes,expected[3],name+" "+input+" notes exactly match built-in entry");
  assert.equal(dictionary[result.word],expected,name+" "+input+" resolves to the exact immutable built-in entry object");
 }
}
const ACCEPTED_MEANINGS={
 "retourner":["to return"],"nouveau":["new"],"plein":["full"],"blanc":["white"],
 "fin":["end"],"minute":["minute"],"jeter":["to throw"],"tourner":["to turn"],
 "envoyer":["to send"],"servir":["to serve"],"garder":["to keep"],"quitter":["to leave"],
 "occuper":["to occupy"],"descendre":["to go down"],"payer":["to pay"],"continuer":["to continue"],
 "paraître":["to appear"],"point":["point"],"train":["train"],"lit":["bed"],
 "guerre":["war"],"instant":["moment"],"souvenir":["memory"],"là":["there"],
 "même":["even"],"peu":["little","few"],"mois":["month"],"problème":["problem"],
 "frère":["brother"],"mettre":["put"]
};
assert.equal(Object.keys(ACCEPTED_MEANINGS).length,30,"30-word acceptance list is complete");
const normalizeEnglish=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en");
function posGroupMeanings(group){
 const raw=Array.isArray(group.meanings)&&group.meanings.length?group.meanings:(Array.isArray(group.senses)?group.senses:[]);
 return raw.map(item=>typeof item==="string"?item:item?.meaning||item?.gloss||"").filter(Boolean);
}
for(const [word,accepted] of Object.entries(ACCEPTED_MEANINGS)){
 const result=core.lookup(word);
 assert.equal(result.status,"supported",word+" combined lookup is supported");
 if(word==="mettre"){
  assert.equal(result.builtIn,true,"mettre must resolve through the built-in dictionary");
  assert.equal(result.imported,false,"mettre must not be replaced by an imported duplicate");
  assert.ok(accepted.some(term=>normalizeEnglish(result.meaning).includes(normalizeEnglish(term))),"mettre built-in meaning must satisfy the accept-list");
  continue;
 }
 assert.equal(result.imported,true,word+" must resolve through the imported Stage A dictionary");
 const meta=importedData[word]?.[4]||{};
 const meanings=[importedData[word]?.[0],...(meta.senses||[]).map(s=>s.meaning),...(meta.posGroups||[]).flatMap(posGroupMeanings)].filter(Boolean).join(" ");
 assert.ok(accepted.some(term=>normalizeEnglish(meanings).includes(normalizeEnglish(term))),
  word+" must contain an independently accepted learner meaning; expected "+JSON.stringify(accepted)+", actual "+meanings);
}
const memeMeta=importedData["même"]?.[4]||{};
const memeGroups=memeMeta.posGroups||[];
const memeAdverb=memeGroups.find(group=>group.pos==="adverb");
const memeAdjective=memeGroups.find(group=>group.pos==="adjective");
schema3Assertion("même primary POS is adverb",()=>assert.equal(importedData["même"]?.[1],"adverb","même primary POS is adverb"));
schema3Assertion("même generated primary meaning follows the adverb-specific curated override",()=>assert.equal(importedData["même"]?.[0],"even","même generated primary meaning follows the adverb-specific curated override"));
schema3Assertion("même has a distinct adverb POS group",()=>assert.ok(memeAdverb,"même has a distinct adverb POS group"));
schema3Assertion("même adverb first meaning is even",()=>assert.ok(normalizeEnglish(posGroupMeanings(memeAdverb)[0]).includes("even"),"même adverb first meaning is even"));
schema3Assertion("même has a separate adjective POS group",()=>assert.ok(memeAdjective,"même has a separate adjective POS group"));
schema3Assertion("même adjective group contains same",()=>assert.ok(posGroupMeanings(memeAdjective).some(meaning=>normalizeEnglish(meaning).includes("same")),"même adjective group contains same"));
const memeHtml=compat.renderDictionaryHtml(compat.lookup("même"));
schema3Assertion("même renders distinct POS sections",()=>assert.ok((memeHtml.match(/class="fi-pos-group"/g)||[]).length>=2,"même renders distinct POS sections"));
schema3Assertion("même rendered adverb section is distinct",()=>assert.match(memeHtml,/<h4>adverb<\/h4>/,"même rendered adverb section is distinct"));
schema3Assertion("même rendered adjective section is distinct",()=>assert.match(memeHtml,/<h4>adjective<\/h4>/,"même rendered adjective section is distinct"));
const legacyHtml=compat.renderDictionaryHtml({
 imported:true,word:"legacy",part:"noun",
 posGroups:[{pos:"noun",senses:[{meaning:"legacy noun sense",label:null}]}],
 senses:[{meaning:"entry fallback sense",label:null}]
});
assert.ok(legacyHtml.includes("legacy noun sense"),"legacy POS groups without meanings fall back to their senses");
assert.ok(!legacyHtml.includes("No reviewed meaning"),"legacy renderer never displays the missing-meanings placeholder");
// owner-provided override words (interim eight): the owner has supplied seven overrides;
// eighth word: none yet. Do not infer or invent an eighth.
const OWNER_OVERRIDE_ACCEPTED_FIRST_MEANINGS={
 "même":["even"],
 "cent":["cent, coin"],
 "véritable":["real","genuine","true"],
 "là":["there"],
 "chéri":["darling","dear","beloved"],
 "peu":["a small amount"],
 "cuire":["to cook","to bake","to burn"]
};
const OWNER_OVERRIDE_WORDS=Object.keys(OWNER_OVERRIDE_ACCEPTED_FIRST_MEANINGS);
assert.deepEqual(OWNER_OVERRIDE_WORDS,["même","cent","véritable","là","chéri","peu","cuire"]);
const accentFoldBuiltInKey=word=>Object.keys(dictionary).find(key=>norm(key)===norm(word))||null;
const CURATED_ACCENT_FOLD_COLLISIONS=OWNER_OVERRIDE_WORDS.filter(word=>{
 const key=accentFoldBuiltInKey(word);
 return key!==null&&key!==word;
});
assert.deepEqual(CURATED_ACCENT_FOLD_COLLISIONS,["là"],"only là collides with an accent-fold-only built-in key");
for(const word of OWNER_OVERRIDE_WORDS){
 assert.equal(importedData[word]?.[4]?.status,"curated-draft",word+" is marked curated draft");
 assert.ok(overrides[word]?.reason,word+" review reason remains in build-only override metadata, not learner payload");
 const coreResult=core.lookup(word);
 assert.equal(coreResult.status,"supported",word+" combined core lookup renders");
 if(CURATED_ACCENT_FOLD_COLLISIONS.includes(word)){
  assert.equal(coreResult.imported,true,word+" curated draft wins over accent-fold-only built-in "+accentFoldBuiltInKey(word));
  assert.equal(coreResult.word,word,word+" exact curated headword is selected for its collision");
 }else{
  assert.equal(coreResult.imported,true,word+" exact imported curated entry remains available without a built-in collision");
  assert.equal(coreResult.word,word,word+" exact imported headword is selected");
 }
 const compatResult=compat.lookup(word);
 assert.ok(compatResult?.imported,word+" compatibility lookup returns the imported override");
 assert.equal(compatResult.word,word,word+" compatibility lookup preserves the exact override spelling");
 const groups=Array.isArray(compatResult.posGroups)?compatResult.posGroups:[];
 const primaryPos=String(compatResult.part||"").replace(/\s*\(.+\)$/,"");
 const primaryGroup=groups.find(group=>group.pos===primaryPos)||groups[0];
 schema3Assertion(word+" has a primary POS group",()=>assert.ok(primaryGroup,word+" has a primary POS group"));
 const firstMeaning=posGroupMeanings(primaryGroup)[0]||String(compatResult.meaning||"").split(";")[0];
 const accepted=OWNER_OVERRIDE_ACCEPTED_FIRST_MEANINGS[word];
 schema3Assertion(word+" grouped-POS first meaning",()=>assert.ok(accepted.some(value=>normalizeEnglish(firstMeaning).includes(normalizeEnglish(value))),
  word+" first rendered meaning must match owner-override acceptance list "+JSON.stringify(accepted)+"; got "+firstMeaning));
 const html=compat.renderDictionaryHtml(compatResult);
 assert.ok(html.includes("fi-imported-dictionary"),word+" renders the imported dictionary result");
 assert.doesNotMatch(html,/(?:Owner-provided|contamination|validate|curationNote)/i,word+" rendered output excludes internal curation language");
 if(importedData[word]?.[4]?.status==="curated-draft")assert.match(html,/Curated draft · needs French-speaker review/,word+" uses the generic curated-draft notice");
 assert.doesNotMatch(html,/(?:importedStatus|extractDate|lexiqueFrequency|lemmaFrequency|curatedDraftReason|licence|metadata|\bhint\b|\breason\b)\s*[:=]/i,
  word+" rendered HTML must not expose internal metadata fields");
 if(groups.length>1){
  const renderedPos=[...html.matchAll(/<h4>([^<]+)<\/h4>/g)].map(match=>match[1]);
  schema3Assertion(word+" renders each POS group as a distinct section",()=>assert.deepEqual(renderedPos,groups.map(group=>group.pos),word+" renders each POS group as a distinct section"));
  schema3Assertion(word+" POS section headings are distinct",()=>assert.equal(new Set(renderedPos).size,groups.length,word+" POS section headings are distinct"));
 }
}
assert.equal(OWNER_OVERRIDE_WORDS.length,7,"seven checkpoint curated overrides remain tested");
// POS-scoped acceptance keeps Lexique's primary POS intact while enforcing learner-facing group meanings.
const MUST_HAVE_FIRST_MEANINGS=[["retourner","verb",["to return"]],["nouveau","adjective",["new"]],["plein","adjective",["full"]],["blanc","adjective",["white"]],["fin","noun",["end"]],["minute","noun",["minute"]],["jeter","verb",["to throw"]],["tourner","verb",["to turn"]],["envoyer","verb",["to send"]],["servir","verb",["to serve"]],["garder","verb",["to keep"]],["quitter","verb",["to leave"]],["occuper","verb",["to occupy"]],["descendre","verb",["to go down"]],["payer","verb",["to pay"]],["continuer","verb",["to continue"]],["paraître","verb",["to appear"]],["point","noun",["point"]],["train","noun",["train"]],["lit","noun",["bed"]],["guerre","noun",["war"]],["instant","noun",["moment"]],["souvenir","noun",["memory"]],["là","adverb",["there"]],["même","adverb",["even"]],["peu","adverb",["little","few"]],["mois","noun",["month"]],["problème","noun",["problem"]],["frère","noun",["brother"]],["mettre","verb",["put"],"builtin"]];
assert.equal(MUST_HAVE_FIRST_MEANINGS.length,30,"30-word must-have list is complete");
for(const [word,pos,accepted,source] of MUST_HAVE_FIRST_MEANINGS){
 schema3Assertion(word+" "+pos+" first meaning",()=>{
  if(source==="builtin"){const result=core.lookup(word);assert.equal(result?.builtIn,true,"mettre remains the immutable built-in entry");assert.ok(accepted.some(term=>normalizeEnglish(result.meaning).includes(normalizeEnglish(term))),"mettre built-in meaning is put");return;}
  const groups=importedData[word]?.[4]?.posGroups||[];const group=groups.find(item=>item.pos===pos);assert.ok(group,word+" has required "+pos+" POS group");
  const first=posGroupMeanings(group)[0]||"";assert.ok(accepted.some(term=>normalizeEnglish(first).includes(normalizeEnglish(term))),word+" "+pos+" first meaning must include "+JSON.stringify(accepted)+"; got "+first);
 });
}
const eightWordGroups={"même":{adverb:"even",adjective:"same"},"cent":{numeral:"hundred",noun:"cent, coin"},"chéri":{noun:"darling",adjective:"beloved"},"cuire":{verb:"to cook"},"retourner":{verb:"to return"},"minute":{noun:"minute"},"jeter":{verb:"to throw"},"nouveau":{adjective:"new"}};
for(const [word,expectedGroups] of Object.entries(eightWordGroups))for(const [pos,expected] of Object.entries(expectedGroups))schema3Assertion(word+" "+pos+" grouped override",()=>{const group=(importedData[word]?.[4]?.posGroups||[]).find(item=>item.pos===pos);assert.ok(group,word+" contains "+pos+" POS group");const first=posGroupMeanings(group)[0]||"";assert.ok(normalizeEnglish(first).includes(normalizeEnglish(expected)),word+" "+pos+" first meaning includes "+expected+"; got "+first);});



for (const [input, canonical] of [["sur", "sûr"], ["fatigue", "fatigué"]]) {
 for (const [layer, name] of [[core, "core"], [compat, "compat"]]) {
  const result = layer.lookup(input);
  assert.equal(result?.word, canonical, name + " " + input + " preserves checkpoint built-in accent-fold lookup");
  assert.equal(result?.builtIn, true, name + " " + input + " resolves to the built-in entry");
  if(name==="core")assert.equal(result?.imported,false,name+" "+input+" must not be imported");
  else assert.notEqual(result?.imported,true,name+" "+input+" must not be shadowed by imported-unreviewed data");
 }
}
for (const [layer, name] of [[core, "core"], [compat, "compat"]]) {
 const result = layer.lookup("la");
 assert.equal(result?.word, "la", name + " exact la remains the built-in article, not là");
 assert.equal(result?.builtIn, true, name + " exact la remains built-in");
 if(name==="core")assert.equal(result?.imported,false,name+" exact la is not the curated là override");
 else assert.notEqual(result?.imported,true,name+" exact la is not the curated là override");
}
assert.equal(core.lookup("là")?.word, "là", "exact curated-draft là remains the sole accent-fold exception");
assert.equal(core.lookup("là")?.importedStatus, "curated-draft", "là exception is restricted to curated-draft status");
assert.ok(!importedData["oeil"]&&!importedData["coeur"],"nonstandard spelling entries are not imported");
assert.ok(!JSON.stringify(importedData["chéri"]||{}).includes("Shar (shari'a)"),"chéri homograph contamination is removed");
schema3Assertion("cuire form-only sense removed",()=>assert.ok(!(importedData["cuire"]?.[4]?.senses||[]).some(s=>/inflection of/i.test(s.meaning)),"cuire form-only sense removed"));
assert.ok(!(importedData["là"]?.[4]?.senses||[]).some(s=>/^referring to/i.test(s.meaning)),"là uses child glosses rather than descriptive parent glosses");
assert.ok((importedData["final"]?.[4]?.senses||[]).every(s=>!/^expressing purpose/i.test(s.meaning)),"descriptive parent glosses are dropped in favour of child glosses");
assert.ok((JSON.parse((await import("node:fs")).readFileSync(new URL("../data/dictionary/common-3000.meta.json",import.meta.url),"utf8")).qualityStats?.parentGlossesReplacedBySubglosses||0)>0,"hierarchical parent glosses were resolved to child glosses");
for(const [word,entry] of Object.entries(importedData))assert.ok(!(entry[4].senses||[]).some(s=>/^(?:referring to|used to|indicating|expressing|denoting|relating to|pertaining to|describing|said of)\b/i.test(s.meaning)),word+" has no descriptive-only gloss");
assert.ok((importedData["peu"]?.[4]?.posGroups||[]).some(group=>group.pos==="adverb"),"peu adverb meanings remain in a distinct POS group");
assert.ok((importedData["peu"]?.[4]?.posGroups||[]).some(group=>group.pos==="noun"),"peu noun senses remain in a separate POS group");
assert.ok(!(importedData["peu"]?.[3]||"").includes("noun:"),"peu POS groups are not hidden in notes");

schema3Assertion("plein adjective and adverb POS groups",()=>{const groups=importedData["plein"]?.[4]?.posGroups||[];assert.ok(groups.some(group=>group.pos==="adjective"&&normalizeEnglish(posGroupMeanings(group)[0]).includes("full")),"plein adjective group retains full");assert.ok(groups.some(group=>group.pos==="adverb"),"plein adverb group remains distinct");});
assert.ok((importedData["plein"]?.[4]?.posGroups||[]).some(group=>group.pos==="adverb"),"plein adverb POS group is retained");
assert.ok(overrides["là"]?.reason,"là curated override remains sourced in build-only override metadata");
schema3Assertion("generated forms, grouped POS limits and register filtering",()=>{
 const validForm=value=>/^[\p{L}]+(?:[-'’][\p{L}]+)*$/u.test(String(value||""));
 const low=new Set(["slang","colloquial","familiar","figurative","regional","nautical","dated","rare","obsolete","archaic","vulgar","offensive","derogatory","informal"]);
 for(const [word,entry] of Object.entries(importedData)){
  const pos=String(entry[1]||"").replace(/\s*\(.+\)$/,"");
  const meta=entry[4]||{},forms=meta.forms||{},groups=meta.posGroups||[];
  if(pos!=="noun"&&pos!=="adjective")assert.deepEqual({feminine:forms.feminine||[],plural:forms.plural||[]},{feminine:[],plural:[]},word+" non-noun/adjective forms are empty");
  for(const form of [...(forms.feminine||[]),...(forms.plural||[])])assert.ok(validForm(form),word+" has only a real letter/hyphen/apostrophe form: "+form);
  assert.ok(groups.reduce((sum,group)=>sum+(group.meanings||[]).length,0)<=5,word+" has at most five meanings across POS groups");
  for(const group of groups){
   assert.ok((group.meanings||[]).length<=3,word+" "+group.pos+" has at most three meanings");
   for(const item of group.meanings||[])assert.ok(Array.from(item.meaning||"").length<=70,word+" "+group.pos+" meaning is at most 70 characters");
   const tokenKeys=(group.meanings||[]).map(item=>normalizeEnglish(item.meaning).split(/\s+/).filter(Boolean).sort().join(" "));
   assert.equal(new Set(tokenKeys).size,tokenKeys.length,word+" "+group.pos+" meanings are deduplicated case-insensitively by token set");
   const neutral=(group.meanings||[]).filter(item=>!String(item.register||"neutral").split(/,\s*/).some(label=>low.has(label)));
   if(neutral.length>=2)assert.ok((group.meanings||[]).every(item=>!String(item.register||"neutral").split(/,\\s*/).some(label=>low.has(label))),word+" "+group.pos+" skips low-register senses when two neutral meanings exist");
  }
 }
 const cheri=importedData["chéri"]?.[4]?.forms||{};
 assert.ok(!(cheri.feminine||[]).includes("chéri")&&!(cheri.plural||[]).includes("chéri"),"chéri forms include only tagged inflections, never the bare lemma");
  assert.ok((cheri.feminine||[]).every(form=>["chérie","chéries"].includes(form)),"chéri feminine forms are limited to tagged feminine spellings");
  assert.ok((cheri.plural||[]).every(form=>["chéris","chéries"].includes(form)),"chéri plural forms are limited to tagged plural spellings");
});
schema3Assertion("generated data excludes legacy internal fields",()=>{
 for(const [word,entry] of Object.entries(importedData)){
  const meta=entry[4]||{};
  assert.equal(Object.hasOwn(meta,"reason"),false,word+" has no legacy reason field");
  assert.equal(Object.hasOwn(meta,"lexiqueFrequency"),false,word+" has no raw Lexique frequency field");
  assert.equal(Object.hasOwn(meta,"lemmaFrequency"),false,word+" has no raw lemma frequency field");
  assert.equal(Object.hasOwn(meta,"lexiqueCode"),false,word+" has no raw Lexique code field");
  assert.equal(Object.hasOwn(meta,"cgram"),false,word+" has no raw grammatical code field");
 }
});
schema3Assertion("curated curationNote is stored but never rendered",()=>{
 for(const word of Object.keys(overrides)){
  assert.ok(importedData[word]?.[4]?.curationNote,word+" stores its curationNote");
  const html=compat.renderDictionaryHtml(compat.lookup(word));
  assert.doesNotMatch(html,/(?:Owner-provided|contamination|validate|curationNote)/i,word+" never renders internal curation text");
  assert.match(html,/Curated draft · needs French-speaker review/,word+" renders only the generic curated-draft notice");
 }
});
for(const [word,entry] of Object.entries(importedData))for(const sense of entry[4].senses||[]){
 const tags=(sense.tags||[]).map(x=>String(x).toLowerCase());
 const register=(sense.registerTags||[]).map(x=>String(x).toLowerCase());
 if(tags.some(t=>t.includes("vulgar")||t.includes("offensive")))assert.ok(sense.label,word+" vulgar/offensive sense must be labelled");
 if(register.length){
  assert.ok(sense.label,word+" register-tagged sense must have a visible label");
  const visible=sense.label.toLocaleLowerCase("fr").split(/,\s*/);
  for(const tag of register)assert.ok(visible.includes(tag),word+" visible label must include register tag "+tag);
 }
}
const verbHtml=compat.renderDictionaryHtml(compat.lookup("cuire"));
assert.match(verbHtml,/See the Conjugate tool for forms\./,"verb entries direct learners to the Conjugate tool");
assert.doesNotMatch(verbHtml,/(?:Feminine|Plural):/,"verb entries never render gender/number form lists");
console.log("PASS spelling-variant built-in identity, curated overrides, form-only exclusions, POS grouping and register labels");
console.log("PASS Stage A imported dictionary core and compatibility acceptance");
