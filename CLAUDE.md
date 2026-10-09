# wh40k-11e — données BattleScribe (11e édition)

Dépôt de données Warhammer 40,000 11e : fichiers `.cat`/`.gst` (XML BattleScribe) +
éditeur web zéro-dépendance (`/editor`). Travaillé **en paire** avec l'appli
`../cogitator-bellicum` (React/Vite, consomme ces données — voir son `CLAUDE.md`).
Réponses à l'utilisateur **en français** ; signaler les doutes.

## Démarrer une tâche (contexte minimal)

1. Lire **`ETAT.md`** (court) : branches, lignes de base, **questions ouvertes**, décisions récentes.
2. Ne lire **que** le guide de la tâche (table ci-dessous) ; description complète de
   tous les guides : **`editor/INDEX.md`** (ne pas le lire d'office).
3. Localiser avant de lire : `editor/bin/trouve.mjs`, puis `editor/bin/montre.mjs`
   (plan compact) ; un `Read` ciblé (offset/limit) seulement pour éditer.

| Tâche | Guide(s) |
|---|---|
| Faction pack, détachement, stratagèmes, améliorations | `editor/FACTION_PACK_PROMPT.md` + `editor/ENHANCEMENT_BEARERS_PROMPT.md` |
| Points MFM (unités, améliorations, armes, répétition) | `editor/MFM_PROMPT.md` (Agents : `AGENTS_DUAL_COST_PROMPT.md` ; chapitres : `MARINE_CHAPTER_COST_APP_PROMPT.md`) |
| Fiches officielles game-datacards, veille quotidienne | `editor/SOURCE_GAME_DATACARDS.md` |
| Rattachements Leader / Support | `editor/LEADER_LINKS_APP_PROMPT.md` (outil `editor/translations/gdc-attach.cjs`) |
| Marqueurs `<comment>` : `sim-mod`/`def-mod`, `invuln`/`fnp`/warlord, `strat-timing`, `det-allies`, `chapter-cost` | `SIM_MOD_APP_PROMPT.md`, `STAT_MARKERS_APP_PROMPT.md`, `DETACHMENT_ALLIES_APP_PROMPT.md`, `MARINE_CHAPTER_COST_APP_PROMPT.md` |
| Alliés accordés par détachement (Deathwatch Support 500 pts ; démons des légions 500/1000/1500 selon le format, pas de Warlord) | `editor/DETACHMENT_ALLIES_APP_PROMPT.md` |
| Lecture du format côté appli (vocabulaire, idiomes) | `editor/BSDATA_PARSING_REFERENCE.md` (+ `editor/INDEX.md` pour les `*_APP_PROMPT.md`) |
| Éditer un `.cat` | `editor/README.md` (lib `editor/lib/catalog.js` + `xml.js`) |

## Outils (sortie courte — à préférer aux grep/sed/scripts jetables)

| Commande | Rôle |
|---|---|
| `node editor/bin/trouve.mjs "<regex nom>" [--tag selectionEntry] [--file X]` | `Fichier:ligne <tag> "nom" id=…` |
| `node editor/bin/trouve.mjs --id <id> --refs` | définition + toutes les références (avec l'entrée englobante) |
| `node editor/bin/montre.mjs <id\|nom> [--depth N] [--full] [--xml]` | plan compact : coûts, catégories, contraintes, modifiers (ids → noms), règles tronquées |
| `editor/bin/verifie.sh` | **validation complète règle 4** : xmllint des fichiers modifiés + `valider.mjs` + audit des améliorations (appli) |
| `editor/bin/pousse.sh [branche-de-session]` | fetch/rebase/push `main` (+ copie sur la branche de session) ; jamais de force-push |
| Appli : `scripts/dev/{prepare,sync-data,tests,pousse}.sh`, `faction.mjs`, `ui-check.mjs` | voir `../cogitator-bellicum/CLAUDE.md` |

## Économie de contexte (règles de travail)

- **Jamais** de `.cat` lu en entier (10–20 k lignes) ni de `sed -n` large : `trouve` → `montre` → `Read` ciblé.
- Éditions par script Node via la lib (`Catalog`, `xml.elem`, `c.byId`, `c.newId()`, `c.validate`, `c.save()`), script dans le scratchpad, sortie = 1 ligne par changement.
- Tests appli : `scripts/dev/tests.sh --only <suites>` pendant le travail, batterie complète **une** fois avant commit.
- Vérif UI : `scripts/dev/ui-check.mjs` (texte) ; capture d'écran seulement si l'utilisateur la demande ou si le texte ne suffit pas.
- Recherches larges (plusieurs fichiers/factions) : déléguer à un sous-agent `Explore`, ne garder que la conclusion.
- Fin de tâche : mettre à jour `ETAT.md` (questions ouvertes, lignes de base) ; rapport final court.

## Règles maison non négociables

1. **Améliorations** : nom contenant « Upgrade » → rattachée à des
   **unités** par mots-clefs, **cumulable** (pas d'unicité d'armée),
   plafond global de 4, max 1 par unité, **jamais sur un Epic Hero**.
   Toutes les autres → **personnages non-Epic uniquement**, uniques
   (`max 1 roster`). **Exception** (décision du 2026-09-30) : un Epic Hero
   que les données **désignent explicitement** comme porteur (portes de
   l'entrée nommant sa catégorie — Prince Yriel et Kharseth pour le
   Corsair Coterie, « Pirate Prince » réservée à Yriel ; upgrades des
   Assassins et des C'tan Shards) le reste ; sans désignation, jamais.
   Cas limites → demander à l'utilisateur.
2. Les porteurs se résolvent par **conjonction de mots-clefs** de la
   prose (« KROOT SHAPER » = mots-clefs KROOT **et** SHAPER) — jamais en
   traversant le menu central « Enhancements ».
3. Chaque détachement classé porte un coût **DP** et un profil **Force
   Disposition** ; stratagems = `<rule name="X (Stratagem, NCP)">` au
   format uniforme.
4. Validation avant tout commit : `xmllint`, `catalog.validate` (ok,
   0 erreur), **0 id dupliqué introduit** vs HEAD, **0 `defaultSelectionEntryId`
   cassé** (`editor/audit/defauts-groupes.mjs`, enchaîné par `valider.mjs` :
   le défaut d'un groupe vise un enfant direct ou vaut `none`), audit de la
   règle des améliorations. Diff-check : ne réécrire un texte que s'il diffère.
5. **Prix par seuil de répétition (MFM)** : « les N premiers au prix de
   base, au-delà du Nième à l'autre prix » → **FORME NATIVE, aucun
   commentaire** : modifier `increment` sur pts (value=Δ) conditionné
   `<condition type="atLeast" value=N+1 scope="roster">` sur la fiche.
   La **convention du dépôt définit la sémantique sur cette forme** :
   +Δ **par exemplaire au-delà du Nème** uniquement (jamais les N
   premiers, jamais toutes les copies) — l'appli la reconnaît
   structurellement (`editor/REPEAT_COST_APP_PROMPT.md`). L'ancien
   marqueur `<comment>repeat-cost:…</comment>` (redondant 372/372 avec le
   XML) est **supprimé** ; n'en réintroduire aucun. **Ne plus dupliquer
   l'entrée** : `splitRepeatTier` abandonné, `removeRepeatTier` ne sert
   qu'à déposer d'anciennes jumelles `(additional)`. Détails :
   `editor/MFM_PROMPT.md`.

6. **La base suit le MFM — et toute entrée MFM absente se signale** (décision du
   2026-10-08) : un détachement, une fiche ou une amélioration présents dans le
   MFM mais absents de la base ne sont **jamais** passés sous silence ni
   inventés : **demander le texte à l'utilisateur** (règle de détachement,
   stratagèmes, améliorations / fiche) avant d'intégrer. `apply.mjs` les liste
   en tête de « À ME RENVOYER » (⓪ détachement absent, ① fiche, ② amélioration).

## Git et sécurité

Commits par faction, messages descriptifs en français ; ne jamais committer un état
non validé (`editor/bin/verifie.sh`). Publication : `editor/bin/pousse.sh` (données) et
`scripts/dev/pousse.sh` (appli). **Jamais de force-push.** Ne jamais lire, diffuser ni
demander le contenu de `aln-profile/` (session de connexion ALN).
