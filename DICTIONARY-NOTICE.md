# Imported French dictionary data notice

This application includes a 3,000-lemma French dictionary dataset derived from the French-language extract of English Wiktionary distributed by kaikki.org.

## Source and licence

- Source extract: https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl
- Source project: https://kaikki.org/dictionary/French/
- Upstream content: English Wiktionary, distributed under the Creative Commons Attribution-ShareAlike 4.0 International licence (CC BY-SA 4.0) and GFDL. This project distributes the adapted Wiktionary-derived dictionary under CC BY-SA 4.0.
- Dump date: 2026-10-01
- Extract date: 2026-10-30
- Licence: https://creativecommons.org/licenses/by-sa/4.0/

## Changes made

The extract was streamed and filtered to French entries whose part of speech is noun, verb, adjective or adverb. Lemmas were ranked using Lexique 3.83 combined lemma frequency (`freqlemfilms2 + freqlemlivres`); existing built-in headwords and proper names, abbreviations and non-target parts of speech were excluded.

For each selected lemma, up to three English glosses were retained, cleaned of templates, links and markup, and limited to 90 characters each. Obsolete, archaic, dated, rare, vulgar and offensive senses were omitted when an unrestricted sense was available; where only a restricted sense was available, its register tag is retained for display. Feminine and plural forms were retained when supplied by Wiktionary or Lexique. No example sentences were imported.

Every imported entry is marked `source: "wiktionary-en via kaikki.org"`, `status: "imported-unreviewed"` and `hint: false`. These entries are not used for English-to-French reverse matching, translation hints, question answering, writing correction or conjugation. They are presented as imported and not yet reviewed.

## Attribution and share-alike

Attribution is given to Wiktionary contributors and kaikki.org. This notice identifies the source, links to the CC BY-SA 4.0 licence, describes modifications and states the licence applied to the adapted dictionary. Redistributed adaptations of the Wiktionary-derived dictionary must retain appropriate attribution, link to the licence, identify changes, and be shared under CC BY-SA 4.0.

The licence applies to the adapted dictionary data, not automatically to unrelated application code. Lexique-derived frequency and lexical metadata remain separately attributed under the Lexique terms; see [LEXIQUE-NOTICE.md](./LEXIQUE-NOTICE.md).

## Reproducibility

Pinned source URLs, extraction dates and SHA-256 digests are recorded in [tools/dictionary/sources.lock.json](./tools/dictionary/sources.lock.json). Generated output and build statistics are recorded in [data/dictionary/common-3000.meta.json](./data/dictionary/common-3000.meta.json).
