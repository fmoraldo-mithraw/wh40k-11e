# editor/mfm — intégration continue des points MFM

Chaîne outillée qui applique **automatiquement** les changements de points d'un
nouveau Munitorum Field Manual à la bdd `.cat`, avec relecture humaine réduite
au strict résidu. Conception : `editor/MFM_CI_PROPOSAL.md`.

## Où vit quoi (et comment les modifications sont faites)

**Tout l'outillage MFM est dans CE dépôt** (`wh40k-11e/editor/mfm/`) :
`mfm_parser.py`/`mfm_dump.py` (extraction), `build-map.mjs`, `apply.mjs`,
`run.sh`, `aliases.json`, `map/`.

**Les écritures en base se font dans ce dépôt**, via `editor/lib/catalog.js`
(`editUnit` costs/tiers, helpers repeat-cost) — jamais de `sed`, jamais de
dépendance externe pour modifier les `.cat`.

**Unique dépendance hors dépôt, en LECTURE SEULE** : `build-map.mjs` importe le
parser de l'app cogitator-bellicum (`scripts/bsdata-parser.mjs`) *uniquement*
pour résoudre la **clôture d'import** (savoir quels datasheets un chapitre ou
une faction « importateur mince » possède réellement) et ainsi matcher les noms
MFM. Sans lui, un match par fichier ne couvre que ~52 % (cf. `poc/`). Ce parser
ne fait que LIRE ; il ne touche jamais aux données. Chemin configurable :
`BSDATA_PARSER=/chemin/bsdata-parser.mjs` ou `COGITATOR_DIR=/chemin/cogitator-bellicum`
(défaut : le dépôt frère `../cogitator-bellicum`).

Résumé du flux : **extraction** (python, ce dépôt) → **matrice** (build-map, ce
dépôt, lit la clôture d'import via le parser de l'app) → **diff** (apply, ce
dépôt) → **écriture** (Phase 3, ce dépôt, via `catalog.js`).

## Phases

- **Phase 1 — `build-map.mjs`** *(livré)* : construit la **matrice nom↔id** par
  faction. Chaque nom MFM est apparié à une datasheet **parsée** (clôture
  d'import résolue → 99,3 % auto, résidu couvert par `aliases.json`), puis on
  relit sur la bdd ses coûts actuels **et toutes ses options d'armes/wargear
  porteuses de coût** (id + pts), pour qu'un futur surcoût par arme soit
  adressable sans re-recherche. Sortie : `map/<slug>.json`.
- **Phase 2 — `apply.mjs`** *(livré, dry-run)* : compare points MFM ↔ points
  bdd (via la matrice) et imprime deux blocs :
  1. **DELTAS AUTO-APPLICABLES** — les changements sûrs (base/palier/répétition/
     amélioration à cible unique, non conflictuels) que la Phase 3 posera.
  2. **⚑ À ME RENVOYER** — tout ce qui n'a **pas** été traité automatiquement,
     **groupé par type d'action** avec l'instruction concrète de ce qu'il faut
     fournir : noms MFM sans datasheet (①), améliorations sans entrée (②), coûts
     de chapitre (③), coûts portés par les modèles (④), prix à composition avec
     barème (⑤), paliers non atteignables (⑥), etc. C'est **la liste à renvoyer**
     pour compléter l'intégration. N'écrit rien.

  Comparaison robuste aux idiomes d'encodage : le coût de base est le coût
  **effectif** (parser, résout les coûts imbriqués), les paliers sont comparés à
  l'**union des prix atteignables** (paliers du nœud ∪ paliers du parser ∪ base),
  donc un palier n'est signalé que si **aucun** encodage bdd ne le produit.
- **Phase 3** *(à venir)* : écriture réelle via `editor/lib/catalog.js`
  (`editUnit` costs/tiers, repeat-cost, enhancements) + gauntlet + PR.

## Usage

```sh
# TOUT EN UNE COMMANDE (recommandé) : GÉNÈRE le MFM (réseau), régénère les
# matrices, imprime le résumé (deltas auto + « à me renvoyer », détaillé dans
# editor/mfm/A_RENVOYER.md), puis propose de committer & pusher.
editor/mfm/run.sh                 # génère le MFM depuis le site puis tout le reste
editor/mfm/run.sh --lang fr       # autre langue (défaut: en)
editor/mfm/run.sh <dir-json-mfm>  # utilise un dump existant (hors-ligne, pas de réseau)

# étapes séparées (lecture seule) :
python3 editor/mfm/mfm_parser.py --lang en all -o editor/mfm/dump/en   # extraction
node    editor/mfm/build-map.mjs editor/mfm/dump/en [slug]             # matrices
node    editor/mfm/apply.mjs     editor/mfm/dump/en [slug] [--changed-only]  # diff
```

Prérequis pour la génération : `python3` + le module `requests`
(`pip install requests`). `run.sh` écrit la liste des modifications manquantes
dans `editor/mfm/A_RENVOYER.md` (gitignoré) — c'est le fichier à me renvoyer.
Le dump généré va dans `editor/mfm/dump/<lang>/` (gitignoré).

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

## Automatisation (cron serveur + cowork GitHub)

Deux versants, complémentaires :

1. **Cron serveur** — `cron-mfm.sh`, lancé toutes les heures : synchronise un
   clone dédié, régénère le dump depuis mfm.warhammer-community.com, le
   compare au dump commité (`dump/en/`). Identique → silence. Nouveau →
   dump + matrices + `A_RENVOYER.md` régénérés, commités et **poussés sur
   main** (matrices/rapport en best-effort : le dump part toujours, c'est le
   canal de transmission — le site MFM est inaccessible depuis
   l'environnement de l'agent).
2. **Cowork** — `COWORK_TASK.md` : la tâche d'intégration, exécutée en
   **cron par une session Claude/Cowork** (aucune clef API, aucun workflow
   GitHub). À chaque tick elle compare le hash d'arbre du dump sur
   origin/main au marqueur commité `state/integre.txt` : égaux → no-op
   silencieux ; différents → intégration complète (deltas via
   `editor/lib/catalog.js`, résidu, validation `editor/audit/valider.mjs`,
   marqueur mis à jour, push par faction, compte-rendu). Les crons de
   session étant éphémères (7 jours max, liés à la session), la relance
   tient en une phrase — voir « Lancer / relancer » dans `COWORK_TASK.md`.

Installation sur le serveur — **une commande** :

```sh
git clone git@github.com:fmoraldo-mithraw/wh40k-11e.git ~/wh40k-mfm/wh40k-11e \
  && ~/wh40k-mfm/wh40k-11e/editor/mfm/install-automation.sh
```

(Le clone initial est directement le clone dédié : l'installeur le détecte
et le synchronise — pas de second clone, rien en /tmp.)

L'installeur vérifie les prérequis (git, node ≥ 18, python3+requests,
crontab), pose les clones dédiés dans `~/wh40k-mfm/` (données + app en
lecture seule pour la clôture d'import), teste le droit de push, installe
l'entrée crontab horaire (minute aléatoire) et fait un premier passage de
validation. Journal : `~/.local/state/wh40k-mfm/cron.log`. Options :
`--dir`, `--lang`, `--schedule "<expr cron>"`, `--uninstall`.
