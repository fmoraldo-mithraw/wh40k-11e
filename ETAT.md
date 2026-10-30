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
- Pack FR **13 072** clés ; résumés **4 220** capacités (4 156 entrées par langue, 100 %) ; socles **1 010** (+ alias).
- game-datacards suivi : données **995**, commit `6f98bb1`, export du 2026-10-16T18:38 (`editor/sources/game-datacards.json`).
- `editor/mfm/bodyguard-audit.mjs --all` : **389/389** ; golden des rattachements (appli) **4109** paires ;
  MFM : `apply.mjs` 1 329 fiches (Titans compris), « À ME RENVOYER » **0**, `dp-audit` aligné **et** symétrique.

## Questions ouvertes à l'utilisateur (ne pas inventer — CLAUDE.md règle 6)

1. *(Mise de côté le 2026-10-29.)* **Socles absents du guide** : 40 fiches vivantes (surtout le tronc Space Marines).
2. **README de l'appli** (question produit) : l. 48 annonce « Crédits (Phase 2) : forfait 5 € ou recharges, Stripe
   puis PayPal » alors que le code a des recharges Stripe ponctuelles (pack-5/pack-10) et un simple lien de don
   paypal.me ; « BYOK Anthropic » (l. 44, 98-99, 186, 207-208, 227, 229, deploy.sh:8) a disparu du code. Réécrire ?
3. **Dépendances de développement** : vite 8 (faille élevée) et fast-xml-parser 5 (modérée), versions majeures —
   seule exposition réelle : `npm run dev --host 0.0.0.0`. Monter de version ?
4. **Déploiement à faire** (serveur, dépendances mises à jour le 2026-10-30 : better-auth 1.7.14, express 4.22.3,
   DOMPurify) : `cd ~/cogitator-bellicum && git pull && ./deploy.sh`, puis `journalctl -u cogitator-bellicum -n 80 |
   grep -i 'better auth'` (aucune erreur de schéma) et une vraie connexion + « mot de passe oublié ».

## Dettes connues (pas de décision attendue)

- **Désignation par import** : une liste importée (WTC/texte) avec amélioration sur un Trygon (Subterranean Assault)
  ou un War Dog (Houndpack) n'active pas la désignation → message de validation jusqu'à la bascule manuelle.
- **Company Heroes** : Character sur la figurine Ancient (fiche officielle v995) en attente d'une sentinelle
  `amelioration-porteur-manquant` qui teste `isChar` ; **Blue Horrors** : figurines Brimstone Horror à encoder.
  (Ré-export du 16/10 trié, `editor/sources/veille/2026-10-30-v995-v995.md` ; la veille ne les redemandera plus.)

Clos le 2026-10-30 : **19 détachements de chapitre hors MFM v1.6 retirés** (avec 125 améliorations ; BT, BA, DA, SW
= MFM) ; **Gladius masqué chez les Black Templars** ; **Beacon Angelis / Amulet of Auto-chastisement = Watch Master**
(liens Warlord/Enhancements déplacés dans sa fiche) ; **Land Raider Crusader BT = fiche du tronc** (conforme à
l'officiel) ; routine MFM cowork publiée par `pousse.sh` ; branches obsolètes supprimées (historique de l'appli
archivé : tag `archive/historique-avant-2026-10-07`) ; commentaires « PROVISOIRE / ESTIMES / à confirmer » vérifiés
au MFM et retirés (SM, Orks) ; 44 balises `**^^X**^^` corrigées ; Trygon : améliorations SA seulement désigné.

## Décisions récentes (détail dans CLAUDE.md / les guides / les commits)

- 2026-10-30 : un détachement proposé par l'appli mais absent du MFM de sa faction est signalé « ◇ » par
  `dp-audit.mjs` (contrôle symétrique) ; une demande ④/⑤ déjà vérifiée au moteur va dans `editor/mfm/verifies.json`
  (empreinte du barème : revient seule si le MFM change). gdc-watch détecte les **ré-exports à version égale**
  (`--stamp`, branche `veille-gdc/v<N>-r<k>`) et juge les mots-clefs **par figurine** (`modelKeywords`).
- 2026-10-29 : **rien de Legends dans la base ni l'appli** (garde-fou `editor/audit/legends.mjs`, appli
  `src/lib/legendsNames.js`) ; **abandons** dans `editor/mfm/abandons.json` (jamais redemandés) ; le pack FR ne garde
  que les clés vivantes (mémoire : `2abf1210:translations/fr.json`) ; prose Leader/Support alignée sur l'officiel.
- 2026-10-28 : formats = table MFM « Muster Armies » (`rules.js` `MFM_BATTLE_SIZE`) ; sim-mod `kw=` jugé sur
  l'unité, `kwModels` sur la figurine (`SIM_MOD_APP_PROMPT.md`).
- 2026-10-27 : import/export rejoués choix par choix (`test:option-export`, 0 écart) ; aperçu d'import = total importé.
- 2026-10-25 : amélioration homonyme dans deux détachements : `enhDet` sur la ligne, unicité par nom.
- 2026-10-23 : traduction FR — **« riled up » = « vénèr »** (vénèr / vénère / vénèrs / vénères selon l'accord).
- 2026-10-22 : invulnérables à contexte (`vs=`, `lost=wound`, `oncePer=battle` — `STAT_MARKERS_APP_PROMPT.md`) ;
  résumés « initiation » (`briefs/`, `editor/BRIEFS_PROMPT.md`).
- 2026-10-15 : éléments mal rangés = erreur (`editor/audit/conteneurs.mjs`).
- 2026-10-14 : un document officiel plus récent que game-datacards l'emporte (`attachOverrides` du manifeste).
- 2026-10-13 : FNP contre blessures mortelles = Devastating Wounds uniquement (drapeau `mortal`).
- 2026-10-09 : Incursion : un détachement à 3 DP coûte 2 DP (modifier natif, `DETACHMENT_DP_APP_PROMPT.md`) ;
  démons des légions 500/1000/1500 pts, aucun Warlord démon.
- 2026-10-08 : alliés de détachement — marqueur `det-allies:` (`DETACHMENT_ALLIES_APP_PROMPT.md`).

## Automatismes en place

- Routine **veille game-datacards** `trig_01LeEKKKSbD2SyUgmXjRYSgn` : quotidienne 13:12 (Europe/Paris), session
  neuve, détecte nouvelle version **ou ré-export**, pousse seulement sur `veille-gdc/v<N>[-r<k>]` (fusion humaine),
  liste les entrées manquantes en « TEXTE À FOURNIR ».
- Routine **MFM cowork** `trig_01UwCB1pdXMJSda5aaWxM5rQ` : publie par `editor/bin/pousse.sh`, jamais de force-push,
  respecte `abandons.json`, valide par `editor/bin/verifie.sh`.
- `src/data/legends-names.json` (appli, `npm run gen:legends-names`) : `test:legends-names` passe au ROUGE quand le
  MFM rafraîchi change les noms Legends — relancer la génération.
- Hook de démarrage de session (`.claude/hooks/session-start.sh` des deux dépôts).
