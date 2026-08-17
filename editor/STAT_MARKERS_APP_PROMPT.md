# Marqueurs de stats — prompt autonome (application consommatrice)

Ce dépôt matérialise EN DONNÉES trois familles d'informations que les
applications extrayaient jusqu'ici de la prose GW (fragile : chaque nouveau
codex peut changer une tournure sans qu'aucun test n'échoue) :

1. **Sauvegarde invulnérable et Feel No Pain** de la fiche ;
2. **Supreme Commander** (doit être Warlord) et son miroir (ne peut pas l'être) ;
3. **cibles de chef par mots-clefs** — la seule part du graphe de chefs restée
   prose (les cibles datasheet sont déjà déclaratives via `Can Lead (MFM)`,
   cf. `LEADER_LINKS_APP_PROMPT.md`).

## Canal

Des lignes dans le `<comment>` **premier enfant** du `selectionEntry` de
l'unité — le même canal que `sim-mod:` (une ligne = un fait ; les autres
consommateurs BattleScribe ignorent les commentaires ; le round-trip est
garanti par `editor/lib`). Les genres de lignes peuvent cohabiter dans le même
commentaire.

## Grammaire

```
invuln: 4+ [model="Nom du modèle"] [conditional]
fnp: 5+
must-warlord
cannot-warlord
leader-kw: KW [& KW] [| KW & KW]
```

- `invuln:` — une ligne par sauvegarde. `model="X"` la restreint à un modèle
  (Ghazghkull 4+, Makari 2+ conditional) ; sans `model`, toute l'unité.
  `conditional` = situationnelle (affichage étoilé « 2+* », jamais un état de
  base).
- `fnp:` — UNIQUEMENT la stat de fiche, c'est-à-dire l'aptitude **nommée**
  « Feel No Pain N+ ». Les dons conditionnels (aura de Painboy, chef qui
  confère un FNP à l'escouade) ne sont PAS des stats : ils restent des
  `sim-mod:` (cf. `SIM_MOD_APP_PROMPT.md`).
- `must-warlord` / `cannot-warlord` — Supreme Commander et interdits de
  Warlord (assassins de l'Officio, C'tan…).
- `leader-kw:` — prédicats de rattachement par mots-clefs, en **noms de
  catégories** : `|` sépare des alternatives (OR), `&` exige la conjonction
  (AND). Ex. `leader-kw: Wulfen & Infantry | Destroyer Cult`.

## Contrat côté application

- **La donnée prime, la prose est le repli.** Lisez les marqueurs d'abord ;
  ne retombez sur vos heuristiques de prose que pour une fiche SANS marqueur
  (données tierces, codex pas encore annoté).
- `invuln` par modèle : rattachez la ligne `model="X"` à la statline du
  modèle homonyme ; la ligne sans `model` est la valeur d'unité.
- `leader-kw` : résolvez chaque nom en ids de catégories de votre index et
  testez la cible par conjonction (`&`) puis alternative (`|`).
- **Sentinelle recommandée** : si vos extracteurs de prose détectent un
  signal (aptitude nommée « Invulnerable Save »/« Feel No Pain N+ », clause
  Supreme Commander) sur une fiche SANS le marqueur correspondant, levez une
  anomalie — c'est une fiche nouvelle/retouchée qui a échappé au générateur.

## Maintenance côté dépôt

Générés initialement par `editor/gen-stat-markers.mjs` (dry-run puis
`--apply` ; il ne réécrit QUE ses genres de lignes et préserve `sim-mod:`).
Pour une fiche nouvelle : écrire le marqueur À LA MAIN au moment de
l'intégration (workflow `FACTION_PACK_PROMPT.md`), ou relancer le générateur
et auditer son diff. Toute divergence prose↔marqueur doit être tranchée en
faveur de la règle imprimée, puis figée dans le marqueur.
