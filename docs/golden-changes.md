# Golden v1 to v2 changes

The original tests/golden/legacy-v1.json and its checksum are immutable historical evidence. Version 2 records the Section 14a compatibility behavior. This ledger includes every changed or newly added output entry, with input, old output, new output and reason.

Changed/added output entries: **292**.

## Differences by category

| Category | Changed/added entries |
|---|---:|
|---|---:|
| age-question | 7 |
| conjugation | 94 |
| dictionary | 2 |
| translation | 176 |
| writing | 13 |

## Complete machine-readable difference ledger

    [
      {
        "path": "inventory.answerQuestions[0].output",
        "input": "What is the best way to learn the language?",
        "old_output": null,
        "new_output": "I can answer from the built-in French reference set, grammar guide, common phrases and conjugation rules. I couldn't match this question confidently yet, so I won't invent an answer. Try asking about ne…pas, tu/vous, passé composé, adjective agreement, or a word in the dictionary. For deeper open-ended questions, this no-key version currently needs an optional on-device language model.",
        "reason": "Use whole-word age terms and require a specific age-related question; avoid substring false positives.",
        "category": "age-question"
      },
      {
        "path": "inventory.answerQuestions[1].output",
        "input": "How do I write a message?",
        "old_output": null,
        "new_output": "I can answer from the built-in French reference set, grammar guide, common phrases and conjugation rules. I couldn't match this question confidently yet, so I won't invent an answer. Try asking about ne…pas, tu/vous, passé composé, adjective agreement, or a word in the dictionary. For deeper open-ended questions, this no-key version currently needs an optional on-device language model.",
        "reason": "Use whole-word age terms and require a specific age-related question; avoid substring false positives.",
        "category": "age-question"
      },
      {
        "path": "inventory.answerQuestions[2].output",
        "input": "Comment utiliser dans et en ?",
        "old_output": null,
        "new_output": "I can answer from the built-in French reference set, grammar guide, common phrases and conjugation rules. I couldn't match this question confidently yet, so I won't invent an answer. Try asking about ne…pas, tu/vous, passé composé, adjective agreement, or a word in the dictionary. For deeper open-ended questions, this no-key version currently needs an optional on-device language model.",
        "reason": "Use whole-word age terms and require a specific age-related question; avoid substring false positives.",
        "category": "age-question"
      },
      {
        "path": "inventory.answerQuestions[3].output",
        "input": "What does ans mean?",
        "old_output": null,
        "new_output": "I can answer from the built-in French reference set, grammar guide, common phrases and conjugation rules. I couldn't match this question confidently yet, so I won't invent an answer. Try asking about ne…pas, tu/vous, passé composé, adjective agreement, or a word in the dictionary. For deeper open-ended questions, this no-key version currently needs an optional on-device language model.",
        "reason": "Use whole-word age terms and require a specific age-related question; avoid substring false positives.",
        "category": "age-question"
      },
      {
        "path": "inventory.answerQuestions[4].output",
        "input": "How do I say my age?",
        "old_output": null,
        "new_output": "<b>Talking about age</b><p>French uses <i>avoir</i> (to have), not <i>être</i> (to be): <i>J'ai vingt ans</i> literally means “I have twenty years.”</p>",
        "reason": "Use whole-word age terms and require a specific age-related question; avoid substring false positives.",
        "category": "age-question"
      },
      {
        "path": "inventory.answerQuestions[5].output",
        "input": "How old am I?",
        "old_output": null,
        "new_output": "I can answer from the built-in French reference set, grammar guide, common phrases and conjugation rules. I couldn't match this question confidently yet, so I won't invent an answer. Try asking about ne…pas, tu/vous, passé composé, adjective agreement, or a word in the dictionary. For deeper open-ended questions, this no-key version currently needs an optional on-device language model.",
        "reason": "Use whole-word age terms and require a specific age-related question; avoid substring false positives.",
        "category": "age-question"
      },
      {
        "path": "inventory.answerQuestions[6].output",
        "input": "Quel âge as-tu ?",
        "old_output": null,
        "new_output": "<b>Talking about age</b><p>French uses <i>avoir</i> (to have), not <i>être</i> (to be): <i>J'ai vingt ans</i> literally means “I have twenty years.”</p>",
        "reason": "Use whole-word age terms and require a specific age-related question; avoid substring false positives.",
        "category": "age-question"
      },
      {
        "path": "inventory.checkWriting.knownErrors[0].output",
        "input": "Je suis 20 ans.",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai 20 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 20 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai 20 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 20 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[1].output",
        "input": "Je suis 35 ans.",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai 35 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 35 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai 35 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 35 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[2].output",
        "input": "Je suis 5 ans.",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai 5 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 5 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai 5 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 5 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[3].output",
        "input": "Je suis 12 ans.",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai 12 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 12 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai 12 ans.</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 12 ans.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[4].output",
        "input": "Je suis faim.",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai faim.</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir faim (to be hungry).<div class=\"fi-muted\">Original: Je suis faim.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai faim.</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir faim (to be hungry).<div class=\"fi-muted\">Original: Je suis faim.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[5].output",
        "input": "JE SUIS FAIM !",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai faim !</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir faim (to be hungry).<div class=\"fi-muted\">Original: JE SUIS FAIM !</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai faim !</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir faim (to be hungry).<div class=\"fi-muted\">Original: JE SUIS FAIM !</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[6].output",
        "input": "Je suis soif.",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai soif.</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir soif (to be thirsty).<div class=\"fi-muted\">Original: Je suis soif.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai soif.</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir soif (to be thirsty).<div class=\"fi-muted\">Original: Je suis soif.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[7].output",
        "input": "JE SUIS SOIF !",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">j'ai soif !</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir soif (to be thirsty).<div class=\"fi-muted\">Original: JE SUIS SOIF !</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai soif !</p><b>Why these changes?</b><div class=\"fi-result\">French says avoir soif (to be thirsty).<div class=\"fi-muted\">Original: JE SUIS SOIF !</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[8].output",
        "input": "Sa va bien.",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">ça va bien.</p><b>Why these changes?</b><div class=\"fi-result\">The expression is ça va, with ç; preserve the compound va-et-vient.<div class=\"fi-muted\">Original: Sa va bien.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">Ça va bien.</p><b>Why these changes?</b><div class=\"fi-result\">The expression is ça va, with ç; preserve the compound va-et-vient.<div class=\"fi-muted\">Original: Sa va bien.</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWriting.knownErrors[9].output",
        "input": "SA VA ?",
        "old_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">ça va ?</p><b>Why these changes?</b><div class=\"fi-result\">The expression is ça va, with ç; preserve the compound va-et-vient.<div class=\"fi-muted\">Original: SA VA ?</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">Ça va ?</p><b>Why these changes?</b><div class=\"fi-result\">The expression is ça va, with ç; preserve the compound va-et-vient.<div class=\"fi-muted\">Original: SA VA ?</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWritingCases[0].output",
        "input": "Je suis 20 ans",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">J'ai 20 ans</p><b>Why these changes?</b><div class=\"fi-result\">French uses avoir for age.<div class=\"fi-muted\">Original: Je suis 20 ans</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWritingCases[1].output",
        "input": "Sa va bien",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>Suggested text</b><p class=\"fi-output\">Ça va bien</p><b>Why these changes?</b><div class=\"fi-result\">The expression is ça va, with ç; preserve the compound va-et-vient.<div class=\"fi-muted\">Original: Sa va bien</div></div><button id=\"fiUseCorrection\" class=\"g\">Use corrected text</button></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.checkWritingCases[2].output",
        "input": "Son va-et-vient constant m'inquiète.",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>Text received</b><p>Son va-et-vient constant m'inquiète.</p><p>No issue from the small built-in check list was detected. That does not prove the sentence is fully correct; this is not a full grammar checker.</p></div>",
        "reason": "Preserve initial capitalization in corrections and protect hyphenated compounds with a single shared word-boundary helper.",
        "category": "writing"
      },
      {
        "path": "inventory.conjugation.unsupported[30].output",
        "input": "hier",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.unsupported[31].output",
        "input": "soir",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.unsupported[32].output",
        "input": "livre",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.unsupported[33].output",
        "input": "super",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.unsupported[34].output",
        "input": "hiver",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.unsupported[35].output",
        "input": "noir",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.unsupported[36].output",
        "input": "mère",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.unsupported[37].output",
        "input": "xyz",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[1].output",
        "input": "apprendre",
        "old_output": {
          "v": "apprendre",
          "forms": [
            "apprends",
            "apprends",
            "apprend",
            "apprendons",
            "apprendez",
            "apprendent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "new_output": {
          "v": "apprendre",
          "forms": [
            "apprends",
            "apprends",
            "apprend",
            "apprenons",
            "apprenez",
            "apprennent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[100].output",
        "input": "lever",
        "old_output": null,
        "new_output": {
          "v": "lever",
          "forms": [
            "lève",
            "lèves",
            "lève",
            "levons",
            "levez",
            "lèvent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[101].output",
        "input": "marcher",
        "old_output": null,
        "new_output": {
          "v": "marcher",
          "forms": [
            "marche",
            "marches",
            "marche",
            "marchons",
            "marchez",
            "marchent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[102].output",
        "input": "monter",
        "old_output": null,
        "new_output": {
          "v": "monter",
          "forms": [
            "monte",
            "montes",
            "monte",
            "montons",
            "montez",
            "montent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[103].output",
        "input": "montrer",
        "old_output": null,
        "new_output": {
          "v": "montrer",
          "forms": [
            "montre",
            "montres",
            "montre",
            "montrons",
            "montrez",
            "montrent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[104].output",
        "input": "mourir",
        "old_output": null,
        "new_output": {
          "v": "mourir",
          "forms": [
            "meurs",
            "meurs",
            "meurt",
            "mourons",
            "mourez",
            "meurent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[105].output",
        "input": "obéir",
        "old_output": null,
        "new_output": {
          "v": "obéir",
          "forms": [
            "obéis",
            "obéis",
            "obéit",
            "obéissons",
            "obéissez",
            "obéissent"
          ],
          "type": "Regular -ir verb · present tense (finir pattern)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[106].output",
        "input": "obtenir",
        "old_output": null,
        "new_output": {
          "v": "obtenir",
          "forms": [
            "obtiens",
            "obtiens",
            "obtient",
            "obtenons",
            "obtenez",
            "obtiennent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[107].output",
        "input": "organiser",
        "old_output": null,
        "new_output": {
          "v": "organiser",
          "forms": [
            "organise",
            "organises",
            "organise",
            "organisons",
            "organisez",
            "organisent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[108].output",
        "input": "oublier",
        "old_output": null,
        "new_output": {
          "v": "oublier",
          "forms": [
            "oublie",
            "oublies",
            "oublie",
            "oublions",
            "oubliez",
            "oublient"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[109].output",
        "input": "partager",
        "old_output": null,
        "new_output": {
          "v": "partager",
          "forms": [
            "partage",
            "partages",
            "partage",
            "partageons",
            "partagez",
            "partagent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[110].output",
        "input": "passer",
        "old_output": null,
        "new_output": {
          "v": "passer",
          "forms": [
            "passe",
            "passes",
            "passe",
            "passons",
            "passez",
            "passent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[111].output",
        "input": "payer",
        "old_output": null,
        "new_output": {
          "v": "payer",
          "forms": [
            "paie",
            "paies",
            "paie",
            "payons",
            "payez",
            "paient"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[112].output",
        "input": "penser",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[113].output",
        "input": "perdre",
        "old_output": null,
        "new_output": {
          "v": "perdre",
          "forms": [
            "perds",
            "perds",
            "perd",
            "perdons",
            "perdez",
            "perdent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[114].output",
        "input": "permettre",
        "old_output": null,
        "new_output": {
          "v": "permettre",
          "forms": [
            "permets",
            "permets",
            "permet",
            "permettons",
            "permettez",
            "permettent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[115].output",
        "input": "placer",
        "old_output": null,
        "new_output": {
          "v": "placer",
          "forms": [
            "place",
            "places",
            "place",
            "plaçons",
            "placez",
            "placent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[116].output",
        "input": "porter",
        "old_output": null,
        "new_output": {
          "v": "porter",
          "forms": [
            "porte",
            "portes",
            "porte",
            "portons",
            "portez",
            "portent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[117].output",
        "input": "préférer",
        "old_output": null,
        "new_output": {
          "v": "préférer",
          "forms": [
            "préfère",
            "préfères",
            "préfère",
            "préférons",
            "préférez",
            "préfèrent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[118].output",
        "input": "préparer",
        "old_output": null,
        "new_output": {
          "v": "préparer",
          "forms": [
            "prépare",
            "prépares",
            "prépare",
            "préparons",
            "préparez",
            "préparent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[119].output",
        "input": "présenter",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[120].output",
        "input": "promettre",
        "old_output": null,
        "new_output": {
          "v": "promettre",
          "forms": [
            "promets",
            "promets",
            "promet",
            "promettons",
            "promettez",
            "promettent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[121].output",
        "input": "ranger",
        "old_output": null,
        "new_output": {
          "v": "ranger",
          "forms": [
            "range",
            "ranges",
            "range",
            "rangeons",
            "rangez",
            "rangent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[122].output",
        "input": "réfléchir",
        "old_output": null,
        "new_output": {
          "v": "réfléchir",
          "forms": [
            "réfléchis",
            "réfléchis",
            "réfléchit",
            "réfléchissons",
            "réfléchissez",
            "réfléchissent"
          ],
          "type": "Regular -ir verb · present tense (finir pattern)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[123].output",
        "input": "regarder",
        "old_output": null,
        "new_output": {
          "v": "regarder",
          "forms": [
            "regarde",
            "regardes",
            "regarde",
            "regardons",
            "regardez",
            "regardent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[124].output",
        "input": "remettre",
        "old_output": null,
        "new_output": {
          "v": "remettre",
          "forms": [
            "remets",
            "remets",
            "remet",
            "remettons",
            "remettez",
            "remettent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[125].output",
        "input": "remplir",
        "old_output": null,
        "new_output": {
          "v": "remplir",
          "forms": [
            "remplis",
            "remplis",
            "remplit",
            "remplissons",
            "remplissez",
            "remplissent"
          ],
          "type": "Regular -ir verb · present tense (finir pattern)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[126].output",
        "input": "rendre",
        "old_output": null,
        "new_output": {
          "v": "rendre",
          "forms": [
            "rends",
            "rends",
            "rend",
            "rendons",
            "rendez",
            "rendent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[127].output",
        "input": "répondre",
        "old_output": null,
        "new_output": {
          "v": "répondre",
          "forms": [
            "réponds",
            "réponds",
            "répond",
            "répondons",
            "répondez",
            "répondent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[128].output",
        "input": "reprendre",
        "old_output": null,
        "new_output": {
          "v": "reprendre",
          "forms": [
            "reprends",
            "reprends",
            "reprend",
            "reprenons",
            "reprenez",
            "reprennent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[129].output",
        "input": "rester",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[130].output",
        "input": "retenir",
        "old_output": null,
        "new_output": {
          "v": "retenir",
          "forms": [
            "retiens",
            "retiens",
            "retient",
            "retenons",
            "retenez",
            "retiennent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[131].output",
        "input": "réussir",
        "old_output": null,
        "new_output": {
          "v": "réussir",
          "forms": [
            "réussis",
            "réussis",
            "réussit",
            "réussissons",
            "réussissez",
            "réussissent"
          ],
          "type": "Regular -ir verb · present tense (finir pattern)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[132].output",
        "input": "revenir",
        "old_output": null,
        "new_output": {
          "v": "revenir",
          "forms": [
            "reviens",
            "reviens",
            "revient",
            "revenons",
            "revenez",
            "reviennent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[133].output",
        "input": "suivre",
        "old_output": null,
        "new_output": {
          "v": "suivre",
          "forms": [
            "suis",
            "suis",
            "suit",
            "suivons",
            "suivez",
            "suivent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[134].output",
        "input": "surprendre",
        "old_output": null,
        "new_output": {
          "v": "surprendre",
          "forms": [
            "surprends",
            "surprends",
            "surprend",
            "surprenons",
            "surprenez",
            "surprennent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[135].output",
        "input": "tenir",
        "old_output": null,
        "new_output": {
          "v": "tenir",
          "forms": [
            "tiens",
            "tiens",
            "tient",
            "tenons",
            "tenez",
            "tiennent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[136].output",
        "input": "terminer",
        "old_output": null,
        "new_output": {
          "v": "terminer",
          "forms": [
            "termine",
            "termines",
            "termine",
            "terminons",
            "terminez",
            "terminent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[137].output",
        "input": "tomber",
        "old_output": null,
        "new_output": {
          "v": "tomber",
          "forms": [
            "tombe",
            "tombes",
            "tombe",
            "tombons",
            "tombez",
            "tombent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[138].output",
        "input": "toucher",
        "old_output": null,
        "new_output": {
          "v": "toucher",
          "forms": [
            "touche",
            "touches",
            "touche",
            "touchons",
            "touchez",
            "touchent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[139].output",
        "input": "travailler",
        "old_output": null,
        "new_output": {
          "v": "travailler",
          "forms": [
            "travaille",
            "travailles",
            "travaille",
            "travaillons",
            "travaillez",
            "travaillent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[140].output",
        "input": "trouver",
        "old_output": null,
        "new_output": {
          "v": "trouver",
          "forms": [
            "trouve",
            "trouves",
            "trouve",
            "trouvons",
            "trouvez",
            "trouvent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[141].output",
        "input": "utiliser",
        "old_output": null,
        "new_output": {
          "v": "utiliser",
          "forms": [
            "utilise",
            "utilises",
            "utilise",
            "utilisons",
            "utilisez",
            "utilisent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[142].output",
        "input": "vendre",
        "old_output": null,
        "new_output": {
          "v": "vendre",
          "forms": [
            "vends",
            "vends",
            "vend",
            "vendons",
            "vendez",
            "vendent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[143].output",
        "input": "visiter",
        "old_output": null,
        "new_output": {
          "v": "visiter",
          "forms": [
            "visite",
            "visites",
            "visite",
            "visitons",
            "visitez",
            "visitent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[144].output",
        "input": "vivre",
        "old_output": null,
        "new_output": {
          "v": "vivre",
          "forms": [
            "vis",
            "vis",
            "vit",
            "vivons",
            "vivez",
            "vivent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[145].output",
        "input": "voir",
        "old_output": null,
        "new_output": {
          "v": "voir",
          "forms": [
            "vois",
            "vois",
            "voit",
            "voyons",
            "voyez",
            "voient"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[146].output",
        "input": "voyager",
        "old_output": null,
        "new_output": {
          "v": "voyager",
          "forms": [
            "voyage",
            "voyages",
            "voyage",
            "voyageons",
            "voyagez",
            "voyagent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[16].output",
        "input": "comprendre",
        "old_output": {
          "v": "comprendre",
          "forms": [
            "comprends",
            "comprends",
            "comprend",
            "comprendons",
            "comprendez",
            "comprendent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "new_output": {
          "v": "comprendre",
          "forms": [
            "comprends",
            "comprends",
            "comprend",
            "comprenons",
            "comprenez",
            "comprennent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[17].output",
        "input": "connaître",
        "old_output": {
          "v": "connaître",
          "forms": [
            "connaîts",
            "connaîts",
            "connaît",
            "connaîtons",
            "connaîtez",
            "connaîtent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "new_output": {
          "v": "connaître",
          "forms": [
            "connais",
            "connais",
            "connaît",
            "connaissons",
            "connaissez",
            "connaissent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[18].output",
        "input": "courir",
        "old_output": {
          "v": "courir",
          "forms": [
            "cours",
            "cours",
            "court",
            "courons",
            "courez",
            "courent"
          ],
          "type": "Irregular verb · present tense"
        },
        "new_output": {
          "v": "courir",
          "forms": [
            "cours",
            "cours",
            "court",
            "courons",
            "courez",
            "courent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[3].output",
        "input": "au contraire",
        "old_output": {
          "v": "au contraire",
          "forms": [
            "au contrais",
            "au contrais",
            "au contrai",
            "au contraions",
            "au contraiez",
            "au contraient"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[34].output",
        "input": "encore",
        "old_output": {
          "v": "encore",
          "forms": [
            "encos",
            "encos",
            "enco",
            "encoons",
            "encoez",
            "encoent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[39].output",
        "input": "hier",
        "old_output": {
          "v": "hier",
          "forms": [
            "hie",
            "hies",
            "hie",
            "hions",
            "hiez",
            "hient"
          ],
          "type": "Regular -er verb · present tense"
        },
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[68].output",
        "input": "acheter",
        "old_output": null,
        "new_output": {
          "v": "acheter",
          "forms": [
            "achète",
            "achètes",
            "achète",
            "achetons",
            "achetez",
            "achètent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[69].output",
        "input": "aider",
        "old_output": null,
        "new_output": {
          "v": "aider",
          "forms": [
            "aide",
            "aides",
            "aide",
            "aidons",
            "aidez",
            "aident"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[70].output",
        "input": "aimer",
        "old_output": null,
        "new_output": {
          "v": "aimer",
          "forms": [
            "aime",
            "aimes",
            "aime",
            "aimons",
            "aimez",
            "aiment"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[71].output",
        "input": "appeler",
        "old_output": null,
        "new_output": {
          "v": "appeler",
          "forms": [
            "appelle",
            "appelles",
            "appelle",
            "appelons",
            "appelez",
            "appellent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[72].output",
        "input": "arriver",
        "old_output": null,
        "new_output": {
          "v": "arriver",
          "forms": [
            "arrive",
            "arrives",
            "arrive",
            "arrivons",
            "arrivez",
            "arrivent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[73].output",
        "input": "avancer",
        "old_output": null,
        "new_output": {
          "v": "avancer",
          "forms": [
            "avance",
            "avances",
            "avance",
            "avançons",
            "avancez",
            "avancent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[74].output",
        "input": "changer",
        "old_output": null,
        "new_output": {
          "v": "changer",
          "forms": [
            "change",
            "changes",
            "change",
            "changeons",
            "changez",
            "changent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[75].output",
        "input": "chanter",
        "old_output": null,
        "new_output": {
          "v": "chanter",
          "forms": [
            "chante",
            "chantes",
            "chante",
            "chantons",
            "chantez",
            "chantent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[76].output",
        "input": "chercher",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[77].output",
        "input": "conduire",
        "old_output": null,
        "new_output": {
          "v": "conduire",
          "forms": [
            "conduis",
            "conduis",
            "conduit",
            "conduisons",
            "conduisez",
            "conduisent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[78].output",
        "input": "continuer",
        "old_output": null,
        "new_output": {
          "v": "continuer",
          "forms": [
            "continue",
            "continues",
            "continue",
            "continuons",
            "continuez",
            "continuent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[79].output",
        "input": "cuisiner",
        "old_output": null,
        "new_output": {
          "v": "cuisiner",
          "forms": [
            "cuisine",
            "cuisines",
            "cuisine",
            "cuisinons",
            "cuisinez",
            "cuisinent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[80].output",
        "input": "danser",
        "old_output": null,
        "new_output": {
          "v": "danser",
          "forms": [
            "danse",
            "danses",
            "danse",
            "dansons",
            "dansez",
            "dansent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[81].output",
        "input": "demander",
        "old_output": null,
        "new_output": {
          "v": "demander",
          "forms": [
            "demande",
            "demandes",
            "demande",
            "demandons",
            "demandez",
            "demandent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[82].output",
        "input": "descendre",
        "old_output": null,
        "new_output": {
          "v": "descendre",
          "forms": [
            "descends",
            "descends",
            "descend",
            "descendons",
            "descendez",
            "descendent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[83].output",
        "input": "devenir",
        "old_output": null,
        "new_output": {
          "v": "devenir",
          "forms": [
            "deviens",
            "deviens",
            "devient",
            "devenons",
            "devenez",
            "deviennent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[84].output",
        "input": "donner",
        "old_output": null,
        "new_output": {
          "v": "donner",
          "forms": [
            "donne",
            "donnes",
            "donne",
            "donnons",
            "donnez",
            "donnent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[85].output",
        "input": "écouter",
        "old_output": null,
        "new_output": {
          "v": "écouter",
          "forms": [
            "écoute",
            "écoutes",
            "écoute",
            "écoutons",
            "écoutez",
            "écoutent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[86].output",
        "input": "entendre",
        "old_output": null,
        "new_output": {
          "v": "entendre",
          "forms": [
            "entends",
            "entends",
            "entend",
            "entendons",
            "entendez",
            "entendent"
          ],
          "type": "Regular -re verb · present-tense pattern (verify exceptions)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[87].output",
        "input": "entrer",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[88].output",
        "input": "envoyer",
        "old_output": null,
        "new_output": {
          "v": "envoyer",
          "forms": [
            "envoie",
            "envoies",
            "envoie",
            "envoyons",
            "envoyez",
            "envoient"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[89].output",
        "input": "espérer",
        "old_output": null,
        "new_output": {
          "v": "espérer",
          "forms": [
            "espère",
            "espères",
            "espère",
            "espérons",
            "espérez",
            "espèrent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[90].output",
        "input": "étudier",
        "old_output": null,
        "new_output": {
          "v": "étudier",
          "forms": [
            "étudie",
            "étudies",
            "étudie",
            "étudions",
            "étudiez",
            "étudient"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[91].output",
        "input": "expliquer",
        "old_output": null,
        "new_output": {
          "v": "expliquer",
          "forms": [
            "explique",
            "expliques",
            "explique",
            "expliquons",
            "expliquez",
            "expliquent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[92].output",
        "input": "fermer",
        "old_output": null,
        "new_output": null,
        "reason": "Remove heuristic suffix conjugation; unsupported non-verbs must not receive fabricated forms.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[93].output",
        "input": "finir",
        "old_output": null,
        "new_output": {
          "v": "finir",
          "forms": [
            "finis",
            "finis",
            "finit",
            "finissons",
            "finissez",
            "finissent"
          ],
          "type": "Regular -ir verb · present tense (finir pattern)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[94].output",
        "input": "garder",
        "old_output": null,
        "new_output": {
          "v": "garder",
          "forms": [
            "garde",
            "gardes",
            "garde",
            "gardons",
            "gardez",
            "gardent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[95].output",
        "input": "grandir",
        "old_output": null,
        "new_output": {
          "v": "grandir",
          "forms": [
            "grandis",
            "grandis",
            "grandit",
            "grandissons",
            "grandissez",
            "grandissent"
          ],
          "type": "Regular -ir verb · present tense (finir pattern)"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[96].output",
        "input": "habiter",
        "old_output": null,
        "new_output": {
          "v": "habiter",
          "forms": [
            "habite",
            "habites",
            "habite",
            "habitons",
            "habitez",
            "habitent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[97].output",
        "input": "jeter",
        "old_output": null,
        "new_output": {
          "v": "jeter",
          "forms": [
            "jette",
            "jettes",
            "jette",
            "jetons",
            "jetez",
            "jettent"
          ],
          "type": "Explicit present-tense paradigm · needs review"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[98].output",
        "input": "jouer",
        "old_output": null,
        "new_output": {
          "v": "jouer",
          "forms": [
            "joue",
            "joues",
            "joue",
            "jouons",
            "jouez",
            "jouent"
          ],
          "type": "Regular -er verb · present tense"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.conjugation.verbs[99].output",
        "input": "lancer",
        "old_output": null,
        "new_output": {
          "v": "lancer",
          "forms": [
            "lance",
            "lances",
            "lance",
            "lançons",
            "lancez",
            "lancent"
          ],
          "type": "Explicit verified present-tense paradigm"
        },
        "reason": "Use the explicit table-driven present-tense paradigm; forms not explicitly specified by the acceptance list are tagged needs_review.",
        "category": "conjugation"
      },
      {
        "path": "inventory.dictionary[107].variants[0].output",
        "input": "pays",
        "old_output": {
          "word": "pays",
          "meaning": "country",
          "part": "noun (masculine, usually)",
          "example": "La France est un pays européen.",
          "notes": "Usually masculine; some country names use articles of other genders.",
          "builtIn": true
        },
        "new_output": {
          "word": "pays",
          "meaning": "country",
          "part": "noun (masculine)",
          "example": "La France est un pays européen.",
          "notes": "Always masculine: un pays. Country names such as la France have their own gender.",
          "builtIn": true
        },
        "reason": "Correct the requested noun gender and usage note for this dictionary entry.",
        "category": "dictionary"
      },
      {
        "path": "inventory.dictionary[54].variants[0].output",
        "input": "enfant",
        "old_output": {
          "word": "enfant",
          "meaning": "child",
          "part": "noun (masculine or feminine by person)",
          "example": "L'enfant joue dehors.",
          "notes": "The noun is grammatically masculine; the person's sex is contextual.",
          "builtIn": true
        },
        "new_output": {
          "word": "enfant",
          "meaning": "child",
          "part": "noun (masculine or feminine; same form)",
          "example": "L'enfant joue dehors.",
          "notes": "The form is the same for boys and girls; the article follows the child (un enfant, une enfant); un enfant is the usual generic form.",
          "builtIn": true
        },
        "reason": "Correct the requested noun gender and usage note for this dictionary entry.",
        "category": "dictionary"
      },
      {
        "path": "inventory.edgeInputs[0].outputs.translateFrEn",
        "input": "",
        "old_output": "Enter some text first.",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Enter some text first.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[1].outputs.translateFrEn",
        "input": "   \t  ",
        "old_output": "Enter some text first.",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Enter some text first.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[10].outputs.translateFrEn",
        "input": "« bonjour »",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">« hello »</div><p class=\"fi-muted\">Matched local phrases: hello. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">« hello »</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[11].outputs.translateFrEn",
        "input": "ÉCOLE",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">school</div><p class=\"fi-muted\">Matched local phrases: school. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">school</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[12].outputs.translateFrEn",
        "input": "!!! ??? … —",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/!!!%20%3F%3F%3F%20%E2%80%A6%20%E2%80%94\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=!!!%20%3F%3F%3F%20%E2%80%A6%20%E2%80%94\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[13].outputs.translateFrEn",
        "input": "Bonjour\nJe vais bien.",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">hello\nI go / I am going well.</div><p class=\"fi-muted\">Matched local phrases: I go / I am going; hello; well. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>Bonjour</b>: hello; good morning</li><li><b>bien</b>: well; good</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[14].outputs.translateFrEn",
        "input": "je\tne\tcomprends\tpas",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/je%09ne%09comprends%09pas\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=je%09ne%09comprends%09pas\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[15].outputs.translateFrEn",
        "input": null,
        "old_output": "Enter some text first.",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Enter some text first.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[16].outputs.translateFrEn",
        "input": 12345,
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/12345\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=12345\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[17].outputs.translateFrEn",
        "input": false,
        "old_output": "Enter some text first.",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Enter some text first.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[18].outputs.translateFrEn",
        "input": "bon​jour",
        "old_output": "<div class=\"fi-answer\"><b>Vocabulary hints (not a complete translation)</b><div class=\"fi-result\"><b>bon</b> — good</div><div class=\"fi-result\"><b>jour</b> — day</div></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>bon</b>: good</li><li><b>jour</b>: day</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[19].outputs.translateFrEn",
        "input": "̧́",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/%CC%81%CC%A7\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=%CC%81%CC%A7\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[2].outputs.translateFrEn",
        "input": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[20].outputs.translateFrEn",
        "input": "<script>alert(\"x\")</script>",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/%3Cscript%3Ealert(%22x%22)%3C%2Fscript%3E\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=%3Cscript%3Ealert(%22x%22)%3C%2Fscript%3E\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[21].outputs.translateFrEn",
        "input": "a&b<c>d",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/a%26b%3Cc%3Ed\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=a%26b%3Cc%3Ed\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[22].outputs.translateFrEn",
        "input": "“l'école”",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">“l'school”</div><p class=\"fi-muted\">Matched local phrases: school. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[23].outputs.translateFrEn",
        "input": "jʼai",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/j%CA%BCai\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=j%CA%BCai\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[24].outputs.translateFrEn",
        "input": "l’école",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">l’school</div><p class=\"fi-muted\">Matched local phrases: school. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[25].outputs.translateFrEn",
        "input": "À bientôt, cœur et sœur.",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">see you soon, cœur et sœur.</div><p class=\"fi-muted\">Matched local phrases: see you soon. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>bientôt</b>: soon</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[26].outputs.translateFrEn",
        "input": "é😀",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/e%CC%81%F0%9F%98%80\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=e%CC%81%F0%9F%98%80\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[27].outputs.translateFrEn",
        "input": "bonjour madame",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">hello madame</div><p class=\"fi-muted\">Matched local phrases: hello. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>bonjour</b>: hello; good morning</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[28].outputs.translateFrEn",
        "input": "« … bonjour !!! »",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">« … hello !!! »</div><p class=\"fi-muted\">Matched local phrases: hello. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">« … hello !!! »</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[29].outputs.translateFrEn",
        "input": "\"<&>\" '« & »'  ",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/%22%3C%26%3E%22%20'%C2%AB%20%26%20%C2%BB'\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=%22%3C%26%3E%22%20'%C2%AB%20%26%20%C2%BB'\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[3].outputs.translateFrEn",
        "input": "😀🧑🏽‍🚀🇫🇷",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/%F0%9F%98%80%F0%9F%A7%91%F0%9F%8F%BD%E2%80%8D%F0%9F%9A%80%F0%9F%87%AB%F0%9F%87%B7\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=%F0%9F%98%80%F0%9F%A7%91%F0%9F%8F%BD%E2%80%8D%F0%9F%9A%80%F0%9F%87%AB%F0%9F%87%B7\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[4].outputs.translateFrEn",
        "input": "J'aime 🇫🇷 😊.",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/J'aime%20%F0%9F%87%AB%F0%9F%87%B7%20%F0%9F%98%8A.\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=J'aime%20%F0%9F%87%AB%F0%9F%87%B7%20%F0%9F%98%8A.\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[5].outputs.translateFrEn",
        "input": "école",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/e%CC%81cole\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=e%CC%81cole\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[6].outputs.translateFrEn",
        "input": "garçon",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/garc%CC%A7on\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=garc%CC%A7on\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[7].outputs.translateFrEn",
        "input": "<tag> & \"double\" 'single'",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/%3Ctag%3E%20%26%20%22double%22%20'single'\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=%3Ctag%3E%20%26%20%22double%22%20'single'\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[8].outputs.translateFrEn",
        "input": "j'ai besoin d'aide",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Matched local phrases: I need help. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.edgeInputs[9].outputs.translateFrEn",
        "input": "j’ai besoin d’aide",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Matched local phrases: I need help. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[0].output",
        "input": "pouvez-vous m'aider",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">can you help me</div><p class=\"fi-muted\">Matched local phrases: can you help me. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">can you help me</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[1].output",
        "input": "excusez-moi",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/excusez-moi\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=excusez-moi\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[10].output",
        "input": "je suis d'accord",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I agree</div><p class=\"fi-muted\">Matched local phrases: I agree. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I agree</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[11].output",
        "input": "je suis",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am</div><p class=\"fi-muted\">Matched local phrases: I am. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[12].output",
        "input": "je suis heureux/heureuse",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am heureux/heureuse</div><p class=\"fi-muted\">Matched local phrases: I am. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>heureux</b>: happy</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[13].output",
        "input": "j'ai faim",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am hungry</div><p class=\"fi-muted\">Matched local phrases: I am hungry. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am hungry</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[14].output",
        "input": "j'apprends le français",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">j'apprends le French</div><p class=\"fi-muted\">Matched local phrases: French. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>français</b>: French; French person</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[15].output",
        "input": "je suis désolé(e)",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am sorry(e)</div><p class=\"fi-muted\">Matched local phrases: I am sorry. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[16].output",
        "input": "j'ai soif",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am thirsty</div><p class=\"fi-muted\">Matched local phrases: I am thirsty. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am thirsty</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[17].output",
        "input": "je suis fatigué(e)",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am tired(e)</div><p class=\"fi-muted\">Matched local phrases: I am tired. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>fatigué</b>: tired</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[18].output",
        "input": "je ne sais pas",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I don't know</div><p class=\"fi-muted\">Matched local phrases: I don't know. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I don't know</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[19].output",
        "input": "je ne comprends pas",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I don't understand</div><p class=\"fi-muted\">Matched local phrases: I don't understand. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I don't understand</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[2].output",
        "input": "bonsoir",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">good evening</div><p class=\"fi-muted\">Matched local phrases: good evening. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">good evening</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[20].output",
        "input": "j'ai",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I have</div><p class=\"fi-muted\">Matched local phrases: I have. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I have</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[21].output",
        "input": "je t'aime",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/je%20t'aime\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=je%20t'aime\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[22].output",
        "input": "j'ai besoin d'un médecin",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I have besoin d'un médecin</div><p class=\"fi-muted\">Matched local phrases: I have. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>besoin</b>: need</li><li><b>médecin</b>: doctor</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[23].output",
        "input": "j'ai besoin d'aide",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Matched local phrases: I need help. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[24].output",
        "input": "je parle français",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">je parle French</div><p class=\"fi-muted\">Matched local phrases: French. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>français</b>: French; French person</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[25].output",
        "input": "je comprends",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I understand</div><p class=\"fi-muted\">Matched local phrases: I understand. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I understand</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[26].output",
        "input": "je voudrais",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I would like</div><p class=\"fi-muted\">Matched local phrases: I would like. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I would like</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[27].output",
        "input": "je voudrais de l'eau",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I would like de l'water</div><p class=\"fi-muted\">Matched local phrases: I would like; water. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[28].output",
        "input": "je m'appelle",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">my name is</div><p class=\"fi-muted\">Matched local phrases: my name is. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">my name is</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[29].output",
        "input": "non",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">no</div><p class=\"fi-muted\">Matched local phrases: no. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">no</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[3].output",
        "input": "bonjour",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">hello</div><p class=\"fi-muted\">Matched local phrases: hello. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">hello</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[30].output",
        "input": "s'il vous plaît",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">please (formal/plural)</div><p class=\"fi-muted\">Matched local phrases: please (formal/plural). This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">please (formal/plural)</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[31].output",
        "input": "à plus tard",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/%C3%A0%20plus%20tard\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=%C3%A0%20plus%20tard\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[32].output",
        "input": "à bientôt",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">see you soon</div><p class=\"fi-muted\">Matched local phrases: see you soon. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">see you soon</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[33].output",
        "input": "à demain",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">see you tomorrow</div><p class=\"fi-muted\">Matched local phrases: see you tomorrow. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">see you tomorrow</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[34].output",
        "input": "merci",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">thank you</div><p class=\"fi-muted\">Matched local phrases: thank you. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">thank you</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[35].output",
        "input": "merci beaucoup",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">thank you very much</div><p class=\"fi-muted\">Matched local phrases: thank you very much. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">thank you very much</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[36].output",
        "input": "quelle heure est-il",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/quelle%20heure%20est-il\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=quelle%20heure%20est-il\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[37].output",
        "input": "où sont les toilettes",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">where sont les toilettes</div><p class=\"fi-muted\">Matched local phrases: where. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>où</b>: where</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[38].output",
        "input": "où est la gare",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">where est la gare</div><p class=\"fi-muted\">Matched local phrases: where. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>où</b>: where</li><li><b>gare</b>: train station</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[39].output",
        "input": "oui",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">yes</div><p class=\"fi-muted\">Matched local phrases: yes. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">yes</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[4].output",
        "input": "bonne nuit",
        "old_output": "<div class=\"fi-answer\"><b>Vocabulary hints (not a complete translation)</b><div class=\"fi-result\"><b>bonne</b> — good</div><div class=\"fi-result\"><b>nuit</b> — night</div></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>bonne</b>: good</li><li><b>nuit</b>: night</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[5].output",
        "input": "au revoir",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">goodbye</div><p class=\"fi-muted\">Matched local phrases: goodbye. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">goodbye</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[6].output",
        "input": "bonne journée",
        "old_output": "<div class=\"fi-answer\"><b>Vocabulary hints (not a complete translation)</b><div class=\"fi-result\"><b>bonne</b> — good</div></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>bonne</b>: good</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[7].output",
        "input": "bonjour",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">hello</div><p class=\"fi-muted\">Matched local phrases: hello. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">hello</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[8].output",
        "input": "comment allez-vous",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">how are you (formal/plural)</div><p class=\"fi-muted\">Matched local phrases: how are you (formal/plural). This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">how are you (formal/plural)</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.frenchToEnglish[9].output",
        "input": "combien ça coûte",
        "old_output": "<div class=\"fi-answer\"><b>Vocabulary hints (not a complete translation)</b><div class=\"fi-result\"><b>combien</b> — how much; how many</div></div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>combien</b>: how much; how many</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[0].frEnOutput",
        "input": "j'ai besoin d'aide",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Matched local phrases: I need help. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[1].frEnOutput",
        "input": "j'ai faim",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am hungry</div><p class=\"fi-muted\">Matched local phrases: I am hungry. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am hungry</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[10].frEnOutput",
        "input": "comment ça va",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">how are things going</div><p class=\"fi-muted\">Matched local phrases: how are things going. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">how are things going</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[11].frEnOutput",
        "input": "ça va",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I'm fine / it's going</div><p class=\"fi-muted\">Matched local phrases: I'm fine / it's going. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I'm fine / it's going</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[12].frEnOutput",
        "input": "je voudrais",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I would like</div><p class=\"fi-muted\">Matched local phrases: I would like. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I would like</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[13].frEnOutput",
        "input": "s'il vous plaît",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">please (formal/plural)</div><p class=\"fi-muted\">Matched local phrases: please (formal/plural). This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">please (formal/plural)</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[14].frEnOutput",
        "input": "s'il te plaît",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">please (informal)</div><p class=\"fi-muted\">Matched local phrases: please (informal). This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">please (informal)</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[15].frEnOutput",
        "input": "merci beaucoup",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">thank you very much</div><p class=\"fi-muted\">Matched local phrases: thank you very much. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">thank you very much</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[16].frEnOutput",
        "input": "au revoir",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">goodbye</div><p class=\"fi-muted\">Matched local phrases: goodbye. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">goodbye</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[17].frEnOutput",
        "input": "à bientôt",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">see you soon</div><p class=\"fi-muted\">Matched local phrases: see you soon. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">see you soon</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[18].frEnOutput",
        "input": "à demain",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">see you tomorrow</div><p class=\"fi-muted\">Matched local phrases: see you tomorrow. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">see you tomorrow</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[19].frEnOutput",
        "input": "je ne comprends pas",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I don't understand</div><p class=\"fi-muted\">Matched local phrases: I don't understand. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I don't understand</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[2].frEnOutput",
        "input": "j'ai soif",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am thirsty</div><p class=\"fi-muted\">Matched local phrases: I am thirsty. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am thirsty</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[20].frEnOutput",
        "input": "je comprends",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I understand</div><p class=\"fi-muted\">Matched local phrases: I understand. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I understand</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[21].frEnOutput",
        "input": "est-ce que",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">question marker</div><p class=\"fi-muted\">Matched local phrases: question marker. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">question marker</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[22].frEnOutput",
        "input": "parce que",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">because</div><p class=\"fi-muted\">Matched local phrases: because. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">because</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[23].frEnOutput",
        "input": "il y a",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">there is / there are</div><p class=\"fi-muted\">Matched local phrases: there is / there are. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">there is / there are</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[24].frEnOutput",
        "input": "je suis",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am</div><p class=\"fi-muted\">Matched local phrases: I am. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[25].frEnOutput",
        "input": "j'ai",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I have</div><p class=\"fi-muted\">Matched local phrases: I have. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I have</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[26].frEnOutput",
        "input": "tu es",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">you are</div><p class=\"fi-muted\">Matched local phrases: you are. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">you are</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[27].frEnOutput",
        "input": "il est",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">he is / it is</div><p class=\"fi-muted\">Matched local phrases: he is / it is. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">he is / it is</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[28].frEnOutput",
        "input": "nous sommes",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">we are</div><p class=\"fi-muted\">Matched local phrases: we are. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">we are</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[29].frEnOutput",
        "input": "vous êtes",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">you are</div><p class=\"fi-muted\">Matched local phrases: you are. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">you are</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[3].frEnOutput",
        "input": "je suis fatigué",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am tired</div><p class=\"fi-muted\">Matched local phrases: I am tired. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am tired</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[30].frEnOutput",
        "input": "ils sont",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">they are</div><p class=\"fi-muted\">Matched local phrases: they are. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">they are</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[31].frEnOutput",
        "input": "je vais",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I go / I am going</div><p class=\"fi-muted\">Matched local phrases: I go / I am going. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I go / I am going</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[32].frEnOutput",
        "input": "je veux",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I want</div><p class=\"fi-muted\">Matched local phrases: I want. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I want</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[33].frEnOutput",
        "input": "je peux",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I can</div><p class=\"fi-muted\">Matched local phrases: I can. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I can</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[34].frEnOutput",
        "input": "bonjour",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">hello</div><p class=\"fi-muted\">Matched local phrases: hello. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">hello</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[35].frEnOutput",
        "input": "bonsoir",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">good evening</div><p class=\"fi-muted\">Matched local phrases: good evening. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">good evening</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[36].frEnOutput",
        "input": "salut",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">hi / bye</div><p class=\"fi-muted\">Matched local phrases: hi / bye. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">hi / bye</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[37].frEnOutput",
        "input": "merci",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">thank you</div><p class=\"fi-muted\">Matched local phrases: thank you. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">thank you</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[38].frEnOutput",
        "input": "oui",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">yes</div><p class=\"fi-muted\">Matched local phrases: yes. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">yes</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[39].frEnOutput",
        "input": "non",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">no</div><p class=\"fi-muted\">Matched local phrases: no. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">no</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[4].frEnOutput",
        "input": "je ne sais pas",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I don't know</div><p class=\"fi-muted\">Matched local phrases: I don't know. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I don't know</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[40].frEnOutput",
        "input": "aujourd'hui",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">today</div><p class=\"fi-muted\">Matched local phrases: today. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">today</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[41].frEnOutput",
        "input": "demain",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">tomorrow</div><p class=\"fi-muted\">Matched local phrases: tomorrow. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">tomorrow</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[42].frEnOutput",
        "input": "hier",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">yesterday</div><p class=\"fi-muted\">Matched local phrases: yesterday. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">yesterday</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[43].frEnOutput",
        "input": "maison",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">house / home</div><p class=\"fi-muted\">Matched local phrases: house / home. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">house / home</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[44].frEnOutput",
        "input": "école",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">school</div><p class=\"fi-muted\">Matched local phrases: school. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">school</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[45].frEnOutput",
        "input": "français",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">French</div><p class=\"fi-muted\">Matched local phrases: French. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">French</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[46].frEnOutput",
        "input": "amour",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">love</div><p class=\"fi-muted\">Matched local phrases: love. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">love</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[47].frEnOutput",
        "input": "ami",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">friend</div><p class=\"fi-muted\">Matched local phrases: friend. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">friend</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[48].frEnOutput",
        "input": "livre",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">book</div><p class=\"fi-muted\">Matched local phrases: book. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">book</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[49].frEnOutput",
        "input": "eau",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">water</div><p class=\"fi-muted\">Matched local phrases: water. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">water</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[5].frEnOutput",
        "input": "je suis désolée",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I am sorry</div><p class=\"fi-muted\">Matched local phrases: I am sorry. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am sorry</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[50].frEnOutput",
        "input": "pain",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">bread</div><p class=\"fi-muted\">Matched local phrases: bread. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">bread</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[51].frEnOutput",
        "input": "parler",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">to speak</div><p class=\"fi-muted\">Matched local phrases: to speak. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">to speak</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[52].frEnOutput",
        "input": "manger",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">to eat</div><p class=\"fi-muted\">Matched local phrases: to eat. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">to eat</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[53].frEnOutput",
        "input": "apprendre",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">to learn</div><p class=\"fi-muted\">Matched local phrases: to learn. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">to learn</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[54].frEnOutput",
        "input": "comprendre",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">to understand</div><p class=\"fi-muted\">Matched local phrases: to understand. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">to understand</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[55].frEnOutput",
        "input": "travailler",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">to work</div><p class=\"fi-muted\">Matched local phrases: to work. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">to work</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[56].frEnOutput",
        "input": "étudiant",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">student</div><p class=\"fi-muted\">Matched local phrases: student. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">student</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[57].frEnOutput",
        "input": "étudiante",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">student</div><p class=\"fi-muted\">Matched local phrases: student. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">student</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[58].frEnOutput",
        "input": "comment",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">how</div><p class=\"fi-muted\">Matched local phrases: how. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">how</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[59].frEnOutput",
        "input": "pourquoi",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">why</div><p class=\"fi-muted\">Matched local phrases: why. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">why</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[6].frEnOutput",
        "input": "pouvez-vous m'aider",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">can you help me</div><p class=\"fi-muted\">Matched local phrases: can you help me. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">can you help me</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[60].frEnOutput",
        "input": "quand",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">when</div><p class=\"fi-muted\">Matched local phrases: when. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">when</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[61].frEnOutput",
        "input": "où",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">where</div><p class=\"fi-muted\">Matched local phrases: where. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">where</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[62].frEnOutput",
        "input": "avec",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">with</div><p class=\"fi-muted\">Matched local phrases: with. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">with</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[63].frEnOutput",
        "input": "sans",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">without</div><p class=\"fi-muted\">Matched local phrases: without. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">without</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[64].frEnOutput",
        "input": "beaucoup",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">a lot</div><p class=\"fi-muted\">Matched local phrases: a lot. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">a lot</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[65].frEnOutput",
        "input": "toujours",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">always</div><p class=\"fi-muted\">Matched local phrases: always. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">always</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[66].frEnOutput",
        "input": "jamais",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">never</div><p class=\"fi-muted\">Matched local phrases: never. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">never</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[67].frEnOutput",
        "input": "mais",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">but</div><p class=\"fi-muted\">Matched local phrases: but. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">but</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[68].frEnOutput",
        "input": "bien",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">well</div><p class=\"fi-muted\">Matched local phrases: well. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">well</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[69].frEnOutput",
        "input": "très",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">very</div><p class=\"fi-muted\">Matched local phrases: very. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">very</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[7].frEnOutput",
        "input": "je suis d'accord",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">I agree</div><p class=\"fi-muted\">Matched local phrases: I agree. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I agree</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[8].frEnOutput",
        "input": "je m'appelle",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">my name is</div><p class=\"fi-muted\">Matched local phrases: my name is. This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">my name is</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.regexPatterns[9].frEnOutput",
        "input": "comment allez-vous",
        "old_output": "<div class=\"fi-answer\"><b>Approximate English:</b><div class=\"fi-output\">how are you (formal/plural)</div><p class=\"fi-muted\">Matched local phrases: how are you (formal/plural). This is a word/phrase substitution, not a full semantic translation; verify grammar and context.</p></div>",
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">how are you (formal/plural)</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[0].frEnOutput",
        "input": "qzxv-unsupported-phrase-01",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-01\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-01\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[1].frEnOutput",
        "input": "qzxv-unsupported-phrase-02",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-02\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-02\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[10].frEnOutput",
        "input": "qzxv-unsupported-phrase-11",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-11\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-11\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[11].frEnOutput",
        "input": "qzxv-unsupported-phrase-12",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-12\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-12\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[12].frEnOutput",
        "input": "qzxv-unsupported-phrase-13",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-13\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-13\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[13].frEnOutput",
        "input": "qzxv-unsupported-phrase-14",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-14\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-14\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[14].frEnOutput",
        "input": "qzxv-unsupported-phrase-15",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-15\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-15\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[15].frEnOutput",
        "input": "qzxv-unsupported-phrase-16",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-16\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-16\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[16].frEnOutput",
        "input": "qzxv-unsupported-phrase-17",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-17\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-17\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[17].frEnOutput",
        "input": "qzxv-unsupported-phrase-18",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-18\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-18\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[18].frEnOutput",
        "input": "qzxv-unsupported-phrase-19",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-19\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-19\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[19].frEnOutput",
        "input": "qzxv-unsupported-phrase-20",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-20\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-20\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[2].frEnOutput",
        "input": "qzxv-unsupported-phrase-03",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-03\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-03\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[20].frEnOutput",
        "input": "qzxv-unsupported-phrase-21",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-21\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-21\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[21].frEnOutput",
        "input": "qzxv-unsupported-phrase-22",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-22\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-22\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[22].frEnOutput",
        "input": "qzxv-unsupported-phrase-23",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-23\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-23\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[23].frEnOutput",
        "input": "qzxv-unsupported-phrase-24",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-24\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-24\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[24].frEnOutput",
        "input": "qzxv-unsupported-phrase-25",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-25\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-25\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[25].frEnOutput",
        "input": "qzxv-unsupported-phrase-26",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-26\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-26\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[26].frEnOutput",
        "input": "qzxv-unsupported-phrase-27",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-27\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-27\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[27].frEnOutput",
        "input": "qzxv-unsupported-phrase-28",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-28\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-28\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[28].frEnOutput",
        "input": "qzxv-unsupported-phrase-29",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-29\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-29\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[29].frEnOutput",
        "input": "qzxv-unsupported-phrase-30",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-30\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-30\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[3].frEnOutput",
        "input": "qzxv-unsupported-phrase-04",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-04\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-04\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[4].frEnOutput",
        "input": "qzxv-unsupported-phrase-05",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-05\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-05\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[5].frEnOutput",
        "input": "qzxv-unsupported-phrase-06",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-06\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-06\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[6].frEnOutput",
        "input": "qzxv-unsupported-phrase-07",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-07\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-07\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[7].frEnOutput",
        "input": "qzxv-unsupported-phrase-08",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-08\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-08\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[8].frEnOutput",
        "input": "qzxv-unsupported-phrase-09",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-09\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-09\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.phrasebook.unsupported[9].frEnOutput",
        "input": "qzxv-unsupported-phrase-10",
        "old_output": "<div class=\"fi-answer\">No reliable local match was found. Try a known phrase or open <a href=\"https://www.deepl.com/translator#fr/en/qzxv-unsupported-phrase-10\" target=\"_blank\" rel=\"noopener noreferrer\">DeepL</a> or <a href=\"https://translate.google.com/?sl=fr&tl=en&text=qzxv-unsupported-phrase-10\" target=\"_blank\" rel=\"noopener noreferrer\">Google Translate</a>. The app does not send this text to those services automatically.</div>",
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.translateCoverage[0].output",
        "input": "Je suis étudiant",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>No vocabulary hints are available for this input.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.translateCoverage[1].output",
        "input": "Je suis fatiguée.",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I am tired.</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.translateCoverage[2].output",
        "input": "J’ai besoin d’aide",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">I need help</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.translateCoverage[3].output",
        "input": "Bonjour",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>English:</b><div class=\"fi-output\">hello</div><p class=\"fi-muted\">Every word in the input is covered by a local phrase pattern.</p></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.translateCoverage[4].output",
        "input": "Bonjour madame",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>Bonjour</b>: hello; good morning</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      },
      {
        "path": "inventory.translateCoverage[5].output",
        "input": "Comment utiliser dans et en ?",
        "old_output": null,
        "new_output": "<div class=\"fi-answer\"><b>Ambiguous — no full translation offered</b><p>Local phrase patterns do not cover the whole input. Vocabulary hints are not a complete translation.</p><p>Vocabulary hints:</p><ul><li><b>Comment</b>: how; what ... like</li></ul></div>",
        "reason": "Only translate when local phrase patterns cover every word; otherwise return ambiguous with vocabulary hints and no assembled sentence.",
        "category": "translation"
      }
    ]


## Approved v2 to v3 correction: `courir`

Version 3 preserves every version-2 inventory entry except the single expected output field for `conjugate("courir")`. The conjugation forms and person rows are unchanged; the explicit irregular-verb label is corrected after restoring `courir` to the verified 22-verb list.

| JSON path | Input | legacy-v2 | legacy-v3 | Reason |
|---|---|---|---|---|
| `inventory.conjugation.verbs[18].output.type` | `conjugate("courir")` | `Explicit present-tense paradigm · needs review` | `Irregular verb · present tense` | `courir` is the 22nd explicitly verified irregular verb; the previous `slice(0,21)` accidentally excluded it. |

The v3 parity guard compares the complete parsed JSON objects and fails if any other path differs from v2. `legacy-v2.json` and `legacy-v2.sha256` remain unchanged.
