import assert from "node:assert/strict";
import importedData from "../data/dictionary/common-3000.json" with { type: "json" };
import * as core from "../features/french-intelligence-core-v1.mjs";
import * as compat from "../features/french-intelligence-compat.mjs";
import { dictionary } from "../features/french-data.mjs";
import goldenV4 from "../tests/golden/legacy-v4.json" with { type: "json" };
import { VERB_PARADIGMS, REGULAR_ER_VERBS } from "../features/french-conjugation-paradigms.mjs";
import overrides from "../tools/dictionary/overrides.json" with { type: "json" };

const importedCount=core.registerImportedEntries(importedData);
assert.equal(importedCount,Object.keys(importedData).length,"all generated entries register in the pure core");
assert.equal(importedCount,3000,"Stage A rebuild retains 3,000 entries");
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
 "là":["there"],"même":["even"],"peu":["little","few"],"part":["share","part"],
 "poser":["put","place"],"longtemps":["long time","for a long time"],"gros":["big","fat","large"],
 "mois":["month"],"problème":["problem"],"long":["long"],"frère":["brother"],
 "lever":["raise","lift"],"montrer":["show"],"peine":["sorrow","trouble","penalty"],
 "servir":["serve"],"garder":["keep"],"quitter":["leave"],"occuper":["occupy"],
 "tourner":["turn"],"plein":["full"],"guerre":["war"],"mettre":["put","place"],
 "paraître":["appear","seem"],"payer":["pay"],"continuer":["continue"],
 "suite":["continuation","sequel","following"],"blanc":["white"],"point":["point"],
 "train":["train"],"minute":["minute"]
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
assert.equal(importedData["même"]?.[1],"adverb","même primary POS is adverb");
assert.ok(memeAdverb,"même has a distinct adverb POS group");
assert.ok(normalizeEnglish(posGroupMeanings(memeAdverb)[0]).includes("even"),"même adverb first meaning is even");
assert.ok(memeAdjective,"même has a separate adjective POS group");
assert.ok(posGroupMeanings(memeAdjective).some(meaning=>normalizeEnglish(meaning).includes("same")),"même adjective group contains same");
const memeHtml=compat.renderDictionaryHtml(compat.lookup("même"));
assert.ok((memeHtml.match(/class="fi-pos-group"/g)||[]).length>=2,"même renders distinct POS sections");
assert.match(memeHtml,/<h4>adverb<\/h4>/,"même rendered adverb section is distinct");
assert.match(memeHtml,/<h4>adjective<\/h4>/,"même rendered adjective section is distinct");
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
 "cent":["hundred","one hundred"],
 "véritable":["real","genuine","true"],
 "là":["there"],
 "chéri":["darling","dear","beloved"],
 "peu":["little","few","not much"],
 "cuire":["to cook","to bake","to burn"]
};
const OWNER_OVERRIDE_WORDS=Object.keys(OWNER_OVERRIDE_ACCEPTED_FIRST_MEANINGS);
assert.deepEqual(OWNER_OVERRIDE_WORDS,["même","cent","véritable","là","chéri","peu","cuire"]);
for(const word of OWNER_OVERRIDE_WORDS){
 assert.equal(importedData[word]?.[4]?.status,"curated-draft",word+" is marked curated draft");
 assert.ok(overrides[word]?.reason,word+" review reason remains in build-only override metadata, not learner payload");
 const coreResult=core.lookup(word);
 assert.equal(coreResult.status,"supported",word+" combined core lookup renders");
 assert.equal(coreResult.imported,true,word+" resolves to its exact imported override");
 assert.equal(coreResult.word,word,word+" exact override spelling wins over accent-folded built-in entries");
 const compatResult=compat.lookup(word);
 assert.ok(compatResult?.imported,word+" compatibility lookup returns the imported override");
 assert.equal(compatResult.word,word,word+" compatibility lookup preserves the exact override spelling");
 const groups=Array.isArray(compatResult.posGroups)?compatResult.posGroups:[];
 const primaryPos=String(compatResult.part||"").replace(/\s*\(.+\)$/,"");
 const primaryGroup=groups.find(group=>group.pos===primaryPos)||groups[0];
 assert.ok(primaryGroup,word+" has a primary POS group");
 const firstMeaning=posGroupMeanings(primaryGroup)[0]||String(compatResult.meaning||"").split(";")[0];
 const accepted=OWNER_OVERRIDE_ACCEPTED_FIRST_MEANINGS[word];
 assert.ok(accepted.some(value=>normalizeEnglish(firstMeaning).includes(normalizeEnglish(value))),
  word+" first rendered meaning must match owner-override acceptance list "+JSON.stringify(accepted)+"; got "+firstMeaning);
 const html=compat.renderDictionaryHtml(compatResult);
 assert.ok(html.includes("fi-imported-dictionary"),word+" renders the imported dictionary result");
 assert.doesNotMatch(html,/(?:importedStatus|extractDate|lexiqueFrequency|lemmaFrequency|curatedDraftReason|licence|metadata|\bhint\b|\breason\b)\s*[:=]/i,
  word+" rendered HTML must not expose internal metadata fields");
 if(groups.length>1){
  const renderedPos=[...html.matchAll(/<h4>([^<]+)<\/h4>/g)].map(match=>match[1]);
  assert.deepEqual(renderedPos,groups.map(group=>group.pos),word+" renders each POS group as a distinct section");
  assert.equal(new Set(renderedPos).size,groups.length,word+" POS section headings are distinct");
 }
}
assert.equal(OWNER_OVERRIDE_WORDS.length,7,"seven documented owner overrides are tested; eighth remains none yet");


