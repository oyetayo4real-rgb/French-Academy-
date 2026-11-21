// Reports what French-edition Wiktionary records look like for the dictionary headwords.
// Usage: SAMPLE_FILE=kaikki-fr-top3000-sample.jsonl.gz node tools/dictionary/inspect-frwik-sample.mjs
import fs from "node:fs";
import zlib from "node:zlib";
const file=process.env.SAMPLE_FILE;
const lines=zlib.gunzipSync(fs.readFileSync(file)).toString("utf8").split("\n").filter(Boolean).map(l=>JSON.parse(l));
const keyCounts={},senseKeyCounts={};
let senses=0,withGloss=0,withExamples=0,withSynonyms=0,formOnly=0;
const words=new Set();
const looksFrench=text=>/[\u00e0-\u00ff]|\b(de|du|des|le|la|les|un|une|qui|que|dans|pour|par)\b/i.test(text);
let frenchGlosses=0,glossTotal=0;
for(const rec of lines){
  words.add(rec.word);
  for(const k of Object.keys(rec))keyCounts[k]=(keyCounts[k]||0)+1;
  for(const s of rec.senses||[]){
    senses++;
    for(const k of Object.keys(s))senseKeyCounts[k]=(senseKeyCounts[k]||0)+1;
    const glosses=(s.glosses||[]);
    if(glosses.length)withGloss++;
    for(const g of glosses){glossTotal++;if(looksFrench(g))frenchGlosses++;}
    if((s.examples||[]).length)withExamples++;
    if((s.synonyms||[]).length)withSynonyms++;
    if(s.form_of||s.alt_of)formOnly++;
  }
}
const show=word=>{
  const recs=lines.filter(r=>r.word===word);
  return recs.map(r=>({pos:r.pos,etymology:(r.etymology_text||"").slice(0,160),senses:(r.senses||[]).slice(0,4).map(s=>({glosses:(s.glosses||[]).map(g=>String(g).slice(0,140)),tags:s.tags,example:(s.examples||[])[0]&&String(s.examples[0].text||"").slice(0,120)}))}));
};
console.log(JSON.stringify({records:lines.length,headwords:words.size,senses,withGloss,withExamples,withSynonyms,formOnly,glossTotal,frenchLookingGlosses:frenchGlosses,recordKeys:keyCounts,senseKeys:senseKeyCounts}));
for(const w of ["arbre","cent","merde","chevaux"])console.log("SAMPLE "+w+": "+JSON.stringify(show(w)));
