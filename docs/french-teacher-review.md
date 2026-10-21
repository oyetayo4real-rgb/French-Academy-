# French Academy — Human French Teacher Review

Purpose: independently review the exact content and rule logic currently present in `features/french-intelligence.js`. The source fields below are copied from the engine; no missing definitions, mappings, examples, or explanations have been filled in. The review column is intentionally blank for the teacher to mark `OK`, `Wrong`, or `Fix` and write a correction where needed.

Source engine commit: `a6f0428e641dcb4342bc7ec363f70047a35b87a9` (source file blob SHA at extraction: `4f73adda46160d72517ed09510af15239c4f73cc`).

Review notation: fill the final column with `OK`, `Wrong`, or `Fix: <corrected content>`. Do not treat automated tests as teacher sign-off.

## 1. Dictionary entries

All 139 dictionary keys are listed with the source meaning, source part-of-speech/gender field, source example, and source note. The engine's field is called POS/gender because some entries are verbs, adverbs, or expressions rather than gendered nouns.

| Word / headword | Meaning (exact source) | Gender / part of speech (exact source) | Example (exact source) | Note (exact source) | OK / Wrong / Fix |
|---|---|---|---|---|---|
| bonjour | hello; good morning | interjection | Bonjour, comment allez-vous ? | A standard greeting; use bonsoir in the evening. |  |
| bonsoir | good evening | interjection | Bonsoir, madame. | Used as a greeting in the evening. |  |
| salut | hi; bye | interjection | Salut, ça va ? | Informal; use with friends or people you know well. |  |
| merci | thank you; thanks | interjection | Merci beaucoup pour votre aide. | Beaucoup intensifies merci. |  |
| s'il vous plaît | please | expression | Un café, s'il vous plaît. | Polite/formal or plural form. |  |
| s'il te plaît | please | expression | Aide-moi, s'il te plaît. | Informal singular form. |  |
| amour | love | noun (masculine) | L'amour est important. | Usually masculine in the singular: un amour. |  |
| ami | friend | noun (masculine) | C'est mon ami. | Feminine: amie; plural: amis/amies. |  |
| amie | friend | noun (feminine) | Elle est mon amie. | Before a vowel, mon amie is used rather than ma amie. |  |
| maison | house; home | noun (feminine) | Je rentre à la maison. | Common phrase: chez moi = at my home. |  |
| livre | book | noun (masculine) | Je lis un livre. | Un livre means a book; une livre can mean a pound. |  |
| pain | bread | noun (masculine) | Je voudrais du pain. | Du pain is an uncountable quantity of bread. |  |
| manger | to eat | verb | Nous mangeons ensemble. | Regular -er verb, with spelling change in nous: mangeons. |  |
| parler | to speak; to talk | verb | Je parle français. | Regular -er verb. |  |
| être | to be | verb | Je suis étudiant. | Irregular; present forms: suis, es, est, sommes, êtes, sont. |  |
| avoir | to have | verb | J'ai vingt ans. | Irregular; French uses avoir for age. |  |
| aller | to go | verb | Nous allons à Paris. | Irregular; aller + infinitive forms the near future. |  |
| faire | to do; to make | verb | Je fais mes devoirs. | Irregular present forms include fais, fait, faisons, faites, font. |  |
| bien | well; good | adverb/adjective | Je vais bien, merci. | In ça va bien, it means well. |  |
| bon | good | adjective | C'est un bon livre. | Before a masculine singular noun. |  |
| bonne | good | adjective | C'est une bonne idée. | Feminine form of bon. |  |
| petit | small; little | adjective | Un petit chat. | Feminine petite; agreement matters. |  |
| grande | big; tall | adjective | Une grande maison. | Feminine form of grand. |  |
| travail | work; job | noun (masculine) | Je cherche du travail. | Usually masculine: un travail; plural travaux in many contexts. |  |
| famille | family | noun (feminine) | Ma famille habite ici. | Usually feminine: une famille. |  |
| enfant | child | noun (masculine or feminine by person) | L'enfant joue dehors. | The noun is grammatically masculine; the person's sex is contextual. |  |
| ville | city; town | noun (feminine) | Paris est une grande ville. | Usually feminine: une ville. |  |
| pays | country | noun (masculine, usually) | La France est un pays européen. | Usually masculine; some country names use articles of other genders. |  |
| nuit | night | noun (feminine) | Bonne nuit ! | Usually feminine: la nuit. |  |
| matin | morning | noun (masculine) | Je travaille le matin. | Bonjour is used as a greeting during the day. |  |
| soir | evening | noun (masculine) | Je rentre ce soir. | Bonsoir is the usual evening greeting. |  |
| heureux | happy | adjective | Je suis heureux. | Feminine heureuse; agreement depends on the person described. |  |
| difficile | difficult; hard | adjective | C'est une question difficile. | Same written form for masculine and feminine singular. |  |
| facile | easy | adjective | Cet exercice est facile. | Same written form for masculine and feminine singular. |  |
| important | important | adjective | C'est un point important. | Feminine importante; agrees with the noun. |  |
| besoin | need | noun (masculine) | J'ai besoin d'aide. | Common construction: avoir besoin de. |  |
| envie | desire; urge | noun (feminine) | J'ai envie de dormir. | Common construction: avoir envie de + noun/infinitive. |  |
| raison | reason; right | noun (feminine) | Tu as raison. | Avoir raison means to be right; avoir tort means to be wrong. |  |
| question | question | noun (feminine) | J'ai une question. | Usually feminine: une question. |  |
| réponse | answer; reply | noun (feminine) | Merci pour votre réponse. | Canonical spelling uses é. |  |
| choisir | to choose | verb | Je choisis un livre. | Regular -ir verb following the finir pattern. |  |
| attendre | to wait for | verb | J'attends le bus. | The object waited for follows attendre directly, without pour. |  |
| connaître | to know; be familiar with | verb | Je connais cette ville. | Use connaître for people/places/things you are familiar with; savoir for facts or skills. |  |
| depuis | since; for (duration continuing to now) | preposition/adverb | J'habite ici depuis trois ans. | Often used with the present tense for an action/state that began in the past and continues. |  |
| pendant | during; for (duration) | preposition | J'ai étudié pendant deux heures. | Frames a duration; tense depends on whether the event is ongoing or completed. |  |
| en revanche | on the other hand; by contrast | conjunction phrase | Il est petit. En revanche, il est très rapide. | Introduces a contrast. |  |
| tout à fait | absolutely; quite | adverbial phrase | Tout à fait, je suis d'accord. | Can express strong agreement. |  |
| pas du tout | not at all | adverbial phrase | Je ne suis pas du tout fatigué. | Intensifies a negation. |  |
| de temps en temps | from time to time | adverbial phrase | Je cuisine de temps en temps. | Means occasionally. |  |
| en train de | in the process of; currently | verbal expression | Je suis en train de lire. | Être en train de + infinitive emphasizes an action in progress. |  |
| avoir besoin de | to need | verbal expression | J'ai besoin de repos. | Avoir + besoin + de + noun/infinitive. |  |
| avoir envie de | to feel like; want to | verbal expression | J'ai envie de sortir. | Avoir + envie + de + noun/infinitive. |  |
| avoir raison | to be right | verbal expression | Tu as raison. | Literally “to have reason”. |  |
| avoir tort | to be wrong | verbal expression | Je crois que j'ai tort. | Fixed expression. |  |
| il faut | it is necessary; one must | impersonal expression | Il faut étudier régulièrement. | Followed by an infinitive or de + noun depending on structure. |  |
| tout de suite | right away; immediately | adverbial phrase | J'arrive tout de suite. | Means immediately. |  |
| à cause de | because of | prepositional phrase | Le match est annulé à cause de la pluie. | Introduces a cause. |  |
| grâce à | thanks to | prepositional phrase | Grâce à toi, j'ai réussi. | Usually introduces a helpful or positive cause. |  |
| en fait | actually; in fact | discourse marker | En fait, je suis déjà prêt. | Often used to clarify or correct information. |  |
| quand même | anyway; nevertheless | adverbial phrase | Il pleut, mais je sors quand même. | Meaning depends strongly on context. |  |
| d'accord | okay; agreed | expression | D'accord, on commence. | Common expression of agreement. |  |
| ça dépend | it depends | expression | Ça dépend de la situation. | Often followed by de. |  |
| par exemple | for example | adverbial phrase | Par exemple, on peut lire ce texte. | Introduces an example. |  |
| en général | in general; generally | adverbial phrase | En général, je prends le bus. | Often placed at the start of a sentence. |  |
| de plus | moreover; in addition | adverbial phrase | De plus, cette solution est simple. | Adds information. |  |
| au contraire | on the contrary | adverbial phrase | Au contraire, je suis d'accord. | Corrects or reverses an expectation. |  |
| aujourd'hui | today | adverb | Aujourd'hui, je travaille. | Often placed at the beginning of a sentence. |  |
| demain | tomorrow | adverb/noun | À demain ! | À demain means see you tomorrow. |  |
| hier | yesterday | adverb/noun | Hier, j'ai travaillé. | Often used with the passé composé for completed events. |  |
| pourquoi | why | question word | Pourquoi apprends-tu le français ? | Answer a why-question with parce que (because). |  |
| comment | how; what ... like | question word | Comment tu t'appelles ? | Comment vous appelez-vous? is a formal alternative. |  |
| quand | when | question word/conjunction | Quand arrives-tu ? | Can introduce a time clause. |  |
| où | where | question word/adverb | Où habites-tu ? | Accent distinguishes où (where) from ou (or). |  |
| mais | but | conjunction | Je suis fatigué, mais content. | Connects contrasting ideas. |  |
| parce que | because | conjunction | Je reste parce qu'il pleut. | Before il, que elides to qu'. |  |
| avec | with | preposition | Je viens avec toi. | Usually followed by a noun or stressed pronoun. |  |
| sans | without | preposition | Un café sans sucre. | Opposite of avec in many contexts. |  |
| toujours | always; still | adverb | Elle arrive toujours à l'heure. | Meaning depends on context. |  |
| jamais | never; ever | adverb | Je ne fume jamais. | In standard negation: ne ... jamais. |  |
| français | French; French person | adjective/noun | J'apprends le français. | The language name takes a lowercase letter in French. |  |
| française | French; Frenchwoman | adjective/noun | La littérature française. | Feminine form of français. |  |
| comprendre | to understand | verb | Je comprends la question. | Irregular verb patterned on prendre. |  |
| vouloir | to want | verb | Je voudrais un café. | Je voudrais is a polite conditional form. |  |
| pouvoir | to be able to; can | verb | Je peux vous aider. | Irregular present: peux, peux, peut, pouvons, pouvez, peuvent. |  |
| devoir | must; to have to; owe | verb | Je dois partir. | Irregular present: dois, dois, doit, devons, devez, doivent. |  |
| temps | time; weather | noun (masculine) | Je n'ai pas le temps. | The meaning depends on context. |  |
| jour | day | noun (masculine) | Bonne journée ! | Bonne journée is a friendly daytime farewell. |  |
| fille | girl; daughter | noun (feminine) | Sa fille parle français. | Context determines girl or daughter. |  |
| garçon | boy; waiter | noun (masculine) | Le garçon lit un livre. | In a café, garçon can historically mean waiter; garçon de café is clearer. |  |
| femme | woman; wife | noun (feminine) | Cette femme parle anglais. | Context determines woman or wife. |  |
| homme | man; human being | noun (masculine) | Cet homme est gentil. | Cet is used before masculine nouns beginning with a vowel sound. |  |
| école | school | noun (feminine) | Les enfants vont à l'école. | Use à l'école. |  |
| travailleur | hard-working; worker | adjective/noun | Il est très travailleur. | Feminine travailleuse. |  |
| gentil | kind; nice | adjective | Il est gentil. | Feminine gentille. |  |
| beaucoup | a lot; much; many | adverb | Merci beaucoup. | Before a noun, use beaucoup de: beaucoup de livres. |  |
| très | very | adverb | C'est très intéressant. | Usually placed before the adjective or adverb. |  |
| intéressant | interesting | adjective | Un sujet intéressant. | Feminine intéressante. |  |
| excusez | excuse; excuse me | verb form/expression | Excusez-moi, où est la gare ? | Excusez-moi is polite/formal; excuse-moi is informal. |  |
| pardon | sorry; excuse me; pardon | interjection | Pardon, je n'ai pas compris. | Can be used to ask someone to repeat. |  |
| oui | yes | adverb | Oui, bien sûr. | Opposite: non. |  |
| non | no; not | adverb | Non, merci. | For standard negation, use ne ... pas around the verb. |  |
| fenêtre | window | noun (feminine) | J'ouvre la fenêtre. | Feminine: une fenêtre. |  |
| porte | door | noun (feminine) | La porte est ouverte. | Feminine: une porte. |  |
| voiture | car | noun (feminine) | La voiture est rouge. | Feminine: une voiture. |  |
| gare | train station | noun (feminine) | Où est la gare ? | Useful travel word. |  |
| billet | ticket | noun (masculine) | Un billet pour Paris, s'il vous plaît. | Can mean a ticket or banknote depending on context. |  |
| eau | water | noun (feminine) | Je bois de l'eau. | Use de l'eau for an unspecified quantity. |  |
| nourriture | food | noun (feminine) | La nourriture est prête. | General word for food. |  |
| petit-déjeuner | breakfast | noun (masculine) | Je prends le petit-déjeuner à huit heures. | Often used with prendre. |  |
| déjeuner | lunch; to have lunch | noun/verb | Nous déjeunons à midi. | Meaning depends on whether it is used as a noun or verb. |  |
| dîner | dinner; to have dinner | noun/verb | Nous dînons à dix-neuf heures. | Meaning depends on context. |  |
| contente | happy; pleased | adjective | Elle est contente. | Masculine content. |  |
| fatigué | tired | adjective | Je suis fatigué. | Feminine fatiguée. |  |
| malade | ill; sick | adjective/noun | Je suis malade. | Same adjective form for masculine and feminine. |  |
| médecin | doctor | noun (masculine/feminine) | Elle est médecin. | Profession noun often used without an article after être. |  |
| apprendre | to learn | verb | Nous apprenons le français. | Present: j'apprends, nous apprenons. |  |
| écrire | to write | verb | J'écris une lettre. | Irregular present-tense verb. |  |
| lire | to read | verb | Je lis un livre. | Irregular present-tense verb. |  |
| boire | to drink | verb | Je bois de l'eau. | Irregular present-tense verb. |  |
| dormir | to sleep | verb | Je dors bien. | Irregular present-tense verb. |  |
| partir | to leave | verb | Nous partons demain. | Irregular present-tense verb. |  |
| sortir | to go out; to take out | verb | Elle sort ce soir. | Meaning depends on context. |  |
| mettre | to put; to place; to wear | verb | Je mets mon manteau. | Irregular present-tense verb. |  |
| recevoir | to receive | verb | Je reçois un message. | Irregular present-tense verb. |  |
| ouvrir | to open | verb | J'ouvre la porte. | Present forms resemble many -er endings. |  |
| croire | to believe | verb | Je crois que oui. | Irregular present-tense verb. |  |
| courir | to run | verb | Je cours le matin. | Irregular present-tense verb. |  |
| venir | to come | verb | Tu viens avec nous ? | Irregular present-tense verb. |  |
| maintenant | now | adverb | Je travaille maintenant. | Often placed near the verb or at the beginning/end of a sentence. |  |
| souvent | often | adverb | Je lis souvent. | Frequency adverb. |  |
| parfois | sometimes | adverb | Parfois, je prends le train. | Frequency adverb. |  |
| combien | how much; how many | question word | Combien ça coûte ? | Use combien de before a noun in many quantity questions. |  |
| lequel | which one | interrogative pronoun | Lequel préfères-tu ? | Forms vary by gender and number: lequel, laquelle, lesquels, lesquelles. |  |
| donc | so; therefore | adverb/conjunction | Il pleut, donc je reste. | Expresses a consequence. |  |
| pourtant | however; yet | adverb | Il est fatigué, pourtant il continue. | Introduces contrast. |  |
| déjà | already | adverb | J'ai déjà mangé. | Often used with a completed action. |  |
| encore | again; still; yet | adverb | Tu es encore ici ? | Several meanings; context matters. |  |
| bientôt | soon | adverb | À bientôt ! | Common farewell: à bientôt. |  |
| ensemble | together | adverb | Nous étudions ensemble. | Often follows the verb or object. |  |

