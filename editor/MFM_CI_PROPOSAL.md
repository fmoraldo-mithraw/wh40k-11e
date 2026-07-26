# Proposition — Intégration continue des points MFM (matrices nom↔id auto)

> But : quand un nouveau Munitorum Field Manual sort, appliquer les
> changements de points à la bdd `.cat` **automatiquement**, sans ressaisie
> manuelle, avec relecture humaine réduite au strict résidu. Ce document
> décrit une solution éprouvée sur les données réelles (chiffres ci-dessous),
> l'architecture (matrice nom↔id auto-maintenue + moteur de diff), et le
> traitement des cas durs. Compagnon de `MFM_PROMPT.md` (encodage des points).

## L'entrée : le MFM est déjà extractible en JSON structuré

L'extracteur fourni (`mfm_parser.py` / `mfm_dump.py`) produit, par faction,
un JSON propre et **déjà diffé** :

```json
{ "faction": "ORKS", "version": "v1.1", "changed": true,
  "units": [
    { "name": "MEK", "changed": true, "change": "increased",
      "profiles": [{ "tier": "YOUR UNIT COSTS", "size": "1 model",
                     "points": 55, "delta": 10, "change": "up" }] },
    { "name": "BOYZ", "profiles": [
        { "tier": "YOUR 1ST TO 3RD UNITS COST", "size": "10 models", "points": 75 },
        { "tier": "YOUR 1ST TO 3RD UNITS COST", "size": "20 models", "points": 160, "delta": 10 },
        { "tier": "YOUR 4TH + UNIT COSTS", "size": "10 models", "points": 85 } ] } ],
  "detachments": [{ "name": "BULLY BOYZ",
    "enhancements": [{ "name": "Big Gob", "points": 20, "delta": null }] }] }
```

Points clefs déjà présents dans l'extraction :
- `points`, `delta`, `change` **par profil** → on sait quoi a bougé et de combien.
- `changed` / `change_tags` **par unité** → on peut ne traiter que le diff.
- `tier` distingue **paliers de taille** (`10 models`/`20 models`) et **prix par
  répétition** (`1ST TO 3RD` vs `4TH +`), qui mappent exactement sur les deux
  mécanismes déjà encodés dans la bdd (`applyTiers`, `repeat-cost`).
- Enhancements par détachement avec leurs points.

Donc **l'extraction n'est pas le problème**. Le problème est la **jointure**
entre un MFM indexé par **nom** (majuscules) et une bdd indexée par **id**
BattleScribe.

## La jointure : la matrice nom↔id

### Résultat mesuré (POC sur le dump réel + la bdd actuelle)

| Base de jointure | Couverture noms | Résidu |
|---|---|---|
| Match par fichier `.cat` brut (naïf) | **52 %** (756/1454) | 698 |
| Match contre les données **parsées par l'app** (imports résolus) | **98,0 %** (1354/1382) | **28** |

L'écart vient d'une seule cause structurelle : **la clôture d'import**. Les
chapitres Space Marines (Space Wolves, Blood Angels…) et les factions
« importateur mince » (Aeldari→Library, Imperial Knights→Library) n'ont
**pas** leurs datasheets dans leur propre `.cat` — elles importent le tronc
commun via `<catalogueLink>`. Un match fichier-par-fichier rate donc 80 % des
unités d'un chapitre. Le parseur de l'app (`scripts/bsdata-parser.mjs`)
**résout déjà cette clôture** et expose, par faction, la liste complète des
datasheets avec leur `bsId` réel — c'est la bonne fondation pour la matrice.

### Le résidu (28 noms) est petit et catégorisable

- `ANCIENT IN TERMINATOR ARMOUR` (tous chapitres) : la datasheet existe sous un
  nom voisin / variante — **une** règle d'alias la couvre partout.
- Personnages nommés de chapitre (`PEDRO KANTOR`, `VULKAN HE'STAN`, `LYSANDER`…,
  20 sous `space-marines`) : ils vivent dans le `.cat` de **leur chapitre**
  (Imperial Fists, Salamanders…), pas dans la faction « Space Marines » de base.
  Le MFM les range tous sous `space-marines` → l'override les route vers le bon
  codex.
- Singulier/pluriel & orthographe : `SOUL GRINDER`, `MYPHITIC BLIGHT-HAULERS`,
  `PIRANHAS` → alias 1-à-1.

Ces 28 vivent dans un **fichier d'override versionné**, écrit une fois, jamais
deviné par la machine.

### Forme de la matrice

Un fichier par faction, **régénéré à chaque run** et commité :

```json
// editor/mfm/map/orks.json  (généré)
{ "faction": "Orks", "builtFrom": "<sha bdd>",
  "matched": {
    "MEK": { "bsId": "…", "catName": "Mek" },
    "BOYZ": { "bsId": "…", "catName": "Boyz", "tiers": true, "repeat": true } },
  "unmapped": ["…"],           // noms MFM sans datasheet → à relire
  "orphans": ["…"] }           // datasheets sans nom MFM (Legends, variantes) → info
```

