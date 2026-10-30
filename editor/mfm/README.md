# editor/mfm — intégration continue des points MFM

Chaîne outillée qui applique **automatiquement** les changements de points d'un
nouveau Munitorum Field Manual à la bdd `.cat`, avec relecture humaine réduite
au strict résidu. Conception : `editor/MFM_CI_PROPOSAL.md`.

## Où vit quoi (et comment les modifications sont faites)

**Tout l'outillage MFM est dans CE dépôt** (`wh40k-11e/editor/mfm/`) :
`mfm_parser.py`/`mfm_dump.py` (extraction), `build-map.mjs`, `apply.mjs`,
`run.sh`, `pools.mjs` (slug MFM → factions de l'appli, résolution du parser),
`aliases.json`, `abandons.json`, `verifies.json`, `map/`.

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
(défaut : le dépôt frère `../cogitator-bellicum`, s'il a ses dépendances npm ;
résolution partagée avec `dp-audit.mjs` : `pools.mjs`). **Repli sans le dépôt de
l'app** : copie autonome commitée `vendor/bsdata-parser.mjs` (bundle esbuild,
aucune dépendance npm) — la routine cowork, qui n'a pas accès à
cogitator-bellicum, régénère donc les matrices sans blocage. Après une
modification du parser dans l'app : `editor/mfm/vendor/sync-parser.sh` puis
commit (`--check` : code 1 si la copie est périmée).

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
     pour compléter l'intégration. N'écrit rien. Les fiches d'`abandons.json`
     n'y figurent jamais en ① : elles sortent en fin de bloc en lignes
     « ℹ abandonné » (hors décompte) ; une fiche abandonnée de nouveau appariée
     en base y part en « ⚠ ABANDON CADUC ». Les ④ / ⑤ **déjà vérifiés conformes**
     (`verifies.json`, barème MFM inchangé) sortent de même en « ℹ déjà vérifié
     le … » (hors décompte).

  Comparaison robuste aux idiomes d'encodage : le coût de base est le coût
  **effectif** (parser, résout les coûts imbriqués), les paliers sont comparés à
  l'**union des prix atteignables** (paliers du nœud ∪ paliers du parser ∪ base),
  donc un palier n'est signalé que si **aucun** encodage bdd ne le produit.
- **Phase 3 — `phase3.mjs`** *(livré)* : écriture réelle via
  `editor/lib/catalog.js`. Reprend les décisions et les garde-fous d'`apply.mjs`
  et pose : coût de base (`editUnit` costs), paliers de taille (`editUnit`
  tiers), prix par répétition en **forme native** (modifier `increment` + condition
  `atLeast` `scope="roster"`, création comprise), points d'améliorations.
  Dry-run par défaut, `--write` pour écrire, `--slugs a,b` pour restreindre.
  Vérification : régénérer les matrices puis relancer `apply.mjs` — le bloc AUTO
  doit tomber à zéro.

## Octrois de LEADER / SUPPORT par amélioration — `enh-leaders.mjs`

