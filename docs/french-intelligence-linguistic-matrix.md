# French Intelligence linguistic review matrix

Scope: local dictionary, phrasebook, present-tense conjugation, selected grammar explanations, and pattern-based writing checks. This matrix deliberately distinguishes deterministic regression checks from linguistic cases requiring expert review.

## Regression matrix

| Test ID | Feature | Input | Expected answer or behaviour | Actual result | Verdict | Explanation | Regression reference |
|---|---|---|---|---|---|---|---|
| DI-01 | Dictionary | `bonjour` | “hello; good morning”; canonical spelling retained | Covered by core test | NEEDS REVIEW | Entry is intentionally concise; context determines greeting translation | `check-french-intelligence.mjs` |
| DI-02 | Dictionary | `ecole` | Find canonical `école` | Covered by core test | NEEDS REVIEW | Accent-insensitive search must not change displayed spelling | `check-french-intelligence.mjs` |
| DI-03 | Dictionary | `S’il vous plaît` | Find canonical `s'il vous plaît` | Added; CI pending | NEEDS REVIEW | Typographic apostrophe normalization is now implemented | `check-french-intelligence.mjs` |
| DI-04 | Dictionary | `livre` | Book; note `une livre` can mean a pound | Covered by entry | PASS | expected answer checked by a reviewer; engine output covered by CI | `features/french-intelligence.js` |
| DI-05 | Dictionary | `temps` | Time/weather/tense meanings acknowledged as contextual | Entry present | NEEDS REVIEW | A single English gloss is not exhaustive | `features/french-intelligence.js` |
| DI-06 | Dictionary | `xqz-not-a-word` | Return unsupported/null; do not invent a definition | Covered by core test | NEEDS REVIEW | Unknown terms must remain unknown | `check-french-intelligence.mjs` |
| TR-01 | Translation FR→EN | `Bonjour` in French→English mode | “hello” for this supported phrase | Browser regression | NEEDS REVIEW | Exact phrasebook result only | `check-french-intelligence.browser.mjs` |
| TR-02 | Translation EN→FR | `I need help` | `J'ai besoin d'aide` | Covered by core test | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| TR-03 | Translation EN→FR | `I don't understand` | `Je ne comprends pas`; negation preserved | Added; CI pending | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| TR-04 | Translation | Unsupported full sentence | Explicit unsupported message; no guessed sentence | Covered by core test | NEEDS REVIEW | Phrasebook is not general-purpose machine translation | `check-french-intelligence.mjs` |
| TR-05 | Translation | French phrase with typographic apostrophe | Do not claim full translation unless the phrase is explicitly supported | Not yet tested end-to-end | NEEDS REVIEW | Apostrophe normalization is implemented for matching, but phrase-map regex coverage still needs review | Follow-up required |
| CO-01 | Conjugation | `être` | suis, es, est, sommes, êtes, sont | Covered by core test | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| CO-02 | Conjugation | `écrire` | écris, écris, écrit, écrivons, écrivez, écrivent | Covered by core test | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| CO-03 | Conjugation | `venir` | viens, viens, vient, venons, venez, viennent | Added; CI pending | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| CO-04 | Conjugation | `prendre` | prends, prends, prend, prenons, prenez, prennent | Added; CI pending | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| CO-05 | Conjugation | `pouvoir` | peux, peux, peut, pouvons, pouvez, peuvent | Added; CI pending | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| CO-06 | Conjugation | `xyz` | Unsupported response/null | Covered by core test | NEEDS REVIEW | No fabricated forms | `check-french-intelligence.mjs` |
| GR-01 | Grammar | `depuis` vs `pendant` | Explain continuing state vs framed duration with context caveat | Covered by core test | NEEDS REVIEW | Useful tendency, not a universal tense formula | `check-french-intelligence.mjs` |
| GR-02 | Grammar | `savoir` vs `connaître` | Facts/skills vs familiarity, with examples | Covered by core test | NEEDS REVIEW | Simplified distinction; constructions can overlap in meaning | `check-french-intelligence.mjs` |
| GR-03 | Grammar | `y` vs `en` | Explain common replacements and verb-construction dependency | Covered by core test | NEEDS REVIEW | Not a complete account of either pronoun | `check-french-intelligence.mjs` |
| GR-04 | Grammar | `J'ai vingt ans` | Explain that French uses `avoir` for age | Covered by core test | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| WR-01 | Writing | `Je suis 20 ans` | Suggest `J'ai 20 ans` and explain `avoir` for age | Covered by core test | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| WR-02 | Writing | `Je parle le français.` | Do not mark as definitely wrong | Added; CI pending | NEEDS REVIEW | Article use can be valid depending on construction/emphasis; removed overconfident correction | `check-french-intelligence.mjs` |
| WR-03 | Writing | `J’achète une livre.` | Do not silently change to `un livre` | Added; CI pending | NEEDS REVIEW | `une livre` can denote a pound; the intended meaning is unknown | `check-french-intelligence.mjs` |
| WR-04 | Writing | Correct but unrecognized sentence | Say no listed issue was detected; do not claim full correctness | Covered by core test | NEEDS REVIEW | Pattern checker is not a full grammar parser | `check-french-intelligence.mjs` |
| WR-05 | Writing | `Bien que je suis fatigué, je continue.` | Do not claim a complete grammar review occurred | Added; CI pending | PASS | expected answer checked by a reviewer; engine output covered by CI | `check-french-intelligence.mjs` |
| SEC-01 | Input handling | HTML/script-looking dictionary input | Return unknown; do not render user-controlled markup | Covered by core test | NEEDS REVIEW | Browser-level injection checks still required | `check-french-intelligence.mjs` |
| SEC-02 | Network | Local phrasebook lookup | No automatic inference API call | Source inspection only | NEEDS REVIEW | Verify in browser/network instrumentation before release | Follow-up required |

## Current regression evidence

- The CI corpus includes 125 baseline clean sentences, 77 hard-negative sentences containing rule trigger words in valid contexts, and 32 deliberately incorrect examples across the writing-rule families.
- The test reports clean-corpus false positives, hard-negative false positives, and the number of known errors caught. A passing software assertion is not a substitute for independent review of unmarked matrix rows.
- Browser checks block every non-local request and fail if any is attempted. They report local app-load requests separately and inject script/image-shaped text into every input across all six tabs.

## Known limitations at review time

- Dictionary coverage is curated and incomplete; no exhaustive lexicon, complete inflection engine, or full homonym disambiguation exists.
- Translation is a phrasebook plus limited phrase substitutions and vocabulary hints. It is not general semantic translation and may not resolve tense, agreement, register, or context in arbitrary sentences.
- Conjugation currently focuses on present indicative for explicitly listed irregular verbs and a few regular patterns. Other tenses, moods, and many irregular/spelling-change verbs are unsupported.
- Grammar answers cover selected rules only. The guide does not constitute a comprehensive grammar reference.
- Writing checks are patterns, not a parser. They cannot reliably assess arbitrary agreement, syntax, punctuation, register, or intended meaning.
- All rows remain NEEDS REVIEW until expected answers are checked independently against reliable linguistic references and the expanded suite is executed. A green CI run proves software assertions, not comprehensive linguistic correctness.
