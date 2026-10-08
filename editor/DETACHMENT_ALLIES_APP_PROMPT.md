# Alliés accordés par un DÉTACHEMENT — marqueur `det-allies:` (prompt autonome, appli consommatrice)

Certains détachements autorisent des unités **d'une autre faction** dans l'armée, sous plafond.
Cas réel (11ᵉ, MFM v1.5) : **Deathwatch Support** (Space Marines et chapitres, 1 DP, *Disruption*) —
règle *Mission Tactics*, paragraphe **DEATHWATCH ALLIES** :

> You can include DEATHWATCH units in your army, even though they do not have the same Chapter faction
> keyword as other units in your army. The combined points value of such units cannot exceed 500 points.
> When mustering your army, unless otherwise stated, you cannot select a DEATHWATCH model to be your
> WARLORD. In addition KILL TEAM units can only contain enhancements taken from this detachment.

## Encodage (données)

Sur la `selectionEntry` du détachement (`Imperium - Space Marines.cat`, groupe `Detachment`), dans son
`<comment>` (même canal que `sim-mod:` / `strat-timing:`) :

```
det-allies: keyword="Deathwatch" faction="Deathwatch" maxPts=500 cannot-warlord kill-team-enh-only
```

| Clef | Sens |
|---|---|
| `keyword` | mot-clef de **faction** des unités alliées admises (`Faction: Deathwatch`) |
| `faction` | catalogue où les puiser (nom de faction de l'appli) ; **absent** = variante native ci-dessous |
| `native` | les unités alliées sont **déjà dans le catalogue** de l'armée (gâtées par le détachement) : rien à charger, seul le plafond s'applique |
| `maxPts` | total de points cumulé de ces unités (0/absent = sans plafond) |
| `cannot-warlord` | aucune de ces unités ne peut être Warlord |
| `kill-team-enh-only` | les unités **KILL TEAM** ne portent que des améliorations **de ce détachement** |

Le détachement est masqué pour la faction alliée elle-même (`instanceOf primary-catalogue` Deathwatch).

### Variante native — démons des légions du Chaos (décision du 2026-10-08)

Les quatre légions vouées ont chacune un détachement qui ajoute leurs démons, **1000 pts au plus**
(règle donnée par l'utilisateur ; la source game-datacards ne porte que le texte des règles) :

| Catalogue | Détachement | Mot-clef de faction des démons |
|---|---|---|
| `Chaos - Death Guard.cat` | Tallyband Summoners | Plague Legions |
| `Chaos - Emperor's Children.cat` | Carnival of Excess | Legions of Excess |
| `Chaos - Thousand Sons.cat` | Changehost of Deceit | Scintillating Legions |
| `Chaos - World Eaters.cat` | Khorne Daemonkin | Blood Legions |

```
det-allies: keyword="Plague Legions" maxPts=1000 native
```

Les fiches démons sont des entrées **du catalogue de la légion**, déjà masquées sans le détachement
(`hidden` si `lessThan 1` sélection du détachement). Le plafond est **aussi encodé nativement** pour
BattleScribe/NewRecruit : catégorie `Faction: <légion>` → contrainte `max` pts `scope="force"` à 0,
`set 1000` si le détachement est sélectionné (remplace l'ancien 500/1000/1500 selon le format,
reliquat 10ᵉ). L'appli ne charge rien : elle applique le **plafond** (point 2) aux unités dont les
mots-clefs de faction contiennent `keyword`.

## Ce que l'appli doit faire

1. **Réservoir** (sauf `native`) : quand le détachement est **sélectionné**, offrir les unités de `faction` dont les
   mots-clefs de faction contiennent `keyword` (hors fiches déjà natives de l'armée), marquées alliées.
   Elles disparaissent du catalogue si le détachement est retiré.
2. **Plafond** : somme des points (surcoûts compris) des unités alliées de ce détachement ≤ `maxPts`,
   sinon erreur de validation. En `native`, « alliées » = unités de l'armée portant le mot-clef de
   faction `keyword`.
3. **Warlord** : `cannot-warlord` → l'étoile Warlord n'est pas proposée, et la validation refuse une
   liste qui en désigne une.
4. **Améliorations** : `kill-team-enh-only` → une unité KILL TEAM ne se voit proposer, et ne peut garder,
   que les améliorations dont le détachement est celui-ci (Beacon Angelis).
5. **Orphelins** : une unité ajoutée via ce détachement alors qu'il n'est plus sélectionné → erreur.

Référence d'implémentation : cogitator-bellicum, `scripts/bsdata-parser.mjs` (`detAllies` → `dets[].allies`),
`src/App.jsx` (`detAllyFactions`, `detAllyUnits`), `src/rules.js` (`detAlliesErrors`, `detAllyEnhAllowed`),
tests `tests/det_allies_tests.mjs`.
