import { VERB_PARADIGMS, LEGACY_IRREGULARS, PARADIGM_STATUS, REGULAR_ER_CLASS, REGULAR_ER_VERBS, SPELLING_CHANGE_CLASS, PERSONS } from "./french-conjugation-paradigms.mjs";
/* Pure structured French Intelligence core. No DOM, browser globals, network, storage, or HTML rendering. */

const writingPattern = (source, flags = "gi") => new RegExp("(?<![\\p{L}\\p{N}_'’\\-])(?:" + source + ")(?![\\p{L}\\p{N}_'’\\-])", flags.includes("u") ? flags : flags + "u");
const preserveInitialCase = (match, replacement) => match && /^\p{Lu}/u.test(match) ? replacement.charAt(0).toLocaleUpperCase("fr") + replacement.slice(1) : replacement;

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

const phrasebookPairs={"hello":"bonjour","good morning":"bonjour","good evening":"bonsoir","goodbye":"au revoir","thank you":"merci","thank you very much":"merci beaucoup","please":"s'il vous plaît","yes":"oui","no":"non","i am":"je suis","i have":"j'ai","i would like":"je voudrais","i don't understand":"je ne comprends pas","where is the station":"où est la gare","how are you":"comment allez-vous","my name is":"je m'appelle","i love you":"je t'aime","see you tomorrow":"à demain","see you soon":"à bientôt","i speak french":"je parle français","i am learning french":"j'apprends le français","i need help":"j'ai besoin d'aide","i am hungry":"j'ai faim","i am thirsty":"j'ai soif","i am tired":"je suis fatigué(e)","i am happy":"je suis heureux/heureuse","where is the bathroom":"où sont les toilettes","how much does it cost":"combien ça coûte","i don't know":"je ne sais pas","i understand":"je comprends","i am sorry":"je suis désolé(e)","excuse me":"excusez-moi","see you later":"à plus tard","have a nice day":"bonne journée","good night":"bonne nuit","what time is it":"quelle heure est-il","i need a doctor":"j'ai besoin d'un médecin","can you help me":"pouvez-vous m'aider","i would like water":"je voudrais de l'eau","i agree":"je suis d'accord"};

function norm(s){return String(s||"").replace(/[’‘‛ʼ＇]/g,"'").replace(/[＂“”„]/g,'"').toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().replace(/\s+/g," ");}

function phraseMatcher(re){
    let source=re.source;
    if(source.startsWith("\\b"))source="(?<![\\p{L}\\p{N}_])"+source.slice(2);
    if(source.endsWith("\\b"))source=source.slice(0,-2)+"(?![\\p{L}\\p{N}_])";
    const groups={a:"[aàáâäãå]",c:"[cç]",e:"[eéèêë]",i:"[iîï]",o:"[oôö]",u:"[uùûü]",y:"[yÿ]",n:"[nñ]"};
    source=source.replace(/[àáâäãåçéèêëîïôöùûüÿñ]/gi,ch=>{const base=ch.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();return groups[base]||ch;});
    return new RegExp(source,re.flags.includes("u")?re.flags:re.flags+"u");
  }

