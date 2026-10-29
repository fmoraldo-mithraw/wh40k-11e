# ÉTAT — fichier de reprise (à lire en début de tâche, à tenir à jour en fin de tâche)

> But : reprendre le travail **sans relire l'historique**. Court par construction :
> ≤ 80 lignes ; ce qui est réglé sort d'ici (le détail vit dans les commits et les guides).
> Dernière mise à jour : 2026-10-29.

## Dépôts et branches

| Dépôt | Branche de travail | Publication |
|---|---|---|
| `wh40k-11e` (données) | `main` | `editor/bin/pousse.sh <branche-de-session>` (push `main` + copie sur la branche de session) |
| `cogitator-bellicum` (appli) | `feat/v11` | `scripts/dev/pousse.sh <branche-de-session>` (avance et pousse `feat/v11`) |

Toujours sur ces branches principales, jamais sur la branche `claude/…` de la session
(hook `editor/bin/branche-principale.sh` ; la branche de session reçoit une copie au push).

Le parseur de l'appli est embarqué côté données (`editor/mfm/vendor/bsdata-parser.mjs`) :
après tout commit touchant `scripts/bsdata-parser.mjs`, lancer
`COGITATOR_DIR=../cogitator-bellicum bash editor/mfm/vendor/sync-parser.sh` et committer.

## Lignes de base (une régression = un écart à ces nombres)

