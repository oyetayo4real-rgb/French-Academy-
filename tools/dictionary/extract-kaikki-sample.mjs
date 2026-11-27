// Extracts every Wiktionary record for the dictionary headwords into one small gzip file.
// Usage: KAIKKI_FILE=... HEADWORDS_FILE=... OUT_FILE=... node tools/dictionary/extract-kaikki-sample.mjs
import fs from "node:fs";
import zlib from "node:zlib";
import readline from "node:readline";
const kaikki=process.env.KAIKKI_FILE,headFile=process.env.HEADWORDS_FILE,out=process.env.OUT_FILE;
const heads=new Set(Object.keys(JSON.parse(fs.readFileSync(headFile,"utf8"))).map(w=>w.normalize("NFC")));
const DROP=["translations","descendants","categories","hyphenation","hypernyms","hyponyms","holonyms","meronyms","coordinate_terms"];
const slim=rec=>{
  for(const key of DROP)delete rec[key];
  if(Array.isArray(rec.sounds))rec.sounds=rec.sounds.filter(s=>s&&s.ipa).map(s=>({ipa:s.ipa,tags:s.tags}));
  if(Array.isArray(rec.senses))for(const sense of rec.senses)for(const key of DROP)delete sense[key];
  return rec;
};
const gz=zlib.createGzip({level:9});
gz.pipe(fs.createWriteStream(out));
const seen=new Set();let lines=0,kept=0;
const rl=readline.createInterface({input:fs.createReadStream(kaikki,{encoding:"utf8"}),crlfDelay:Infinity});
for await(const line of rl){
  if(!line)continue;
  lines++;
  let rec;try{rec=JSON.parse(line);}catch{continue;}
  if(rec.lang_code!=="fr")continue;
  const word=String(rec.word||"").normalize("NFC");
  if(!heads.has(word))continue;
  seen.add(word);kept++;
  gz.write(JSON.stringify(slim(rec))+"\n");
}
gz.end();
console.log(JSON.stringify({sourceLines:lines,recordsKept:kept,headwordsRequested:heads.size,headwordsFound:seen.size,missing:[...heads].filter(w=>!seen.has(w)).slice(0,30)}));