assert.ok(!importedData["oeil"]&&!importedData["coeur"],"nonstandard spelling entries are not imported");
assert.ok(!JSON.stringify(importedData["chéri"]||{}).includes("Shar (shari'a)"),"chéri homograph contamination is removed");
assert.ok(!(importedData["cuire"]?.[4]?.senses||[]).some(s=>/inflection of/i.test(s.meaning)),"cuire form-only sense removed");
assert.ok(!(importedData["là"]?.[4]?.senses||[]).some(s=>/^referring to/i.test(s.meaning)),"là uses child glosses rather than descriptive parent glosses");
assert.ok((importedData["final"]?.[4]?.senses||[]).every(s=>!/^expressing purpose/i.test(s.meaning)),"descriptive parent glosses are dropped in favour of child glosses");
assert.ok((JSON.parse((await import("node:fs")).readFileSync(new URL("../data/dictionary/common-3000.meta.json",import.meta.url),"utf8")).qualityStats?.parentGlossesReplacedBySubglosses||0)>0,"hierarchical parent glosses were resolved to child glosses");
for(const [word,entry] of Object.entries(importedData))assert.ok(!(entry[4].senses||[]).some(s=>/^(?:referring to|used to|indicating|expressing|denoting|relating to|pertaining to|describing|said of)\b/i.test(s.meaning)),word+" has no descriptive-only gloss");
assert.ok(importedData["peu"]?.[1]==="adverb","peu primary learner-facing POS is adverb");
assert.ok((importedData["peu"]?.[4]?.posGroups||[]).some(group=>group.pos==="noun"),"peu noun senses remain in a separate POS group");
assert.ok(!(importedData["peu"]?.[3]||"").includes("noun:"),"peu POS groups are not hidden in notes");
assert.ok((importedData["plein"]?.[4]?.posGroups||[]).some(group=>group.pos==="noun"),"plein noun senses remain grouped in notes");
assert.ok((importedData["plein"]?.[4]?.posGroups||[]).some(group=>group.pos==="preposition"),"plein preposition POS group is retained");
assert.ok((importedData["plein"]?.[4]?.posGroups||[]).some(group=>group.pos==="adverb"),"plein adverb POS group is retained");
assert.ok(overrides["là"]?.reason,"là curated override remains sourced in build-only override metadata");
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
console.log("PASS spelling-variant built-in identity, curated overrides, form-only exclusions, POS grouping and register labels");
console.log("PASS Stage A imported dictionary core and compatibility acceptance");
