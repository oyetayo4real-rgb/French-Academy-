import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const branchURL=process.env.FRENCH_ACADEMY_URL||"http://127.0.0.1:4173";
const mainURL=process.env.MAIN_FRENCH_ACADEMY_URL||"http://127.0.0.1:4174";
const browser=await chromium.launch({headless:true});

async function openWriting(url,viewport){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
  await page.goto(new URL("/tests/fixtures/french-intelligence-compat.html",url).href,{waitUntil:"networkidle"});
  await page.waitForFunction(()=>typeof window.FrenchIntelligenceCore?.checkWriting==="function");
  await page.locator("#hfrenchint").click();
  await page.locator('[data-fitab="correct"]').click();
  return {page,errors};
}
async function check(page,input){
  await page.locator("#fiInput").fill(input);
  await page.locator("#fiCheck").click();
  await page.locator("#fiAnswer").waitFor();
}
async function assertMarksMatch(page,expectedText,label){
  const actual=await page.locator(".fi-highlight-text").textContent();
  assert.equal(actual,expectedText,label+" highlighted text base");
  const marks=await page.locator(".fi-highlight-text mark").evaluateAll(nodes=>nodes.map(node=>({
    text:node.textContent,
    start:Number(node.dataset.start),
    end:Number(node.dataset.end),
    ruleId:node.dataset.ruleId,
    tabIndex:node.tabIndex,
    ariaLabel:node.getAttribute("aria-label")
  })));
  assert.ok(marks.length>0,label+" renders at least one marked span");
  for(const mark of marks){
    assert.equal(mark.text,expectedText.slice(mark.start,mark.end),label+" mark text equals the exact source substring");
    assert.equal(mark.tabIndex,0,label+" marks are keyboard-focusable");
    assert.ok(mark.ariaLabel,label+" marks have accessible names");
  }
  return marks;
}
function luminance(rgb){
  const values=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2));
  return 0.2126*values[0]+0.7152*values[1]+0.0722*values[2];
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
function checkNoHorizontalScroll(page,label){
  return page.evaluate(label=>{
    const client=document.documentElement.clientWidth;
    const scroll=document.documentElement.scrollWidth;
    const body=document.body.scrollWidth;
    if(scroll!==client||body>client)throw new Error(label+" horizontal overflow "+JSON.stringify({client,scroll,body}));
    return {client,scroll,body};
  },label);
}

const legacyRuleCases=[
  {input:"Je suis 20 ans et il et fatigué.",after:"J'ai 20 ans et il et fatigué.",rule:"NR-09"},
  {input:"Je suis faim et il et fatigué.",after:"J'ai faim et il et fatigué.",rule:"NR-09"},
  {input:"Je suis soif et elle et contente.",after:"J'ai soif et elle et contente.",rule:"NR-09"},
  {input:"Sa va et il et content.",after:"Ça va et il et content.",rule:"NR-09"},
  {input:"Beacoup, ils son contents.",after:"Beaucoup, ils son contents.",rule:"NR-10"},
  {input:"Bonjor, Il à mangé.",after:"bonjour, Il à mangé.",rule:"NR-07"}
];

