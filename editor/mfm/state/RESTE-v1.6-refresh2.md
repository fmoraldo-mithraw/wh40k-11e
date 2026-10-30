# MFM v1.6 (dump re-extrait du 2026-10-27, `ef2ed29`) — ce qui reste

Passe cowork du 2026-10-28 (`editor/mfm/COWORK_TASK.md`) sur le dump poussé en
`ef2ed29` (« extraction anglaise vérifiée contre la page rendue — bloc SUPPORT
des fiches et étiquettes “… UPDATED” récupérés »). **Même MFM v1.6** que les
deux intégrations précédentes (`RESTE-v1.6.md`, `RESTE-v1.6-refresh.md`) :
aucun prix ne change côté Games Workshop. Ce qui change est le **parse**, et
cette fois il **progresse** (le correctif parser annoncé dans
`RESTE-v1.6-refresh.md` a été appliqué et validé sur le site le 2026-10-27).

## État des audits — tout vert

- `build-map` → matrices régénérées **identiques** à celles poussées par le
  cron (arbre de travail propre) ; 1321/1365 unités (96,8 %), **977
  améliorations mappées, 0 non mappée**.
- `apply.mjs` → **0 delta points, 0 delta amélioration** ; résidu 33 lignes
  (détail ci-dessous), **le bloc ② a disparu** (13 fantômes résorbés).
- `dp-audit` → DP, Force Dispositions et UNIQUE alignés.
- `wpn-audit` → 0 écart (130 conformes).
- `tier-audit` → 0 seuil à corriger, 6 « ? » (encodages non standard conformes,
  détaillés dans `RESTE-v1.5-refresh.md` — aucune de ces factions n'est touchée).
- `enh-leaders.mjs` → **13 octrois LEADER/SUPPORT, 0 lien à ajouter** : le
  contrôle croisé MFM → base, aveugle depuis la régression d'extraction, est
  **rétabli et vert** (les 12 LEADER + Murdermind SUPPORT sont bien en base).
- `valider.mjs` → 0 erreur, 444 ids dupliqués (= ligne de base, 0 dépassement),
  0 `defaultSelectionEntryId` cassé.

**Aucune écriture de données.** Ce tir pose le marqueur et consigne le constat
neuf ci-dessous.

## ⚑ CONSTAT NEUF — listes de rattachement en retard sur le MFM (16 écarts)

Le dump re-extrait apporte deux informations que les passes précédentes
n'avaient pas :

1. le **bloc SUPPORT des fiches** (`support_targets`, 87 fiches) ;
2. l'étiquette **« BODYGUARD UNITS UPDATED »** sur les **22 fiches** dont GW a
   changé la liste d'unités menées / rejointes en v1.6.

`apply.mjs` ignore volontairement cette étiquette (les rattachements de la base
suivent la **fiche officielle**, `attachesTo` de game-datacards, posée par
`editor/translations/gdc-attach.cjs`) — personne ne comparait donc les deux
sources. Nouvel outil de contrôle, **lecture seule** :

```sh
node editor/mfm/bodyguard-audit.mjs [dir-dump] [--all]
```

Résultat sur les 22 fiches étiquetées : **6 listes conformes, 16 écarts**, tous
dans le même sens (le MFM liste une cible que la base n'a pas ; **aucun** lien
en trop) :

| Faction | Fiche | Sens | Absent(s) en base |
|---|---|---|---|
| Adeptus Custodes | SHIELD-CAPTAIN | leader | Sagittarum Custodians Sodality |
| Adeptus Custodes | SHIELD-CAPTAIN ON DAWNEAGLE JETBIKE | leader | Gyrfalcon Jetbike Sodality |
| Adeptus Custodes | TRAJANN VALORIS | leader | Allarus Custodians, Aquilon Terminators (2 variantes), Sagittarum Custodians Sodality |
| Dark Angels | BELIAL | leader | Terminator Assault Squad |
| Space Marines | MARNEUS CALGAR | leader | Terminator Assault Squad, Terminator Squad, Vanguard Veteran Squad, Victrix Honour Guard |
| Space Marines | ADRAX AGATONE | leader | Vanguard Veteran Squad |
| Space Marines | CAPTAIN TITUS | leader | Vanguard Veteran Squad |
| Space Marines | CHIEF LIBRARIAN TIGURIUS | leader | Vanguard Veteran Squad |
| Space Marines | KOR’SARRO KHAN | leader | Vanguard Veteran Squad |
| Space Marines | WARDENS OF ULTRAMAR | support | Vanguard Veteran Squad |
| SM + BT/BA/DA/DW/SW | JUDICIAR (6 fiches) | support | Vanguard Veteran Squad |

Les 16 écarts se répartissent en **deux classes de nature différente** :

### A. « VANGUARD VETERAN SQUAD » (10 écarts) — probable imprécision du MFM

La fiche « Vanguard Veteran Squad » **à pied n'existe pas en 11e** (décision du
2026-10-22, déjà close dans `ETAT.md`) : la base ne connaît que « **Vanguard
Veteran Squad with Jump Packs** » (`9e9c-bf4d-2d40-be82`). Cette entrée **est**
liée en base, mais par **4 meneurs seulement**, tous thématiquement à réacteurs
dorsaux : **Commander Dante** (BA), **Kayvaan Shrike** (RG), **Captain with Jump
Pack** et **Chaplain with Jump Pack** (tronc SM).