- Ids dupliqués : **427** (`editor/audit/dup-ids.mjs` ; re-figer avec `--fige` seulement s'il baisse).
- `npm run audit:data` (appli) : **25** anomalies, 0 nouvelle.
- Tests appli : **70/70** suites (`scripts/dev/tests.sh`, dont `test:legends-names`) ; CI appli rejouable en local :
  `scripts/dev/ci-local.sh [20|22]` (verte sous Node 22 le 2026-10-29, sous Node 20 le 2026-10-09).
- game-datacards suivi : version de données **995** (`editor/sources/game-datacards.json`).
- `editor/mfm/bodyguard-audit.mjs --all` : **389/389** listes conformes, 0 écart (liens, `leader-kw:`, proses).
- Golden des rattachements (appli) : **4109** paires, 87 classes de mots-clefs.
- `editor/audit/legends.mjs` : **0** écart (274 fiches Legends-only du MFM v1.6) ; pack FR **13 442** clés ;
  résumés **4 388** capacités (100 %) ; socles **1 010** entrées (+ alias) ; **45** catalogues (.cat + .gst) ;
  références pendantes **0**.

## Questions ouvertes à l'utilisateur (ne pas inventer — CLAUDE.md règle 6)

1. *(Mise de côté le 2026-10-29 : « pas besoin de tous les socles pour l'instant ».)* **Socles absents du guide** (impression du codex) : 40 fiches vivantes sans entrée dans `editor/base-sizes.json`,
   surtout le tronc Space Marines (Intercessor, Hellblaster, Infernus, Infiltrator, Reiver, Scout Squad, Lieutenant,
   Librarian, Redemptor Dreadnought, Storm Speeders…), dont la section du guide de juin 2026 n'a que 50 entrées —
   extraction probablement incomplète. Fournir le PDF du Base Size Guide (ou les socles) pour compléter ?

Clos le 2026-10-29 (ter) : **Tank Ace Character supprimée** ; **alias de socles** (`aliases` sur l'entrée du guide,
12 fiches dont le Caladius) ; **second ménage** : références pendantes 565 → 0 (Boarding Actions, coût « pl »,
publication Index DG, ids Legends des conditions Aeldari…), 235 éléments partagés orphelins (dont les groupes
« Crucible content »), 11 catégories Orks restaurées (mots-clefs vivants), Kroot « max 3 » réécrit sans Boarding
Actions, alertes T'au « … upgrade is required » impossibles à lever retirées, Tyranid Warriors plus porteurs
d'améliorations (non-personnages, règle 1), 492 clés FR et 175 résumés devenus orphelins.

Clos le 2026-10-29 (bis) : **abandon acté** d'Astraeus, du Thunderhawk Gunship du tronc SM et du Gargantuan
Squiggoth (`editor/mfm/abandons.json`, avec Ares/Orion du 2026-10-22 : la routine ne les redemande plus) ;
**ménage fait** : catalogue Unaligned Forces supprimé, restes Croisade (147 racines, 8 052 conditions constantes),
83 catégories mortes (dont les restes [Crucible]), 13 catégories Croisade, profil Corsair Skyreaver Band, 7 214 clés FR mortes, 883 résumés
orphelins, 18 socles sans fiche, dossier `editor/mfm-source/`.

Clos le 2026-10-29 : classe A du constat bodyguard MFM v1.6 = cibles **Legends** (Vanguard Veteran Squad à pied,
Sagittarum Custodians, Custodian Guard à lances Adrasite/Pyrithite), rien à lier ; classe B = angles morts de
`gdc-attach` (tiret U+2011, fiche hidden exposée, alias), corrigés, 10 liens posés. **Rien de Legends dans la base ni
l'appli** (utilisateur) : `leader-kw` Vanguard retirés, prose Leader/Support réécrite depuis la fiche officielle
(`gdc-attach --prose`), purge faite (détail : `editor/mfm/state/RESTE-v1.6-refresh2.md`).

Clos le 2026-10-27 : **`mfm_parser.py`** corrigé et validé sur le site (réseau ouvert par l'utilisateur) — octrois
`LEADER:`/`SUPPORT:` lus dans le `<li>` v1.6 (deux-points exigés), 13 octrois extraits (12 LEADER + Murdermind),
13 fantômes du résidu ② résorbés, dump `dump/en` et matrices rafraîchis, `enh-leaders.mjs` : 0 lien à ajouter.
(Site FR hors périmètre : l'anglais suffit — décision utilisateur.) **Extraction EN vérifiée** contre un extracteur
indépendant (page HTML rendue dans Chromium) : 30 factions, 1 373 fiches, 2 650 lignes de coût, 334 détachements,
977 améliorations, 13 octrois — 0 écart après ajout du bloc SUPPORT des fiches (`support_targets`, 87) et des
étiquettes « … UPDATED » (22). Legends (bouton « Show Legends », 424 fiches) non extraites : hors base (décision 22/10).
**Murdermind** (Necrons, Cursed Legion) — `SUPPORT: Lokhust Heavy Destroyers,
Ophydian Destroyers, Skorpekh Destroyers, Lokhust Destroyers` (texte fourni par l'utilisateur) → groupe
`Can Support (MFM)` sur l'amélioration ; l'appli rattache le Cryptek porteur comme Support (rôle par
rattachement). **Alliés des chapitres** : oubli confirmé — Imperial Fists, Salamanders, Black Templars,
Deathwatch lient désormais Imperial Knights - Library et Agents of the Imperium (`importRootEntries`).

Clos le 2026-10-22 : Vanguard Veteran Squad à pied (la fiche n'existe pas ; les meneurs qui la
citent — Lieutenant, Ancient — mènent la version à réacteurs dorsaux via la catégorie
« Vanguard Veteran Squad » ; plus dans le MFM) ; Eradicator Squad (deux fiches conformes au codex) ;
Aquila Kill Team conservée ; socle du Blastajet et fiches Custodes Ares/Orion abandonnés ; Aleya,
Valerian, Venerable Contemptor/Land Raider, Kill Tank non intégrés ; Grey Knights alignés sur
game-datacards ; veille v995 fusionnée ; **Deathwatch Support confirmé** : une KILL TEAM ne porte
que des améliorations de ce détachement, le plafond de 500 pts compte options et améliorations.

## Décisions récentes (détail dans CLAUDE.md / les guides)

- 2026-10-29 : **ménage des restes morts** (utilisateur) et **abandon** Astraeus / Thunderhawk SM / Squiggoth. Une
  fiche abandonnée va dans `editor/mfm/abandons.json` (build-map → `abandoned`, apply → ℹ, gdc-watch → 🔇), jamais
  en question ① à chaque routine. Le pack FR ne garde que les clés que l'appli peut chercher ; l'ancienne mémoire de
  traduction reste dans git (`2abf1210:translations/fr.json`, relue par `atteste-conserve.mjs`). Chaos Knights : les
  erreurs « only in an Iconoclast Fiefdom » (Croisade seulement) retirées, la restriction réelle reste le `set
  hidden` → detReq (test:vocab adapté).

- 2026-10-29 : **rien de Legends dans la base ni l'appli** (utilisateur). Référence : `editor/mfm/legends.json`
  (section LEGENDS du MFM). Purge : bibliothèque « Astartes Heresy Legends », Death Company Intercessors et Land Raider
  Banisher (cachées, hors MFM, proposées par l'appli), `leader-kw` / catégorie Vanguard, conditions mortes (Gabriel
  Seth, Logan on Stormrider, Daemonhost, Jokaero, Proteus), 199 catégories et des équipements orphelins, 163 noms et
  250 clés « [Legends] » du pack FR, 11 socles. Garde-fous : **`editor/audit/legends.mjs`** (enchaîné par
  `valider.mjs` : échoue sur tout nom « [Legends] », fiche Legends exposée, `leader-kw`/prose qui en nomme une),
  `mfm_parser.py` (section LEGENDS jamais dans le dump ; `run.sh`/cron rafraîchissent `legends.json`), `gdc-attach`
  (jamais de cible Legends, `--prose`), `gdc-watch` (Legends → 🔇), `gen-stat-markers`, `bodyguard-audit`. Appli :
  l'import ne rapproche jamais une ligne « [Legends] » ni un nom de base d'une variante « … with … » ; fixtures
  WTC régénérées (générateur réparé), non-régression 1006 fiches. **Relecture critique** (même jour) : l'import
  rabattait 68 variantes Legends sur la fiche au barème (Logan on Stormrider → Logan Grimnar) → l'appli refuse tout
  nom Legends-only EN/FR (`src/lib/legendsNames.js`) ; clause « Kill Team Cassius (see Legends…) » retirée de
  Mission Tactics ; 36 catégories mortes, 24 éléments orphelins et 3 branches de conditions mortes retirés ;
  248 clés FR mortes liées aux Legends élaguées ; `legends.mjs` étendu (renvois, catégories mortes, clés FR). **La prose Leader/Support est tenue alignée** sur la fiche officielle :
  l'appli l'affiche ET en tire ses rattachements (Judiciar : 5 cibles au lieu de 11 avant). Judiciar et Sanguinary
  Priest = Support. Prix de répétition en double (Ironstrider, Lokhust) et lascannon de l'Ironstrider corrigés.
- 2026-10-29 : **rattachements MFM v1.6 ↔ base** : `gdc-attach.cjs` normalise les tirets typographiques, traite
  les fiches hidden exposées par un lien visible et résout les noms par `editor/mfm/aliases.json` → 10 liens
  posés (Trajann ×3, Shield-Captain on Dawneagle, Belial, Calgar ×4, Vulkan), golden appli 4026 paires.
  **Legends extraites à part** : `mfm_parser.py legends` → `editor/mfm/legends.json` (424, hors dump, hors base) ;
  `bodyguard-audit.mjs` résout le meneur par la matrice de sa faction et classe Legends / leader-kw / overrides.
- 2026-10-28 : **MFM v1.6, dump re-extrait intégré** (routine cowork) — correctif parser en place :
  0 delta de points, 0 delta d'amélioration, `enh-leaders` 13 octrois / 0 lien à ajouter (contrôle croisé
  rétabli), dp/wpn/tier-audit verts, marqueur `state/integre.txt` posé. Nouvel audit
  **`editor/mfm/bodyguard-audit.mjs`** (listes LEADER/SUPPORT des fiches vs base, hors périmètre d'`apply`) :
  22 fiches « BODYGUARD UNITS UPDATED », 6 conformes, **16 écarts** — 10 relèvent de la question ouverte
  Vanguard ci-dessus, 6 (Trajann, 2 Shield-Captain, Belial, Calgar) attendent un rafraîchissement de la veille
  game-datacards. Rien écrit en base. Détail : `editor/mfm/state/RESTE-v1.6-refresh2.md`.
- 2026-10-28 : **simulateur — mot-clef d'unité** : un sim-mod `kw=` se juge sur l'**unité** ; une unité menée a
  les mots-clefs de tous ses modèles (Warboss + Boyz sous Green Tide : Mob-Handed Brutality, Sustained Hits 1,
  sur toutes les armes de mêlée du Warboss). Jeton **`kwModels`** (prose « X models », « each time a X model »)
  → filtre sur les mots-clefs propres du modèle : 35 lignes / 15 catalogues (Combat Drugs, Wrath of Khorne,
  Powers of Da Waaagh!…) ; TITANIC DUEL des Chaos Knights reste d'unité. Appli : `src/sim/simModMatch.js`
  (`okw`/`ukw`), `test:sim-mod-match` ; puces Lethal/Sus dédoublonnées dans le tableau. Spec : `SIM_MOD_APP_PROMPT.md`.
- 2026-10-28 : **formats alignés sur la table MFM « Muster Armies »** (appli, `rules.js` `MFM_BATTLE_SIZE`) :
  Incursion 2 améliorations, limite Battleline/Dedicated Transport 4 (autres fiches 2) ; Strike Force 4 / 6 / 3 ;
  Epic Hero 1 dans tous les formats. Onslaught (absent du MFM) garde le doublement.
- 2026-10-27 : **import/export des listes** (appli) : `test:option-export` rejoue chaque choix de chaque fiche
  (5 163) export → import → ré-export par le VRAI chemin de l'appli (`applyImportedRow`, App.jsx) : **0 écart**
  (cliquet `tests/fixtures/option-export-baseline.json`, re-figer avec `--fige` après correctif) ;
  `test:import-real-cases` : 15 listes réelles (appli GW, New Recruit, à plat, ancien export) issues de deux
  relectures adverses. Base simplifiée : Aspect Shrine Token (plafond natif), Canoptek Tomb Crawlers (une entrée
  « Tomb Crawler » ×2, isolateur max 1). Préambule GW « Space Marines » + chapitre : la faction du chapitre
  (`pickFaction` : préambule GW seulement, catalogue qui contient les autres ; « Factions Used » garde la 1re). Export genNR (format YellowScribe) : réimport non voulu (utilisateur).
- 2026-10-27 : **aperçu des points à l'import** = total de l'armée importée (App.jsx `importPreviewPts` chiffre
  les lignes mêmes de `handleFullImport`, `importedArmyRows`) ; garde-fou `test:import-preview` (68 armées, 0 écart).
- 2026-10-27 : **arme facultative dans un choix composé** (parseur `optionalComboMembers`) : un membre-arme sans
  min ni defaultAmount, à côté d'un membre requis, sort des profils du choix et devient une case à cocher
  « <choix> — <arme> » gardée par le choix (Hellglaive du Heliarch : seul cas de la base). Un composé dont aucun
  membre n'a de minimum reste lu en bloc ; Solarite (Scourges) : min 1 ajouté à ses deux armes (fiche officielle).
  `test:option-export` ouvre désormais les portes {g,c} (5 263 choix). **Import appli GW copiée depuis
  l'affichage** (« Nazdreg165 points », « Attached Unit N » sans points, 3 détachements sur une ligne) : reconnu.
- 2026-10-26 : **Troupe Harlequin** (appli) : plus de doublons d'options ; `u.weaponUnitCaps` partage le plafond
  fusion/neuro (2, 4 à 10+) entre Players et Lead Player. **Simulateur** : `kw=` des sim-mods voit les mots-clefs de
  faction (Malicious Frenzy enfin proposé aux unités Drukhari/Harlequins). Données inchangées.
- 2026-10-26 : **export WTC — DP** : `+ DETACHMENT: A (2 DP), B (1 DP) — 3/3 DP` (coût effectif au format, remise
  Incursion incluse ; budget omis si format inconnu) ; l'import retire ces suffixes et garde alors les noms à
  parenthèses entiers (Agents). **Golden de l'export** : `tests/wtc_export_golden_tests.mjs` (appli) — 8 scénarios
  à entrées figées (`tests/fixtures/wtc-export/`) + invariants sur les 36 factions vivantes ; changement VOLONTAIRE
  du format → `npm run gen:wtc-export-golden`, relire le diff des `.txt`.
- 2026-10-26 : **dump MFM v1.6 rafraîchi intégré en no-op** (`editor/mfm/state/RESTE-v1.6-refresh.md`) :
  aucun prix ne change chez GW, seul le parse régresse (libellés `LEADER:`/`SUPPORT:`, cf. questions
  ouvertes). `apply.mjs` 0 delta, dp/wpn/tier-audit verts, `valider.mjs` 0 erreur — marqueur
  `state/integre.txt` posé pour ne pas faire tourner la routine cowork à vide.
- 2026-10-25 : **amélioration homonyme dans deux détachements** (Towering Arrogance 20 pts Kabalite Cartel / 15 pts
  Kabalite Agonysts) : l'appli garde `enhDet` sur la ligne (`findEnh`, `src/rules.js`) ; unicité toujours par nom.
- 2026-10-23 : **PDF, règles d'armée masquées par leur NOM** (`faction.armyRules` de l'armée + factions chargées),
  plus par « capacité vue sur 2+ fiches » — qui cachait Transhuman Strategist (Helbrecht + Marshal), Damaged, Aegis…
- 2026-10-23 : **parseur, plafonds par taille** : `choiceUnitMax` replie les paliers « +1 à X fig. » par seuil croissant
  (Thunder Hammer des Sword Brethren) ; `collectCompMods` : un modificateur sur la contrainte de SON propre nœud prend
  le gate du parent (griffes des Sword Brethren). 7 fiches changent de bornes, toutes vers la donnée (Ratlings, Paladins…).
- 2026-10-23 : **PDF** : `para()` mesure les mots **sans crénage** (`getStringUnitWidth(…,{kerning:{}})`) — `getTextWidth`
  soustrait les paires AT/TA que `doc.text` ne trace pas (« ASTARTESde »). **Import WTC** : groupe `_fixed` pur
  complété par `cleanModels` (Grimaldus à 0) ; lignes « Nx Figurine: armes » sans puce reconnues (`listImport.js`).
- 2026-10-23 : **PDF initiation** : chaque unité menée est imprimée juste après son ou ses meneurs
  (Leader, puis Support) — `leadersBeforeLed` (`src/rules.js`) ; le PDF classique garde l'ordre par catégorie.
- 2026-10-23 : traduction FR — **« riled up » se traduit toujours « vénèr »** (clef `Riled Up` → `Vénèr`,
  prose de `translations/fr.json` et `briefs/fr.json`, « Marcheur Vénèr ») ; à garder pour toute nouvelle prose Orks.
  **Accord** : vénèr (m. sg.), vénère (f. sg.), vénèrs (m. pl.), vénères (f. pl.) — « une unité vénère »,
  « Marcheur Vénèr » ; la clef seule `Riled Up` reste « Vénèr ».
- 2026-10-22 : **invulnérables à contexte** (`STAT_MARKERS_APP_PROMPT.md`, « Groupes de contexte ») :
  `invuln:` porte `vs=ranged|melee` (Knights, Titans, Rangers, KFF / Judiciar, Banshees et Wyches 4+ en
  mêlée) ou `lost=wound` (Archon, perdue au 1er PV) ; un bonus « once per battle » est un
  `def-mod: … inv=N oncePer=battle` (Trajann, Canoness, Daemon Prince, Lelith, Benefictus, Manipulus).
  Audit `editor/audit/invu-contexte.mjs` (dans `valider.mjs`). Appli : `invulnFor` (mode tir/mêlée),
  indice de résistance par mode + espérance exacte pour `lost=wound`, simulateur `invulnVs`/`invulnLost`.
- 2026-10-22 : **résumés « initiation » des capacités** (`briefs/en.json`, `briefs/fr.json`, guide
  `editor/BRIEFS_PROMPT.md`) : une ligne EN + FR par capacité d'unité, clefée par nom (ou nom#empreinte),
  empreinte du texte canonique → audit des périmés (`editor/audit/briefs.mjs`, enchaîné par `valider.mjs`).
  Appli : case « Mode initiation » de l'export PDF (fiches compactes, mots-clés ciblés par le
  détachement surlignés, règles d'armée répétées masquées). Couvre aussi les règles d'armée, de
  détachement et les stratagèmes (source `faction:<Nom>`, plafond 300) : encadrés et tables simplifiés en
  tête du PDF initiation. Couverture au 2026-10-22 : 5457/5457 (100 %).
- 2026-10-21 : **cibles étalons** : létalité contre Garde impérial (Cadian Shock Troops 70/10, E3 5+ 1PV)
  au lieu des Eldars ; les infanteries génériques du simulateur reprennent ces trois profils
  (E3 5+ 1PV, E5 3+ 2PV, E6 2+ 3PV invu 4+).
- 2026-10-20 : **def-mods permanents appliqués d'office à l'indice de résistance du catalogue**
  (`permanentDefMods`, mode tir : sans condition/choix/« en menant »), comme le simulateur les coche.
- 2026-10-20 : **une arme de mêlée par figurine** (appli) : `deriveAttackerWeapons` porte `bearers`
  (figurine → nombre) ; le simulateur rend exclusives les armes de mêlée d'une même figurine même en
  escouade (hors [Extra Attacks]) ; l'indice de létalité mêlée retient, par figurine et PAR CIBLE, l'arme
  la plus létale (`meleePlan`, `src/sim/lethality.js`).
  Arme à plusieurs profils « ➤ » (Kan Blasta…) : un seul profil, le meilleur par cible (`rangedPlan`).
- 2026-10-15 : **éléments mal rangés = erreur** (`editor/audit/conteneurs.mjs`, enchaîné par `valider.mjs`) :
  43 armes copiées par `gdc-apply-weapons.cjs` dans `<entryLinks>` étaient ignorées (storm bolter du
  Brotherhood Librarian…) ; outil corrigé, données réparées (`--repair`).
- 2026-10-14 : **faction packs du 14/10 intégrés** (AS 1.4, AdMech 1.4, Aeldari 1.4, Agents 1.3,
  Votann 1.2, Tyranids 1.3 ; errata imprimés Custodes 1.0, SM 1.1) — Rules Updates comparées à la base
  (le rouge du PDF est perdu en extraction texte : comparaison exhaustive). Un document officiel plus
  récent que game-datacards l'emporte : rattachements protégés par `attachOverrides` du manifeste
  (Eldrad/Farseer → Warlock Conclave). Fixture figée Agents (idiome profil hidden) côté appli.
- 2026-10-14 : **MFM v1.6 intégré** (`editor/mfm/state/RESTE-v1.6.md`) — Exorcist 175,
  7 Force Dispositions Custodes réalignées (Guardians of the Throne en offre 2 au choix),
  2 seuils de répétition corrigés (Sodalities : +30 dès le 4e). Le v1.6 publie le **DP officiel
  des 13 détachements Custodes** : tous à 1 sauf Guardians of the Throne à 3 — conforme à la base,
  question ouverte n° 5 close.
- 2026-10-13 : **publication : données d'abord, appli ensuite** (la CI de l'appli lit `main` des
  données au démarrage ; ordre inverse = CI rouge, cf. run 38448670025).
- 2026-10-13 : **FNP contre blessures mortelles = Devastating Wounds uniquement** (drapeau `mortal`
  des `def-mod:` ; simulateur : champ « FNP BM », jamais repli sur le FNP général) — `SIM_MOD_APP_PROMPT.md`.
- 2026-10-09 : **Incursion : un détachement à 3 DP coûte 2 DP** (35 détachements, modifier natif ;
  appli `effectiveDetDp`) — `editor/DETACHMENT_DP_APP_PROMPT.md`. Tout nouveau détachement à 3 DP
  doit porter le modifier.
- 2026-10-09 : codex Custodes 11e = données de référence ; les tests de l'appli suivent (corpus
  réalignés, golden Leader régénéré). Idiomes du parseur disparus de la base (infoGroup « Talons »,
  désignation Solar Spearhead) testés sur le catalogue Custodes 10e figé
  (`cogitator-bellicum/tests/fixtures/legacy/`). Restes d'anciens paliers retirés (4 fiches).
- 2026-10-09 : démons des légions (Tallyband Summoners, Carnival of Excess, Changehost of Deceit,
  Khorne Daemonkin) = texte officiel : **500 / 1000 / 1500 pts** selon Incursion / Strike Force /
  Onslaught, **aucun Warlord** démon ; règle « <Légion> » en tête de chaque détachement.
- 2026-10-08 : alliés de détachement — marqueur `det-allies:` (Deathwatch Support 500 pts ;
  variante `native` démons des légions) — `editor/DETACHMENT_ALLIES_APP_PROMPT.md`.

## Automatismes en place

- Routine **veille game-datacards** `trig_01LeEKKKSbD2SyUgmXjRYSgn` : quotidienne 13:12
  (Europe/Paris), session neuve, pousse seulement sur `veille-gdc/v<N>`, liste les entrées
  manquantes en « TEXTE À FOURNIR ».
- **Liste des noms Legends de l'appli** (`src/data/legends-names.json`, `npm run gen:legends-names`) : générée
  depuis `editor/mfm/legends.json` + dump + `editor/mfm/legends-fr.json` ; la suite `test:legends-names` passe au
  ROUGE dès que ces noms changent (MFM rafraîchi par le cron) — relancer `gen:legends-names` côté appli.
- Hook de démarrage de session (`.claude/hooks/session-start.sh` des deux dépôts) :
  dépendances de l'appli, cache de données synchronisé, variables d'environnement.
