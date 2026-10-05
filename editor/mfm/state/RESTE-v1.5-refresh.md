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

## ✅ TRANCHÉ (2026-10-02) — overrides `chapter-cost` retirés

Validé par l'utilisateur : les 16 modifiers ont été retirés. Au passage,
3 coûts posés sur des **entryLinks** masquaient la fiche (Warlock 45 au
lieu de 40 — Craftworlds, Ynnari ; Kravek Morne 120 au lieu de 130) :
alignés sur le MFM. `apply.mjs` → 0 delta.

### Historique (constat initial)

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

## Dump du 2026-10-05 — Force Dispositions multiples et détachements retirés

- Le parser conserve désormais **toutes** les Force Dispositions
  (`force_dispositions`) : 33 détachements (37 lignes slug × détachement)
  en offrent deux au choix → profils ajoutés par `dp-fix.mjs` (étendu).
  `dp-audit` → 0 écart.
- **Emperor's Shield** (Imperial Fists, règle Wrath of Dorn) : présent en
  MFM v1.3/v1.4, absent du v1.5 — retiré (confirmé par l'utilisateur :
  la règle n'existe plus depuis le codex).
- **À trancher** : *Hammer of Avernii* (Iron Hands) et *Reclamation Force*
  (Ultramarines) sont dans la même situation (présents en v1.3/v1.4,
  absents du v1.5).
- **Données absentes** (rien à écrire sans source) : *Ceramite Sentinels*
  (Imperial Fists ? 2 PD, Take and Hold ; Castellum Omnivox, Defensive
  Mastery, Honour Indefatigable, Spy-skull Data Link — 10 pts chacune) et
  *Medusa's Wrath* (Iron Hands ? 2 PD, Purge the Foe, UNIQUE: IRONSTORM ;
  Adept of the Omnissiah 25, Master of the Machine War 25, Target Augury
  Web 30, The Flesh is Weak 15) — règles, stratagèmes et textes à fournir.

## Tir cowork du 2026-10-05 13:27 UTC — clôture du dump `93e7cd2b`

Le tir précédent avait intégré ce dump (18 commits « Force Disposition au
choix » + retrait d'Emperor's Shield) **sans poser le marqueur**. Ce tir a
tout revérifié, n'a trouvé aucune écriture à faire, et **pose le marqueur**.

**Écart réel entre le dump marqué (`7ddcd8b`) et celui-ci (`93e7cd2b`)** —
même MFM v1.5, seul le parse change :

1. ajout du tableau `force_dispositions` sur tous les détachements
   (enrichissement du parser) → **déjà intégré** par le tir précédent ;
2. Orks GRETCHIN : `size` « 11 Gretchin » → « 20 Gretchin » (correction de
   lecture). La base est **conforme** : base 45, `set` 80 conditionné
   `greaterThan 10` modèles (= dès 11), composition min 10 / max 20 — donc
   10 = 45 et 20 = 80, et le palier s'applique bien dès la taille listée
   précédente + 1.

**Vérifications de ce tir** : `build-map` → matrices inchangées ;
`apply.mjs` → 0 delta points, 0 delta améliorations ; `wpn-audit` → 0 écart
(131 conformes) ; `tier-audit` → 0 ✗ ; `dp-audit` → DP, Force Dispositions
et UNIQUE alignés ; `valider.mjs` → 0 erreur, 0 id dupliqué nouveau,
0 `defaultSelectionEntryId` cassé.

Les 6 « ? » de `tier-audit` (Windriders, Decimus Kill Team, Atalan Jackals,
Aquila Kill Team ×2, Inquisitorial Agents) sont des encodages non standard
**conformes** : sélecteur de taille pour les premiers ; Inquisitorial Agents
vérifié en détail (base 50, `set` 100 dès 7 modèles, `increment` +10 et +10
conditionnés `notInstanceOf primary-catalogue` ⟹ 50/100 en armée et 60/120
en allié, exactement le double barème du MFM — cf.
`AGENTS_DUAL_COST_PROMPT.md`). Le « palier 12=120 → 0 modifier » signalé par
l'outil est donc normal : 120 s'obtient par `increment`, pas par un `set`.

### Pourquoi le marqueur est posé malgré le résidu

Le résidu restant est **identique à celui du dump `7ddcd8b`, pour lequel le
marqueur AVAIT été posé** : ce sont des données **absentes de la base** (rien
à écrire sans source) ou des entrées de base que GW ne liste plus — pas du
travail d'intégration qu'un tir ultérieur pourrait finir. Laisser le marqueur
vide ferait tourner la routine à vide toutes les heures et brouillerait la
détection d'un *vrai* nouveau MFM.

### Détachements en base absents de TOUT le MFM v1.5 (19) — arbitrage

Balayage symétrique (`dp-audit` ne contrôle que le sens MFM → base).
**Tous étaient déjà absents du dump `7ddcd8b`** : condition préexistante,
pas une régression du nouveau dump. Tous dans `Imperium - Space Marines.cat` —
le v1.5 a refondu les détachements de chapitre (tronc commun Assault
Brethren / Tacticus / Gravis… + quelques détachements propres par chapitre) :

Unforgiven Task Force · Liberator Assault Group · Company of Hunters ·
The Lost Brethren · The Angelic Host · Lion's Blade Task Force ·
Wrathful Procession · Saga of the Hunter · Saga of the Bold ·
Companions of Vehemence · Vindication Task Force · Godhammer Assault Force ·
Rage-Cursed Onslaught · Dark Age Arsenal · Interrogation Conclave ·
Legends of Saga and Song · Veterans of the Fang · The Living Miracle ·
Legacy of Grace

Déjà tranchés et retirés : *Emperor's Shield* (tir précédent) puis
*Hammer of Avernii* et *Reclamation Force* (commit `750da74`, arrivé sur
`main` pendant ce tir) — les trois sur confirmation de l'utilisateur.

Les 19 ci-dessus **restent en base** : aucun retrait n'a été fait sans
arbitrage — c'est une suppression de données, elle ne se décide pas
automatiquement. Ils ne diffèrent en rien des trois déjà tranchés : la
question est unique et porte sur l'ensemble (GW a-t-il retiré ces
détachements, ou le MFM ne les reprend-il simplement plus ?). C'est le
**seul point ouvert** de l'intégration v1.5.

Note outillage : `dp-audit` ne contrôle que le sens **MFM → base** ; ce
sens-là (base → MFM) n'a pas d'outil et a été balayé à la main. Un
contrôle symétrique dans `dp-audit` éviterait de le refaire à chaque dump.

### Correctif d'infrastructure

La branche miroir `claude/app-database-inconsistencies-nj0kqk` pointait sur
`47499f5` (22 commits de retard) : le tir précédent avait poussé `main` sans
mettre le miroir à jour. Remise à `main`. Au passage, le `main` **local** du
conteneur était resté sur `ceba5c5`, un commit abandonné par une réécriture
d'historique — d'où l'importance de pousser le miroir depuis `origin/main` et
non depuis le `main` local (`git branch -f <miroir> origin/main`).
