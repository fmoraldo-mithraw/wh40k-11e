# Marqueurs de stats — prompt autonome (application consommatrice)

Ce dépôt matérialise EN DONNÉES trois familles d'informations que les
applications extrayaient jusqu'ici de la prose GW (fragile : chaque nouveau
codex peut changer une tournure sans qu'aucun test n'échoue) :

1. **Sauvegarde invulnérable et Feel No Pain** de la fiche ;
2. **Supreme Commander** (doit être Warlord) et son miroir (ne peut pas l'être) ;
3. **cibles de chef par mots-clefs** — la seule part du graphe de chefs restée
   prose (les cibles datasheet sont déjà déclaratives via `Can Lead (MFM)`,
   cf. `LEADER_LINKS_APP_PROMPT.md`).

## Canal

Des lignes dans le `<comment>` **premier enfant** du `selectionEntry` de
l'unité — le même canal que `sim-mod:` (une ligne = un fait ; les autres
consommateurs BattleScribe ignorent les commentaires ; le round-trip est
garanti par `editor/lib`). Les genres de lignes peuvent cohabiter dans le même
commentaire.

## Grammaire

```
invuln: 4+ [model="Nom du modèle"] [conditional] [vs=ranged|melee] [lost=wound] [note="condition"] [option="Équipement"]
fnp: 5+
must-warlord
cannot-warlord
leader-kw: KW [& KW] [| KW & KW]
```

- `invuln:` — une ligne par sauvegarde. `model="X"` la restreint à un modèle
  (Ghazghkull 4+, Makari 2+ conditional) ; sans `model`, toute l'unité.
  `conditional` = situationnelle (affichage étoilé « 2+* », jamais un état de
  base). `note="…"` (optionnel, en dernier) = la CONDITION en clair
  (« against melee attacks only ») : l'appli l'affiche sous le profil
  (« * Invulnérable 4+ : … », traduite via le pack). Sans note, l'appli se
  rabat sur le texte du profil « Invulnerable Save » correspondant. Le
  générateur conserve telle quelle une ligne `invuln:` existante de même
  valeur/modèle (retouche manuelle : `conditional`, `note`).
  `option="Équipement"` (ajout 2026-10) = l'invulnérable vient d'un
  **équipement optionnel** (nom du choix d'option : « Kustom Force Field »,
  « Blastajet Force Field ») : l'appli ne la compte **que si ce choix est
  sélectionné** (ligne d'armée : sélection d'équipement ; fiche de
  catalogue : choix par défaut). Attributs dans n'importe quel ordre. Le
  générateur ne recalcule jamais une ligne à `option=` (posée à la main) et
  n'écrit plus d'invu d'équipement comme stat de fiche.
  Sans marqueur, l'appli détecte d'elle-même l'invulnérable que l'aptitude
  d'un choix d'option déclare (« The bearer has a 4+ invulnerable save »,
  « This unit has 5+ InSv » — `InSv` = abréviation 11e) et l'applique
  pareillement ; porteur unique dans une escouade → étoile + « bearer only ».
  Idem pour un bouclier **d'office sur une variante de modèle** (« Veteran
  w/ Astartes shield », « Thunderwolf w/ storm shield » : aptitude du modèle) et
  pour une aptitude logée dans un **enfant** de l'option (« Master-crafted
  Power Weapon and Storm Shield » → « Storm shield ») : invu d'unité si toutes
  les figurines la portent (variantes cumulées), sinon étoile + « bearer only ».
