# ÉTAT — fichier de reprise (à lire en début de tâche, à tenir à jour en fin de tâche)

> But : reprendre le travail **sans relire l'historique**. Court par construction :
> ≤ 80 lignes ; ce qui est réglé sort d'ici (le détail vit dans les commits et les guides).
> Dernière mise à jour : 2026-10-15.

## Dépôts et branches

| Dépôt | Branche de travail | Publication |
|---|---|---|
| `wh40k-11e` (données) | `main` | `editor/bin/pousse.sh <branche-de-session>` (push `main` + copie sur la branche de session) |
| `cogitator-bellicum` (appli) | branche de session, rebasée sur `feat/v11` | `scripts/dev/pousse.sh <branche-de-session>` (avance et pousse `feat/v11`) |

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

1. **Vanguard Veteran Squad (à pied)** — fiche au MFM, absente de la base. Décision du 2026-10-22 :
   en attendant la fiche, les meneurs qui citent « Vanguard Veteran Squad » (Lieutenant, Ancient…)
   mènent la version à réacteurs dorsaux — déjà le cas : la prose se résout en mot-clef de
   catégorie « Vanguard Veteran Squad », que porte l'unité à réacteurs. Texte de la fiche à fournir.
2. **Grey Knights** — 8 divergences restantes de `gdc-apply-weapons.cjs --trust` (Omnissiah power
   axe, Thunderhawk M 20", Armoured hull, Hurricane bolter F5 PA-1, Las-talon 24") : appliquer ?
3. **Deathwatch Support** — lecture retenue : une KILL TEAM ne porte que des améliorations
   de ce détachement ; le plafond de 500 pts compte options et améliorations. À confirmer.
4. **Veille gdc v995** (branche `veille-gdc/v995`, 3 corrections : Wolf Guard Headtakers mot-clef
   Beasts, mots-clefs Tacticus/Gravis Talonstrike et Aquila Kill Team, Power Fist du Death Company
   Captain A6 CC2+) : fusionner ?

Clos le 2026-10-22 : Eradicator Squad (les deux fiches Heavy Bolters / Melta Rifles sont déjà
conformes au codex) ; Aquila Kill Team conservée ; socle du Blastajet et fiches Custodes Ares/Orion
abandonnés ; Aleya, Valerian, Venerable Contemptor/Land Raider, Kill Tank (hors MFM) non intégrés.

## Décisions récentes (détail dans CLAUDE.md / les guides)

- 2026-10-22 : **résumés « initiation » des capacités** (`briefs/en.json`, `briefs/fr.json`, guide
  `editor/BRIEFS_PROMPT.md`) : une ligne EN + FR par capacité d'unité, clefée par nom (ou nom#empreinte),
  empreinte du texte canonique → audit des périmés (`editor/audit/briefs.mjs`, enchaîné par `valider.mjs`).
  Appli : case « Mode initiation » de l'export PDF (fiches compactes, mots-clés ciblés par le
  détachement surlignés, règles d'armée répétées masquées). Couverture : voir la dernière ligne de l'audit.
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
