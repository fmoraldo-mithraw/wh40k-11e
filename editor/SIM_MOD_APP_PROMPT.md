# SIM_MOD — bonus de capacités/améliorations pour le simulateur de dégâts

Prompt autonome pour l'application consommatrice (simulateur de dégâts).
But : matérialiser, **côté données**, les modificateurs offensifs accordés
par une **capacité de datasheet** ou une **amélioration** (ex. la compétence
de Castellan Crowe), pour que le simulateur puisse les proposer en bascule
(toggle) au lieu de forcer l'utilisateur à les saisir à la main.

## Ce qui est dans la base vs dans l'appli

- **Base** : un marqueur **déclaratif** `<comment>sim-mod: …</comment>`,
  posé en **premier enfant** de la `selectionEntry` de l'**unité/modèle**
  qui possède la capacité (même emplacement que `repeat-cost`/`chapter-cost`).
  Plusieurs effets = plusieurs lignes `sim-mod:` dans le même `<comment>`.
  Le marqueur ne décrit **que** ce qui touche le calcul de dégâts ; il ne
  remplace pas la prose de la capacité (qui reste la source de vérité).
- **Appli** : le parsing du marqueur, l'UI de bascule (une puce par
  `sim-mod`), et le **repli** des effets actifs dans l'objet `mods` passé à
  `simulate()`. Les mots-clefs d'**arme** ([SUSTAINED], [LETHAL], anti-X…)
  et les règles d'**armée universelles** restent gérés côté appli comme
  avant — `sim-mod` ne couvre **que** les bonus conditionnels portés par une
  capacité/amélioration d'unité.

## Grammaire

```
sim-mod: [source="…"] <effet>[=valeur] … [scope] [condition] …
```

Tokens (ordre libre, séparés par des espaces ; les valeurs avec espaces
sont entre guillemets) :

- `source="…"` — nom de la capacité/amélioration (affiché sur la puce).
- **Effets** (repliés dans `mods`) :
  - `attacks=+N` `str=+N` `ap=+N` `dmg=+N` `hit=+N` `wound=+N` — bonus
    numériques signés (sur A / S / PA / D / jet de touche / jet de blessure).
  - `reroll=hit` | `reroll=hit1` | `reroll=wound` | `reroll=wound1` |
    `reroll=dmg` — relances (full vs « 1 » uniquement).
  - `lethal` `dev` `ignores-cover` — drapeaux (Lethal Hits, Devastating
    Wounds, ignore le couvert).
  - `sustained=N` | `sustained=D3` — Sustained Hits N.
  - `crit-hit=N` `crit-wound=N` — seuil de critique abaissé.
  - `twin-linked` — relance de blessure pleine.
  - `anti=KEYWORD:N+` — Anti-KEYWORD N+.
- **Portée / conditions** :
  - `weapon="…"` — l'effet ne vaut **en théorie** que pour cette arme
    (affiché sur la puce ; voir limite ci-dessous).
  - `when=melee` | `when=ranged` — l'effet ne s'applique qu'à l'onglet R/M
    correspondant.
  - `vs=KW[,KW…]` — ne vaut que contre une cible portant ces mots-clefs
    (ex. `vs=Character`, `vs=Monster,Vehicle`). **Conditionnel.**
  - `oncePer=battle|phase|turn` — usage limité. **Conditionnel.**
  - `onCharge` — uniquement après une charge. **Conditionnel.**
  - `conditional` (token nu) — déclencheur situationnel **non exprimable** par
    `vs`/`oncePer`/`onCharge` (portée, objectif, moitié d'effectif, immobile…) :
    la bascule démarre **décochée**, la prose reste la référence. C'est le
    qualificatif le plus fréquent de la base.
  - `faction="Nom de faction"` — le bonus ne s'affiche que si la **faction de
    l'armée courante** porte exactement ce nom. Sert aux règles d'armée d'une
    sous-faction marquées sur des entrées **partagées** (ex. `Templar Vows` sur le
    tronc `Imperium - Space Marines.cat` importé par tous les chapitres : seul un
    joueur Black Templars doit voir la puce).
  - `whileLeading` — uniquement en menant une unité. **Par défaut activé**
    (le cas courant d'un chef rattaché), pas marqué conditionnel.
  - `scope=model` — l'effet ne touche que **les armes du modèle porteur**, pas une
    escouade menée ni le reste de l'unité (« this model »/« the bearer's weapons »).
    Défaut `unit` (« this unit »/« that unit »/`whileLeading`). L'appli tague chaque
    arme et chaque sim-mod d'un `owner` (ligne d'armée) et confine les effets
    `scope=model` aux armes du même owner.
  - `kw="Mot-clef"` — l'effet ne touche que **les armes des modèles dont l'unité a ce
    mot-clef** (« weapons equipped by ^^**Paladin Squad**^^ models », « each time a
    ^^**Beast**^^ model … »). Exclut p. ex. un chef rattaché qui n'a pas le mot-clef.
    L'appli tague chaque arme des mots-clefs de son unité et filtre dessus.
    Syntaxe : `,` entre jetons = **OU** ; `&` dans un jeton = **ET**
    (`kw="Psyker&Infantry,Character"` = (PSYKER et INFANTRY) ou CHARACTER) —
    nécessaire pour les lignes CIBLE à mots-clefs composés des stratagèmes.
  - `vsTougher` — sur un `wound=+1`, le bonus n'est **appliqué par le moteur que si
    l'Endurance de la cible > la Force de l'arme** (« if its Strength is lower than
    the target's Toughness, +1 to wound », ex. Dauntless Champions / Argent Assault).
    Évalué automatiquement par cible (pas une bascule situationnelle) ; se combine
    avec `when=`, `kw=`, etc.
  - `choice="Groupe"` — la ligne fait partie d'un **choix mutuellement exclusif**
    (« select one of the following »). Les lignes d'un même `choice` sont des
    bascules radio : en cocher une décoche les autres ; une seule est pré-cochée.
    Une capacité à **tiers** (effet de base + version améliorée) s'encode plutôt
    en **deux lignes indépendantes** (base, puis amélioration `conditional`) qui
    se cumulent — le moteur prend la plus forte (`relance des 1` ⊂ `relance complète`).

## Comportement appli attendu

1. **Parser** chaque ligne `sim-mod:` en `{ source, effects:[{k,v}], weapon,
   when, vs:[], oncePer, whileLeading, onCharge, conditional }`. Un
   `sim-mod` est `conditional` s'il porte `vs`, `oncePer` ou `onCharge`.
2. **Attacher** le tableau `simMods` à l'unité (et, en cas d'unité +
   chef rattaché, **concaténer** les `simMods` de tous les modèles).