- **Groupes de contexte d'une invulnérable conditionnelle** (ajout 2026-10-22).
  Toute ligne `conditional` dit DANS QUEL CAS elle joue, pour que l'appli
  sache quel calcul appliquer (audit `editor/audit/invu-contexte.mjs`,
  enchaîné par `valider.mjs` : une `conditional` sans contexte = erreur) :

  | Groupe | Ligne | Calcul côté appli | Exemples |
  |---|---|---|---|
  | permanente | `invuln: 5+` | toujours | la plupart des fiches |
  | contre le tir | `invuln: 5+ conditional vs=ranged` | attaques de tir seulement ; ignorée en mêlée | Knights, War Dogs, Titans, Rangers, Kustom Force Field |
  | contre la mêlée | `invuln: 4+ conditional vs=melee` | attaques de mêlée seulement | Judiciar ; Banshees/Wyches (s'ajoute à leur `invuln:` permanente) |
  | perdue au 1er PV | `invuln: 2+ conditional lost=wound` | joue tant que la figurine n'a perdu AUCUN PV ; perdue jusqu'à la fin de la bataille ensuite (les blessures mortelles ne la font pas tomber) | Archon (Shadowfield) |
  | équipement | `invuln: 4+ conditional option="…"` | seulement si l'équipement est pris (porteur) | Kustom Force Field |

  Les groupes se combinent (`vs=ranged option="Kustom Force Field"`). Une fiche
  peut porter plusieurs lignes : la meilleure applicable au contexte de
  l'attaque l'emporte (Banshees : 5+ au tir, 4+ en mêlée ; Ynnari Wyches :
  `6+ vs=ranged` + `4+ vs=melee`). `vs=`/`lost=` impliquent l'étoile
  d'affichage ; garder `conditional` sur la ligne pour les lecteurs anciens.
  **Bonus temporaire** (« Once per battle … this model has a 3+ invulnerable
  save until the end of the phase ») : ce n'est PAS une invu de fiche mais un
  `def-mod: source="…" inv=3 oncePer=battle [when=melee]`
  (`SIM_MOD_APP_PROMPT.md`), à cocher dans l'onglet Résistance (Trajann,
  Canoness, Daemon Prince, Lelith, Benefictus, Manipulus).
- `fnp:` — UNIQUEMENT la stat de fiche, c'est-à-dire l'aptitude **nommée**
  « Feel No Pain N+ ». Les dons conditionnels (aura de Painboy, chef qui
  confère un FNP à l'escouade) ne sont PAS des stats : ils restent des
  `sim-mod:` (cf. `SIM_MOD_APP_PROMPT.md`).
- `must-warlord` / `cannot-warlord` — Supreme Commander et interdits de
  Warlord (assassins de l'Officio, C'tan…).
- `leader-kw:` — prédicats de rattachement par mots-clefs, en **noms de
  catégories** : `|` sépare des alternatives (OR), `&` exige la conjonction
  (AND). Ex. `leader-kw: Wulfen & Infantry | Destroyer Cult`.

## Contrat côté application

- **La donnée prime, la prose est le repli.** Lisez les marqueurs d'abord ;
  ne retombez sur vos heuristiques de prose que pour une fiche SANS marqueur
  (données tierces, codex pas encore annoté).
- `invuln` par contexte : pour une attaque de type T (tir/mêlée), retenez la
  meilleure valeur parmi les lignes sans `vs=` et celles à `vs=T` ; `lost=wound`
  ne joue que sur une figurine intacte (simulateur : état « PV pleins » par
  figurine ; indice de résistance : espérance exacte avec puis sans l'invu).
- `invuln` par modèle : rattachez la ligne `model="X"` à la statline du
  modèle homonyme ; la ligne sans `model` est la valeur d'unité.
- `leader-kw` : résolvez chaque nom en ids de catégories de votre index et
  testez la cible par conjonction (`&`) puis alternative (`|`).
- **Sentinelle recommandée** : si vos extracteurs de prose détectent un
  signal (aptitude nommée « Invulnerable Save »/« Feel No Pain N+ », clause
  Supreme Commander) sur une fiche SANS le marqueur correspondant, levez une
  anomalie — c'est une fiche nouvelle/retouchée qui a échappé au générateur.

## Maintenance côté dépôt

Générés initialement par `editor/gen-stat-markers.mjs` (dry-run puis
`--apply` ; il ne réécrit QUE ses genres de lignes et préserve `sim-mod:`).
Pour une fiche nouvelle : écrire le marqueur À LA MAIN au moment de
l'intégration (workflow `FACTION_PACK_PROMPT.md`), ou relancer le générateur
et auditer son diff. Toute divergence prose↔marqueur doit être tranchée en
faveur de la règle imprimée, puis figée dans le marqueur.
