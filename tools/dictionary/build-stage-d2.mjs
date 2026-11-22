// Stage D2: builds the "fr" dictionary layer (definitions, examples, labels, etymology written in
// French, from the French Wiktionary) for the same headwords as Stage A. Additive: other layers are never changed.
// Usage: KAIKKI_FILE=<jsonl or jsonl.gz, French-language lines> HEADWORDS_FILE=data/dictionary/common-3000.json OUT_DIR=data/dictionary/fr \
//        DUMP_SHA256=<sha256 of the downloaded dump> DUMP_DATE=<yyyy-mm-dd> node tools/dictionary/build-stage-d2.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";

const KAIKKI=process.env.KAIKKI_FILE;
const HEADWORDS=process.env.HEADWORDS_FILE||"data/dictionary/common-3000.json";
const OUT_DIR=process.env.OUT_DIR||"data/dictionary/fr";
const DUMP_SHA=process.env.DUMP_SHA256||"unknown";
const DUMP_DATE=process.env.DUMP_DATE||"unknown";
const DISPLAY_ORDER=JSON.parse(fs.readFileSync("tools/dictionary/display-order.json","utf8"));

const POS={noun:"noun",verb:"verb",adj:"adjective",adv:"adverb",intj:"interjection",prep:"preposition",conj:"conjunction",pron:"pronoun",det:"determiner",num:"numeral",name:"proper noun",phrase:"phrase",particle:"particle",onomatopoeia:"onomatopoeia"};
const MAX_SENSES=6,MAX_GLOSS=260,MAX_EXAMPLE=150,MAX_SOURCE=60,MAX_SYN=6,MAX_ANT=4,MAX_PROVERBS=6,MAX_DERIVED=10,MAX_RELATED=8,MAX_PARONYMS=4,MAX_ETYMOLOGY=300,MAX_CTX=3;

// register and usage labels, in French (tags in the source use English keys)
const REG_FR={vulgar:"vulgaire",offensive:"injurieux",pejorative:"p\u00e9joratif",derogatory:"p\u00e9joratif",slang:"argot",familiar:"familier",colloquial:"familier",informal:"familier",
  dated:"vieilli",obsolete:"d\u00e9suet",archaic:"archa\u00efque",rare:"rare",literary:"litt\u00e9raire",poetic:"po\u00e9tique",formal:"soutenu",euphemism:"euph\u00e9misme",ironic:"ironique",
  Anglicism:"anglicisme",figuratively:"figur\u00e9",broadly:"par extension",metonymically:"par m\u00e9tonymie",analogy:"par analogie",ellipsis:"ellipse"};
