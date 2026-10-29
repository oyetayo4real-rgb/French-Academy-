/* Pure, closed-list Section 12 writing rules. No DOM, network, storage, or runtime globals. */
const wordStart = "(?<![\\p{L}\\p{N}_])";
const wordEnd = "(?![\\p{L}\\p{N}_])";
const preserveCase = (source, replacement) => {
  if (source === source.toLocaleUpperCase("fr")) return replacement.toLocaleUpperCase("fr");
  if (source && source[0] === source[0].toLocaleUpperCase("fr") && source.slice(1) === source.slice(1).toLocaleLowerCase("fr")) return replacement[0].toLocaleUpperCase("fr") + replacement.slice(1);
  return replacement;
};
const makeAlternation = words => [...words].sort((a,b)=>b.length-a.length).join("|");
const finding = (ruleId, kind, start, found, suggestion, explanation) => ({ruleId,kind,span:[start,start+found.length],found,suggestion,explanation});
const FEM_PLURAL_AFTER_GENS=["intéressantes","gentilles","heureuses","fatiguées","contentes","petites","grandes","vieilles","bonnes","mauvaises"];
const MASC_BEFORE_GENS=["vieux","bons","petits","mauvais"];
const LEUR_VERBS=["ai","as","a","avons","avez","ont","dis","dit","dites","disons","donne","donnons","donnez","parle","parlons","parlez","demande","écrit","envoie","répond","manque","montre","plaît","plait","dirai","dira","donnerai","parlerai","faut","fait"];
const TOUT_FEM_SINGULAR=["contente","seule","petite","grande","belle","jolie","fatiguée","triste","fière","sûre","pressée","calme","douce"];
const TOUT_FEM_PLURAL=["contentes","seules","petites","grandes"];
const VOWEL_NOUNS=["arbre","homme","ami","enfant","oiseau","appartement","hôtel","hôpital","anniversaire","endroit","avion","étage","exemple","ordinateur","immeuble","orage","été","escalier","ours"];
export function checkSection12Rules(text) {
  const input=String(text??""), findings=[];
  const afterGens=new RegExp(wordStart+"(gens)\\s+("+makeAlternation(FEM_PLURAL_AFTER_GENS)+")"+wordEnd,"giu");
  for(const m of input.matchAll(afterGens)){const adjective=m[2];findings.push(finding("NR-02","review",m.index+m[0].lastIndexOf(adjective),adjective,"","adjectives after gens are masculine"));}
  const beforeGens=new RegExp(wordStart+"("+makeAlternation(MASC_BEFORE_GENS)+")\\s+(gens)"+wordEnd,"giu");
  for(const m of input.matchAll(beforeGens))findings.push(finding("NR-02","review",m.index,m[1],"","feminine adjective expected before gens (les vieilles gens)"));
  const leurPattern=new RegExp(wordStart+"(leurs)(\\s+)("+makeAlternation(LEUR_VERBS)+")"+wordEnd,"giu");
  for(const m of input.matchAll(leurPattern))findings.push(finding("NR-03","correction",m.index,m[1],preserveCase(m[1],"leur"),"Before a verb, the pronoun leur is invariable."));
  const toutPattern=new RegExp(wordStart+"(tout)(\\s+)("+makeAlternation([...TOUT_FEM_SINGULAR,...TOUT_FEM_PLURAL])+")"+wordEnd,"giu");
  for(const m of input.matchAll(toutPattern)){const plural=TOUT_FEM_PLURAL.includes(m[3].toLocaleLowerCase("fr"));findings.push(finding("NR-04","correction",m.index,m[1],preserveCase(m[1],plural?"toutes":"toute"),plural?"Before these feminine plural adjectives, tout agrees as toutes.":"Before a feminine singular adjective beginning with a consonant, tout agrees as toute."));}
  const beauPattern=new RegExp(wordStart+"(un)(\\s+)(beau|vieux|nouveau)(\\s+)("+makeAlternation(VOWEL_NOUNS)+")"+wordEnd,"giu");
  for(const m of input.matchAll(beauPattern)){const replacement=({beau:"bel",vieux:"vieil",nouveau:"nouvel"})[m[3].toLocaleLowerCase("fr")];findings.push(finding("NR-05","correction",m.index+m[1].length+m[2].length,m[3],preserveCase(m[3],replacement),"Use the liaison form before this masculine singular noun beginning with a vowel or mute h."));}
  const siPattern=new RegExp(wordStart+"(s['’]elles|s['’]elle)"+wordEnd,"giu");
  for(const m of input.matchAll(siPattern)){const replacement=/elles$/iu.test(m[1])?"si elles":"si elle";findings.push(finding("NR-06","correction",m.index,m[1],preserveCase(m[1],replacement),"Si elides only before il and ils, never before elle or elles."));}
  return findings.sort((a,b)=>a.span[0]-b.span[0]||a.span[1]-b.span[1]);
}