## 2. Phrasebook mappings: English to French

These are the exact `pairs` in `translate(text, "en-fr")`.

| English input key (exact source) | French output (exact source) | OK / Wrong / Fix |
|---|---|---|
| hello | bonjour | |
| good morning | bonjour | |
| good evening | bonsoir | |
| goodbye | au revoir | |
| thank you | merci | |
| thank you very much | merci beaucoup | |
| please | s'il vous plaît | |
| yes | oui | |
| no | non | |
| i am | je suis | |
| i have | j'ai | |
| i would like | je voudrais | |
| i don't understand | je ne comprends pas | |
| where is the station | où est la gare | |
| how are you | comment allez-vous | |
| my name is | je m'appelle | |
| i love you | je t'aime | |
| see you tomorrow | à demain | |
| see you soon | à bientôt | |
| i speak french | je parle français | |
| i am learning french | j'apprends le français | |
| i need help | j'ai besoin d'aide | |
| i am hungry | j'ai faim | |
| i am thirsty | j'ai soif | |
| i am tired | je suis fatigué(e) | |
| i am happy | je suis heureux/heureuse | |
| where is the bathroom | où sont les toilettes | |
| how much does it cost | combien ça coûte | |
| i don't know | je ne sais pas | |
| i understand | je comprends | |
| i am sorry | je suis désolé(e) | |
| excuse me | excusez-moi | |
| see you later | à plus tard | |
| have a nice day | bonne journée | |
| good night | bonne nuit | |
| what time is it | quelle heure est-il | |
| i need a doctor | j'ai besoin d'un médecin | |
| can you help me | pouvez-vous m'aider | |
| i would like water | je voudrais de l'eau | |
| i agree | je suis d'accord | |

