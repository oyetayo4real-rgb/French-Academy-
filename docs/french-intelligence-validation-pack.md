# French Intelligence Engine — Linguistic Validation Pack

Branch baseline reviewed: `feat/french-intelligence-engine`
Baseline SHA: `53f7cfaf50b239462b3742725088ef8d08bd3b33`
Related PR: [#12](https://github.com/oyetayo4real-rgb/French-Academy-/pull/12) (open, Draft, unmerged)
Baseline CI run: [39519564666](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/39519564666) — success for syntax/integration and desktop/mobile Chromium.
This report is an audit aid; it does not claim a human French-teacher sign-off.

## What was verified directly from repository files

- The existing script defines 37 `knownErrors`, 82 `hardNegativeSentences`, and 125 `cleanSentenceCorpus` samples.
- Its current assertions require zero output entries containing “Suggested text” for the clean and hard-negative corpora, and require every known error to produce either its expected substring or a message-only grammar note.
- The known-error assertion checks output strings, not independent linguistic correctness, exact full corrected sentences, or explanation accuracy. The counts are reproducible regression evidence, not a 100%-accuracy claim.
- The writing rules are regex-based and explicitly warn that absence of a match does not prove a sentence is correct.
- The current linguistic matrix still includes stale “Added; CI pending” labels even though the listed baseline run succeeded. All language-level verdicts should remain “NEEDS REVIEW” until every item has a source and a qualified reviewer sign-off.
- PR #12 remains open and Draft; no deployment or merge was performed during this audit.

## Source-backed rule checks

| Feature / case | Language finding | Recommended expected behaviour | Source |
|---|---|---|---|
| `Bien que je suis fatigué` | `bien que` introduces a concessive clause followed by the subjunctive, or a participle/adjective construction. | Correct to `Bien que je sois fatigué, ...`; explain the mood, not just the replacement token. | [Académie française: Laurence D.](https://www.academie-francaise.fr/laurence-d-france) |
| `Bien qu'il a tort`, `Bien que nous avons faim`, `Bien que vous êtes prêts`, `Bien qu'ils sont fatigués` | The trigger is substantiated; the required form must also match subject and verb: `ait`, `ayons`, `soyez`, `soient`. | Keep these as positive regressions, but assert the full clause/output with preserved agreement. | [Académie française: Laurence D.](https://www.academie-francaise.fr/laurence-d-france) |
| `Pour que ...` | Purpose clause `pour que` requires subjunctive; negation belongs inside the subordinate clause. | Validate each person and conjugation; avoid replacing the wrong verb when an infinitive follows. | [Académie française: Pour pas que…](https://www.academie-francaise.fr/pour-pas-que-au-lieu-de-pour-que-ne-pas) |
| `Après que ...` | The Academy’s language FAQ specifies the indicative for the subordinate clause introduced by `après que`. | Preserve the indicative and keep these sentences in the no-flag corpus for this particular rule. | [Académie française: Questions de langue](https://www.academie-francaise.fr/questions-de-langue) |
| Past participle agreement | With `avoir`, the participle normally agrees with a preceding direct object; if the direct object follows or is absent, it does not agree. Special cases (notably `fait + infinitive`) exist. | Add separate targeted tests; do not implement a broad agreement rewrite with a simple regex. | [Académie française dictionary: Participe passé](https://www.dictionnaire-academie.fr/article/QDL063); [fait + infinitive](https://www.dictionnaire-academie.fr/article/DNP0145) |
| `ça` vs `sa` | `sa` is possessive before a noun (`sa mère`, `sa valise`); `ça va` is a demonstrative expression. Context decides, not a blanket string substitution. | Keep `Sa vache...`, `Sa valise...`, `Sa vaisselle...`, `Sa mère...` as no-flag adversarial examples; only target `sa va` when the context actually forms the expression. | [Académie française dictionary: Ça a été / Ç’a été](https://www.dictionnaire-academie.fr/article/DNP0881) |
| Punctuation | A comma can change meaning; a comma between subject and verb is ordinarily faulty, while other comma use depends on syntax and intended meaning. | Add precise tests for punctuation that the checker claims to support; do not flag style variants as grammar errors without context. | [Académie française dictionary: Virgule](https://www.dictionnaire-academie.fr/article/A9V0914) |
| Subject–verb agreement | Agreement is normally with person and number of the subject, but some collective constructions allow choices based on meaning. | Add simple unambiguous cases first, then mark collective/semantic agreement cases as context-sensitive. | [Académie française dictionary: Accorder](https://www.dictionnaire-academie.fr/article/A9A0283) |

## Validation gaps to fix before Phase 2

1. Convert every known error to a structured case: input, expected full correction or message-only outcome, rule ID, explanation assertion, reference URL, confidence, and notes on variants.
2. Change positive tests from “substring appears” to exact normalized full-output comparisons or directly expose a structured analysis API and compare its structured result.
3. Test corrections for punctuation, capitalization, accents, curly/straight apostrophes, multiple occurrences, boundaries inside longer words, and sentences containing quoted trigger phrases.
4. Expand independently reviewed datasets by category, not merely by quantity:
   - spelling/diacritics;
   - present-tense conjugation and irregular forms;
   - adjective, subject–verb, and past-participle agreement;
   - syntax and governed mood/prepositions;
   - punctuation in unambiguous contexts;
   - semantic ambiguity and acceptable variants.
5. For meaning/context, the safe default is no automatic correction where multiple interpretations are plausible (for example `une livre`, `sa` before a noun, or constructions dependent on intended meaning).
6. Give every proposed correction an authority/source and a review status: `machine-regression-tested`, `source-checked`, `teacher-reviewed`. Do not collapse these into one “verified” status.
7. Re-run CI after code changes. Only mark browser/CI statuses according to the latest run; keep linguistic review pending until a competent reviewer signs off.

## Proposed categorized evaluation additions

The following are candidate cases for the next test-corpus PR. Expected forms are grounded in the linked rules above where noted; more complex usage should be marked for human adjudication.

### Spelling and diacritics
- Error: `Je vous remercie pour votre reponse.` → `réponse` (accent restoration should preserve the rest of the sentence).
- No-flag: `Je relis sa réponse.` (`sa` is possessive; do not turn it into `ça`).
- Error: `Bonjour, merçi !` → `Bonjour, merci !` (known spelling convention; rule is narrow).

### Conjugation
- Error: `Bien qu'il a tort, il insiste.` → `Bien qu'il ait tort, il insiste.`
- Error: `Bien que nous avons faim, nous attendons.` → `Bien que nous ayons faim, nous attendons.`
- Error: `Bien qu'ils sont fatigués, ils continuent.` → `Bien qu'ils soient fatigués, ils continuent.`
- No-flag: `Après qu'il est arrivé, nous avons commencé.` (indicative after `après que`, per the Academy).

### Agreement
- Error: `Les crêpes qu'elle a mangé sont froides.` → `Les crêpes qu'elle a mangées sont froides.` ([Academy past participle rule](https://www.dictionnaire-academie.fr/article/QDL063)).
- Error: `Elles sont arrivé hier.` → `Elles sont arrivées hier.` (simple `être` agreement; source-check the output in implementation review).
- No-flag / special-case: `La maison qu'il a fait bâtir est ancienne.` (`fait` remains invariable before an infinitive, per [Academy](https://www.dictionnaire-academie.fr/article/DNP0145)).

### Syntax and governed mood
- Error: `Bien que je suis prêt, je reste.` → `Bien que je sois prêt, je reste.`
- No-flag: `Bien que très fatigué, il continue.` (the Academy accepts the ellipted adjective construction).
- No-flag: `Après que le train est arrivé, les voyageurs sont descendus.`

### Punctuation
- Candidate error: `Les enfants, jouent dans le parc.` → `Les enfants jouent dans le parc.` (comma between simple subject and verb is ordinarily faulty; [Academy punctuation reference](https://www.dictionnaire-academie.fr/article/A9V0914)).
- No-flag: `Naturellement, il est inquiet.` (the Academy gives this as a valid comma example).
- Context-sensitive: `Puisque je l'ai promis hier, je suis allé le voir.` versus `Puisque je l'ai promis, hier je suis allé le voir.` (comma placement changes attachment/meaning; do not treat every alternative as a binary error).

### Meaning / semantic ambiguity (must not auto-correct without context)
- No-flag: `J'achète une livre de beurre.` (weight unit; `livre` must not be blindly corrected to `livre` masculine).
- No-flag: `Sa mère va bien.` (`sa` is valid possessive determiner).
- No-flag: `Je parle le français à l'école.` (the existing matrix intentionally treats article use as context-sensitive).
- No-flag: `Je sais que tu es prêt, et je veux que tout soit terminé.` (contains multiple `que` clauses with different moods; trigger-word scanning must not overgeneralize).

## Regression counts at the reviewed baseline

- Clean corpus declared: 125
- Hard-negative corpus declared: 82
- Known-error corpus declared: 37
- CI run #39519564666: successful syntax/integration and desktop/mobile Chromium job
- Linguistic reference review performed in this audit: the cited rules and candidate examples above
- Human teacher sign-off: **pending**
- Production release approval: **not granted**
