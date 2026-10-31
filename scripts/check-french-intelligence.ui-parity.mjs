import assert from "node:assert/strict";
import { chromium } from "playwright";
const baseURL=process.env.FRENCH_ACADEMY_URL||"http://127.0.0.1:4173";
const routes={legacy:"/tests/fixtures/french-intelligence-legacy.html",compat:"/tests/fixtures/french-intelligence-compat.html"};
const DELIBERATE_DIFFERENCES={
 "age-substring-guard":{reason:"Age explanations require a whole-word age term and an actual age question; substrings in message and dans no longer trigger the age answer.",examples:["What is the best way to learn the language?","How do I write a message?","Comment utiliser dans et en ?"]},
 "conjugation-table":{reason:"Only explicit table paradigms or the reviewed regular -er class are accepted; listed non-verbs no longer receive guessed suffix forms.",examples:["connaître","acheter","envoyer","hier","hiver","super","livre","noir","mère"]},
 "dictionary-notes":{reason:"The pays and enfant entries now state the specified grammatical gender and article usage.",examples:["pays","enfant"]},
 "writing-capitalization":{reason:"Sentence-initial capitalization is preserved in corrections and hyphenated compounds are protected.",examples:["Je suis 20 ans","Sa va bien","Son va-et-vient constant m'inquiète."]},
 "section12-writing":{reason:"The compatibility Writing checker now displays reviewed Section 12 findings from the structured core after the unchanged legacy first pass.",examples:["Je leurs ai dit de partir","un vieux homme","Elle est tout contente","s'elle vient","des gens intéressantes"]},
 "conjugate-selector":{reason:"The Conjugate panel exposes Lexique-verified and rule-generated imparfait, futur, conditionnel and passé composé choices, labels rule-generated output, and preserves the default present output.",examples:["present","imparfait","futur","conditionnel","passé composé"]},
 "translation-coverage":{reason:"French-to-English output is emitted only when phrase patterns cover every word; incomplete coverage is ambiguous and does not assemble a sentence.",examples:["Je suis étudiant","Bonjour madame","J’ai besoin d’aide"]}
};
const browser=await chromium.launch({headless:true}),pages={};let compared=0,differences=0;const intentional=[],details=[];
async function snapshot(page,normalizeLegacy=false){return page.evaluate((normalizeLegacy)=>{const app=document.querySelector("#app");app?.querySelectorAll("details").forEach(details=>{details.open=true;});const active=document.activeElement;let visibleText=(app?.textContent||"").replace(/\s+/g," ").trim();let innerHTML=(app?.innerHTML||"").replace(/>\s+</g,"><").replace(/\s+/g," ").replace(/=\s*"([^"]*)"/g,'="$1"').trim();if(normalizeLegacy){visibleText=visibleText.split("Il faut ne pas oublier.").join("J'ai décidé de ne pas partir.");innerHTML=innerHTML.split("Il faut ne pas oublier.").join("J'ai décidé de ne pas partir.");}return{visibleText,innerHTML,activeElement:active?.id||active?.getAttribute("data-fitab")||active?.getAttribute("data-fiprompt")||active?.tagName||""};},normalizeLegacy);}
function firstDifferenceSegment(legacyText,newText){let index=0;const shared=Math.min(legacyText.length,newText.length);while(index<shared&&legacyText[index]===newText[index])index++;const start=Math.max(0,index-30);return{index,legacy:legacyText.slice(start,start+60),new:newText.slice(start,start+60)};}
async function compareState(label,category=null){
 const pairs=[["desktop",pages.legacy,pages.compat],["mobile",pages.mobileLegacy,pages.mobileCompat]];
 for(const [profile,legacyPage,compatPage] of pairs){
  const [a,b]=await Promise.all([snapshot(legacyPage,true),snapshot(compatPage,false)]);compared++;
  if(a.visibleText!==b.visibleText||a.innerHTML!==b.innerHTML||a.activeElement!==b.activeElement){
   const allowed=(Array.isArray(category)?category:[category]).filter(key=>key&&DELIBERATE_DIFFERENCES[key]);
   if(allowed.length){for(const key of allowed)intentional.push({label,profile,category:key,reason:DELIBERATE_DIFFERENCES[key].reason});}
   else{differences++;details.push({label,profile,firstDifferingSegment:{text:firstDifferenceSegment(a.visibleText,b.visibleText),html:firstDifferenceSegment(a.innerHTML,b.innerHTML)},activeElement:{legacy:a.activeElement,new:b.activeElement}});}
  }
 }
}
async function clickTab(page,tab){await page.locator('[data-fitab="'+tab+'"]').click();}
async function assertCompatText(pattern,label){
 for(const [profile,page] of [["desktop",pages.compat],["mobile",pages.mobileCompat]]){
  const text=await page.locator("#app").evaluate(app=>{app.querySelectorAll("details").forEach(details=>{details.open=true;});return app.textContent||"";});
  assert.match(text,pattern,profile+": "+label);
 }
}
try{
 for(const [name,path] of Object.entries(routes)){
  for(const [profile,viewport] of [["desktop",{width:1280,height:900}],["mobile",{width:390,height:844}]]){
   const key=profile==="desktop"?name:"mobile"+name[0].toUpperCase()+name.slice(1);
   const page=await browser.newPage({viewport});pages[key]=page;const errors=[];
   page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
   await page.goto(new URL(path,baseURL).href,{waitUntil:"networkidle"});
   await page.waitForFunction(()=>{const a=window.FrenchIntelligenceCore;return !!a&&["lookup","translate","conjugate","answerQuestion","checkWriting"].every(k=>typeof a[k]==="function");});
   await page.locator("#hfrenchint").click();await page.getByRole("heading",{name:/French Intelligence/}).waitFor();
   assert.deepEqual(errors,[],profile+" "+name+" engine browser errors");
  }
 }
 await compareState("initial ask tab");
 for(const p of Object.values(pages))await clickTab(p,"verbs");
 for(const p of [pages.compat,pages.mobileCompat])assert.equal(await p.locator("#fiTense").inputValue(),"present","Conjugate selector defaults to present");
 await compareState("conjugate selector defaults to present","conjugate-selector");
 const asks=["Explain ne … pas","When do I use tu and vous?","Explain passé composé","Why is maison feminine?","What is the best way to learn the language?","How do I write a message?","Comment utiliser dans et en ?","How do I say my age?"];
 for(const q of asks){for(const p of Object.values(pages))await clickTab(p,"ask");for(const p of Object.values(pages)){await p.locator("#fiInput").fill(q);await p.locator("#fiAsk").click();}const category=["What is the best way to learn the language?","How do I write a message?","Comment utiliser dans et en ?"].includes(q)?"age-substring-guard":null;await compareState("ask input "+JSON.stringify(q),category);if(category)await assertCompatText(/I can answer|I couldn't match|Try asking/i,"non-age question uses normal fallback");}
 const dictionary=["bonjour","école","s'il vous plaît","amour","unknown-word-xyz","pays","enfant"];
 for(const q of dictionary){for(const p of Object.values(pages))await clickTab(p,"dict");for(const p of Object.values(pages)){await p.locator("#fiWord").fill(q);await p.locator("#fiLookup").click();}await compareState("dictionary input "+JSON.stringify(q),["pays","enfant"].includes(q)?"dictionary-notes":null);if(q==="pays")await assertCompatText(/Always masculine: un pays/,"pays usage note");if(q==="enfant")await assertCompatText(/same for boys and girls/,"enfant usage note");}
 const translations=["Bonjour","Merci","Thank you","Je suis étudiant","unknown phrase xyz","J’ai besoin d’aide","Je suis fatiguée.","Bonjour madame"];
 for(const q of translations){for(const p of Object.values(pages))await clickTab(p,"translate");for(const p of Object.values(pages)){await p.locator("#fiInput").fill(q);await p.locator("#fiTranslate").click();}await compareState("French-to-English input "+JSON.stringify(q),"translation-coverage");if(q==="Je suis étudiant"){await assertCompatText(/Ambiguous — no full translation offered/,"partial translation must be ambiguous");assert.doesNotMatch(await pages.compat.locator("#fiAnswer").innerText(),/I am student/);}}
 const verbs=["être","avoir","aller","faire","venir","prendre","pouvoir","vouloir","devoir","savoir","dire","écrire","lire","boire","dormir","partir","sortir","mettre","recevoir","ouvrir","croire","courir","connaître","comprendre","apprendre","surprendre","reprendre","voir","vivre","suivre","tenir","obtenir","devenir","revenir","retenir","mourir","promettre","permettre","remettre","conduire","envoyer","acheter","lever","préférer","espérer","appeler","jeter","payer","voyager","changer","partager","ranger","lancer","placer","avancer","finir","choisir","réussir","grandir","remplir","obéir","réfléchir","vendre","attendre","entendre","répondre","perdre","rendre","descendre","parler","manger","commencer","hiver","super","hier","soir","livre","noir","mère"];
 const newVerbs=new Set(["connaître","comprendre","apprendre","surprendre","reprendre","voir","vivre","suivre","tenir","obtenir","devenir","revenir","retenir","mourir","promettre","permettre","remettre","conduire","envoyer","acheter","lever","préférer","espérer","appeler","jeter","payer","voyager","changer","partager","ranger","lancer","placer","avancer","hiver","super","hier","soir","livre","noir","mère"]);
 for(const v of verbs){for(const p of Object.values(pages))await clickTab(p,"verbs");for(const p of Object.values(pages)){await p.locator("#fiVerb").fill(v);await p.locator("#fiConjugate").click();}await compareState("conjugation input "+JSON.stringify(v),["conjugate-selector",newVerbs.has(v)?"conjugation-table":null]);if(["hiver","super","hier","soir","livre","noir","mère"].includes(v))await assertCompatText(/No conjugation pattern is available/,"non-verb rejected: "+v);}
 const writing=["Bonjour.","sa va","je sui fatigue","Merci beaucoup","<img src=x onerror=alert(1)>","Je suis 20 ans","Sa va bien","Son va-et-vient constant m'inquiète.","Je leurs ai dit de partir","un vieux homme","Elle est tout contente","s'elle vient","des gens intéressantes","Je leur ai dit","un vieil homme","Elle est toute contente","des gens intéressants"];
 for(const q of writing){for(const p of Object.values(pages))await clickTab(p,"correct");for(const p of Object.values(pages)){await p.locator("#fiInput").fill(q);await p.locator("#fiCheck").click();}const section12=["Je leurs ai dit de partir","un vieux homme","Elle est tout contente","s'elle vient","des gens intéressantes"].includes(q);const category=section12?"section12-writing":["sa va","Je suis 20 ans","Sa va bien"].includes(q)?"writing-capitalization":null;await compareState("writing input "+JSON.stringify(q),category);if(q==="Je suis 20 ans")await assertCompatText(/J'ai 20 ans/,"capitalized age correction");if(q==="Sa va bien")await assertCompatText(/Ça va bien/,"capitalized ça correction");if(q==="Son va-et-vient constant m'inquiète.")await assertCompatText(/No issue from the small built-in check list/,"va-et-vient remains uncorrected");if(q==="Je leurs ai dit de partir")await assertCompatText(/Je leur ai dit de partir/,"NR-03 correction");if(q==="un vieux homme")await assertCompatText(/un vieil homme/,"NR-05 correction");if(q==="Elle est tout contente")await assertCompatText(/Elle est toute contente/,"NR-04 correction");if(q==="s'elle vient")await assertCompatText(/si elle vient/,"NR-06 correction");if(q==="des gens intéressantes"){await assertCompatText(/Grammar note/,"NR-02 review note");assert.equal(await pages.compat.locator("#fiAnswer .fi-output").count(),0,"NR-02 must be review-only");}if(["Je leur ai dit","un vieil homme","Elle est toute contente","des gens intéressants"].includes(q))await assertCompatText(/No issue from the small built-in check list was detected/,"Section 12 negative remains unchanged");}
 for(const p of Object.values(pages))await clickTab(p,"grammar");await compareState("grammar tab open");
 for(const q of ["","negation","verb","past","agreement","conditional","nonexistent-rule"]){for(const p of Object.values(pages))await p.locator("#fiRuleSearch").fill(q);await compareState("grammar filter "+JSON.stringify(q));if(q==="negation"){await assertCompatText(/J'ai décidé de ne pas partir/,"new negation example");const legacyText=await pages.legacy.locator("#app").evaluate(app=>{app.querySelectorAll("details").forEach(details=>{details.open=true;});return app.textContent||"";});assert.match(legacyText,/Il faut ne pas oublier\./,"legacy negation example");}}
 for(const p of Object.values(pages)){await clickTab(p,"ask");await p.locator("#fiHome").focus();await p.keyboard.press("Tab");}await compareState("keyboard Tab focus from home button");
 for(const p of Object.values(pages))await p.keyboard.press("Enter");await compareState("keyboard Enter activates focused tab");
 for(const p of Object.values(pages)){await clickTab(p,"dict");await p.locator("#fiWord").fill("bonjour");await p.locator("#fiWord").press("Enter");}await compareState("keyboard Enter submits dictionary lookup");
 for(const p of Object.values(pages))await p.locator("#fiHome").click();await compareState("back-to-home");
 if(differences){console.error("UNAPPROVED CHECKPOINT DETAILS "+JSON.stringify(details,null,2));}
 assert.equal(differences,0,"unlisted legacy/compat UI differences must fail");
 console.log("PASS browser UI parity: checkpoints="+compared+" unapproved_differences="+differences+" intentional_differences="+intentional.length);
 console.log("DELIBERATE DIFFERENCE LEDGER "+JSON.stringify({categories:DELIBERATE_DIFFERENCES,observed:intentional},null,2));
}catch(error){console.error("FAIL browser UI parity: checkpoints="+compared+" unapproved_differences="+differences+" intentional_differences="+intentional.length);throw error;}finally{await browser.close();}