## 3. Phrasebook mappings: French pattern to English output

These are the exact ordered `phraseMap` pattern/output mappings. Regex patterns are shown as source patterns; ordering matters because the engine applies them sequentially.

| French match pattern (exact source) | English output (exact source) | OK / Wrong / Fix |
|---|---|---|
| `/\bj['’]ai besoin d['’]aide\b/gi` | I need help | |
| `/\bj'ai faim\b/gi` | I am hungry | |
| `/\bj'ai soif\b/gi` | I am thirsty | |
| `/\bje suis fatigu(?:é|ée)\b/gi` | I am tired | |
| `/\bje ne sais pas\b/gi` | I don't know | |
| `/\bje suis désolé[e]?\b/gi` | I am sorry | |
| `/\bpouvez-vous m'aider\b/gi` | can you help me | |
| `/\bje suis d'accord\b/gi` | I agree | |
| `/\bje m'appelle\b/gi` | my name is | |
| `/\bcomment allez-vous\b/gi` | how are you (formal/plural) | |
| `/\bcomment ça va\b/gi` | how are things going | |
| `/\bça va\b/gi` | I'm fine / it's going | |
| `/\bje voudrais\b/gi` | I would like | |
| `/\bs['’]il vous plaît\b/gi` | please (formal/plural) | |
| `/\bs['’]il te plaît\b/gi` | please (informal) | |
| `/\bmerci beaucoup\b/gi` | thank you very much | |
| `/\bau revoir\b/gi` | goodbye | |
| `/\bà bientôt\b/gi` | see you soon | |
| `/\bà demain\b/gi` | see you tomorrow | |
| `/\bje ne comprends pas\b/gi` | I don't understand | |
| `/\bje comprends\b/gi` | I understand | |
| `/\best-ce que\b/gi` | question marker | |
| `/\bparce que\b/gi` | because | |
| `/\bil y a\b/gi` | there is / there are | |
| `/\bje suis\b/gi` | I am | |
| `/\bj['’]ai\b/gi` | I have | |
| `/\btu es\b/gi` | you are | |
| `/\bil est\b/gi` | he is / it is | |
| `/\bnous sommes\b/gi` | we are | |
| `/\bvous êtes\b/gi` | you are | |
| `/\bils sont\b/gi` | they are | |
| `/\bje vais\b/gi` | I go / I am going | |
| `/\bje veux\b/gi` | I want | |
| `/\bje peux\b/gi` | I can | |
| `/\bbonjour\b/gi` | hello | |
| `/\bbonsoir\b/gi` | good evening | |
| `/\bsalut\b/gi` | hi / bye | |
| `/\bmerci\b/gi` | thank you | |
| `/\boui\b/gi` | yes | |
| `/\bnon\b/gi` | no | |
| `/\baujourd['’]hui\b/gi` | today | |
| `/\bdemain\b/gi` | tomorrow | |
| `/\bhier\b/gi` | yesterday | |
| `/\bmaison\b/gi` | house / home | |
| `/\bécole\b/gi` | school | |
| `/\bfrançais\b/gi` | French | |
| `/\bamour\b/gi` | love | |
| `/\bami\b/gi` | friend | |
| `/\blivre\b/gi` | book | |
| `/\beau\b/gi` | water | |
| `/\bpain\b/gi` | bread | |
| `/\bparler\b/gi` | to speak | |
| `/\bmanger\b/gi` | to eat | |
| `/\bapprendre\b/gi` | to learn | |
| `/\bcomprendre\b/gi` | to understand | |
| `/\btravailler\b/gi` | to work | |
| `/\bétudiant\b/gi` | student | |
| `/\bétudiante\b/gi` | student | |
| `/\bcomment\b/gi` | how | |
| `/\bpourquoi\b/gi` | why | |
| `/\bquand\b/gi` | when | |
| `/\boù\b/gi` | where | |
| `/\bavec\b/gi` | with | |
| `/\bsans\b/gi` | without | |
| `/\bbeaucoup\b/gi` | a lot | |
| `/\btoujours\b/gi` | always | |
| `/\bjamais\b/gi` | never | |
| `/\bmais\b/gi` | but | |
| `/\bbien\b/gi` | well | |
| `/\btrès\b/gi` | very | |

