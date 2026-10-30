function add(entries,path,input,output){entries.push({path,input,output});}
export function collectOutputEntries(inventory){
 const e=[];
 for(let i=0;i<(inventory.dictionary||[]).length;i++)for(let j=0;j<inventory.dictionary[i].variants.length;j++){const x=inventory.dictionary[i].variants[j];add(e,"inventory.dictionary["+i+"].variants["+j+"].output",x.input,x.output);}
 const p=inventory.phrasebook||{};
 for(let i=0;i<(p.englishToFrench||[]).length;i++){const x=p.englishToFrench[i];add(e,"inventory.phrasebook.englishToFrench["+i+"].output",x.key,x.output);}
 for(let i=0;i<(p.frenchToEnglish||[]).length;i++){const x=p.frenchToEnglish[i];add(e,"inventory.phrasebook.frenchToEnglish["+i+"].output",x.key,x.output);}
 for(let i=0;i<(p.regexPatterns||[]).length;i++){const x=p.regexPatterns[i];add(e,"inventory.phrasebook.regexPatterns["+i+"].frEnOutput",x.sample,x.frEnOutput);add(e,"inventory.phrasebook.regexPatterns["+i+"].enFrOutput",x.englishHint,x.enFrOutput);}
 for(let i=0;i<(p.unsupported||[]).length;i++){const x=p.unsupported[i];add(e,"inventory.phrasebook.unsupported["+i+"].enFrOutput",x.input,x.enFrOutput);add(e,"inventory.phrasebook.unsupported["+i+"].frEnOutput",x.input,x.frEnOutput);}
 const c=inventory.conjugation||{};
 for(let i=0;i<(c.verbs||[]).length;i++){const x=c.verbs[i];add(e,"inventory.conjugation.verbs["+i+"].output",x.verb,x.output);}
 for(let i=0;i<(c.unsupported||[]).length;i++){const x=c.unsupported[i];add(e,"inventory.conjugation.unsupported["+i+"].output",x.verb,x.output);}
 for(let i=0;i<(inventory.grammar||[]).length;i++){const x=inventory.grammar[i];add(e,"inventory.grammar["+i+"].output",x.title,x.output);}
 for(const group of ["clean","hardNegative","knownErrors"]){const rows=inventory.checkWriting?.[group]||[];for(let i=0;i<rows.length;i++){const x=rows[i];add(e,"inventory.checkWriting."+group+"["+i+"].output",x.sentence,x.output);}}
 for(let i=0;i<(inventory.edgeInputs||[]).length;i++){const x=inventory.edgeInputs[i];for(const method of ["lookup","translateEnFr","translateFrEn","conjugate","answerQuestion","checkWriting"])add(e,"inventory.edgeInputs["+i+"].outputs."+method,x.input,x.outputs[method]);}
 for(const group of ["answerQuestions","translateCoverage","checkWritingCases"]){const rows=inventory[group]||[];for(let i=0;i<rows.length;i++){const x=rows[i];add(e,"inventory."+group+"["+i+"].output",x.input,x.output);}}
 return e.sort((a,b)=>a.path.localeCompare(b.path));
}
export function categoryFor(path){
 if(path.includes("dictionary")||path.endsWith(".outputs.lookup"))return "dictionary";
 if(path.includes("conjugation")||path.endsWith(".outputs.conjugate"))return "conjugation";
 if(path.includes("phrasebook")||path.includes("translateCoverage")||path.endsWith(".outputs.translateEnFr")||path.endsWith(".outputs.translateFrEn"))return "translation";
 if(path.includes("answerQuestions")||path.endsWith(".outputs.answerQuestion"))return "age-question";
 if(path.includes("grammar"))return "grammar";
 if(path.includes("checkWriting")||path.includes("writingCases")||path.endsWith(".outputs.checkWriting"))return "writing";
 return "edge";
}
export function reasonFor(path,input,oldOutput,newOutput){
 const s=String(input??"");
 if(path.includes("dictionary")&&(s.toLocaleLowerCase("fr")==="pays"||s.toLocaleLowerCase("fr")==="enfant"))return "Correct the requested noun gender and usage note for this dictionary entry.";
 if(path.endsWith(".outputs.answerQuestion")||path.includes("answerQuestions"))return "Use whole-word age terms and require a specific age-related question; avoid substring false positives.";
 if(path.includes("conjugation")||path.endsWith(".outputs.conjugate"))return newOutput===null?"Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.":"Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.";
 if(path.includes("phrasebook")||path.includes("translateCoverage")||path.endsWith(".outputs.translateFrEn"))return "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.";
 if(path.includes("grammar"))return "Replace the infinitive-negation example with J'ai décidé de ne pas partir.";
 if(path.includes("checkWriting")||path.includes("writingCases")||path.endsWith(".outputs.checkWriting"))return "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.";
 return "Add explicit Section 14a regression coverage for the corrected behavior.";
}
export function computeGoldenDiffs(v1,v2){
 const oldEntries=new Map(collectOutputEntries(v1.inventory).map(x=>[x.path,x]));
 const newEntries=new Map(collectOutputEntries(v2.inventory).map(x=>[x.path,x]));
 const out=[];
 for(const [path,n] of newEntries){const o=oldEntries.get(path);if(!o||JSON.stringify(o.output)!==JSON.stringify(n.output)){const category=categoryFor(path);out.push({path,input:n.input,old_output:o?o.output:null,new_output:n.output,reason:reasonFor(path,n.input,o?.output,n.output),category});}}
 for(const [path,o] of oldEntries)if(!newEntries.has(path)){const category=categoryFor(path);out.push({path,input:o.input,old_output:o.output,new_output:null,reason:"Remove obsolete golden entry only if the approved Section 14a behavior intentionally removes it.",category});}
 return out.sort((a,b)=>a.path.localeCompare(b.path));
}
export function renderGoldenChanges(v1,v2){
 const diffs=computeGoldenDiffs(v1,v2),counts={};
 for(const d of diffs)counts[d.category]=(counts[d.category]||0)+1;
 const table=Object.entries(counts).sort(([a],[b])=>a.localeCompare(b)).map(([k,n])=>"| "+k+" | "+n+" |").join("\n");
 const ledger=JSON.stringify(diffs,null,2).split("\n").map(line=>"    "+line).join("\n");
 return "# Golden v1 to v2 changes\n\nThe original tests/golden/legacy-v1.json and its checksum are immutable historical evidence. Version 2 records the Section 14a compatibility behavior. This ledger includes every changed or newly added output entry, with input, old output, new output and reason.\n\nChanged/added output entries: **"+diffs.length+"**.\n\n## Differences by category\n\n| Category | Changed/added entries |\n|---|---:|\n|---|---:|\n"+table+"\n\n## Complete machine-readable difference ledger\n\n"+ledger+"\n";
}
