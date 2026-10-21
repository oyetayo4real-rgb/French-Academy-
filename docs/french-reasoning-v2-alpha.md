# French Intelligence Phase 2 — Reasoning Layer Alpha

## Goal

Introduce a separately testable reasoning layer before integrating it into the existing French Academy UI, dictionary, or AI Tutor. This alpha is deliberately narrow and does not claim to be a full French parser.

## Architecture

1. **Normalization and tokenization** — Unicode-aware token matching, apostrophe-aware boundaries, token offsets, punctuation and number tokens.
2. **Heuristic analysis** — candidate grammatical roles, verb-form candidates, clause triggers, contractions and negation markers. These fields are explicitly marked heuristic.
3. **Deterministic rule layer** — narrow, source-linked rules for selected spelling, usage, subjunctive, agreement and punctuation errors.
4. **Decision layer** — structured outcomes:
   - \`corrected\`: a narrow deterministic rule matched;
   - \`needs_review\`: a grammar note is safer than rewriting an infinitive construction;
   - \`not_sure\`: plausible ambiguity requires intended meaning;
   - \`no_issue_detected\`: no supported rule matched; this is not a proof of correctness.
5. **Evidence layer** — findings include rule ID, category, explanation, example, reference URL where available and a confidence score.
6. **Regression suite** — exact full-sentence comparisons for positive corrections, no-auto-correction examples, explicit uncertainty cases, and analysis structure.

## Current alpha coverage

- Spelling and diacritics: \`merçi\`, \`beacoup\`, \`reponse\`, \`bonjor\`.
- Usage: age with \`avoir\`, \`avoir faim\`, \`avoir soif\`.
- Conjugation/mood: selected \`bien que\` + indicative cases for être and avoir.
- Agreement: two carefully scoped past-participle agreement patterns.
- Syntax: repeated \`pas\`; \`aller\` + infinitive after a subjunctive trigger returns a note instead of an unsafe local rewrite.
- Punctuation: a comma between a simple subject and verb.
- Meaning: \`une livre\` and context-sensitive article use can return \`not_sure\`.
- Analysis: token offsets, candidate grammatical roles, contraction markers, clause candidates, negation markers, verb candidates and agreement candidates.

## Important limits

- Confidence values are engineering estimates for rule matching, not calibrated statistical probabilities.
- Grammatical roles, clause boundaries, verb forms and agreement candidates are heuristics, not a full dependency parse.
- The current rule list is intentionally narrow. Absence of a match must never be described as proof that a sentence is correct.
- A source URL supports the underlying rule but does not prove every implementation edge case.
- Candidate corrections should not be auto-applied when intent, register, regional usage or multiple valid interpretations are material.
- Phase 2 alpha is not yet wired into the production page, dictionary, or AI Tutor.
- The existing French Intelligence PR #12 remains Draft and separate from this branch.

## Verification gate

Before merge or integration:
1. Run \`node --check features/french-reasoning-v2.js\`.
2. Run \`node scripts/check-french-reasoning-v2.mjs\` and the existing regression script.
3. Run the desktop/mobile Chromium suite.
4. Review every positive correction and explanation against cited reference material.
5. Obtain qualified French-teacher review for disputed or context-sensitive cases.
6. Keep this PR Draft until linguistic review is complete.

## Authoritative references used by the initial rule set

- Académie française, *Bien que* and concessive constructions: https://www.academie-francaise.fr/laurence-d-france
- Académie française dictionary, past participle agreement: https://www.dictionnaire-academie.fr/article/QDL063
- Académie française dictionary, *fait* + infinitive: https://www.dictionnaire-academie.fr/article/DNP0145
- Académie française dictionary, comma: https://www.dictionnaire-academie.fr/article/A9V0914
- Académie française, *pour que* and negation: https://www.academie-francaise.fr/pour-pas-que-au-lieu-de-pour-que-ne-pas
- Académie française dictionary, *ça* usage: https://www.dictionnaire-academie.fr/article/DNP0881