## 4. Phrase examples shown by the engine

| French example (exact source) | English example (exact source) | OK / Wrong / Fix |
|---|---|---|
| Bonjour, comment allez-vous ? | Hello, how are you? | |
| Je voudrais apprendre le français. | I would like to learn French. | |
| Pouvez-vous parler plus lentement, s'il vous plaît ? | Could you speak more slowly, please? | |
| Je ne comprends pas cette phrase. | I don't understand this sentence. | |
| Qu'est-ce que ce mot signifie ? | What does this word mean? | |
| Pourriez-vous donner un exemple ? | Could you give an example? | |
| Comment dit-on « thank you » en français ? | How do you say “thank you” in French? | |
| Je suis en train d'apprendre. | I am learning right now. | |

## 5. Conjugation tables

Person order used by the engine: `je / j'`, `tu`, `il / elle / on`, `nous`, `vous`, `ils / elles`.

### 5.1 Explicit irregular present-indicative tables

| Verb | je / j' | tu | il / elle / on | nous | vous | ils / elles | OK / Wrong / Fix |
|---|---|---|---|---|---|---|---|
| être | suis | es | est | sommes | êtes | sont |  |
| avoir | ai | as | a | avons | avez | ont |  |
| aller | vais | vas | va | allons | allez | vont |  |
| faire | fais | fais | fait | faisons | faites | font |  |
| venir | viens | viens | vient | venons | venez | viennent |  |
| prendre | prends | prends | prend | prenons | prenez | prennent |  |
| pouvoir | peux | peux | peut | pouvons | pouvez | peuvent |  |
| vouloir | veux | veux | veut | voulons | voulez | veulent |  |
| devoir | dois | dois | doit | devons | devez | doivent |  |
| savoir | sais | sais | sait | savons | savez | savent |  |
| dire | dis | dis | dit | disons | dites | disent |  |
| écrire | écris | écris | écrit | écrivons | écrivez | écrivent |  |
| lire | lis | lis | lit | lisons | lisez | lisent |  |
| boire | bois | bois | boit | buvons | buvez | boivent |  |
| dormir | dors | dors | dort | dormons | dormez | dorment |  |
| partir | pars | pars | part | partons | partez | partent |  |
| sortir | sors | sors | sort | sortons | sortez | sortent |  |
| mettre | mets | mets | met | mettons | mettez | mettent |  |
| recevoir | reçois | reçois | reçoit | recevons | recevez | reçoivent |  |
| ouvrir | ouvre | ouvres | ouvre | ouvrons | ouvrez | ouvrent |  |
| croire | crois | crois | croit | croyons | croyez | croient |  |
| courir | cours | cours | court | courons | courez | courent |  |