- `matched` : jointure automatique (normalisation ci-dessous).
- `unmapped` / `orphans` : le **delta de review**. Une nouvelle datasheet MFM
  apparaît en `unmapped`, une retirée en `orphans` — l'humain ne regarde que ça.
- Overrides manuels dans `editor/mfm/aliases.json` (nom MFM → bsId ou nom cat),
  fusionnés avant l'auto-match : le résidu connu ne repasse jamais en review.

### Normalisation (la clef de jointure)

Identique des deux côtés (déjà écrite et validée dans le POC) :
majuscules, sans diacritiques, apostrophes/tirets unifiés, `w/`→`with`,
ponctuation → espace. `"VULKAN HE'STAN"` ↔ `"Vulkan He'stan"` collent.

## Le moteur de diff → application

```
dump MFM (JSON)  ─┐
                  ├─►  build-map   ──►  map/<faction>.json  (+ review du delta)
bdd .cat (parsée)─┘                          │
                                             ▼
                     apply  ──►  pour chaque unité matchée & `changed` :
                       • base pts        → editUnit({costs})
                       • paliers taille  → editUnit({tiers})           (applyTiers)
                       • prix répétition → repeat-cost (marqueur + modifier)
                       • enhancements    → editUnit sur l'entrée d'amélioration
                     … DIFF-CHECK : n'écrit que si la valeur change réellement.
```

Tout passe par `editor/lib/catalog.js` (jamais de sed) — les fonctions
existent déjà : `readCosts`/`applyCosts`, `readTiers`/`applyTiers`,
`readOptions`/`applyOptions`, helpers repeat-cost. Le mapping MFM→mécanisme :

| Profil MFM | Mécanisme bdd |
|---|---|
| `tier:"YOUR UNIT COSTS"`, `size:"1 model"` | `<cost pts>` de base |
| plusieurs `size:"N models"` même tier | paliers `applyTiers` |
| `tier:"1ST TO 3RD"` vs `"4TH +"` | `repeat-cost: threshold delta` (`MFM_PROMPT.md`) |
| enhancements | `<cost pts>` sur l'entrée d'amélioration |
| `size:"1 Runtherd, 20 Gretchin"` (composition) | **cas spécial** (voir plus bas) |

## Les cas durs (5 unités sur ~1450) — signalés, jamais devinés

Le POC détecte automatiquement les profils **à composition** (taille non
« N models ») : Gretchin, Outrider Squad, Wolf Guard Headtakers, Tidewall
Shieldline… Leur prix dépend d'une sous-composition (nb de Runtherds), déjà
géré au cas par cas dans la bdd. Le pipeline les **exclut de l'application
auto** et les **liste pour traitement manuel** — 5 unités, pas 1450.

## Garde-fous (le gauntlet, automatisé)

Chaque run, par faction, avant commit :
1. `dry-run` : imprime tous les deltas (cat N → MFM M) **sans écrire**.
2. Application via la lib.
3. `xmllint` + `cat.validate()` (0 erreur) + **0 id dupliqué vs HEAD**.
4. **Re-diff** : le second passage doit sortir « 0 écart » (idempotence).
5. Commit par faction : `"<Faction>: points MFM <version>"`.
6. Le fichier `map/<faction>.json` est commité avec : sa diffabilité montre
   d'un coup les nouvelles unités / celles retirées entre deux MFM.

## Plan de mise en œuvre (incrémental, testable)

- **P1 — matrice + rapport** (le POC est à 90 % là) : `build-map.mjs` sur les
  données parsées, `aliases.json` pour le résidu, sortie map + review.
  *Livrable : 100 % des noms résolus (98 % auto + 28 alias), 0 écriture.*
- **P2 — diff dry-run** : `apply.mjs --dry` : base pts + paliers + enhancements,
  diff-check, rapport « cat → MFM ». *Livrable : la liste exacte de ce qui
  changerait, revue par un humain.*
- **P3 — application + gauntlet** : écriture via la lib, validation, commit par
  faction. Répétition (`repeat-cost`) branchée sur les helpers existants.
- **P4 — cas composition + CI** : traitement assisté des 5 unités spéciales ;
  puis un job (cron/Action) qui `mfm_dump.py` → `build-map` → `apply --dry` et
  **ouvre une PR** avec les deltas + le rapport de review, à valider d'un clic.

## Pourquoi c'est robuste

- La matrice se **reconstruit** : elle ne dérive jamais silencieusement. Toute
  divergence (renommage GW, nouvelle datasheet) tombe en `unmapped`/`orphans`.
- La jointure s'appuie sur la **résolution d'import déjà éprouvée** de l'app
  (utilisée en production pour afficher les unités), pas sur une heuristique ad
  hoc.
- Le mapping profil→mécanisme réutilise les **encodages existants** (`applyTiers`,
  `repeat-cost`) : rien de nouveau côté données.
- **Diff-check + idempotence** : ré-appliquer un MFM déjà intégré ne produit
  aucun commit.

---

*Chiffres mesurés le 2026-07-26 sur `mfm_20260726` (en) vs la bdd courante :
1382 unités MFM, 98,0 % auto-matchées, 5 unités à composition, résidu 28 noms
(aliases). POC : `editor/mfm/poc/` (matcher + coverage + dry-run diff).*
