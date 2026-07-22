# Agents de l'Imperium — double tarification (armée vs alliés)

Mémo pour toute intégration MFM future. **À lire avant de toucher aux
points de `Imperium - Agents of the Imperium.cat`.**

## Le principe

Les Agents de l'Imperium ont **deux jeux de prix** dans chaque MFM :

1. **Prix « armée »** — quand on joue une armée Agents of the Imperium
   (le catalogue Agents est le catalogue primaire du roster) ;
2. **Prix « alliés »** — quand les unités Agents sont prises en alliés
   dans une autre armée (généralement plus chers, parfois moins —
   ex. Exaction Squad).

Dans le PDF MFM (et donc dans les dumps JSON `mfm/en/json/imperial-agents.json`),
**chaque unité apparaît DEUX FOIS** :

- **1ʳᵉ occurrence = prix armée** (section « every model in your army has
  the AGENTS OF THE IMPERIUM keyword ») ;
- **2ᵉ occurrence = prix alliés** (section « if your army faction is not
  AGENTS OF THE IMPERIUM »).

Les détachements/améliorations n'apparaissent qu'une fois (réservés à
l'armée Agents pure).

## Pièges

- Un normaliseur naïf (`dict[name] = rec`) **écrase la 1ʳᵉ occurrence par
  la 2ᵉ** → on applique les prix ALLIÉS comme prix de base. C'est
  exactement le bug corrigé le 22-07-2026. **Toujours garder la PREMIÈRE
  occurrence** pour l'audit des prix de base.
- Ne pas conclure « prix déjà bon » en comparant le base au prix allié :
  vérifier occurrence par occurrence.

## Encodage dans le repo

- Le **prix de base** de l'entrée = **prix armée**.
- Le **surcoût allié** = `<modifier type="increment">` (ou `decrement` si
  l'allié est moins cher) sur `field=COST_PTS`, conditionné par :

  ```xml
  <condition type="notInstanceOf" value="1" field="selections"
             scope="primary-catalogue" childId="b00-cd86-4b4c-97ba" shared="true"/>
  ```

  `childId = b00-cd86-4b4c-97ba` = id du catalogue Agents of the
  Imperium : la condition se lit « le catalogue primaire du roster N'EST
  PAS Agents » → le surcoût s'applique en jeu allié uniquement.
- Cas à paliers (Inquisitorial Agents) : un increment allié de base
  **plus** un second increment conditionné taille
  (`greaterThan 6 model`) pour reproduire 50/100 (armée) vs 60/120 (allié).
- Certains surcoûts alliés sont portés par des **wargear/modèles**
  (Micromelta, Intraneural Biotech, Narthecium, Twin multi-melta…) — même
  motif `notInstanceOf`/`primary-catalogue`, à ne pas confondre avec le
  surcoût de l'unité.
- Si armée = allié pour une unité, **pas de modifier** (en 22-07 :
  Watch Master, Deathwatch Kill Team — leurs anciens modifiers alliés ont
  été retirés).

## Procédure MFM

1. Normaliser le dump en gardant la **1ʳᵉ occurrence** par nom d'unité
   (prix armée) ; extraire la 2ᵉ occurrence séparément (prix alliés).
2. Mettre à jour les **bases** avec les prix armée.
3. Calculer `delta = allié − armée` par unité et **synchroniser les
   increments/decrements alliés** (créer/mettre à jour/supprimer si 0).
4. Vérifier les paliers (Inquisitorial Agents) et le repeat-cost
   (Sisters of Battle Immolator) dans les deux jeux de prix.
5. Validation habituelle (xmllint, catalog.validate, 0 id dupliqué).

Voir aussi : `MFM_PROMPT.md` (mécanique générale des points),
`ALLIED_UNITS_APP_PROMPT.md` (statut allié côté appli consommatrice).
