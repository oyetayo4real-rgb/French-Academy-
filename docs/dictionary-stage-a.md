# Dictionary Stage A — generated dataset record

Stage A contains **3,000 imported French lemmas**. The builder ranks Lexique 3.83 lemmas by combined lemma frequency ('freqlemfilms2 + freqlemlivres'), selects the highest-frequency primary POS, and retains common alternate POS in the notes field. Only the first French kaikki entry for each headword/POS is used; later same-POS homograph/etymology entries are not merged.

## Quality rules

- Form-only glosses (inflection, plural, feminine, masculine, form, participle, alternative form, nonstandard/obsolete/misspelling/superseded spelling) are removed; entries with no usable meaning are skipped.
- Nonstandard spelling-only headwords such as 'oeil' and 'coeur' are excluded; lookup falls through to built-in 'œil' and 'cœur'.
- Hierarchical senses prefer the child gloss; descriptive parent glosses are removed when they do not translate the word.
- Register tags are retained and shown before each meaning, including slang, colloquial, familiar, vulgar, offensive, derogatory, informal, literary, archaic, dated and rare.
- Seven owner-provided overrides are marked 'curated-draft' with a reason: 'même', 'cent', 'véritable', 'là', 'chéri', 'peu', 'cuire'.
- Common alternate POS are grouped in the notes field; 'peu' is presented primarily as an adverb, with noun meanings retained in notes.

## Sources and provenance

- **Lexique 3.83** — TSV: https://www.lexique.org/databases/Lexique383/Lexique383.tsv
  - Download size: 25,850,780 bytes
  - SHA-256: '637ba37a767a66679c48371d673ece50cbf541b49a4e40e598963d4f3fbce52b'
  - Licence: CC BY-SA 4.0
- **kaikki.org French extract of English Wiktionary** — JSONL: https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl
  - Dump date: 2026-10-01; extract date: 2026-10-30
  - Download size: 592,920,809 bytes
  - SHA-256: '9053b1845fb3e045fa1fbe3f749122fa43e21b49bfa741cadd50255ae6ca0126'
  - Adapted content is distributed under CC BY-SA 4.0 with Wiktionary attribution and share-alike obligations.

## Final rebuild

- Workflow: [Dictionary build run #43328868828](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/43328868828)
- Generated-data commit: '83224717451726e4a40c9f45312ebfe9a330b824'
- Entries: 3,000
- POS distribution: 1,678 nouns; 824 verbs; 393 adjectives; 105 adverbs
- Entries with gender: 1,678
- Meanings per entry: 1 = 1,080; 2 = 824; 3 = 1,096
- Raw JSON: 4,693,988 bytes
- Gzipped JSON: 314,296 bytes
- Service-worker cache version is bumped to 'fa-v37' in the final integration commit; the dictionary JSON remains in the precache.

## Build quality counters

- Later same-POS Kaikki records ignored: 1,026
- Form-only senses dropped: 421
- Entries with no usable senses skipped: 411
- Variant-only entries skipped: 26
- Parent-to-child gloss resolutions: 7
- Descriptive-only glosses dropped: 22
- Entries with register-labelled senses: 279 (344 labelled senses)
- Alternate-POS groups: 314 entries; 331 alternate-POS groups
- Curated-draft overrides applied: 7

The 300 highest-frequency entries are listed in [Dictionary review — top 300](dictionary-review-top300.md) for French-speaker validation.

This data is imported and remains unreviewed except for the explicitly marked curated drafts. No example sentences are imported.