Le bloc bodyguard du MFM l'attribue en plus à 10 fiches **sans** réacteur
(Judiciar ×6, Marneus Calgar, Adrax Agatone, Captain Titus, Chief Librarian
Tigurius, Kor'Sarro Khan, Wardens of Ultramar). Comme le nom cité par le MFM ne
correspond à **aucune** fiche de son propre barème de points, deux lectures
restent ouvertes et **seul l'utilisateur peut trancher** :

- le MFM désigne bien l'escouade à réacteurs → 10 liens à ajouter ;
- le MFM traîne le nom générique de la fiche à pied disparue → rien à faire, et
  la base (4 meneurs à réacteurs) est plus juste que le MFM.

La répartition observée (seuls les meneurs à réacteurs portent le lien) plaide
pour la **seconde** lecture, mais ce n'est pas une preuve.

### B. Écarts hors Vanguard (6) — vraisemblablement réels

Ceux-là citent des fiches qui existent bel et bien, dans la clôture d'import du
meneur, et n'ont aucune ambiguïté de nom :

- **TRAJANN VALORIS** : Allarus Custodians, Aquilon Terminators (2 variantes),
  Sagittarum Custodians Sodality — 4 cibles sur 9 absentes ;
- **SHIELD-CAPTAIN** : Sagittarum Custodians Sodality ;
- **SHIELD-CAPTAIN ON DAWNEAGLE JETBIKE** : Gyrfalcon Jetbike Sodality ;
- **BELIAL** : Terminator Assault Squad ;
- **MARNEUS CALGAR** : Terminator Squad, Terminator Assault Squad, Victrix
  Honour Guard (Calgar menant des Terminators est canonique).

Deux causes possibles, **non tranchables depuis ce conteneur** (pas de réseau
vers game-datacards, pas d'instantané local) :

- **Instantané game-datacards en retard** : version suivie **995**, commit
  `408fa9e`, `updated 2026-10-16` (`editor/sources/game-datacards.json`). Si GW
  a publié les nouvelles listes après coup, la veille quotidienne
  (`editor/SOURCE_GAME_DATACARDS.md`) les rapportera.
- **Appariement de nom dans `gdc-attach.cjs`** : il gère la scission dans le
  sens *officiel scindé → notre fiche fusionnée* (cas Eradicator Squad,
  commentaire ligne 15), pas l'inverse. À vérifier avec l'instantané en main.

**Rien n'a été écrit** (CLAUDE.md règle 6, et la fiche officielle fait foi) :
poser ces liens à la main serait **défait au prochain `gdc-attach --write`,
qui retire les liens que la fiche officielle ne porte pas**.

### Reste à faire à la main

1. **Arbitrage utilisateur sur la classe A** (« VANGUARD VETERAN SQUAD ») : le
   MFM désigne-t-il l'escouade à réacteurs dorsaux pour ces 10 meneurs, ou
   traîne-t-il le nom de la fiche à pied disparue ? → question ouverte dans
   `ETAT.md`.
2. **Classe B** : rafraîchir la veille game-datacards
   (`editor/SOURCE_GAME_DATACARDS.md`) puis
   `node editor/translations/gdc-attach.cjs <gdc>/11th/gdc --write`, et
   relancer `node editor/mfm/bodyguard-audit.mjs` → les 6 écarts doivent tomber.
3. S'ils subsistent, corriger l'appariement de nom de `gdc-attach.cjs` (sens de
   scission inverse) — là où l'instantané officiel est lisible.

## Résidu `apply.mjs` inchangé — déjà tranché, ne rien en faire

- **① datasheets absentes (15)** : ASTRAEUS et THUNDERHAWK GUNSHIP (tronc SM,
  6 slugs), ARES GUNSHIP et ORION ASSAULT DROPSHIP (Custodes), GARGANTUAN
  SQUIGGOTH (Orks) — abandons actés par l'utilisateur (Ares / Orion le
  2026-10-22 ; Astraeus, Thunderhawk Gunship et Gargantuan Squiggoth le
  2026-10-29, voir plus bas). Encodés depuis le 2026-10-29 dans
  `editor/mfm/abandons.json` : `build-map` les range dans `abandoned` (plus dans
  `unmapped`), `apply` ne les liste plus en ① mais en « ℹ abandonné », et
  `gdc-watch` classe leurs fiches amont en 🔇 bruit.
- **④ coût porté par les modèles (15)** et **⑤ prix à composition (3)** :
  barèmes vérifiés conformes, hors périmètre d'`apply`.
- **2 lignes AUTO Custodes** (`CALADIUS GRAV-TANK`, `VENATARI WITH VERUTUM
  LANCES` — « WARGEAR COSTS REMOVED ») sont des no-op : « aucune option payante
  retirée en bdd ».
- Le bloc **②** (13 améliorations fantômes `LEADER:` / `SUPPORT:`) a **disparu**
  avec le correctif parser — plus rien à y faire.

## Pourquoi le marqueur est posé

Toutes les factions sont intégrées côté **points** : 0 delta, 5 audits verts,
validation propre. Les 16 écarts de rattachement ne sont pas du ressort de cette
tâche (hors périmètre d'`apply` par conception) et **aucun tir ultérieur de la
routine ne les résorberait** : ils se corrigent avec la veille game-datacards,
là où le réseau et l'instantané officiel sont disponibles. Laisser le marqueur
en arrière ferait tourner la routine à vide et brouillerait la détection d'un
*vrai* nouveau MFM.

## Suite du 2026-10-29 — écarts traités (réseau ouvert)

game-datacards joignable : la tête est **toujours la v995** (celle de la base). Elle
portait **déjà** les cibles de la classe B : les écarts ne venaient pas d'un
instantané en retard mais de **trois angles morts d'appariement de
`gdc-attach.cjs`** (les deux premières causes envisagées plus haut étaient
fausses ; la troisième, juste, sous une autre forme) :

| Angle mort | Fiches restées hors synchronisation |
|---|---|
| tiret insécable U+2011 de la source (« Shield‑Captain ») non normalisé | Shield-Captain, … in Allarus Terminator Armour, … on Dawneagle Jetbike, Knight-Centura |
| fiche racine `hidden` exposée par un entryLink visible ignorée | Marneus Calgar (« HIDDEN UNTIL LEGENDS », proposé par l'appli) |
| nom officiel ≠ le nôtre, sans passer par `aliases.json` | Eradicator Squad with melta rifles (Vulkan He'stan), Ancient in Terminator Armour |

Les recommandations `gdc-attach --only "Trajann Valoris" / "Belial"` de la veille
v981 n'avaient en outre jamais été exécutées. Outil corrigé, `--write` relu :
**10 liens ajoutés, 0 retiré** — Trajann → Allarus Custodians, Aquilon ×2 ;
Shield-Captain on Dawneagle → Gyrfalcon Jetbike Sodality ; Belial → Terminator
Assault Squad ; Calgar → Terminator Squad, Terminator Assault Squad, Victrix Honour
Guard, Eradicator Squad with Heavy Bolters ; Vulkan → Eradicator Squad. Golden des
rattachements de l'appli régénéré (4016 → 4026 paires, exactement ces 10).

**Classe A tranchée par la preuve** : le site du MFM v1.6 (interrupteur « Show
Legends ») range « VANGUARD VETERAN SQUAD » (à pied, 5 fig. 120 / 10 fig. 240)
dans sa section **LEGENDS** — ce n'est pas une imprécision du MFM, c'est une fiche
Legends, hors base (décision du 2026-10-22). Idem « SAGITTARUM CUSTODIANS
SODALITY » et « CUSTODIAN GUARD SODALITY WITH ADRASITE / PYRITHITE SPEARS ». Rien
à lier. Liste extraite : `editor/mfm/legends.json` (`mfm_parser.py legends`,
424 fiches, 30 factions) ; aucune fiche de la base n'est Legends-seulement.

**Audit fiabilisé** (`bodyguard-audit.mjs`) : meneur résolu par la matrice de sa
faction, Legends classées, `leader-kw` et `attachOverrides` reconnus. Étiquetées :
22/22 conformes ; `--all` : **389/389** (l'ancien audit en voyait 106, presque
tous des unions d'homonymes ou des cibles Legends).

### Tranché par l'utilisateur le 2026-10-29 — et fait

Consigne : « Je ne veux pas les fiches Legends dans la base. Tout ce qui a trait à
des fiches Legends n'a pas sa place dans l'appli ni la base » ; trancher le reste sur
le MFM.

1. **Pont vers la Vanguard à réacteurs** : `leader-kw: Vanguard Veteran Squad`
   (Lieutenant, Ancient, Wardens of Ultramar) retiré, catégorie homonyme greffée sur
   la Vanguard with Jump Packs retirée (3 traits de Croisade reciblés sur sa propre
   catégorie). Le graphe de l'appli le recréait aussi depuis la **prose** : retiré là
   aussi (−25 classes de mots-clefs au golden).
2. **Prose Leader/Support** : réécrite depuis la fiche officielle (= MFM) sur 79
   fiches, Legends exclues, traduction FR posée (`gdc-attach.cjs --prose`). L'appli
   suivait la PROSE : le Judiciar ne rejoignait que 5 unités au lieu de 11.
   **Judiciar** et **Sanguinary Priest** sont Support (aptitude renommée, liens « Can
   Lead » retirés — le Sanguinary Priest « menait » Captain et Lieutenant).
3. **Purge Legends** : bibliothèque « Astartes Heresy Legends » supprimée (2 profils
   Damaged relogés), Death Company Intercessors et Land Raider Banisher retirées
   (fiches cachées que l'appli proposait, absentes du MFM et de la fiche officielle),
   Marneus Calgar n'est plus « HIDDEN UNTIL LEGENDS », conditions mortes sur des fiches
   Legends (Gabriel Seth, Logan on Stormrider, Daemonhost, Jokaero, Proteus Kill Team)
   retirées, 199 catégories + statlines + équipements orphelins de fiches Legends
   retirés, 163 noms Legends retirés du pack FR. Outils verrouillés (gdc-attach,
   gdc-watch, gen-stat-markers, bodyguard-audit).
4. **Oubliés de la routine, corrigés** : prix de répétition en double (Ironstrider
   Ballistarii +15, Lokhust Heavy Destroyers +10 — BattleScribe surfacturait la 3e
   unité), lascannon de l'Ironstrider compté deux fois (100 au lieu de 90 sous
   BattleScribe), matrices régénérées, commentaire périmé de l'Invader ATV.

Audit final : `bodyguard-audit --all` 389/389 (listes, `leader-kw`, proses), apply
0 delta, dp/wpn/tier-audit verts, enh-leaders 0 lien à ajouter, valider.mjs 0 erreur,
436 ids dupliqués (re-figé).

### Reste à arbitrer (utilisateur)

- ~~**Astraeus, Thunderhawk Gunship (tronc SM), Gargantuan Squiggoth (Orks)** : au
  barème **principal** du MFM v1.6 (pas Legends), absents de la base. Les RESTE
  précédents les disent « abandonnés le 2026-10-22 », mais aucune trace de cette
  décision dans ETAT (seuls Ares / Orion y figurent). Règle 6 : fournir les fiches
  (game-datacards v995 les a) ou acter l'abandon. Incohérence liée : le Thunderhawk
  Gunship des Grey Knights est en base.~~ **Tranchée le 2026-10-29 : abandon**
  (« on acte l'abandon »). Encodé dans `editor/mfm/abandons.json` avec Ares / Orion
  (abandon du 2026-10-22) ; socles retirés de `editor/base-sizes.json` (et de la
  copie de l'appli). Le Grey Knights Thunderhawk Gunship, fiche propre, reste en base.
- ~~Règle du détachement **Black Spear Task Force** (« Mission Tactics ») : le texte
  officiel cite « Kill Team Cassius (see Legends: Agents of the Imperium) ». Texte GW
  conservé tel quel (une règle ne se réécrit pas) — à retoucher seulement sur demande.~~
  **Clause retirée le 2026-10-29** (commit `bfa63a5d`, rien de Legends dans la base ni
  l'appli) : la règle dit désormais « Your army cannot include any AGENTS OF THE
  IMPERIUM DEATHWATCH units. » (traduction FR et résumé « initiation » régénérés).
