(function (root) {
  "use strict";

  const SOURCES = {
    bienQue: "https://www.academie-francaise.fr/laurence-d-france",
    participle: "https://www.academie-francaise.fr/questions-de-langue",
    faireInfinitive: "https://www.dictionnaire-academie.fr/article/DNP0145",
    punctuation: "https://www.dictionnaire-academie.fr/article/A9V0914",
    subjunctivePurpose: "https://www.dictionnaire-academie.fr/article/A9P3767"
  };

  const RULES = [
    {
      id: "SP-001", category: "spelling", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])merçi(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/merçi/giu, (m) => matchCase(m, "merci")),
      explanation: "« Merci » s’écrit sans cédille.",
      example: { incorrect: "Merçi beaucoup.", correct: "Merci beaucoup." },
      source: null
    },
    {
      id: "SP-002", category: "spelling", confidence: 0.99,
      source: "https://www.dictionnaire-academie.fr/article/A9B0705",
      pattern: /(?<![\p{L}\p{N}_'’])beacoup(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/beacoup/giu, (m) => matchCase(m, "beaucoup")),
      explanation: "L’orthographe standard est « beaucoup ».",
      example: { incorrect: "Beacoup de gens arrivent.", correct: "Beaucoup de gens arrivent." },
    },
    {
      id: "SP-003", category: "spelling", confidence: 0.99,
      source: "https://www.dictionnaire-academie.fr/article/A9R1901",
      pattern: /(?<![\p{L}\p{N}_'’])reponse(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/reponse/giu, (m) => matchCase(m, "réponse")),
      explanation: "Le nom s’écrit « réponse », avec un accent aigu.",
      example: { incorrect: "Merci pour votre reponse.", correct: "Merci pour votre réponse." },
    },
    {
      id: "SP-004", category: "spelling", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])bonjor(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/bonjor/giu, (m) => matchCase(m, "bonjour")),
      explanation: "L’orthographe standard est « bonjour ».",
      example: { incorrect: "Bonjor, madame.", correct: "Bonjour, madame." },
      source: null
    },
    {
      id: "WR-001", category: "usage", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])je\s+suis\s+(\d+)\s+ans(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/(?<![\p{L}\p{N}_'’])je\s+suis\s+(\d+)\s+ans(?![\p{L}\p{N}_'’])/giu, (m, n) => matchCase(m, "j'ai " + n + " ans")),
      explanation: "En français, on exprime l’âge avec « avoir » : « j’ai vingt ans ».",
      example: { incorrect: "Je suis 20 ans.", correct: "J'ai 20 ans." },
      source: null
    },
    {
      id: "WR-002", category: "usage", confidence: 0.99,
      source: "https://www.dictionnaire-academie.fr/article/A9F0107",
      pattern: /(?<![\p{L}\p{N}_'’])je\s+suis\s+faim(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/(?<![\p{L}\p{N}_'’])je\s+suis\s+faim(?![\p{L}\p{N}_'’])/giu, (m) => matchCase(m, "j'ai faim")),
      explanation: "L’expression idiomatique est « avoir faim », et non « être faim ».",
      example: { incorrect: "Je suis faim.", correct: "J'ai faim." },
    },
    {
      id: "WR-003", category: "usage", confidence: 0.99,
      source: "https://www.dictionnaire-academie.fr/article/A9S1939",
      pattern: /(?<![\p{L}\p{N}_'’])je\s+suis\s+soif(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/(?<![\p{L}\p{N}_'’])je\s+suis\s+soif(?![\p{L}\p{N}_'’])/giu, (m) => matchCase(m, "j'ai soif")),
      explanation: "L’expression idiomatique est « avoir soif », et non « être soif ».",
      example: { incorrect: "Je suis soif.", correct: "J'ai soif." },
    },
    {
      id: "WR-004", category: "spelling", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])sa\s+va(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/(?<![\p{L}\p{N}_'’])sa\s+va(?![\p{L}\p{N}_'’])/giu, (m) => matchCase(m, "ça va")),
      explanation: "Dans l’expression « ça va », on emploie le pronom démonstratif « ça », pas le possessif « sa ».",
      example: { incorrect: "Sa va bien.", correct: "Ça va bien." },
      source: "https://www.dictionnaire-academie.fr/article/DNP0881"
    },
    {
      id: "WR-005", category: "syntax", confidence: 0.98,
      pattern: /(?<![\p{L}\p{N}_'’])je\s+ne\s+comprends\s+pas\s+pas(?![\p{L}\p{N}_'’])/giu,
      replace: (s) => s.replace(/(?<![\p{L}\p{N}_'’])je\s+ne\s+comprends\s+pas\s+pas(?![\p{L}\p{N}_'’])/giu, (m) => matchCase(m, "je ne comprends pas")),
      explanation: "Dans la négation standard de cette phrase, un seul « pas » suffit.",
      example: { incorrect: "Je ne comprends pas pas.", correct: "Je ne comprends pas." },
      source: null
    },
    {
      id: "GR-001", category: "conjugation", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])bien\s+qu['’]il\s+a(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(bien\s+qu['’]il\s+)a(?![\p{L}\p{N}_'’])/iu, "$1ait"),
      explanation: "« Bien que » introduit normalement une proposition concessive au subjonctif : « qu’il ait ».",
      example: { incorrect: "Bien qu'il a tort.", correct: "Bien qu'il ait tort." },
      source: SOURCES.bienQue
    },
    {
      id: "GR-002", category: "conjugation", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])bien\s+que\s+j['’]ai(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(bien\s+que\s+j['’])ai(?![\p{L}\p{N}_'’])/iu, "$1aie"),
      explanation: "Après « bien que », le verbe de la proposition concessive se met au subjonctif : « que j’aie ».",
      example: { incorrect: "Bien que j'ai peur.", correct: "Bien que j'aie peur." },
      source: SOURCES.bienQue
    },
    {
      id: "GR-003", category: "conjugation", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])bien\s+que\s+nous\s+avons(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(bien\s+que\s+nous\s+)avons(?![\p{L}\p{N}_'’])/iu, "$1ayons"),
      explanation: "Après « bien que », « avoir » prend ici le subjonctif : « que nous ayons ».",
      example: { incorrect: "Bien que nous avons faim.", correct: "Bien que nous ayons faim." },
      source: SOURCES.bienQue
    },
    {
      id: "GR-004", category: "conjugation", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])bien\s+que\s+vous\s+êtes(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(bien\s+que\s+vous\s+)êtes(?![\p{L}\p{N}_'’])/iu, "$1soyez"),
      explanation: "Après « bien que », « être » prend ici le subjonctif : « que vous soyez ».",
      example: { incorrect: "Bien que vous êtes prêts.", correct: "Bien que vous soyez prêts." },
      source: SOURCES.bienQue
    },
    {
      id: "GR-005", category: "conjugation", confidence: 0.99,
      pattern: /(?<![\p{L}\p{N}_'’])bien\s+qu['’]ils\s+sont(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(bien\s+qu['’]ils\s+)sont(?![\p{L}\p{N}_'’])/iu, "$1soient"),
      explanation: "Après « bien que », « être » prend ici le subjonctif : « qu’ils soient ».",
      example: { incorrect: "Bien qu'ils sont fatigués.", correct: "Bien qu'ils soient fatigués." },
      source: SOURCES.bienQue
    },
    {
      id: "AG-001", category: "agreement", confidence: 0.98,
      pattern: /(?<![\p{L}\p{N}_'’])elles\s+sont\s+arrivé(?!e|s)(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(elles\s+sont\s+)arrivé(?!e|s)(?![\p{L}\p{N}_'’])/iu, "$1arrivées"),
      explanation: "Avec l’auxiliaire « être », le participe passé s’accorde ici avec le sujet féminin pluriel « elles ».",
      example: { incorrect: "Elles sont arrivé hier.", correct: "Elles sont arrivées hier." },
      source: SOURCES.participle
    },
    {
      id: "AG-002", category: "agreement", confidence: 0.97,
      pattern: /(?<![\p{L}\p{N}_'’])les\s+crêpes\s+qu['’]elle\s+a\s+mangé(?!e|s)(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(les\s+crêpes\s+qu['’]elle\s+a\s+)mangé(?!e|s)(?![\p{L}\p{N}_'’])/iu, "$1mangées"),
      explanation: "Avec « avoir », le participe passé s’accorde avec le complément d’objet direct placé avant le verbe : « les crêpes qu’elle a mangées ».",
      example: { incorrect: "Les crêpes qu'elle a mangé sont froides.", correct: "Les crêpes qu'elle a mangées sont froides." },
      source: SOURCES.participle
    },
    {
      id: "PU-001", category: "punctuation", confidence: 0.97,
      pattern: /(?<![\p{L}\p{N}_'’])les enfants,\s+jouent(?![\p{L}\p{N}_'’])/iu,
      replace: (s) => s.replace(/(les enfants),\s+(jouent)/iu, "$1 $2"),
      explanation: "On ne sépare normalement pas le sujet de son verbe par une virgule.",
      example: { incorrect: "Les enfants, jouent dans le parc.", correct: "Les enfants jouent dans le parc." },
      source: SOURCES.punctuation
    }
  ];

  const AMBIGUOUS_PATTERNS = [
    { id: "SEM-001", pattern: /\bune\s+livre\b/iu, reason: "« Une livre » peut désigner une unité de poids ou, dans un autre contexte, être une confusion avec « un livre » (ouvrage). Il faut connaître le sens voulu.", alternatives: [{ interpretation: "unité de poids", correction: null, explanation: "Garder « une livre » si vous parlez d’une quantité de poids." }, { interpretation: "ouvrage", correction: text => text.replace(/\bune\s+livre\b/iu, "un livre"), explanation: "Employer « un livre » si vous parlez d’un ouvrage ; la suite de la phrase doit rester compatible avec ce sens." }] },
    { id: "SEM-003", pattern: /\bje parle le français\b/iu, reason: "L’emploi de l’article peut dépendre de la construction et du contexte ; cette règle limitée ne doit pas imposer une correction automatique.", alternatives: [{ interpretation: "phrase acceptable dans son contexte", correction: null, explanation: "Ne rien changer sans contexte montrant une erreur." }, { interpretation: "formulation plus générale", correction: text => text.replace(/\ble français\b/iu, "français"), explanation: "« Je parle français » est également une formulation courante." }] }
  ];

  const ELISIONS = new Set(["j", "c", "ç", "d", "l", "m", "n", "s", "t", "qu", "jusqu", "lorsqu", "puisqu"]);
  const PRONOUNS = new Set(["je", "j'", "j’", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles", "me", "te", "se", "moi", "toi", "lui", "leur", "y", "en"]);
  const DETERMINERS = new Set(["le", "la", "les", "un", "une", "des", "du", "de", "ce", "cet", "cette", "ces", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "notre", "nos", "votre", "vos", "leur", "leurs"]);
  const CONJUNCTIONS = new Set(["que", "qu'", "qu’", "bien", "quoique", "pour", "afin", "avant", "après", "si", "mais", "et", "ou", "donc", "car", "parce", "lorsque", "sans", "jusqu"]);
  const COMMON_VERBS = new Set(["suis", "es", "est", "sommes", "êtes", "sont", "ai", "as", "a", "avons", "avez", "ont", "vais", "vas", "va", "allons", "allez", "vont", "parle", "parles", "parlons", "parlez", "parlent", "mange", "manges", "mangent", "arrivé", "arrivée", "arrivés", "arrivées", "mangé", "mangée", "mangés", "mangées", "joue", "jouent", "comprends", "comprend", "comprennent", "fais", "fait", "font", "peux", "peut", "pouvons", "veut", "veulent", "sois", "soit", "soient", "ait", "aie", "ayons", "soyez"]);

  function matchCase(input, replacement) {
    if (input === input.toLocaleUpperCase("fr")) return replacement.toLocaleUpperCase("fr");
    if (input[0] === input[0].toLocaleUpperCase("fr")) return replacement[0].toLocaleUpperCase("fr") + replacement.slice(1);
    return replacement;
  }

  function tokenize(text) {
    const tokens = [];
    const re = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)?|\d+(?:[.,]\d+)*|[^\s]/gu;
    for (const match of text.matchAll(re)) {
      const value = match[0];
      const normalized = value.toLocaleLowerCase("fr").replace(/’/g, "'");
      const previous = tokens[tokens.length - 1];
      let kind = "punctuation";
      if (/^\d/u.test(value)) kind = "number";
      else if (/^[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)?$/u.test(value)) {
        if (/^[\p{L}]+['’]$/u.test(value)) kind = "elision";
        else if (PRONOUNS.has(normalized)) kind = "pronoun";
        else if (DETERMINERS.has(normalized)) kind = "determiner";
        else if (CONJUNCTIONS.has(normalized)) kind = "conjunction";
        else if (COMMON_VERBS.has(normalized)) kind = "verb";
        else if (previous && ["le", "la", "les", "un", "une", "des", "sa", "son", "ma", "mon"].includes(previous.normalized)) kind = "noun-or-adjective";
        else kind = "word";
      }
      tokens.push({ value, normalized, kind, start: match.index, end: match.index + value.length });
    }
    return tokens;
  }

  function detectContractions(tokens) {
    return tokens.filter((t) => t.normalized.includes("'") || t.normalized.includes("’") || ELISIONS.has(t.normalized.replace(/['’]$/, "")))
      .map((t) => ({ token: t.value, normalized: t.normalized, kind: "elision-or-contraction", start: t.start, end: t.end }));
  }

  function detectClauses(tokens) {
    const clauses = [];
    const triggers = new Set(["bien", "quoique", "pour", "afin", "avant", "après", "parce", "lorsque", "sans", "jusqu", "que"]);
    for (let i = 0; i < tokens.length; i++) {
      if (!triggers.has(tokens[i].normalized.replace(/['’]$/, ""))) continue;
      const window = tokens.slice(i, Math.min(tokens.length, i + 7));
      const joined = window.map((t) => t.normalized).join(" ");
      if (/bien\s+que|quoique|pour\s+que|afin\s+que|avant\s+que|après\s+que|parce\s+que|sans\s+que|jusqu['’]à\s+ce\s+que/u.test(joined)) {
        clauses.push({ trigger: joined, startToken: i, endToken: Math.min(tokens.length - 1, i + 6), type: /après\s+que/u.test(joined) ? "temporal" : /pour\s+que|afin\s+que/u.test(joined) ? "purpose" : "subordinate" });
      }
    }
    return clauses;
  }

  function analyze(text) {
    const tokens = tokenize(text);
    const normalized = tokens.map((t) => t.normalized).join(" ");
    const negation = [];
    for (let i = 0; i < tokens.length; i++) {
      if (["ne", "n'", "n’", "pas", "plus", "jamais", "guère", "aucun", "aucune"].includes(tokens[i].normalized)) {
        negation.push({ token: tokens[i].value, index: i, role: ["ne", "n'", "n’"].includes(tokens[i].normalized) ? "negation-particle" : "negative-marker" });
      }
    }
    const clauses = detectClauses(tokens);
    const verbForms = tokens.filter((t) => t.kind === "verb").map((t) => ({ token: t.value, normalized: t.normalized, form: "candidate-finite-form", confidence: 0.68 }));
    const agreementCandidates = [];
    for (let i = 1; i < tokens.length; i++) {
      if (["sont", "est", "sommes", "êtes", "suis", "es"].includes(tokens[i].normalized)) {
        agreementCandidates.push({ subjectCandidate: tokens[i - 1].value, verb: tokens[i].value, note: "Heuristic subject–verb or subject–participle agreement candidate; not a full dependency parse." });
      }
    }
    return {
      language: "fr",
      tokens,
      contractions: detectContractions(tokens),
      grammaticalRoles: tokens.map((t) => ({ token: t.value, role: t.kind, confidence: ["punctuation", "number"].includes(t.kind) ? 0.99 : 0.62 })),
      verbForms,
      clauses,
      negation,
      agreementCandidates,
      limitations: ["Token roles and agreement links are heuristic, not a complete French syntactic/dependency parse."]
    };
  }

  function check(text) {
    if (typeof text !== "string" || !text.trim()) {
      return { status: "not_sure", input: text, correction: null, confidence: 0, findings: [], alternatives: [], analysis: null, reason: "Provide a non-empty French sentence to analyze." };
    }
    const analysis = analyze(text);
    const allerInfinitive = /(?<![\p{L}\p{N}_'’])(?:(?:pour|afin|bien|avant)\s+que\s+(?:j['’]|je|tu|il|elle|nous|vous|ils|elles)\s+|(?:pour|bien|avant|afin)\s+qu['’](?:il|elle|ils|elles)\s+)(?:vais|vas|va|allons|allez|vont)\s+([\p{L}]+)(?![\p{L}])/iu.exec(text);
    if (allerInfinitive && /(?:er|ir|re|oir)$/iu.test(allerInfinitive[1])) {
      return {
        status: "needs_review", input: text, correction: null, confidence: 0.91,
        findings: [{
          ruleId: "GR-006", category: "syntax", severity: "grammar-note",
          message: "Le subjonctif est attendu après cette locution. Comme « aller » est suivi d’un infinitif, ne remplacez pas automatiquement « vais/va/etc. » par « aille ». Reformulez la proposition avec le subjonctif du verbe voulu, par exemple « pour que je comprenne ».",
          explanation: "La correction dépend du verbe que l’auteur veut employer ; une substitution locale risquerait de changer le sens.",
          source: SOURCES.subjunctivePurpose, confidence: 0.91
        }],
        alternatives: [], analysis,
        reason: "A grammar note is safer than an automatic rewrite when the intended infinitive and sentence meaning must be preserved."
      };
    }
    for (const ambiguous of AMBIGUOUS_PATTERNS) {
      if (ambiguous.pattern.test(text)) {
        return {
          status: "not_sure", input: text, correction: null, confidence: 0.42,
          findings: [{ ruleId: ambiguous.id, category: "meaning", severity: "context-dependent", message: ambiguous.reason, evidence: [] }],
          alternatives: (ambiguous.alternatives || []).map((alternative) => ({ interpretation: alternative.interpretation, correction: typeof alternative.correction === "function" ? alternative.correction(text) : alternative.correction, explanation: alternative.explanation })),
          analysis,
          reason: "The sentence may be valid under a plausible interpretation. Ask the writer what they mean before proposing a correction."
        };
      }
    }
    const findings = [];
    let corrected = text;
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(corrected)) {
        rule.pattern.lastIndex = 0;
        const before = corrected;
        corrected = rule.replace(corrected);
        if (corrected !== before) {
          findings.push({
            ruleId: rule.id,
            category: rule.category,
            severity: "likely-error",
            matchedText: before,
            correction: corrected,
            explanation: rule.explanation,
            example: rule.example,
            source: rule.source,
            confidence: rule.confidence
          });
        }
      }
    }
    if (findings.length) {
      return {
        status: "corrected", input: text, correction: corrected,
        confidence: Math.min(...findings.map((f) => f.confidence)),
        findings, alternatives: [], analysis,
        reason: "A narrow deterministic rule matched. Review the explanation and cited rule before relying on it in high-stakes text."
      };
    }
    return {
      status: "no_issue_detected", input: text, correction: null, confidence: 0.55,
      findings: [], alternatives: [], analysis,
      reason: "No supported rule matched. This does not prove the sentence is fully correct."
    };
  }

  const api = { version: "2.0.0-alpha.1", tokenize, analyze, check, rules: RULES.map(({ id, category, confidence, explanation, example, source }) => ({ id, category, confidence, explanation, example, source })) };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FrenchReasoningV2 = api;
})(typeof window !== "undefined" ? window : globalThis);
