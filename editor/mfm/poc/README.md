# POC — mesure de couverture de la matrice nom↔id MFM

Deux scripts de mesure (lecture seule, aucune écriture bdd) qui étayent
`editor/MFM_CI_PROPOSAL.md` :

- `coverage-by-file.cjs` — match naïf MFM ↔ un seul fichier `.cat` par faction.
  Résultat : **52 %**. Montre l'ampleur du trou d'import.
- `coverage-parsed.mjs` — match MFM ↔ données **parsées par l'app** (imports
  résolus, `scripts/bsdata-parser.mjs` de cogitator-bellicum). Résultat :
  **98 %**, résidu 28 noms → `aliases.json`.

Les deux prennent en dur : le dump MFM JSON (`en/json/<slug>.json`) et le
chemin de la bdd. Adapter les constantes en tête de fichier au besoin.
coverage-parsed.mjs importe le parseur de l'app (cogitator-bellicum) — il
sert de référence d'implémentation pour `build-map.mjs` (P1 de la proposition).