function result(status, confidence, rule_id, explanation, fields = {}) {
  return { status, confidence, rule_id, explanation, sources: ["built-in French reference set"], ...fields };
}
function findDictionaryEntry(word) {
  const q = String(word || "").trim();
  if (!q) return null;
  let foundKey = q.toLocaleLowerCase("fr");
  let found = dictionary[foundKey];
  if (!found) {
    const key = Object.keys(dictionary).find(k => norm(k) === norm(q));
    if (key) { foundKey = key; found = dictionary[key]; }
  }
  if (found) return { word: foundKey, meaning: found[0], part: found[1], example: found[2], notes: found[3], builtIn: true };
  const rev = Object.keys(dictionary).find(k => norm(dictionary[k][0].split(";")[0]) === norm(q));
  if (rev) return { word: rev, meaning: dictionary[rev][0], part: dictionary[rev][1], example: dictionary[rev][2], notes: dictionary[rev][3], builtIn: true };
  return null;
}
function lookup(word) {
  const entry = findDictionaryEntry(word);
  if (entry) return result("supported", 1, "dictionary." + entry.word, entry.notes, entry);
  return result("unsupported", 0, "dictionary.no-match", "No built-in dictionary entry matched this input.", { query: String(word || "").trim() });
}
function translate(text, direction) {
  const q = String(text || "").trim();
  if (!q) return result("unsupported", 0, "translation.empty", "Enter some text first.", { kind: "empty", input: q });
  if (direction === "en-fr") {
    const exact = Object.keys(phrasebookPairs).find(k => norm(k) === norm(q));
    if (exact) return result("supported", 1, "phrasebook.en-fr.exact", "Known phrasebook match.", { kind: "en-fr-exact", input: q, translation: phrasebookPairs[exact], matchedKey: exact });
    return result("unsupported", 0, "phrasebook.en-fr.no-match", "This phrase is not in the local phrasebook yet. I won't guess a full translation.", { kind: "en-fr-unsupported", input: q });
  }
  const candidates = [];
  for (const [re, english] of phraseMap) {
    const matcher = phraseMatcher(re); matcher.lastIndex = 0; let match;
    while ((match = matcher.exec(q))) { candidates.push({ start: match.index, end: match.index + match[0].length, english }); if (!match[0].length) matcher.lastIndex++; }
  }
  candidates.sort((a,b) => a.start - b.start || (b.end-b.start) - (a.end-a.start));
  const selected = []; let cursor = -1;
  for (const candidate of candidates) { if (candidate.start < cursor) continue; selected.push(candidate); cursor = candidate.end; }
  const covered = new Array(q.length).fill(false);
  for (const match of selected) for (let i=match.start;i<match.end;i++) covered[i]=true;
  let uncoveredToken = false;
  for (let i=0;i<q.length;i++) if (/[\p{L}\p{N}]/u.test(q[i]) && !covered[i]) uncoveredToken = true;
  const words = q.match(/[\p{L}’'-]+/gu) || [];
  const hints = words.map(w => ({ word: w, entry: findDictionaryEntry(w) })).filter(x => x.entry).map(x => ({ word: x.word, meaning: x.entry.meaning }));
  if (selected.length && !uncoveredToken) {
    let translation = "", last = 0;
    for (const match of selected) { translation += q.slice(last,match.start) + match.english; last=match.end; }
    translation += q.slice(last);
    return result("supported", 0.9, "phrasebook.fr-en.covered", "Every word in the input is covered by a local phrase pattern.", { kind: "fr-en-covered", input: q, translation, matches: [...new Set(selected.map(x=>x.english))] });
  }
  return result("ambiguous", 0.45, "phrasebook.fr-en.incomplete-coverage", "Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.", { kind: "fr-en-vocabulary", input: q, vocabularyHints: hints, matchedPhrases: [...new Set(selected.map(x=>x.english))] });
}
function conjugate(raw) {
  const v = String(raw || "").toLocaleLowerCase("fr").trim().replace(/^to /, "");
  if (!v) return result("unsupported", 0, "conjugation.empty", "No verb was supplied.", { query: v });
  let forms = VERB_PARADIGMS[v] ? [...VERB_PARADIGMS[v]] : null;
  let status = PARADIGM_STATUS[v] || null;
  const dictionaryEntry = dictionary[v];
  const dictionaryMarksVerb = Boolean(dictionaryEntry && /verb/i.test(String(dictionaryEntry[1] || "")));
  let type = LEGACY_IRREGULARS.has(v) ? "Irregular verb · present tense" : ["manger","commencer"].includes(v) ? "Regular -er pattern with spelling adjustment" : ["finir","choisir","réussir","grandir","remplir","obéir","réfléchir"].includes(v) ? "Regular -ir verb · present tense (finir pattern)" : ["vendre","attendre","entendre","répondre","perdre","rendre","descendre"].includes(v) ? "Regular -re verb · present-tense pattern (verify exceptions)" : status === "verified" ? "Explicit verified present-tense paradigm" : "Explicit present-tense paradigm · needs review";
  if (!forms && /er$/u.test(v) && v.length > 3 && (REGULAR_ER_VERBS.has(v) || dictionaryMarksVerb) && !SPELLING_CHANGE_CLASS.test(v)) {
    const stem = v.slice(0, -2);
    forms = [stem+"e",stem+"es",stem+"e",stem+"ons",stem+"ez",stem+"ent"];
    status = REGULAR_ER_CLASS.status; type = REGULAR_ER_CLASS.type;
  }
  if (!forms) return result("unsupported", 0, "conjugation.no-paradigm", "No explicit present-tense paradigm is available for this verb.", { query: v });
  return result("supported", status === "verified" ? 0.99 : 0.75, "conjugation.present." + status, type, { v, forms, type, paradigmStatus: status, persons: [...PERSONS] });
}
function answerQuestion(q) {
  const n = norm(q);
  if (!q.trim()) return result("unsupported", 0, "question.empty", "Type a question first.", { kind: "empty", input: q });
  if (/depuis/.test(n) && /pendant/.test(n)) return result("supported", 0.9, "question.depuis-pendant", "Depuis links a past starting point to a situation continuing now; pendant frames a duration.", { kind: "depuis-pendant", title: "Depuis vs pendant" });
  if (/savoir/.test(n) && /connaitre|connaître/.test(n)) return result("supported", 0.9, "question.savoir-connaitre", "Savoir is used for facts or skills; connaître is used for familiarity.", { kind: "savoir-connaitre", title: "Savoir vs connaître" });
  if (/\by\b/.test(n) && /\ben\b/.test(n) && /(pronoun|pronom|difference|différence|use|utilis)/.test(n)) return result("supported", 0.9, "question.y-en", "Y often replaces à plus a thing or place; en often replaces de plus a thing or a quantity.", { kind: "y-en", title: "Y vs en" });
  if (/conditionnel|conditional/.test(n)) return result("supported", 0.9, "question.conditional", "The conditional is used for polite requests and hypotheses.", { kind: "conditional", title: "Conditional for polite requests and hypotheses" });
  const matched = rules.find(r => n.includes(norm(r.title).replace("ne ... pas", "ne")) || (n.includes("negation") && r.title.startsWith("Negation")) || (n.includes("tu") && n.includes("vous") && r.title === "Tu and vous"));
  if (matched) return result("supported", 0.9, "grammar." + matched.title, matched.body, { kind: "grammar-rule", title: matched.title, body: matched.body });
  if (/maison/.test(n) && /(feminin|gender|genre|why|pourquoi)/.test(n)) return result("supported", 0.85, "question.maison-gender", "Grammatical gender is a property of each noun and is not always predictable from meaning. Learn the noun with its article: la maison. The ending -on does not reliably indicate gender.", { kind: "maison-gender" });
  if (/\b(?:âge|age|ans|years old)\b/u.test(n) && (/[?？]/u.test(String(q)) || /^(?:how|what|quel(?:le)?|comment|à quel|at what)\b/u.test(n)) && /(?:how old|what age|quel(?:le)? age|à quel(?:le)? âge|years old|\b(?:âge|age|ans)\b)/u.test(n)) return result("supported", 0.9, "question.age", "French uses avoir, not être, to express age.", { kind: "age" });
  if (/translate|translation|tradui|meaning|signif/.test(n)) {
    const entry = findDictionaryEntry(q.replace(/^(what does|meaning of|translate)\s+/i, "").replace(/[?!.]$/, ""));
    if (entry) return result("supported", 0.9, "question.dictionary." + entry.word, entry.notes, { kind: "dictionary", entry });
  }
  if (/grammar|grammaire|tense|temps verbal/.test(n)) return result("unsupported", 0.2, "question.grammar-guide", "Choose the Grammar Guide to browse ten core rules, or ask about a specific structure.", { kind: "grammar-guide" });
  if (/bonjour|salut|merci|au revoir/.test(n)) {
    const entry = findDictionaryEntry(q.replace(/[?!.]$/, ""));
    if (entry) return result("supported", 0.85, "question.dictionary." + entry.word, entry.notes, { kind: "dictionary", entry });
  }
  return result("unsupported", 0.1, "question.no-confident-match", "I couldn't match this question confidently yet, so I won't invent an answer.", { kind: "fallback", input: q });
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
  if (!suggestions.length) {
    return result("supported", 0.72, "writing.no-listed-issue", "No issue from the small built-in check list was detected. That does not prove the sentence is fully correct; this is not a full grammar checker.", {
      kind: "no-issues", input: q, corrected: q, suggestions: [], hasCorrection: false
    });
  }
  const hasCorrection = suggestions.some(s => !s.messageOnly);
  return result(hasCorrection ? "supported" : "ambiguous", hasCorrection ? 0.82 : 0.55,
    hasCorrection ? "writing.correction" : "writing.review-only",
    suggestions.map(s => s.why).join(" "),
    { kind: "suggestions", input: q, corrected, suggestions, hasCorrection });
}

export { lookup, translate, conjugate, answerQuestion, checkWriting, writingPattern };

export const FrenchIntelligenceCoreV1 = Object.freeze({ lookup, translate, conjugate, answerQuestion, checkWriting });