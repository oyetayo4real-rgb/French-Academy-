// Validates the Stage B rich layer. Usage: node tools/dictionary/validate-stage-b.mjs [richDir] [stageAFile]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
const dir=process.argv[2]||"data/dictionary/rich",stageA=process.argv[3]||"data/dictionary/common-3000.json";
const errors=[];
const fail=message=>{if(errors.length<40)errors.push(message);};
const meta=JSON.parse(fs.readFileSync(path.join(dir,"meta.json"),"utf8"));
if(meta.schemaVersion!==4||meta.layer!=="rich")fail("meta.json must have schemaVersion 4 and layer rich");
const all={};let gzTotal=0;
for(const file of fs.readdirSync(dir)){
  if(!/^[a-z_]\.json$/.test(file))continue;
  const text=fs.readFileSync(path.join(dir,file),"utf8");
  gzTotal+=zlib.gzipSync(text).length;
  if(Buffer.byteLength(text)>260000)fail("shard too large (>260 KB): "+file);
  let data;try{data=JSON.parse(text);}catch(error){fail("invalid JSON: "+file);continue;}
  Object.assign(all,data);
}
const heads=Object.keys(JSON.parse(fs.readFileSync(stageA,"utf8")));
const missing=heads.filter(word=>!all[word]);
if(missing.length>10)fail("too many Stage A headwords missing from rich layer ("+missing.length+"): "+missing.slice(0,15).join(", "));
if(gzTotal>600000)fail("rich layer gzip total over 600 KB: "+gzTotal);
let senses=0;
for(const [word,entry] of Object.entries(all)){
  if(!Array.isArray(entry.groups)||!entry.groups.length){fail(word+": no groups");continue;}
  if(entry.ipa!==undefined&&!/^\/.+\/$|^\[.+\]$/.test(entry.ipa))fail(word+": bad ipa "+entry.ipa);
  for(const group of entry.groups){
    if(!group.pos||!Array.isArray(group.senses)||!group.senses.length||group.senses.length>8){fail(word+": bad group "+group.pos);continue;}
    for(const sense of group.senses){
      senses++;
      if(!sense.d||sense.d.length>160)fail(word+": bad gloss length");
      if(/\b\d{4},\s/.test(sense.d))fail(word+": citation text inside gloss: "+sense.d.slice(0,60));
      for(const ex of sense.ex||[])if(!ex.fr||!ex.en||ex.fr.length>140)fail(word+": bad example");
      if((sense.syn||[]).length>4||(sense.ant||[]).length>3)fail(word+": too many synonyms/antonyms");
    }
  }
}
const first=(word)=>all[word]?.groups?.[0];
const has=(word,pos,text)=>all[word]?.groups?.some(g=>g.pos===pos&&g.senses.some(s=>s.d.toLowerCase().includes(text)));
if(first("cent")?.pos!=="numeral")fail("cent: numeral must be the first group");
if(!has("arbre","noun","tree"))fail("arbre must include tree");
if(!has("vent","noun","wind"))fail("vent must include wind");
if(!has("voler","verb","steal"))fail("voler must include to steal");
if(!has("nouvelle","noun","news"))fail("nouvelle must include news");
if(!has("meilleur","adjective","better"))fail("meilleur must include an adjective group with better");
if(!all["liberté"]||!all["musée"])fail("liberté and musée must be present");
if(errors.length){console.error(JSON.stringify({errors},null,1));process.exit(1);}
console.log("STAGE B VALIDATION PASSED: "+JSON.stringify({headwords:Object.keys(all).length,senses,missing,gzipBytes:gzTotal}));