3. **UI** : une puce par `sim-mod` (libellé = `source: effets (portée)`).
   - Pré-cocher les `sim-mod` **non conditionnels** (y compris
     `whileLeading`).
   - Laisser **décochés** les conditionnels (`vs`, `oncePer`, `onCharge`).
4. **Repli** : pour chaque `sim-mod` coché, ajouter ses effets à une **copie**
   de l'objet `mods` manuel, puis appeler `simulate(profiles, target, effMods)`.
   - Respecter `when=melee|ranged` selon l'onglet actif.
   - Cumul additif pour les bonus numériques ; `max` pour les relances ;
     `min` pour les seuils de critique.
5. **Portée par arme** (`weapon="…"`) : l'effet ne doit toucher **que** les
   profils dont le nom correspond. Le moteur prend un seul `mods`, donc on lui
   passe une **surcouche par arme** : `mods.byWeapon[nomDuProfil]` = un objet
   `mods` complet (global + les effets scopés de cette arme) ; `resolveProfile`
   la substitue au `mods` global pour le profil correspondant. Un effet **sans**
   `weapon=` reste global. Une portée qui ne correspond à **aucun** profil
   activé est ignorée (le bonus n'a rien à toucher). Ainsi le +1 A de Crowe
   ne frappe que la Purifying Flame, pas le psycannon d'un Purificateur de la
   même unité.

## Règles d'armée & de détachement

Les marqueurs `sim-mod:` peuvent aussi être posés sur une **règle d'armée**
(`<rule>` de premier niveau) ou une **règle de détachement** (profil, `<rule>`
local, ou règle partagée liée par `<infoLink type="rule">`). L'appli les expose
en bascules **globales** (sans `owner` → toutes les armes), étiquetées « Armée — »
ou « Détach. — », pour la règle d'armée de la faction et les règles du/des
détachement(s) **sélectionné(s)**. Elles sont en général `conditional`
(déclencheur situationnel) — décochées par défaut.

## Stratagèmes

Les règles de **stratagème** (`<rule name="X (Stratagem, NCP)">` sous l'entrée
du détachement) portent aussi des lignes `sim-mod:` quand leur EFFET améliore
les attaques de l'unité CIBLE — dans le **même `<comment>`** que le marqueur
`strat-timing:` (les lignes se cumulent, une par ligne). L'appli les expose en
bascules pour le(s) détachement(s) **actif(s)**, étiquetées « Strat. — Nom
(NPC) », **toujours décochées par défaut** (un stratagème coûte des PC), et la
restriction de cible de la ligne TARGET est encodée en `kw=` (conjonctions via
`&`) — seules les armes des unités qui matchent sont affectées. Généré par
l'analyse des 1 359 stratagèmes ; intégrateur :
`editor/integre-sim-mods-stratagems.mjs` (idempotent, ne réécrit jamais une
ligne existante).

## Surlignage

Quand un bonus est actif, l'appli relance la simu **sans** lui et peint en
**vert** toute valeur déplacée (tableau des cibles, cartes de stats, détail
par arme) — le joueur voit exactement ce que la capacité apporte.

## Exemple — Castellan Crowe (`Imperium - Grey Knights.cat`)

```xml
<selectionEntry type="model" name="Castellan Crowe" id="9ddb-760d-8cf7-1c8a">
  <comment>sim-mod: source="Champion of the Order of Purifiers" attacks=+1 weapon="Purifying Flame" whileLeading
sim-mod: source="Foesight" reroll=hit vs=Character</comment>
  …
```

Autres exemples du pilote : Grand Master — `sim-mod: source="Might of Titan"
attacks=+3 str=+3 when=melee oncePer=battle` ; Brother-Captain —
`sim-mod: source="Hammerhand" lethal when=melee whileLeading`.
