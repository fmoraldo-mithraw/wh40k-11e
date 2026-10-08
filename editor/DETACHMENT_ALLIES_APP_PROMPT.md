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
| `faction` | catalogue où les puiser (nom de faction de l'appli ; défaut = `keyword`) |
| `maxPts` | total de points cumulé de ces unités (0/absent = sans plafond) |
| `cannot-warlord` | aucune de ces unités ne peut être Warlord |
| `kill-team-enh-only` | les unités **KILL TEAM** ne portent que des améliorations **de ce détachement** |

Le détachement est masqué pour la faction alliée elle-même (`instanceOf primary-catalogue` Deathwatch).

## Ce que l'appli doit faire

1. **Réservoir** : quand le détachement est **sélectionné**, offrir les unités de `faction` dont les
   mots-clefs de faction contiennent `keyword` (hors fiches déjà natives de l'armée), marquées alliées.
   Elles disparaissent du catalogue si le détachement est retiré.
2. **Plafond** : somme des points (surcoûts compris) des unités alliées de ce détachement ≤ `maxPts`,
   sinon erreur de validation.
3. **Warlord** : `cannot-warlord` → l'étoile Warlord n'est pas proposée, et la validation refuse une
   liste qui en désigne une.
4. **Améliorations** : `kill-team-enh-only` → une unité KILL TEAM ne se voit proposer, et ne peut garder,
   que les améliorations dont le détachement est celui-ci (Beacon Angelis).
5. **Orphelins** : une unité ajoutée via ce détachement alors qu'il n'est plus sélectionné → erreur.

Référence d'implémentation : cogitator-bellicum, `scripts/bsdata-parser.mjs` (`detAllies` → `dets[].allies`),
`src/App.jsx` (`detAllyFactions`, `detAllyUnits`), `src/rules.js` (`detAlliesErrors`, `detAllyEnhAllowed`),
tests `tests/det_allies_tests.mjs`.
