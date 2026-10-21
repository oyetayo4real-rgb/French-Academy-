# Linguistic source audit — French Intelligence Engine

Status: **OPEN — not approved for product integration**  
Scope: Phase 2 alpha rules in `features/french-reasoning-v2.js`; related Phase 1 review is tracked separately.  
Last preliminary source check: 2026-10-21.

## Evidence standard

A reference counts as verified only when the page directly supports the exact grammatical or lexical claim made by the rule. A URL that merely concerns the same general topic is not enough. A test passing proves code behavior, not linguistic correctness. No qualified French-teacher review has yet been recorded.

## Rule-by-rule audit register

| Rule | Claim / behavior | Current source state | Required action before approval |
|---|---|---|---|
| SP-001 | `merçi` → `merci` | Direct official lexical entry checked: [merci, Académie française](https://www.dictionnaire-academie.fr/article/A9M1766) includes the standard spelling and the expression « merci beaucoup » | Rule now links this entry; teacher still must review scope and test variants |
| SP-002 | `beacoup` → `beaucoup` | Direct official lexical entry checked: [beaucoup, Académie française](https://www.dictionnaire-academie.fr/article/A9B0705) uses the standard form « beaucoup » | Rule now links this entry; teacher still must review test and explanation |
| SP-003 | `reponse` → `réponse` | Direct official lexical entry checked: [réponse, Académie française](https://www.dictionnaire-academie.fr/article/A9R1901) uses the standard accented form | Rule now links this entry; teacher still must review accent and explanation |
| SP-004 | `bonjor` → `bonjour` | Direct official lexical entry checked: [bonjour, Académie française](https://www.dictionnaire-academie.fr/article/A9B1554) gives the standard greeting « Bonjour, madame ! » | Rule now links this entry; teacher still must review capitalization and punctuation variants |
| WR-001 | `je suis 20 ans` → `j'ai 20 ans` | Direct official Académie française response: [avoir 40 ans](https://www.dictionnaire-academie.fr/article/QR_0319) explicitly says « On doit dire avoir 40 ans » | Rule now links this source; review number formatting and exact correction boundaries |
| WR-002 | `je suis faim` → `j'ai faim` | Direct official lexical entry checked: [faim, Académie française](https://www.dictionnaire-academie.fr/article/A9F0107) explicitly gives « avoir faim » | Rule now links this entry; teacher still must review scope and wording |
| WR-003 | `je suis soif` → `j'ai soif` | Direct official lexical entry checked: [soif, Académie française](https://www.dictionnaire-academie.fr/article/A9S1939) explicitly gives « avoir soif » | Rule now links this entry; teacher still must review scope and wording |
| WR-004 | `sa va` → `ça va` | Current code points to [DNP0881](https://www.dictionnaire-academie.fr/article/DNP0881), but the precise support for this contrast has not yet been confirmed | Confirm the cited page directly supports the claim or replace it with direct entries for `sa` and `ça`; retain hard negatives such as « sa valise » |
| WR-005 | repeated `pas` in the exact phrase | No direct source attached; this is a narrow heuristic | Source-check and teacher-review. Keep exact-match scope; do not generalize to every repeated `pas` construction |
| GR-001 | `bien qu'il a` → `bien qu'il ait` | Candidate official source: [Académie française on « bien que »](https://www.academie-francaise.fr/laurence-d-france) says a concessive clause introduced by « bien que » takes the subjunctive or participle | Teacher to verify all subject/person forms and edge cases |
| GR-002 | `bien que j'ai` → `bien que j'aie` | Same candidate source as GR-001 | Teacher to verify elision/apostrophe and exact correction |
| GR-003 | `bien que nous avons` → `bien que nous ayons` | Same candidate source as GR-001 | Teacher to verify |
| GR-004 | `bien que vous êtes` → `bien que vous soyez` | Same candidate source as GR-001 | Teacher to verify agreement in « prêts » and broader subject agreement |
| GR-005 | `bien qu'ils sont` → `bien qu'ils soient` | Same candidate source as GR-001 | Teacher to verify |
| GR-006 | `bien que/pour que… aller + infinitive` → grammar note, no rewrite | [Official dictionary entry for « pour »](https://www.dictionnaire-academie.fr/article/A9P3767) explicitly says « pour que » is followed by the subjunctive. This supports the mood trigger, but not every implementation detail of the `aller + infinitive` heuristic. | Source URL updated in code. Keep as a note-only heuristic; verify the trigger's boundaries and examples with further adversarial tests. Do not auto-correct |
| AG-001 | `elles sont arrivé` → `elles sont arrivées` | [Académie française, Questions de langue — Participe passé (accord)](https://www.academie-francaise.fr/questions-de-langue) explicitly gives « Elle est arrivée » and states that a past participle with « être » agrees like an adjective. | Code source now points to this direct grammar explanation; teacher review of rule scope remains pending. |
| AG-002 | `les crêpes qu'elle a mangé` → `les crêpes qu'elle a mangées` | [Académie française, Questions de langue — Participe passé (accord)](https://www.academie-francaise.fr/questions-de-langue) explicitly states that with « avoir », the past participle agrees with a preceding direct object and gives « les crêpes qu’elle a mangées ». | Code source now points to this direct grammar explanation; teacher review of rule scope remains pending. |
| PU-001 | remove comma between subject and verb in the exact sentence | Current code points to [A9V0914](https://www.dictionnaire-academie.fr/article/A9V0914); exact passage has not yet been confirmed | Verify direct support; teacher to check punctuation/context |

## Meaning and no-auto-correction cases

| Case | Current behavior | Review requirement |
|---|---|---|
| `J'achète une livre.` | `not_sure`; offers weight-unit vs book interpretations | Teacher to verify lexical gender/meaning and that the sentence context truly remains ambiguous |
| `Je parle le français à l'école.` | `not_sure`; avoids mandatory rewrite | Teacher to assess acceptability/register and ensure alternatives are not falsely framed as error |
| Hard negatives and no-flag corpus | Tests only assert that no automatic correction is applied | Expand with exact expected status, correction, findings, and explanation assertions; teacher to independently mark each example |

## Required next steps

1. Open each source and record the exact passage that supports each rule; replace irrelevant or indirect citations.
2. Add direct references to all currently unsourced rules, or disable their automatic corrections until sourced.
3. Expand tests to cover variants and exact full outputs, including punctuation, capitalization, apostrophe variants, valid counterexamples, regional/register cases, and false-positive boundaries.
4. Obtain a qualified French teacher's independent review. Record qualifications and decisions in the review issue, not as a self-certified approval.
5. Re-run existing regression tests and desktop/mobile Chromium after all linguistic changes.
6. Keep PRs #12 and #13 Draft. Do not integrate into the dictionary or AI Tutor until all gates pass.

## Current disposition

This is an audit register and preliminary source check, **not a completed validation report**. The official Académie française pages above directly support the core « bien que » subjunctive and participle-agreement claims, the « pour que » subjunctive trigger, and the lexical/age-expression rules now linked to direct entries. WR-004 (`sa va`) and WR-005 (repeated `pas`) still need direct source review; PU-001 still needs a source that directly supports the specific subject–verb punctuation claim. The full behavior of the narrow regex rules still requires adversarial review. Qualified teacher review has not been recorded, and this engineering review is not represented as independent teacher approval.
