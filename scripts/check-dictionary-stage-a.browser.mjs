import { chromium } from "playwright";
import assert from "node:assert/strict";
import importedData from "../data/dictionary/common-3000.json" with { type: "json" };
import * as compat from "../features/french-intelligence-compat.mjs";

const baseURL=process.env.FRENCH_ACADEMY_URL||"http://127.0.0.1:4173";
const ten=Object.keys(importedData).filter(word=>compat.lookup(word)?.imported).slice(0,10);
const typos=[["bonjor","bonjour"],["maisonn","maison"],["chossir","choisir"],["beacoup","beaucoup"],["etudiant","étudiant"]];
const browser=await chromium.launch({headless:true});
const results=[];
try{
  for(const profile of [
    {name:"desktop",viewport:{width:1365,height:900}},
    {name:"mobile-360",viewport:{width:360,height:800}}
  ]){
    const context=await browser.newContext({viewport:profile.viewport,serviceWorkers:"allow"});
    const page=await context.newPage();
    page.on("pageerror",error=>results.push({profile:profile.name,error:error.message}));
    await page.goto(baseURL,{waitUntil:"networkidle",timeout:30000});
    await page.waitForFunction(()=>!!window.FrenchIntelligenceCore?.lookup,{timeout:20000});
    if(await page.locator("#hfrenchint").count()===0)await page.locator("#lgo").click();
    await page.locator("#hfrenchint").first().click();
    await page.locator('[data-fitab="dict"]').click();
    await page.locator("#fiWord").waitFor({state:"visible",timeout:15000});
    for(const word of ten){
      await page.locator("#fiWord").fill(word);
      await page.locator("#fiLookup").click();
      await page.locator("#fiAnswer .fi-imported-dictionary").waitFor({state:"visible"});
      const text=await page.locator("#fiAnswer").innerText();
      assert.ok(text.includes(word),profile.name+" displays "+word);
      assert.match(text,/Imported entry\. From Wiktionary \(CC BY-SA 4\.0\)\. Not yet reviewed\./);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
      assert.equal(overflow,false,profile.name+" must not scroll horizontally at "+profile.viewport.width+"px");
    }
    const unresolvedTypos=typos.filter(([input])=>!compat.lookup(input));
    assert.ok(unresolvedTypos.length>0,"at least one typo must remain unresolved so the Did-you-mean UI is exercised");
    for(const [input,expected] of typos){
      const existing=compat.lookup(input);
      await page.locator("#fiWord").fill(input);
      await page.locator("#fiLookup").click();
      if(existing){
        await page.locator("#fiAnswer .fi-answer").waitFor({state:"visible"});
        assert.ok((await page.locator("#fiAnswer").innerText()).includes(existing.word),profile.name+" displays recognized entry "+existing.word+" for "+input);
      }else{
        await page.locator("#fiAnswer").getByText("Did you mean").waitFor({state:"visible"});
        assert.ok((await page.locator("#fiAnswer").innerText()).includes(expected),profile.name+" typo "+input+" suggests "+expected);
        assert.ok(await page.locator("#fiAnswer [data-fisuggest]").count()<=5);
      }
    }
    const linkContrast=await page.evaluate(()=>{
      const parse=value=>{const m=value.match(/[\d.]+/g)||[];return m.slice(0,3).map(Number)};
      const luminance=rgb=>{const [r,g,b]=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
      const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      return [...document.querySelectorAll("#lexique-credits a,.fi-wrap a")].map(a=>{
        let node=a,background=[255,255,255];
        while(node&&node!==document.documentElement){const c=getComputedStyle(node).backgroundColor;const rgb=parse(c);if(rgb.length===3&&c!=="rgba(0, 0, 0, 0)"){background=rgb;break;}node=node.parentElement;}
        return {text:a.textContent,ratio:ratio(parse(getComputedStyle(a).color),background)};
      });
    });
    assert.ok(linkContrast.every(x=>x.ratio>=4.5),profile.name+" reference links must meet WCAG AA 4.5:1: "+JSON.stringify(linkContrast));
    results.push({profile:profile.name,importedWords:ten.length,typos:typos.length,linkContrast});
    if(profile.name==="desktop"){
      await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:15000});
      await page.evaluate(()=>navigator.serviceWorker.ready);
      const cached=await page.evaluate(async()=>{
        const cache=await caches.open("fa-v36");
        const response=await cache.match("/data/dictionary/common-3000.json");
        return !!response;
      });
      assert.equal(cached,true,"dictionary JSON is precached in fa-v36");
      await context.setOffline(true);
      await page.reload({waitUntil:"domcontentloaded",timeout:30000});
      await page.waitForFunction(()=>!!window.FrenchIntelligenceCore?.lookup,{timeout:20000});
      if(await page.locator("#hfrenchint").count()===0)await page.locator("#lgo").click();
      await page.locator("#hfrenchint").first().click();
      await page.locator('[data-fitab="dict"]').click();
      await page.locator("#fiWord").waitFor({state:"visible"});
      await page.locator("#fiWord").fill(ten[0]);
      await page.locator("#fiLookup").click();
      await page.locator("#fiAnswer .fi-imported-dictionary").waitFor({state:"visible"});
      results.push({offlineImportedLookup:ten[0],cached});
      await context.setOffline(false);
    }
    await context.close();
  }
  console.log("PASS Stage A browser acceptance: "+JSON.stringify(results));
}finally{await browser.close();}
