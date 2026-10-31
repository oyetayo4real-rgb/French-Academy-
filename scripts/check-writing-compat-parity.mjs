import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import vm from "node:vm";
import { checkSection12Rules } from "../features/french-section12-rules.mjs";

const baseURL=process.env.FRENCH_ACADEMY_URL||"http://127.0.0.1:4173";
const mainCompatSource=execFileSync("git",["show","75553fa1ff848714e753d3f8cd4217fb17553344:features/french-intelligence-compat.mjs"],{encoding:"utf8"});
const goldenPaths=["tests/golden/legacy-v1.json","tests/golden/legacy-v2.json","tests/golden/legacy-v3.json"];
const goldenInputs=[];
const safetyInputs=new Map();
const cleanLegacyText=value=>typeof value==="string"&&value.includes("No issue from the small built-in check list was detected");
for(const path of goldenPaths){
  const frozen=JSON.parse(readFileSync(path,"utf8")),groups=frozen.inventory?.checkWriting||{};
  for(const groupName of ["clean","hardNegative","knownErrors"]){
    for(const row of groups[groupName]||[]){
      goldenInputs.push({source:path+":"+groupName+":"+row.index,input:row.sentence});
      if(cleanLegacyText(row.output))safetyInputs.set(path+":"+groupName+":"+row.index,row.sentence);
    }
  }
  for(const row of frozen.inventory?.checkWritingCases||[]){
    const input=row.input??row.text??row.sentence,output=row.output??row.expected;
    if(typeof input==="string"){
      goldenInputs.push({source:path+":checkWritingCases:"+input,input});
      if(cleanLegacyText(output)||output?.rule_id==="writing.no-listed-issue"||output?.kind==="no-issues")safetyInputs.set(path+":checkWritingCases:"+input,input);
    }
  }
}
safetyInputs.set("characterization:clean sentence disclaimer","Bonjour, je m'appelle Léa.");
assert.equal(safetyInputs.size,639,"The frozen legacy no-issue safety net must remain exactly 639 inputs.");
const cases=[
  {input:"Je leurs ai dit de partir",expected:"Je leur ai dit de partir",rule:"NR-03",legacyOnly:true},
  {input:"un vieux homme",expected:"un vieil homme",rule:"NR-05"},
  {input:"Elle est tout contente",expected:"Elle est toute contente",rule:"NR-04"},
  {input:"s'elle vient",expected:"si elle vient",rule:"NR-06"},
  {input:"des gens intéressantes",review:"adjectives after gens are masculine",rule:"NR-02"},
  {input:"Il à mangé et elle et fatiguée.",expected:"Il a mangé et elle est fatiguée.",rule:"NR-07/NR-09",multi:true},
  {input:"Ou est le marché ?",expected:"Où est le marché ?",rule:"NR-08"},
  {input:"Ils son contents",expected:"Ils sont contents",rule:"NR-10"},
  {input:"sa dépend",expected:"ça dépend",rule:"NR-11"},
  {input:"Nous allons a le marché",expected:"Nous allons au marché",rule:"NR-07/NR-12"},
  {input:"Je leur ai dit",noIssue:true},
  {input:"un vieil homme",noIssue:true},
  {input:"Elle est toute contente",noIssue:true},
  {input:"des gens intéressants",noIssue:true},
  {input:"thé ou café",noIssue:true}
];
const allInputs=[...goldenInputs,...[...safetyInputs].map(([source,input])=>({source,input}))];
function extractDeclaredArray(source,name){
  const marker="const "+name+" = [",markerAt=source.indexOf(marker);
  if(markerAt<0)throw new Error("Missing corpus array "+name);
  const start=source.indexOf("[",markerAt);
  let depth=0,quote="",escaped=false;
  for(let i=start;i<source.length;i++){
    const ch=source[i];
    if(quote){
      if(escaped){escaped=false;continue;}
      if(ch==="\\"){escaped=true;continue;}
      if(ch===quote)quote="";
      continue;
    }
    if(ch==="\""||ch==="'"){quote=ch;continue;}
    if(ch==="[")depth++;
    if(ch==="]"){depth--;if(depth===0)return vm.runInNewContext(source.slice(start,i+1));}
  }
  throw new Error("Unterminated corpus array "+name);
}
const checkerSource=readFileSync("scripts/check-french-intelligence.mjs","utf8");
const cleanCorpus=extractDeclaredArray(checkerSource,"cleanSentenceCorpus");
const hardNegativeCorpus=extractDeclaredArray(checkerSource,"hardNegativeSentences");
const characterizationInputs=["bonjour","ecole","xqz-not-a-word","Thank you","J'ai besoin d'aide","  ","être","parler","xyz","What is the difference between depuis and pendant?","Explain a very obscure French construction","","Je suis 20 ans.","Bien que je suis fatigué, je continue.","Bonjour, je m'appelle Léa."];
const safetyCandidates=[...allInputs,...cleanCorpus.map((input,index)=>({source:"clean-corpus:"+index,input})),...hardNegativeCorpus.map((input,index)=>({source:"hard-negative:"+index,input})),...characterizationInputs.map((input,index)=>({source:"characterization:"+index,input}))];
const browser=await chromium.launch({headless:true});
const pages={};
try{
  for(const name of ["main","compat"]){
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    pages[name]=page;
    if(name==="main")await page.route("**/features/french-intelligence-compat.mjs",route=>route.fulfill({status:200,contentType:"text/javascript",body:mainCompatSource}));
    await page.goto(new URL("/tests/fixtures/french-intelligence-compat.html",baseURL).href,{waitUntil:"networkidle"});
    await page.locator("#hfrenchint").click();
    await page.locator('[data-fitab="correct"]').click();
  }
  let checked=0;
  for(const item of allInputs){
    const input=item.input;
    const mainApi=await pages.main.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),input);
    const compatApi=await pages.compat.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),input);
    assert.equal(compatApi,mainApi,"publicCheckWriting differs from main-branch compatibility API for "+item.source+" input="+JSON.stringify(input));
    for(const page of Object.values(pages)){
      await page.locator("#fiInput").fill(input);
      await page.locator("#fiCheck").click();
    }
    const mainUI=await pages.main.locator("#fiAnswer").evaluate(node=>node.innerHTML);
    const compatUI=await pages.compat.locator("#fiAnswer").evaluate(node=>node.innerHTML);
    assert.equal(compatUI,mainUI,"Writing UI differs from main-branch compatibility UI for "+item.source+" input="+JSON.stringify(input));
    assert.equal(compatUI,compatApi,"Writing UI and public API must return identical markup for "+item.source);
    checked++;
  }
  for(const item of cases){
    const output=await pages.compat.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),item.input);
    if(item.expected){
      assert.ok(output.includes(item.expected),item.rule+" corrected output");
      if(item.legacyOnly){
        const mainOutput=await pages.main.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),item.input);
        assert.equal(output,mainOutput,"legacy-only correction remains byte-identical to main");
      }
      if(item.multi)assert.ok((output.match(/class="fi-result"/g)||[]).length>=2,"multi-finding input renders multiple findings");
    }else if(item.review){
      assert.match(output,/Grammar note/,"NR-02 review heading");
      assert.match(output,new RegExp(item.review),"NR-02 review explanation");
      assert.doesNotMatch(output,/<p class="fi-output">/,"NR-02 must not propose a correction");
    }else{
      const mainOutput=await pages.main.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),item.input);
      assert.equal(output,mainOutput,"negative publicCheckWriting output must remain byte-identical to main");
      assert.match(output,/No issue from the small built-in check list was detected/,"negative keeps original no-issue output");
      assert.doesNotMatch(output,/<p class="fi-output">/,"negative has no correction");
    }
  }
  const newRuleIds=new Set(["NR-07","NR-08","NR-09","NR-10","NR-11","NR-12"]);
  const safetyFailures=[];
  let legacyHandled=0,legacyCorrectedChecked=0;
  for(const item of safetyCandidates){
    const legacy=await pages.main.evaluate(value=>{
      const html=window.FrenchIntelligenceCore.checkWriting(value);
      const holder=document.createElement("div");holder.innerHTML=html;
      const output=holder.querySelector(".fi-output");
      return {corrected:output?output.textContent:value,hasLegacyCorrection:!!output};
    },item.input);
    legacyCorrectedChecked++;
    const rawFindings=checkSection12Rules(item.input).filter(f=>newRuleIds.has(f.ruleId));
    const correctedFindings=checkSection12Rules(legacy.corrected).filter(f=>newRuleIds.has(f.ruleId));
    if(rawFindings.length&&legacy.hasLegacyCorrection&&!correctedFindings.length)legacyHandled++;
    if(correctedFindings.length){
      safetyFailures.push({step:"new-rule-safety-net",input:item.input,expected:[],actual:correctedFindings.map(f=>({ruleId:f.ruleId,found:f.found,suggestion:f.suggestion,explanation:f.explanation}))});
    }else if(rawFindings.length&&!legacy.hasLegacyCorrection){
      safetyFailures.push({step:"new-rule-safety-net",input:item.input,expected:[],actual:rawFindings.map(f=>({ruleId:f.ruleId,found:f.found,suggestion:f.suggestion,explanation:f.explanation}))});
    }
  }
  if(safetyFailures.length){
    console.error("M2 WRITING SAFETY FAILURES "+JSON.stringify(safetyFailures,null,2));
    throw new Error("M2 new-rule safety net found "+safetyFailures.length+" unapproved inputs.");
  }
  const sampleInputs=["Je leurs ai dit de partir","Il à mangé et elle et fatiguée.","Ou est le marché ?","Ils son contents; sa dépend.","Nous allons a le marché."];
  const samples=[];
  for(const input of sampleInputs){
    const html=await pages.compat.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),input);
    const after=await pages.compat.evaluate(markup=>{
      const holder=document.createElement("div");holder.innerHTML=markup;
      return holder.querySelector(".fi-output")?.textContent||"";
    },html);
    samples.push({input,before:input,after:after||input});
  }
  console.log("M2 BEFORE/AFTER SAMPLES "+JSON.stringify(samples,null,2));
  console.log(JSON.stringify({goldenWritingInputs:goldenInputs.length,safetyNetInputs:safetyInputs.size,cleanCorpus:cleanCorpus.length,hardNegativeCorpus:hardNegativeCorpus.length,characterizationInputs:characterizationInputs.length,newRuleSafetyNetInputs:safetyCandidates.length,legacyCorrectedVersionsChecked:legacyCorrectedChecked,legacyHandledExistingCorrections:legacyHandled,unapprovedNewRuleFindings:0,section12Cases:cases.length,parityChecks:checked,unapprovedDifferences:0}));
  console.log("PASS public Writing API/UI parity and M2 NR-07–NR-12 safety net; no unapproved findings.");

}finally{await browser.close();}