try{
  for(const profile of [
    {name:"desktop",viewport:{width:1280,height:900}},
    {name:"mobile-360",viewport:{width:360,height:800}}
  ]){
    const branch=await openWriting(branchURL,profile.viewport);
    const main=await openWriting(mainURL,profile.viewport);
    const page=branch.page,mainPage=main.page;
    try{
      for(const item of [
        {input:"Je leurs ai dit",found:"leurs",suggestion:"leur",rule:"NR-03"},
        {input:"un beau homme",found:"beau",suggestion:"bel",rule:"NR-05"},
        {input:"Il à mangé",found:"à",suggestion:"a",rule:"NR-07"},
        {input:"Nous allons à le marché",found:"à le",suggestion:"au",rule:"NR-12"}
      ]){
        await check(page,item.input);
        await assertMarksMatch(page,item.input,profile.name+" "+item.rule);
        assert.ok(await page.locator(".fi-finding").filter({hasText:item.explanation||item.found}).count()>=0);
        assert.equal(await page.locator(".fi-apply").count(),1,profile.name+" "+item.rule+" correction has one Apply button");
        const button=page.getByRole("button",{name:"Apply: "+item.found+" to "+item.suggestion});
        await button.waitFor();
        assert.equal(await button.innerText(),"Apply");
        assert.ok(await button.evaluate(node=>node.getAttribute("aria-label")==="Apply: "+item.found+" to "+item.suggestion));
        if(profile.name==="mobile-360")await checkNoHorizontalScroll(page,item.rule);
      }

      for(const item of legacyRuleCases){
        await check(page,item.input);
        assert.equal(await page.locator(".fi-highlight-block b").innerText(),"Text after the first fix",
          profile.name+" "+item.rule+" labels the post-legacy text");
        const marks=await assertMarksMatch(page,item.after,profile.name+" legacy+ "+item.rule);
        assert.ok(marks.some(mark=>mark.ruleId===item.rule),profile.name+" "+item.rule+" finding is highlighted after legacy correction");
        if(profile.name==="mobile-360")await checkNoHorizontalScroll(page,"legacy+ "+item.rule);
      }

      const twoFinding="Il à mangé et elle et fatiguée.";
      await check(page,twoFinding);
      await assertMarksMatch(page,twoFinding,profile.name+" two findings");
      assert.equal(await page.locator(".fi-apply").count(),2,profile.name+" two-finding input has two Apply buttons");
      await page.getByRole("button",{name:"Apply: à to a"}).click();
      const once="Il a mangé et elle et fatiguée.";
      assert.equal(await page.locator("#fiInput").inputValue(),once,profile.name+" first Apply changes only its own span");
      await assertMarksMatch(page,once,profile.name+" second finding remains after first Apply");
      assert.equal(await page.locator(".fi-apply").count(),1,profile.name+" exactly one finding remains");
      await page.getByRole("button",{name:"Apply: et to est"}).click();
      assert.equal(await page.locator("#fiInput").inputValue(),"Il a mangé et elle est fatiguée.",profile.name+" second Apply fixes remaining span");
      assert.equal(await page.locator(".fi-apply").count(),0,profile.name+" no findings remain after both Apply actions");

      const xss='<script>alert(1)</script> Je leurs ai dit';
      await check(page,xss);
      await assertMarksMatch(page,xss,profile.name+" XSS");
      assert.equal(await page.locator("#fiAnswer script").count(),0,profile.name+" XSS input creates no script element");
      assert.equal(await page.evaluate(()=>window.__m3XssExecuted===true),false,profile.name+" XSS input executes no script");
      assert.ok((await page.locator("#fiAnswer").innerText()).includes(xss),profile.name+" XSS input is shown as literal text");

      const quoted='Je leurs ai dit & "bonjour"';
      await check(page,quoted);
      await assertMarksMatch(page,quoted,profile.name+" ampersand and quotes");
      assert.ok((await page.locator("#fiAnswer").innerText()).includes('& "bonjour"'),profile.name+" ampersand and quotes remain visible text");

      await check(page,"Je leurs ai dit");
      const accessibility=await page.evaluate(()=>{
        const mark=document.querySelector(".fi-highlight-text mark");
        const button=document.querySelector(".fi-apply");
        const markRect=mark.getBoundingClientRect(),buttonRect=button.getBoundingClientRect();
        const styles=getComputedStyle(mark);
        return {
          markTabIndex:mark.tabIndex,markLabel:mark.getAttribute("aria-label"),
          buttonTabIndex:button.tabIndex,buttonLabel:button.getAttribute("aria-label"),
          markWidth:markRect.width,markHeight:markRect.height,
          buttonWidth:buttonRect.width,buttonHeight:buttonRect.height,
          background:styles.backgroundColor,foreground:styles.color,underline:styles.textDecorationColor
        };
      });
      assert.equal(accessibility.markTabIndex,0,profile.name+" mark keyboard focus");
      assert.equal(accessibility.buttonTabIndex,0,profile.name+" Apply keyboard focus");
      assert.equal(accessibility.buttonLabel,"Apply: leurs to leur",profile.name+" exact accessible Apply name");
      assert.ok(accessibility.markLabel,profile.name+" mark accessible name");
      if(profile.name==="mobile-360"){
        assert.ok(accessibility.markWidth>=44&&accessibility.markHeight>=44,"360px mark target at least 44x44");
        assert.ok(accessibility.buttonWidth>=44&&accessibility.buttonHeight>=44,"360px Apply target at least 44x44");
        await checkNoHorizontalScroll(page,"360px accessibility state");
      }
      for(const theme of ["light","dark"]){
        const colors=await page.evaluate(theme=>{
          document.documentElement.dataset.theme=theme;
          const mark=document.querySelector(".fi-highlight-text mark"),style=getComputedStyle(mark);
          return {background:style.backgroundColor,foreground:style.color,underline:style.textDecorationColor};
        },theme);
        assert.ok(contrast(colors.foreground,colors.background)>=4.5,profile.name+" "+theme+" highlight text contrast WCAG AA");
        assert.ok(contrast(colors.underline,colors.background)>=4.5,profile.name+" "+theme+" underline contrast");
      }
      const mark=page.locator(".fi-highlight-text mark").first();
      await mark.focus();
      assert.equal(await page.evaluate(()=>document.activeElement.tagName),"MARK",profile.name+" keyboard focus reaches mark");

      for(const input of ["thé ou café","Je suis 20 ans"]){
        await check(page,input);await check(mainPage,input);
        assert.equal(await page.locator("#fiAnswer").innerHTML(),await mainPage.locator("#fiAnswer").innerHTML(),
          profile.name+" "+JSON.stringify(input)+" remains byte-identical to main");
      }
      assert.deepEqual(branch.errors,[],profile.name+" branch browser errors");
      assert.deepEqual(main.errors,[],profile.name+" main browser errors");
      console.log("PASS M3 Writing highlights "+profile.name+": rule spans, Apply isolation, legacy-first spans, XSS, contrast, keyboard and parity.");
    }finally{await page.close();await mainPage.close();}
  }

  const sw=readFileSync("sw.js","utf8");
  assert.match(sw,/const V="fa-v26"/,"service-worker cache version bumped");
  assert.doesNotMatch(sw,/fa-v25/,"old cache version removed");
  for(const path of ["/index.html","/features/french-intelligence-compat.mjs","/features/french-section12-rules.mjs"]){
    assert.ok(sw.includes('"'+path+'"'),"service-worker precaches "+path);
  }
  console.log("PASS M3 service-worker cache v26 precaches index, compatibility renderer and Section 12 rules.");
  console.log("PASS M3 Part B: desktop/mobile Chromium; NR-03/05/07/12; six legacy-first cases; two Apply actions; XSS; no-issue and legacy-only byte parity.");
}finally{await browser.close();}
