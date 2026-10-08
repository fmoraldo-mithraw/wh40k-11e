# ÉTAT — fichier de reprise (à lire en début de tâche, à tenir à jour en fin de tâche)

> But : reprendre le travail **sans relire l'historique**. Court par construction :
> ≤ 80 lignes ; ce qui est réglé sort d'ici (le détail vit dans les commits et les guides).
> Dernière mise à jour : 2026-10-08.

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
- Tests appli : **60/60** suites (`scripts/dev/tests.sh`).
- game-datacards suivi : version de données **972** (`editor/sources/game-datacards.json`).

## Questions ouvertes à l'utilisateur (ne pas inventer — CLAUDE.md règle 6)

1. **Vanguard Veteran Squad (à pied)** — fiche présente au MFM, absente de la base : texte à fournir.
2. **Eradicator Squad (scission MFM)** — texte de la nouvelle fiche à fournir.
3. **Grey Knights** — 43 divergences `gdc-apply-weapons.cjs --trust` en attente de décision.
4. **Démons des légions** (Tallyband Summoners, Carnival of Excess, Changehost of Deceit,
   Khorne Daemonkin) — plafond fixé à **1000 pts quel que soit le format** (avant :
   500/1000/1500 selon Incursion/Strike Force/Onslaught) : à confirmer. Texte exact de la
   restriction (absent de game-datacards) ? Warlord démon autorisé (rien encodé) ?
5. **Deathwatch Support** — lecture retenue : une KILL TEAM ne porte que des améliorations
   de ce détachement ; le plafond de 500 pts compte options et améliorations. À confirmer.

## Décisions récentes (détail dans CLAUDE.md / les guides)

- 2026-10-08 : la base suit le MFM, toute entrée MFM absente se signale (règle 6).
- 2026-10-08 : alliés de détachement — marqueur `det-allies:` (Deathwatch Support 500 pts ;
  variante `native` démons des légions 1000 pts) — `editor/DETACHMENT_ALLIES_APP_PROMPT.md`.
- 2026-10-07 : la fiche officielle (game-datacards) fait foi à 100 %, retraits compris ;
  seule exception : CT « 7+ » d'une arme Torrent = « - » (N/A).
- 2026-09-30 : Epic Hero porteur d'amélioration seulement s'il est désigné par les données (règle 1).

## Automatismes en place

- Routine **veille game-datacards** `trig_01LeEKKKSbD2SyUgmXjRYSgn` : quotidienne 13:12
  (Europe/Paris), session neuve, pousse seulement sur `veille-gdc/v<N>`, liste les entrées
  manquantes en « TEXTE À FOURNIR ».
- Hook de démarrage de session (`.claude/hooks/session-start.sh` des deux dépôts) :
  dépendances de l'appli, cache de données synchronisé, variables d'environnement.
