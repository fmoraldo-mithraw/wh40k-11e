# ÉTAT — fichier de reprise (à lire en début de tâche, à tenir à jour en fin de tâche)

> But : reprendre le travail **sans relire l'historique**. Court par construction :
> ≤ 80 lignes ; ce qui est réglé sort d'ici (le détail vit dans les commits et les guides).
> Dernière mise à jour : 2026-11-07. (Historique détaillé avant compactage : `git show e25a5372:ETAT.md`.)

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
- `npm run audit:data` (appli) : **8** anomalies, 0 nouvelle. Tests appli **80/80** suites (`scripts/dev/tests.sh`,
  dont `test:wtc-backfill`, 300/300, et le golden d’export TTS `test:ys-export-golden` : 15 scénarios + balayage toutes fiches, 0 fraction / 0 doublon) ; `scripts/dev/ci-local.sh` vert sous Node 22 le 2026-11-01 (Node 20 absent du conteneur).
- Import sans IA, corpus de 749 listes réelles (Listhammer `/api/recentLists` + Mini Headquarters, banc hors dépôt) :
  744 lues, 10 624/10 753 unités rapprochées ; découpage multi-listes 114/124 paquets de 6 ; listes en v995 (349) :
  12 unités à écart ≥ 40 pts sur 4 919 (restes = MFM, constants par fiche). **Mini Headquarters 17–31/10/2026**
  (9 tournois, 472 listes, banc hors dépôt) : **4 814/4 873** unités rapprochées (96,7 % → 98,8 %), 0 liste sans unité ;
  restes = Legends, fiches absentes (Q7), alliés d'une autre faction en 2v2. **2e passe (nuit)** : unités **4 842/4 870**
  (99,4 % ; restes = Legends + fiches absentes), équipements **18 310/18 521** placés (98,9 % ; restes = options retirées
  des fiches 11e dans des listes v946–v981, longue traîne FR). Lot d'équipe L3 (30 listes, export « Joueur : Faction ») : 100 %.
- Pack FR **13 884** clés ; résumés **4 216** capacités (100 %) ; socles **1 010** (+ alias).
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
   Grotmob (Orks), Vindicator (BA), Venatari « Custodians » (2 fiches Venatari : laquelle ?), Venerable Contemptor
   Dreadnought (Custodes), Warboss on Warbike (Orks). Détachements lus sans équivalent dans la base (listes en v972 —
   renommés ?) : Shield Host, Solar Spearhead, Tharanatoi Hammerblow, Silent Hunters (Custodes) ; Companions of
   Vehemence (BT) ; Liberator Assault Group, Legacy of Grace, Vengeful Hosts (BA) ; Godhammer Assault Force. Texte à fournir ?
8. **Pack FR incomplet / divergent de l'appli GW FR** (import des listes FR) : « Wolf Guard Preneurs de Têtes » (pack)
   vs « Preneurs de Têtes Gardes Loups » (appli GW, et la prose du pack) ; manquent Fenrisian Wolves, Assault
   Brethren, Moteurs surgonflés, Expertise inhumée, Ost-Rempart… Aligner le pack sur les noms de l'appli GW FR ?
   En attendant : table d'import seule `src/lib/gwFrNames.js` (appli ; ~50 noms sûrs, aucun libellé affiché changé).
