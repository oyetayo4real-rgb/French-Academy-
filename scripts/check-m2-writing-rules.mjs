import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkSection12Rules } from "../features/french-section12-rules.mjs";
import { checkWriting } from "../features/french-intelligence-compat.mjs";

const newIds=new Set(["NR-07","NR-08","NR-09","NR-10","NR-11","NR-12"]);
function findings(input,id){return checkSection12Rules(input).filter(item=>item.ruleId===id);}
function applyRules(input){
  let text=input;
  for(let pass=0;pass<4;pass++){
    const found=checkSection12Rules(text);
    const corrections=found.filter(item=>item.kind==="correction").sort((a,b)=>b.span[0]-a.span[0]);
    if(!corrections.length)break;
    const next=corrections.reduce((value,item)=>value.slice(0,item.span[0])+item.suggestion+value.slice(item.span[1]),text);
    if(next===text)break;
    text=next;
  }
  return text;
}
const failures=[];
function expectCorrection(input,expected,id){
  const found=checkSection12Rules(input).filter(item=>newIds.has(item.ruleId));
  const actual=applyRules(input);
  const matching=found.some(item=>item.ruleId===id);
  try{
    assert.equal(actual,expected);
    assert.ok(matching,"expected "+id+" finding");
    assert.ok(found.every(item=>typeof item.explanation==="string"&&item.explanation.length>12),"each correction explains why");
  }catch(error){failures.push({step:"positive-rule-"+id,input,expected,actual,details:error.message});}
}
function expectNoRule(input,id){
  const actual=findings(input,id);
  if(actual.length)failures.push({step:"negative-rule-"+id,input,expected:[],actual:actual.map(x=>({ruleId:x.ruleId,found:x.found,suggestion:x.suggestion}))});
}

const participles=["été","eu","fait","dit","mangé","parlé","pris","vu","voulu","pu","su","fini","donné","trouvé"];
const subjectPronouns=["Il","Elle","On"];
for(const subject of subjectPronouns)for(const form of participles)expectCorrection(subject+" à "+form,subject+" a "+form,"NR-07");
const motionVerbs=["va","vais","vas","allons","allez","vont","suis","es","sommes","êtes"];
for(const verb of motionVerbs)expectCorrection(verb+" a Paris",verb+" à Paris","NR-07");
for(const place of ["la","le","l'","les","Paris","Lagos","l'école","la maison"])expectCorrection("va a "+place,"va à "+place,"NR-07");
for(const follower of ["est","sont","habites","habitez","vas","vais","va","allez","étais","es","peux","puis-je","se trouve","est-ce"])expectCorrection("Ou "+follower,"Où "+follower,"NR-08");
for(const adjective of ["content","contente","fatigué","fatiguée","grand","grande","petit","petite","malade","ici","là","prêt","prête","gentil","gentille","tard","tôt"])expectCorrection("il et "+adjective,"il est "+adjective,"NR-09");
expectCorrection("ce et content","c'est content","NR-09");
expectCorrection("c'et content","c'est content","NR-09");
expectCorrection("c' et content","c'est content","NR-09");
for(const subject of ["ils","elles","ceux","celles"])expectCorrection(subject+" son prêts",subject+" sont prêts","NR-10");
for(const verb of ["va","dépend","marche","fait","suffit","suffira","m'étonne","commence","existe"])expectCorrection("sa "+verb,"ça "+verb,"NR-11");
const masculine=["marché","jardin","magasin","cinéma","restaurant","bureau","musée","parc","théâtre","café","supermarché"];
for(const noun of masculine){
  expectCorrection("à le "+noun,"au "+noun,"NR-12");
  expectCorrection("de le "+noun,"du "+noun,"NR-12");
}
for(const noun of ["enfants","amis","magasins","étudiants","États-Unis"])expectCorrection("à les "+noun,"aux "+noun,"NR-12");
for(const noun of ["enfants","amis","magasins","étudiants"])expectCorrection("de les "+noun,"des "+noun,"NR-12");

for(const input of ["Il a mangé","Il va à Paris","à la maison"])expectNoRule(input,"NR-07");
for(const input of ["thé ou café","Tu viens ou tu restes ?"])expectNoRule(input,"NR-08");
for(const input of ["il et elle","Pierre et Marie sont ici"])expectNoRule(input,"NR-09");
for(const input of ["son père","Ils sont"])expectNoRule(input,"NR-10");
for(const input of ["sa voiture","ça va"])expectNoRule(input,"NR-11");
for(const input of ["de le faire","à le voir","à les voir"])expectNoRule(input,"NR-12");

const multiInput="Il à mangé et elle et fatiguée.";
const multiExpected="Il a mangé et elle est fatiguée.";
const multiOutput=checkWriting(multiInput);
try{
  assert.ok(multiOutput.includes(multiExpected));
  assert.equal((multiOutput.match(/class="fi-result"/g)||[]).length,2);
}catch(error){failures.push({step:"multi-finding-render",input:multiInput,expected:multiExpected,actual:multiOutput,details:error.message});}

const legacyInput="Je suis 20 ans";
const legacyOutput=checkWriting(legacyInput);
try{assert.ok(legacyOutput.includes("J'ai 20 ans"));}catch(error){failures.push({step:"legacy-correction-preserved",input:legacyInput,expected:"J'ai 20 ans",actual:legacyOutput,details:error.message});}


const repeatedPasOutput=checkWriting("Je ne comprends pas pas.");
try{assert.equal((repeatedPasOutput.match(/class="fi-result"/g)||[]).length,1);}catch(error){failures.push({step:"review-finding-deduplication",input:"Je ne comprends pas pas.",expected:"one review finding",actual:repeatedPasOutput,details:error.message});}

const negative="thé ou café";
const negativeOutput=checkWriting(negative);
try{
  assert.match(negativeOutput,/No issue from the small built-in check list was detected/);
  assert.doesNotMatch(negativeOutput,/<p class="fi-output">/);
}catch(error){failures.push({step:"negative-no-issue-preserved",input:negative,expected:"unchanged no-issue message and no correction",actual:negativeOutput,details:error.message});}

const compatSource=readFileSync("features/french-intelligence-compat.mjs","utf8");
const unified=compatSource.slice(compatSource.indexOf("function unifiedCheckWriting"),compatSource.indexOf("function runAction"));
try{
  assert.match(compatSource,/function checkWritingDetailed\(q\)/);
  assert.match(unified,/const legacy=checkWritingDetailed\(q\)/);
  assert.doesNotMatch(unified,/No issue from the small built-in check list was detected/);
}catch(error){failures.push({step:"structured-legacy-flag",input:"checkWritingDetailed",expected:"{ html, hasIssue } with no output-text detection",actual:"static contract failed",details:error.message});}

if(failures.length){
  console.error(JSON.stringify(failures.map(({step,input,expected,actual})=>({step,input,expected,actual})),null,2));
  process.exitCode=1;
}else{
  console.log(JSON.stringify({rules:["NR-07","NR-08","NR-09","NR-10","NR-11","NR-12"],positiveCases:participles.length*subjectPronouns.length+motionVerbs.length+8+14+17+3+4+9+masculine.length*2+5+4,negativeCases:14,multiFindingCount:2,legacyCorrection:"preserved",negativeMessage:"preserved",failures:0}));
  console.log("PASS M2 Writing rules, closed-list negatives, structured legacy flag and combined finding rendering.");
}
