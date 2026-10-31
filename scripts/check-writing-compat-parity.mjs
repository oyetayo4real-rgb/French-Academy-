import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const baseURL=process.env.FRENCH_ACADEMY_URL||"http://127.0.0.1:4173";
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
  {input:"Je leurs ai dit de partir",expected:"Je leur ai dit de partir",rule:"NR-03"},
  {input:"un vieux homme",expected:"un vieil homme",rule:"NR-05"},
  {input:"Elle est tout contente",expected:"Elle est toute contente",rule:"NR-04"},
  {input:"s'elle vient",expected:"si elle vient",rule:"NR-06"},
  {input:"des gens intéressantes",review:"adjectives after gens are masculine",rule:"NR-02"},
  {input:"Je leur ai dit",noIssue:true},
  {input:"un vieil homme",noIssue:true},
  {input:"Elle est toute contente",noIssue:true},
  {input:"des gens intéressants",noIssue:true}
];
const allInputs=[...goldenInputs,...[...safetyInputs].map(([source,input])=>({source,input})),...cases.map(item=>({source:"section12-case:"+item.rule+":"+item.input,input:item.input}))];
const browser=await chromium.launch({headless:true});
const pages={};
try{
  for(const [name,path] of Object.entries({main:"/tests/fixtures/french-intelligence-legacy.html",compat:"/tests/fixtures/french-intelligence-compat.html"})){
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    pages[name]=page;
    await page.goto(new URL(path,baseURL).href,{waitUntil:"networkidle"});
    await page.locator("#hfrenchint").click();
    await page.locator('[data-fitab="correct"]').click();
  }
  let checked=0;
  for(const item of allInputs){
    const input=item.input;
    const mainApi=await pages.main.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),input);
    const compatApi=await pages.compat.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),input);
    assert.equal(compatApi,mainApi,"publicCheckWriting differs from main for "+item.source+" input="+JSON.stringify(input));
    for(const page of Object.values(pages)){
      await page.locator("#fiInput").fill(input);
      await page.locator("#fiCheck").click();
    }
    const mainUI=await pages.main.locator("#fiAnswer").evaluate(node=>node.innerHTML);
    const compatUI=await pages.compat.locator("#fiAnswer").evaluate(node=>node.innerHTML);
    assert.equal(compatUI,mainUI,"Writing UI differs from main for "+item.source+" input="+JSON.stringify(input));
    assert.equal(compatUI,compatApi,"Writing UI and public API must return identical markup for "+item.source);
    checked++;
  }
  for(const item of cases){
    const output=await pages.compat.evaluate(value=>window.FrenchIntelligenceCore.checkWriting(value),item.input);
    if(item.expected){
      assert.ok(output.includes(item.expected),item.rule+" corrected output");
    }else if(item.review){
      assert.match(output,/Grammar note/,"NR-02 review heading");
      assert.match(output,new RegExp(item.review),"NR-02 review explanation");
      assert.doesNotMatch(output,/<p class="fi-output">/,"NR-02 must not propose a correction");
    }else{
      assert.match(output,/No issue from the small built-in check list was detected/,"negative keeps original no-issue output");
      assert.doesNotMatch(output,/<p class="fi-output">/,"negative has no correction");
    }
  }
  console.log(JSON.stringify({goldenWritingInputs:goldenInputs.length,safetyNetInputs:safetyInputs.size,section12Cases:cases.length,parityChecks:checked,unapprovedDifferences:0}));
  console.log("PASS public Writing API and UI preserve main output for all golden inputs and all 639 safety-net records.");
}finally{await browser.close();}
