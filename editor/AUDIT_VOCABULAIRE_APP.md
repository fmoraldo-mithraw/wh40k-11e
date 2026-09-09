# Audit — vocabulaire BattleScribe de la base × prise en compte par l'appli

> État au 2026-09-09, base `wh40k-11e` (46 `.cat` + 1 `.gst`) croisée avec
> `cogitator-bellicum` (`scripts/bsdata-parser.mjs` = parseur, `src/lib/*.js` +
> `src/App.jsx` = runtime). Inventaire mécanique (chaque tag, attribut, valeur
> énumérée, combinaison type × champ × portée), puis lecture du code pour
> chaque élément. Légende : ✅ pris en compte · 🟡 partiel · ❌ ignoré alors
> qu'il porte du sens · ➖ sans objet pour l'appli (Crusade, métadonnées,
> multi-force).

## 1. Chiffres

| Mesure | Valeur |
|---|---|
| Tags distincts / attributs distincts | 59 / 170 |
| `selectionEntry` (unit / model / upgrade) | 9 883 (379 / 1 827 / 7 677) |
| `entryLink` (→ selectionEntry / → selectionEntryGroup) | 7 455 (6 896 / 559) |
| `selectionEntryGroup` | 3 062 (dont 996 avec `defaultSelectionEntryId`) |
| `profile` / `characteristic` | 11 342 / 45 752 |
| `constraint` / `modifier` / `condition` / `conditionGroup` | 19 672 / 15 104 / 17 945 / 5 463 |
| `repeat` / `association` / `modifierGroup` | 1 790 / 48 / 1 214 |
| `infoLink` (rule / profile / infoGroup) | 8 995 (7 801 / 1 086 / 108) |
| `rule` / `categoryLink` / `cost` / `comment` | 1 767 / 10 314 / 7 228 / 4 808 |
| `catalogueLink` (`importRootEntries=true`) | 110 (91) |

## 2. Structure des fichiers

| Élément | Occ. | Appli | Détail |
|---|---|---|---|
| `catalogue` / `gameSystem` (id, revision, library…) | 46 / 1 | ✅ | id de catalogue = clef `primary-catalogue` ; `library` non lu (les bibliothèques sont reconnues par leurs liens). |
| `catalogueLink` + `importRootEntries` | 110 | ✅ | Clôture transitive par `targetId`, entrées importées natives (`SHARED_LIBRARY_RULES`, `ALLIED_UNITS`). |
| `sharedSelectionEntries` / `sharedSelectionEntryGroups` / `sharedProfiles` / `sharedRules` / `sharedInfoGroups` | 40 / 26 / 29 / 26 / 6 | ✅ | Index global par id : tout lien est résolu quel que soit le conteneur. |
| `categoryEntries` (`hidden`) | 1 741 (53 masquées) | ✅ | Résolution id → nom de mot-clef / catégorie. `hidden` ignoré (catégories techniques). |
| `forceEntries` / `forceEntry` (gst) | 1 | ➖ | Une seule force par roster dans l'appli. |
| `costTypes` (`defaultCostLimit`, `hidden`) / `profileTypes` / `characteristicTypes` | 10 / 32 / 63 | ➖ | Typage : l'appli travaille par `typeName` et `typeId` des characteristics (constantes). |
| `publications`, `publicationId`, `page`, `noindex`, `readme`, `alias` | 10 / 340 / 258 / 19 / 1 / 30 | ➖ | Métadonnées éditoriales. |
| `description` (texte des `rule`) | 1 768 | ✅ | Règles d'armée, de détachement, stratagèmes, règles de base. |

## 3. Entrées, liens, groupes

