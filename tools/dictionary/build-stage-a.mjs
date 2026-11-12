#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { gzipSync } from "node:zlib";
import { createReadStream } from "node:fs";
import { dictionary } from "../../features/french-data.mjs";

const ROOT=process.cwd();
const LEXIQUE=process.env.LEXIQUE_FILE||path.join(ROOT,"data/raw/Lexique383.tsv");
const WIKTIONARY=process.env.WIKTIONARY_FILE||path.join(ROOT,"data/raw/kaikki.org-dictionary-French.jsonl");
const OUTPUT=process.env.OUTPUT_FILE||path.join(ROOT,"data/dictionary/common-3000.json");
const META=process.env.META_FILE||path.join(ROOT,"data/dictionary/common-3000.meta.json");
const LOCK=path.join(ROOT,"tools/dictionary/sources.lock.json");
const OVERRIDES=path.join(ROOT,"tools/dictionary/overrides.json");
const TARGET=3000,MINIMUM=2800,SOURCE="wiktionary-en via kaikki.org";
const COMMON_POS_RATIO=0.10;
const lock=JSON.parse(fs.readFileSync(LOCK,"utf8"));
const overrides=JSON.parse(fs.readFileSync(OVERRIDES,"utf8"));
const extractDate=lock.sources?.kaikki?.extractDate;
if(!extractDate)throw new Error("sources.lock.json must include sources.kaikki.extractDate");
const normalize=value=>String(value??"").normalize("NFC").toLocaleLowerCase("fr").trim();
const builtin=new Set(Object.keys(dictionary).map(normalize));
const posMap=new Map([["NOM","noun"],["VER","verb"],["ADJ","adjective"],["ADV","adverb"]]);
const wiktionaryPos=new Map([["noun","noun"],["verb","verb"],["adjective","adjective"],["adj","adjective"],["adverb","adverb"],["adv","adverb"]]);
const FORM_ONLY=/(?:inflection of|plural of|feminine of|masculine of|form of|participle of|alternative form of|nonstandard spelling of|obsolete spelling of|misspelling of|superseded spelling of)/i;
const VARIANT_ONLY=/(?:nonstandard spelling of|obsolete spelling of|misspelling of|superseded spelling of)/i;
const REGISTER_LABELS=["archaic","dated","rare","slang","colloquial","familiar","vulgar","offensive","derogatory","informal","literary"];
const FORBIDDEN_RECORD_TAGS=["proper noun","proper-name","abbreviation","initialism","acronym"];
const stats={
 homographRecordsIgnored:0,formOnlySensesDropped:0,entriesSkippedNoUsableSenses:0,variantOnlyEntriesSkipped:0,
 registerTaggedSenses:0,entriesWithRegisterLabels:0,parentGlossesReplacedBySubglosses:0,
 secondaryPosGroups:0,alternatePosRowsGrouped:0,overridesApplied:0,selectedEntries:0
};
function parseTsvLine(line){const fields=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(ch==="\t"&&!quoted){fields.push(value);value="";}else value+=ch;}fields.push(value);return fields;}
function columnIndex(header,...names){const normalized=new Map(header.map((v,i)=>[String(v).replace(/[^a-z0-9]/gi,"").toLowerCase(),i]));for(const name of names){const idx=normalized.get(name.replace(/[^a-z0-9]/gi,"").toLowerCase());if(idx!==undefined)return idx;}throw new Error("Missing Lexique column: "+names.join("/"));}
function num(value){const n=Number(String(value??"0").replace(",","."));return Number.isFinite(n)?n:0;}
function cleanGloss(raw){
 let s=String(raw??"");
 s=s.replace(/<[^>]*>/g," ").replace(/\{\{[^{}]*\}\}/g," ");
 s=s.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,"$2").replace(/\[\[([^\]]+)\]\]/g,"$1");
 s=s.replace(/'''?|''/g,"").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"');
 s=s.replace(/<\/?[^>]+>/g," ").replace(/\s+/g," ").trim();
 if(!s||/[\[\]{}<>]/.test(s))return "";
 return Array.from(s).slice(0,90).join("").trim();
}
function senseTags(sense){return [...new Set([...(sense?.tags||[]),...(sense?.raw_tags||[])].map(x=>String(x).toLocaleLowerCase("fr")))];}
function registerTags(tags){
 const all=tags.map(x=>String(x).toLocaleLowerCase("fr"));
 return REGISTER_LABELS.filter(label=>all.some(tag=>tag===label||tag.includes(label)));
}
function isDescriptiveParent(gloss){return /^(?:referring to|used to|indicating|expressing|denoting|relating to|pertaining to|describing|said of|of or relating to)\b/i.test(gloss.trim());}
function senseGlosses(parent,child,hasChildren){
 const raw=child.glosses||child.raw_glosses||parent.glosses||parent.raw_glosses||[];
 const childGlosses=(Array.isArray(raw)?raw:[raw]).map(cleanGloss).filter(Boolean);
 if(!childGlosses.length)return [];
 let parentGloss="";
 if(hasChildren){
  parentGloss=(parent.glosses||parent.raw_glosses||[]).map(cleanGloss).find(Boolean)||"";
  stats.parentGlossesReplacedBySubglosses++;
 }
 return childGlosses.map(gloss=>{
  if(parentGloss&&!isDescriptiveParent(parentGloss)&&gloss.length<12&&gloss.toLowerCase()!==parentGloss.toLowerCase())return parentGloss+": "+gloss;
  return gloss;
 });
}
function entrySenses(record){
 const senses=[];
 for(const parent of record.senses||[]){
  const children=Array.isArray(parent.subsenses)&&parent.subsenses.length?parent.subsenses:[parent];
  for(const child of children){
   const tags=[...new Set([...(record.tags||[]),...senseTags(parent),...senseTags(child)].map(x=>String(x).toLocaleLowerCase("fr")))];
   const glosses=senseGlosses(parent,child,children.length>1||child!==parent);
   if(!glosses.length)continue;
   const gloss=glosses.find(g=>!FORM_ONLY.test(g));
   if(!gloss){stats.formOnlySensesDropped++;continue;}
   if(FORM_ONLY.test(gloss)){stats.formOnlySensesDropped++;continue;}
   const labels=registerTags(tags);
   const label=labels.join(", ");
   const sense={meaning:gloss,tags,registerTags:labels,label:label||null};
   if(labels.length)stats.registerTaggedSenses++;
   if(!senses.some(x=>x.meaning===sense.meaning&&x.label===sense.label))senses.push(sense);
  }
 }
 return senses.slice(0,3);
}
function usableRecord(record){
 if(normalize(record.lang_code)!=="fr"||normalize(record.lang)!=="french")return false;
 if(!wiktionaryPos.has(normalize(record.pos)))return false;
 const tags=(record.tags||[]).map(x=>String(x).toLowerCase());
 if(tags.some(t=>FORBIDDEN_RECORD_TAGS.some(b=>t.includes(b))))return false;
 return true;
}
async function readLexique(){
 const rl=readline.createInterface({input:createReadStream(LEXIQUE,{encoding:"utf8"}),crlfDelay:Infinity});
 let header=null,indexes=null;
 const grouped=new Map();
 for await(const line of rl){
  if(!line.trim())continue;
  const cells=parseTsvLine(line);
  if(!header){header=cells;indexes={form:columnIndex(header,"ortho"),lemma:columnIndex(header,"lemme"),pos:columnIndex(header,"cgram"),gender:columnIndex(header,"genre"),number:columnIndex(header,"nombre"),films:columnIndex(header,"freqlemfilms2"),books:columnIndex(header,"freqlemlivres")};continue;}
  const lemma=(cells[indexes.lemma]||"").trim(),form=(cells[indexes.form]||"").trim(),pos=(cells[indexes.pos]||"").trim().toUpperCase();
  if(!lemma||!form||!posMap.has(pos)||!/[\p{L}]/u.test(lemma))continue;
  if(lemma.length<2||lemma.length>48||/[\d]/.test(lemma)||!/^[\p{L}'’ -]+$/u.test(lemma)||/^\p{Lu}/u.test(lemma))continue;
  const key=normalize(lemma)+"\u0000"+pos,frequency=num(cells[indexes.films])+num(cells[indexes.books]);
  const item=grouped.get(key)||{lemma,pos,frequency:0,forms:[]};
  item.frequency=Math.max(item.frequency,frequency);
  item.forms.push({form,gender:(cells[indexes.gender]||"").trim(),number:(cells[indexes.number]||"").trim()});
  grouped.set(key,item);
 }
 if(!header||!grouped.size)throw new Error("Lexique TSV parse produced no lemma candidates");
 return [...grouped.values()].filter(x=>x.frequency>0&&!builtin.has(normalize(x.lemma)))
  .sort((a,b)=>b.frequency-a.frequency||normalize(a.lemma).localeCompare(normalize(b.lemma),"fr")||a.pos.localeCompare(b.pos));
}
async function collectWiktionary(candidates){
 const byWord=new Map();
 for(const c of candidates){const key=normalize(c.lemma);if(!byWord.has(key))byWord.set(key,[]);byWord.get(key).push(c);}
 const matched=new Map(),seenPos=new Set();
 const rl=readline.createInterface({input:createReadStream(WIKTIONARY,{encoding:"utf8"}),crlfDelay:Infinity});
 let lineNo=0;
 for await(const line of rl){
  lineNo++;if(!line.trim())continue;
  let record;try{record=JSON.parse(line);}catch(error){throw new Error("Invalid Wiktionary JSONL at line "+lineNo+": "+error.message);}
  const wordKey=normalize(record.word),candidateRows=byWord.get(wordKey);
  if(!candidateRows)continue;
  const pos=wiktionaryPos.get(normalize(record.pos));
  if(!pos)continue;
  const matching=candidateRows.filter(c=>posMap.get(c.pos)===pos);
  if(!matching.length)continue;
  const key=wordKey+"\u0000"+pos;
  if(seenPos.has(key)){stats.homographRecordsIgnored++;continue;}
  seenPos.add(key);
  if(!usableRecord(record))continue;
  const senses=entrySenses(record);
  if(!senses.length){stats.entriesSkippedNoUsableSenses++;if((record.senses||[]).some(s=>(s.glosses||[]).some(g=>VARIANT_ONLY.test(String(g)))))stats.variantOnlyEntriesSkipped++;continue;}
  const genderTags=[...(record.tags||[]),...(record.senses||[]).flatMap(s=>[...(s.tags||[]),...(s.raw_tags||[])])].map(x=>String(x).toLowerCase());
  const masculine=genderTags.some(t=>t.includes("masculine")),feminine=genderTags.some(t=>t.includes("feminine"));
  const forms={feminine:new Set(),plural:new Set()};
  for(const form of record.forms||[]){
   const spelling=String(form.form||"").trim();if(!spelling)continue;
   const tags=(form.tags||[]).map(x=>String(x).toLowerCase());
   if(tags.some(t=>t.includes("feminine")||t==="f"))forms.feminine.add(spelling);
   if(tags.some(t=>t.includes("plural")))forms.plural.add(spelling);
  }
  matched.set(key,{senses,gender:masculine&&feminine?"m/f":masculine?"m":feminine?"f":null,forms});
 }
 return matched;
}
function lexGender(candidate){
 const raw=(candidate.forms.find(x=>normalize(x.form)===normalize(candidate.lemma))?.gender||candidate.forms.map(x=>x.gender).find(x=>/^(m|masc|masculin|f|fem|féminin)/i.test(x)))||"";
 return /^(m\s*\/\s*f|mf|masculin\s*\/\s*féminin)/i.test(raw)?"m/f":/^(f|fem|féminin)/i.test(raw)?"f":/^(m|masc|masculin)/i.test(raw)?"m":null;
}
function senseText(s){return (s.label?"("+s.label+") ":"")+s.meaning;}
function sha256(file){return import("node:crypto").then(({createHash})=>new Promise((resolve,reject)=>{const hash=createHash("sha256");const stream=createReadStream(file);stream.on("data",chunk=>hash.update(chunk));stream.on("error",reject);stream.on("end",()=>resolve(hash.digest("hex")));}));}

const candidates=await readLexique();
console.log("LEXIQUE RANKING: freqlemfilms2 + freqlemlivres (combined lemma frequency)");
console.log("LEXIQUE POS CANDIDATES: "+candidates.length);
const matches=await collectWiktionary(candidates);
const groups=new Map();
for(const candidate of candidates){const key=normalize(candidate.lemma);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(candidate);}
const ordered=[...groups.values()].map(rows=>rows.sort((a,b)=>b.frequency-a.frequency||a.pos.localeCompare(b.pos))).sort((a,b)=>b[0].frequency-a[0].frequency||normalize(a[0].lemma).localeCompare(normalize(b[0].lemma),"fr"));
const output={},posCounts={noun:0,verb:0,adjective:0,adverb:0};
const selected=[];
for(const rows of ordered){
 if(selected.length>=TARGET)break;
 const primary=rows[0],wordKey=normalize(primary.lemma),headword=primary.lemma.normalize("NFC");
 if(Object.hasOwn(output,headword)||builtin.has(normalize(headword)))continue;
 const primaryPos=posMap.get(primary.pos),primaryMatch=matches.get(wordKey+"\u0000"+primaryPos);
 const override=overrides[headword]||overrides[headword.toLocaleLowerCase("fr")];
 if((!primaryMatch?.senses?.length)&&!override)continue;
 let senses=(primaryMatch?.senses||[]).slice(0,3);
 if(override){
  if(override.status!=="curated-draft"||!override.reason||!Array.isArray(override.meanings)||!override.meanings.length)throw new Error("Invalid curated override for "+headword);
  senses=override.meanings.slice(0,3).map(meaning=>({meaning:String(meaning),tags:[],registerTags:[],label:null,curated:true}));
  stats.overridesApplied++;
 }
 const alternate=[];
 for(const candidate of rows.slice(1)){
  if(candidate.frequency<primary.frequency*COMMON_POS_RATIO)continue;
  const pos=posMap.get(candidate.pos),match=matches.get(wordKey+"\u0000"+pos);
  if(!match?.senses?.length)continue;
  alternate.push({pos,meanings:match.senses.map(senseText)});
 }
 if(alternate.length){stats.secondaryPosGroups++;stats.alternatePosRowsGrouped+=alternate.length;}
 const rawGender=primaryMatch?.gender||lexGender(primary);
 const gender=primaryPos==="noun"?rawGender:null;
 const lexFeminine=primary.forms.filter(x=>x.form!==primary.lemma&&/^(f|fem|féminin)/i.test(x.gender)).map(x=>x.form);
 const lexPlural=primary.forms.filter(x=>/^(p|plur)/i.test(x.number)).map(x=>x.form);
 const forms={feminine:[...new Set([...(primaryMatch?[...primaryMatch.forms.feminine]:[]),...lexFeminine])].sort(),plural:[...new Set([...(primaryMatch?[...primaryMatch.forms.plural]:[]),...lexPlural])].sort()};
 const notes=[];
 if(alternate.length)notes.push("Other common parts of speech: "+alternate.map(group=>group.pos+": "+group.meanings.join("; ")).join(" | "));
 if(override)notes.push("Curated draft. "+override.reason);
 const meaning=senses.map(senseText).join("; ");
 const metadata={
  hint:false,source:SOURCE,extractDate,lexiqueFrequency:Number(primary.frequency.toFixed(2)),
  status:override?"curated-draft":"imported-unreviewed",...(override?{reason:override.reason}:{}),
  licence:"CC BY-SA 4.0",gender,senses,posGroups:[{pos:primaryPos,senses},...alternate.map(group=>({pos:group.pos,meanings:group.meanings}))],
  forms
 };
 output[headword]=[meaning,gender&&primaryPos==="noun"?"noun ("+gender+")":primaryPos,"",notes.join(" "),metadata];
 selected.push({headword,pos:primaryPos,frequency:primary.frequency});
 posCounts[primaryPos]++;
 if(senses.some(s=>s.registerTags?.length))stats.entriesWithRegisterLabels++;
}
if(selected.length<MINIMUM)throw new Error("Only "+selected.length+" qualifying entries found; minimum is "+MINIMUM);
stats.selectedEntries=selected.length;
fs.mkdirSync(path.dirname(OUTPUT),{recursive:true});fs.mkdirSync(path.dirname(META),{recursive:true});
const json=JSON.stringify(output,null,2)+"\n";fs.writeFileSync(OUTPUT,json,"utf8");
const rawBytes=Buffer.byteLength(json),gzipBytes=gzipSync(Buffer.from(json),{level:9}).byteLength;
const lexHash=await sha256(LEXIQUE),wikHash=await sha256(WIKTIONARY);
const meta={
 schemaVersion:2,entryCount:selected.length,requestedCount:TARGET,minimumAccepted:MINIMUM,
 sourceFiles:{lexique:{name:path.basename(LEXIQUE),sha256:lexHash,extractDate:lock.sources.lexique.extractDate,url:lock.sources.lexique.url},wiktionary:{name:path.basename(WIKTIONARY),sha256:wikHash,extractDate,dumpDate:lock.sources.kaikki.dumpDate,url:lock.sources.kaikki.url}},
 ranking:"freqlemfilms2 + freqlemlivres; highest-frequency POS per lemma",posDistribution:posCounts,
 qualityRules:{firstKaikkiEntryPerPos:true,formOnlyGlossesRemoved:true,spellingVariantsRemoved:true,registerLabels:REGISTER_LABELS,childGlossPreferred:true,commonAlternatePosRatio:COMMON_POS_RATIO},
 qualityStats:stats,overridesApplied:Object.keys(overrides).filter(word=>Object.hasOwn(output,word)).length,
 sizes:{rawBytes,gzipBytes}
};
fs.writeFileSync(META,JSON.stringify(meta,null,2)+"\n","utf8");
console.log("BUILT ENTRIES: "+selected.length);
console.log("POS: "+JSON.stringify(posCounts));
console.log("QUALITY STATS: "+JSON.stringify(stats));
console.log("OVERRIDES APPLIED: "+meta.overridesApplied);
console.log("SIZE: raw="+rawBytes+" bytes; gzip="+gzipBytes+" bytes");
console.log("SOURCE SHA256: "+JSON.stringify({lexique:lexHash,kaikki:wikHash}));
