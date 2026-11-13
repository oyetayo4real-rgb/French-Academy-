#!/usr/bin/env node
import fs from "node:fs";
import { gzipSync } from "node:zlib";
import { dictionary as builtin } from "../../features/french-data.mjs";
const file=process.argv[2]||"data/dictionary/common-3000.json";
const raw=fs.readFileSync(file,"utf8"),data=JSON.parse(raw);
const metaFile="data/dictionary/common-3000.meta.json";
const meta=fs.existsSync(metaFile)?JSON.parse(fs.readFileSync(metaFile,"utf8")):{};
const rawKeys=[...raw.matchAll(/^  "((?:[^"\\]|\\.)+)": \[/gm)].map(m=>JSON.parse('"'+m[1]+'"'));
const errors=[];
const normalize=s=>String(s).normalize("NFC").toLocaleLowerCase("fr").replace(/oe/g,"œ");
const keys=Object.keys(data),builtins=new Set(Object.keys(builtin).map(normalize)),seen=new Set();
const FORM_ONLY=/\b(?:inflection of|plural of|feminine of|masculine of|form of|participle of|alternative form of|nonstandard spelling of|obsolete spelling of|misspelling of|superseded spelling of)\b/i;
if(rawKeys.length!==keys.length)errors.push({error:"duplicate top-level JSON headword keys",rawKeyCount:rawKeys.length,parsedKeyCount:keys.length});
const posCounts={},meaningCounts={"1":0,"2":0,"3":0,other:0};let genderCount=0,registerTagged=0,curatedDraftCount=0;
for(const key of keys){
 const entry=data[key];
 if(!key||key.length<2||!Array.isArray(entry)||entry.length<5){errors.push({headword:key,error:"entry must be an array with five fields"});continue;}
 const normalized=normalize(key);
 if(seen.has(normalized))errors.push({headword:key,error:"duplicate headword"});
 seen.add(normalized);
 if(builtins.has(normalized))errors.push({headword:key,error:"duplicates a built-in headword"});
 if(typeof entry[0]!=="string"||!entry[0].trim())errors.push({headword:key,error:"empty meaning"});
 if(/[\[\]{}<>]|\{\{|\}\}|\[\[|\]\]/.test(entry[0]||""))errors.push({headword:key,error:"meaning contains markup"});
 if(typeof entry[1]!=="string"||!entry[1].trim())errors.push({headword:key,error:"empty part of speech"});
 if(entry[2]!=="")errors.push({headword:key,error:"Stage A must not contain example sentences"});
 const m=entry[4],status=m?.status;
 if(!m||m.hint!==false||!["imported-unreviewed","curated-draft"].includes(status)||m.source!=="wiktionary-en via kaikki.org"||typeof m.extractDate!=="string"||!Number.isFinite(m.lexiqueFrequency)||m.lexiqueFrequency<=0)errors.push({headword:key,error:"required imported metadata missing"});
 if(status==="curated-draft"){curatedDraftCount++;if(typeof m.reason!=="string"||!m.reason.trim())errors.push({headword:key,error:"curated draft missing reason"});}
 if(m?.gender)genderCount++;
 if(!m?.forms||!Array.isArray(m.forms.feminine)||!Array.isArray(m.forms.plural))errors.push({headword:key,error:"feminine/plural forms schema invalid"});
 if(!Array.isArray(m?.senses)||m.senses.length<1||m.senses.length>3)errors.push({headword:key,error:"must contain one to three senses"});
 const senseCount=m?.senses?.length||0;meaningCounts[String(senseCount)]??(meaningCounts.other++);if(senseCount>=1&&senseCount<=3)meaningCounts[String(senseCount)]++;
 for(const sense of m?.senses||[]){
  const gloss=sense.meaning;
  if(typeof gloss!=="string"||!gloss.trim())errors.push({headword:key,error:"empty gloss"});
  if(FORM_ONLY.test(gloss||""))errors.push({headword:key,error:"form-only gloss: "+gloss});
  if(Array.from(gloss||"").length>90)errors.push({headword:key,error:"gloss exceeds 90 characters"});
  if(/[\[\]{}<>]|\{\{|\}\}|\[\[|\]\]/.test(gloss||""))errors.push({headword:key,error:"gloss contains markup"});
  const tags=(sense.tags||[]).map(x=>String(x).toLowerCase());
  const register=(sense.registerTags||[]).map(x=>String(x).toLowerCase());
  if(register.length)registerTagged++;
  const hasLabel=typeof sense.label==="string"&&sense.label.trim().length>0;
  const vulgar=tags.some(t=>t.includes("vulgar")||t.includes("offensive"))||register.some(t=>t==="vulgar"||t==="offensive");
  if((vulgar||register.length)&&!hasLabel)errors.push({headword:key,error:"register-tagged sense missing visible label"});
  if(sense.label&&!register.length)errors.push({headword:key,error:"register label has no registerTags"});
  if(register.some(label=>!String(sense.label||"").toLowerCase().includes(label)))errors.push({headword:key,error:"register label omits a register tag"});
 }
 const pos=String(entry[1]).replace(/\s*\(.+\)$/,"");
 posCounts[pos]=(posCounts[pos]||0)+1;
}
if(keys.length<2800||keys.length>3000)errors.push({count:keys.length,error:"entry count must be between 2,800 and 3,000"});
if(errors.length){for(const error of errors)console.error(JSON.stringify({step:"dictionary-validation",test:"schema",input:error.headword||"",expected:"valid Stage A dictionary",actual:error.error||JSON.stringify(error)}));process.exit(1);}
let seed=2166136261;for(const char of "FA-Dictionary-Stage-A-2026-11-12"){seed^=char.charCodeAt(0);seed=Math.imul(seed,16777619);}
function random(){seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
const sample=[...keys].sort((a,b)=>a.localeCompare(b,"fr"));for(let i=sample.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[sample[i],sample[j]]=[sample[j],sample[i]];}
const sizes={rawBytes:Buffer.byteLength(raw),gzipBytes:gzipSync(Buffer.from(raw),{level:9}).byteLength};
console.log("VALIDATION: PASS");
console.log("ENTRY COUNT: "+keys.length);
console.log("POS DISTRIBUTION: "+JSON.stringify(posCounts));
console.log("GENDER COUNT: "+genderCount);
console.log("MEANINGS PER ENTRY: "+JSON.stringify(meaningCounts));
console.log("REGISTER-TAGGED SENSES: "+registerTagged);
console.log("CURATED DRAFT ENTRIES: "+curatedDraftCount);
console.log("QUALITY STATS: "+JSON.stringify(meta.qualityStats||{}));
console.log("OVERRIDES APPLIED: "+(meta.overridesApplied??curatedDraftCount));
console.log("SIZE: "+JSON.stringify(sizes));
console.log("40 FIXED-SEED SAMPLE ENTRIES (FA-Dictionary-Stage-A-2026-11-12):");
for(const key of sample.slice(0,40)){const e=data[key],m=e[4];console.log(JSON.stringify({headword:key,pos:e[1],gender:m.gender||null,label:m.senses.map(s=>s.label).filter(Boolean).join("; ")||null,meanings:m.senses.map(s=>({label:s.label||null,meaning:s.meaning})),frequency:m.lexiqueFrequency}));}
const ranked=keys.map(headword=>({headword,entry:data[headword],meta:data[headword][4]})).sort((a,b)=>(Number(b.meta.lexiqueFrequency)||0)-(Number(a.meta.lexiqueFrequency)||0)||a.headword.localeCompare(b.headword,"fr"));
function printProbe(label,rows){console.log(label+":");for(const row of rows){const m=row.meta;console.log(JSON.stringify({headword:row.headword,pos:row.entry[1],gender:m.gender||null,label:m.senses.map(s=>s.label).filter(Boolean).join("; ")||null,meanings:m.senses.map(s=>({label:s.label||null,meaning:s.meaning})),frequency:m.lexiqueFrequency}));}}
printProbe("TOP 10 MOST FREQUENT OVERALL",ranked.slice(0,10));
for(const pos of ["verb","adjective","adverb"])printProbe("TOP 10 "+pos.toUpperCase(),ranked.filter(row=>String(row.entry[1]).replace(/\\s*\\(.+\\)$/,"")===pos).slice(0,10));
