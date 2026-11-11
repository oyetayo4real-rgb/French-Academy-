#!/usr/bin/env node
import fs from "node:fs";
import { dictionary as builtin } from "../../features/french-data.mjs";
const file=process.argv[2] || "data/dictionary/common-3000.json";
const raw=fs.readFileSync(file,"utf8");
const data=JSON.parse(raw);
const rawKeys=[...raw.matchAll(/^  "((?:[^"\\]|\\.)+)": \[/gm)].map(m=>JSON.parse('"'+m[1]+'"'));
const errors=[];
const normalize=s=>String(s).normalize("NFC").toLocaleLowerCase("fr");
const keys=Object.keys(data);
const builtins=new Set(Object.keys(builtin).map(normalize));
const seen=new Set();
if(rawKeys.length!==keys.length) errors.push({error:"duplicate top-level JSON headword keys",rawKeyCount:rawKeys.length,parsedKeyCount:keys.length});
const posCounts={};
for (const key of keys) {
  const entry=data[key];
  if (!key || typeof entry!=="object" || !Array.isArray(entry) || entry.length<5) { errors.push({headword:key,error:"entry must be an array with five fields"}); continue; }
  if (seen.has(normalize(key))) errors.push({headword:key,error:"duplicate headword"});
  seen.add(normalize(key));
  if (builtins.has(normalize(key))) errors.push({headword:key,error:"duplicates a built-in headword"});
  if (typeof entry[0]!=="string" || !entry[0].trim()) errors.push({headword:key,error:"empty meaning"});
  if (typeof entry[1]!=="string" || !entry[1].trim()) errors.push({headword:key,error:"empty part of speech"});
  if (entry[2]!=="" ) errors.push({headword:key,error:"Stage A must not contain example sentences"});
  const meta=entry[4];
  if (!meta || meta.hint!==false || meta.status!=="imported-unreviewed" || meta.source!=="wiktionary-en via kaikki.org" || typeof meta.extractDate!=="string" || !Number.isFinite(meta.lexiqueFrequency) || meta.lexiqueFrequency<=0) errors.push({headword:key,error:"required imported metadata missing"});
  if (!meta?.forms || !Array.isArray(meta.forms.feminine) || !Array.isArray(meta.forms.plural)) errors.push({headword:key,error:"feminine/plural forms schema invalid"});
  if (/[\[\]{}<>]|\{\{|\}\}|\[\[|\]\]/.test(entry[0]||"")) errors.push({headword:key,error:"meaning contains markup"});
  if (!Array.isArray(meta?.senses) || meta.senses.length<1 || meta.senses.length>3) errors.push({headword:key,error:"must contain one to three senses"});
  for (const sense of meta?.senses||[]) {
    const gloss=sense.meaning;
    if (typeof gloss!=="string" || !gloss.trim()) errors.push({headword:key,error:"empty gloss"});
    if (Array.from(gloss||"").length>90) errors.push({headword:key,error:"gloss exceeds 90 characters"});
    if (/[\[\]{}<>]|\{\{|\}\}|\[\[|\]\]/.test(gloss||"")) errors.push({headword:key,error:"gloss contains markup"});
  }
  const pos=String(entry[1]).replace(/\s*\(.+\)$/,"");
  posCounts[pos]=(posCounts[pos]||0)+1;
}
if (keys.length<2800 || keys.length>3000) errors.push({count:keys.length,error:"entry count must be between 2,800 and 3,000"});
if (errors.length) {
  for (const error of errors) console.error(JSON.stringify({step:"dictionary-validation",test:"schema",input:error.headword||"",expected:"valid Stage A dictionary",actual:error.error||JSON.stringify(error)}));
  process.exit(1);
}
let seed=0x51A7E;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/0x100000000;};
const sample=[...keys];
for(let i=sample.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[sample[i],sample[j]]=[sample[j],sample[i]];}
console.log("VALIDATION: PASS");
console.log("ENTRY COUNT: "+keys.length);
console.log("POS DISTRIBUTION: "+JSON.stringify(posCounts));
console.log("40 FIXED-SEED SAMPLE ENTRIES:");
for(const key of sample.slice(0,40)){const e=data[key];console.log(JSON.stringify({headword:key,pos:e[1],gender:e[4].gender,meanings:e[4].senses.map(s=>s.meaning)}));}
