#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { gzipSync } from "node:zlib";
import { createReadStream, createWriteStream } from "node:fs";
import { dictionary } from "../../features/french-data.mjs";

const ROOT = process.cwd();
const LEXIQUE = process.env.LEXIQUE_FILE || path.join(ROOT, "data/raw/Lexique383.tsv");
const WIKTIONARY = process.env.WIKTIONARY_FILE || path.join(ROOT, "data/raw/kaikki.org-dictionary-French.jsonl");
const OUTPUT = process.env.OUTPUT_FILE || path.join(ROOT, "data/dictionary/common-3000.json");
const META = process.env.META_FILE || path.join(ROOT, "data/dictionary/common-3000.meta.json");
const LOCK = path.join(ROOT, "tools/dictionary/sources.lock.json");
const TARGET = 3000;
const MINIMUM = 2800;
const SOURCE = "wiktionary-en via kaikki.org";
const lock = JSON.parse(fs.readFileSync(LOCK, "utf8"));
const extractDate = lock.sources?.kaikki?.extractDate;
if (!extractDate) throw new Error("sources.lock.json must include sources.kaikki.extractDate");

const normalize = value => String(value ?? "").normalize("NFC").toLocaleLowerCase("fr").trim();
const builtin = new Set(Object.keys(dictionary).map(normalize));
const posMap = new Map([["NOM","noun"],["VER","verb"],["ADJ","adjective"],["ADV","adverb"]]);
const wiktionaryPos = new Map([["noun","noun"],["verb","verb"],["adjective","adjective"],["adj","adjective"],["adverb","adverb"],["adv","adverb"]]);
const forbiddenTags = new Set(["obsolete","archaic","dated","rare","vulgar","offensive"]);
const alwaysSkipSenseTags = new Set(["abbreviation","initialism","acronym","proper noun","proper-name"]);
const forbiddenRecordTags = new Set(["proper noun","proper-name","abbreviation","initialism","acronym"]);

