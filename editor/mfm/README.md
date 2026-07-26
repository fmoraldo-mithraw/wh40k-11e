# editor/mfm — intégration continue des points MFM

Chaîne outillée qui applique **automatiquement** les changements de points d'un
nouveau Munitorum Field Manual à la bdd `.cat`, avec relecture humaine réduite
au strict résidu. Conception : `editor/MFM_CI_PROPOSAL.md`.

## Phases

- **Phase 1 — `build-map.mjs`** *(livré)* : construit la **matrice nom↔id** par
  faction. Chaque nom MFM est apparié à une datasheet **parsée** (clôture
  d'import résolue → 99,3 % auto, résidu couvert par `aliases.json`), puis on
  relit sur la bdd ses coûts actuels **et toutes ses options d'armes/wargear
  porteuses de coût** (id + pts), pour qu'un futur surcoût par arme soit
  adressable sans re-recherche. Sortie : `map/<slug>.json`.
- **Phase 2 — `apply.mjs`** *(livré, dry-run)* : compare points MFM ↔ points
  bdd (via la matrice) et imprime les **deltas** à appliquer. N'écrit rien.
- **Phase 3** *(à venir)* : écriture réelle via `editor/lib/catalog.js`
  (`editUnit` costs/tiers, repeat-cost, enhancements) + gauntlet + PR.

## Usage

```sh
# 1) obtenir un dump MFM JSON (mfm_dump.py → <lang>/json/<slug>.json)
# 2) (re)construire les matrices — LECTURE SEULE
node editor/mfm/build-map.mjs <dir-json-mfm> [slug]
# 3) voir les deltas à appliquer — LECTURE SEULE
node editor/mfm/apply.mjs <dir-json-mfm> [slug] [--changed-only]
```

## Garde-fous (« ne rien insérer de douteux »)

Une valeur n'est proposée à l'écriture QUE si toutes ces conditions tiennent ;
sinon la ligne part en **REVIEW** (manuel), jamais en delta appliquable :

- coût MFM = entier fini `0 < p ≤ 3000` ; delta `|Δ| ≤ 200` ;
- le bsId retombe bien sur un nœud bdd avec un coût du type attendu ;
- **coût bdd 0/absent + MFM > 0** → coût probablement **porté par les modèles**
  (Ironstrider, Mek Gunz, Firestrike, Lokhust…) → manuel, jamais écrit sur
  l'entrée unité ;
- **datasheet partagée à prix divergent entre factions** → coût **spécifique de
  chapitre** (Repulsor Executioner 255 SM vs 230 chapitres) : détecté par une
  pré-passe cross-faction sur le bsId, encodé par modifier `primary-catalogue`
  (voir `MARINE_CHAPTER_COST_APP_PROMPT.md`), jamais par écriture brute qui
  écraserait les autres factions ;
- **unités à composition** (Gretchin « 1 Runtherd, 20 Gretchin », Outrider,
  Tidewall…) et **dual-cost Agents** (chaque unité listée 2×) → détectés et
  exclus de l'auto.

Les écritures partagées (même bsId vu depuis plusieurs chapitres) sont
**dédupliquées** : un seul delta émis, appliqué une fois.

## Fichiers

- `build-map.mjs`, `apply.mjs` — les deux phases.
- `aliases.json` — résidu nom MFM → datasheet(s) bdd (nom cat, bsId, ou tableau
  pour un nom générique couvrant plusieurs datasheets, ex. `SOUL GRINDER` → 4
  variantes de dieu). Fusionné avant l'auto-match ; revérifié à chaque build.
- `map/<slug>.json` — matrices générées (commitées : leur diff montre d'un coup
  les datasheets ajoutées/retirées entre deux MFM). Champs : `matched`
  (targets[] avec `current` + `weaponOptions`), `unmapped`, `orphans`, `errors`,
  `enhancements`, `enhUnmapped`.
- `poc/` — scripts de mesure de couverture (52 % par fichier vs 98/99 % parsé).
