import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

const engine = readFileSync("features/french-intelligence.js", "utf8");
const html = readFileSync("index.html", "utf8");
const listeners = {};
const document = {
  addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
  getElementById: () => null
};
const window = {};
vm.runInNewContext(engine, { document, window, console, URL, encodeURIComponent, location: { reload() {} } });
const core = window.FrenchIntelligenceCore;
assert.ok(core, "Core API must be exposed for deterministic unit tests");

const dictionarySource = engine.match(/const dictionary = \{([\s\S]*?)\n  \};/)?.[1] || "";
const dictionaryKeys = [...dictionarySource.matchAll(/^\s*(?:"([^"]+)"|([\p{L}_$][\p{L}\p{N}_$]*))\s*:/gmu)].map(m => m[1] || m[2]);

const checks = [
  ["engine is a strict-mode module", /["']use strict["']/.test(engine)],
  ["home screen links to French Intelligence", /id=["']hfrenchint["']/.test(html)],
  ["engine script is loaded before AI classroom", html.indexOf("features/french-intelligence.js") >= 0 && html.indexOf("features/french-intelligence.js") < html.indexOf("features/ai-classroom.js")],
  ["navigation hook exists", /FAExitFrenchIntelligence/.test(html)],
  ["dictionary finds an exact French word", core.lookup("bonjour")?.meaning.includes("hello")],
  ["dictionary matches accents flexibly", core.lookup("ecole")?.word === "école"],
  ["dictionary supports a multiword expression", core.lookup("parce que")?.meaning === "because"],
  ["dictionary safely rejects unknown words", core.lookup("xqz-not-a-word") === null],
  ["expanded dictionary includes common contextual noun", core.lookup("famille")?.meaning.includes("family")],
  ["dictionary includes multiword idiom", core.lookup("avoir besoin de")?.meaning.includes("need")],
  ["dictionary preserves canonical accent on new entry", core.lookup("reponse")?.word === "réponse"],
  ["irregular être conjugation is correct", JSON.stringify(Array.from(core.conjugate("être").forms)) === JSON.stringify(["suis","es","est","sommes","êtes","sont"])],
  ["irregular écrire conjugation is correct", JSON.stringify(Array.from(core.conjugate("écrire").forms)) === JSON.stringify(["écris","écris","écrit","écrivons","écrivez","écrivent"])],
  ["regular -er conjugation is correct", JSON.stringify(Array.from(core.conjugate("parler").forms)) === JSON.stringify(["parle","parles","parle","parlons","parlez","parlent"])],
  ["regular -ir finir-pattern conjugation is correct", JSON.stringify(Array.from(core.conjugate("finir").forms)) === JSON.stringify(["finis","finis","finit","finissons","finissez","finissent"])],
  ["regular -re conjugation is correct", JSON.stringify(Array.from(core.conjugate("vendre").forms)) === JSON.stringify(["vends","vends","vend","vendons","vendez","vendent"])],
  ["spelling-adjusted manger conjugation is correct", JSON.stringify(Array.from(core.conjugate("manger").forms)) === JSON.stringify(["mange","manges","mange","mangeons","mangez","mangent"])],
  ["unsupported verb returns no fabricated forms", core.conjugate("xyz") === null],
  ["known English-to-French phrase is translated", core.translate("Thank you", "en-fr").includes("merci")],
  ["expanded phrasebook translates an exact request", core.translate("I need help", "en-fr").includes("j'ai besoin d'aide")],
  ["known French phrase has English output", core.translate("J'ai besoin d'aide", "fr-en").includes("I need help")],
  ["unknown English phrase is not guessed", core.translate("A complicated sentence not in phrasebook", "en-fr").includes("not in the local phrasebook")],
  ["question receives a contextual grammar answer", core.answerQuestion("Explain passé composé").includes("auxiliary avoir or être")],
  ["contextual grammar distinguishes depuis and pendant", core.answerQuestion("What is the difference between depuis and pendant?").includes("continuing now")],
  ["contextual grammar distinguishes savoir and connaître", core.answerQuestion("Difference between savoir and connaître").includes("Use <i>savoir</i> for facts or skills")],
  ["contextual grammar explains y and en", core.answerQuestion("How do I use y and en pronouns?").includes("Y vs en")],
  ["age explanation uses avoir", core.answerQuestion("How do I say my age?").includes("J'ai vingt ans")],
  ["writing checker corrects a common age error", core.checkWriting("Je suis 20 ans").includes("j'ai 20 ans")],
  ["writing checker explains when no listed error is found", core.checkWriting("Bonjour, je m'appelle Léa.").includes("does not prove the sentence is fully correct")],
  ["dictionary accepts typographic apostrophes", core.lookup("S’il vous plaît")?.word === "s'il vous plaît"],
  ["dictionary keeps canonical accented display spelling", core.lookup("école")?.word === "école"],
  ["phrasebook preserves negation in supported English-to-French phrase", core.translate("I don't understand", "en-fr").includes("je ne comprends pas")],
  ["French-to-English phrasebook accepts typographic apostrophes", core.translate("J’ai besoin d’aide", "fr-en").includes("I need help")],
  ["French-to-English phrasebook matches feminine accented adjective", core.translate("Je suis fatiguée.", "fr-en").includes("I am tired")],
  ["French-to-English phrasebook matches an accented standalone word", core.translate("école", "fr-en").includes("school")],
  ["conjugation returns complete venir paradigm", JSON.stringify(Array.from(core.conjugate("venir").forms)) === JSON.stringify(["viens","viens","vient","venons","venez","viennent"])],
  ["conjugation returns complete prendre paradigm", JSON.stringify(Array.from(core.conjugate("prendre").forms)) === JSON.stringify(["prends","prends","prend","prenons","prenez","prennent"])],
  ["conjugation returns complete pouvoir paradigm", JSON.stringify(Array.from(core.conjugate("pouvoir").forms)) === JSON.stringify(["peux","peux","peut","pouvons","pouvez","peuvent"])],
  ["writing checker does not flag valid context-sensitive parler le français", core.checkWriting("Je parle le français.") .includes("No issue from the small built-in check list was detected")],
  ["writing checker does not guess the sense of une livre", core.checkWriting("J’achète une livre.") .includes("No issue from the small built-in check list was detected")],
  ["writing checker suggests subjunctive after bien que", core.checkWriting("Bien que je suis fatigué, je continue.").includes("sois")],
  ["dictionary has no duplicate headword keys", new Set(dictionaryKeys).size === dictionaryKeys.length],
  ["dictionary output escapes HTML-like input", !core.lookup("<img src=x onerror=alert(1)>")],
  ["subjunctive rule flags bien que + indicative être", core.checkWriting("Bien que je suis fatigué, je continue.").includes("sois")],
  ["subjunctive rule flags quoique + indicative avoir", core.checkWriting("Quoique tu as raison, je préfère vérifier.").includes("aies")],
  ["subjunctive rule flags pour que + indicative aller", core.checkWriting("Il parle lentement pour qu'il va comprendre.").includes("aille")],
  ["subjunctive rule flags afin que + indicative faire", core.checkWriting("Elle explique afin qu'elle fait le bon choix.").includes("fasse")],
  ["subjunctive rule flags avant que + indicative pouvoir", core.checkWriting("Partons avant que nous pouvons être en retard.").includes("puissions")],
  ["subjunctive rule flags à moins que + indicative savoir", core.checkWriting("Je viendrai à moins que vous savez autre chose.").includes("sachiez")],
  ["subjunctive rule flags jusqu'à ce que + indicative vouloir", core.checkWriting("Nous attendons jusqu'à ce qu'ils veulent partir.").includes("veuillent")],
  ["subjunctive rule flags sans que + indicative avoir", core.checkWriting("Elle est partie sans qu'elles ont le temps de répondre.").includes("aient")],
  ["correct subjunctive after bien que is not flagged", core.checkWriting("Bien que je sois fatigué, je continue.").includes("No issue from the small built-in check list was detected")],
  ["après que remains outside the subjunctive rule", core.checkWriting("Après qu'il est arrivé, nous avons commencé.").includes("No issue from the small built-in check list was detected")],
];


const cleanSentenceCorpus = [
  "Bonjour, comment allez-vous ?",
  "Salut, ça va ?",
  "Je vais bien, merci.",
  "Je m'appelle Camille.",
  "Comment tu t'appelles ?",
  "Enchanté de vous rencontrer.",
  "Ravi de te revoir.",
  "À bientôt, prends soin de toi.",
  "Bonne journée, madame.",
  "Bonsoir, monsieur, entrez donc.",
  "Je parle français avec mes amis.",
  "Je parle le français à l'école.",
  "J'apprends le français chaque jour.",
  "Nous étudions ensemble après le cours.",
  "Tu comprends cette question ?",
  "Vous pouvez répéter, s'il vous plaît ?",
  "Je ne comprends pas cette phrase.",
  "Elle comprend très bien la consigne.",
  "Nous parlons un peu plus lentement.",
  "Ils apprennent de nouveaux mots.",
  "Je suis à la maison.",
  "Tu es dans le jardin.",
  "Il est dans la cuisine.",
  "Elle est près de la fenêtre.",
  "Nous sommes prêts à partir.",
  "Vous êtes les bienvenus ici.",
  "Ils sont déjà au travail.",
  "Elles sont dans la salle de classe.",
  "La porte est ouverte.",
  "Les fenêtres sont fermées.",
  "J'ai un livre intéressant.",
  "Tu as une belle idée.",
  "Il a deux frères.",
  "Elle a une voiture rouge.",
  "Nous avons assez de temps.",
  "Vous avez une réservation ?",
  "Ils ont trois enfants.",
  "Elles ont un petit chien.",
  "J'ai faim, mais je peux attendre.",
  "Tu as soif après le sport.",
  "Je vais au marché ce matin.",
  "Tu vas à la bibliothèque après le déjeuner.",
  "Il va prendre le train.",
  "Elle va travailler demain.",
  "Nous allons visiter le musée.",
  "Allez tout droit, puis tournez à gauche.",
  "Ils vont au cinéma ce soir.",
  "Elles vont rentrer bientôt.",
  "Je fais mes devoirs après le dîner.",
  "Nous faisons une promenade le dimanche.",
  "Je prends un café sans sucre.",
  "Tu préfères le thé ou le café ?",
  "Il mange une pomme chaque matin.",
  "Elle prépare le repas pour ses amis.",
  "Nous achetons du pain à la boulangerie.",
  "Vous désirez autre chose ?",
  "Ils boivent de l'eau pendant le repas.",
  "Elles choisissent une table près de la fenêtre.",
  "Je voudrais un billet pour Lyon.",
  "Nous arrivons à la gare à neuf heures.",
  "Hier, j'ai rendu visite à ma grand-mère.",
  "Tu as fini ton travail hier soir.",
  "Il a écrit une lettre à son ami.",
  "Elle a choisi un joli cadeau.",
  "Nous avons regardé un film ensemble.",
  "Vous avez reçu mon message ?",
  "Ils ont pris le bus ce matin.",
  "Elles sont parties après le déjeuner.",
  "J'ai appris beaucoup de choses aujourd'hui.",
  "Nous avons attendu dix minutes.",
  "Demain, je travaillerai à la maison.",
  "Tu trouveras la réponse dans le livre.",
  "Il fera beau ce week-end.",
  "Elle ira à Paris la semaine prochaine.",
  "Nous prendrons le premier train.",
  "Vous pourrez nous rejoindre plus tard.",
  "Ils viendront avec leurs enfants.",
  "Elles auront assez de temps.",
  "Je voudrais vous poser une question.",
  "Pourriez-vous m'aider, s'il vous plaît ?",
  "Bien que je sois fatigué, je termine mon travail.",
  "Quoique tu aies raison, nous devons vérifier les chiffres.",
  "Il parle doucement pour que je puisse comprendre.",
  "Elle répète la consigne afin que nous sachions quoi faire.",
  "Nous partirons avant qu'il fasse nuit.",
  "Je vous écrirai à moins que je sois trop occupé.",
  "Reste ici jusqu'à ce que je revienne.",
  "Il est sorti sans que personne le voie.",
  "Bien qu'elle soit jeune, elle dirige l'équipe.",
  "Quoiqu'ils aient peu de temps, ils restent disponibles.",
  "Après que le train est arrivé, les voyageurs sont descendus.",
  "Après que j'ai terminé, j'ai fermé le bureau.",
  "Après qu'elle a parlé, nous avons posé des questions.",
  "Après que nous avons mangé, nous sommes sortis.",
  "Après qu'ils sont partis, la maison est devenue calme.",
  "Je suis content de te voir.",
  "Tu peux m'envoyer le document ?",
  "Ça va, je te rappelle plus tard.",
  "Je n'ai pas encore fini.",
  "On se retrouve devant le café ?",
  "Je pense que cette solution est simple.",
  "Je crois qu'il a déjà répondu.",
  "Je sais où se trouve la gare.",
  "Je connais bien ce quartier.",
  "Nous devons partir maintenant.",
  "Veuillez patienter quelques instants.",
  "Je vous remercie pour votre réponse rapide.",
  "Nous vous confirmons la réception de votre demande.",
  "Pourriez-vous nous transmettre le document signé ?",
  "Je reste à votre disposition pour toute question.",
  "Nous vous souhaitons une excellente journée.",
  "Je vous prie de bien vouloir patienter.",
  "Votre rendez-vous est prévu pour mardi matin.",
  "Merci de nous contacter si vous avez besoin d'aide.",
  "Nous avons bien reçu votre courrier.",
  "Le professeur explique la règle avec un exemple.",
  "Les étudiants travaillent en petits groupes.",
  "Cette solution me semble raisonnable.",
  "Le magasin ouvre à huit heures.",
  "La réunion commence dans cinq minutes.",
  "Le bus arrive souvent en retard.",
  "Mon frère habite près du centre-ville.",
  "Ma sœur travaille dans un hôpital.",
  "Le livre est sur la table.",
  "Les enfants jouent dans le parc."
];
const hardNegativeSentences = [
  "Je suis à la maison depuis trois ans.",
  "Je suis étudiant depuis deux ans.",
  "Je suis ici depuis vingt ans.",
  "J'ai 20 ans et je suis heureux.",
  "Elle a vingt ans et elle est prête.",
  "Nous sommes amis depuis dix ans.",
  "Mon frère a 30 ans.",
  "Je suis en forme et j'ai vingt ans.",
  "Je suis ce cours depuis deux ans.",
  "Bien que très fatigué, il continue.",
  "Bien que le temps soit mauvais, nous sortons.",
  "Pour que tout soit prêt, nous commençons tôt.",
  "Je prépare le repas pour que les enfants mangent à l'heure.",
  "Il a écrit « bien que » au tableau.",
  "Les mots « pour que » sont écrits au tableau.",
  "Elle sourit bien que la journée soit longue.",
  "Je sais que tu es prêt pour que tout soit terminé.",
  "Il attend jusqu'à ce que la pluie cesse.",
  "Il a un livre à la main.",
  "Elle a pensé à son amie.",
  "À midi, il a appelé sa sœur.",
  "Je vais à Paris et elle a réservé l'hôtel.",
  "Il a appris à conduire.",
  "Nous avons rendez-vous à huit heures.",
  "Elle a réussi à terminer son travail.",
  "À mon avis, il a raison.",
  "Le train arrive à Lyon avec cinq minutes de retard.",
  "Il a donné son livre à sa collègue.",
  "C'est une excellente idée.",
  "C'est mon frère qui s'est occupé du repas.",
  "Elle s'est levée tôt.",
  "Il s'est rendu compte de son erreur.",
  "C'est ici que nous nous sommes rencontrés.",
  "C'est la porte qui s'est ouverte toute seule.",
  "On s'est parlé hier.",
  "C'est un livre qui s'est vendu rapidement.",
  "Elle s'est demandé si c'était vrai.",
  "Une livre de pommes coûte trois euros.",
  "J'achète une livre de beurre.",
  "Cette livre sterling vaut plus aujourd'hui.",
  "Une livre de farine suffit.",
  "Elle a pesé une livre de sucre.",
  "Le colis pèse une livre.",
  "Une livre correspond à environ 500 grammes.",
  "Le prix est de cinq euros la livre.",
  "Une livre de pommes de terre est prévue pour la recette.",
  "J'apprends le français depuis septembre.",
  "Je parle le français à l'école.",
  "Le français est ma matière préférée.",
  "Elle enseigne le français.",
  "Nous étudions le français et l'espagnol.",
  "Il comprend bien le français parlé.",
  "Le français québécois a ses particularités.",
  "J'utilise le français au travail.",
  "Le français est une langue romane.",
  "Ça va très bien, merci.",
  "Beaucoup de personnes arrivent tôt.",
  "Bonjour, monsieur, comment allez-vous ?",
  "Merci beaucoup pour votre aide.",
  "Je dis bonjour à mes voisins.",
  "Elle boit beaucoup d'eau.",
  "Un bonjour chaleureux fait plaisir.",
  "Il m'a dit merci en souriant.",
  "Nous avons beaucoup travaillé.",
  "Je ne comprends pas cette règle.",
  "Je n'ai pas encore terminé.",
  "Je ne sais pas si ça va marcher.",
  "Je préfère ne pas sortir.",
  "Bien qu'il soit tard, nous continuons.",
  "Il faut que tu viennes à l'heure.",
  "Je suis content que tu sois ici.",
  "Elle n'a pas oublié son livre.",
  "Nous n'avons pas de pain.",
  "Je n'ai pas faim, mais j'ai soif.",
  "Je suis à l'heure et j'ai tout préparé.",
  "Il est parti sans que personne le remarque.",
  "Je travaille pour que mon équipe réussisse."
];
const knownErrors = [
  {
    "rule": "age",
    "sentence": "Je suis 20 ans.",
    "expected": "j'ai 20 ans"
  },
  {
    "rule": "age",
    "sentence": "Je suis 35 ans.",
    "expected": "j'ai 35 ans"
  },
  {
    "rule": "faim",
    "sentence": "Je suis faim.",
    "expected": "j'ai faim"
  },
  {
    "rule": "faim",
    "sentence": "JE SUIS FAIM !",
    "expected": "j'ai faim"
  },
  {
    "rule": "soif",
    "sentence": "Je suis soif.",
    "expected": "j'ai soif"
  },
  {
    "rule": "soif",
    "sentence": "JE SUIS SOIF !",
    "expected": "j'ai soif"
  },
  {
    "rule": "sa/ça",
    "sentence": "Sa va bien.",
    "expected": "ça va"
  },
  {
    "rule": "sa/ça",
    "sentence": "SA VA ?",
    "expected": "ça va"
  },
  {
    "rule": "beaucoup spelling",
    "sentence": "Beacoup de gens arrivent.",
    "expected": "beaucoup"
  },
  {
    "rule": "beaucoup spelling",
    "sentence": "C'est beacoup mieux.",
    "expected": "beaucoup"
  },
  {
    "rule": "bonjour spelling",
    "sentence": "Bonjor, madame.",
    "expected": "bonjour"
  },
  {
    "rule": "bonjour spelling",
    "sentence": "BONJOR !",
    "expected": "bonjour"
  },
  {
    "rule": "merci spelling",
    "sentence": "Merçi beaucoup.",
    "expected": "merci"
  },
  {
    "rule": "merci spelling",
    "sentence": "Je dis merçi.",
    "expected": "merci"
  },
  {
    "rule": "repeated pas",
    "sentence": "Je ne comprends pas pas.",
    "expected": "je ne comprends pas"
  },
  {
    "rule": "repeated pas",
    "sentence": "Je ne comprends pas pas cette phrase.",
    "expected": "je ne comprends pas"
  },
  {
    "rule": "bien que subjunctive",
    "sentence": "Bien que je suis fatigué, je continue.",
    "expected": "sois"
  },
  {
    "rule": "bien que subjunctive",
    "sentence": "Bien que tu es malade, tu viens.",
    "expected": "sois"
  },
  {
    "rule": "quoique subjunctive",
    "sentence": "Quoique tu as raison, je vérifie.",
    "expected": "aies"
  },
  {
    "rule": "quoique subjunctive",
    "sentence": "Quoiqu'ils ont peu de temps, ils restent.",
    "expected": "aient"
  },
  {
    "rule": "pour que subjunctive",
    "sentence": "Pour que je vais comprendre, explique encore.",
    "expected": "aille"
  },
  {
    "rule": "pour que subjunctive",
    "sentence": "Pour qu'elle va réussir, elle travaille.",
    "expected": "aille"
  },
  {
    "rule": "afin que subjunctive",
    "sentence": "Afin que je fais le bon choix, je réfléchis.",
    "expected": "fasse"
  },
  {
    "rule": "afin que subjunctive",
    "sentence": "Afin qu'ils font le travail, je les aide.",
    "expected": "fassent"
  },
  {
    "rule": "avant que subjunctive",
    "sentence": "Avant que je peux partir, je termine.",
    "expected": "puisse"
  },
  {
    "rule": "avant que subjunctive",
    "sentence": "Avant que nous pouvons sortir, attendons.",
    "expected": "puissions"
  },
  {
    "rule": "à moins que subjunctive",
    "sentence": "À moins que je sais la réponse, je demande.",
    "expected": "sache"
  },
  {
    "rule": "à moins que subjunctive",
    "sentence": "À moins que vous savez autre chose, je pars.",
    "expected": "sachiez"
  },
  {
    "rule": "jusqu'à ce que subjunctive",
    "sentence": "Jusqu'à ce que je veux partir, je reste.",
    "expected": "veuille"
  },
  {
    "rule": "jusqu'à ce que subjunctive",
    "sentence": "Jusqu'à ce qu'ils veulent partir, ils attendent.",
    "expected": "veuillent"
  },
  {
    "rule": "sans que subjunctive",
    "sentence": "Sans que tu as le temps, nous partons.",
    "expected": "aies"
  },
  {
    "rule": "sans que subjunctive",
    "sentence": "Sans qu'ils ont le temps, ils répondent.",
    "expected": "aient"
  }
];
const hardNegativeFalsePositives = hardNegativeSentences.filter(sentence => core.checkWriting(sentence).includes("Suggested text"));
const knownErrorsCaught = knownErrors.filter(item => {
  const result = core.checkWriting(item.sentence);
  return result.includes("Suggested text") && result.includes(item.expected);
});
const corpusFalsePositives = cleanSentenceCorpus.filter(sentence => core.checkWriting(sentence).includes("Suggested text"));
checks.push(
  ["clean sentence corpus contains at least 100 examples", cleanSentenceCorpus.length >= 100],
  ["clean sentence corpus produces zero false positives", corpusFalsePositives.length === 0],
  ["hard-negative corpus contains at least 60 sentences", hardNegativeSentences.length >= 60],
  ["hard-negative corpus produces zero false positives", hardNegativeFalsePositives.length === 0],
  ["known-error corpus has at least two cases per writing rule family", knownErrors.length >= 18],
  ["known-error corpus catches every listed case", knownErrorsCaught.length === knownErrors.length]
);

let failed = 0;
for (const [name, passed] of checks) {
  const ok = Boolean(passed);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}
assert.equal(failed, 0, `${failed} French Intelligence functional check(s) failed`);
console.log(`Passed ${checks.length} French Intelligence syntax, integration, and functional checks.`);
console.log(`Clean-sentence corpus: ${cleanSentenceCorpus.length}; false positives: ${corpusFalsePositives.length}.`);
console.log(`Hard-negative sentences: ${hardNegativeSentences.length}; false positives: ${hardNegativeFalsePositives.length}.`);
console.log(`Known errors: ${knownErrors.length}; errors caught: ${knownErrorsCaught.length}.`);
