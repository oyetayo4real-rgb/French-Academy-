#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT=process.cwd();
const INPUT=path.join(ROOT,"data/dictionary/common-3000.json");
const MARKDOWN=path.join(ROOT,"docs/dictionary-review-top300.md");
const CSV=path.join(ROOT,"docs/dictionary-review-top300.csv");
const data=JSON.parse(fs.readFileSync(INPUT,"utf8"));
const entries=Object.entries(data).slice(0,300);

function clean(value){
  return String(value??"").replace(/\s+/g," ").trim().replace(/\|/g,"\\|");
}
function groupMeanings(group,meta){
  const raw=Array.isArray(group.meanings)&&group.meanings.length
    ?group.meanings
    :Array.isArray(group.senses)&&group.senses.length
      ?group.senses
      :Array.isArray(meta.senses)?meta.senses:[];
  return raw.map(item=>typeof item==="string"?item:item?.meaning||item?.gloss||"").filter(Boolean);
}
function csv(value){
  const text=String(value??"");
  return '"'+text.replace(/"/g,'""')+'"';
}
const markdown=[
  "# French Dictionary — Top 300 Human Review",
  "",
  "Generated from the current Stage A dataset. Every entry is pending independent human review; this file does not imply teacher approval.",
  "",
  "Entries: "+entries.length,
  ""
];
const csvRows=[["headword","primary_pos","gender","primary_meaning","all_senses","pos_groups","review_status"]];
entries.forEach(([word,entry],index)=>{
  const meta=entry[4]||{};
  const groups=Array.isArray(meta.posGroups)?meta.posGroups:[];
  const senses=(meta.senses||[]).map(item=>item?.meaning||"").filter(Boolean);
  const groupLines=groups.map(group=>{
    const meanings=groupMeanings(group,meta);
    const forms=group.forms||{};
    const formParts=[];
    if((forms.feminine||[]).length)formParts.push("feminine: "+forms.feminine.join(", "));
    if((forms.plural||[]).length)formParts.push("plural: "+forms.plural.join(", "));
    return String(group.pos||"") + ": " + meanings.join("; ") + (formParts.length?" ["+formParts.join("; ")+"]":"");
  });
  markdown.push(
    "## "+String(index+1).padStart(3,"0")+". "+clean(word),
    "- **Part of speech:** "+clean(entry[1]),
    "- **Gender:** "+clean(meta.gender||"—"),
    "- **Primary meaning:** "+clean(entry[0]),
    "- **Senses:** "+clean(senses.join("; ")||entry[0]),
    ...groupLines.map(line=>"- **POS group:** "+clean(line)),
    "- **Review status:** Pending human review",
    ""
  );
  if(index!==entries.length-1)markdown.push("---","");
  csvRows.push([
    word,entry[1],meta.gender||"",entry[0],senses.join(" | "),
    groupLines.join(" || "),"pending-human-review"
  ]);
});
fs.mkdirSync(path.dirname(MARKDOWN),{recursive:true});
fs.writeFileSync(MARKDOWN,markdown.join("\n").trimEnd()+"\n","utf8");
fs.writeFileSync(CSV,csvRows.map(row=>row.map(csv).join(",")).join("\r\n")+"\r\n","utf8");
console.log("REVIEW PACK GENERATED: "+JSON.stringify({
  entries:entries.length,
  markdown:path.relative(ROOT,MARKDOWN),
  csv:path.relative(ROOT,CSV),
  status:"pending-human-review"
}));
