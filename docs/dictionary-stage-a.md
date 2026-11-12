# Dictionary Stage A — generated dataset record

Stage A contains 3,000 imported French lemmas. The builder selects Lexique 3.83 lemmas by combined lemma frequency (`freqlemfilms2 + freqlemlivres)), filters to nouns, verbs, adjectives and adverbs, excludes existing built-in headwords and requires a matching French entry with English glosses from the kaikki.org extract of English Wiktionary.

## Sources and provenance

- **Lexique 3.83** — TSV: https://www.lexique.org/databases/Lexique383/Lexique383.tsv
  - Extract/file date recorded by the distribution: 2019-06-04
  - SHA-256: `637ba37a767a66679c48371d673ece50cbf541b49a4e40e598963d4f3fbce52b`
  - Licence: CC BY-SA 4.0
- **kaikki.org French extract of English Wiktionary** — JSONL: https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl
  - Wiktionary dump date: 2026-10-01
  - Extract date: 2026-10-30
  - Downloaded file size: 592,920,809 bytes
  - SHA-256: `9053b1845fb3e045fa1fbe3f749122fa43e21b49bfa741cadd50255ae6ca0126`
  - Content is distributed under CC BY-SA 4.0 (with Wiktionary attribution and share-alike requirements).

The generated entries are marked `source: "wiktionary-en via kaikki.org"`, `status: "imported-unreviewed"`, and `hint: false`. Up to three cleaned English glosses are retained; no example sentences are imported. Feminine and plural forms are retained when found in Wiktionary or Lexique. Entries with a register restricted to obsolete, archaic, dated, rare, vulgar or offensive are retained only when no unrestricted sense exists, with source tags preserved for display.

## Build result

- Workflow: [Dictionary build run #43209012948](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/43209012948)
- Conclusion: success
- Entries: 3,000
- POS distribution: 1,683 nouns; 819 verbs; 394 adjectives; 104 adverbs
- Raw JSON: 2,837,138 bytes
- Gzipped JSON: 242,549 bytes
- Lexique TSV download: 25,850,780 bytes

The generated data and metadata live in `data/dictionary/common-3000.json` and `data/dictionary/common-3000.meta.json`. The pinned source hashes and extraction dates are recorded in `tools/dictionary/sources.lock.json`.

This note records provenance and build counts; it does not mark imported entries as linguistically reviewed. Stage 2 lookup/UI integration and full acceptance gates remain separate work.
