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

### Variante native — démons des légions du Chaos (texte officiel, 2026-10-09)

Les quatre légions vouées ont chacune un détachement qui ajoute leurs démons. Texte de
l'appli officielle (capture Tallyband Summoners, même libellé pour les quatre), encodé
comme **première règle** du détachement, nommée d'après la légion :

> You can include PLAGUE LEGIONS units in your army, even though they do not have the DEATH
> GUARD Faction keyword. The combined points cost of such units you can include in your army is:
> ■ Incursion: Up to 500 pts ■ Strike Force: Up to 1000 pts ■ Onslaught: Up to 1500 pts
> No PLAGUE LEGIONS models from your army can be your WARLORD.

| Catalogue | Détachement | Règle / mot-clef de faction des démons |
|---|---|---|
| `Chaos - Death Guard.cat` | Tallyband Summoners | Plague Legions |
| `Chaos - Emperor's Children.cat` | Carnival of Excess | Legions of Excess |
| `Chaos - Thousand Sons.cat` | Changehost of Deceit | Scintillating Legions |
| `Chaos - World Eaters.cat` | Khorne Daemonkin | Blood Legions |

```
det-allies: keyword="Plague Legions" maxPts=1000 maxPtsBySize="Incursion=500,Strike Force=1000,Onslaught=1500" native cannot-warlord
```

| Clef | Sens |
|---|---|
| `maxPtsBySize` | plafond selon le **format de partie** (nom de format = celui de l'appli) ; `maxPts` = repli pour un format absent de la table |
| `native` | fiches démons = entrées **du catalogue de la légion**, déjà masquées sans le détachement (`hidden` si `lessThan 1` sélection du détachement) : rien à charger |
| `cannot-warlord` | en natif, s'applique aux unités portant le mot-clef de faction `keyword` (aucune n'a d'ailleurs de lien « Warlord » dans BattleScribe) |

Plafond **aussi encodé nativement** pour BattleScribe/NewRecruit : catégorie `Faction: <légion>` →
contrainte `max` pts `scope="force"` à 0, puis `set 500/1000/1500` si (détachement sélectionné **et**
format Incursion/Strike Force/Onslaught), chaque modifier portant un `conditionGroup and`.

## Ce que l'appli doit faire

1. **Réservoir** (sauf `native`) : quand le détachement est **sélectionné**, offrir les unités de `faction` dont les
   mots-clefs de faction contiennent `keyword` (hors fiches déjà natives de l'armée), marquées alliées.
   Elles disparaissent du catalogue si le détachement est retiré.
2. **Plafond** : somme des points (surcoûts compris) des unités alliées de ce détachement ≤ plafond
   du format courant (`maxPtsBySize`, sinon `maxPts`), sinon erreur de validation. En `native`,
   « alliées » = unités de l'armée portant le mot-clef de faction `keyword`.
3. **Warlord** : `cannot-warlord` → l'étoile Warlord n'est pas proposée (en natif : aux unités du
   mot-clef `keyword`), et la validation refuse une liste qui en désigne une.
4. **Améliorations** : `kill-team-enh-only` → une unité KILL TEAM ne se voit proposer, et ne peut garder,
   que les améliorations dont le détachement est celui-ci (Beacon Angelis).
5. **Orphelins** : une unité ajoutée via ce détachement alors qu'il n'est plus sélectionné → erreur.

Référence d'implémentation : cogitator-bellicum, `scripts/bsdata-parser.mjs` (`detAllies` → `dets[].allies`,
`cannotWL` posé sur les alliés natifs), `src/App.jsx` (`detAllyFactions`, `detAllyUnits`, format passé à la
validation), `src/rules.js` (`detAllyCap`, `detAlliesErrors`, `detAllyEnhAllowed`),
tests `tests/det_allies_tests.mjs`.
