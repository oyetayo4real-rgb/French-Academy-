# Linguistic source audit — French Intelligence Engine

Status: **OPEN — not approved for product integration**  
Scope: Phase 2 alpha rules in `features/french-reasoning-v2.js`; related Phase 1 review is tracked separately.  
Last preliminary source check: 2026-10-21.

## Evidence standard

A reference counts as verified only when the page directly supports the exact grammatical or lexical claim made by the rule. A URL that merely concerns the same general topic is not enough. A test passing proves code behavior, not linguistic correctness. No qualified French-teacher review has yet been recorded.

## Rule-by-rule audit register

| Rule | Claim / behavior | Current source state | Required action before approval |
|---|---|---|---|
| SP-001 | `merçi` → `merci` | No direct source currently attached to rule | Add a direct authoritative lexical entry; verify capitalization and punctuation cases |
| SP-002 | `beacoup` → `beaucoup` | Direct official lexical entry checked: [beaucoup, Académie française](https://www.dictionnaire-academie.fr/article/A9B0705) uses the standard form « beaucoup » | Rule now links this entry; teacher still must review test and explanation |
| SP-003 | `reponse` → `réponse` | Direct official lexical entry checked: [réponse, Académie française](https://www.dictionnaire-academie.fr/article/A9R1901) uses the standard accented form | Rule now links this entry; teacher still must review accent and explanation |
| SP-004 | `bonjor` → `bonjour` | No direct source currently attached to rule | Add direct authoritative lexical entry; verify capitalization and punctuation cases |
| WR-001 | `je suis 20 ans` → `j'ai 20 ans` | No direct source attached | Add a direct reference for age expressions; teacher to check number formatting and register |
| WR-002 | `je suis faim` → `j'ai faim` | Direct official lexical entry checked: [faim, Académie française](https://www.dictionnaire-academie.fr/article/A9F0107) explicitly gives « avoir faim » | Rule now links this entry; teacher still must review scope and wording |
| WR-003 | `je suis soif` → `j'ai soif` | Direct official lexical entry checked: [soif, Académie française](https://www.dictionnaire-academie.fr/article/A9S1939) explicitly gives « avoir soif » | Rule now links this entry; teacher still must review scope and wording |
| WR-004 | `sa va` → `ça va` | Current code points to [DNP0881](https://www.dictionnaire-academie.fr/article/DNP0881), but the precise support for this contrast has not yet been confirmed | Confirm the cited page directly supports the claim or replace it with direct entries for `sa` and `ça`; retain hard negatives such as « sa valise » |
| WR-005 | repeated `pas` in the exact phrase | No direct source attached; this is a narrow heuristic | Source-check and teacher-review. Keep exact-match scope; do not generalize to every repeated `pas` construction |
| GR-001 | `bien qu'il a` → `bien qu'il ait` | Candidate official source: [Académie française on « bien que »](https://www.academie-francaise.fr/laurence-d-france) says a concessive clause introduced by « bien que » takes the subjunctive or participle | Teacher to verify all subject/person forms and edge cases |
| GR-002 | `bien que j'ai` → `bien que j'aie` | Same candidate source as GR-001 | Teacher to verify elision/apostrophe and exact correction |
| GR-003 | `bien que nous avons` → `bien que nous ayons` | Same candidate source as GR-001 | Teacher to verify |
| GR-004 | `bien que vous êtes` → `bien que vous soyez` | Same candidate source as GR-001 | Teacher to verify agreement in « prêts » and broader subject agreement |
| GR-005 | `bien qu'ils sont` → `bien qu'ils soient` | Same candidate source as GR-001 | Teacher to verify |
| GR-006 | `bien que/pour que… aller + infinitive` → grammar note, no rewrite | Current code uses [Académie française: « pour que… ne pas »](https://www.academie-francaise.fr/pour-pas-que-au-lieu-de-pour-que-ne-pas); exact support for the full `aller + infinitive` diagnostic has not been established | Treat source as candidate only; teacher must validate trigger coverage and the example. Do not auto-correct |
| AG-001 | `elles sont arrivé` → `elles sont arrivées` | Current code points to [Dictionnaire de l’Académie française, QDL063](https://www.dictionnaire-academie.fr/article/QDL063); exact passage has not yet been confirmed against this rule | Verify page content and have teacher review scope |
| AG-002 | `les crêpes qu'elle a mangé` → `les crêpes qu'elle a mangées` | Same candidate source as AG-001; exact passage not yet confirmed | Verify rule for preceding direct object and teacher review |
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

This is an audit register and preliminary source check, **not a completed validation report**. Several source links are candidates whose exact passages remain to be checked, some rules have no direct source, and qualified teacher review is pending.
