# Dictionary Stage A — Quality Contract

This contract records the Stage A learner-facing quality rules and the 30-word must-have build gate. The POS column is intentional: Lexique continues to determine each imported headword's primary POS, while secondary POS meanings remain in separate groups.

| # | Headword | POS group | Required first meaning |
|---:|---|---|---|
| 1 | retourner | verb | to return |
| 2 | nouveau | adjective | new |
| 3 | jeter | verb | to throw |
| 4 | minute | noun | minute |
| 5 | plein | adjective | full |
| 6 | souvenir | noun | memory |
| 7 | même | adverb | even |
| 8 | cent | numeral | hundred |
| 9 | chéri | noun | darling |
| 10 | cuire | verb | to cook |
| 11 | là | adverb | there |
| 12 | peu | adverb | little |
| 13 | part | noun | share |
| 14 | poser | verb | put down |
| 15 | longtemps | adverb | for a long time |
| 16 | gros | adjective | big |
| 17 | mois | noun | month |
| 18 | problème | noun | problem |
| 19 | long | adjective | long |
| 20 | frère | noun | brother |
| 21 | lever | verb | raise |
| 22 | montrer | verb | show |
| 23 | peine | noun | punishment |
| 24 | servir | verb | serve |
| 25 | garder | verb | keep |
| 26 | quitter | verb | leave |
| 27 | occuper | verb | occupy |
| 28 | tourner | verb | turn |
| 29 | mettre | verb | put (immutable built-in) |
| 30 | payer | verb | pay |

## Build invariants

- The builder fails if any required imported headword or POS group is missing, or if its first group meaning does not match the required meaning. The immutable built-in `mettre` is checked separately and must never be imported as a duplicate.
- Maximum 3 meanings per POS group, 5 meanings across all POS groups per entry, and 70 characters per meaning. Reject overlong glosses; never truncate them.
- Deduplicate glosses case-insensitively and by token-set similarity.
- Prefer neutral meanings. Use slang, colloquial, familiar, figurative, regional, nautical, dated, rare, obsolete, archaic, vulgar, offensive, derogatory or informal senses only when fewer than two neutral meanings remain. Neutral meanings must precede any fallback.
- Keep curation notes in generated metadata as `curationNote`; never render the note or internal wording in learner-facing HTML. Render only the generic “Curated draft · needs French-speaker review” notice.
- Verbs show “See the Conjugate tool for forms.” Only nouns and adjectives may display tagged feminine/plural forms, restricted to letters, hyphens and apostrophes.
- `retourner` root cause: the first selected Wiktionary verb record is transitive and omits the common return/go-back sense. The POS-specific curated override restores that learner meaning without changing Lexique's primary-POS ranking.
- The build workflow regenerates a phone-friendly top-300 review pack in 25-entry batches and stages both `docs/dictionary-review-top300.md` and `docs/dictionary-review-top300.csv` in the bot-generated commit.


## Verified build execution

- Build trigger commit: \`9938aef3202ec72a97b778e674bcabd7f7089456\`.
- GitHub Actions Dictionary build: run \`43685977540\` — success.
- Generated-data bot commit: \`def6eca7097a9e2ac3f95d29359a65508364c956\`.
- Generated data: schemaVersion 3, 3,000 entries, 13 curated overrides with stored curation notes.
- The builder's 30-word POS-group first-meaning gate passed; 29 imported entries passed and \`mettre\` passed as the immutable built-in.
- Validator passed. Independent post-build inspection found zero entries violating the 3-per-POS, 5-per-entry, or 70-character limits.
- Quality counters: 702 near-duplicate senses removed; 1,076 low-register senses skipped; 1,671 overlong glosses rejected; 404 form-only senses removed; 320 entries with secondary POS groups.
- Review pack generated: 300 Markdown entries in 12 batches, plus a 300-row CSV and header. Both files are present in the bot commit.
- No golden or checksum files were changed. The final pull-request golden and characterization workflows remain the authority for final parity.
