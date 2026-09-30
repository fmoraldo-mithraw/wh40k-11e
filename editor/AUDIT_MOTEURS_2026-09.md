# Audit 2026-09-30 — le vocabulaire de la base remonte-t-il jusqu'à l'appli ?

> Question posée : « analyse chaque attribut, tag et modificateur de la base et
> vérifie que l'info remonte bien tout en haut dans l'application ; dans le doute,
> recode de zéro l'interpréteur et regarde les différences ». Ce document est la
> réponse : inventaire mécanique de la base, **évaluateur BattleScribe de
> référence réécrit de zéro** (`scripts/refengine/` dans `cogitator-bellicum`),
> confrontation des deux lectures sur les 36 factions (3 093 fiches), analyse
> écart par écart (qui a raison ?), corrections livrées côté appli, points
> restants côté données. Complète `AUDIT_VOCABULAIRE_APP.md` (2026-09-09) dont
> il corrige plusieurs verdicts.

## 1. Méthode

1. **Inventaire** (`xml.etree`, 47 fichiers) : tags, attributs, valeurs énumérées,
   combinaisons *modifier × champ × portée*, *condition × champ × portée × childId*,
   *contrainte × champ × portée*, `repeat`, coûts, `typeName` de profils.
2. **Évaluateur de référence** écrit sans lire le parseur existant, à partir de
   la sémantique du format (`BSDATA_PARSING_REFERENCE.md`) : parseur XML propre,
   clôture des `catalogueLink`, fusion lien ↔ cible, **arbre de sélection** où
   chaque enfant potentiel est un *slot* (nombre 0) évaluable avant sélection,
   conditions (7 types, `and`/`or`/`count`), toutes les portées, modifiers (11
   types) sur `hidden`/`name`/`defaultAmount`/`category`/contrainte/coût/
   caractéristique/messages, `modifierGroup`, `repeats`, contraintes effectives,
   **sélection par défaut à la BattleScribe** (min brut semé à la création,
   `defaultAmount`, `defaultSelectionEntryId`, rétrécissement au max effectif),
   énumération des radios de taille, coût par taille, porteurs d'amélioration
   décidés par **simulation** (fiche + détachement requis).
