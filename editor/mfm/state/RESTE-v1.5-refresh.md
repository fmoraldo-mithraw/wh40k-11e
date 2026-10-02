# MFM v1.5 (dump rafraîchi du 2026-10-02) — ce qui reste

Passe cowork du 2026-10-02 (`editor/mfm/COWORK_TASK.md`) sur le dump poussé
par le cron serveur en `a3afe47`. Games Workshop a republié le MFM v1.5 avec
des prix corrigés sur le **tronc commun Space Marines** et des retraits de
mots-clefs **UNIQUE** sur plusieurs détachements.

**État** : `apply.mjs` → 0 delta auto restant ; `dp-audit` → DP, Force
Dispositions et UNIQUE alignés ; `wpn-audit` → 0 écart (131 conformes) ;
`tier-audit` → 0 ✗ ; `valider.mjs` → 0 erreur, 0 id dupliqué nouveau,
0 `defaultSelectionEntryId` cassé.

## Fait

- Tronc SM (6 slugs) : 37 bases, 14 paliers, 18 répétitions ajustées,
  1 répétition nouvelle (Invictor Tactical Warsuit, Δ15 au 3e). Seuils des
  Land Raider « 1ST TO 2ND / 3RD + » → « 1ST / 2ND + » (atLeast 3 → 2).
- Space Wolves : barème des Wolf Guard Headtakers (lignes auparavant
  décalées dans le dump) — base 115 → 85, palier « 3 Headtakers + loups »
  170 → 115.
- UNIQUE retirés : Aeldari (ACROBATIC ×4), Drukhari (COVENS, KABAL, WYCH
  CULT ×2 chacun), Genestealer Cults (PURESTRAIN ×2).
- Vérifiés conformes sans écriture : Thunderwolf Cavalry et Wolf Guard
  Terminators (nouveau profil MFM « per Storm Shield = 5 » — déjà porté par
  le modèle-variante « w/ storm shield » à 5) ; Agents de l'Imperium (les
  14 « changements » détectés ne sont que l'ordre des deux occurrences
  armée/allié, prix identiques — cf. `AGENTS_DUAL_COST_PROMPT.md`) ;
  Firestrike Servo-Turrets, Invader ATV, Crusader Squad BT, Gretchin,
  Tidewall Shieldline (barèmes inchangés dans le dump).

## À ARBITRER — overrides `chapter-cost` périmés (bloquant, non corrigé)

`Imperium - Space Marines.cat` porte **16 modifiers `set` de coût pts
conditionnés `primary-catalogue`** (marqueur `chapter-cost:`) sur 8 entrées
partagées. Or le MFM **ne différencie plus les 6 chapitres** : pour les
162 bsId du tronc comparés slug par slug, **0 divergence** — ni dans le dump
rafraîchi, ni dans le précédent. Ces overrides contredisent donc le MFM, et
l'alignement des bases ci-dessus en a **réactivé quatre** qui étaient
jusqu'ici inertes (leur valeur égalait la base générique).

| entrée | base MFM (tous chapitres) | override en base |
|---|---|---|
| Captain with Jump Pack | 90 | BA 95 |
| Assault Intercessor Squad | 85 / 170 | BA 90 / 160 |
| Bladeguard Veteran Squad | 90 / 180 | BA 95 / 180 |
| Vanguard Veteran Squad with Jump Packs | 110 / 220 | BA 115 / 220 |
| Outrider Squad | 80 / 160 | BA 85 / 150 |
| Repulsor Executioner | 260 | BA, DA, DW, SW 235 |
| Chaplain with Jump Pack | 75 | BA 80 |
| Assault Intercessors with Jump Packs | 95 / 190 | BA 105 / 200 |

Correction identifiée : **retirer ces 16 modifiers** (chaque chapitre
retombe alors sur le prix MFM — aucune valeur à inventer). Le retrait a été
**refusé par le garde-fou de la session** (suppression locale
irréversible) : il demande une validation humaine. Les overrides de **DP**
par chapitre, eux, restent conformes (`dp-audit` sans écart) et ne doivent
pas être touchés.

Tant que ce point n'est pas tranché, un roster Blood Angels (et
Dark Angels / Deathwatch / Space Wolves pour le Repulsor Executioner) paie
ces 8 unités au prix de l'override, non au prix MFM.

## Reste — données absentes de la base (rien à écrire sans source)

Inchangé par rapport à `RESTE-v1.5.md` :

- **Datasheets** : ASTRAEUS, THUNDERHAWK GUNSHIP (tronc SM, 6 slugs) ;
  GARGANTUAN SQUIGGOTH (Orks).
- **Détachements entiers** : DEATHWATCH SUPPORT (SM, BT, BA, DA, SW —
  amélioration Beacon Angelis 25 pts), CERAMITE SENTINELS et MEDUSA'S WRATH
  (Space Marines), FIST OF THE GOD-EMPEROR et VOW-SWORN CRUSADERS
  (Black Templars — dont l'amélioration Righteous Fervour).
- **Amélioration** : Unto Death (Blood Angels, Angelic Inheritors, 15 pts).
- **Composition** : Gretchin (« 10 Gretchin » / « 11 Gretchin ») et Tidewall
  Shieldline (« + 1 Tidewall Defence Platform ») restent hors périmètre
  d'apply, barèmes vérifiés conformes.
