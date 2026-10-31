import assert from "node:assert/strict";
import { chromium } from "playwright";
import { conjugate } from "../features/french-intelligence-core-v1.mjs";

const baseURL=process.env.FRENCH_ACADEMY_URL||"http://127.0.0.1:4173";
const browser=await chromium.launch({headless:true});
const cases=["parler","aimer","habiter","aller"];
const tenses=["imparfait","futur","conditionnel","passé composé"];
try{
  for(const profile of [{name:"desktop",viewport:{width:1280,height:900}},{name:"mobile-360",viewport:{width:360,height:800}}]){
    const page=await browser.newPage({viewport:profile.viewport});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
    await page.goto(new URL("/tests/fixtures/french-intelligence-compat.html",baseURL).href,{waitUntil:"networkidle"});
    await page.locator("#hfrenchint").click();
    await page.locator('[data-fitab="verbs"]').click();
    const selector=page.locator("#fiTense");
    const initialTop=await selector.evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
    for(const verb of cases){
      await page.locator("#fiVerb").fill(verb);
      for(const tense of tenses){
        await selector.selectOption(tense);
        await page.locator("#fiConjugate").click();
        const expected=conjugate(verb,{tense});
        const answer=page.locator("#fiAnswer");
        await answer.locator("h3").waitFor();
        assert.equal(await answer.locator("h3").innerText(),verb+" · "+tense,profile.name+" heading "+verb+" "+tense);
        const badge=expected.source==="lexique-verified"?"Verified":"Rule-based";
        assert.equal(await answer.locator(".fi-status").innerText(),badge,profile.name+" badge "+verb+" "+tense);
        const footer=expected.source==="lexique-verified"?"Checked against Lexique 3.83.":"Standard conjugation rule; not yet checked against Lexique.";
        assert.equal(await answer.locator(".fi-conjugation-footer").innerText(),footer,profile.name+" footer "+verb+" "+tense);
        assert.equal(await answer.locator("tbody tr").count(),6,profile.name+" six pronoun rows");
        const rowPronouns=await answer.locator("tbody th").allTextContents();
        const rowForms=await answer.locator("tbody td").allTextContents();
        const expectedPronouns=["je","tu","il / elle / on","nous","vous","ils / elles"];
        if(verb==="aimer"||verb==="habiter"||(tense==="passé composé"&&verb!=="aller"))expectedPronouns[0]="j'";
        assert.deepEqual(rowPronouns,expectedPronouns,profile.name+" pronoun/elision column "+verb+" "+tense);
        assert.equal(rowForms.length,6,profile.name+" six conjugated forms");
        assert.doesNotMatch(rowForms.join(" "),/\b(?:je|tu|nous|vous)\s/i,profile.name+" forms must not duplicate row pronouns");
        assert.doesNotMatch(await answer.innerText(),/Only tenses cross-checked against the local Lexique|No account or API key is used/);
        assert.equal(await answer.locator("thead").count(),0,"No separate je / j' column header");
        if(verb==="aimer")assert.match(rowForms[0],/^(?:aim|ai)/,"aimer elides je before a vowel, including the auxiliary ai");
        if(verb==="habiter")assert.match(rowForms[0],/^(?:habit|ai)/,"habiter uses mute-h elision or elides before the auxiliary ai");
        if(verb==="aller"&&tense==="passé composé"){
          assert.deepEqual(rowForms,["suis allé(e)","es allé(e)","est allé / est allée / est allé(e)","sommes allé(e)s","êtes allé(e)(s)","sont allés / sont allées"]);
        }
        const heights=await answer.locator("tbody tr").evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().height));
        assert.ok(heights.every(height=>height>=44),profile.name+" tap target row height >=44px");
        const afterTop=await selector.evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
        assert.ok(Math.abs(afterTop-initialTop)<1,profile.name+" tense selector remains in the same document position");
        if(profile.name==="mobile-360"){
          const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,overflow:[...document.querySelectorAll("body *")].map(el=>({tag:el.tagName,id:el.id,cls:typeof el.className==="string"?el.className:"",right:Math.round(el.getBoundingClientRect().right*10)/10,width:Math.round(el.getBoundingClientRect().width*10)/10})).filter(el=>el.right>document.documentElement.clientWidth+0.5).slice(0,12)}));
          assert.ok(widths.scroll<=widths.client&&widths.body<=widths.client,JSON.stringify(widths)+" no horizontal scroll at 360px");
        }
      }
    }
    assert.deepEqual(errors,[],profile.name+" browser errors");
    await page.close();
    console.log("PASS M2 conjugation display "+profile.name+" ("+cases.length+" verbs × "+tenses.length+" tenses)");
  }
  console.log("PASS M2 conjugation layout, elision, agreement, exact footers, badges, 44px rows, selector stability and 360px overflow checks.");
}finally{await browser.close();}
