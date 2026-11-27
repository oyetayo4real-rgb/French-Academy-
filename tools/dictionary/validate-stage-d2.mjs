// Validates the French layer built by build-stage-d2.mjs.
// Usage: node tools/dictionary/validate-stage-d2.mjs data/dictionary/fr data/dictionary/common-3000.json
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import assert from "node:assert/strict";
const dir=process.argv[2]||"data/dictionary/fr";
const headFile=process.argv[3]||"data/dictionary/common-3000.json";
const meta=JSON.parse(fs.readFileSync(path.join(dir,"meta.json"),"utf8"));
assert.equal(meta.schemaVersion,5);assert.equal(meta.layer,"fr");
assert.ok(meta.licence&&meta.source&&meta.dump?.sha256,"meta must record source, licence and dump checksum");
const heads=Object.keys(JSON.parse(fs.readFileSync(headFile,"utf8"))).map(w=>w.normalize("NFC"));
const all={};let gz=0,senses=0,groups=0;
for(const file of fs.readdirSync(dir)){
  if(file==="meta.json"||!file.endsWith(".json"))continue;
  const raw=fs.readFileSync(path.join(dir,file),"utf8");
  assert.ok(Buffer.byteLength(raw)<700*1024,file+" shard must stay under 700 KB");
  gz+=zlib.gzipSync(raw,{level:9}).length;
  Object.assign(all,JSON.parse(raw));
}
assert.ok(gz<1700*1024,"total gzip must stay under 1.7 MB, got "+gz);
const FORM=/^(Premi\u00e8re|Deuxi\u00e8me|Troisi\u00e8me) personne d[ue]/;
let formFallback=0;
for(const [word,entry] of Object.entries(all)){
  assert.ok(Array.isArray(entry.groups)&&entry.groups.length,word+" needs groups");
  for(const g of entry.groups){
    groups++;
    assert.ok(g.pos&&Array.isArray(g.senses)&&g.senses.length&&g.senses.length<=6,word+" group senses 1-6");
    if(g.gender)assert.ok(g.pos==="noun"&&["m","f","mf"].includes(g.gender),word+" gender only on nouns");
    const isFormGroup=g.senses.every(s=>(s.reg||[]).includes("forme"));
    if(isFormGroup)formFallback++;
    for(const s of g.senses){
      senses++;
      assert.ok(typeof s.d==="string"&&s.d.length>=3&&s.d.length<=270,word+" gloss length "+s.d?.length);
      assert.ok(!/[<>{}]/.test(s.d),word+" gloss has markup");
      if(!isFormGroup)assert.ok(!FORM.test(s.d),word+" inflected-form gloss leaked: "+s.d.slice(0,60));
      if(s.sens)assert.ok((s.reg||[]).some(r=>["vulgaire","injurieux","p\u00e9joratif"].includes(r)),word+" sensitive flag needs a label");
      for(const ex of s.ex||[])assert.ok(ex.t&&ex.t.length<=150,word+" example length");
    }
  }
}
const missing=heads.filter(w=>!all[w]);
assert.ok(missing.length<=10,"too many missing headwords: "+missing.join(", "));
assert.ok(formFallback<=40,"too many form-only fallback groups: "+formFallback);
const first=(w)=>all[w]?.groups?.[0];
assert.match(first("arbre")?.senses?.[0]?.d||"",/^V\u00e9g\u00e9tal/,"arbre first sense");
assert.equal(first("cent")?.pos,"adjective","cent is the numeral adjective first");
assert.match(first("cent")?.senses?.[0]?.d||"",/^Quatre-vingt-dix-neuf/);
const merde=all.merde?.groups?.find(g=>g.pos==="noun");
assert.ok(merde?.senses?.[0]?.sens===1&&merde.senses[0].reg.includes("vulgaire"),"merde noun first sense is labelled vulgaire");
assert.ok(all.vent&&all.voler&&all["libert\u00e9"]&&all["mus\u00e9e"],"core words present");
console.log("STAGE D2 VALIDATION PASSED: "+JSON.stringify({headwords:Object.keys(all).length,groups,senses,formFallback,missing,gzipBytes:gz}));