### 5.2 Explicit spelling-adjusted tables

| Verb / pattern | je / j' | tu | il / elle / on | nous | vous | ils / elles | Type label (exact source) | OK / Wrong / Fix |
|---|---|---|---|---|---|---|---|---|
| manger | mange | manges | mange | mangeons | mangez | mangent | Regular -er pattern with spelling adjustment | |
| commencer | commence | commences | commence | commençons | commencez | commencent | Regular -er pattern with spelling adjustment | |

### 5.3 General regular patterns generated by the source

| Pattern condition / formula (source logic) | Generated six-form pattern | Type label (exact source) | OK / Wrong / Fix |
|---|---|---|---|
| `/er$/.test(v) && v.length > 3`; `stem = v.slice(0,-2)` | `stem+e`, `stem+es`, `stem+e`, `stem+ons`, `stem+ez`, `stem+ent` | Regular -er verb · present tense | |
| `/ir$/.test(v) && v.length > 3` and verb not in `partir, sortir, dormir, servir, sentir, mentir, courir, ouvrir, offrir, cueillir` | `stem+is`, `stem+is`, `stem+it`, `stem+issons`, `stem+issez`, `stem+issent` | Regular -ir verb · present tense (finir pattern) | |
| `/re$/.test(v) && v.length > 3` | `stem+s`, `stem+s`, `stem`, `stem+ons`, `stem+ez`, `stem+ent` | Regular -re verb · present-tense pattern (verify exceptions) | |

