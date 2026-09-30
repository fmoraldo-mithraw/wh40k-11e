# MFM v1.5 — ce qui reste à intégrer

Passe cowork du 2026-09-30 (`editor/mfm/COWORK_TASK.md`) pour les 23
factions hors tronc Space Marines, puis passe interactive du même jour pour
les **6 slugs du tronc SM** (`space-marines`, `black-templars`,
`blood-angels`, `dark-angels`, `deathwatch`, `space-wolves`), débloquée par
la copie vendorisée du parser (`editor/mfm/vendor/bsdata-parser.mjs`).

**Toutes les factions sont intégrées** : `apply.mjs` → 0 delta auto restant ;
`wpn-audit` → 0 écart ; `tier-audit` → seul « ? » SM = Decimus Kill Team
(palier porté par le choix « 10 models », conforme) ; `dp-audit` → DP,
Force Dispositions et UNIQUE alignés.

## Ce qui a été fait sur le tronc SM

- `phase3.mjs --write` : coûts de base, paliers, prix par répétition (forme
  native) et améliorations des 6 slugs.
- `build-map.mjs` : `enhStrip` tolère « X Upgrade » sans parenthèses, la
  coquille MFM « (Upgarde) » et l'article « The » → 22 améliorations de plus
  appariées (dont Mortality Shroud, Necrons).
- Alias : ERADICATOR SQUAD WITH MELTA RIFLES → Eradicator Squad ; INVADER
  ATVS → Invader ATV (6 slugs).
- À la main : Eradicator Squad with Heavy Bolters (palier 6 modèles = 200,
  dès 4) ; Crusader Squad BT (160 / 305) ; Wolf Guard Headtakers (3 = 115,
  3 + loups = 170) ; répétition retirée sur Marshal (BT) et Sanguinary
  Priest (BA) (« REQUISITION THRESHOLDS REMOVED ») ; option Wolf Guard
  Terminators à 0 (« WARGEAR COSTS REMOVED ») ; surcoûts 10 pts Black
  Templars (Multi-melta des Gladiator/Impulsor/Repulsor/Executioner,
  Orbital Comms Array, Cyclone), Deathwing et Deathwatch Terminators
  (Cyclone) ; Gladiator Valiant BT : Multi-melta de pintle min 2/max 3 → max 1.
- Vérifiés conformes sans écriture : Firestrike Servo-Turrets (80/modèle),
  Invader ATV (65/modèle, multi-melta 5).

## Reste — données absentes de la base (rien à écrire sans source)

- **Datasheets** : ASTRAEUS, THUNDERHAWK GUNSHIP (tronc SM, 6 slugs) ;
  GARGANTUAN SQUIGGOTH (Orks).
- **Détachements entiers** : DEATHWATCH SUPPORT (SM, BT, BA, DA, SW —
  amélioration Beacon Angelis 25 pts), CERAMITE SENTINELS et MEDUSA'S WRATH
  (Space Marines), FIST OF THE GOD-EMPEROR et VOW-SWORN CRUSADERS (Black
  Templars — dont l'amélioration Righteous Fervour).
- **Amélioration** : Unto Death (Blood Angels, Angelic Inheritors, 15 pts).
