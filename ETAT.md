# ÉTAT — fichier de reprise (à lire en début de tâche, à tenir à jour en fin de tâche)

> But : reprendre le travail **sans relire l'historique**. Court par construction :
> ≤ 80 lignes ; ce qui est réglé sort d'ici (le détail vit dans les commits et les guides).
> Dernière mise à jour : 2026-10-23.

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

- Ids dupliqués : **444** (`editor/audit/dup-ids.mjs` ; re-figer avec `--fige` seulement s'il baisse).
- `npm run audit:data` (appli) : **25** anomalies, 0 nouvelle.
- Tests appli : **61/61** suites (`scripts/dev/tests.sh`) ; CI appli rejouable en local :
  `scripts/dev/ci-local.sh [20|22]` (verte sous Node 20 et 22 le 2026-10-09).
- game-datacards suivi : version de données **972** (`editor/sources/game-datacards.json`).

## Questions ouvertes à l'utilisateur (ne pas inventer — CLAUDE.md règle 6)

Aucune au 2026-10-22.

Clos le 2026-10-22 : Vanguard Veteran Squad à pied (la fiche n'existe pas ; les meneurs qui la
citent — Lieutenant, Ancient — mènent la version à réacteurs dorsaux via la catégorie
« Vanguard Veteran Squad » ; plus dans le MFM) ; Eradicator Squad (deux fiches conformes au codex) ;
Aquila Kill Team conservée ; socle du Blastajet et fiches Custodes Ares/Orion abandonnés ; Aleya,
Valerian, Venerable Contemptor/Land Raider, Kill Tank non intégrés ; Grey Knights alignés sur
game-datacards ; veille v995 fusionnée ; **Deathwatch Support confirmé** : une KILL TEAM ne porte
que des améliorations de ce détachement, le plafond de 500 pts compte options et améliorations.

## Décisions récentes (détail dans CLAUDE.md / les guides)

- 2026-10-23 : traduction FR — **« riled up » se traduit toujours « vénèr »** (clef `Riled Up` → `Vénèr`,
  prose de `translations/fr.json` et `briefs/fr.json`, « Marcheur Vénèr ») ; à garder pour toute nouvelle prose Orks.
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
- Hook de démarrage de session (`.claude/hooks/session-start.sh` des deux dépôts) :
  dépendances de l'appli, cache de données synchronisé, variables d'environnement.
