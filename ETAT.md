# ÉTAT — fichier de reprise (à lire en début de tâche, à tenir à jour en fin de tâche)

> But : reprendre le travail **sans relire l'historique**. Court par construction :
> ≤ 80 lignes ; ce qui est réglé sort d'ici (le détail vit dans les commits et les guides).
> Dernière mise à jour : 2026-10-30. (Historique détaillé avant compactage : `git show e25a5372:ETAT.md`.)

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

- Ids dupliqués **426** (`editor/audit/dup-ids.mjs`, `--fige` seulement s'il baisse) ; références pendantes **0** ;
  **45** catalogues (.cat + .gst) ; `editor/audit/legends.mjs` **0** écart.
- `npm run audit:data` (appli) : **8** anomalies, 0 nouvelle. Tests appli **71/71** suites (`scripts/dev/tests.sh`,
  dont `test:wtc-backfill`, 300/300) ; `scripts/dev/ci-local.sh` vert sous Node 22 et 20 le 2026-10-30.
- Pack FR **13 790** clés ; résumés **4 219** capacités (4 147 entrées par langue, 100 %) ; socles **1 010** (+ alias).
- `editor/translations/gdc-compare.cjs --gdc /tmp/gdc/11th/gdc --out-dir …` : vrais **156** (tous classés : gelés,
  expliqués ou faux positifs de l'outil — invul.info, `option=`/`vs=`, profils non-arme), modélisation 1 942, noms 464.
- game-datacards suivi : données **995**, commit `6f98bb1`, export du 2026-10-16T18:38 (`editor/sources/game-datacards.json`).
- `editor/mfm/bodyguard-audit.mjs --all` : **389/389** ; golden des rattachements (appli) **4109** paires ;
  MFM : `apply.mjs` 1 329 fiches (Titans compris), « À ME RENVOYER » **1** (Atalan Jackals, ⑥), `dp-audit` aligné **et** symétrique.

## Questions ouvertes à l'utilisateur (ne pas inventer — CLAUDE.md règle 6)

1. *(Mise de côté le 2026-10-29.)* **Socles absents du guide** : 40 fiches vivantes (surtout le tronc Space Marines).
2. **README de l'appli** : annonce un forfait 5 € / PayPal et « BYOK Anthropic » absents du code (Stripe pack-5/10,
   lien paypal.me). Réécrire ?
3. **Dépendances de dev** : monter vite 8 / fast-xml-parser 5 (failles, `--host`) ?
4. **Déploiement à faire** : `cd ~/cogitator-bellicum && git pull && ./deploy.sh`, puis `journalctl -u
   cogitator-bellicum -n 80 | grep -i 'better auth'` et une vraie connexion + « mot de passe oublié ».
5. **Vocabulaire FR** : le pack garde surtout l'ancienne traduction (Ruée, Effectif de Départ) là où l'officiel 11e dit
   « mouvement d'élan », « effectif initial » ; les résumés suivent le pack (mot-clef : LIGNE). Passer pack + résumés à
   l'officiel 11e ? (aussi : Sombres Pactes, Furie/Fureur d'Airain, aptitude/capacité, « Prime »/« Primat » Tyranide.)
6. **Fiches à trancher contre l'officiel v995** : copies BT Terminator / Sternguard (80ad, a499), fusion Soul Grinder,
   démons de codex invoqués, Sargotta, CHARACTER des SW (VD), mots-clefs de rôle (errata 11e), drones T'au, Thicket
   SPAWN, options du Watch Sergeant (DKT), noms Eradicator / Heavy Thunder Hammer, reliques de la Triumph.
7. **Atalan Jackals** : palier MFM 160 pts (9 figurines ?) absent de la base (85 / 150).

## Dettes connues (pas de décision attendue)

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

Clos le 2026-10-30 : **fiches alignées sur l'officiel game-datacards v995** (textes, profils, mots-clefs, FR officiel ;
phases B à E) ; 19 détachements de chapitre hors MFM retirés ; Visarch, Crusaders, Secutarii = Legends (hors base).
Historique de l'appli avant le 2026-10-07 archivé : tag `archive/historique-avant-2026-10-07`.

## Décisions récentes (détail dans CLAUDE.md / les guides / les commits)

- 2026-10-30 (soir) : **jamais renommer une entrée de choix ni ses profils d'arme** (l'appli enregistre les choix par
  nom et résout leurs armes par le nom des profils ; `gdc-apply-weapons` signale, `--rename-profils` pour le profil) ;
  invulnérable projetée par un détachement = infoLink masqué révélé par le détachement + `def-mod` sur la règle
  (`kw=`, `kwModels` si la prose vise des figurines) ; résumés FR = vocabulaire du pack, mot-clef LIGNE.
- 2026-10-30 : détachement absent du MFM signalé « ◇ » (`dp-audit`, symétrique) ; demandes ④/⑤ vérifiées dans
  `editor/mfm/verifies.json` ; gdc-watch : ré-exports à version égale (`--stamp`), mots-clefs par figurine.
- 2026-10-29 : **rien de Legends dans la base ni l'appli** (`editor/audit/legends.mjs`, `src/lib/legendsNames.js`) ;
  **abandons** dans `editor/mfm/abandons.json` ; pack FR = clés vivantes (mémoire : `2abf1210:translations/fr.json`).
- Plus anciennes (détail dans les guides) : 10-28 formats MFM « Muster Armies », sim-mod `kw=`/`kwModels` ; 10-27 import/export rejoués choix par choix ; 10-25 `enhDet` des
  améliorations homonymes ; 10-23 « riled up » = « vénèr » ; 10-22 invulnérables à contexte et résumés `briefs/` ;
  10-15 conteneurs ; 10-14 `attachOverrides` ; 10-13 FNP `mortal` ; 10-09 Incursion 3 → 2 DP, démons des légions
  500/1000/1500 ; 10-08 `det-allies:`.

## Automatismes en place

- Routines : **veille game-datacards** `trig_01LeEKKKSbD2SyUgmXjRYSgn` (13:12 Paris, pousse sur `veille-gdc/v<N>[-r<k>]`,
  « TEXTE À FOURNIR ») ; **MFM cowork** `trig_01UwCB1pdXMJSda5aaWxM5rQ` (`pousse.sh`, `abandons.json`, `verifie.sh`).
- `src/data/legends-names.json` (appli) : `test:legends-names` ROUGE si le MFM change les noms Legends →
  `npm run gen:legends-names`. Hook de démarrage : `.claude/hooks/session-start.sh` des deux dépôts.