| Élément | Occ. | Appli | Détail |
|---|---|---|---|
| `selectionEntry@type=unit/model/upgrade` | 379 / 1 827 / 7 677 | ✅ | Datasheets, composition (modèles), armes/wargear/améliorations. Modèle porté par `entryLink` résolu comme modèle (`UNIT_COMPOSITION`). |
| `entryLink@type=selectionEntry / selectionEntryGroup` | 6 896 / 559 | ✅ | Cible résolue ; groupe importé redimensionné par les modifiers du lien (`effGroupBound`). |
| `collective` | 769 SE + 81 liens | ✅ | Groupes « par figurine » (`markPerFigurineGroups`, `figurineLoadout`). |
| `flatten` | 3 SE + 76 liens + 16 groupes | ✅ | Unités composées aplaties (Wolf Guard Headtakers). |
| `hidden="true"` sur SE / lien / groupe / infoLink / profile | 22 / 905 / 303 / 11 / 2 | 🟡 | Sauté d'office (51 gardes). Les 36 nœuds masqués **puis révélés** par un `set hidden=false` ne sont pas réévalués : 14 inconditionnels (options des Assassins des Agents : Micromelta Rounds, Esoteric Explosives… → **absents de l'appli**), 12 groupes Marques des Daemons révélés à `parent`, 4 traits Aeldari (Crusade), 5 infoLinks. |
| `import="false"` | 7 SE + 11 liens | ❌ | Ignoré : entrées « Detachment » des bibliothèques (sans effet, les détachements sont filtrés par `primary-catalogue`) et 8 liens Deathwatch (Watch Master, Kill Teams…) qu'un catalogue importateur ne devrait pas hériter — à vérifier sur les Agents. |
| `defaultSelectionEntryId` | 996 (118 `none`) | ✅ | Présélection radio / défaut des emplacements comptés. Audit `editor/audit/defauts-groupes.mjs` (0 cassé). |
| `defaultAmount` (attribut) | 53 SE + 13 liens | ✅ | Distribution par défaut des groupes par figurine (Crisis 1 plasma + 1 pod). |
| `sortIndex` | 862 SE + 818 liens + 1 065 groupes | ✅ | Ordre d'affichage des options. |
| `collapsible` | 188 | ➖ | UI BattleScribe. |
| `categoryLink` (+ `primary`) | 10 314 (1 109 primaires) | 🟡 | Mots-clefs et catégorie de la datasheet ✅ ; l'attribut `primary` n'est pas lu (catégorie primaire déduite du nom), suffisant car `set-primary` est exécuté. |
| `infoLink@type=rule / profile / infoGroup` | 7 801 / 1 086 / 108 | ✅ | Capacités de base (Deep Strike, Scouts x"…), profils partagés (Bolt pistol), `infoGroups` (Plasma standard/supercharge). |
| `infoGroup` / `hidden` | 69 | ✅ | Sous-profils parcourus ; 3 masquages conditionnels via gates runtime. |
| `association` (scope, min/max, childId model/entry/groupe/catégorie, `includeChildSelections`) | 48 | ✅ | Porteurs d'icônes/bannières (`ICON_BEARER`, `BearerSelect`, `associationIssues`). |

## 4. Contraintes

| Élément | Occ. | Appli | Détail |
|---|---|---|---|
| `min` / `max` `field=selections` `scope=parent` | 14 735 | ✅ | Composition, radios, emplacements comptés (min < max = fourchette, min = max = effectif exact), plafonds par choix. |
| `scope=self` | 2 477 (dont 2 450 sur un `field` de coût) | ➖ | Limites de monnaies Crusade (Blackstone, Honour…) ; les 27 `selections` sont lues. |
| `scope=roster` / `force` | 1 483 / 785 | ✅ | Plafonds d'unités (0-3, 0-6 Battleline), `UNIQUE`, Epic Heroes, améliorations uniques. |
| `scope=unit` / `model` / `<id d'entrée>` | 82 / 10 / ~50 | ✅ | Plafond par unité d'un choix (`choiceUnitMax`) ou d'un groupe (`groupUnitCap`, slot 8). |
| `shared` | 19 638 true | ✅ | Comptage à travers les liens (index par id du lien **et** de la cible). |
| `includeChildSelections` / `includeChildForces` / `percentValue` | 11 852 / 3 443 / 2 888 | ➖ | Une seule force ; pourcentages jamais `true`. |
| `automatic` / `negative` | 107 / 3 | ➖ | `automatic` = auto-sélection BattleScribe d'un min = max déjà traité comme arme fixe. |

## 5. Modifiers (par type × champ)

| Type × champ | Occ. | Appli | Détail |
|---|---|---|---|
| `set hidden` | 3 481 | 🟡 | Sur profils/capacités/règles : masquage évalué au parse (`instanceOf` catégorie, `primary-catalogue`) et au runtime (gates `force`/`roster`/`primary-catalogue` : `abilityHidden`, `detGateCounts`) ✅. Sur entrées/liens/groupes : parse-time seulement, portées `ancestor/self/parent/unit/model` (`entryHiddenFor`) et `primary-catalogue` ; les 312 conditionnés `root-entry` (Crusade : Battle Traits, Paths) et les masquages numériques `force`/`roster` d'**options** ne sont pas appliqués au runtime. |
| `increment` / `set` / `decrement` / `floor` sur `<constraint id>` | 1 923 / 1 094 / 65 / 2 | 🟡 | Bornes dynamiques : max d'un modèle (`modelMaxScaling` + `modEffectiveValue`), bornes de groupe de composition (`buildDynBounds`), plafond d'un choix (`choiceUnitMax` : `set` lessThan, `increment` atLeast, `repeats` par N modèles), redimensionnement d'un groupe importé (lien, inconditionnel). Non couvert : bornes de groupes d'options conditionnées à autre chose que la taille (détachement, amélioration), `floor`. |
| `increment` / `set` / `decrement` sur le coût pts | 409 / 300 / 1 | ✅ | `applyCostMods` : répétition (forme native `atLeast scope=roster`), allié +10 (Agents), coût de chapitre (`primary-catalogue`), paliers de taille (`readTiers`), `repeats`. Multiply/divide absents de la base. |
| `add` / `set-primary` / `remove` / `unset-primary` sur `category` | 341 / 233 / 22 / 7 | ✅ | Grants Battleline (`BATTLELINE_GRANT`), retraits de catégorie. |
| `add error` | 135 | 🟡 | Décidables dans l'unité (taille, « max 1 par 5 modèles ») : `collectErrorMods` + `modCollectErrors` ✅. Les ~40 conditionnés `force`/`roster`/`root-entry`/`instanceOf` sont sautés (« Yvraine ou The Yncarne doit être Warlord », Cults dans un Renegade Warband). |
| `add warning` / `add info` | 7 / 2 | ❌ | Prérequis T'au « X upgrade is required » (3), avertissements Crusade (4), notes (2). |
| `append name` | 4 736 | 🟡 | Seuls les appends des capacités de base sont lus (« Scouts 7" », « Deadly Demise D3 », « Damaged »). Les 4 700 autres sont des grades Crusade (`(Blooded)`…) conditionnés à `forces` — sans objet. |
| `set name` / `replace name` | 78 / 3 | ❌ | Renommage cosmétique d'une variante selon l'arme choisie (« Voidreaver with shuriken cannon »), interrupteurs d'affichage Daemons. |
| `increment` / `decrement` / `set` sur characteristic de **profil Unit** (`affects=…profiles.Unit`) | ~230 | ✅ | `extractStatMods` (inconditionnels + `repeats` par copie) : Shield Drone +1 W, 'Ard Case +2 T… appliqués à la ligne de stats et aux exports. Conditionnels (annotations, Crusade) sautés. |
| `increment` / `decrement` / `replace` / `append` / `floor` sur characteristic d'**armes** (`affects=…profiles.Melee/Ranged Weapons`, portée `model`/`root-entry`/`model-or-unit`) | ~900 | ❌ | Bonus d'amélioration/détachement modifiant A/S/AP/D/mots-clefs des armes du porteur. Seul un `set` inconditionnel posé **sur le profil lui-même** est appliqué (`fmtWeapon`). Le simulateur les couvre en partie via les 800 marqueurs `sim-mod` ; les stats imprimées et les exports restent celles de base. |
| `append` / `set` sur `annotation` | 318 / 39 | ❌ | Notes d'affichage BattleScribe (rappels de règles) — sans impact fonctionnel. |
| `set defaultAmount` | 4 | ❌ | Rare. |
| `affects` (chemins `self.entries.recursive…`) | 1 165 | 🟡 | Lu uniquement pour reconnaître `profiles.Unit` ; les chemins ciblant une entrée précise (`recursive.<id>.profiles…`) ne sont pas résolus. |
| `scope` de modifier (`model`, `root-entry`, `model-or-unit`, `parent`, `upgrade`) | 1 239 | ❌ | Non lu — porte les mêmes modifiers d'armes que ci-dessus. |
| `join` / `position` / `arg` | 850 / 117 / 272 | ➖ | Mise en forme des appends. |
| `modifierGroups` (`and`, conditions partagées) | 1 214 | ✅ | Fusionnées en groupe `and` avec les conditions propres (`extractModifiers`). |
| ids hérités `<id>-min` / `<id>-max` | ~60 | ❌ | Ancienne forme BattleScribe des bornes ; cibles absentes de la base (modifiers inertes, à nettoyer côté données). |

## 6. Conditions

| Élément | Occ. | Appli | Détail |
|---|---|---|---|
| `atLeast` / `greaterThan` / `atMost` / `lessThan` / `equalTo` | 4 071 / 3 600 / 3 270 / 2 133 / 301 | ✅ | `modEvalCondition` (+ `notEqualTo`, absent de la base). |
| `instanceOf` / `notInstanceOf` | 2 087 / 2 483 | ✅ | Catégories de l'unité (`_cats`) et `primary-catalogue` ; au parse pour le masquage par mot-clef. |
| `conditionGroup` `and` / `or` / `count(min)` | 4 689 / 770 / 4 | ✅ | Récursif, `count` avec seuil. |
| `field=selections` | ~16 400 | ✅ | Comptage par `childId` (id du lien et de la cible, `model`, `any`, catégorie). |
| `field=forces` | ~1 485 | ➖ | « La force est-elle une Crusade force ? » — toujours faux (une seule force non-Crusade), ce qui neutralise correctement les grades et contenus Crusade. |
| `field=<coût>` (`lessThan root-entry`) | 17 | ➖ | Crusade. |
| `scope` : `self`, `parent`, `unit`, `model`, `<id>` | ~9 300 | 🟡 | Le runtime **ne lit pas la portée** : chaque site d'appel fournit le bon sac de comptes (unité : modèles/choix ; roster : datasheets, catégories, détachements). Correct pour les patrons présents ; une condition `roster` portée par un modifier d'unité (ou l'inverse) serait mal comptée. |
| `scope=ancestor` / `root-entry` / `model-or-unit` / `upgrade` | 2 274 / 461 / 195 / 19 | 🟡 | `ancestor` évalué au parse pour `instanceOf` (masquages par mot-clef) ; `root-entry` et `model-or-unit` ne portent que des modifiers non lus (armes, Crusade) ou des `set hidden` Crusade. |
| `scope=force` / `roster` / `primary-catalogue` | 1 351 / 3 319 / 617 | ✅ | Détachement actif, roster, catalogue primaire. |
| `includeChildSelections` / `includeChildForces` / `percentValue` / `childName` / `shared` | 14 976 / 4 846 / 415 / 234 / 17 942 | ➖ | Sans objet (une force ; `shared` toujours true ; `childName` = confort d'édition). |
| `repeat` (`value`, `repeats`, `scope`, `childId`, `roundUp`) | 1 790 | 🟡 | Premier `repeat` d'un modifier appliqué (`floor`/`ceil` selon `roundUp`, × `repeats`) : coûts par copie, plafonds « 1 par 5/10 modèles ». Un modifier à plusieurs `repeat` (aucun cas en base) ne lirait que le premier. |

## 7. Profils, caractéristiques, coûts, règles

| Élément | Occ. | Appli | Détail |
|---|---|---|---|
| `profile@typeName` Unit / Ranged / Melee / Abilities / Transport / Force Disposition | 1 325 / 2 747 / 1 873 / 4 936 / 64 / 271 | ✅ | Stats, armes (sous-profils `➤`), capacités (dédoublonnées unité + modèles), capacité de transport, disposition de force. |
| `typeName` spéciaux (Orders, Rituals, Blessings of Khorne, Marks of Chaos, C'tan Powers, Assimilation…) | 22 types, ~140 profils | ✅ | Rendus en **sections** nommées par `typeName` (`isSectionTn`) ; `C'tan Powers` (colonnes d'arme) rendu comme section, pas comme arme. |
| `characteristic` (`Description`, `Effect`, `Ability`, `Capacity`, `Warp Charge`, `D6`, `Roll`, `Planning Points`…) | 45 752 | 🟡 | `Description`/`Effect`/`Rules` lues pour les capacités ; les colonnes secondaires (`D6`, `Roll`, `Planning Points`, `Influence Goal`…) ne sont pas affichées. |
| `characteristic@hidden` / `profile@hidden` | 242 (toutes `false`) / 2 | ➖ | |
| `cost name=pts` / `DP` | 4 354 / 270 | ✅ | Points et coût de détachement. |
| Monnaies Crusade (Diplomatic/Military Power, Blackstone Fragments, Honour/Relic/Commendation/Logistics/Purgation Points, Crusade:*) / `pl` | ~2 600 / 10 | ➖ | Crusade non gérée ; `pl` (Power Level) obsolète. |
| `rule` (+ `hidden`, gates) / `sharedRules` | 1 767 / 26 | ✅ | Règles d'armée et de détachement filtrées par `primary-catalogue`, stratagèmes `(Stratagem, NCP)`, règles d'armes conditionnelles du gst. |

## 8. Marqueurs `<comment>` (canal machine du dépôt)

| Marqueur | Occ. | Appli | Détail |
|---|---|---|---|
| `sim-mod:` | 800 | ✅ | Bonus simulables (unité, amélioration, règle, stratagème, **option d'équipement** depuis 2026-09). |
| `invuln:` / `fnp:` / `must-warlord` / `cannot-warlord` / `leader-kw:` | 257 / 11 / — / — / — | ✅ | Marqueurs de stats (`STAT_MARKERS`). |
| `strat-timing:` | 1 343 | ✅ | Tour/phase des stratagèmes. |
| `leader-link:` / `support-link:` | 256 / 34 | ✅ (indirect) | Informatifs : l'appli lit les groupes déclaratifs `Can Lead (MFM)` / `Can Support (MFM)`, pas le commentaire. |
| `chapter-cost:` | 20 | ➖ | Informatif : le modifier natif `primary-catalogue` est évalué. |
| `pts:` / `mfm-size` | 69 / 10 | ➖ | Notes d'édition (points provisoires, taille MFM). |
| Texte libre (Crusade modifiers 813, Crucible, White Dwarf, BS/WS notes…) | ~1 900 | ➖ | Commentaires d'auteur. |

## 9. Écarts classés par impact

1. **Modifiers de caractéristiques d'armes** (~900 : `increment`/`decrement`/`replace`/`append`/`floor` avec `affects=…Weapons`, portée `model`/`root-entry`/`model-or-unit`) — les bonus d'amélioration/détachement sur A/S/AP/D/mots-clefs ne touchent ni la fiche ni les exports ; le simulateur ne les voit que via `sim-mod`. Piste : évaluer au parse les modifiers **inconditionnels** d'une amélioration vers les armes du porteur (même mécanique que `extractStatMods`, avec résolution du chemin `affects`), et les exposer comme `weaponMods` par amélioration.
2. **Options masquées puis révélées** (36, dont 14 révélations inconditionnelles sur les Assassins des Agents) — options absentes de l'appli. Piste : ne sauter un nœud `hidden="true"` que si aucun `set hidden=false` décidable ne le révèle (parse pour `parent`/inconditionnel, gate runtime pour `roster`).
3. **`add error` hors unité** (~40) et **`add warning`** (7) — règles de liste non vérifiées (Warlord obligatoire Ynnari, prérequis d'upgrade T'au). Piste : étendre `modCollectErrors` aux comptes roster (`fcounts`) pour les conditions `roster`/`force`/`instanceOf`.
4. **Bornes de groupes d'options conditionnées hors taille** (part des 1 094 `set` / 1 923 `increment` sur contraintes) — un groupe redimensionné par un détachement ou une amélioration garde ses bornes statiques. Piste : appliquer `buildDynBounds` aux groupes d'options avec les comptes roster.
5. **Portée des conditions non lue** — fonctionne par construction des sacs de comptes ; à documenter comme invariant (un modifier d'unité ne doit porter que des conditions locales ou `primary-catalogue`, un modifier de coût des conditions `roster`).
6. **`import="false"`** (18) — vérifier que les Agents n'héritent pas des 8 liens Deathwatch marqués non importables.
7. **Ids hérités `<id>-min`/`<id>-max`** (~60 modifiers inertes) — nettoyage côté données.
8. Cosmétique : `set name` des variantes (78), `annotation` (357), colonnes secondaires des profils spéciaux.

## 10. Reproduire l'inventaire

Le script d'inventaire (Python, `xml.etree`) et la grille de couverture (grep du
parseur et du runtime) sont dans l'historique de session ; le tableau de la
section 1 se régénère en comptant les tags de tous les `.cat`/`.gst`. Les
sentinelles existantes côté appli (`tests/cogitator_tests.cjs`, `data-audit`)
et côté données (`valider.mjs`, `defauts-groupes.mjs`, `tier-audit.mjs`,
`dp-audit.mjs`, `wpn-audit.mjs`) couvrent les invariants déjà encodés ; les
points 1 à 4 ci-dessus sont les prochains à outiller.