const SENSITIVE=new Set(["vulgar","offensive","pejorative","derogatory"]);
// grammar labels that matter to learners (verbs especially)
const GRAM_FR={transitive:"transitif",intransitive:"intransitif",pronominal:"pronominal",impersonal:"impersonnel",reflexive:"r\u00e9fl\u00e9chi"};
const REGIONAL_RE=/^(Qu\u00e9bec|Canada|Belgique|Suisse|Louisiane|Nouvelle-Cal\u00e9donie|Lorraine|R\u00e9gionalisme|Afrique|Antilles|Maghreb|Acadie|Wallonie)$/;
const SKIP_TAGS=new Set(["form-of","alt-of"]);
// some inflected-form descriptions carry no form-of tag, so they are also recognised by their wording
const FORM_GLOSS=/^(Premi\u00e8re|Deuxi\u00e8me|Troisi\u00e8me) personne d[ue]\b|^(Participe (pass\u00e9|pr\u00e9sent)|Pluriel|F\u00e9minin|Masculin|Singulier)( (masculin|f\u00e9minin))?( (singulier|pluriel))? d[eu'\u2019 ]/;
// label order: sensitive first, then register, then figurative/rhetorical labels
const REG_ORDER=["vulgar","offensive","pejorative","derogatory","slang","familiar","colloquial","informal","dated","obsolete","archaic","rare","literary","poetic","formal","euphemism","ironic","Anglicism","figuratively","broadly","metonymically","analogy","ellipsis"];
const REG_RANK=tag=>{const i=REG_ORDER.indexOf(tag);return i<0?99:i;};

const heads=new Set(Object.keys(JSON.parse(fs.readFileSync(HEADWORDS,"utf8"))).map(word=>word.normalize("NFC")));
const records=new Map();
let input=fs.createReadStream(KAIKKI);
if(KAIKKI.endsWith(".gz"))input=input.pipe(zlib.createGunzip());
const rl=readline.createInterface({input:input.setEncoding?input.setEncoding("utf8"):input,crlfDelay:Infinity});
let sourceLines=0;
for await(const line of rl){
  if(!line)continue;
  let rec;try{rec=JSON.parse(line);}catch{continue;}
  sourceLines++;
  if(rec.lang_code!=="fr")continue;
  const word=String(rec.word||"").normalize("NFC");
  if(!heads.has(word))continue;
  if(!records.has(word))records.set(word,[]);
  records.get(word).push(rec);
}

const clean=text=>String(text||"").replace(/\s+/g," ").trim();
const cut=(text,max)=>{
  text=clean(text);
  if(text.length<=max)return text;
  const head=text.slice(0,max);
  const sentence=Math.max(head.lastIndexOf(". "),head.lastIndexOf("; "));
  if(sentence>max*0.5)return head.slice(0,sentence+1).trim();
  return head.slice(0,head.lastIndexOf(" ")).replace(/[,;:(\s]+$/,"")+"\u2026";
};
const wordsOf=list=>[...new Set((Array.isArray(list)?list:[]).map(x=>clean(typeof x==="string"?x:x?.word)).filter(x=>x&&x.length<=40&&/^[\p{L}][\p{L}' \u2019.-]*$/u.test(x)))];
const validForm=value=>/^[\p{L}]+(?:[-'\u2019][\p{L}]+)*$/u.test(String(value||""));

const ipaOf=recs=>{
  for(const rec of recs){
    for(const s of rec.sounds||[]){
      const ipa=clean(s?.ipa);
      const m=ipa.match(/^\\(.+)\\$/);
      if(m)return "/"+m[1]+"/";
    }
  }
  for(const rec of recs)for(const s of rec.sounds||[]){const ipa=clean(s?.ipa);if(ipa)return ipa;}
  return undefined;
};

const exampleOf=sense=>{
  const options=(sense.examples||[]).map(ex=>({t:clean(ex?.text),s:clean(ex?.ref)})).filter(ex=>ex.t.length>=12&&ex.t.length<=MAX_EXAMPLE&&!ex.t.includes("\u2026")&&!/[<>{}]/.test(ex.t));
  // prefer short examples without a literary reference (simple, learner-friendly), then the shortest cited one
  options.sort((a,b)=>(!!a.s-!!b.s)||(a.t.length-b.t.length));
  const pick=options.find(ex=>ex.t.length>=20)||options[0];
  if(!pick)return undefined;
  const out={t:pick.t};
  if(pick.s)out.s=cut(pick.s.split(", ").slice(0,2).join(", "),MAX_SOURCE);
  return out;
};

const senseOf=(sense,{formFallback})=>{
  const tags=sense.tags||[];
  const gloss=cut((sense.glosses||[]).join(" "),MAX_GLOSS);
  const isForm=tags.some(t=>SKIP_TAGS.has(t))||!!sense.form_of||!!sense.alt_of||FORM_GLOSS.test(gloss);
  if(isForm&&!formFallback)return null;
  if(!gloss||gloss.length<3)return null;
  const reg=[...new Set(tags.filter(t=>REG_FR[t]).sort((a,b)=>REG_RANK(a)-REG_RANK(b)).map(t=>REG_FR[t]))];
  const sensitive=tags.some(t=>SENSITIVE.has(t));
  const gram=[...new Set(tags.filter(t=>GRAM_FR[t]).map(t=>GRAM_FR[t]))];
  const ctx=[...new Set((sense.raw_tags||[]).map(clean).filter(t=>t&&t.length<=32))].slice(0,MAX_CTX);
  const out={d:gloss};
  if(isForm)reg.unshift("forme");
  if(reg.length)out.reg=reg;
  if(sensitive)out.sens=1;
  if(gram.length)out.gram=gram;
  if(ctx.length)out.ctx=ctx;
  const ex=exampleOf(sense);
  if(ex)out.ex=[ex];
  out._regional=ctx.some(t=>REGIONAL_RE.test(t));
  return out;
};

const genderOf=rec=>{
  const t=rec.tags||[];
  const m=t.includes("masculine"),f=t.includes("feminine");
  return m&&f?"mf":m?"m":f?"f":undefined;
};

const entries={};
const stats={headwords:0,groups:0,senses:0,examples:0,withIpa:0,withEtymology:0,withSynonyms:0,withProverbs:0,sensitiveSenses:0,formFallbackGroups:0};
for(const [word,recs] of records){
  const groupsByKey=new Map();
  const isReal=rec=>(rec.senses||[]).some(s=>!(s.tags||[]).some(t=>SKIP_TAGS.has(t))&&!s.form_of&&!s.alt_of&&!FORM_GLOSS.test(clean((s.glosses||[]).join(" "))));
  const wordHasReal=recs.some(isReal);
  for(const rec of recs){
    const pos=POS[rec.pos]||rec.pos;
    if(!pos)continue;
    const hasNonForm=isReal(rec);
    // conjugated/inflected-form records are dropped when the word has real definitions elsewhere
    if(wordHasReal&&!hasNonForm)continue;
    const gender=pos==="noun"?genderOf(rec):undefined;
    const key=pos+"|"+(gender||"")+"|"+recs.indexOf(rec);
    let g=groupsByKey.get(key);
    if(!g){g={pos,senses:[],_form:!wordHasReal};if(gender)g.gender=gender;groupsByKey.set(key,g);}
    for(const s of rec.senses||[]){const o=senseOf(s,{formFallback:!wordHasReal});if(o&&(wordHasReal||g.senses.length<3))g.senses.push(o);}
    if(!g.syn){const syn=wordsOf(rec.synonyms).slice(0,MAX_SYN);if(syn.length)g.syn=syn;}
    if(!g.ant){const ant=wordsOf(rec.antonyms).slice(0,MAX_ANT);if(ant.length)g.ant=ant;}
    if(!g.etymology){const et=cut((rec.etymology_texts||[]).join(" "),MAX_ETYMOLOGY);if(et)g.etymology=et;}
    if(!g.forms&&(pos==="noun"||pos==="adjective")){
      const forms={};
      for(const f of rec.forms||[]){
        const tags=f.tags||[];
        const name=tags.includes("plural")?"plural":tags.includes("feminine")?"feminine":null;
        if(name&&validForm(f.form)){(forms[name]??=[]);if(!forms[name].includes(f.form)&&forms[name].length<2)forms[name].push(f.form);}
      }
      if(Object.keys(forms).length)g.forms=forms;
    }
  }
  let groups=[...groupsByKey.values()].filter(g=>g.senses.length);
  if(!groups.length)continue;
  // regional senses last, vulgar/offensive senses stay labelled (the app decides whether to show them)
  for(const g of groups){
    g.senses=g.senses.map((s,i)=>({s,i})).sort((a,b)=>(a.s._regional-b.s._regional)||(a.i-b.i)).map(x=>x.s).slice(0,MAX_SENSES);
    for(const s of g.senses)delete s._regional;
    if(g._form){stats.formFallbackGroups++;}
    delete g._form;
  }
  const forced=DISPLAY_ORDER[word];
  if(forced){
    const at=groups.findIndex(g=>g.pos===forced);
    if(at>0)groups.unshift(...groups.splice(at,1));
  }
  const entry={groups};
  const ipa=ipaOf(recs);if(ipa){entry.ipa=ipa;stats.withIpa++;}
  const derivedAll=wordsOf(recs.flatMap(r=>r.derived||[])),relatedAll=wordsOf(recs.flatMap(r=>r.related||[]));
  const prov=[...new Set([...wordsOf(recs.flatMap(r=>r.proverbs||[])).slice(0,MAX_PROVERBS),...derivedAll.filter(x=>/\s/.test(x)).slice(0,6),...relatedAll.filter(x=>/\s/.test(x)).slice(0,3)])].slice(0,10);
  if(prov.length){entry.prov=prov;stats.withProverbs++;}
  const derived=derivedAll.filter(x=>!/\s/.test(x)).slice(0,MAX_DERIVED);if(derived.length)entry.derived=derived;
  const related=relatedAll.filter(x=>!/\s/.test(x)).slice(0,MAX_RELATED);if(related.length)entry.related=related;
  const paro=wordsOf(recs.flatMap(r=>r.paronyms||[])).slice(0,MAX_PARONYMS);if(paro.length)entry.paro=paro;
  entries[word]=entry;
  stats.headwords++;stats.groups+=groups.length;
  for(const g of groups){
    stats.senses+=g.senses.length;
    if(g.etymology)stats.withEtymology++;
    if(g.syn)stats.withSynonyms++;
    for(const s of g.senses){if(s.ex)stats.examples++;if(s.sens)stats.sensitiveSenses++;}
  }
}

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
  fs.writeFileSync(path.join(OUT_DIR,letter+".json"),body);
  sizes[letter]={raw:Buffer.byteLength(body),gzip:zlib.gzipSync(body,{level:9}).length};
  rawTotal+=sizes[letter].raw;gzTotal+=sizes[letter].gzip;
}
const meta={
  schemaVersion:5,layer:"fr",language:"fr",
  source:"French Wiktionary (Wiktionnaire), extracted with wiktextract; data from kaikki.org/frwiktionary",
  licence:"CC BY-SA (text of Wiktionnaire contributors); see the page history of each entry on fr.wiktionary.org",
  dump:{sha256:DUMP_SHA,downloaded:DUMP_DATE,file:"raw-wiktextract-data.jsonl.gz"},
  headwords:stats.headwords,totals:stats,sizes,rawBytes:rawTotal,gzipBytes:gzTotal,
  limits:{MAX_SENSES,MAX_GLOSS,MAX_EXAMPLE,MAX_SOURCE,MAX_SYN,MAX_ANT,MAX_PROVERBS,MAX_DERIVED,MAX_RELATED,MAX_PARONYMS,MAX_ETYMOLOGY,MAX_CTX}
};
fs.writeFileSync(path.join(OUT_DIR,"meta.json"),JSON.stringify(meta));
console.log("STAGE D2 BUILT: "+JSON.stringify({sourceLines,headwords:stats.headwords,groups:stats.groups,senses:stats.senses,examples:stats.examples,shards:Object.keys(shards).length,rawBytes:rawTotal,gzipBytes:gzTotal}));
console.log("COVERAGE: "+JSON.stringify(stats));