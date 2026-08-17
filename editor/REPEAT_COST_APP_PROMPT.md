# Prix par seuil de répétition — prompt autonome (application consommatrice)

Le Munitorum Field Manual tarife certaines fiches par répétition : « vos N
premiers exemplaires coûtent X, chaque exemplaire au-delà du Nᵉ coûte X+Δ »
(Fire Dragons : les 2 premiers à 110, le 3ᵉ+ à 120 ; Starweaver, Night
Spinner, Dark Commune… — ~370 fiches).

## Encodage : FORME NATIVE, aucun commentaire

Depuis août 2026, ce dépôt n'utilise **plus aucun marqueur `<comment>`** pour
ce mécanisme. La **convention du dépôt définit la sémantique directement sur
la forme BattleScribe standard** :

```xml
<selectionEntry type="unit" id="UNIT-ID" name="Fire Dragons">
  <modifiers>
    <modifier type="increment" field="51b2-306e-1021-d207" value="10">
      <conditions>
        <condition type="atLeast" value="3" field="selections"
                   scope="roster" childId="UNIT-ID" shared="true"
                   includeChildSelections="true" includeChildForces="true"/>
      </conditions>
    </modifier>
  </modifiers>
</selectionEntry>
```

**Règle de reconnaissance** — un modificateur est un prix par répétition si
et seulement si :
- `type="increment"` sur le champ de coût pts (`51b2-306e-1021-d207`), et
- il porte (directement ou dans un `conditionGroup`) une
  `<condition type="atLeast" scope="roster">` de valeur K ≥ 2.

Alors : **threshold = K − 1** (les K−1 premiers au prix de base) et
**delta = value du modificateur**, appliqué **par exemplaire à partir du
Kᵉ** dans TOUT le roster (compter toutes les copies de la fiche, pondérées
par quantité).

## Ce que l'appli doit faire

1. Reconnaître la forme au parse → `{threshold, delta}` sur la fiche.
2. **Exclure** ce modificateur de l'évaluation de coût par unité (sa
   condition roster ne peut pas s'évaluer sur une unité isolée — et
   l'évaluation naïve BattleScribe surtaxerait TOUTES les copies dès que
   K sont alignées, y compris les K−1 premières : c'est faux).
3. Au total d'armée : `surtaxe = Δ × max(0, copies − threshold)`, répartie
   par ligne si l'affichage par ligne doit sommer juste
   (`surchargedCopies(prior, q, N) = max(0, prior+q−N) − max(0, prior−N)`).

## Pourquoi cette lecture est sûre

- Vérifié **1:1 sur toute la base** au moment de la migration : 372
  modificateurs de cette forme, tous des prix par répétition, zéro
  contre-exemple, et l'ancien marqueur dupliquait exactement (Δ, K−1).
- L'autre lecture possible (« toutes les copies +Δ dès que K sont
  fielded ») **n'existe pas** dans la tarification GW — ce n'est pas un
  mécanisme du jeu.
- Les applis qui évaluent naïvement (NewRecruit…) voient le même fichier
  qu'avant : le marqueur ne changeait déjà rien pour elles.

## Historique

Deux encodages précédents sont morts : l'entrée jumelle cachée
`(additional)` (ne remontait pas dans les applis — résorbée, 0 restante) et
le marqueur `<comment>repeat-cost: threshold=N delta=Δ</comment>` (redondant
avec le XML natif — supprimé, n'en réintroduire aucun ; l'audit de l'appli
consommatrice signale tout marqueur réapparu).