### 5.4 Subjunctive forms used by the writing checker

The checker compares listed indicative forms against these source subjunctive paradigms, in the same six-person order.

| Verb | Indicative forms (exact source order) | Subjunctive forms (exact source order) | OK / Wrong / Fix |
|---|---|---|---|
| être | suis, es, est, sommes, êtes, sont | sois, sois, soit, soyons, soyez, soient | |
| avoir | ai, as, a, avons, avez, ont | aie, aies, ait, ayons, ayez, aient | |
| aller | vais, vas, va, allons, allez, vont | aille, ailles, aille, allions, alliez, aillent | |
| faire | fais, fais, fait, faisons, faites, font | fasse, fasses, fasse, fassions, fassiez, fassent | |
| pouvoir | peux, peux, peut, pouvons, pouvez, peuvent | puisse, puisses, puisse, puissions, puissiez, puissent | |
| savoir | sais, sais, sait, savons, savez, savent | sache, saches, sache, sachions, sachiez, sachent | |
| vouloir | veux, veux, veut, voulons, voulez, veulent | veuille, veuilles, veuille, voulions, vouliez, veuillent | |

## 6. Grammar guide explanations

These titles and bodies are copied from the engine's `rules` array.

| Rule title (exact source) | Explanation (exact source) | OK / Wrong / Fix |
|---|---|---|
| Negation: ne … pas | Put ne (or n' before a vowel) before the conjugated verb and pas after it: Je comprends → Je ne comprends pas. In everyday speech, people often omit ne, but keep it in formal writing. | |
| Articles: un, une, des, le, la, les | Un is masculine singular, une feminine singular, and des plural indefinite. Le/la/les are definite articles. French nouns have grammatical gender, so learn the article with each noun: la maison, le livre. | |
| Adjective agreement | Many adjectives agree with the noun: un ami français, une amie française, des amis français, des amies françaises. The usual written feminine ending is -e, but there are many exceptions. | |
| Tu and vous | Tu is singular and informal. Vous is plural or polite/formal singular. When uncertain with a stranger or in a professional situation, vous is the safer choice. | |
| Passé composé | A common past tense for completed events: auxiliary avoir or être in the present + past participle. Example: J'ai mangé (I ate/have eaten). Many movement/reflexive verbs use être and the participle may agree with the subject. | |
| Imparfait vs passé composé | Use the imparfait for background, repeated past habits, and ongoing states (Quand j'étais petit…). Use the passé composé for events viewed as completed (Hier, j'ai appelé Marie). The contrast depends on context. | |
| Near future: aller + infinitive | Conjugate aller + an infinitive: je vais parler, tu vas parler, nous allons parler. It often means “going to do something”. | |
| C'est vs il est | C'est + noun phrase or stressed pronoun: C'est un professeur; c'est intéressant. Il/elle est + adjective or profession without an article in many cases: Elle est gentille; elle est médecin. | |
| Partitive articles | Use du, de la, de l' for an unspecified quantity: du pain, de la soupe, de l'eau. After a quantity expression, use de: beaucoup de pain. | |
| Question forms | Three common forms: Tu viens ? (informal spoken), Est-ce que tu viens ? (neutral), Viens-tu ? (inversion, more formal). Question words include qui (who), que/qu'est-ce que (what), où (where), quand (when), pourquoi (why), comment (how). | |
| Depuis vs pendant | Depuis describes a starting point or duration that continues up to now: J'habite ici depuis 2022; J'attends depuis une heure. Pendant frames the duration of an event: J'ai étudié pendant deux heures. The tense and context matter; do not translate either word mechanically. | |
| Savoir vs connaître | Use savoir for facts, information, or knowing how to do something: Je sais la réponse; Je sais nager. Use connaître for familiarity with people, places, works, or things: Je connais Marie; Je connais Paris. A following infinitive often signals savoir + skill. | |
| Avoir besoin de vs avoir envie de | Avoir besoin de means to need: J'ai besoin d'aide; J'ai besoin de dormir. Avoir envie de means to feel like or want: J'ai envie d'un café; J'ai envie de sortir. Before a vowel, de may contract to d'. | |
| Object pronouns before the verb | In a simple affirmative clause, common object pronouns usually come before the conjugated verb: Je le vois; Elle me connaît; Nous leur parlons. With a positive infinitive construction, the pronoun often goes immediately before the infinitive: Je veux le voir. Imperatives have different placement rules. | |
| Y and en | Y often replaces à + thing/place: Je vais à Paris → J'y vais; Je pense à ce problème → J'y pense. En often replaces de + thing or a quantity: Je parle de ce livre → J'en parle; Tu veux du pain ? → Oui, j'en veux deux. People and idioms may require other pronouns. | |
| Agreement with être in passé composé | With many verbs that take être in the passé composé, the past participle agrees with the subject: Elle est arrivée; Ils sont partis; Elles sont parties. Most verbs take avoir, and agreement with a preceding direct object is a separate rule. Check the verb and sentence structure. | |
| Imparfait endings | For most verbs, take the nous form of the present, remove -ons, and add -ais, -ais, -ait, -ions, -iez, -aient: nous parlons → je parlais. Être is irregular: j'étais, tu étais, il était, nous étions, vous étiez, ils étaient. Use the imparfait for background, habits and ongoing past states. | |
| Conditional politeness | The conditionnel présent often softens a request: Je voudrais un café; Pourriez-vous m'aider ? It can also express a hypothetical result: Si j'avais le temps, je voyagerais. In the common si + imparfait pattern, do not put the conditional directly after si. | |
| Negation with an infinitive | When the infinitive is negated, ne pas usually comes directly before it: Je préfère ne pas sortir; Il faut ne pas oublier. With a conjugated verb, ne surrounds the verb: Je ne sors pas. In everyday speech ne is often dropped, but formal writing usually retains it. | |

## 7. Additional on-demand grammar explanations

These are the special answer branches in `answerQuestion`; the source text is copied as displayed, with HTML tags retained as source markup.

| Answer branch | Exact source answer text / HTML | OK / Wrong / Fix |
|---|---|---|
| Depuis vs pendant | `<b>Depuis vs pendant</b><p><i>Depuis</i> usually links a past starting point to a situation continuing now: <i>J'habite ici depuis trois ans</i> (I've lived here for three years). <i>Pendant</i> frames a duration: <i>J'ai étudié pendant deux heures</i> (I studied for two hours). Context and tense determine the best translation.</p>` | |
| Savoir vs connaître | `<b>Savoir vs connaître</b><p>Use <i>savoir</i> for facts or skills: <i>Je sais la réponse</i>; <i>Je sais nager</i>. Use <i>connaître</i> for familiarity: <i>Je connais cette ville</i>; <i>Je connais Marie</i>.</p>` | |
| Y vs en | `<b>Y vs en</b><p><i>Y</i> often replaces <i>à</i> + thing/place: <i>Je vais à Paris → J'y vais</i>. <i>En</i> often replaces <i>de</i> + thing or a quantity: <i>Je parle de ce livre → J'en parle</i>; <i>J'en veux deux</i>. Pronoun choice depends on the verb's construction and meaning.</p>` | |
| Conditional for polite requests and hypotheses | `<b>Conditional for polite requests and hypotheses</b><p><i>Je voudrais un café</i> is a polite request; <i>Pourriez-vous m'aider ?</i> means “Could you help me?” In a common hypothesis: <i>Si j'avais le temps, je voyagerais</i>. Do not put the conditional directly after <i>si</i> in this pattern.</p>` | |
| Why is maison feminine? | `<b>Why is “maison” feminine?</b><p>In French, grammatical gender is a property of each noun and is not always predictable from meaning. Learn it together with its article: <i>la maison</i>. The ending -on does not reliably tell you a noun's gender.</p>` | |
| Talking about age | `<b>Talking about age</b><p>French uses <i>avoir</i> (to have), not <i>être</i> (to be): <i>J'ai vingt ans</i> literally means “I have twenty years.”</p>` | |
| General grammar fallback | `Choose the Grammar Guide to browse ten core rules, or ask about a specific structure (for example, “Explain passé composé”).` | |

## 8. Writing rules and explanations

### 8.1 Pattern-based writing checks

| Rule family | Regex (exact source) | Suggested replacement (exact source behavior) | Explanation (exact source) | OK / Wrong / Fix |
|---|---|---|---|---|
| Age: Je suis (number) ans | `/\bje suis (\d+) ans\b/gi` | `j'ai $1 ans` | French uses avoir for age. | |
| Hunger | `/\bje suis faim\b/gi` | `j'ai faim` | French says avoir faim (to be hungry). | |
| Thirst | `/\bje suis soif\b/gi` | `j'ai soif` | French says avoir soif (to be thirsty). | |
| Age: exact 20-year pattern | `/\bje suis 20 ans\b/gi` | `j'ai 20 ans` | French uses avoir for age. | |
| sa / ça | `/\bsa va\b/gi` | `ça va` | The expression is ça va, with ç. | |
| beaucoup spelling | `/\bbeacoup\b/gi` | `beaucoup` | Spelling: beaucoup. | |
| bonjour spelling | `/\bbonjor\b/gi` | `bonjour` | Spelling: bonjour. | |
| merci spelling | `/\bmerçi\b/gi` | `merci` | Merci is written without a cedilla. | |
| Repeated pas | `/\bje ne comprends pas pas\b/gi` | `je ne comprends pas` | Avoid repeating pas in this standard negation. | |

### 8.2 Subjunctive trigger rule

| Trigger family (source pattern) | Explanation (exact source callback text) | OK / Wrong / Fix |
|---|---|---|
| bien que / bien qu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |
| quoique / quoiqu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |
| pour que / pour qu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |
| afin que / afin qu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |
| avant que / avant qu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |
| à moins que / à moins qu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |
| jusqu'à ce que / jusqu'à ce qu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |
| sans que / sans qu' | After this conjunction, use the subjunctive mood rather than the indicative in this clause. | |

### 8.3 Exact no-flag response

| Condition | Exact source response | OK / Wrong / Fix |
|---|---|---|
| No listed pattern matched | `No issue from the small built-in check list was detected. That does not prove the sentence is fully correct; this is not a full grammar checker.` | |

## 9. Teacher sign-off

Teacher name: ____________________

Review date: ____________________

Overall recommendation: ____________________

Outstanding corrections / comments:

________________________________________________________________

________________________________________________________________

## Extraction completeness

- Dictionary entries extracted: 139.
- English-to-French phrasebook mappings extracted: 40.
- French-pattern-to-English phrasebook mappings extracted: 70.
- Displayed French/English phrase examples extracted: 8.
- Explicit irregular present-indicative conjugation tables extracted: 22.
- Explicit spelling-adjusted present-indicative tables extracted: 2.
- Subjunctive paradigms used by the writing checker extracted: 7.
- Grammar guide rules extracted: 19.
- Pattern-based writing checks documented: 9; subjunctive trigger families documented: 8.

All review cells are intentionally blank. The extraction verified the exact WR-02 and WR-05 expectations in the linguistic matrix before preparing this document.
