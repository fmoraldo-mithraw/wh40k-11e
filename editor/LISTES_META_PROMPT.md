# Listes du méta (Listhammer) — cron quotidien et routine de correction

Bouton « 🏆 Listes du méta (Listhammer) » de la fenêtre des listes de l'appli : les
**10 dernières meilleures listes de tournoi de chaque faction 40k** de
[listhammer.info](https://listhammer.info), **déjà analysées** (un clic les charge, aucune
analyse côté joueur), affichées par faction.

## Chaîne

| Étape | Quand | Quoi |
|---|---|---|
| **Cron** | chaque nuit (tâche planifiée « Listes du méta — cron Listhammer ») | `scripts/dev/listhammer-cron.sh` (appli) : `listhammer-sync.mjs` puis commit `listhammer/` + `editor/bin/pousse.sh` |
| **Routine de correction** | ≈ 45 min après le cron (tâche « Listes du méta — routine de correction ») | lit `listhammer/ERREURS.md`, corrige le parseur ou les données, réanalyse, publie |
| **Production** | `scripts/daily-update.sh` à 4 h | `main` des données a bougé → rebuild : l'asset `/data-meta/listhammer-<hash>.json` part avec |

`scripts/dev/listhammer-sync.mjs` (appli) :
1. `https://listhammer.info/api/recentLists?faction=<F>` pour les 28 factions de
   `LISTHAMMER_FACTIONS` (`src/lib/metaLists.js`) — ordre du site (événements récents,
   meilleurs bilans en tête) ; listes envoyées en image écartées.
2. **MFM courant seulement** (décision du 2026-11-13) : n'entrent que les listes de tournois
   joués depuis la sortie du MFM courant (`MFM_RELEASES`, `src/game/mfm.js`) ; au passage à un
   nouveau MFM, les anciennes sortent d'elles-mêmes. Une liste dont le total ne tombe juste
   qu'avec un ANCIEN barème (tournoi resté sur l'ancien MFM) est écartée (`excluded` de
   `listes.json`) et remplacée par la suivante. Pages Listhammer supplémentaires au besoin.
3. **File FIFO par faction** (`mergeFifo`) : une liste jamais vue entre (date du jour), au-delà
   de 10 la plus anciennement entrée sort ; à date égale, le rang du site départage.
4. **Toutes** les listes en file sont réanalysées à chaque passage par le VRAI chemin de
   l'import en lot (`metaAnalyzeList` d'`App.jsx`, exposée en dev seulement sur
   `window.__cbMetaAnalyze`, pilotée dans Chromium sur le serveur Vite) : un correctif du
   parseur ou des données profite aux listes déjà en file.

## Fichiers (`listhammer/`, ce dépôt)

- `listes.json` — la file : champs Listhammer (`listId`, joueur, tournoi, bilan…), texte brut
  `listText`, `addedAt`, et le résultat : `faction` (de l'appli), `snap` (instantané prêt à
  charger, forme `buildImportSnapshot`), `pts`, `listedPts`, `issues`. Une liste par ligne.
  Le plugin Vite (`virtual:bsdata-meta`) en tire l'asset de l'appli **sans** `listText`.
- `ERREURS.md` — **l'état des erreurs de chargement**, réécrit à chaque passage : bilan, par
  nature, à traiter par liste, acceptées. Ne pas l'éditer.
- `acceptees.json` — divergences légitimes, tenues par la routine :
  `[{ "listId": "…", "unit": "…", "msg": "sous-chaîne du message", "raison": "…" }]`
  (`listId` / `unit` facultatifs ; sans `listId`, vaut pour toutes les listes).

Erreur de chargement = **total chargé ≠ total annoncé** (l'en-tête de la liste, ou la somme
des prix d'unités écrits quand l'en-tête n'est que la taille de bataille ou un titre périmé ;
le message détaille les unités en écart appli/liste), entrée `error`/`warn` du journal d'import (fiche introuvable, arme
impossible sur la fiche, amélioration non reconnue, figurine non rapprochée, effectif hors
bornes, détachement introuvable ou non lu, Warlord absent ou multiple), faction non
identifiée / aucune unité lue, ou **faction lue ≠ faction Listhammer** (`LH_APP_FACTIONS`).

## Routine de correction (procédure)

1. Branches principales, données à jour (`git pull` sur `main` / `feat/v11`),
   `scripts/dev/prepare.sh`. Lire `listhammer/ERREURS.md` (section « À traiter »).
2. Pour chaque nature d'erreur, la plus fréquente d'abord : reproduire
   `node scripts/dev/listhammer-sync.mjs --only <listId>[,<listId>]` (n'écrit rien ; `--text f.txt`
   pour un extrait), lire le texte (`listText` dans `listes.json`). Un serveur Vite déjà lancé
   (`npx vite --port 5198`) s'utilise avec `--url http://localhost:5198/` — le relancer après
   toute modif de données (`scripts/dev/sync-data.sh`) ou du parseur BSData.
   Écart de points : comparer au MFM (`editor/mfm/dump/en/<faction>.json`) — surcoût d'arme
   manquant dans la base, option mal placée par l'import, effectif mal lu.
3. Classer et agir :
   - **Défaut de lecture** (format, puces, noms, faction mal choisie, figurines mal
     réparties) → corriger `src/lib/listImport.js` (ou le rapprochement d'`App.jsx`), ajouter
     le cas en fixture (`tests/fixtures/import-cases/meta-*.txt`, noms de joueur retirés) dans
     `tests/meta_import_formats_tests.mjs` (total annoncé + structure). Jamais de cas
     particulier sur un `listId`.
   - **Écart avec la fiche officielle** (nom d'arme, surcoût MFM, option manquante) → corriger
     la base selon `editor/SOURCE_GAME_DATACARDS.md` / `editor/MFM_PROMPT.md`.
   - **Trou de données** (fiche, option, amélioration, détachement présents dans le MFM / la
     fiche officielle mais absents de la base) → CLAUDE.md **règle 6** : ne rien inventer ;
     si le texte n'est pas dans `editor/sources/` ni game-datacards, l'ajouter aux questions
     ouvertes d'`ETAT.md` et accepter provisoirement l'erreur (`raison` = « Q<n> ETAT »).
   - **Divergence légitime** (option retirée depuis la liste, liste illégale telle que jouée,
     Legends, ancienne version de données) → `acceptees.json` avec la raison.
4. Réanalyser toute la file : `node scripts/dev/listhammer-sync.mjs --offline` — le nombre
   « à traiter » doit baisser, « sans erreur » ne jamais baisser.
5. Valider comme toute modif : tests ciblés puis `scripts/dev/ci-local.sh 22` (appli),
   `editor/bin/verifie.sh` si des `.cat` ont changé. Commits en français ; publier
   **données d'abord** (`editor/bin/pousse.sh`, avec `listhammer/` réanalysé) puis appli
   (`scripts/dev/pousse.sh`). Parseur modifié → resynchroniser la copie embarquée
   (`editor/mfm/vendor/sync-parser.sh`).
6. Ce qui n'est pas réglé en une passe reste « à traiter » : la routine du lendemain reprend.
   Mettre à jour la ligne « Listes du méta » d'`ETAT.md` (à traiter / acceptées).
