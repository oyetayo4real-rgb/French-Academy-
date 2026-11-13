# Third-party data notice: Lexique

Parts of the French vocabulary data in this project are adapted from **Lexique**, version 3.83.

- **Creators:** Boris New and Christophe Pallier (with contributors listed by the Lexique project)
- **Source:** https://www.lexique.org/
- **Licence:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- **Licence text:** https://creativecommons.org/licenses/by-sa/4.0/legalcode

## Lexique-derived data files

- `data/dictionary/common-3000.json` — selected headwords and parts of speech.
- `tools/dictionary/build-only/lexique-frequency.json` — build-only, per-headword and per-part-of-speech frequency rows used to independently validate primary-POS selection. This audit file is derived from Lexique 3.83 and is distributed under CC BY-SA 4.0. It is excluded from deployed learner assets by `.vercelignore`.

Other Lexique-derived fields in this project include gender and verb forms used to cross-check conjugation. The frequency audit is a build/validation artifact, not learner-facing content.

## Changes made

The data was filtered to a pilot subset, selected by frequency, and reduced to the fields this project needs. It is combined with English glosses and example sentences written for this project. Entries are marked in the project data as Lexique-derived. Classification codes and frequency figures are not shown to learners.

## What this means

- Credit to the Lexique authors is shown in the app's Credits section.
- Data adapted from Lexique stays under CC BY-SA 4.0. If you share that adapted data, you must give the same credit, link to the licence, say that changes were made, and share it under the same licence.
- The licence applies to the adapted vocabulary data, not automatically to the rest of the application code. Keep Lexique-derived entries and audit files in clearly labelled data files.

## Citation

New, B., Pallier, C., Brysbaert, M., & Ferrand, L. (2004). Lexique 2: A new French lexical database. *Behavior Research Methods, Instruments, & Computers, 36*(3), 516–524.

New, B., Pallier, C., Ferrand, L., & Matos, R. (2001). Une base de données lexicales du français contemporain sur internet: LEXIQUE. *L'Année Psychologique, 101*(3), 447–462.
