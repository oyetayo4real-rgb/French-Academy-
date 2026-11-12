# Dictionary Stage A — generated dataset record

Stage A contains **3,000 imported French lemmas**. The builder selects Lexique 3.83 lemmas by combined lemma frequency (`freqlemfilms2 + freqlemlivres`), filters to nouns, verbs, adjectives and adverbs, excludes existing built-in headwords, proper names and abbreviations, and requires a matching French entry with usable English glosses from the kaikki.org extract of English Wiktionary.

## Sources and provenance

- **Lexique 3.83** — TSV: https://www.lexique.org/databases/Lexique383/Lexique383.tsv
  - File date recorded by the distribution: 2019-06-04
  - Download size: 25,850,780 bytes
  - SHA-256: `637ba37a767a66679c48371d673ece50cbf541b49a4e40e598963d4f3fbce52b`
  - Licence: CC BY-SA 4.0
- **kaikki.org French extract of English Wiktionary** — JSONL: https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl
  - Wiktionary dump date: 2026-10-01
  - Extract date: 2026-10-30
  - Download size: 592,920,809 bytes
  - SHA-256: `9053b1845fb3e045fa1fbe3f749122fa43e21b49bfa741cadd50255ae6ca0126`
  - Adapted content is distributed under CC BY-SA 4.0 with Wiktionary attribution and share-alike obligations.

The generated entries are marked `source: "wiktionary-en via kaikki.org"`, `status: "imported-unreviewed"`, and `hint: false`. Up to three cleaned English glosses are retained, each at most 90 characters. Restricted senses are omitted when an unrestricted sense exists; when only a restricted sense exists, its register tag is retained for display. Gender and feminine/plural forms are taken from Wiktionary tags or Lexique where available. No example sentences are imported.

## Final build result

- Workflow: [Dictionary build run #43210170689](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/43210170689)
- Conclusion: success
- Entries: 3,000
- POS distribution: 1,683 nouns; 819 verbs; 394 adjectives; 104 adverbs
- Raw JSON: 2,837,474 bytes
- Gzipped JSON: 242,720 bytes
- Dictionary compressed-size gate: below 400 KB

The generated data and metadata are `data/dictionary/common-3000.json` and `data/dictionary/common-3000.meta.json`. Pinned source hashes and extraction dates are recorded in `tools/dictionary/sources.lock.json`.

This note records provenance and generation counts; it does not mark imported entries as linguistically reviewed. Stage 2 integration and acceptance checks remain separate.

## Push-gated workflow verification

On 2026-11-12, the Stage A workflow ran from the `feat/dictionary-stage-a` push gate and completed successfully (GitHub Actions run [#43210170689](https://github.com/oyetayo4real-rgb/French-Academy-/actions/runs/43210170689)). Both pinned source downloads returned HTTP 200; the JSONL endpoint was used, so the `.json` fallback was not needed. The workflow generated commit `4ec5e60f253428b2ddc145fa439be171760d8af7` with only the two files under `data/dictionary/`; the source lock already matched the downloaded SHA-256 values and was unchanged.

The push trigger requires the exact `[build-dictionary]` marker in the head commit message. The workflow-generated commit message deliberately omits that marker, preventing a build loop.
