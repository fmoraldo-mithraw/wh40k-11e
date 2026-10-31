# ÉTAT — fichier de reprise (à lire en début de tâche, à tenir à jour en fin de tâche)

> But : reprendre le travail **sans relire l'historique**. Court par construction :
> ≤ 80 lignes ; ce qui est réglé sort d'ici (le détail vit dans les commits et les guides).
> Dernière mise à jour : 2026-10-31 (soir). (Historique détaillé avant compactage : `git show e25a5372:ETAT.md`.)

## Dépôts et branches

| Dépôt | Branche de travail | Publication |
|---|---|---|
| `wh40k-11e` (données) | `main` | `editor/bin/pousse.sh <branche-de-session>` (push `main` + copie sur la branche de session) |
| `cogitator-bellicum` (appli) | `feat/v11` | `scripts/dev/pousse.sh <branche-de-session>` — **toujours après les données** (la CI de l'appli lit `main` des données) |

Toujours sur ces branches principales (hook `editor/bin/branche-principale.sh`). Parseur embarqué côté données
(`editor/mfm/vendor/bsdata-parser.mjs`) : après tout commit de `scripts/bsdata-parser.mjs`, lancer
`COGITATOR_DIR=../cogitator-bellicum bash editor/mfm/vendor/sync-parser.sh` et committer.
**CI GitHub de l'appli hors service** (limite de dépenses du compte, à régler par l'utilisateur dans GitHub →
Billing) : rejouer `scripts/dev/ci-local.sh 22` **et** `20` avant chaque push.

## Lignes de base (une régression = un écart à ces nombres)

