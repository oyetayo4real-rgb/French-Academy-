// Stage B: builds the "rich" dictionary layer (pronunciation, many senses, examples, synonyms,
// etymology, phrases) for the same headwords as Stage A. Additive: Stage A files are never changed.
// Usage: KAIKKI_FILE=<jsonl or jsonl.gz> STAGE_A_FILE=data/dictionary/common-3000.json OUT_DIR=data/dictionary/rich node tools/dictionary/build-stage-b.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";

const KAIKKI=process.env.KAIKKI_FILE;
const STAGE_A=process.env.STAGE_A_FILE||"data/dictionary/common-3000.json";
const OUT_DIR=process.env.OUT_DIR||"data/dictionary/rich";
const DISPLAY_ORDER=JSON.parse(fs.readFileSync("tools/dictionary/display-order.json","utf8"));

const POS={noun:"noun",verb:"verb",adj:"adjective",adv:"adverb",num:"numeral",intj:"interjection",prep:"preposition",conj:"conjunction",pron:"pronoun",det:"determiner",name:"proper noun",phrase:"phrase",particle:"particle",contraction:"contraction"};
const MAX_SENSES=8,MAX_GLOSS=160,MAX_EXAMPLE=140,MAX_EXAMPLES=2,MAX_SYN=4,MAX_ANT=3,MAX_PHRASES=10,MAX_RELATED=8,MAX_COLLOCATIONS=6,MAX_ETYMOLOGY=300;
// senses with these tags are skipped entirely
const SKIP_TAGS=new Set(["form-of","alt-of","obsolete","archaic","historical","historic","dialectal","misspelling","nonstandard"]);
// register labels that the app can show or hide
const REGISTER=["vulgar","offensive","derogatory","slang","colloquial","informal","literary","formal","dated","rare","euphemistic","figuratively","Louisiana","Quebec","Canada","Belgium","Switzerland"];
const REGIONAL=new Set(["Louisiana","Quebec","Canada","Belgium","Switzerland"]);
const REGION_IPA=new Set(["Louisiana","Quebec","Canada","Belgium","Switzerland","Africa"]);

const heads=new Set(Object.keys(JSON.parse(fs.readFileSync(STAGE_A,"utf8"))).map(word=>word.normalize("NFC")));
const records=new Map();
let input=fs.createReadStream(KAIKKI);
if(KAIKKI.endsWith(".gz"))input=input.pipe(zlib.createGunzip());
const rl=readline.createInterface({input:input.setEncoding?input.setEncoding("utf8"):input,crlfDelay:Infinity});
for await(const line of rl){
  if(!line)continue;
  let rec;try{rec=JSON.parse(line);}catch{continue;}
  if(rec.lang_code!=="fr")continue;
  const word=String(rec.word||"").normalize("NFC");
  if(!heads.has(word))continue;
  if(!records.has(word))records.set(word,[]);
  records.get(word).push(rec);
}

