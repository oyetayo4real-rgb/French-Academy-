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

  // NR-07: distinguish the auxiliary avoir (a) from the preposition à.
  const pastParticiples=["été","eu","fait","dit","mangé","parlé","pris","vu","voulu","pu","su","fini","donné","trouvé"];
  const pastParticiplePattern=new RegExp(wordStart+"(il|elle|on)(\\s+)(à)(\\s+)("+makeAlternation(pastParticiples)+")"+wordEnd,"giu");
  for(const m of input.matchAll(pastParticiplePattern)){
    const start=m.index+m[1].length+m[2].length;
    findings.push(finding("NR-07","correction",start,m[3],preserveCase(m[3],"a"),"With il, elle or on directly before a past participle, a is the auxiliary avoir; à is a preposition."));
  }
  const motionStateVerbs=["va","vais","vas","allons","allez","vont","suis","es","sommes","êtes"];
  const locationPhrases=["la maison","l'école","Paris","Lagos","la","le","les"];
  const motionLocationPattern=new RegExp(wordStart+"("+makeAlternation(motionStateVerbs)+")(\\s+)(a)(\\s+)("+makeAlternation(locationPhrases)+")"+wordEnd,"giu");
  for(const m of input.matchAll(motionLocationPattern)){
    const start=m.index+m[1].length+m[2].length;
    findings.push(finding("NR-07","correction",start,m[3],preserveCase(m[3],"à"),"This listed motion or state verb takes the preposition à before the listed place or destination."));
  }
  const motionLocationElisionPattern=new RegExp(wordStart+"("+makeAlternation(motionStateVerbs)+")(\\s+)(a)(\\s+)(l['’])(?=\\s|$|[.,!?;:])","giu");
  for(const m of input.matchAll(motionLocationElisionPattern)){
    const start=m.index+m[1].length+m[2].length;
    findings.push(finding("NR-07","correction",start,m[3],preserveCase(m[3],"à"),"This listed motion or state verb takes the preposition à before an elided place article."));
  }
  // NR-08: only sentence-initial ou before the closed question-word list is corrected.
  const questionFollowers=["est","sont","habites","habitez","vas","vais","va","allez","étais","es","peux","puis-je","se trouve","est-ce"];
  const initialOuPattern=new RegExp("(^\\s*|[.!?]\\s+)(ou)(?=\\s+(?:"+makeAlternation(questionFollowers)+")"+wordEnd+")","giu");
  for(const m of input.matchAll(initialOuPattern)){
    const start=m.index+m[1].length;
    findings.push(finding("NR-08","correction",start,m[2],preserveCase(m[2],"où"),"At the beginning of a question asking where, use où with a grave accent; ou means or."));
  }
  // NR-09: closed subject + adjective list; c' is handled without adding an extra space.
  const stateAdjectives=["content","contente","fatigué","fatiguée","grand","grande","petit","petite","malade","ici","là","prêt","prête","gentil","gentille","tard","tôt"];
  const stateEtPattern=new RegExp(wordStart+"(il|elle|on|ce|c['’])(\\s*)(et)(\\s+)("+makeAlternation(stateAdjectives)+")"+wordEnd,"giu");
  for(const m of input.matchAll(stateEtPattern)){
    if(m[1].toLocaleLowerCase("fr")==="ce"||m[1].toLocaleLowerCase("fr").startsWith("c")){
      const found=m[1]+m[2]+m[3],start=m.index;
      findings.push(finding("NR-09","correction",start,found,preserveCase(found,"c'est"),"Before this listed adjective, the verb is est; the demonstrative ce contracts to c'est."));
    }else{
      const start=m.index+m[1].length+m[2].length;
      findings.push(finding("NR-09","correction",start,m[3],preserveCase(m[3],"est"),"After this listed subject pronoun, use the verb est before the listed adjective or state expression."));
    }
  }
  // NR-10: the plural subject forms require sont, never son.
  const pluralSubjects=["ils","elles","ceux","celles"];
  const sonPattern=new RegExp(wordStart+"("+makeAlternation(pluralSubjects)+")(\\s+)(son)"+wordEnd,"giu");
  for(const m of input.matchAll(sonPattern)){
    const start=m.index+m[1].length+m[2].length;
    findings.push(finding("NR-10","correction",start,m[3],preserveCase(m[3],"sont"),"After these plural subjects, use sont (the plural form of être); son is a possessive determiner."));
  }
  // NR-11: only the specified impersonal expressions take ça.
  const caVerbs=["va","dépend","marche","fait","suffit","suffira","m'étonne","commence","existe"];
  const saPattern=new RegExp(wordStart+"(sa)(\\s+)("+makeAlternation(caVerbs)+")"+wordEnd,"giu");
  for(const m of input.matchAll(saPattern)){
    findings.push(finding("NR-11","correction",m.index,m[1],preserveCase(m[1],"ça"),"In this listed impersonal expression, ça means that/it; sa is the feminine possessive determiner."));
  }
  // NR-12: contract only the explicitly listed article + noun combinations.
  const masculineContractionNouns=["marché","jardin","magasin","cinéma","restaurant","bureau","musée","parc","théâtre","café","supermarché"];
  const pluralAContractionNouns=["enfants","amis","magasins","étudiants","États-Unis"];
  const pluralDeContractionNouns=["enfants","amis","magasins","étudiants"];
  const contractionCases=[
    {prep:"à",article:"le",nouns:masculineContractionNouns,replacement:"au",why:"à + le contracts to au before this listed masculine singular noun."},
    {prep:"à",article:"les",nouns:pluralAContractionNouns,replacement:"aux",why:"à + les contracts to aux before this listed plural noun."},
    {prep:"de",article:"le",nouns:masculineContractionNouns,replacement:"du",why:"de + le contracts to du before this listed masculine singular noun."},
    {prep:"de",article:"les",nouns:pluralDeContractionNouns,replacement:"des",why:"de + les contracts to des before this listed plural noun."}
  ];
  for(const rule of contractionCases){
    const pattern=new RegExp(wordStart+"("+rule.prep+")(\\s+)("+rule.article+")(\\s+)("+makeAlternation(rule.nouns)+")"+wordEnd,"giu");
    for(const m of input.matchAll(pattern)){
      const found=m[1]+m[2]+m[3];
      findings.push(finding("NR-12","correction",m.index,found,preserveCase(found,rule.replacement),rule.why));
    }
  }

  return findings.sort((a,b)=>a.span[0]-b.span[0]||a.span[1]-b.span[1]);
}
