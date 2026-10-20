/* French Intelligence Engine — local-first, no API key, no Gemini.
 * This engine deliberately labels its built-in dictionary and rule-based answers;
 * it never presents a guess as an authoritative dictionary entry.
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const dictionary = {
    bonjour:["hello; good morning","interjection","Bonjour, comment allez-vous ?","A standard greeting; use bonsoir in the evening."],
    bonsoir:["good evening","interjection","Bonsoir, madame.","Used as a greeting in the evening."],
    salut:["hi; bye","interjection","Salut, ça va ?","Informal; use with friends or people you know well."],
    merci:["thank you; thanks","interjection","Merci beaucoup pour votre aide.","Beaucoup intensifies merci."],
    "s'il vous plaît":["please","expression","Un café, s'il vous plaît.","Polite/formal or plural form."],
    "s'il te plaît":["please","expression","Aide-moi, s'il te plaît.","Informal singular form."],
    amour:["love","noun (masculine)","L'amour est important.","Usually masculine in the singular: un amour."],
    ami:["friend","noun (masculine)","C'est mon ami.","Feminine: amie; plural: amis/amies."],
    amie:["friend","noun (feminine)","Elle est mon amie.","Before a vowel, mon amie is used rather than ma amie."],
    maison:["house; home","noun (feminine)","Je rentre à la maison.","Common phrase: chez moi = at my home."],
    livre:["book","noun (masculine)","Je lis un livre.","Un livre means a book; une livre can mean a pound."],
    eau:["water","noun (feminine)","Je voudrais de l'eau.","The h is absent; use l'eau."],
    pain:["bread","noun (masculine)","Je voudrais du pain.","Du pain is an uncountable quantity of bread."],
    manger:["to eat","verb","Nous mangeons ensemble.","Regular -er verb, with spelling change in nous: mangeons."],
    parler:["to speak; to talk","verb","Je parle français.","Regular -er verb."],
    être:["to be","verb","Je suis étudiant.","Irregular; present forms: suis, es, est, sommes, êtes, sont."],
    avoir:["to have","verb","J'ai vingt ans.","Irregular; French uses avoir for age."],
    aller:["to go","verb","Nous allons à Paris.","Irregular; aller + infinitive forms the near future."],
    faire:["to do; to make","verb","Je fais mes devoirs.","Irregular present forms include fais, fait, faisons, faites, font."],
    bien:["well; good","adverb/adjective","Je vais bien, merci.","In ça va bien, it means well."],
    bon:["good","adjective","C'est un bon livre.","Before a masculine singular noun."],
    bonne:["good","adjective","C'est une bonne idée.","Feminine form of bon."],
    petit:["small; little","adjective","Un petit chat.","Feminine petite; agreement matters."],
    grande:["big; tall","adjective","Une grande maison.","Feminine form of grand."],
    "aujourd'hui":["today","adverb","Aujourd'hui, je travaille.","Often placed at the beginning of a sentence."],
    demain:["tomorrow","adverb/noun","À demain !","À demain means see you tomorrow."],
    hier:["yesterday","adverb/noun","Hier, j'ai travaillé.","Often used with the passé composé for completed events."],
    pourquoi:["why","question word","Pourquoi apprends-tu le français ?","Answer a why-question with parce que (because)."],
    comment:["how; what ... like","question word","Comment tu t'appelles ?","Comment vous appelez-vous? is a formal alternative."],
    quand:["when","question word/conjunction","Quand arrives-tu ?","Can introduce a time clause."],
    où:["where","question word/adverb","Où habites-tu ?","Accent distinguishes où (where) from ou (or)."],
    mais:["but","conjunction","Je suis fatigué, mais content.","Connects contrasting ideas."],
    "parce que":["because","conjunction","Je reste parce qu'il pleut.","Before il, que elides to qu'."],
    avec:["with","preposition","Je viens avec toi.","Usually followed by a noun or stressed pronoun."],
    sans:["without","preposition","Un café sans sucre.","Opposite of avec in many contexts."],
    toujours:["always; still","adverb","Elle arrive toujours à l'heure.","Meaning depends on context."],
    jamais:["never; ever","adverb","Je ne fume jamais.","In standard negation: ne ... jamais."],
    français:["French; French person","adjective/noun","J'apprends le français.","The language name takes a lowercase letter in French."],
    française:["French; Frenchwoman","adjective/noun","La littérature française.","Feminine form of français."],
    apprendre:["to learn","verb","J'apprends le français.","Irregular verb: j'apprends, nous apprenons."],
    comprendre:["to understand","verb","Je comprends la question.","Irregular verb patterned on prendre."],
    vouloir:["to want","verb","Je voudrais un café.","Je voudrais is a polite conditional form."],
    pouvoir:["to be able to; can","verb","Je peux vous aider.","Irregular present: peux, peux, peut, pouvons, pouvez, peuvent."],
    devoir:["must; to have to; owe","verb","Je dois partir.","Irregular present: dois, dois, doit, devons, devez, doivent."],
    travail:["work; job","noun (masculine)","Je vais au travail.","Plural: travaux in many senses."],
    temps:["time; weather","noun (masculine)","Je n'ai pas le temps.","The meaning depends on context."],
    jour:["day","noun (masculine)","Bonne journée !","Bonne journée is a friendly daytime farewell."],
    fille:["girl; daughter","noun (feminine)","Sa fille parle français.","Context determines girl or daughter."],
    garçon:["boy; waiter","noun (masculine)","Le garçon lit un livre.","In a café, garçon can historically mean waiter; garçon de café is clearer."],
    femme:["woman; wife","noun (feminine)","Cette femme parle anglais.","Context determines woman or wife."],
    homme:["man; human being","noun (masculine)","Cet homme est gentil.","Cet is used before masculine nouns beginning with a vowel sound."],
    école:["school","noun (feminine)","Les enfants vont à l'école.","Use à l'école."],
    travailleur:["hard-working; worker","adjective/noun","Il est très travailleur.","Feminine travailleuse."],
    gentil:["kind; nice","adjective","Il est gentil.","Feminine gentille."],
    difficile:["difficult","adjective","Cette question est difficile.","Same form for masculine and feminine."],
    facile:["easy","adjective","C'est facile à comprendre.","Same form for masculine and feminine."],
    toujours:["always; still","adverb","Je suis toujours ici.","Check context to distinguish always from still."],
    beaucoup:["a lot; much; many","adverb","Merci beaucoup.","Before a noun, use beaucoup de: beaucoup de livres."],
    très:["very","adverb","C'est très intéressant.","Usually placed before the adjective or adverb."],
    intéressant:["interesting","adjective","Un sujet intéressant.","Feminine intéressante."],
    excusez:["excuse; excuse me","verb form/expression","Excusez-moi, où est la gare ?","Excusez-moi is polite/formal; excuse-moi is informal."],
    pardon:["sorry; excuse me; pardon","interjection","Pardon, je n'ai pas compris.","Can be used to ask someone to repeat."],
    oui:["yes","adverb","Oui, bien sûr.","Opposite: non."],
    non:["no; not","adverb","Non, merci.","For standard negation, use ne ... pas around the verb."],
    fenêtre:["window","noun (feminine)","J'ouvre la fenêtre.","Feminine: une fenêtre."],
    porte:["door","noun (feminine)","La porte est ouverte.","Feminine: une porte."],
    voiture:["car","noun (feminine)","La voiture est rouge.","Feminine: une voiture."],
    gare:["train station","noun (feminine)","Où est la gare ?","Useful travel word."],
    billet:["ticket","noun (masculine)","Un billet pour Paris, s'il vous plaît.","Can mean a ticket or banknote depending on context."],
    eau:["water","noun (feminine)","Je bois de l'eau.","Use de l'eau for an unspecified quantity."],
    nourriture:["food","noun (feminine)","La nourriture est prête.","General word for food."],
    "petit-déjeuner":["breakfast","noun (masculine)","Je prends le petit-déjeuner à huit heures.","Often used with prendre."],
    déjeuner:["lunch; to have lunch","noun/verb","Nous déjeunons à midi.","Meaning depends on whether it is used as a noun or verb."],
    dîner:["dinner; to have dinner","noun/verb","Nous dînons à dix-neuf heures.","Meaning depends on context."],
    heureux:["happy","adjective","Je suis heureux.","Feminine heureuse."],
    contente:["happy; pleased","adjective","Elle est contente.","Masculine content."],
    fatigué:["tired","adjective","Je suis fatigué.","Feminine fatiguée."],
    malade:["ill; sick","adjective/noun","Je suis malade.","Same adjective form for masculine and feminine."],
    médecin:["doctor","noun (masculine/feminine)","Elle est médecin.","Profession noun often used without an article after être."],
    apprendre:["to learn","verb","Nous apprenons le français.","Present: j'apprends, nous apprenons."],
    écrire:["to write","verb","J'écris une lettre.","Irregular present-tense verb."],
    lire:["to read","verb","Je lis un livre.","Irregular present-tense verb."],
    boire:["to drink","verb","Je bois de l'eau.","Irregular present-tense verb."],
    dormir:["to sleep","verb","Je dors bien.","Irregular present-tense verb."],
    partir:["to leave","verb","Nous partons demain.","Irregular present-tense verb."],
    sortir:["to go out; to take out","verb","Elle sort ce soir.","Meaning depends on context."],
    mettre:["to put; to place; to wear","verb","Je mets mon manteau.","Irregular present-tense verb."],
    recevoir:["to receive","verb","Je reçois un message.","Irregular present-tense verb."],
    ouvrir:["to open","verb","J'ouvre la porte.","Present forms resemble many -er endings."],
    croire:["to believe","verb","Je crois que oui.","Irregular present-tense verb."],
    courir:["to run","verb","Je cours le matin.","Irregular present-tense verb."],
    venir:["to come","verb","Tu viens avec nous ?","Irregular present-tense verb."],
    maintenant:["now","adverb","Je travaille maintenant.","Often placed near the verb or at the beginning/end of a sentence."],
    souvent:["often","adverb","Je lis souvent.","Frequency adverb."],
    parfois:["sometimes","adverb","Parfois, je prends le train.","Frequency adverb."],
    toujours:["always; still","adverb","Il est toujours là.","Meaning depends on context."],
    jamais:["never; ever","adverb","Je ne viens jamais le dimanche.","In standard negation, ne ... jamais surrounds the verb."],
    pourquoi:["why","question word","Pourquoi apprends-tu le français ?","A question word used to ask for a reason."],
    combien:["how much; how many","question word","Combien ça coûte ?","Use combien de before a noun in many quantity questions."],
    lequel:["which one","interrogative pronoun","Lequel préfères-tu ?","Forms vary by gender and number: lequel, laquelle, lesquels, lesquelles."],
    "parce que":["because","conjunction","Je reste parce qu'il pleut.","Before il, que elides to qu'."],
    donc:["so; therefore","adverb/conjunction","Il pleut, donc je reste.","Expresses a consequence."],
    pourtant:["however; yet","adverb","Il est fatigué, pourtant il continue.","Introduces contrast."],
    déjà:["already","adverb","J'ai déjà mangé.","Often used with a completed action."],
    encore:["again; still; yet","adverb","Tu es encore ici ?","Several meanings; context matters."],
    bientôt:["soon","adverb","À bientôt !","Common farewell: à bientôt."],
    ensemble:["together","adverb","Nous étudions ensemble.","Often follows the verb or object."],
    "aujourd'hui":["today","adverb","Aujourd'hui, je travaille.","Often placed at the beginning of a sentence."]
  };
  const irregular = {
    être:["suis","es","est","sommes","êtes","sont"],
    avoir:["ai","as","a","avons","avez","ont"],
    aller:["vais","vas","va","allons","allez","vont"],
    faire:["fais","fais","fait","faisons","faites","font"],
    venir:["viens","viens","vient","venons","venez","viennent"],
    prendre:["prends","prends","prend","prenons","prenez","prennent"],
    pouvoir:["peux","peux","peut","pouvons","pouvez","peuvent"],
    vouloir:["veux","veux","veut","voulons","voulez","veulent"],
    devoir:["dois","dois","doit","devons","devez","doivent"],
    savoir:["sais","sais","sait","savons","savez","savent"],
    dire:["dis","dis","dit","disons","dites","disent"],
    écrire:["écris","écris","écrit","écrivons","écrivez","écrivent"],
    lire:["lis","lis","lit","lisons","lisez","lisent"],
    boire:["bois","bois","boit","buvons","buvez","boivent"],
    dormir:["dors","dors","dort","dormons","dormez","dorment"],
    partir:["pars","pars","part","partons","partez","partent"],
    sortir:["sors","sors","sort","sortons","sortez","sortent"],
    mettre:["mets","mets","met","mettons","mettez","mettent"],
    recevoir:["reçois","reçois","reçoit","recevons","recevez","reçoivent"],
    ouvrir:["ouvre","ouvres","ouvre","ouvrons","ouvrez","ouvrent"],
    croire:["crois","crois","croit","croyons","croyez","croient"],
    courir:["cours","cours","court","courons","courez","courent"]
  };
  const persons = ["je / j'","tu","il / elle / on","nous","vous","ils / elles"];
  const examples = [
    ["Bonjour, comment allez-vous ?","Hello, how are you?"],
    ["Je voudrais apprendre le français.","I would like to learn French."],
    ["Pouvez-vous parler plus lentement, s'il vous plaît ?","Could you speak more slowly, please?"],
    ["Je ne comprends pas cette phrase.","I don't understand this sentence."],
    ["Qu'est-ce que ce mot signifie ?","What does this word mean?"],
    ["Pourriez-vous donner un exemple ?","Could you give an example?"],
    ["Comment dit-on « thank you » en français ?","How do you say “thank you” in French?"],
    ["Je suis en train d'apprendre.","I am learning right now."]
  ];
  const phraseMap = [
    [/\bje m'appelle\b/gi,"my name is"],[/\bcomment allez-vous\b/gi,"how are you (formal/plural)"],[/\bcomment ça va\b/gi,"how are things going"],[/\bça va\b/gi,"I'm fine / it's going"],[/\bje voudrais\b/gi,"I would like"],[/\bs'il vous plaît\b/gi,"please (formal/plural)"],[/\bs'il te plaît\b/gi,"please (informal)"],[/\bmerci beaucoup\b/gi,"thank you very much"],[/\bau revoir\b/gi,"goodbye"],[/\bà bientôt\b/gi,"see you soon"],[/\bà demain\b/gi,"see you tomorrow"],[/\bje ne comprends pas\b/gi,"I don't understand"],[/\bje comprends\b/gi,"I understand"],[/\best-ce que\b/gi,"question marker"],[/\bparce que\b/gi,"because"],[/\bil y a\b/gi,"there is / there are"],[/\bje suis\b/gi,"I am"],[/\bj'ai\b/gi,"I have"],[/\btu es\b/gi,"you are"],[/\bil est\b/gi,"he is / it is"],[/\bnous sommes\b/gi,"we are"],[/\bvous êtes\b/gi,"you are"],[/\bils sont\b/gi,"they are"],[/\bje vais\b/gi,"I go / I am going"],[/\bje veux\b/gi,"I want"],[/\bje peux\b/gi,"I can"],[/\bbonjour\b/gi,"hello"],[/\bbonsoir\b/gi,"good evening"],[/\bsalut\b/gi,"hi / bye"],[/\bmerci\b/gi,"thank you"],[/\boui\b/gi,"yes"],[/\bnon\b/gi,"no"],[/\baujourd'hui\b/gi,"today"],[/\bdemain\b/gi,"tomorrow"],[/\bhier\b/gi,"yesterday"],[/\bmaison\b/gi,"house / home"],[/\bécole\b/gi,"school"],[/\bfrançais\b/gi,"French"],[/\bamour\b/gi,"love"],[/\bami\b/gi,"friend"],[/\blivre\b/gi,"book"],[/\beau\b/gi,"water"],[/\bpain\b/gi,"bread"],[/\bparler\b/gi,"to speak"],[/\bmanger\b/gi,"to eat"],[/\bapprendre\b/gi,"to learn"],[/\bcomprendre\b/gi,"to understand"],[/\btravailler\b/gi,"to work"],[/\bétudiant\b/gi,"student"],[/\bétudiante\b/gi,"student"],[/\bcomment\b/gi,"how"],[/\bpourquoi\b/gi,"why"],[/\bquand\b/gi,"when"],[/\boù\b/gi,"where"],[/\bavec\b/gi,"with"],[/\bsans\b/gi,"without"],[/\bbeaucoup\b/gi,"a lot"],[/\btoujours\b/gi,"always"],[/\bjamais\b/gi,"never"],[/\bmais\b/gi,"but"],[/\bbien\b/gi,"well"],[/\btrès\b/gi,"very"]
  ];
  const rules = [
    {title:"Negation: ne … pas",body:"Put ne (or n' before a vowel) before the conjugated verb and pas after it: Je comprends → Je ne comprends pas. In everyday speech, people often omit ne, but keep it in formal writing."},
    {title:"Articles: un, une, des, le, la, les",body:"Un is masculine singular, une feminine singular, and des plural indefinite. Le/la/les are definite articles. French nouns have grammatical gender, so learn the article with each noun: la maison, le livre."},
    {title:"Adjective agreement",body:"Many adjectives agree with the noun: un ami français, une amie française, des amis français, des amies françaises. The usual written feminine ending is -e, but there are many exceptions."},
    {title:"Tu and vous",body:"Tu is singular and informal. Vous is plural or polite/formal singular. When uncertain with a stranger or in a professional situation, vous is the safer choice."},
    {title:"Passé composé",body:"A common past tense for completed events: auxiliary avoir or être in the present + past participle. Example: J'ai mangé (I ate/have eaten). Many movement/reflexive verbs use être and the participle may agree with the subject."},
    {title:"Imparfait vs passé composé",body:"Use the imparfait for background, repeated past habits, and ongoing states (Quand j'étais petit…). Use the passé composé for events viewed as completed (Hier, j'ai appelé Marie). The contrast depends on context."},
    {title:"Near future: aller + infinitive",body:"Conjugate aller + an infinitive: je vais parler, tu vas parler, nous allons parler. It often means “going to do something”."},
    {title:"C'est vs il est",body:"C'est + noun phrase or stressed pronoun: C'est un professeur; c'est intéressant. Il/elle est + adjective or profession without an article in many cases: Elle est gentille; elle est médecin."},
    {title:"Partitive articles",body:"Use du, de la, de l' for an unspecified quantity: du pain, de la soupe, de l'eau. After a quantity expression, use de: beaucoup de pain."},
    {title:"Question forms",body:"Three common forms: Tu viens ? (informal spoken), Est-ce que tu viens ? (neutral), Viens-tu ? (inversion, more formal). Question words include qui (who), que/qu'est-ce que (what), où (where), quand (when), pourquoi (why), comment (how)."}
  ];
  let tab = "ask", history = [], busy = false;
  function rootStyle(){return `<style>
  .fi-wrap{color:var(--tx,#1d2433);font:inherit}.fi-hero{padding:20px;border-radius:18px;background:linear-gradient(135deg,#172554,#3730a3 65%,#6d28d9);color:#fff;margin:12px 0}.fi-hero h1{font:700 26px Georgia,serif;margin:4px 0}.fi-hero p{margin:6px 0;opacity:.9}.fi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.fi-tab{width:100%;text-align:left;background:var(--card,#fff);color:var(--tx,#1d2433);border:1px solid var(--bd,#e5e1d8);padding:12px;min-height:76px}.fi-tab.active{border:2px solid var(--ac,#1d4ed8);background:rgba(59,130,246,.1)}.fi-panel{background:var(--card,#fff);border:1px solid var(--bd,#e5e1d8);border-radius:14px;padding:14px;margin:10px 0}.fi-label{display:block;font-weight:650;margin:8px 0 4px}.fi-input{display:block;width:100%;font:inherit;padding:12px;border:1px solid var(--bd,#e5e1d8);border-radius:10px;background:var(--bg,#f7f5f0);color:var(--tx,#1d2433);margin:6px 0}.fi-output{white-space:pre-wrap;line-height:1.7;overflow-wrap:anywhere}.fi-muted{font-size:13px;color:var(--mu,#6b7280)}.fi-result{padding:12px 0;border-top:1px solid var(--bd,#e5e1d8)}.fi-tag{display:inline-block;padding:2px 8px;border-radius:20px;background:var(--bg,#f7f5f0);font-size:12px;margin:2px}.fi-answer{background:var(--bg,#f7f5f0);border-radius:10px;padding:12px;margin-top:10px}.fi-row{display:flex;gap:8px;flex-wrap:wrap}.fi-row button{flex:1;min-width:120px}.fi-note{border-left:3px solid var(--ac,#1d4ed8);padding:8px 10px;background:var(--bg,#f7f5f0);font-size:13px}.fi-back{margin:4px 0}.fi-source{font-size:12px;color:var(--mu,#6b7280)}@media(max-width:420px){.fi-grid{grid-template-columns:1fr}.fi-hero{padding:16px}.fi-hero h1{font-size:23px}}</style>`;}
  function header(){return rootStyle()+`<div class="fi-wrap"><button class="g fi-back" id="fiHome">← Back to French Academy</button><div class="fi-hero"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">Local-first · No API key</div><h1>🇫🇷 French Intelligence</h1><p>Your French language workbench: dictionary, grammar, translation support, conjugation and writing help.</p></div><div class="fi-note"><b>Transparent mode:</b> core features run in your browser. They do not call Gemini or require an AI API key. Built-in word data and phrase translations are limited; complex answers are not generated by a large language model.</div><div class="fi-grid">`+
    [["ask","💬","Ask & explain","Grammar and language questions"],["dict","📖","Dictionary","Meaning and usage"],["translate","🌍","Translate","Phrase-based support"],["verbs","🔤","Conjugate","Common verb forms"],["correct","✍️","Writing check","Catch common mistakes"],["grammar","📘","Grammar guide","Clear rule explanations"]].map(([id,icon,name,desc])=>`<button class="fi-tab ${tab===id?"active":""}" data-fitab="${id}"><b>${icon} ${name}</b><div class="fi-muted">${desc}</div></button>`).join("")+`</div><div id="fiBody"></div><p class="fi-source">No account or API key is used by this module. Reference links are offered for further checking; external dictionary websites may have their own terms.</p></div>`;}
  function panel(label,placeholder,id="fiInput"){return `<label class="fi-label" for="${id}">${label}</label><textarea class="fi-input" id="${id}" rows="3" placeholder="${placeholder}"></textarea>`;}
  function renderBody(){
    const b=$("fiBody");if(!b)return;
    if(tab==="ask")b.innerHTML=`<div class="fi-panel"><h2>Ask about French</h2>${panel("Your question","Example: Why do we say « j'ai vingt ans » instead of « je suis vingt ans » ?")}<button id="fiAsk">Explain</button><div id="fiAnswer" class="fi-output"></div><div class="fi-muted">This first version uses curated grammar explanations and local language patterns, not unrestricted generative AI.</div></div><div class="fi-panel"><b>Try one of these</b><div class="fi-row">${["Explain ne … pas","When do I use tu and vous?","Explain passé composé","Why is maison feminine?"].map((x,i)=>`<button class="g" data-fiprompt="${i}">${x}</button>`).join("")}</div></div>`;
    else if(tab==="dict")b.innerHTML=`<div class="fi-panel"><h2>French reference dictionary</h2><p class="fi-muted">Search built-in entries for common words and expressions. If an entry is missing, open trusted reference sources instead of inventing a definition.</p><input class="fi-input" id="fiWord" placeholder="Enter a French or English word…" autocomplete="off"><button id="fiLookup" style="width:100%">Look up word</button><div id="fiAnswer" class="fi-output"></div><div class="fi-result"><b>Reference sources</b><p><a href="https://www.dictionnaire-academie.fr/" target="_blank" rel="noopener noreferrer">Académie française dictionary</a> · <a href="https://www.cnrtl.fr/definition/" target="_blank" rel="noopener noreferrer">CNRTL / TLFi</a> · <a href="https://fr.wiktionary.org/" target="_blank" rel="noopener noreferrer">Wiktionnaire</a></p></div></div>`;
    else if(tab==="translate")b.innerHTML=`<div class="fi-panel"><h2>Translation assistant</h2><label class="fi-label" for="fiDirection">Direction</label><select class="fi-input" id="fiDirection"><option value="fr-en">French → English</option><option value="en-fr">English → French (phrasebook coverage)</option></select>${panel("Text to translate","Enter a phrase or short sentence…")}<button id="fiTranslate">Translate</button><div id="fiAnswer" class="fi-output"></div><div class="fi-note">The local phrasebook handles common phrases and known vocabulary. For long or unfamiliar text, use a trusted translation service and review the result.</div></div><div class="fi-panel"><b>Useful phrasebook</b>${examples.map(x=>`<div class="fi-result"><div>${esc(x[0])}</div><div class="fi-muted">${esc(x[1])}</div><button class="g" data-fiexample="${esc(x[0])}">Use phrase</button></div>`).join("")}</div>`;
    else if(tab==="verbs")b.innerHTML=`<div class="fi-panel"><h2>Verb conjugator · present tense</h2><input class="fi-input" id="fiVerb" value="être" placeholder="Infinitive, e.g. parler"><button id="fiConjugate">Conjugate</button><div id="fiAnswer"></div><div class="fi-note">Irregular verbs in the built-in list are handled separately. Regular -er verbs use the standard present-tense pattern; spelling exceptions and other tenses may need checking.</div></div>`;
    else if(tab==="correct")b.innerHTML=`<div class="fi-panel"><h2>French writing checker</h2>${panel("Paste your French text","Write or paste a sentence…")}<button id="fiCheck">Check writing</button><div id="fiAnswer" class="fi-output"></div><div class="fi-note">This checks a small set of common patterns. It is not a full grammar checker and may miss errors or flag text that is valid in context.</div></div>`;
    else b.innerHTML=`<div class="fi-panel"><h2>French grammar guide</h2><input class="fi-input" id="fiRuleSearch" placeholder="Filter rules…"><div id="fiRules">${ruleHtml(rules)}</div></div>`;
  }
  function ruleHtml(list){return list.map((r,i)=>`<details class="fi-result"><summary><b>${esc(r.title)}</b></summary><p class="fi-output">${esc(r.body)}</p><button class="g" data-firule="${i}">Ask about this rule</button></details>`).join("");}
  function norm(s){return String(s||"").toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();}
  function lookup(word){
    const q=String(word||"").trim();if(!q)return null;
    let found=dictionary[q.toLocaleLowerCase("fr")];
    if(!found){const key=Object.keys(dictionary).find(k=>norm(k)===norm(q));if(key)found=dictionary[key];}
    if(found)return {word:q,meaning:found[0],part:found[1],example:found[2],notes:found[3],builtIn:true};
    const rev=Object.keys(dictionary).find(k=>norm(dictionary[k][0].split(";")[0])===norm(q));
    if(rev)return {word:rev,meaning:dictionary[rev][0],part:dictionary[rev][1],example:dictionary[rev][2],notes:dictionary[rev][3],builtIn:true};
    return null;
  }
  function showAnswer(html){const out=$("fiAnswer");if(out)out.innerHTML=html;}
  function dictionaryHtml(d){return `<div class="fi-answer"><h3 style="margin:0 0 6px">${esc(d.word)}</h3><div><b>Meaning:</b> ${esc(d.meaning)}</div><div class="fi-muted">Part of speech: ${esc(d.part)}</div><p><b>Example:</b> <i>${esc(d.example)}</i></p><p><b>Usage:</b> ${esc(d.notes)}</p><span class="fi-tag">Built-in entry</span></div>`;}
  function translate(text,direction){
    const q=String(text||"").trim();if(!q)return "Enter some text first.";
    if(direction==="en-fr"){
      const pairs={"hello":"bonjour","good morning":"bonjour","good evening":"bonsoir","goodbye":"au revoir","thank you":"merci","thank you very much":"merci beaucoup","please":"s'il vous plaît","yes":"oui","no":"non","i am":"je suis","i have":"j'ai","i would like":"je voudrais","i don't understand":"je ne comprends pas","where is the station":"où est la gare","how are you":"comment allez-vous","my name is":"je m'appelle","i love you":"je t'aime","see you tomorrow":"à demain","see you soon":"à bientôt","i speak french":"je parle français","i am learning french":"j'apprends le français"};
      const exact=Object.keys(pairs).find(k=>norm(k)===norm(q));if(exact)return `<div class="fi-answer"><b>French:</b> ${esc(pairs[exact])}<p class="fi-muted">Known phrasebook match.</p></div>`;
      return `<div class="fi-answer">This phrase is not in the local phrasebook yet. I won't guess a full translation. Try a shorter phrase, or use <a href="https://www.deepl.com/translator#en/fr/${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">DeepL</a> or <a href="https://translate.google.com/?sl=en&tl=fr&text=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">Google Translate</a> and review the result.</div>`;
    }
    let result=q;let matches=[];
    for(const [re,en] of phraseMap){if(re.test(result)){matches.push(en);result=result.replace(re,en);}}
    if(matches.length)return `<div class="fi-answer"><b>Approximate English:</b><div class="fi-output">${esc(result)}</div><p class="fi-muted">Matched local phrases: ${esc([...new Set(matches)].join("; "))}. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>`;
    const words=q.match(/[\p{L}’'-]+/gu)||[];const found=words.map(w=>({w,d:lookup(w)})).filter(x=>x.d);
    if(found.length)return `<div class="fi-answer"><b>Vocabulary hints (not a complete translation)</b>${found.map(x=>`<div class="fi-result"><b>${esc(x.w)}</b> — ${esc(x.d.meaning)}</div>`).join("")}</div>`;
    return `<div class="fi-answer">No reliable local match was found. Try a known phrase or open <a href="https://www.deepl.com/translator#fr/en/${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">DeepL</a> or <a href="https://translate.google.com/?sl=fr&tl=en&text=${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">Google Translate</a>. The app does not send this text to those services automatically.</div>`;
  }
  function conjugate(raw){
    let v=String(raw||"").toLocaleLowerCase("fr").trim().replace(/^to /,"");if(!v)return null;
    if(irregular[v])return {v,forms:irregular[v],type:"Irregular verb · present tense"};
    if(v==="manger")return {v,forms:["mange","manges","mange","mangeons","mangez","mangent"],type:"Regular -er pattern with spelling adjustment"};
    if(v==="commencer")return {v,forms:["commence","commences","commence","commençons","commencez","commencent"],type:"Regular -er pattern with spelling adjustment"};
    if(/er$/.test(v)&&v.length>3){const stem=v.slice(0,-2);return {v,forms:[stem+"e",stem+"es",stem+"e",stem+"ons",stem+"ez",stem+"ent"],type:"Regular -er verb · present tense"};}
    if(/ir$/.test(v)&&v.length>3&&!["partir","sortir","dormir","servir","sentir","mentir","courir","ouvrir","offrir","cueillir"].includes(v)){const stem=v.slice(0,-2);return {v,forms:[stem+"is",stem+"is",stem+"it",stem+"issons",stem+"issez",stem+"issent"],type:"Regular -ir verb · present tense (finir pattern)"};}
    if(/re$/.test(v)&&v.length>3){const stem=v.slice(0,-2);return {v,forms:[stem+"s",stem+"s",stem,""+stem+"ons",stem+"ez",stem+"ent"],type:"Regular -re verb · present-tense pattern (verify exceptions)"};}
    return null;
  }
  function answerQuestion(q){
    const n=norm(q);
    if(!q.trim())return "Type a question first.";
    const matched=rules.find(r=>n.includes(norm(r.title).replace("ne ... pas","ne"))|| (n.includes("negation")&&r.title.startsWith("Negation")) || (n.includes("tu")&&n.includes("vous")&&r.title==="Tu and vous"));
    if(matched)return `<b>${esc(matched.title)}</b><p>${esc(matched.body)}</p>`;
    if(/maison/.test(n)&&/(feminin|gender|genre|why|pourquoi)/.test(n))return "<b>Why is “maison” feminine?</b><p>In French, grammatical gender is a property of each noun and is not always predictable from meaning. Learn it together with its article: <i>la maison</i>. The ending -on does not reliably tell you a noun's gender.</p>";
    if(/age|ans|vingt ans/.test(n))return "<b>Talking about age</b><p>French uses <i>avoir</i> (to have), not <i>être</i> (to be): <i>J'ai vingt ans</i> literally means “I have twenty years.”</p>";
    if(/translate|translation|tradui|meaning|signif/.test(n)){const d=lookup(q.replace(/^(what does|meaning of|translate)\s+/i,"").replace(/[?!.]$/,""));if(d)return dictionaryHtml(d);}
    if(/grammar|grammaire|tense|temps verbal/.test(n))return "Choose the Grammar Guide to browse ten core rules, or ask about a specific structure (for example, “Explain passé composé”).";
    if(/bonjour|salut|merci|au revoir/.test(n)){const d=lookup(q.replace(/[?!.]$/,""));if(d)return dictionaryHtml(d);}
    return "I can answer from the built-in French reference set, grammar guide, common phrases and conjugation rules. I couldn't match this question confidently yet, so I won't invent an answer. Try asking about ne…pas, tu/vous, passé composé, adjective agreement, or a word in the dictionary. For deeper open-ended questions, this no-key version currently needs an optional on-device language model.";
  }
  function checkWriting(q){
    let suggestions=[],corrected=q;
    const checks=[
      [/\bje suis (\d+) ans\b/gi,(m,n)=>"j'ai "+n+" ans","French uses avoir for age."],
      [/\bje suis faim\b/gi,()=>"j'ai faim","French says avoir faim (to be hungry)."],
      [/\bje suis soif\b/gi,()=>"j'ai soif","French says avoir soif (to be thirsty)."],
      [/\bje suis 20 ans\b/gi,()=>"j'ai 20 ans","French uses avoir for age."],
      [/\bsa va\b/gi,()=>"ça va","The expression is ça va, with ç."],
      [/\bbeacoup\b/gi,()=>"beaucoup","Spelling: beaucoup."],
      [/\bbonjor\b/gi,()=>"bonjour","Spelling: bonjour."],
      [/\bmerçi\b/gi,()=>"merci","Merci is written without a cedilla."],
      [/\bje ne comprends pas pas\b/gi,()=>"je ne comprends pas","Avoid repeating pas in this standard negation."],
      [/\bje parle le français\b/gi,()=>"je parle français","For languages after parler, the article is commonly omitted: parler français."],
      [/\bune livre\b/gi,()=>"un livre","Un livre means a book; une livre can mean a pound, so context matters."]
    ];
    for(const [re,rep,why] of checks){if(re.test(corrected)){re.lastIndex=0;const before=corrected;corrected=corrected.replace(re,rep);suggestions.push({before,why});}}
    if(!suggestions.length)return `<div class="fi-answer"><b>Text received</b><p>${esc(q)}</p><p>No issue from the small built-in check list was detected. That does not prove the sentence is fully correct; this is not a full grammar checker.</p></div>`;
    return `<div class="fi-answer"><b>Suggested text</b><p class="fi-output">${esc(corrected)}</p><b>Why these changes?</b>${suggestions.map(s=>`<div class="fi-result">${esc(s.why)}<div class="fi-muted">Original: ${esc(s.before)}</div></div>`).join("")}<button id="fiUseCorrection" class="g">Use corrected text</button></div>`;
  }
  function runAction(id){
    if(id==="fiAsk"){const q=$("fiInput")?.value||"";showAnswer(answerQuestion(q));}
    if(id==="fiLookup"){const q=$("fiWord")?.value||"";const d=lookup(q);showAnswer(d?dictionaryHtml(d):`<div class="fi-answer">No built-in entry for <b>${esc(q)}</b>. No definition has been fabricated. Check <a href="https://www.dictionnaire-academie.fr/" target="_blank" rel="noopener noreferrer">Académie française</a>, <a href="https://www.cnrtl.fr/definition/${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">CNRTL/TLFi</a> or <a href="https://fr.wiktionary.org/wiki/${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">Wiktionnaire</a>.</div>`);}
    if(id==="fiTranslate"){showAnswer(translate($("fiInput")?.value||"",$("fiDirection")?.value||"fr-en"));}
    if(id==="fiConjugate"){const r=conjugate($("fiVerb")?.value||"");showAnswer(r?`<div class="fi-answer"><h3>${esc(r.v)} — present tense</h3><div class="fi-muted">${esc(r.type)}</div><table><tbody>${r.forms.map((f,i)=>`<tr><td>${esc(persons[i])}</td><td><b>${esc(f)}</b></td></tr>`).join("")}</tbody></table></div>`:`<div class="fi-answer">No conjugation pattern is available for this verb. Try être, avoir, aller, faire, venir, prendre, pouvoir, vouloir, devoir, savoir, dire or a regular -er verb such as parler.</div>`);}
    if(id==="fiCheck"){const q=$("fiInput")?.value||"";showAnswer(q.trim()?checkWriting(q):"Paste some text first.");}
  }
  function open(){tab="ask";history=[];const app=$("app");if(!app)return;app.innerHTML=header();renderBody();window.scrollTo(0,0);}
  document.addEventListener("click",(e)=>{
    const t=e.target instanceof Element?e.target.closest("button"):null;if(!t)return;
    if(t.id==="hfrenchint"){open();return;}
    if(t.id==="fiHome"){if(typeof window.FAExitFrenchIntelligence==="function"){window.FAExitFrenchIntelligence();return;}location.reload();return;const app=$("app");if(app)app.innerHTML='<div class="card">Return to the home screen using your app navigation.</div>';return;}
    if(t.dataset.fitab){tab=t.dataset.fitab;const app=$("app");if(app)app.innerHTML=header();renderBody();return;}
    if(t.dataset.fiprompt){const prompts=["Explain ne … pas","When do I use tu and vous?","Explain passé composé","Why is maison feminine?"];const input=$("fiInput");if(input)input.value=prompts[Number(t.dataset.fiprompt)]||"";return;}
    if(t.dataset.fiexample){const input=$("fiInput");if(input)input.value=t.dataset.fiexample;return;}
    if(t.dataset.firule){tab="ask";const app=$("app");if(app)app.innerHTML=header();renderBody();const input=$("fiInput");if(input)input.value=rules[Number(t.dataset.firule)]?.title||"";return;}
    if(t.id==="fiUseCorrection"){const out=$("fiAnswer");const target=$("fiInput");const p=out?.querySelector(".fi-output");if(target&&p)target.value=p.textContent;return;}
    runAction(t.id);
  });
  document.addEventListener("input",(e)=>{if(e.target?.id==="fiRuleSearch"){const q=norm(e.target.value);const f=rules.filter(r=>norm(r.title+" "+r.body).includes(q));const out=$("fiRules");if(out)out.innerHTML=ruleHtml(f);}});
  document.addEventListener("keydown",(e)=>{if(e.target?.id==="fiWord"&&e.key==="Enter"){e.preventDefault();runAction("fiLookup");}});
  window.FrenchIntelligenceOpen=open;
  // Small, read-only core API enables deterministic tests without a browser UI.
  window.FrenchIntelligenceCore=Object.freeze({lookup,translate,conjugate,answerQuestion,checkWriting});
})();