- Ids dupliqués **425** (`editor/audit/dup-ids.mjs`, `--fige` seulement s'il baisse) ; références pendantes **0** ;
  **45** catalogues (.cat + .gst) ; `editor/audit/legends.mjs` **0** écart.
- `npm run audit:data` (appli) : **8** anomalies, 0 nouvelle. Tests appli **73/73** suites (`scripts/dev/tests.sh`,
  dont `test:wtc-backfill`, 300/300) ; `scripts/dev/ci-local.sh` vert sous Node 22 le 2026-10-31 (Node 20 absent du conteneur).
- Import sans IA, corpus de 749 listes réelles (Listhammer `/api/recentLists` + Mini Headquarters, banc hors dépôt) :
  744 lues, 10 627/10 753 unités rapprochées ; découpage multi-listes 114/124 paquets de 6.
- Pack FR **13 788** clés ; résumés **4 218** capacités (4 147 entrées par langue, 100 %) ; socles **1 010** (+ alias).
- `editor/translations/gdc-compare.cjs --gdc /tmp/gdc/11th/gdc --out-dir …` : vrais **156** (tous classés : gelés,
  expliqués ou faux positifs de l'outil — invul.info, `option=`/`vs=`, profils non-arme), modélisation 1 942, noms 464.
- game-datacards suivi : données **995**, commit `6f98bb1`, export du 2026-10-16T18:38 (`editor/sources/game-datacards.json`).
- `editor/mfm/bodyguard-audit.mjs --all` : **389/389** ; golden des rattachements (appli) **3977** paires (copies BT retirées) ;
  MFM : `apply.mjs` 1 329 fiches (Titans compris), « À ME RENVOYER » **0**, `dp-audit` aligné **et** symétrique.

## Questions ouvertes à l'utilisateur (ne pas inventer — CLAUDE.md règle 6)

1. *(Mise de côté le 2026-10-29.)* **Socles absents du guide** : 40 fiches vivantes (surtout le tronc Space Marines).
2. **README de l'appli** : annonce un forfait 5 € / PayPal et « BYOK Anthropic » absents du code (Stripe pack-5/10,
   lien paypal.me). Réécrire ?
3. **Dépendances de dev** : monter vite 8 / fast-xml-parser 5 (failles, `--host`) ?
4. **Déploiement à faire** : `cd ~/cogitator-bellicum && git pull && ./deploy.sh`, puis `journalctl -u
   cogitator-bellicum -n 80 | grep -i 'better auth'` et une vraie connexion + « mot de passe oublié ».
5. **Vocabulaire FR 11e — arbitrages par défaut à confirmer** (appliqués le 2026-10-31) : résumés gardent leurs
   abréviations sauf SvIn/Sv/CO ; [Lourd], [Jumelé], « FUSION » (capitales du pack) ; BÊTES ; optimisation (Enhancement) /
   Amélioration (Upgrade) ; termes 10e de la clé EN suivis (pion d'objectif, réserves) ; Death Blow inchangé ; UI : libellés
   courts du simulateur gardés (Touche/Blesse/Crit/Soutient/FNP). Hors table, non traités : mots-clefs restés en anglais
   (DAMNED, TECH-PRIEST…), formats (Force de Frappe/Offensive), missions (objectif domiciliaire, noms d'actions).
6. **Fiches** : tranchées le 2026-10-31 et appliquées (voir décisions). Reste en suspens : nom « Heavy Thunder Hammer »
   (DW), FR non officielles à valider (Daemonic Allegiance du Soul Grinder, règle « Drones », Drone Harassment Tactics,
   Shadow Form Abilities), « Keep Huntin'! » (Orks, non corrigé).
7. **Fiches des listes de tournoi absentes de la base** (règle 6, relevées par l'import) : Valerian (Custodes), Dok et
   Grotmob (Orks), Vindicator (BA), Venatari « Custodians » (2 fiches Venatari : laquelle ?). Texte à fournir ?
8. **Pack FR incomplet / divergent de l'appli GW FR** (import des listes FR) : « Wolf Guard Preneurs de Têtes » (pack)
   vs « Preneurs de Têtes Gardes Loups » (appli GW, et la prose du pack) ; manquent Fenrisian Wolves, Assault
   Brethren, Moteurs surgonflés, Expertise inhumée, Ost-Rempart… Aligner le pack sur les noms de l'appli GW FR ?

## Dettes connues (pas de décision attendue)

- **Import simple : aperçu ≠ armée** (préexistant) : liste Aeldari Aspect Host (fixture `nr-wtc-player-team.txt`)
  annoncée 1975 pts à l'aperçu, 2085 une fois importée (même écart au rechargement d'une liste du lot).

- **Désignation par import** : une liste importée (WTC/texte) avec amélioration sur un Trygon (Subterranean Assault)
  ou un War Dog (Houndpack) n'active pas la désignation → message de validation jusqu'à la bascule manuelle.
- **Blue Horrors** : figurines Brimstone Horror à encoder (Company Heroes : sentinelles d'`audit:data` sur `isChar`).
  (Ré-export du 16/10 trié, `editor/sources/veille/2026-10-30-v995-v995.md` ; la veille ne les redemandera plus.)
- **Listes enregistrées** : options retirées pour suivre l'officiel (Infiltrator Comms Array, Auspex array / Infernum
  halo-launcher du Corvus, Thunder Hammer & Terminator Storm Shield, Combat knife de l'Aquila, Sternguard BT a499)
  → choix perdus au rechargement. Fixtures WTC non régénérées (sauf Sternguard BT).
- **Balisage** : ~140 copies officielles en **X** (Titanic…) contre ^^X^^ maison ; 527 « ^^**X^^** » mal imbriqués ;
  ~600 lignes à U+00A0. **Parseur** : catégories conférées sous condition de détachement non évaluées (TYRANID
  WARRIORS de Warrior Bioform Onslaught : sim-mod Parasitic Payload) ; `gen-def-mods.mjs` : 6 nœuds en dérive.

Historique de l'appli avant le 2026-10-07 archivé : tag `archive/historique-avant-2026-10-07`.

## Décisions récentes (détail dans CLAUDE.md / les guides / les commits)

- 2026-10-31 (soir) : **import sans IA fiabilisé** (`src/lib/listImport.js`, cas réels `tests/fixtures/import-cases/`)
  + **import en lot** (onglet « Plusieurs listes », `src/lib/batchImport.js` : texte/PDF multi-formats → listes
  « Joueur — Équipe » / « Joueur — Faction » / « Faction » dans un dossier, sous-dossier par équipe dès 2 équipes)
  + **journal d'import** (fenêtre ⛔/⚠/ℹ : fiche/arme/amélioration/détachement introuvables, effectif hors bornes,
  prix et total incohérents, pas de Seigneur de Guerre, armes par défaut non listées).

- 2026-10-31 : **fiches tranchées** : mots-clefs de rôle SM retirés ; options du Watch Sergeant hors fiche retirées ;
  « Eradicator Squad with Melta Rifles » ; reliques Triumph sans préfixe ; **un seul Soul Grinder** à allégeance ;
  démons de légion confirmés (écarts « voulus », `editor/sources/gdc-ecarts-voulus.json`) ; règle d'armée « Drones » ;
  Atalan Jackals 160 à 9 figurines (MFM) ; ~23 noms d'aptitudes corrigés ; copies BT Terminator/Sternguard retirées
  (appli : `src/lib/{renamedUnits,mergedUnits,choiceAliases}.js` pour recharger les anciennes listes).
- 2026-10-31 : **vocabulaire FR officiel 11e** partout (pack 3 169 valeurs, résumés 2 244, UI) : aptitude, jet de
  touche/blessure, mouvement d'avance/de retraite/d'élan, choisir, placer, SvIn, unité de meneur, Ligne, Sombres Pactes,
  Primat ; guide `editor/BRIEFS_PROMPT.md` aligné — ne jamais réintroduire les anciennes formes.
- 2026-10-30 (nuit) : simulateur, cible choisie → bouton « 🛡 Défenses » : `def-mod` de sa fiche, de sa règle d'armée et de
  chaque détachement de sa faction (stratagèmes filtrés par leur ligne TARGET) — `src/sim/targetDefense.js`.
- 2026-10-30 (soir) : **jamais renommer une entrée de choix ni ses profils d'arme** (l'appli enregistre les choix par
  nom et résout leurs armes par le nom des profils ; `gdc-apply-weapons` signale, `--rename-profils` pour le profil) ;
  invulnérable projetée par un détachement = infoLink masqué révélé par le détachement + `def-mod` sur la règle
  (`kw=`, `kwModels` si la prose vise des figurines).
- 2026-10-30 : fiches alignées sur game-datacards v995 ; détachement absent du MFM « ◇ » (`dp-audit`, symétrique) ;
  ④/⑤ vérifiées dans `editor/mfm/verifies.json` ; gdc-watch `--stamp`. 10-29 : **rien de Legends** (`editor/audit/
  legends.mjs`, `src/lib/legendsNames.js`) ; `editor/mfm/abandons.json` ; pack FR = clés vivantes (`2abf1210`).
- Plus anciennes (détail dans les guides) : 10-28 formats MFM « Muster Armies », sim-mod `kw=`/`kwModels` ; 10-27 import/export rejoués choix par choix ; 10-25 `enhDet` des
  améliorations homonymes ; 10-23 « riled up » = « vénèr » ; 10-22 invulnérables à contexte et résumés `briefs/` ;
  10-15 conteneurs ; 10-14 `attachOverrides` ; 10-13 FNP `mortal` ; 10-09 Incursion 3 → 2 DP, démons des légions
  500/1000/1500 ; 10-08 `det-allies:`.

## Automatismes en place

- Routines : **veille game-datacards** `trig_01LeEKKKSbD2SyUgmXjRYSgn` (13:12 Paris, pousse sur `veille-gdc/v<N>[-r<k>]`,
  « TEXTE À FOURNIR ») ; **MFM cowork** `trig_01UwCB1pdXMJSda5aaWxM5rQ` (`pousse.sh`, `abandons.json`, `verifie.sh`).
- `src/data/legends-names.json` (appli) : `test:legends-names` ROUGE si le MFM change les noms Legends →
  `npm run gen:legends-names`. Hook de démarrage : `.claude/hooks/session-start.sh` des deux dépôts.