function parseTsvLine(line) {
  const fields = []; let value = ""; let quoted = false;
  for (let i=0;i<line.length;i++) {
    const ch=line[i];
    if (ch === '"') { if (quoted && line[i+1] === '"') { value+='"'; i++; } else quoted=!quoted; }
    else if (ch === "\t" && !quoted) { fields.push(value); value=""; }
    else value+=ch;
  }
  fields.push(value); return fields;
}
function columnIndex(header, ...names) {
  const normalized = new Map(header.map((v,i)=>[String(v).replace(/[^a-z0-9]/gi,"").toLowerCase(),i]));
  for (const name of names) { const idx=normalized.get(name.replace(/[^a-z0-9]/gi,"").toLowerCase()); if (idx!==undefined) return idx; }
  throw new Error("Missing Lexique column: "+names.join("/"));
}
function num(value) { const n=Number(String(value ?? "0").replace(",", ".")); return Number.isFinite(n)?n:0; }
function cleanGloss(raw) {
  let s=String(raw ?? "");
  s=s.replace(/<[^>]*>/g," ").replace(/\{\{[^{}]*\}\}/g," ");
  s=s.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,"$2").replace(/\[\[([^\]]+)\]\]/g,"$1");
  s=s.replace(/'''?|''/g,"").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"');
  s=s.replace(/<\/?[^>]+>/g," ").replace(/\s+/g," ").trim();
  if (!s || /[\[\]{}<>]/.test(s)) return "";
  return Array.from(s).slice(0,90).join("").trim();
}
function senseTags(sense) {
  return [...new Set([...(sense.tags||[]), ...(sense.raw_tags||[])].map(x=>String(x).toLowerCase()))];
}
function entrySenses(record) {
  const senses=[];
  for (const sense of record.senses || []) {
    const tags=senseTags(sense);
    if (tags.some(t=>[...alwaysSkipSenseTags].some(b=>t.includes(b)))) continue;
    const glosses=(sense.glosses || []).map(cleanGloss).filter(Boolean);
    if (!glosses.length) continue;
    if (/^(abbreviation|initialism|acronym) of\b/i.test(glosses[0])) continue;
    senses.push({meaning:glosses[0],tags});
  }
  const ordinary=senses.filter(s=>!s.tags.some(t=>[...forbiddenTags].some(b=>t.includes(b))));
  const selected=(ordinary.length?ordinary:senses).slice(0,3);
  if (!ordinary.length && selected.length) {
    for (const s of selected) s.registerTags=s.tags.filter(t=>[...forbiddenTags].some(b=>t.includes(b)));
  }
  return selected;
}
function usableRecord(record) {
  if (normalize(record.lang_code)!=="fr" || normalize(record.lang)!=="french") return false;
  const pos=wiktionaryPos.get(normalize(record.pos));
  if (!pos) return false;
  const tags=(record.tags||[]).map(x=>String(x).toLowerCase());
  if (tags.some(t=>[...forbiddenRecordTags].some(b=>t.includes(b)))) return false;
  return true;
}

async function readLexique() {
  const input=fs.createReadStream(LEXIQUE,{encoding:"utf8"});
  const rl=readline.createInterface({input,crlfDelay:Infinity});
  let header=null, indexes=null, lineNo=0;
  const grouped=new Map();
  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    const cells=parseTsvLine(line);
    if (!header) {
      header=cells;
      indexes={
        form:columnIndex(header,"ortho"), lemma:columnIndex(header,"lemme"),
        pos:columnIndex(header,"cgram"), gender:columnIndex(header,"genre"),
        number:columnIndex(header,"nombre"), films:columnIndex(header,"freqlemfilms2"),
        books:columnIndex(header,"freqlemlivres")
      };
      continue;
    }
    const lemma=(cells[indexes.lemma]||"").trim();
    const form=(cells[indexes.form]||"").trim();
    const pos=(cells[indexes.pos]||"").trim().toUpperCase();
    if (!lemma || !form || !posMap.has(pos) || !/[\p{L}]/u.test(lemma)) continue;
    if (lemma.length<2 || lemma.length>48 || /[\d]/.test(lemma) || !/^[\p{L}'’ -]+$/u.test(lemma) || /^\p{Lu}/u.test(lemma)) continue;
    const key=normalize(lemma)+"\u0000"+pos;
    const frequency=num(cells[indexes.films])+num(cells[indexes.books]);
    const item=grouped.get(key)||{lemma,pos,frequency:0,forms:[]};
    item.frequency=Math.max(item.frequency,frequency);
    item.forms.push({form,gender:(cells[indexes.gender]||"").trim(),number:(cells[indexes.number]||"").trim()});
    grouped.set(key,item);
  }
  if (!header || !grouped.size) throw new Error("Lexique TSV parse produced no lemma candidates");
  return [...grouped.values()].filter(x=>x.frequency>0 && !builtin.has(normalize(x.lemma)))
    .sort((a,b)=>b.frequency-a.frequency || normalize(a.lemma).localeCompare(normalize(b.lemma),"fr") || a.pos.localeCompare(b.pos));
}

async function collectWiktionary(candidates) {
  const byWord=new Map();
  for (const c of candidates) {
    const key=normalize(c.lemma);
    if (!byWord.has(key)) byWord.set(key,[]);
    byWord.get(key).push(c);
  }
  const matched=new Map();
  const rl=readline.createInterface({input:createReadStream(WIKTIONARY,{encoding:"utf8"}),crlfDelay:Infinity});
  let lineNo=0;
  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    let record;
    try { record=JSON.parse(line); } catch (error) { throw new Error("Invalid Wiktionary JSONL at line "+lineNo+": "+error.message); }
    if (!usableRecord(record)) continue;
    const candidatesForWord=byWord.get(normalize(record.word));
    if (!candidatesForWord) continue;
    const pos=wiktionaryPos.get(normalize(record.pos));
    for (const candidate of candidatesForWord) {
      if (posMap.get(candidate.pos)!==pos) continue;
      const senses=entrySenses(record);
      if (!senses.length) continue;
      const key=normalize(candidate.lemma)+"\u0000"+candidate.pos;
      const prior=matched.get(key)||{senses:[],forms:{feminine:new Set(),plural:new Set()}};
      for (const s of senses) if (!prior.senses.some(x=>x.meaning===s.meaning)) prior.senses.push(s);
      for (const form of record.forms||[]) {
        const spelling=String(form.form||"").trim();
        if (!spelling || spelling===candidate.lemma) continue;
        const tags=(form.tags||[]).map(x=>String(x).toLowerCase());
        if (tags.some(t=>t.includes("feminine") || t==="f")) prior.forms.feminine.add(spelling);
        if (tags.some(t=>t.includes("plural"))) prior.forms.plural.add(spelling);
      }
      matched.set(key,prior);
    }
  }
  return matched;
}

async function sha256(file) {
  const {createHash}=await import("node:crypto");
  const hash=createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

const candidates=await readLexique();
console.log("LEXIQUE RANKING: freqlemfilms2 + freqlemlivres (combined lemma frequency)");
console.log("LEXIQUE CANDIDATES: "+candidates.length);
const matches=await collectWiktionary(candidates);
const output={};
const posCounts={noun:0,verb:0,adjective:0,adverb:0};
const selected=[];
for (const candidate of candidates) {
  if (selected.length>=TARGET) break;
  const key=normalize(candidate.lemma)+"\u0000"+candidate.pos;
  const match=matches.get(key);
  if (!match?.senses?.length) continue;
  const headword=candidate.lemma.normalize("NFC");
  if (Object.hasOwn(output,headword) || builtin.has(normalize(headword))) continue;
  const part=posMap.get(candidate.pos);
  const lexGender=(candidate.forms.find(x=>normalize(x.form)===normalize(candidate.lemma))?.gender || candidate.forms.map(x=>x.gender).find(x=>/^(m|masc|masculin|f|fem|féminin)/i.test(x))) || null;
  const gender=part==="noun" ? (match.gender || (lexGender ? (/^(f|fem|féminin)/i.test(lexGender) ? "f" : "m") : null)) : null;
  const lexFeminine=candidate.forms.filter(x=>x.form!==candidate.lemma && /^(f|fem|féminin)/i.test(x.gender)).map(x=>x.form);
  const lexPlural=candidate.forms.filter(x=>/^(p|plur)/i.test(x.number)).map(x=>x.form);
  const senses=match.senses.slice(0,3);
  const meaning=senses.map(s=>s.meaning).join("; ");
  const metadata={
    hint:false, source:SOURCE, extractDate, lexiqueFrequency:Number(candidate.frequency.toFixed(2)),
    status:"imported-unreviewed", licence:"CC BY-SA 4.0", gender,
    senses, forms:{feminine:[...new Set([...match.forms.feminine,...lexFeminine])].sort(),plural:[...new Set([...match.forms.plural,...lexPlural])].sort()}
  };
  output[headword]=[meaning,gender && part==="noun" ? "noun ("+gender+")" : part,"",
    "Imported lexical entry; meanings are unreviewed.",metadata];
  selected.push({headword,pos:part,frequency:candidate.frequency});
  posCounts[part]++;
}
if (selected.length<MINIMUM) throw new Error("Only "+selected.length+" qualifying entries found; minimum is "+MINIMUM);
fs.mkdirSync(path.dirname(OUTPUT),{recursive:true});
fs.mkdirSync(path.dirname(META),{recursive:true});
const json=JSON.stringify(output,null,2)+"\n";
fs.writeFileSync(OUTPUT,json,"utf8");
const rawBytes=Buffer.byteLength(json);
const gzBytes=gzipSync(Buffer.from(json),{level:9}).byteLength;
const lexHash=await sha256(LEXIQUE), wikHash=await sha256(WIKTIONARY);
const meta={
  schemaVersion:1,entryCount:selected.length,requestedCount:TARGET,minimumAccepted:MINIMUM,
  sourceFiles:{
    lexique:{name:path.basename(LEXIQUE),sha256:lexHash,extractDate:lock.sources.lexique.extractDate,url:lock.sources.lexique.url},
    wiktionary:{name:path.basename(WIKTIONARY),sha256:wikHash,extractDate,url:lock.sources.kaikki.url,dumpDate:lock.sources.kaikki.dumpDate}
  },
  ranking:"freqlemfilms2 + freqlemlivres",posDistribution:posCounts,
  sizes:{rawBytes,gzipBytes:gzBytes}
};
fs.writeFileSync(META,JSON.stringify(meta,null,2)+"\n","utf8");
console.log("BUILT ENTRIES: "+selected.length);
console.log("POS: "+JSON.stringify(posCounts));
console.log("SIZE: raw="+rawBytes+" bytes; gzip="+gzBytes+" bytes");
console.log("SOURCE SHA256: "+JSON.stringify({lexique:lexHash,kaikki:wikHash}));