Une ligne « LEADER: X » (FR « MENEUR : X ») ou « SUPPORT: X » (FR « APPUI : X »)
sous une amélioration du MFM est extraite par `mfm_parser.py` (champ `leader` /
`support` ; depuis la v1.6 GW l'imprime dans un `<li>` frère de l'amélioration,
avant dans un `<div>` — les deux sont lus, deux-points exigés) puis écrite en base
par `node editor/mfm/enh-leaders.mjs <dir-json-mfm> [--apply]` : groupe
`Can Lead (MFM)` / `Can Support (MFM)` sur l'amélioration (voir
`editor/LEADER_LINKS_APP_PROMPT.md`). État au 2026-10-27 : 13 octrois (12 LEADER +
Murdermind SUPPORT), tous en base.
Dry-run par défaut ; résout les noms via `map/` ; n'ajoute que les liens
manquants, signale les liens en trop et le résidu non résolu.

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
python3 editor/mfm/mfm_parser.py legends -o editor/mfm/legends.json    # noms des fiches LEGENDS (à part)
node    editor/mfm/build-map.mjs editor/mfm/dump/en [slug]             # matrices
node    editor/mfm/apply.mjs     editor/mfm/dump/en [slug] [--changed-only]  # diff
```

Prérequis pour la génération : `python3` + le module `requests`
(`pip install requests`). `run.sh` écrit la liste des modifications manquantes
dans `editor/mfm/A_RENVOYER.md` (**commité** : le rapport voyage par git avec les
matrices ; `cron-mfm.sh` le régénère de la même façon et y annexe ses audits) —
c'est le fichier à me renvoyer. Le dump généré va dans `editor/mfm/dump/<lang>/` :
`dump/en/*.json` est **commité** (canal de transmission vers l'agent
d'intégration, voir `.gitignore`), les autres langues restent locales.

## Garde-fous (« ne rien insérer de douteux »)

Une valeur n'est proposée à l'écriture QUE si toutes ces conditions tiennent ;
sinon la ligne part en **REVIEW** (manuel), jamais en delta appliquable :

- coût MFM = entier fini `0 < p ≤ 4000` (Warlord Titan : 3500) ; delta `|Δ| ≤ 200` ;
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
- `wpn-audit.mjs` — audit des surcoûts d'armes (« per <arme> = N pts »),
  hors périmètre d'apply : accepte les 5 formes réelles d'encodage (option
  nommée, paire de sponsons 2×N, option combinée, modèle-variante, coût sur
  l'entryLink) ; état courant : 103 conformes, 0 écart.
- `phase3.mjs` — écriture des deltas (Phase 3, ci-dessus).
- `dp-fix.mjs` — applique les écarts relevés par `dp-audit.mjs` (DP, Force
  Disposition, mots-clefs UNIQUE : ajout/retrait du `categoryLink` et création
  de la `categoryEntry` à contrainte `max=1 scope="roster"` si besoin). Dry-run
  par défaut, `--write` pour écrire. Un détachement à override de DP par
  chapitre est signalé, jamais écrasé.
- `bodyguard-audit.mjs` — audit des **listes de rattachement** (blocs LEADER /
  SUPPORT des fiches MFM, `leader_targets` / `support_targets`) vs la base, sous
  trois formes : groupes `Can Lead/Support (MFM)` + liens inverses `Led By /
  Supported By (MFM)`, marqueurs `leader-kw:`, et **prose** Leader/Support (que
  l'appli affiche et lit). Hors périmètre d'`apply`, qui ignore volontairement
  l'étiquette « BODYGUARD UNITS UPDATED » (les rattachements suivent la **fiche
  officielle**). Audite par défaut les seules fiches étiquetées, `--all` pour tout.
  Le meneur est résolu par la matrice de **sa** faction (`map/<slug>.json`, alias
  compris). Cibles **Legends** de la faction (`legends.json`) : ignorées, hors base.
  Écarts : cible au barème non liée, lien en trop (y compris un sens que le MFM ne
  donne pas), `leader-kw:` qui rattache une fiche hors liste MFM, prose ≠ MFM ou
  nommée selon le mauvais sens. Un lien posé par `attachOverrides` (manifeste
  game-datacards) est une info. Lecture seule, sortie ≠ 0 sur écart : il se corrige
  en rafraîchissant la veille game-datacards puis `gdc-attach.cjs --write --prose`,
  **jamais** à la main. État au 2026-10-29 : `--all` 389/389 conformes (164 écarts
  sur l'état d'avant la purge Legends) — voir `state/RESTE-v1.6-refresh2.md`.
- `legends.json` — noms des fiches de la section **LEGENDS** du MFM, par faction
  (`mfm_parser.py legends`, cookie `isLegendsDisplayed=true` que pose
  l'interrupteur « Show Legends » du site). Fichier **à part** du dump : `apply`
  et `build-map` n'en voient rien (Legends hors base, décision du 2026-10-22).
  À rafraîchir avec chaque nouveau MFM (l'audit prévient si sa version diffère
  de celle du dump).
- `legends-fr.json` — `{ "<NOM EN MFM>": "<nom FR>" }` pour 177 des 274 fiches
  **Legends-only** (nom de `legends.json` au barème d'aucune faction). Extrait
  **statique** du pack FR d'avant la purge (décision du 2026-10-29 : rien de
  Legends dans la base ni l'appli — le pack `translations/fr.json` ne les contient
  plus). Seul consommateur : le sidecar de l'appli `src/data/legends-names.json`
  (`scripts/gen-legends-names.mjs`, `npm run gen:legends-names`), qui empêche
  l'import de liste de rabattre une fiche Legends (EN ou FR) sur une fiche au
  barème. Ne pas le régénérer depuis le pack ; un nom Legends sans traduction
  reste simplement absent.
- `refresh-current.mjs` — REPLI sans le parser de l'app : rafraîchit le cache
  `current` des matrices depuis la bdd. **Ne recalcule pas l'appariement** — une
  matrice à cibles disparues (« GONE ») doit passer par `build-map`.
- `dp-audit.mjs` — audit DP + Force Disposition des détachements vs le dump
  (trou v1.3 : apply ne couvre que les points ; Lions of the Emperor 3 DP
  était passé inaperçu). Overrides par chapitre évalués, alias par sac de
  mots (dets Agents), exception Orks ≤ v1.3 (inerte depuis le MFM v1.4, Orks traités normalement).
  **Contrôle symétrique base → MFM** (2026-10-30) : chaque détachement que
  l'appli **propose** à une faction (parser de l'app via `pools.mjs`, repli
  `vendor/`) doit figurer dans la liste MFM du slug de cette faction ; sinon
  ligne « ◇ à trancher » (retirer, masquer pour la faction, ou consigner la
  décision — un nom d'`abandons.json` pour ce slug sort en « ℹ »). Sortie ≠ 0.
  Cas d'origine : 19 détachements de chapitre 10e absents du MFM v1.6 et
  Gladius Task Force proposé aux Black Templars (retirés / masqué le
  2026-10-30). `run.sh` et `cron-mfm.sh` annexent la sortie à `A_RENVOYER.md`.
- `pools.mjs` — `SLUG_TO_POOL` (slug MFM → factions de l'appli, la première =
  faction de la matrice ; `titan-legions` → Adeptus Titanicus,
  `chaos-titan-legions` → Titanicus Traitoris, fiches partagées de
  `Library - Titans.cat`, noms « CHAOS … TITAN » par `aliases.json`) et
  `resolveParser()` / `parseRepo()`, partagés par `build-map.mjs` et `dp-audit.mjs`.
- `verifies.json` (+ module `verifies.mjs`) — **bruit permanent vérifié** : lignes
  de revue déjà vérifiées conformes, `{ "<slug>": { "<NOM MFM>": { le, empreinte,
  lignes, motif } } }`. `lignes` = sortes couvertes : `apply:modele-porte` (④),
  `apply:base-imbriquee` (④), `apply:composition` (⑤), `tier-audit` (« ? »),
  `phase3:paliers` (« ? »). `empreinte` = sha1 (12 hex) du **barème MFM** de
  l'unité (tier / taille / points de toutes ses occurrences dans le dump). Tant
  qu'elle est identique, `apply.mjs`, `tier-audit.mjs` et `phase3.mjs` sortent la
  ligne en « ℹ déjà vérifié le … » (hors « À ME RENVOYER ») ; barème changé → la
  demande revient, annotée « barème MFM changé depuis la vérification du … ».
  Vérifier = recalculer au **moteur de l'appli** (`src/lib/pts.js` de
  cogitator-bellicum) le prix de chaque taille / composition du barème (et la
  répétition) ; n'y inscrire qu'une ligne revérifiée. État :
  `node editor/mfm/verifies.mjs` (✓ / ⚠ par entrée, sortie ≠ 0 si une entrée est
  à revérifier) ; empreinte d'une unité : `node editor/mfm/verifies.mjs
  editor/mfm/dump/en "slug::NOM"`. Contenu au 2026-10-30 : 31 unités (④ 15, ⑤ 3,
  tier-audit 4, phase3 12, certaines communes) ; **non inscrit** : ATALAN JACKALS
  (Genestealer Cults), barème en question ouverte. État de la base au 2026-10-30
  (alignée sur la fiche officielle game-datacards : 5 = 85, 9 = 150, 10 = 150 ;
  l'ancien modifier « set 160 si ≥ 1 Wolfquad », qui jouait toujours, est retiré) :
  85 pts, « set 150 » au-delà de 5 figurines, +10 dès la 3e unité ; 4 à 8 Jackals
  + 1 Wolfquad, le second Wolfquad n'étant permis qu'avec 8 Jackals (maximum
  conditionnel que l'appli n'évalue pas : elle plafonne l'unité à 9 figurines).
  Le MFM porte en plus « 9 models » = 160 (170 dès la 3e unité), prix que la base
  ne produit pas : `apply.mjs` le sort en ⑥ (« À ME RENVOYER »), `tier-audit.mjs`
  et `phase3.mjs` en « ? », tant que la question (MFM ou fiche officielle pour 9
  figurines) n'est pas tranchée.
- `aliases.json` — résidu nom MFM → datasheet(s) bdd (nom cat, bsId, ou tableau
  pour un nom générique couvrant plusieurs datasheets, ex. `SOUL GRINDER` → 4
  variantes de dieu). Fusionné avant l'auto-match ; revérifié à chaque build.
- `abandons.json` — fiches **au barème** du MFM dont l'intégration est
  **abandonnée** par l'utilisateur (règle 6 : une absence se signale, sauf
  abandon acté) : `{ "_doc": "…", "<slug>": { "<NOM MFM>": "décision du
  AAAA-MM-JJ : motif" } }`, une entrée par slug (le Grey Knights Thunderhawk
  Gunship, fiche propre, n'est pas concerné par l'abandon du Thunderhawk du tronc
  SM). Contenu au 2026-10-29 : ARES GUNSHIP et ORION ASSAULT DROPSHIP (Custodes,
  décision du 2026-10-22), ASTRAEUS et THUNDERHAWK GUNSHIP (6 slugs du tronc SM)
  et GARGANTUAN SQUIGGOTH (Orks), décision du 2026-10-29. Lecteurs :
  `build-map.mjs` (nom sans datasheet → champ `abandoned` de la matrice, plus
  `unmapped` ; nom qui correspond **de nouveau** à une datasheet → apparié
  normalement **et** consigné dans `abandonedConflicts`, avertissement
  « ⚠⚠⚠ ABANDON CADUC » ; slug inconnu, motif sans date ou entrée plus au MFM →
  avertis), `apply.mjs` (lignes « ℹ abandonné », jamais ① ; « ⚠ ABANDON CADUC »
  à renvoyer, même depuis une matrice antérieure) et
  `editor/translations/gdc-watch.cjs` (fiche amont nouvelle/modifiée sous un nom
  abandonné, absente de la base → 🔇 bruit « abandonnée le … » ; présente → ❓).
  Fiche finalement intégrée → retirer son entrée.
- `map/<slug>.json` — matrices générées (commitées : leur diff montre d'un coup
  les datasheets ajoutées/retirées entre deux MFM). Champs : `matched`
  (targets[] avec `current` + `weaponOptions`), `unmapped`, `abandoned`
  (`{ name, why }`), `abandonedConflicts` (`{ name, why, targets }`), `orphans`,
  `errors`, `enhancements`, `enhUnmapped`.
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
git clone --filter=blob:none git@github.com:fmoraldo-mithraw/wh40k-11e.git ~/wh40k-mfm/wh40k-11e \
  && ~/wh40k-mfm/wh40k-11e/editor/mfm/install-automation.sh
```

(`--filter=blob:none` : clone sans blobs historiques, ~10× plus léger que
le clone complet — l'historique des `.cat` pèse ~400 Mio et casse
facilement en route ; l'automatisation n'en a pas besoin.)

(Le clone initial est directement le clone dédié : l'installeur le détecte
et le synchronise — pas de second clone, rien en /tmp.)

L'installeur vérifie les prérequis (git, node ≥ 18, python3+requests,
crontab), pose les clones dédiés dans `~/wh40k-mfm/` (données + app en
lecture seule pour la clôture d'import), teste le droit de push, installe
l'entrée crontab horaire (minute aléatoire) et fait un premier passage de
validation. Journal : `~/.local/state/wh40k-mfm/cron.log`. Options :
`--dir`, `--lang`, `--schedule "<expr cron>"`, `--uninstall`.