3. **Deux harnais de diff** :
   - `scripts/engine-diff.mjs` — sortie du parseur (`parseAllCatalogues`) contre
     les faits du moteur, dimension par dimension (pts, paliers, taille, modèles,
     catégories, plafond roster, armes, capacités, options, stats, visibilité par
     détachement, messages, détachements, améliorations) ;
   - `scripts/engine-diff-runtime.mjs` — **le bout de la chaîne** : une ligne
     d'armée par défaut construite **avec le code de l'appli** (`initWargearFromOpts`
     d'App.jsx, `initModelsEff`/`_defaultModelCounts`, `normalizeGatedWargear`),
     puis `unitTotalPts` et `deriveAttackerWeapons` (ce que voient le simulateur
     et les exports) confrontés à l'état par défaut BattleScribe.
4. Chaque écart est classé : **bug du parseur/runtime de l'appli**, **bug du
   nouveau moteur** (corrigé au fil de l'eau — voir §4), **bruit du harnais**,
   **équivalent par conception** (l'appli exprime la même chose autrement), ou
   **défaut de données**.

### Périmètre (décision utilisateur, 2026-09-30)

**Croisade et Légendes sont hors périmètre de l'appli.** Côté données : aucune
fiche Légendes dans la base (0 nom « [Legends] », 0 catégorie ni publication
Legends ; « Library - Astartes Heresy Legends » ne publie **aucune** fiche —
27 cibles, toutes des profils/armes) ; côté Croisade, deux fiches ne vivent que
sous une force Crusade (Emperor's Champion (Anointed) de Black Templars ; l'option
« Master of the Ravenwing » de Sammael) et les reliques/grades Croisade sont
masqués par un type de coût mort (§2). L'appli **retire** désormais tout ce qui
n'est visible qu'en Croisade (§5-28, §5-31) ; le reste des conditions Crusade de
la base (143 modifiers) n'est qu'une **relaxation** « … ou en Croisade » de
portes de détachement, sans effet en jeu égal.

## 2. Inventaire — ce qui a bougé depuis l'audit du 2026-09-09

| Mesure | 2026-09-09 | 2026-09-30 |
|---|---|---|
| Tags / attributs distincts | 59 / 170 | 59 / 170 |
| `selectionEntry` (unit / model / upgrade) | 9 883 (379 / 1 827 / 7 677) | 9 808 (375 / 1 794 / 7 639) |
| `entryLink` (→ entry / → group) | 7 455 (6 896 / 559) | 7 278 (6 745 / 533) |
| `constraint` / `modifier` / `condition` / `conditionGroup` | 19 672 / 15 104 / 17 945 / 5 463 | 19 420 / 14 949 / 17 775 / 5 383 |
| `repeat` (modifiers à **plusieurs** `repeat`) | 1 790 (« aucun cas ») | 1 758 (**25 modifiers**, tous des `decrement` de composition — l'appli les somme dans `effBound` ✅, `applyCostMods` ne lit que le premier mais aucun coût n'en porte ✅) |
| `infoLink` (rule / profile / infoGroup) | 8 995 | 9 046 (7 863 / 1 075 / 108) |
| `association` | 48 | 47 |

Vocabulaire réel des modifiers : 91 combinaisons *type × champ × portée × affects* ;
des conditions : 139 ; des contraintes : 22 (table complète dans le rapport
d'inventaire du harnais). Rien de nouveau par rapport au vocabulaire documenté
dans `BSDATA_PARSING_REFERENCE.md` §0.

### Ids morts (inertes chez BattleScribe comme chez l'appli — à nettoyer côté données)

| Id | Où | Effet réel |
|---|---|---|
| `b03b-c239-15a5-da55` | 698 `modifier set 2` (améliorations, `instanceOf ancestor Titanic`) | champ inexistant → **inerte** |
| `716d-91b7-d55a-1022` / `75bb-ded1-c86d-bdf0` | 1 596 + 799 `constraint` (`min/max 0`, `max 3/6`, `scope=self`) sur unités/modèles | champ (type de coût) inexistant → **inertes** ; 62 fiches n'ont que ces pseudo-plafonds et aucun `max roster/force` réel |
| `a623-fe74-1d33-cddf` | 19 `condition lessThan 16/31 field=<coût inconnu>` | coût inconnu ⇒ total 0 ⇒ condition **vraie** ⇒ les 19 reliques Crusade (Monster Slayer of Caliban, Auramite Aquila…) sont **masquées** chez BattleScribe — comportement voulu en jeu égal ; l'appli ne les montre pas non plus |
| `cac3-71d1-ea4b-795d`, `1d6e-2579-8e7f-1ed4` (forces Crusade / Boarding) | 1 424 conditions `field="forces"`, 232 `instanceOf force` | forces absentes du `.gst` ⇒ toujours fausses : neutralisent correctement grades et contenus Crusade |

Autres faits utiles à un évaluateur : **959** liens dont le nom diffère de la cible
(souvent vide → nom de la cible) ; **12** liens dont le coût pts diffère de la cible
(le lien **remplace** : Warlock 45 sur le lien Craftworlds/Ynnari, 40 sur l'entrée
partagée ; aucun lien à 0 devant une cible payante) ; **563** ids dupliqués (516
contraintes, copies entre chapitres) ; modifiers de contrainte : **3 011** visent leur
propre nœud, **60** un cousin dans l'entrée racine (Jakhals « 20 models »), **18** la
**cible de leur lien** — jamais un nœud global ; **5** `defaultSelectionEntryId`
nomment la **cible** d'un lien enfant plutôt que le lien ; **4** bibliothèques n'ont
aucun menu racine (Aeldari Library, AM Library, Heresy Legends, Library - Tyranids).

## 3. Résultat de bout en bout (simulateur / exports)

1 666 fiches visibles (non masquées à l'état de base, chapitres compris) × 36
factions, ligne d'armée par défaut construite par le code de l'appli :

| | pts (`unitTotalPts`) ≠ BattleScribe | équipement (`deriveAttackerWeapons`) ≠ BattleScribe |
|---|---|---|
| avant | 3 (Warlock 40≠45, Tyrannofex 190≠170, Wolf Scouts — bruit du harnais) | 78 lignes / **31 fiches distinctes** (46 / 27 après alignement du harnais sur `addUnit`) |
| après la 1ʳᵉ salve (§5-1 à 17) | **0** | 14 lignes / **4 fiches** : Crusader Squad, The Twin Lance (appli), Sternguard et Venerable Dreadnought SW (données) |
| après la 2ᵉ salve (§5-18 à 31) | **0** | 12 lignes / **2 fiches** : Sternguard Veteran Squad (×11 chapitres, liens « Bolt Pistol » sans `min` — **données**, §8-1), Venerable Dreadnought SW (radio portée par le lien jamais lue — **appli**, §5-32) |
| après la base corrigée (§8) et §5-32 | **0** | **0 ligne / 0 fiche** sur les 1 666 fiches (`runtime-report.json` : `ptsDiff 0, loadoutDiff 0`) |

Le diff statique (parseur contre moteur, 3 093 fiches) est décrit en §6 avec ses
chiffres avant/après.

## 4. Le moteur de référence a-t-il « créé des erreurs » ?

Oui, douze fois, toutes trouvées **par le diff** et corrigées avant l'analyse — c'est
le prix d'une réécriture, et la raison d'avoir gardé le parseur de l'appli comme
second témoin :

| Erreur du nouveau moteur | Symptôme | Correction |
|---|---|---|
| modifiers d'un slot **non sélectionné** appliqués aux cousins | Jakhals à 17 modèles par défaut (« 20 models » non choisi) | un slot à 0 n'agit que sur lui-même |
| remplissage des groupes de l'extérieur vers l'intérieur | Plague Champion avec Power fist **et** Plague knives | groupes imbriqués remplis du plus profond au plus externe, bornes intermédiaires respectées |
| pas de rétrécissement après un `set` de taille | Wolf Scouts 9 + 2 loups à « 6 Models » | un remplissage automatique redescend au max effectif |
| portées `<id du groupe>` / `<id du parent>` ignorées comme bornes | Wolf Guard Headtakers sans modèles | portées « par parent » = parent, self, ids du parent, ids des groupes du chemin, `unit`/`model`/`root-entry` typés |
| `defaultAmount` seul semé | Reaver Titan 2 gatling au lieu de gatling + laser | **min brut** semé à la création (idiome « min=1 + `set 0` »), comme BattleScribe et comme l'appli |
| modifiers des profils **dans un `infoGroup` lié** non évalués | « Null Aegis » visible sur tous les Custodes | contenu des infoGroups (inline ou liés) évalué et masqué |
| portée `parent` d'une entrée **racine** résolue sur rien | conditions de détachement des fiches GSC « The Final Day » jamais vraies | le parent d'une sélection racine est la force (roster) |
| `hidden` statique du **lien** d'exposition non prioritaire sur celui de la cible | Marneus Calgar (lien `hidden="true"`) offert | le `hidden` du lien prime |
| unité sans sous-entrée modèle comptée **0** modèle | Sydonian Skatros à 0 modèle | une unité sans modèle compte pour son propre nombre |
| racine `type="model"` à `max > 1` figée | Warbuggies « 1-2 » toujours à 1 | la racine modèle croît comme un slot |
| portes de détachement des améliorations lues sur l'entrée seule | porteurs des améliorations « Upgrade » simulés **sans** le détachement requis (la porte est sur le groupe englobant) | modifiers des groupes englobants inclus (`detGateOf`) |
| découverte des améliorations depuis toutes les fiches, détachements masqués compris | faux porteurs (alliés, détachements d'autres chapitres) | unités non alliées, détachements visibles seulement |

Le moteur et l'appli sont donc d'accord sur l'essentiel ; ce qui suit est la liste des
désaccords restants **où l'appli avait tort**.

## 5. Défauts de l'appli trouvés et corrigés (parseur + runtime)

Chaque ligne cite la fiche qui a révélé l'écart ; la non-régression est dans
`tests/engine_audit_tests.mjs` (55 assertions, `npm run test:engine-audit`).

| # | Élément de vocabulaire | Défaut | Portée mesurée | Correction |
|---|---|---|---|---|
| 1 | `modifier` porté par un `entryLink` visant la **contrainte de sa cible** | ignoré (`effEntryConstraint` ne lisait que le nœud) → le Plague Champion **ne pouvait pas choisir** Plague knives (min 1 → 0 par le lien lu comme « forcé ») et partait avec des Bubotic weapons | 18 liens (DG/CSM Plague Champion, War Walker, Deathshroud, Goremongers, Havoc Champion, Battle Sisters…) | modifiers du lien fusionnés (`extraHosts`) |
| 2 | `defaultSelectionEntryId` nommant la **cible** d'un lien | défaut non reconnu → premier choix : Tyrannofex **190 pts** (Rupture cannon) au lieu de 170, Castellan power weapon, War Shaper bladestave | 5 groupes | lien **ou** cible acceptés |
| 3 | `cost` porté par le lien d'exposition | lu sur la cible seulement : Warlock 40 au lieu de 45 (Craftworlds, Ynnari) | 12 liens | le coût du lien remplace |
| 4 | arme **optionnelle** (`max` déclaré, ni `min ≥ 1` ni `defaultAmount`) | listée en **défaut** et **multipliée par les modèles** dans le simulateur/exports : 5 Hellfyre missile racks sur les Scarab Occult, 5 lance-grenades Death Company, 10 demolition charges chez les Navy Breachers, storm bolter des Librarians, spirit vortex du Cronos, alpha combat weapon Skitarii, arme du Theyn | 13 fiches distinctes (× chapitres) | exclues des défauts, offertes en option (y compris inline sur un modèle) |
| 5 | groupe optionnel (`min 0`) avec `defaultSelectionEntryId` | l'appli pré-sélectionnait le défaut (storm bolter du Librarian en Terminator, chainsword de la Sister Superior) alors que BattleScribe ne remplit un défaut que si une sélection est requise | ~3 fiches | pas de pré-sélection sans amorçage à la création |
| 6 | `infoLink type="rule"` au niveau **modèle** (fiche unit → model) | jamais lus : Canis Rex sans Code Chivalric / Super-Heavy Walker / Deadly Demise / Lone Operative ; idem Chevaliers importés | 16 fiches × factions (Knights alliés), ~22 « Leader », ~19 « Deadly Demise » | règles des modèles collectées, repli « core » partagé |
| 7 | `infoLink type="profile"` vers un profil **du `.gst`** | non résolu (index gst séparé) : « Fortification » (9 fortifications), « Lord of Deceit (Aura) » (2) absents | 11 fiches | résolution gst pour les profils `Abilities` non-invulnérable |
| 8 | `categoryLink@name` lu comme mot-clef | nom **périmé** du lien : « Explosives » affiché sur **455** fiches alors que la catégorie s'appelle « Grenades » ; catégories **masquées** (`categoryEntry hidden="true"`, ex. « Blightlord heavy weapon ») remontées en mots-clefs | 455 + 1 | nom de la `categoryEntry`, masquées exclues |
| 9 | `constraint max scope="force"` plus stricte que `roster` | ignorée : 3 Troupe Master / Shadowseer / Death Jester dans **n'importe quelle** armée Aeldari (la donnée dit 1 par force, 3 sous Ghosts of the Webway / Serpent's Brood) ; **6** Armigers alliés chez les Sororitas (3, 6 sous Spearhead-at-Arms) | 23 fiches à force < roster, 77 écarts de plafond | plafond = min(roster, force) ; modificateurs évalués **par contrainte** (`rosterCaps`, `applyRosterMaxMods`) |
| 10 | bibliothèque **sans menu racine** importée (`importRootEntries`) | repli « énumérer les entrées partagées » : les **23 fiches Drukhari** (Archon, Lelith, Wyches…) offertes en « alliés » d'une armée Craftworlds | 23 fiches | repli réservé aux factions sans menu propre |
| 11 | `defaultSelectionEntryId` d'un groupe de composition visant un **sous-groupe** | corps par défaut faux : Indomitor Kill Team = 3 melta + 1 multi-melta + 3 poings… au lieu de 10 Heavy Intercessors | 1 fiche (13 chapitres) | résolution à travers le sous-groupe |
| 12 | groupe d'options **nommé comme le modèle** (groupe transparent hissé) | non replié dans l'équipement : Tyrant Guard avec ses **trois** armes à la fois, Tyranid Warriors sans devourers | 2 fiches | `loadout.js` : `gn === modelName` |
| 13 | profil d'arme porté par la **racine** d'une fiche mono-modèle | absent du simulateur (Hemlock : Wraithbone Hull) | 1 fiche | défauts : profils de la racine `type="model"` |
| 14 | `defaultAmount` d'un slot compté **optionnel** sans porteur | ignoré à l'ajout : Gladiator Valiant sans ses 2 multi-meltas | 1 fiche | `initWargearFromOpts` sème les `defaultAmount` |
| 15 | porte de détachement écrite `equalTo 0` / `atMost 0` (et non `lessThan 1`) | `getDetReq` ne lisait que `lessThan 1` → **51** fiches Astra Militarum offertes à une armée Genestealer Cults hors Brood Brothers Auxilia, **14** fiches « The Final Day » (Tyranids) sans condition de détachement | 65 fiches | les trois écritures reconnues |
| 16 | `set hidden=true` décidé par le **catalogue primaire** (`instanceOf primary-catalogue`) sur une **fiche** | appliqué aux détachements et améliorations, pas aux fiches → **17** fiches offertes que BattleScribe masque : Black Templars (3 Librarians — le chapitre n'en a pas — et 9 **doublons** de fiches que le chapitre redéfinit localement : Gladiators ×3, Impulsor, Repulsor ×2, Land Raider Crusader, Terminator Squad, Sternguard), Deathwatch (Scout Squad, Terminator Squad, Terminator Assault Squad → Deathwatch Terminator Squad), Space Wolves (Apothecary, Apothecary Biologis → Wolf Priest) | 17 fiches | filtre `hiddenForPrimary` (entrée **et** lien) sur le menu natif et les imports |
| 17 | deux liens racine vers **une même cible**, chacun masqué pour les catalogues primaires de l'autre camp (Library - Titans : lien « Chaos » puis lien « Imperium ») ; `conditionGroup type="or"` | `listUnits` gardait le **premier** lien : avec le filtre 16, les 4 Titans disparaissaient de 7 factions (Sororitas, Custodes, Mechanicus, Agents, Imperial Knights, Space Marines, Emperor's Children) ; le test primaire aplatissait les groupes `or` en « tout doit correspondre », jamais vrai pour un `or` d'`instanceOf` | 28 fiches × factions (révélé par le diff **après** 16) | lien visible pour le primaire préféré ; sémantique `and`/`or` (imbriquée) respectée, `modifierGroup` conditionné = indécidable |

Seconde salve (« si des modifs ou des données ne remontent pas, fais-les
remonter ») — les trois points laissés ouverts ci-dessus et ce que le diff final
(§6) a encore révélé, tous corrigés et couverts par `tests/engine_audit_tests.mjs`
(blocs 12 et 13, 90 assertions au total) :

| # | Élément de vocabulaire | Défaut | Portée mesurée | Correction |
|---|---|---|---|---|
| 18 | `selectionEntryGroup` de composition **imbriqué** : `min` + `defaultSelectionEntryId` | perdus à l'aplatissement (`subCaps` ne portait que le max) : Crusader Squad = 9 Initiates et **aucun Neophyte** au lieu de 1 Sword Brother + 5 Initiates + 4 Neophytes | 1 fiche (+ la validation de tous les sous-groupes) | `subCaps` slots 6-7 (min, défaut) ; `initModels` / `_defaultModelCounts` / `initModelsEff` remplissent le min du sous-groupe sur son défaut et n'en dépassent pas le max ; `compIssues` signale « sous le min » |
| 19 | arme d'un upgrade **imbriqué dans un upgrade** obligatoire | non remontée : The Twin Lance sans Twin pulse blaster (MV15 Gun Drone → arme) | 1 fiche | `collectDirectWeapons` descend dans les enfants **obligatoires** (2 niveaux) |
| 20 | ligne de stats **principale** d'une fiche multi-lignes | première du document : Storm Guardians = la plateforme (W2, OC0), Pink Horrors = ligne « (ref. only) », Wolf Scouts = le loup, Boyz-like Orks = le Nob | 39 fiches | corps le plus nombreux (somme des max des lignes de composition) ; les **personnages** gardent l'ordre du document ; `stats` = `statLines[0]` (invariant REG-034/037 conservé) |
| 21 | sous-groupe **lié** à la composition (`entryLink type="selectionEntryGroup"`) | jamais lu : les **4 variantes à arme spéciale** des Cadian Shock Troops (flamer, grenade launcher, meltagun, plasma gun — groupe partagé de la bibliothèque AM, plafond « max 2 » porté par le lien) **n'existaient pas** dans l'appli | 2 fiches (AM, GSC) | cible du lien traitée comme un sous-groupe, contraintes/modifiers du lien fusionnés |
| 22 | upgrade optionnel **isolé** sous un groupe non transparent **sans bornes** | non proposé : Power sabre du Rough Rider Sergeant, Storm bolter du Taurox Prime, 2 Heavy Bolters de la Valkyrie (à côté des radios de « Wargear Options ») | 3 fiches (+ GSC) | branche `looseGroup` ; arme cherchée aussi sur l'enfant obligatoire de l'option |
| 23 | upgrade inline **compté** `min ≥ 1` / `max > min` | figé au min : le 3ᵉ Dual Supa-shoota du Dakkajet (2-3) inaccessible | 1 fiche | slot compté d'unité (`gMin` 2, `gMax` 3) rempli au min par le runtime, retiré des défauts fixes (pas de doublon : 2 équipés) |
| 24 | `infoLink` / `profile` portés par le **lien d'exposition** | ignorés : « Disciples of Be'lakor » sur les 21 fiches CSM d'une armée Chaos Daemons, « Voices in the Code » des Sicarian Infiltrators | 22 fiches | profils et infoLinks du lien passés à `getAbilities` |
| 25 | profil `hidden="true"` **sans** modifier de révélation | affiché : « Reign of Confusion » de la Callidus Assassin (texte 10e laissé dans le fichier) | 8 fiches (Agents + chapitres) | ignoré, sauf révélation runtime (`set hidden=false`) |
| 26 | règle **gst** ni core ni mot-clef d'arme ; « Leader » par lien seul ; « Damaged » | perdues : « Shock Disembark Move » (Impulsor ×11), « Assault Disembark Move » (6 transports) ; **Leader absent** de 22 fiches (Captain on Bike…) ; « Damaged » **en double** (chip + profil) sur les Dreadnoughts | 39 + 22 + ~60 fiches | résolution `GST_INDEX` (texte complet), `leader` dans les capacités core, dédoublonnage |
| 27 | `constraint max` portée par le **lien d'exposition** | plafond ignoré : Navigator (max 3 par force sur le lien Agents) sans limite | 19 fiches | `getRosterMax(entry, link)` |
| 28 | fiche masquée **sauf Croisade** (`lessThan 1 roster` sur la force Crusade) | listée en jeu égal : Emperor's Champion (Anointed) | 1 fiche | filtrée comme les contenus Croisade |
| 29 | fiche masquée **sauf présence d'une autre fiche** (unités engendrées : `lessThan 1 roster` sur la catégorie du parent) | toujours listées : Ripper Swarms (Parasite of Mortrex), Spore Mines (Biovore), Mucolid Spores (Sporocyst) | 4 fiches | `reqUnitIds` (catégorie → fiches porteuses) ; le catalogue les cache tant que le parent n'est pas dans la liste |
| 30 | capacité portée par un **enfant obligatoire** d'une option | non attachée au choix : « Cutting Gear » du Breaching Robot | 12 fiches (Unaligned, toutes factions) | `pickOptionAbilityDesc` descend d'un niveau |
| 31 | **contenu Croisade** hors fiches : option / toggle masqué sauf force Crusade | proposé en jeu égal : « Master of the Ravenwing » de Sammael ; reliques révélées seulement en Croisade | 1 option + toggles | exclus de `getOpts` (liens, inline, révélations) — **périmètre** : Croisade et Légendes hors appli |
| 32 | radio **imbriquée sous un `entryLink`** ; radio d'un upgrade **optionnel** non sélectionné | Venerable Dreadnought SW : Heavy Flamer (radio de la hache non choisie, `min 1` appliqué) au lieu du Storm bolter (radio du lien Dreadnought Combat Weapon, jamais lue) | 1 fiche | groupes portés par le lien lus sous son nom ; radio d'un upgrade optionnel gardée par le choix parent (`{g,c}`) |

Bilan sur la liste des fiches : 3 093 fiches listées avant, **3 052** après (−23
Drukhari « alliés » de Craftworlds, −17 fiches masquées pour la faction primaire,
−1 fiche réservée à la Croisade) ; aucune fiche ajoutée, les 4 Titans alliés
retrouvés dans les 7 factions du point 17.

Points restants **côté appli** (diagnostiqués, non corrigés) :

- **Plage de taille statique** (`minM`/`maxM` du catalogue) des fiches à
  « variante qui décrémente la base » sans radio de taille (Sanctifiers 9-11
  affiché, 9 réel ; Corsair Voidscarred, Atalan Jackals, Neurogaunts) : le moteur
  l'obtient par simulation, l'appli additionne les max. Cosmétique (la composition
  vivante est juste).
- **Catégories conférées par modifier conditionnel** (`add`/`remove category`
  selon détachement ou faction primaire : « Khorne Non-Battleline », « Ynnari »,
  « Non-Kroot », « Knight Character » — toutes des catégories **masquées** de
  comptage) : l'appli ne les évalue pas ; elles ne servent qu'aux plafonds de
  roster par catégorie de ces détachements, non validés aujourd'hui.

## 6. Diff statique — dimensions, classement

Compte d'**unités** (sur 3 093, chapitres compris) présentant au moins un écart dans
la dimension, avant et après corrections ; puis le verdict.

<!-- DIFF_STATIQUE_TABLE -->
| Dimension | avant | après 1ʳᵉ salve (17 corr.) | après 2ᵉ salve (30 corr.) | Lecture |
|---|---|---|---|---|
| catégories | 1 700 | 1 445 | **1 445** | « Allied Units » / « Assigned Agents » conférées par modifier (statut allié, `assignedAgents`) ; catégories **masquées** de comptage (Knight Character, Ynnari, Non-Kroot…) exclues côté appli, comptées côté moteur ; Titans : appariement du diff sur le lien masqué ✅ |
| visibilité (fiches masquées côté moteur) | 1 402 (146 réelles) | 1 382 (61 réelles) | **1 381 (60 réelles)** | réelles restantes = les 56 fiches Chaos Daemons derrière les toggles « Show <dieu> Daemons » (obligatoires chez BattleScribe : artefact de l'état de base du harnais) + les 4 fiches engendrées désormais gardées par `reqUnitIds` (§5-29, invisible au harnais) ✅ |
| visibilité par détachement | 1 210 | 1 125 | **1 124** | mêmes toggles (Daemons, Chevaliers alliés « Show Imperial Knights ») ✅ |
| armes (table de la fiche) | 490 | 486 | **486** | par conception : la table `u.weapons` exclut les armes derrière un `entryLink` de variante de composition (résolues par `wpnDict`) ; ce que **voit** l'utilisateur (dérivation par modèle, simulateur, exports) est jugé par le contrôle de bout en bout (§3) ✅ |
| capacités | 461 | 404 | **256** | restantes : « Damaged » (149 : la règle gst générique doublonne le profil « Damaged: 1-N » de la fiche, dédoublonnée à dessein), capacités d'**option** portées par le choix depuis §5-30 (Blessed wardings, Cutting gear, Storm shield, Command uplink… : invisibles au harnais), capacités de **modèle** (Collar of Khorne — lignes de composition, `MODEL_ABILITIES`), « Hunter » (mot-clef d'arme), invulnérables (champ `invuln`) ✅ |
| pts | 311 | 309 | **309** | modificateurs de coût évalués en contexte par le moteur (allié +N, prix de chapitre, prix par modèle) et appliqués au runtime par l'appli : **0** écart de bout en bout ✅ |
| paliers | 146 | 145 | **145** | idem (delta de forme) ✅ |
| plafond roster | 77 | 21 | **3** | §5-9 puis §5-27 (Navigator) ; les 3 restants (Kroot Hounds, Krootox Riders, Kroot Farstalkers) = plafond de base 0 + `set 3` hors Boarding Actions, évalué au runtime → 3 ✅ |
| options | 73 | 44 | **37** | restants : branches non sélectionnées (Relic weapons du Captain in Gravis Armour, pistolets de la branche alternative du Captain — l'appli expose toute l'arborescence, gardée au runtime), toggles de désignation (Warlord, Character, Khorne) ✅ ; Sanguinary Priest = menu Enhancements vu comme options par le moteur (bruit) |
| taille | 30 | 24 | **24** | Sanctifiers-like (voir restants) ; Spectrus Kill Team : le moteur n'énumère que l'état par défaut (10-10), l'appli lit la borne de groupe 5-10 |
| messages | 11 | 11 | **11** | comptage des `error`/`info` par portée ; équivalents |
| modèles | 8 | 3 | **1** | Cadian Shock Troops corrigé (§5-21) ; le dernier : Death Company Intercessors « w/ alternate pistol », ligne révélée au runtime côté appli, masquée à l'état de base côté moteur ✅ |
| stats / lignes | 3 / 4 | 3 / 4 | **3 / 4** | Wulfen, Victrix Honour Guard : le **moteur** ne trouve pas la ligne ; Custodian Guard « (Vexilla) », Talonstrike, Wolf Guard Terminators : ligne présente dans les données, manquée par le moteur |
| améliorations (porteurs) | 416 | 442 | **445** | données : restriction de porteur en prose seulement (§8-6) — l'appli (mots-clefs) est **plus précise** que le menu central ✅ |
| fiches non appariées (anciennes / nouvelles) | 23 / 106 | 5 / 123 | **5 / 124** | anciennes : plus aucune fiche fantôme ; nouvelles : « Show/Hide Options » (36 toggles), fiches masquées pour le primaire (17) et Croisade, références de rituels — jamais des unités ✅ |
<!-- /DIFF_STATIQUE_TABLE -->


Lecture des dimensions restées « bruyantes » :

- **catégories** : « Allied Units » (1 186) et « Assigned Agents - Character » (238)
  sont des catégories **conférées par modifier** selon la faction primaire — l'appli
  porte l'information autrement (statut allié, `assignedAgents`) ✅ ; les mots-clefs
  de **modèles** (Sir Hekhtur, Ancient, Psyker…) sont dans `keywordsByModel` ✅.
- **armes** : le moteur liste toute arme atteignable ; l'appli **par conception**
  garde hors de la table de la fiche les armes derrière un `entryLink` d'une variante
  de composition (Blight launcher, Plague spewer) et les résout à la sélection via
  `wpnDict` — mais garde celles déclarées **inline** (Meltagun, Plague belcher) : la
  table est donc **incohérente** entre deux encodages de la même chose (à unifier).
- **visibilité** : les fiches masquées à l'état de base côté moteur sont, sauf
  exception listée dans le rapport, celles que l'appli conditionne à un
  détachement (`detReq`) ou classe alliées (le bouton « Alliés » remplace le
  toggle BattleScribe « Show X ») ✅.
- **pts / paliers** : le moteur évalue les modificateurs de coût dans le contexte
  (allié +N, prix de chapitre) que l'appli n'applique qu'au runtime — le contrôle de
  bout en bout (§3) est le bon juge : **0** écart après corrections.
- **améliorations** : les porteurs simulés coïncident avec les listes de l'appli, aux
  améliorations **Upgrade** près (groupe gardé par le détachement, porteur simulé
  avec le détachement sélectionné) ✅ ; les « onlyNew » résiduels sont les
  améliorations des détachements d'autres chapitres visibles depuis le tronc commun.

## 7. Table de vérification du vocabulaire (mise à jour de l'audit du 09-09)

Verdicts changés par cette passe (le reste de `AUDIT_VOCABULAIRE_APP.md` reste valable) :

| Élément | 09-09 | 30-09 | Preuve |
|---|---|---|---|
| `entryLink` : modifiers du lien sur la contrainte de la cible | ✅ (« lien et cible lus ») | ❌ → ✅ corrigé | §5-1 |
| `entryLink` : `cost` du lien | ✅ | ❌ → ✅ corrigé (unité de base) | §5-3 |
| `defaultSelectionEntryId` | ✅ (« 0 cassé ») | 🟡 → ✅ (id de cible, sous-groupe) | §5-2, §5-11 |
| `categoryLink` / `categoryEntry@hidden` | ✅ / ➖ | ❌ → ✅ (nom canonique, masquées exclues) | §5-8 |
| `constraint max scope="force"` | ✅ | ❌ → ✅ (min des deux portées, mods par contrainte) | §5-9 |
| `infoLink type="rule"` sur un modèle | ✅ (« unité + modèles ») | ❌ → ✅ | §5-6 |
| `infoLink type="profile"` vers le `.gst` | ✅ | 🟡 → ✅ (Fortification, Lord of Deceit) | §5-7 |
| `min` absent + `max` déclaré (arme optionnelle) | ✅ (« min 0 = optionnel ») | ❌ → ✅ | §5-4 |
| `defaultAmount` (groupes comptés optionnels) | ✅ | 🟡 → ✅ | §5-14 |
| `importRootEntries` d'une bibliothèque sans menu | ✅ | ❌ → ✅ | §5-10 |
| `repeat` multiples | « aucun cas » | 25 cas, tous couverts | §2 |
| `floor`/`ceil` sur contrainte | non couvert | 2 cas (Raptors, Scarab Occult), bornes identiques à l'état par défaut et à la taille max | vérifié |
| `set name` / `replace name` | ❌ cosmétique | inchangé (renommages de variantes, toggles « Show X ») | inventaire |
| conditions `field=<coût>` | ➖ | 19 reliques Crusade masquées par un type de coût mort — comportement équivalent | §2 |
| porte de détachement `equalTo 0` / `atMost 0` | ✅ (« lessThan 1 ») | ❌ → ✅ | §5-15 |
| `set hidden` + `instanceOf primary-catalogue` sur une **fiche** | ➖ | ❌ → ✅ | §5-16 |
| liens racine multiples vers une cible ; `conditionGroup type="or"` dans le test primaire | ✅ | 🟡 → ✅ | §5-17 |
| `scope="parent"` d'une entrée racine (= la force) | non couvert | idem appli (`getDetReq` lit la portée `parent` comme la force) ; moteur corrigé | §4 |
| sous-groupe de composition : `min`, `defaultSelectionEntryId` | ✅ (« subCaps ») | ❌ → ✅ | §5-18 |
| `entryLink type="selectionEntryGroup"` dans une composition | ➖ | ❌ → ✅ | §5-21 |
| upgrade inline compté `min ≥ 1` / `max > min` | ✅ | ❌ → ✅ | §5-23 |
| upgrade optionnel sous un groupe non transparent sans bornes | ✅ | ❌ → ✅ | §5-22 |
| `profile` / `infoLink` sur le **lien** d'exposition | ✅ (« lien et cible ») | ❌ → ✅ | §5-24 |
| `profile@hidden="true"` sans révélation | ➖ | ❌ → ✅ | §5-25 |
| `infoLink type="rule"` vers une règle gst non core | 🟡 | ❌ → ✅ | §5-26 |
| `constraint max` sur le lien d'exposition | ✅ | ❌ → ✅ | §5-27 |
| `set hidden` sauf force Croisade / sauf autre fiche (unités engendrées) | ➖ | ❌ → ✅ | §5-28, §5-29 |
| capacité d'un enfant obligatoire d'une option | ✅ | ❌ → ✅ | §5-30 |
| ligne de stats principale (multi-lignes) | ✅ (« première ligne ») | 🟡 → ✅ | §5-20 |

## 8. Points côté données — traités le 2026-09-30 (seconde passe)

| # | Point | État | Commit(s) |
|---|---|---|---|
| 1 | **Sternguard Veteran Squad** (Space Marines) : liens « Bolt Pistol » sans contrainte | **corrigé** — `min 1 / max 1 scope="parent"` sur les 3 liens (la copie Black Templars vise une entrée partagée qui portait déjà ses bornes) | Space Marines |
| 2 | **Venerable Dreadnought (Space Wolves)** | **reclassé côté appli** : la donnée est complète (Dreadnought Combat Weapon `min 1` avec sa radio « Ranged Weapon » par défaut Storm bolter ; hache + bouclier optionnels avec leur propre radio par défaut Heavy Flamer). L'appli ne lit pas la radio imbriquée **sous le lien** et applique le `min 1` de la radio de la hache sans que la hache soit choisie → Heavy Flamer au lieu de Storm bolter. Correctif appli (§5-32) | — |
| 3 | **5 `defaultSelectionEntryId`** visant la cible d'un lien | **corrigés** — pointent le lien (Chainsword, Huge Knife, deux « Wargear Options » Kroot, Fleshborer Hive) | AM Library, T'au, Tyranids |
| 4 | **Ids morts** | **purgés / re-ciblés** — 2 395 contraintes sur les types de coût 716d…/75bb… (absents du `.gst`), 2 295 modifiers qui les visaient, 698 `set 2` sur b03b… et 223 conteneurs vidés, dans 31 fichiers ; les 19 conditions des reliques Croisade (`lessThan N` sur le coût a623… mort) re-ciblées sur le compte de l'upgrade **« Experience Points »** (2dbf-4d49…), déjà utilisé par les grades Croisade — reliques révélées au bon rang en Croisade, toujours masquées en jeu égal | 31 fichiers |
| 5 | **Mark of Chaos** sur les véhicules CSM | **vérifié, rien à changer** : groupe `min 0 / max 1` (Marque optionnelle), masqué pour les PSYKER et Dark Commune, `set 1` sur le min seulement sous le détachement qui l'impose (bb9d…) — cohérent | — |
| 6 | **Restrictions d'améliorations en prose seule** | **encodées** — 239 portes de visibilité `set hidden=true` = OR(échec d'éligibilité, AND(unicité)) synthétisées depuis la clause « … model only » (mots-clefs conjonctifs en conditions directes, alternatives en AND, `(excluding X)` en `instanceOf`, Upgrades sans clause d'unicité), 6 catégories de datasheet créées (Neophyte Hybrids, Patriarch, Purestrain Genestealers, Execrator, Norn Assimilator, Norn Emissary) avec leur `categoryLink`. **Correctif de scope** (mis en évidence par le moteur) : les conditions de catégorie sont en `scope="ancestor"`, pas `parent` — sur 14 fiches (Grimnyr, Brôkhyr Iron-master, Dark Apostle, Dark Commune, Traitor Enforcer, Rogue Trader Entourage, 4 Command Squads AM, Ravenwing Command Squad, Hyperadapted Raveners, Tyranid Warriors ×2) le menu Enhancements pend sur un **modèle imbriqué** sans la catégorie de faction, et BattleScribe masquait l'amélioration ; 331 conditions corrigées dans 22 fichiers (266 portes, dont 27 antérieures de même forme), `ENHANCEMENT_BEARERS_PROMPT` mis à jour. Vérification : sentinelle `amelioration-porteur-manquant` = 0 anomalie ; écarts « améliorations » du diff : Necrons 17 → 6, Drukhari 6 → 1, Sororitas 4 → 1, CSM 43 → 38, jamais en hausse ; les écarts restants sont des porteurs **alliés** listés par l'appli (le moteur ne simule que les natifs) ou l'idiome Tyranid Warriors (CHARACTER porté par le modèle Prime, pas par l'unité) | 25 fichiers |
| 7 | **Library - Titans** : Emperor's Children absent des listes Chaos | **corrigé** — `notInstanceOf` EC ajouté au groupe AND des 4 liens Chaos, `instanceOf` EC au groupe OR des 4 liens Imperium | Library - Titans |

Validation à chaque commit : `xmllint`, `catalog.validate` (47 fichiers, 0 erreur),
cliquet des ids dupliqués (456, 0 dépassement), `defauts-groupes` (0 cassé) ;
côté appli, batterie et sentinelles sur la base corrigée (§9).

## 9. Reproduire

```bash
cd cogitator-bellicum
BSDATA_DIR=../wh40k-11e node scripts/engine-diff.mjs --out /tmp/diff        # statique
BSDATA_DIR=../wh40k-11e node scripts/engine-diff-runtime.mjs --out /tmp/diff # bout en bout
BSDATA_DIR=../wh40k-11e npm run test:engine-audit                             # non-régression (66 assertions)
# alias npm : audit:engine (statique), audit:engine-runtime (bout en bout) — mêmes options --out / --faction
```
