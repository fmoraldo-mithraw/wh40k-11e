# Résumés « initiation » des capacités (`briefs/en.json`, `briefs/fr.json`)

Mode « initiation » de l'export PDF de liste (appli) : chaque capacité d'unité
est imprimée en **une ligne télégraphique** au lieu de sa prose, dans la langue
de l'interface. Les `.cat` restent la source de vérité ; les résumés vivent
dans `briefs/<lang>.json`, clefés par nom de capacité (ou `nom#empreinte` pour
les 76 homonymes à textes différents), avec l'empreinte `src` du texte anglais :
un errata qui change la prose rend le résumé **périmé** (audit).

| Outil | Rôle |
|---|---|
| `node editor/briefs/extrait.mjs "<fichier.cat>" [--out lot.json]` | capacités sans résumé à jour : `[{ key, name, src, text }]` |
| `node editor/briefs/fusionne.mjs <lot-rédigé.json> "<fichier.cat>"` | contrôle (clef connue, non vide, ≤ 220 car., pas de flèche) et écrit en/fr |
| `node editor/audit/briefs.mjs [--manquants]` | couverture par fichier, périmés, orphelins (code 1 si périmé/orphelin) ; enchaîné par `valider.mjs` |

Capacités **jamais résumées** (`SKIP` dans `editor/briefs/lib.mjs`) : Leader,
Invulnerable Save, Supreme Commander, Support, Damaged, Attached Unit, Transport
et les règles de base (Deep Strike, Scouts, Feel No Pain, Deadly Demise…) — le
PDF les rend depuis les données ou par leur seul nom.

## Règles de rédaction (les deux langues)

- **Une ligne, ≤ 220 caractères**, sans le nom de la capacité (imprimé par le
  PDF). Commencer par le déclencheur, puis « : » et l'effet. Alternatives ou
  étapes séparées par « ; ». Listes à puces « ■ » → « A ; B ».
- **Pas de flèche** (→ ⇒ : polices PDF WinAnsi) — écrire « : » ou « = ».
- **Mots-clefs d'unité en MAJUSCULES** tels que la source (`^^Psyker^^` →
  PSYKER, `**Infantry**` → INFANTRY / INFANTERIE) : ils seront surlignés quand
  un stratagème les cible. Retirer tout balisage `**` `^^`.
- **Règles de base entre crochets** : `[Lethal Hits]` / `[Touches Fatales]`,
  `[Sustained Hits 1]` / `[Touches Soutenues 1]`, `[Devastating Wounds]` /
  `[Bless. Dévast.]`, `[Precision]` / `[Précision]`, `[Lance]`, `[Anti-X 4+]`,
  `[Ignores Cover]` / `[Ignore le Couvert]`, `[Assault]` / `[Assaut]`.
- **Chiffres et dés conservés** tels quels (D6+1", 2D6, D3 BM, 5+, +1 A).
  Ne jamais inventer ni arrondir ; omettre les rappels de règles, le
  bookkeeping (« placer un pion ») et les reformulations.
- Abréviations FR : phase de Cdt / Mvt / Tir / Charge / Combat ; BM (blessures
  mortelles) ; PC ; 1×/bataille, 1×/round, 1×/phase ; A, CT, CC, F, E, PA, D,
  SV, Inv, PV, OC, Cd ; « sauf MONSTRE/VÉHICULE » ; « à 6" ou moins » ;
  « relance des jets pour toucher/blesser » ; « ta phase » = la tienne,
  « phase de Tir adverse » = celle de l'adversaire.
- Abréviations EN : Command/Movement/Shooting/Charge/Fight phase ; MW ; CP ;
  once per battle/round/phase ; A, BS, WS, S, T, AP, D, Sv, Inv, W, OC, Ld ;
  « unless MONSTER/VEHICLE » ; « within 6" » ; « re-roll Hit/Wound rolls ».
- Terminologie FR = celle de `translations/fr.json` (noms d'unités, de règles
  et de phases officiels) ; nom d'unité ou d'arme cité → forme française connue,
  sinon anglais.

Exemples (tirés du modèle) :
- Armour of Faith — EN « Each time an attack is allocated to this model: -1 D (min 1). » / FR « attaque allouée à cette figurine : -1 Dégât (min 1). »
- Crusade of Wrath — FR « attaques de mêlée de l'unité : +1 A et +1 F. »
- Righteous Zeal — FR « phase de Tir adverse, chaque fois qu'une unité ennemie tire et détruit ≥1 figurine de l'unité : mouvement d'élan de D6+1". »
- Temple Relics — FR « ta phase de Cdt, s'il reste ≥1 Servitor : 1 choix jusqu'à ta prochaine phase de Cdt : Bannière +1 Avance et Charge ; Colonne +1 E ; Eau du Bénitier : PA des armes de mêlée améliorée de 1. »

## Lot rédigé (entrée de `fusionne.mjs`)

```json
{ "<key tel quel>": { "en": "…", "fr": "…" }, … }
```
Une entrée par élément de l'extrait, **aucune omise**.

## Ordre de travail

Un fichier `.cat` après l'autre, ordre alphabétique des fichiers ; un commit par
fichier (« <Faction> : résumés initiation (N capacités) »). Un gros fichier
(> 120 capacités) se rédige par tranches (`editor/briefs/tranche.mjs`).