9. **Audit Wahapedia 11e arbitré par game-datacards (2026-11-08)** : ~60 corrections certaines appliquées (officiel +
   Wahapedia d'accord : errata, détachements de chapitre SM, débarquements, mots-clés…). Restent À TRANCHER, sans action :
   Canis Rex (Legendary Freeblade 0 PC / -1 PC), Dêlve Assault Shift (BATTLELINE Beserks), Thunderhawk GK (Cluster Bombs),
   Ta'unar (volet MOBILE), Intraneural Biotech, Heirs of Sigismund, rattachement Farseer → Warlock Conclave (voulu, pack v1.4),
   Bjorn/Swarmlord/Mawloc/Trygon (GDC et base d'accord, Wahapedia diffère). Fiches Forge World présentes dans l'officiel et
   absentes de la base (règle 6, texte à fournir ?) : Ares Gunship, Orion Assault Dropship (Custodes), Astraeus, Thunderhawk
   Gunship (SM), Gargantuan Squiggoth (Orks). Détachements Boarding Actions : hors périmètre. Vocabulaire FR choisi sans
   source officielle : « shaken » = secouée (« ébranlé » = battle-shocked, jamais shaken ; pas de terme officiel), Bombardement Incendiaire, Obus Fumigènes (à valider avec la question 5).

## Dettes connues (pas de décision attendue)

- Import PDF : worker pdf.js émis en `.js` (nginx sans type `.mjs`), glisser-déposer dans la modale d'import (84b0d92).

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

- 2026-11-07 : **Cthonian Beserks** : arme de mêlée au choix de **chaque** figurine (fiche officielle « can each have ») — erreur « same weapon » et asservissement du porteur de mole grenade launcher retirés. Appli : un `<infoLink type="rule">` d'aptitude de base (Deep Strike…) garde désormais sa **porte de masquage** (détachement) — Deep Strike n'apparaît plus sur les Beserks hors Dêlve Assault Shift ; parseur embarqué resynchronisé.
- 2026-11-06 : **« 🗺 Déploiement » (appli)** : par liste enregistrée, grille 5 dispositions adverses × cartes A/B/C
  (aperçus), côté attaquant/défenseur ; autres dispositions gardées. Carte = images `src/assets/layouts` à l'échelle
  44"×60", zones lues dans les pixels (pose au toucher dans sa zone, alerte « hors zone ») ; personnages fondus dans
  l'unité menée ; cohésion ; réserve / embarqué ; copie miroir ; règle ; menace (disque N") ; armes spéciales marquées ;
  socles par figurine (Boss Nob 40 mm). Stockage : appareil (`cb:deploy:<listId>`) + **compte** (table `list_deployment`, `server/deployments.js`,
  fusion carte par carte ; banc `scripts/dev/deploy-api.sh`) ; la table se crée au déploiement (`setup-db.js`).
  Mobile : carte plein écran + bandeau d'unités (puces) en portrait, carte pivotée en paysage (auto/forcée),
  outils sur la carte, menu ⋯ de l'unité, cibles ≥ 40 px au doigt, cadrage auto, double-toucher = zoom, écran allumé.
  Formations (compacte par défaut / écran / étendue / colonne) ; récupérer une carte d'une autre liste ; dupliquer
  une liste copie ses déploiements (appareil + compte).
  Châssis : `src/data/hull-sizes.json` (estimations). `editor/base-sizes.json` : Wazdakka « 120mm » → « 120x92mm Oval
  Base » (troncature probable du guide — à confirmer sur le PDF GW).
- 2026-11-06 : **« ⚔ Confronter » (appli)** : liste adverse chargée à côté de la nôtre (listes enregistrées ou import,
  toute faction), grille nos unités × les leurs — part détruite en une phase, meilleur de tir/mêlée, dans les deux sens ;
  verdicts ☠ tue (anéantie ≥ 50 %) / ◐ démolit (≥ 50 %) / ◔ entame (≥ 20 %) ; clic → simulateur sur le duel, cible et
  onglet réglés ; couleurs par verdict (rouge/orange/jaune) ; vue « par cible » (ses meilleurs tueurs, 3 premiers + tous ceux
  qui tuent/démolissent). Conventions = simulateur (loadout réel, bonus inconditionnels, vraie taille d'escouade, défenses permanentes).

- 2026-11-05 : **errata WCW 2026 (Rules Updates nov. 2026)** intégré : armes (Mephiston, DC Captain JP, DC Dreadnought,
  Chaos Bikers, Nemesis Claw, DW Terminators S7/S8, DW Veterans Damnatus/Purgatus, Aggressors sans [CQ]) ; textes
  (Shambling Wall, Double-cross, Grot Shields, Unholy Resilience, Sir Hekhtur, Umbralefic Crystal, Meet Any Challenge,
  Unleash Wrath) ; mots-clefs (Watch Master Agents +CAPTAIN, Talonstrike : TACTICUS/GRAVIS par figurine) ; restrictions
  de chapitre (Medusa's Wrath, Shadowmark Talon, Champions of Fenris, Saga of the Beastslayer, Blade of Ultramar).
  Déjà conformes : règle Deathwing, socle de Dante 50 mm, mots-clef DEATHWATCH des fiches Agents. **Assigned Agents** :
  la phrase de l'errata est AJOUTÉE en tête, paragraphe des alliés gardé (validé). Q/R du document : NON encodées (décision
  utilisateur). Deathwatch Kill Team des Agents laissée telle quelle (l'errata ne vise que les Deathwatch Veterans, validé).

- 2026-11-04 : **appli — se connecter / créer son compte avec Cogitator Strategarium** (Better-Auth generic-oauth,
  `server/auth.js` + `server/strategarium.js`) : le compte est relié d'office pour l'envoi des scores/listes ;
  rattachement par email seulement si l'adresse est vérifiée des deux côtés. **Déploiement** : ajouter
  `{PUBLIC_URL}/api/auth/callback/strategarium` à `OAUTH_BELLICUM_REDIRECT_URIS` côté Strategarium
  (Strategarium : `/api/v1/me` expose `emailVerified`, PR fusionnée).
- 2026-11-03 : **import — en-tête New Recruit multi-lignes + figurine obligatoire omise** (liste Orks) : « [2000 pts] »
  seul clôt l'en-tête (Ghazghkull n'est plus pris pour le titre) ; un groupe sous son minimum reprend le minimum des
  figurines absentes qui en exigent un (Biker Nob des Warbikers, Tankbustas coupés), signalé en info au journal.
  Les 2 échecs de `test:import-real-cases` notés le 11-02 ne viennent que du cache `node_modules/.cache/bsdata`
  (3 fichiers périmés) : 0 échec avec `BSDATA_DIR=../wh40k-11e` (chemin de tests.sh / CI).

- 2026-11-02 : **import — appli GW recopiée depuis un PDF** (scrim Anvil Dragoons) : `unflattenPdfLines` (listImport.js)
  recolle les lignes coupées (« (3 » / « Detachment Points) », « … • », « (Upgrade) » seul), sépare mission/taille, éclate
  les puces en ligne ; le lot (`batchImport.js`) détecte ces listes ; détachement « Faction Det, … » résolu par fin de nom.

- 2026-11-02 : **indice de létalité — cibles = escouades réelles : 10 Gardes, 5 Marines, 5 Terminators** (avant 30/20/10) : Blast et le plafond des morts se règlent sur ces tailles (Killa Kans : 24,9 → 9,7 Gardes). Les profils « ➤ » étaient déjà exclusifs (un seul, le meilleur par cible). `src/sim/lethality.js`.
- 2026-11-02 : **une seule amélioration par unité, Upgrade comprise** (FAQ V11 : « Upgrades are enhancements »). L'appli avait déjà un seul emplacement `enh` par ligne. Nouveau : une **unité attachée** (unité rejointe + meneur(s) + appui) compte comme UNE unité → erreur de validation si le groupe porte 2+ améliorations (`attachedEnhErrors`, `src/rules.js`). La règle vaut aussi pour deux personnages optimisés sur la même unité (lecture large de l'utilisateur, à confirmer). À l'import, une seconde amélioration sur la même ligne est écartée ET signalée dans le journal (`enh-dropped`).
- 2026-11-01 : **export WTC — ligne « + SECONDARIES: »** en dernière ligne d'entête (`src/lib/wtcSecondaries.js`), secondaires FIXES seulement, sans Engage on All Fronts (décision utilisateur) : figurines de PERSONNAGE (W4+ / W1-3) pour Assassination, figurines W10+ pour Bring It Down, unités de 13+ figurines OU figurine seule non attachée W13+ pour A Grievous Blow (décision utilisateur). PV de base (sans amélioration) — à confirmer. L'import l'ignore. Correctif du jour : seules les figurines de la composition actuelle comptent (clef périmée « Makari » d'une liste sauvegardée : Ghazghkull compté 2×, sorti d'A Grievous Blow) ; et au rechargement d'une liste, les figurines que la fiche n'a plus sont retirées (`migrateSavedLoadout`, liste `dropped`).

- 2026-10-31 (nuit, 2) : import sans IA — équipement rendu à la fiche (`src/lib/wargearLocalize.js` : graphie voisine,
  noms FR de l'appli GW via pack + lexique, aptitudes d'équipement, 2e passe par unité), prose narrative écartée, faction
  par abréviation (« DA ») et par chapitre (fiches propres citées), découpage des exports d'équipe « Joueur : Faction ».

- 2026-10-31 (nuit) : **import entraîné sur Mini Headquarters (17–31/10)** : gabarit FR « Nom (N) : X pts » (`parseFrColon`),
  WTC-NR « 3x X (pts): 3 with … », « Attached Unit1: » / « • Char1: », fait main (« ATTACHED UNIT A », « [pts] (10 models) »,
  « / » et « + »), « Version de Données », suffixes « (Upgrade|Amélioration|un par armée) », surnoms et prose narrative
  ignorés, champion d'un groupe fixe compté dans l'effectif ; CI appli de nouveau verte (Terminators BT).

- 2026-10-31 (soir) : **import sans IA fiabilisé** (`src/lib/listImport.js`, cas réels `tests/fixtures/import-cases/`)
  + **import en lot** (onglet « Plusieurs listes », `src/lib/batchImport.js` : texte/PDF multi-formats → listes
  « Joueur — Équipe » / « Joueur — Faction » / « Faction » dans un dossier, sous-dossier par équipe dès 2 équipes)
  + **journal d'import** (fenêtre ⛔/⚠/ℹ : fiche/arme/amélioration/détachement introuvables, effectif hors bornes,
  prix et total incohérents, pas de Seigneur de Guerre, armes par défaut non listées).
  **Les listes réelles servent aux règles de FORMAT, jamais de référence de points/équipement** (décision
  utilisateur) : le journal gradue selon l'âge de la liste (`Data Version: vNNN` vs `src/lib/dataVintage.js`) —
  même version → alerte, plus ancienne / inconnue → info « barème différent (MFM, codex) ».

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
- `src/lib/dataVintage.js` (appli) : `REFERENCE_GW_DATA_VERSION` = `tracked.dataVersion` de game-datacards
  (`test:batch-import` ROUGE à la montée de version — guide `editor/SOURCE_GAME_DATACARDS.md`).
- `src/data/legends-names.json` (appli) : `test:legends-names` ROUGE si le MFM change les noms Legends →
  `npm run gen:legends-names`. Hook de démarrage : `.claude/hooks/session-start.sh` des deux dépôts.
