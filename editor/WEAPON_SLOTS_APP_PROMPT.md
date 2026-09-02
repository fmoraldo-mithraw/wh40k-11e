# PROMPT — Arme de base fixe + emplacement d'arme optionnel « au choix »

> Prompt autonome (application consommatrice). Correctif d'**affichage/évaluation des
> options d'arme**. Aucune donnée à changer.

## Mécanique
Un modèle a une **arme de base toujours équipée**, **plus** un **emplacement optionnel**
où l'on choisit **au plus une** arme parmi une liste. Ex. **Chaos Rhino** : combi-bolter
de base **+** emplacement « Pintle weapon » = 0 ou 1 arme, au choix **Combi-bolter** ou
**Combi-weapon**.

## Distinguer base / optionnel dans la donnée
- **Arme de BASE (toujours là)** : `entryLink`/`selectionEntry` avec **`min=1`**
  (`scope="parent"`). ⇒ toujours équipée, **pas un choix** → lecture seule.
- **Emplacement OPTIONNEL « au choix »** : un **`selectionEntryGroup`** avec **`max=1`**
  et **sans `min`** (min 0), contenant **plusieurs** options d'arme. ⇒ **0 ou 1** →
  choix « une parmi, ou aucune » (radio avec option vide / menu incluant « — »).
- **Option isolée** (ex. Havoc launcher) : entrée `min 0 / max 1` hors groupe ⇒ bascule oui/non.
- ⚠️ Une **même arme peut figurer en base ET comme option** (même `targetId`, ids de
  sélection différents) = **deux emplacements distincts** : le modèle peut cumuler les
  deux (ex. 2 combi-bolters).

## Ce que l'appli doit faire
1. **Toujours équiper** les armes `min ≥ 1` (base) ; ne pas les présenter comme un choix.
2. **Rendre un groupe `max=1` (min 0)** comme **choix exclusif optionnel** (une parmi, ou
   aucune ; respecter `max=1`).
3. **Proposer toutes** les options du groupe (pas seulement la première / le défaut).
4. **Ne pas fusionner** base et option de même nom : compte-les séparément (loadout final
   peut lister 2× la même arme).
   **Convention de nommage (base)** : quand l'option est **la même arme** que la base
   sur le **même modèle** (2ᵉ exemplaire), l'entrée d'option porte un nom **distinct**
   qui **contient** celui du profil — « Rokkit Pistol (2nd) » (Nob des Breaka Boyz /
   Tankbustas : 2 rokkit pistols OU rokkit pistol + smash hammer), « Additional Busta
   Rokkit Launcha ». L'appli en déduit **un exemplaire de plus** (compte 2×). Un choix
   nommé **exactement** comme le profil (« Bolt Rifle » dans le radio « Weapon 1 » de
   l'Intercessor Sergeant, à côté du Bolt Rifle fixe) reste un **échange** : rien à
   ajouter. Un choix composé « A & B » n'est jamais un ajout.
5. **Coût** : chaque arme sélectionnée ajoute son propre coût (base + option). Évalue
   par modèle (`scope="parent"`) vs par unité (`scope="unit"`).

## Exemple — Chaos Rhino
- Base : **Combi-bolter** (×1, toujours). Option isolée : **Havoc launcher** (0/1).
- Emplacement « **Pintle weapon** » (`max 1`, min 0) : **Combi-bolter** ou **Combi-weapon**, ou rien.
- Loadouts valides : `combi-bolter` ; `+ combi-bolter` ; `+ combi-weapon` ; (± havoc launcher).

## Arme multi-profils (distance ET mêlée dans une seule arme)
Une **même arme** peut porter **plusieurs profils**, y compris **à la fois distance et
mêlée** (ex. **Kustom Blasta X** de Nazdreg : 3 profils *Ranged* — Gatler / Shoota /
Skorcha — **+** 1 profil *Melee*). C'est un **unique** `selectionEntry` avec plusieurs
`<profile>` mélangeant `typeName="Ranged Weapons"` **et** `typeName="Melee Weapons"`.
- L'appli doit **présenter tous les profils** de l'arme (regroupés sous son nom), pas
  seulement le premier, et — au tir / au corps-à-corps — laisser **choisir un profil
  éligible par attaque** (« *select one of its profiles* »).
- Ne compte l'arme **qu'une fois** dans le loadout (un seul emplacement), même à N profils.
  Les profils *Ranged* vont dans la table distance, le(s) profil(s) *Melee* dans la table mêlée.

## Échange combiné : une arme en remplace deux
Certaines options **remplacent deux armes de base par une seule** (ex. Ork Nob :
« Kustom Choppa **et** Kombi-skorcha remplacés par 1 Big Choppa »). Encodage : l'option
(Big Choppa) est un choix d'un **emplacement** (ici mêlée) ; un **`modifier type="set"
value="0"`** sur les contraintes **min ET max** de **l'autre emplacement** (ici distance),
conditionné `atLeast 1` sur la sélection de l'option (`childId=<id Big Choppa>`,
`scope="parent"`, `includeChildSelections="true"`), **vide** ce second emplacement quand
l'option est prise.
- L'appli doit **exécuter ce modifier** : si Big Choppa est sélectionné, l'emplacement
  distance passe à **min=0 / max=0** ⇒ **ne propose plus** (et ne compte plus) d'arme
  distance pour ce modèle. Ne te fie **pas** au `min=1` statique de l'emplacement : **réévalue
  les bornes après modifiers** (piège classique : afficher une arme distance déjà « consommée »).

## Invariants
- `min ≥ 1` ⇒ base (lecture seule) ; `max=1` + min 0 ⇒ choix « 0/1 ».
- Arme en base **et** en option = deux emplacements indépendants.
- Une arme = **un** emplacement même à plusieurs profils (distance+mêlée) ; présente-les tous.
- Bornes d'un emplacement = **après** modifiers (un échange combiné peut mettre min/max à 0).
- Correctif côté appli : la donnée est correcte.
