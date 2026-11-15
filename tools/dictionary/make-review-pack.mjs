#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const ROOT=process.cwd();
const INPUT=path.join(ROOT,"data/dictionary/common-3000.json");
const MARKDOWN=path.join(ROOT,"docs/dictionary-review-top300.md");
const CSV=path.join(ROOT,"docs/dictionary-review-top300.csv");
const data=JSON.parse(fs.readFileSync(INPUT,"utf8"));
const entries=Object.entries(data).slice(0,300);
const clean=value=>String(value??"").replace(/\s+/g," ").trim().replace(/\|/g,"\\|");
const csv=value=>'"'+String(value??"").replace(/"/g,'""')+'"';
const groupMeanings=group=>(group.meanings||[]).map(item=>typeof item==="string"?item:item?.meaning||"").filter(Boolean);
const markdown=["# French Dictionary — Top 300 Human Review","","Generated from the current Stage A dataset. Each block is pending independent human review; no entry is represented as teacher-approved.","","Index: batches contain 25 entries each. Use the matching rank in the CSV when returning corrections.",""];
const csvRows=[["rank","headword","pos","gender","meanings","flags","review_status"]];
entries.forEach(([word,entry],index)=>{
 const rank=index+1,meta=entry[4]||{},groups=Array.isArray(meta.posGroups)?meta.posGroups:[];
 if((rank-1)%25===0)markdown.push("## Batch "+String(Math.floor((rank-1)/25)+1).padStart(2,"0")+" — entries "+rank+"–"+Math.min(rank+24,entries.length),"");
 const groupLines=groups.map(group=>{
  const pos=String(group.pos||""),forms=pos==="noun"||pos==="adjective"?group.forms||{}:{};
  const details=[];
  if((forms.feminine||[]).length)details.push("feminine: "+forms.feminine.join(", "));
  if((forms.plural||[]).length)details.push("plural: "+forms.plural.join(", "));
  if(pos==="verb")details.push("See the Conjugate tool for forms");
  return pos+": "+groupMeanings(group).slice(0,3).join("; ")+(details.length?" ["+details.join("; ")+"]":"");
 });
 const allMeanings=groups.flatMap(groupMeanings).slice(0,5),flags=[];
 if(meta.status==="curated-draft")flags.push("curated-draft");
 for(const sense of meta.senses||[])for(const label of sense.registerTags||[])if(!flags.includes(label))flags.push(label);
 if((meta.forms?.feminine||[]).length)flags.push("feminine-forms");
 if((meta.forms?.plural||[]).length)flags.push("plural-forms");
 markdown.push("### "+String(rank).padStart(3,"0")+". "+clean(word),"- **Part of speech:** "+clean(entry[1]),"- **Gender:** "+clean(meta.gender||"—"),"- **Primary meaning:** "+clean(entry[0]),...groupLines.map(line=>"- **POS group:** "+clean(line)),"- **Review:** OK: __________","- **Correction:** Fix: __________","");
 if(rank!==entries.length)markdown.push("---","");
 csvRows.push([rank,word,entry[1],meta.gender||"",allMeanings.join(" | "),flags.join("; ")||"none","pending-human-review"]);
});
fs.mkdirSync(path.dirname(MARKDOWN),{recursive:true});
fs.writeFileSync(MARKDOWN,markdown.join("\n").trimEnd()+"\n","utf8");
fs.writeFileSync(CSV,csvRows.map(row=>row.map(csv).join(",")).join("\r\n")+"\r\n","utf8");
console.log("REVIEW PACK GENERATED: "+JSON.stringify({entries:entries.length,batches:Math.ceil(entries.length/25),markdown:path.relative(ROOT,MARKDOWN),csv:path.relative(ROOT,CSV),status:"pending-human-review"}));
