import * as structuredCore from "./french-intelligence-core-v1.mjs";
/* Exact legacy HTML renderer extracted from the golden source. Keep its output byte-stable. */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const writingPattern = (source, flags = "gi") => new RegExp("(?<![\\p{L}\\p{N}_'’\\-])(?:" + source + ")(?![\\p{L}\\p{N}_'’\\-])", flags.includes("u") ? flags : flags + "u");
const preserveInitialCase = (match, replacement) => match && /^\p{Lu}/u.test(match) ? replacement.charAt(0).toLocaleUpperCase("fr") + replacement.slice(1) : replacement;
const $ = (id) => document.getElementById(id);
let tab = "ask", history = [], busy = false;
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
    "travail":["work; job","noun (masculine)","Je cherche du travail.","Usually masculine: un travail; plural travaux in many contexts."],
    famille:["family","noun (feminine)","Ma famille habite ici.","Usually feminine: une famille."],
    enfant:["child","noun (masculine or feminine; same form)","L'enfant joue dehors.","The form is the same for boys and girls; the article follows the child (un enfant, une enfant); un enfant is the usual generic form."],
    ville:["city; town","noun (feminine)","Paris est une grande ville.","Usually feminine: une ville."],
    pays:["country","noun (masculine)","La France est un pays européen.","Always masculine: un pays. Country names such as la France have their own gender."],
    nuit:["night","noun (feminine)","Bonne nuit !","Usually feminine: la nuit."],
    matin:["morning","noun (masculine)","Je travaille le matin.","Bonjour is used as a greeting during the day."],
    soir:["evening","noun (masculine)","Je rentre ce soir.","Bonsoir is the usual evening greeting."],
    heureux:["happy","adjective","Je suis heureux.","Feminine heureuse; agreement depends on the person described."],
    difficile:["difficult; hard","adjective","C'est une question difficile.","Same written form for masculine and feminine singular."],
    facile:["easy","adjective","Cet exercice est facile.","Same written form for masculine and feminine singular."],
    important:["important","adjective","C'est un point important.","Feminine importante; agrees with the noun."],
    besoin:["need","noun (masculine)","J'ai besoin d'aide.","Common construction: avoir besoin de."],
    envie:["desire; urge","noun (feminine)","J'ai envie de dormir.","Common construction: avoir envie de + noun/infinitive."],
    raison:["reason; right","noun (feminine)","Tu as raison.","Avoir raison means to be right; avoir tort means to be wrong."],
    question:["question","noun (feminine)","J'ai une question.","Usually feminine: une question."],
    réponse:["answer; reply","noun (feminine)","Merci pour votre réponse.","Canonical spelling uses é."],
    choisir:["to choose","verb","Je choisis un livre.","Regular -ir verb following the finir pattern."],
    attendre:["to wait for","verb","J'attends le bus.","The object waited for follows attendre directly, without pour."],
    connaître:["to know; be familiar with","verb","Je connais cette ville.","Use connaître for people/places/things you are familiar with; savoir for facts or skills."],
    depuis:["since; for (duration continuing to now)","preposition/adverb","J'habite ici depuis trois ans.","Often used with the present tense for an action/state that began in the past and continues."],
    pendant:["during; for (duration)","preposition","J'ai étudié pendant deux heures.","Frames a duration; tense depends on whether the event is ongoing or completed."],
    "en revanche":["on the other hand; by contrast","conjunction phrase","Il est petit. En revanche, il est très rapide.","Introduces a contrast."],
    "tout à fait":["absolutely; quite","adverbial phrase","Tout à fait, je suis d'accord.","Can express strong agreement."],
    "pas du tout":["not at all","adverbial phrase","Je ne suis pas du tout fatigué.","Intensifies a negation."],
    "de temps en temps":["from time to time","adverbial phrase","Je cuisine de temps en temps.","Means occasionally."],
    "en train de":["in the process of; currently","verbal expression","Je suis en train de lire.","Être en train de + infinitive emphasizes an action in progress."],
    "avoir besoin de":["to need","verbal expression","J'ai besoin de repos.","Avoir + besoin + de + noun/infinitive."],
    "avoir envie de":["to feel like; want to","verbal expression","J'ai envie de sortir.","Avoir + envie + de + noun/infinitive."],
    "avoir raison":["to be right","verbal expression","Tu as raison.","Literally “to have reason”."],
    "avoir tort":["to be wrong","verbal expression","Je crois que j'ai tort.","Fixed expression."],
    "il faut":["it is necessary; one must","impersonal expression","Il faut étudier régulièrement.","Followed by an infinitive or de + noun depending on structure."],
    "tout de suite":["right away; immediately","adverbial phrase","J'arrive tout de suite.","Means immediately."],
    "à cause de":["because of","prepositional phrase","Le match est annulé à cause de la pluie.","Introduces a cause."],
    "grâce à":["thanks to","prepositional phrase","Grâce à toi, j'ai réussi.","Usually introduces a helpful or positive cause."],
    "en fait":["actually; in fact","discourse marker","En fait, je suis déjà prêt.","Often used to clarify or correct information."],
    "quand même":["anyway; nevertheless","adverbial phrase","Il pleut, mais je sors quand même.","Meaning depends strongly on context."],
    "d'accord":["okay; agreed","expression","D'accord, on commence.","Common expression of agreement."],
    "ça dépend":["it depends","expression","Ça dépend de la situation.","Often followed by de."],
    "par exemple":["for example","adverbial phrase","Par exemple, on peut lire ce texte.","Introduces an example."],
    "en général":["in general; generally","adverbial phrase","En général, je prends le bus.","Often placed at the start of a sentence."],
    "de plus":["moreover; in addition","adverbial phrase","De plus, cette solution est simple.","Adds information."],
    "au contraire":["on the contrary","adverbial phrase","Au contraire, je suis d'accord.","Corrects or reverses an expectation."],
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
    comprendre:["to understand","verb","Je comprends la question.","Irregular verb patterned on prendre."],
    vouloir:["to want","verb","Je voudrais un café.","Je voudrais is a polite conditional form."],
    pouvoir:["to be able to; can","verb","Je peux vous aider.","Irregular present: peux, peux, peut, pouvons, pouvez, peuvent."],
    devoir:["must; to have to; owe","verb","Je dois partir.","Irregular present: dois, dois, doit, devons, devez, doivent."],
    temps:["time; weather","noun (masculine)","Je n'ai pas le temps.","The meaning depends on context."],
    jour:["day","noun (masculine)","Bonne journée !","Bonne journée is a friendly daytime farewell."],
    fille:["girl; daughter","noun (feminine)","Sa fille parle français.","Context determines girl or daughter."],
    garçon:["boy; waiter","noun (masculine)","Le garçon lit un livre.","In a café, garçon can historically mean waiter; garçon de café is clearer."],
    femme:["woman; wife","noun (feminine)","Cette femme parle anglais.","Context determines woman or wife."],
    homme:["man; human being","noun (masculine)","Cet homme est gentil.","Cet is used before masculine nouns beginning with a vowel sound."],
    école:["school","noun (feminine)","Les enfants vont à l'école.","Use à l'école."],
    travailleur:["hard-working; worker","adjective/noun","Il est très travailleur.","Feminine travailleuse."],
    gentil:["kind; nice","adjective","Il est gentil.","Feminine gentille."],
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
    combien:["how much; how many","question word","Combien ça coûte ?","Use combien de before a noun in many quantity questions."],
    lequel:["which one","interrogative pronoun","Lequel préfères-tu ?","Forms vary by gender and number: lequel, laquelle, lesquels, lesquelles."],
    donc:["so; therefore","adverb/conjunction","Il pleut, donc je reste.","Expresses a consequence."],
    pourtant:["however; yet","adverb","Il est fatigué, pourtant il continue.","Introduces contrast."],
    déjà:["already","adverb","J'ai déjà mangé.","Often used with a completed action."],
    encore:["again; still; yet","adverb","Tu es encore ici ?","Several meanings; context matters."],
    bientôt:["soon","adverb","À bientôt !","Common farewell: à bientôt."],
    ensemble:["together","adverb","Nous étudions ensemble.","Often follows the verb or object."],
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
    [/\bj['’]ai besoin d['’]aide\b/gi,"I need help"],[/\bj'ai faim\b/gi,"I am hungry"],[/\bj'ai soif\b/gi,"I am thirsty"],[/\bje suis fatigu(?:é|ée)\b/gi,"I am tired"],[/\bje ne sais pas\b/gi,"I don't know"],[/\bje suis désolé[e]?\b/gi,"I am sorry"],[/\bpouvez-vous m'aider\b/gi,"can you help me"],[/\bje suis d'accord\b/gi,"I agree"],
    [/\bje m'appelle\b/gi,"my name is"],[/\bcomment allez-vous\b/gi,"how are you (formal/plural)"],[/\bcomment ça va\b/gi,"how are things going"],[/\bça va\b/gi,"I'm fine / it's going"],[/\bje voudrais\b/gi,"I would like"],[/\bs['’]il vous plaît\b/gi,"please (formal/plural)"],[/\bs['’]il te plaît\b/gi,"please (informal)"],[/\bmerci beaucoup\b/gi,"thank you very much"],[/\bau revoir\b/gi,"goodbye"],[/\bà bientôt\b/gi,"see you soon"],[/\bà demain\b/gi,"see you tomorrow"],[/\bje ne comprends pas\b/gi,"I don't understand"],[/\bje comprends\b/gi,"I understand"],[/\best-ce que\b/gi,"question marker"],[/\bparce que\b/gi,"because"],[/\bil y a\b/gi,"there is / there are"],[/\bje suis\b/gi,"I am"],[/\bj['’]ai\b/gi,"I have"],[/\btu es\b/gi,"you are"],[/\bil est\b/gi,"he is / it is"],[/\bnous sommes\b/gi,"we are"],[/\bvous êtes\b/gi,"you are"],[/\bils sont\b/gi,"they are"],[/\bje vais\b/gi,"I go / I am going"],[/\bje veux\b/gi,"I want"],[/\bje peux\b/gi,"I can"],[/\bbonjour\b/gi,"hello"],[/\bbonsoir\b/gi,"good evening"],[/\bsalut\b/gi,"hi / bye"],[/\bmerci\b/gi,"thank you"],[/\boui\b/gi,"yes"],[/\bnon\b/gi,"no"],[/\baujourd['’]hui\b/gi,"today"],[/\bdemain\b/gi,"tomorrow"],[/\bhier\b/gi,"yesterday"],[/\bmaison\b/gi,"house / home"],[/\bécole\b/gi,"school"],[/\bfrançais\b/gi,"French"],[/\bamour\b/gi,"love"],[/\bami\b/gi,"friend"],[/\blivre\b/gi,"book"],[/\beau\b/gi,"water"],[/\bpain\b/gi,"bread"],[/\bparler\b/gi,"to speak"],[/\bmanger\b/gi,"to eat"],[/\bapprendre\b/gi,"to learn"],[/\bcomprendre\b/gi,"to understand"],[/\btravailler\b/gi,"to work"],[/\bétudiant\b/gi,"student"],[/\bétudiante\b/gi,"student"],[/\bcomment\b/gi,"how"],[/\bpourquoi\b/gi,"why"],[/\bquand\b/gi,"when"],[/\boù\b/gi,"where"],[/\bavec\b/gi,"with"],[/\bsans\b/gi,"without"],[/\bbeaucoup\b/gi,"a lot"],[/\btoujours\b/gi,"always"],[/\bjamais\b/gi,"never"],[/\bmais\b/gi,"but"],[/\bbien\b/gi,"well"],[/\btrès\b/gi,"very"]
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
,
    {title:"Depuis vs pendant",body:"Depuis describes a starting point or duration that continues up to now: J'habite ici depuis 2022; J'attends depuis une heure. Pendant frames the duration of an event: J'ai étudié pendant deux heures. The tense and context matter; do not translate either word mechanically."},
    {title:"Savoir vs connaître",body:"Use savoir for facts, information, or knowing how to do something: Je sais la réponse; Je sais nager. Use connaître for familiarity with people, places, works, or things: Je connais Marie; Je connais Paris. A following infinitive often signals savoir + skill."},
    {title:"Avoir besoin de vs avoir envie de",body:"Avoir besoin de means to need: J'ai besoin d'aide; J'ai besoin de dormir. Avoir envie de means to feel like or want: J'ai envie d'un café; J'ai envie de sortir. Before a vowel, de may contract to d'."},
    {title:"Object pronouns before the verb",body:"In a simple affirmative clause, common object pronouns usually come before the conjugated verb: Je le vois; Elle me connaît; Nous leur parlons. With a positive infinitive construction, the pronoun often goes immediately before the infinitive: Je veux le voir. Imperatives have different placement rules."},
    {title:"Y and en",body:"Y often replaces à + thing/place: Je vais à Paris → J'y vais; Je pense à ce problème → J'y pense. En often replaces de + thing or a quantity: Je parle de ce livre → J'en parle; Tu veux du pain ? → Oui, j'en veux deux. People and idioms may require other pronouns."},
    {title:"Agreement with être in passé composé",body:"With many verbs that take être in the passé composé, the past participle agrees with the subject: Elle est arrivée; Ils sont partis; Elles sont parties. Most verbs take avoir, and agreement with a preceding direct object is a separate rule. Check the verb and sentence structure."},
    {title:"Imparfait endings",body:"For most verbs, take the nous form of the present, remove -ons, and add -ais, -ais, -ait, -ions, -iez, -aient: nous parlons → je parlais. Être is irregular: j'étais, tu étais, il était, nous étions, vous étiez, ils étaient. Use the imparfait for background, habits and ongoing past states."},
    {title:"Conditional politeness",body:"The conditionnel présent often softens a request: Je voudrais un café; Pourriez-vous m'aider ? It can also express a hypothetical result: Si j'avais le temps, je voyagerais. In the common si + imparfait pattern, do not put the conditional directly after si."},
    {title:"Negation with an infinitive",body:"When the infinitive is negated, ne pas usually comes directly before it: Je préfère ne pas sortir; J'ai décidé de ne pas partir. With a conjugated verb, ne surrounds the verb: Je ne sors pas. In everyday speech ne is often dropped, but formal writing usually retains it."}  ];
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
  function norm(s){return String(s||"").replace(/[’‘‛ʼ＇]/g,"'").replace(/[＂“”„]/g,'"').toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().replace(/\s+/g," ");}
function lookup(word){
  const q=String(word||"").trim();if(!q)return null;
  let foundKey=q.toLocaleLowerCase("fr");
  let found=dictionary[foundKey];
  if(!found){const key=Object.keys(dictionary).find(k=>norm(k)===norm(q));if(key){foundKey=key;found=dictionary[key];}}
  if(found)return {word:foundKey,meaning:found[0],part:found[1],example:found[2],notes:found[3],builtIn:true};
  const rev=Object.keys(dictionary).find(k=>norm(dictionary[k][0].split(";")[0])===norm(q));
  if(rev)return {word:rev,meaning:dictionary[rev][0],part:dictionary[rev][1],example:dictionary[rev][2],notes:dictionary[rev][3],builtIn:true};
  return null;
}
function showAnswer(html){const out=$("fiAnswer");if(out)out.innerHTML=html;}
  function dictionaryHtml(d){return `<div class="fi-answer"><h3 style="margin:0 0 6px">${esc(d.word)}</h3><div><b>Meaning:</b> ${esc(d.meaning)}</div><div class="fi-muted">Part of speech: ${esc(d.part)}</div><p><b>Example:</b> <i>${esc(d.example)}</i></p><p><b>Usage:</b> ${esc(d.notes)}</p><span class="fi-tag">Built-in entry</span></div>`;}
function phraseMatcher(re){
  let source=re.source;
  if(source.startsWith("\\b"))source="(?<![\\p{L}\\p{N}_])"+source.slice(2);
  if(source.endsWith("\\b"))source=source.slice(0,-2)+"(?![\\p{L}\\p{N}_])";
  const groups={a:"[aàáâäãå]",c:"[cç]",e:"[eéèêë]",i:"[iîï]",o:"[oôö]",u:"[uùûü]",y:"[yÿ]",n:"[nñ]"};
  source=source.replace(/[àáâäãåçéèêëîïôöùûüÿñ]/gi,ch=>{const base=ch.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();return groups[base]||ch;});
  return new RegExp(source,re.flags.includes("u")?re.flags:re.flags+"u");
}
function translate(text,direction){
  const q=String(text||"").trim();if(!q)return "Enter some text first.";
  if(direction==="fr-en"){
    const value=structuredCore.translate(q,"fr-en");
    if(value.status==="supported")return '<div class="fi-answer"><b>English:</b><div class="fi-output">'+esc(value.translation)+'</div><p class="fi-muted">Every word in the input is covered by a local phrase pattern.</p></div>';
    const hints=(value.vocabularyHints||[]).map(x=>'<li><b>'+esc(x.word)+'</b>: '+esc(x.meaning)+'</li>').join("");
    return '<div class="fi-answer"><b>Ambiguous — no full translation offered</b><p>'+esc(value.explanation)+'</p>'+(hints?'<p>Vocabulary hints:</p><ul>'+hints+'</ul>':'<p>No vocabulary hints are available for this input.</p>')+'</div>';
  }
  const pairs={"hello":"bonjour","good morning":"bonjour","good evening":"bonsoir","goodbye":"au revoir","thank you":"merci","thank you very much":"merci beaucoup","please":"s'il vous plaît","yes":"oui","no":"non","i am":"je suis","i have":"j'ai","i would like":"je voudrais","i don't understand":"je ne comprends pas","where is the station":"où est la gare","how are you":"comment allez-vous","my name is":"je m'appelle","i love you":"je t'aime","see you tomorrow":"à demain","see you soon":"à bientôt","i speak french":"je parle français","i am learning french":"j'apprends le français","i need help":"j'ai besoin d'aide","i am hungry":"j'ai faim","i am thirsty":"j'ai soif","i am tired":"je suis fatigué(e)","i am happy":"je suis heureux/heureuse","where is the bathroom":"où sont les toilettes","how much does it cost":"combien ça coûte","i don't know":"je ne sais pas","i understand":"je comprends","i am sorry":"je suis désolé(e)","excuse me":"excusez-moi","see you later":"à plus tard","have a nice day":"bonne journée","good night":"bonne nuit","what time is it":"quelle heure est-il","i need a doctor":"j'ai besoin d'un médecin","can you help me":"pouvez-vous m'aider","i would like water":"je voudrais de l'eau","i agree":"je suis d'accord"};
  const exact=Object.keys(pairs).find(k=>norm(k)===norm(q));if(exact)return '<div class="fi-answer"><b>French:</b> '+esc(pairs[exact])+'<p class="fi-muted">Known phrasebook match.</p></div>';
  return '<div class="fi-answer">This phrase is not in the local phrasebook yet. I won\\'t guess a full translation. Try a shorter phrase, or use <a href="https://www.deepl.com/translator#en/fr/'+encodeURIComponent(q)+'" target="_blank" rel="noopener noreferrer">DeepL</a> or <a href="https://translate.google.com/?sl=en&tl=fr&text='+encodeURIComponent(q)+'" target="_blank" rel="noopener noreferrer">Google Translate</a> and review the result.</div>';
}
function conjugate(raw){
  const value=structuredCore.conjugate(raw);
  if(!value || value.status!=="supported")return null;
  return {v:value.v,forms:[...value.forms],type:value.type};
}
function answerQuestion(q){
  const n=norm(q);
  if(!q.trim())return "Type a question first.";
  if(/depuis/.test(n)&&/pendant/.test(n))return "<b>Depuis vs pendant</b><p><i>Depuis</i> usually links a past starting point to a situation continuing now: <i>J'habite ici depuis trois ans</i> (I've lived here for three years). <i>Pendant</i> frames a duration: <i>J'ai étudié pendant deux heures</i> (I studied for two hours). Context and tense determine the best translation.</p>";
  if(/savoir/.test(n)&&/connaitre|connaître/.test(n))return "<b>Savoir vs connaître</b><p>Use <i>savoir</i> for facts or skills: <i>Je sais la réponse</i>; <i>Je sais nager</i>. Use <i>connaître</i> for familiarity: <i>Je connais cette ville</i>; <i>Je connais Marie</i>.</p>";
  if(/y\b/.test(n)&&/en\b/.test(n)&&/(pronoun|pronom|difference|différence|use|utilis)/.test(n))return "<b>Y vs en</b><p><i>Y</i> often replaces <i>à</i> + thing/place: <i>Je vais à Paris → J'y vais</i>. <i>En</i> often replaces <i>de</i> + thing or a quantity: <i>Je parle de ce livre → J'en parle</i>; <i>J'en veux deux</i>. Pronoun choice depends on the verb's construction and meaning.</p>";
  if(/conditionnel|conditional/.test(n))return "<b>Conditional for polite requests and hypotheses</b><p><i>Je voudrais un café</i> is a polite request; <i>Pourriez-vous m'aider ?</i> means “Could you help me?” In a common hypothesis: <i>Si j'avais le temps, je voyagerais</i>. Do not put the conditional directly after <i>si</i> in this pattern.</p>";

  const matched=rules.find(r=>n.includes(norm(r.title).replace("ne ... pas","ne"))|| (n.includes("negation")&&r.title.startsWith("Negation")) || (n.includes("tu")&&n.includes("vous")&&r.title==="Tu and vous"));
  if(matched)return `<b>${esc(matched.title)}</b><p>${esc(matched.body)}</p>`;
  if(/maison/.test(n)&&/(feminin|gender|genre|why|pourquoi)/.test(n))return "<b>Why is “maison” feminine?</b><p>In French, grammatical gender is a property of each noun and is not always predictable from meaning. Learn it together with its article: <i>la maison</i>. The ending -on does not reliably tell you a noun's gender.</p>";
  if(/\b(?:âge|age|ans|years old)\b/u.test(n)&&(/[?？]/u.test(String(q))||/^(?:how|what|quel(?:le)?|comment|à quel|at what)\b/u.test(n))&&/(?:\bhow old\b|\bwhat (?:is|was) (?:my|your|his|her) age\b|\b(?:my|your|his|her) age\b|\bquel(?:le)? (?:âge|age)\b|\bà quel(?:le)? (?:âge|age)\b|\bat what age\b|\bsay (?:my|your|his|her) age\b|\bask about age\b|\bexpress age\b|\bhow many years old\b)/u.test(n))return "<b>Talking about age</b><p>French uses <i>avoir</i> (to have), not <i>être</i> (to be): <i>J'ai vingt ans</i> literally means “I have twenty years.”</p>";
  if(/translate|translation|tradui|meaning|signif/.test(n)){const d=lookup(q.replace(/^(what does|meaning of|translate)\s+/i,"").replace(/[?!.]$/,""));if(d)return dictionaryHtml(d);}
  if(/grammar|grammaire|tense|temps verbal/.test(n))return "Choose the Grammar Guide to browse ten core rules, or ask about a specific structure (for example, “Explain passé composé”).";
  if(/bonjour|salut|merci|au revoir/.test(n)){const d=lookup(q.replace(/[?!.]$/,""));if(d)return dictionaryHtml(d);}
  return "I can answer from the built-in French reference set, grammar guide, common phrases and conjugation rules. I couldn't match this question confidently yet, so I won't invent an answer. Try asking about ne…pas, tu/vous, passé composé, adjective agreement, or a word in the dictionary. For deeper open-ended questions, this no-key version currently needs an optional on-device language model.";
}
function checkWriting(q){
  let suggestions=[],corrected=q;
  const subjunctiveVerbs = [
    { name: "être", indicative: ["suis","es","est","sommes","êtes","sont"], subjunctive: ["sois","sois","soit","soyons","soyez","soient"] },
    { name: "avoir", indicative: ["ai","as","a","avons","avez","ont"], subjunctive: ["aie","aies","ait","ayons","ayez","aient"] },
    { name: "aller", indicative: ["vais","vas","va","allons","allez","vont"], subjunctive: ["aille","ailles","aille","allions","alliez","aillent"] },
    { name: "faire", indicative: ["fais","fais","fait","faisons","faites","font"], subjunctive: ["fasse","fasses","fasse","fassions","fassiez","fassent"] },
    { name: "pouvoir", indicative: ["peux","peux","peut","pouvons","pouvez","peuvent"], subjunctive: ["puisse","puisses","puisse","puissions","puissiez","puissent"] },
    { name: "savoir", indicative: ["sais","sais","sait","savons","savez","savent"], subjunctive: ["sache","saches","sache","sachions","sachiez","sachent"] },
    { name: "vouloir", indicative: ["veux","veux","veut","voulons","voulez","veulent"], subjunctive: ["veuille","veuilles","veuille","voulions","vouliez","veuillent"] }
  ];
  const subjunctiveTriggers = "(?:bien\\s+que|bien\\s+qu['’]|quoique|quoiqu['’]|pour\\s+que|pour\\s+qu['’]|afin\\s+que|afin\\s+qu['’]|avant\\s+que|avant\\s+qu['’]|à\\s+moins\\s+que|à\\s+moins\\s+qu['’]|jusqu['’]à\\s+ce\\s+que|jusqu['’]à\\s+ce\\s+qu['’]|sans\\s+que|sans\\s+qu['’])";
  const indicativeForms = [...new Set(subjunctiveVerbs.flatMap(v => v.indicative))].sort((a,b) => b.length-a.length).join("|");
  // Unicode-aware word boundaries; apostrophes remain part of French elisions.
  // Hyphen is intentionally omitted from the blocked boundary class, so it separates words.
  const subjunctivePattern = new RegExp("(?<![\\p{L}\\p{N}_'’])(" + subjunctiveTriggers + ")\\s*(j['’]|je|tu|il|elle|nous|vous|ils|elles)\\s*(" + indicativeForms + ")(?![\\p{L}\\p{N}_'’])", "giu");
  const infinitiveIrregulars = new Set(["être","avoir","faire","aller","venir","tenir","prendre","mettre","dire","lire","écrire","boire","voir","pouvoir","vouloir","devoir","savoir","connaître","comprendre","apprendre","sortir","partir","dormir","ouvrir","offrir","recevoir","courir","vivre","suivre","naître","mourir","croire","rire","sourire"]);
  const isInfinitive = word => /(?:er|ir|re|oir)$/iu.test(word) || infinitiveIrregulars.has(word.toLocaleLowerCase("fr"));
  corrected = corrected.replace(subjunctivePattern, (match, trigger, subject, verb, offset, source) => {
    const subjectLower = subject.toLocaleLowerCase("fr");
    const subjectIndex = ({je:0,"j'":0,"j’":0,tu:1,il:2,elle:2,nous:3,vous:4,ils:5,elles:5})[subjectLower];
    const verbRule = subjunctiveVerbs.find(v => v.indicative.includes(verb.toLocaleLowerCase("fr")));
    if (subjectIndex === undefined || !verbRule) return match;
    const nextWord = source.slice(offset + match.length).match(/^\s+([\p{L}]+)(?![\p{L}])/u)?.[1];
    if (verbRule.name === "aller" && nextWord && isInfinitive(nextWord)) {
      suggestions.push({before: match, why: "After this conjunction the subjunctive is required. Because aller is followed by an infinitive, do not change vais/vas/va/allons/allez/vont to aille. Rewrite using the infinitive verb's own subjunctive (for example, « pour que je comprenne »).", messageOnly: true});
      return match;
    }
    suggestions.push({before: match, why: "After this conjunction, use the subjunctive mood rather than the indicative in this clause."});
    const form = verbRule.subjunctive[subjectIndex];
    const elided = subjectLower === "j'" || subjectLower === "j’";
    const replacement = elided ? subject + form : subjectLower === "je" && /^[aeiouàâäéèêëîïôöùûüÿœ]/iu.test(form) ? "j'" + form : subject + " " + form;
    return match.slice(0, match.length - subject.length - verb.length - (elided ? 0 : 1)) + replacement;
  });
  const checks=[
    [writingPattern("je suis (\\d+) ans(?!\\s+(?:plus|moins)\\b)"),(m,n)=>preserveInitialCase(m,"j'ai "+n+" ans"),"French uses avoir for age."],
    [writingPattern("je suis faim"),(m)=>preserveInitialCase(m,"j'ai faim"),"French says avoir faim (to be hungry)."],
    [writingPattern("je suis soif"),(m)=>preserveInitialCase(m,"j'ai soif"),"French says avoir soif (to be thirsty)."],
    [writingPattern("sa va(?!-et-vient)"),(m)=>preserveInitialCase(m,"ça va"),"The expression is ça va, with ç; preserve the compound va-et-vient."],
    [writingPattern("beacoup"),()=>"beaucoup","Spelling: beaucoup."],
    [writingPattern("bonjor"),()=>"bonjour","Spelling: bonjour."],
    [writingPattern("merçi"),()=>"merci","Merci is written without a cedilla."],
    [writingPattern("je ne comprends pas pas"),null,"Repeated adjacent pas is flagged for review; no automatic correction.",true],
  ];
  for(const [re,rep,why,messageOnly=false] of checks){if(re.test(corrected)){re.lastIndex=0;const before=corrected;if(!messageOnly)corrected=corrected.replace(re,rep);suggestions.push({before,why,messageOnly});}}
  if(!suggestions.length)return `<div class="fi-answer"><b>Text received</b><p>${esc(q)}</p><p>No issue from the small built-in check list was detected. That does not prove the sentence is fully correct; this is not a full grammar checker.</p></div>`;
  const hasCorrection = suggestions.some(s => !s.messageOnly);
  const heading = hasCorrection ? "Suggested text" : "Grammar note";
  const output = hasCorrection ? `<p class="fi-output">${esc(corrected)}</p>` : "";
  const action = hasCorrection ? `<button id="fiUseCorrection" class="g">Use corrected text</button>` : "";
  return `<div class="fi-answer"><b>${heading}</b>${output}<b>Why these changes?</b>${suggestions.map(s=>`<div class="fi-result">${esc(s.why)}<div class="fi-muted">Original: ${esc(s.before)}</div></div>`).join("")}${action}</div>`;
}

function runAction(id){
    if(id==="fiAsk"){const q=$("fiInput")?.value||"";showAnswer(answerQuestion(q));}
    if(id==="fiLookup"){const q=$("fiWord")?.value||"";const d=lookup(q);showAnswer(d?dictionaryHtml(d):`<div class="fi-answer">No built-in entry for <b>${esc(q)}</b>. No definition has been fabricated. Check <a href="https://www.dictionnaire-academie.fr/" target="_blank" rel="noopener noreferrer">Académie française</a>, <a href="https://www.cnrtl.fr/definition/${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">CNRTL/TLFi</a> or <a href="https://fr.wiktionary.org/wiki/${encodeURIComponent(q)}" target="_blank" rel="noopener noreferrer">Wiktionnaire</a>.</div>`);}
    if(id==="fiTranslate"){showAnswer(translate($("fiInput")?.value||"",$("fiDirection")?.value||"fr-en"));}
    if(id==="fiConjugate"){const r=conjugate($("fiVerb")?.value||"");showAnswer(r?`<div class="fi-answer"><h3>${esc(r.v)} — present tense</h3><div class="fi-muted">${esc(r.type)}</div><table><tbody>${r.forms.map((f,i)=>`<tr><td>${esc(persons[i])}</td><td><b>${esc(f)}</b></td></tr>`).join("")}</tbody></table></div>`:`<div class="fi-answer">No conjugation pattern is available for this verb. Try être, avoir, aller, faire, venir, prendre, pouvoir, vouloir, devoir, savoir, dire or a regular -er verb such as parler.</div>`);}
    if(id==="fiCheck"){const q=$("fiInput")?.value||"";showAnswer(q.trim()?checkWriting(q):"Paste some text first.");}
  }
  function open(){tab="ask";history=[];const app=$("app");if(!app)return;app.innerHTML=header();renderBody();window.scrollTo(0,0);}
  if (typeof document !== "undefined" && typeof window !== "undefined") {
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
  }


const legacyRenderer = Object.freeze({ lookup, translate, conjugate, answerQuestion, checkWriting });
function publicLookup(word) {
  const value = structuredCore.lookup(word);
  if (value.status !== "supported") return null;
  return { word: value.word, meaning: value.meaning, part: value.part, example: value.example, notes: value.notes, builtIn: value.builtIn };
}
function publicTranslate(text, direction) {
  const value = structuredCore.translate(text, direction);
  if (direction === "fr-en") {
    if (value.status === "supported") return '<div class="fi-answer"><b>English:</b><div class="fi-output">'+esc(value.translation)+'</div><p class="fi-muted">Every word in the input is covered by a local phrase pattern.</p></div>';
    const hints = (value.vocabularyHints || []).map(x => '<li><b>'+esc(x.word)+'</b>: '+esc(x.meaning)+'</li>').join("");
    return '<div class="fi-answer"><b>Ambiguous — no full translation offered</b><p>'+esc(value.explanation)+'</p>'+(hints?'<p>Vocabulary hints:</p><ul>'+hints+'</ul>':'<p>No vocabulary hints are available for this input.</p>')+'</div>';
  }
  return legacyRenderer.translate(text, direction);
}
function publicConjugate(raw) {
  const value = structuredCore.conjugate(raw);
  if (value.status !== "supported") return null;
  return { v: value.v, forms: value.forms, type: value.type };
}
function publicAnswerQuestion(q) {
  structuredCore.answerQuestion(q);
  return legacyRenderer.answerQuestion(q);
}
function publicCheckWriting(q) {
  structuredCore.checkWriting(q);
  return legacyRenderer.checkWriting(q);
}
const api = Object.freeze({
  lookup: publicLookup,
  translate: publicTranslate,
  conjugate: publicConjugate,
  answerQuestion: publicAnswerQuestion,
  checkWriting: publicCheckWriting
});
if (typeof window !== "undefined") window.FrenchIntelligenceCore = api;
export { publicLookup as lookup, publicTranslate as translate, publicConjugate as conjugate, publicAnswerQuestion as answerQuestion, publicCheckWriting as checkWriting };
export default api;
