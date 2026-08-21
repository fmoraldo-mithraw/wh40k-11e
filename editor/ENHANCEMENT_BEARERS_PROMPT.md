# Liaison améliorations ↔ mots-clefs — invariant permanent

> **À exécuter à CHAQUE modification de la base** qui touche une datasheet
> de personnage ou une amélioration (nouveau codex, nouvelle fiche, renommage
> de catégorie, nouveau détachement). Ce document existe parce que deux trous
> réels ont atteint l'appli : le **Big Mek Dakkarig** ne pouvait porter
> aucune amélioration (sa fiche ne liait pas le menu Enhancements), et
> **Surly As A Squiggoth** s'offrait à 15 personnages au lieu de 3 (porte
> de visibilité encodée ET au lieu de OU).

## L'invariant

Pour chaque amélioration **non-« Upgrade »** d'une faction :

> Tout personnage **non-Epic** (hors [Legends]/[Crucible]) dont les
> mots-clefs satisfont la clause de prose « … model only » doit être un
> porteur **structurel** — et personne d'autre.

La prose est la source de vérité (règle maison n° 2 : conjonction de
mots-clefs, jamais de traversée du menu central). Les « Upgrade » suivent
la même logique mais visent des **unités** (règle maison n° 1).

## Les deux conditions structurelles (les deux pannes possibles)

1. **La fiche doit lier le menu** : chaque personnage éligible porte deux
   `entryLink` sur son entrée racine — `Warlord` (targetId
   `8b5-898c-f79b-5a9c`) et `Enhancements` (targetId = groupe central de la
   faction). Sans eux, le personnage ne peut RIEN porter, quelles que
   soient les portes. *(Panne Dakkarig : fiche créée par codexgen sans ces
   liens — probablement parce que personnage VEHICLE, cas atypique.)*
   Les **Epic Heroes ne lient pas le menu** : c'est l'encodage de leur
   exclusion — ne jamais les lier.

2. **La porte de visibilité doit encoder la clause de prose** : modifier
   `set hidden=true` sur l'entrée de l'amélioration, arbre :

   ```
   OR(
     <échec d'éligibilité>,            ← voir table ci-dessous
     AND(atLeast 1 roster childId=<soi>, lessThan 1 parent childId=<soi>)  ← unicité d'armée
   )
   ```

   | Clause de prose                        | Échec d'éligibilité (enfants du OR racine)                    |
   |----------------------------------------|----------------------------------------------------------------|
   | `X model only`                         | `notInstanceOf X` (condition directe)                          |
   | `X Y model only` (conjonction)         | `notInstanceOf X` **et** `notInstanceOf Y` en conditions **DIRECTES du OR** (⚠ jamais dans un AND : « caché dès qu'UN mot-clef manque ») |
   | `A/B/C model only` (alternatives)      | `AND(notInstanceOf A, notInstanceOf B, notInstanceOf C)`       |
   | `A/B Y model only` (mixte)             | `AND(notInstanceOf A, notInstanceOf B)` **plus** `notInstanceOf Y` en condition directe |
   | `… (excluding Z models)`               | `instanceOf Z` en condition directe du OR                      |
   | `<Faction> model only` (aucun autre mot-clef) | **aucune** condition de catégorie — la restriction aux personnages non-Epic est déjà portée par les liens de menu |

   Les `childId` pointent des **catégories** (scope `parent`) ; réutiliser
   les ids existants (`grep 'categoryEntry name="…"'`), ne jamais en créer
   de doublon. *(Panne Surly : conjonction `Infantry Warboss` encodée
   `AND(notInstanceOf Warboss, notInstanceOf Infantry)` = caché seulement
   si NI l'un NI l'autre — tout personnage Infantry passait.)*

## Vérification (obligatoire avant commit)

1. **Côté données** : pour chaque amélioration modifiée/ajoutée, dériver à
   la main l'ensemble attendu depuis la prose et le comparer aux porteurs
   synthétisés (parseur de l'appli) :
   ```js
   // cogitator-bellicum
   const F = await parseAllCatalogues(...); const f = F["<Faction>"];
   for (const e of f.enhs) console.log(e.name, (e.bearers||[]).map(b =>
     f.units.find(u => u.bsId === b)?.name));
   ```
2. **Sentinelle CI** (appli) : `scripts/data-audit.mjs` porte l'anomalie
   `amelioration-porteur-manquant` — personnage non-Epic dont les mots-clefs
   satisfont `reqKeywords` (clause de prose) mais absent des porteurs
   structurels. Toute nouvelle anomalie au-delà de la ligne de base fait
   échouer l'audit : si elle apparaît, c'est un lien de menu ou une porte à
   réparer (ce document), pas la ligne de base à re-figer.
3. `xmllint` + `catalog.validate` (0 erreur, 0 id dupliqué vs HEAD), comme
   toujours.

## Pièges connus

- **WAGON, SPEED FREEKS…** : mots-clefs de groupe — vérifier que chaque
  fiche visée porte bien la **catégorie** (pas seulement le nom qui y fait
  penser). « WAGON » = Battlewagon/Gunwagon/Hunta Rig/Kill Rig.
- **WARBOSS est large** : Deffkilla Wartrike, Beastboss, Beastboss on
  Squigosaur portent la catégorie Warboss — c'est voulu (mot-clef imprimé).
- **Personnages véhicules/montés** (Dakkarig, Wartrike…) : éligibles comme
  les autres si la clause n'exige pas INFANTRY — ne pas oublier leurs liens
  de menu sous prétexte qu'ils sont atypiques.
- Un personnage ajouté par un **nouveau codex** doit être passé au crible
  des améliorations *existantes* de sa faction (ses catégories peuvent le
  rendre éligible à d'anciennes portes à alternatives).