const clean=text=>String(text||"").replace(/\s+/g," ").trim();
const wordList=(list,limit)=>{
  const out=[];
  for(const item of list||[]){
    const word=clean(typeof item==="string"?item:item?.word);
    if(word&&!out.includes(word))out.push(word);
    if(out.length>=limit)break;
  }
  return out;
};
// Wiktionary sometimes glues a quotation or a long description onto a gloss: shorten it.
const tidyGloss=text=>{
  let out=clean(text).split(/\.\s+(?=\d{3,4},)/)[0].replace(/\.$/,"");
  if(out.length>MAX_GLOSS)out=out.replace(/\s*\([^()]*\)$/,"");
  if(out.length>MAX_GLOSS)out=out.split(/\.\s+(?=[A-Z])/)[0].replace(/\.$/,"");
  return out;
};
const glossOf=sense=>{
  const glosses=(sense.glosses||[]).map(clean).filter(Boolean);
  if(!glosses.length)return null;
  return {text:tidyGloss(glosses[glosses.length-1]),context:glosses.length>1?glosses[0]:null};
};
// last resort for entries whose only senses are inflected forms: keep a readable gloss
const formGloss=sense=>{
  const glosses=(sense.glosses||[]).map(clean).filter(Boolean);
  if(!glosses.length)return null;
  if(glosses.length>1)return tidyGloss(glosses[0].replace(/:$/,"")+" ("+glosses[glosses.length-1]+")");
  const text=glosses[0],quoted=text.match(/["\u201c]([^"\u201d]+)["\u201d]/)?.[1];
  const label=text.replace(/\s*\(.*$/,"").replace(/;.*$/,"").trim();
  const after=text.includes(";")?text.slice(text.indexOf(";")+1).trim():"";
  const meaning=quoted||after;
  return tidyGloss(meaning?meaning+" ("+label+")":label);
};
const examplesOf=sense=>{
  const out=[];
  for(const ex of sense.examples||[]){
    const fr=clean(ex.text),en=clean(ex.english||ex.translation);
    if(!fr||!en||fr.length>MAX_EXAMPLE||/\u017f/.test(fr)||/^\d/.test(fr))continue;
    out.push({fr,en});
    if(out.length>=MAX_EXAMPLES)break;
  }
  return out;
};
const collocationsOf=rec=>{
  const out=[];
  for(const sense of rec.senses||[])for(const ex of sense.examples||[]){
    const fr=clean(ex.text);
    if((ex.tags||[]).includes("collocation")&&fr&&fr.length<=60&&!out.includes(fr))out.push(fr);
  }
  return out.slice(0,MAX_COLLOCATIONS);
};
const etymologyOf=rec=>{
  let text=clean(rec.etymology_text);
  if(!text)return null;
  text=text.replace(/\s*See also\b.*$/i,"").trim();
  if(text.length>MAX_ETYMOLOGY){
    const cut=text.slice(0,MAX_ETYMOLOGY),stop=Math.max(cut.lastIndexOf(". "),cut.lastIndexOf("; "));
    text=stop>80?cut.slice(0,stop+1):cut.replace(/\s+\S*$/,"")+"\u2026";
  }
  return text||null;
};
const formsOf=rec=>{
  const forms={};
  for(const f of rec.forms||[]){
    const tags=f.tags||[],form=clean(f.form);
    if(!form||/^(no-table-tags|fr-conj|fr-inflect)/.test(form)||tags.includes("table-tags")||tags.includes("inflection-template")||f.source==="conjugation")continue;
    const key=tags.includes("plural")?"plural":tags.includes("feminine")?"feminine":tags.includes("masculine")?"masculine":null;
    if(!key||tags.includes("obsolete"))continue;
    forms[key]=forms[key]||[];
    if(!forms[key].includes(form))forms[key].push(form);
  }
  return forms;
};
const genderOf=rec=>{
  const tags=new Set((rec.senses||[]).flatMap(sense=>sense.tags||[]));
  if(tags.has("masculine")&&tags.has("feminine"))return "m/f";
  return tags.has("masculine")?"m":tags.has("feminine")?"f":null;
};

const entries={};
let senseTotal=0,exampleTotal=0,synTotal=0;
const stats={headwords:0,posGroups:0,withIpa:0,withEtymology:0,withExamples:0,withPhrases:0,vulgarSenses:0,droppedFormOnly:0};
for(const [word,recs] of records){
  const groups=[];
  const ipaPick=recs.flatMap(rec=>rec.sounds||[]).find(sound=>sound.ipa&&!(sound.tags||[]).some(tag=>REGION_IPA.has(tag)));
  const derived=[],related=[];
  for(const rec of recs){
    const pos=POS[rec.pos];
    if(!pos)continue;
    const senses=[],formOnly=[];
    for(const sense of rec.senses||[]){
      const tags=sense.tags||[];
      if(sense.form_of||sense.alt_of||tags.some(tag=>SKIP_TAGS.has(tag))){
        stats.droppedFormOnly++;
        if((sense.form_of||sense.alt_of||tags.includes("form-of"))&&formOnly.length<2){const text=formGloss(sense);if(text&&text.length<=MAX_GLOSS&&!formOnly.includes(text))formOnly.push(text);}
        continue;
      }
      const gloss=glossOf(sense);
      if(!gloss||gloss.text.length>MAX_GLOSS)continue;
      if(senses.some(existing=>existing.d.toLowerCase()===gloss.text.toLowerCase()))continue;
      const entry={d:gloss.text};
      if(gloss.context&&gloss.context.length<=80)entry.ctx=gloss.context;
      const reg=REGISTER.filter(tag=>tags.includes(tag));
      if(reg.length)entry.reg=reg;
      if(reg.some(tag=>["vulgar","offensive","derogatory"].includes(tag)))stats.vulgarSenses++;
      const topic=(sense.topics||[]).filter(t=>!/^(natural-sciences|physical-sciences|hobbies|lifestyle|humanities|social-sciences)$/.test(t)).slice(0,2);
      if(topic.length)entry.topic=topic;
      const ex=examplesOf(sense);if(ex.length){entry.ex=ex;exampleTotal+=ex.length;}
      const syn=wordList(sense.synonyms,MAX_SYN);if(syn.length){entry.syn=syn;synTotal+=syn.length;}
      const ant=wordList(sense.antonyms,MAX_ANT);if(ant.length)entry.ant=ant;
      senses.push(entry);
      if(senses.length>=MAX_SENSES)break;
    }
    if(!senses.length&&formOnly.length){
      for(const text of formOnly)senses.push({d:text,reg:["form"]});
      stats.formFallbackGroups=(stats.formFallbackGroups||0)+1;
    }
    if(!senses.length)continue;
    senses.sort((a,b)=>(a.reg||[]).some(t=>REGIONAL.has(t))-(b.reg||[]).some(t=>REGIONAL.has(t)));
    senseTotal+=senses.length;
    const group={pos,senses};
    const gender=pos==="noun"?genderOf(rec):null;if(gender)group.gender=gender;
    const forms=formsOf(rec);if(Object.keys(forms).length)group.forms=forms;
    const col=collocationsOf(rec);if(col.length)group.collocations=col;
    const ety=etymologyOf(rec);if(ety&&!groups.some(g=>g.etymology===ety))group.etymology=ety;
    const existing=groups.find(g=>g.pos===pos);
    if(existing){// same part of speech from a second Wiktionary record: merge extra senses
      for(const sense of senses)if(existing.senses.length<MAX_SENSES&&!existing.senses.some(s=>s.d.toLowerCase()===sense.d.toLowerCase()))existing.senses.push(sense);
    }else groups.push(group);
    derived.push(...wordList(rec.derived,MAX_PHRASES));related.push(...wordList(rec.related,MAX_RELATED));
  }
  if(!groups.length)continue;
  const forced=DISPLAY_ORDER[word];
  groups.sort((a,b)=>{
    const rank=g=>g.pos===forced?0:(word==="cent"&&g.pos==="numeral")?0:(g.pos==="numeral"?1:2);
    return rank(a)-rank(b);
  });
  const out={};
  if(ipaPick)out.ipa=ipaPick.ipa;
  out.groups=groups;
  const phrases=[...new Set(derived)].slice(0,MAX_PHRASES);if(phrases.length)out.phrases=phrases;
  const rel=[...new Set(related)].slice(0,MAX_RELATED);if(rel.length)out.related=rel;
  entries[word]=out;
  stats.headwords++;stats.posGroups+=groups.length;
  if(out.ipa)stats.withIpa++;
  if(groups.some(g=>g.etymology))stats.withEtymology++;
  if(groups.some(g=>g.senses.some(s=>s.ex)))stats.withExamples++;
  if(phrases.length)stats.withPhrases++;
}

// shard by first letter so the app only loads what it needs
const shardOf=word=>{
  const letter=word.normalize("NFD").replace(/\p{M}/gu,"").toLowerCase()[0]||"_";
  return /[a-z]/.test(letter)?letter:"_";
};
const shards={};
for(const [word,entry] of Object.entries(entries).sort(([a],[b])=>a.localeCompare(b,"fr"))){
  (shards[shardOf(word)]??={})[word]=entry;
}
fs.rmSync(OUT_DIR,{recursive:true,force:true});
fs.mkdirSync(OUT_DIR,{recursive:true});
const sizes={};let rawTotal=0,gzTotal=0;
for(const [letter,data] of Object.entries(shards)){
  const body=JSON.stringify(data);
  fs.writeFileSync(path.join(OUT_DIR,letter+".json"),body+"\n");
  const gz=zlib.gzipSync(body).length;
  sizes[letter]={entries:Object.keys(data).length,bytes:Buffer.byteLength(body),gzipBytes:gz};
  rawTotal+=Buffer.byteLength(body);gzTotal+=gz;
}
const meta={schemaVersion:4,layer:"rich",source:"kaikki.org French (English Wiktionary)",licence:"CC BY-SA 4.0",headwords:stats.headwords,
  totals:{senses:senseTotal,examples:exampleTotal,synonyms:synTotal},stats,sizes,rawBytes:rawTotal,gzipBytes:gzTotal,
  limits:{MAX_SENSES,MAX_GLOSS,MAX_EXAMPLE,MAX_EXAMPLES,MAX_SYN,MAX_ANT,MAX_PHRASES,MAX_RELATED,MAX_COLLOCATIONS,MAX_ETYMOLOGY}};
fs.writeFileSync(path.join(OUT_DIR,"meta.json"),JSON.stringify(meta,null,1)+"\n");
console.log("STAGE B BUILT: "+JSON.stringify({headwords:stats.headwords,posGroups:stats.posGroups,senses:senseTotal,examples:exampleTotal,synonyms:synTotal,shards:Object.keys(shards).length,rawBytes:rawTotal,gzipBytes:gzTotal}));
console.log("COVERAGE: "+JSON.stringify(stats));
