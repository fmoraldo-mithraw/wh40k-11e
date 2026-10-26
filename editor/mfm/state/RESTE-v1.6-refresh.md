# MFM v1.6 (dump rafraîchi du 2026-10-26) — ce qui reste

Passe cowork du 2026-10-26 (`editor/mfm/COWORK_TASK.md`) sur le dump poussé
par le cron serveur en `f86e073`. **Même MFM v1.6** que le dump déjà intégré
le 2026-10-14 (`RESTE-v1.6.md`) : aucun prix ne change côté Games Workshop.
Seul le **parse** change — et il change en régressant (voir ci-dessous).

**État** : `build-map` → matrices régénérées **identiques** à celles poussées
par le cron (arbre de travail propre) ; `apply.mjs` → **0 delta points,
0 delta améliorations** ; `dp-audit` → DP, Force Dispositions et UNIQUE
alignés ; `wpn-audit` → 0 écart (130 conformes) ; `tier-audit` → 0 ✗ ;
`valider.mjs` → 0 erreur, 444 ids dupliqués (= ligne de base, 0 dépassement),
0 `defaultSelectionEntryId` cassé.

**Aucune écriture en base.** Rien à intégrer : ce tir pose le marqueur et
consigne la régression d'extraction ci-dessous.

## ⚠ Régression d'extraction — les lignes `LEADER:` / `SUPPORT:` sont perdues

GW a changé le balisage de la page MFM : le libellé qui octroie un mot-clef
sous une amélioration n'est plus un `<div>` **frère** du `<li>`, il est
devenu un **`<li>` du même niveau** que les améliorations. Conséquences
mécaniques dans `mfm_parser.py` :

- `_parse_enhancement_list` ne voit plus de `<div>` à rattacher : la branche
  `elif t == "div" and res and "leader" not in res[-1]` ne se déclenche plus,
  donc le champ `leader` **disparaît de toutes les améliorations** ;
- le `<li>` est traité comme une amélioration ordinaire : `_name_and_cost`
  retient le **premier `<span>`** comme nom → `"LEADER:"` / `"SUPPORT:"`, et
  renvoie les **noms d'unités cibles dans `cost_nodes`**, que
  `parse_cost_node` jette (aucun « pts »). Les cibles sont donc **perdues**.

Effets observés, tous expliqués par cette seule cause :

| Avant (dump `5e80870`) | Après (dump `a587630`) |
|---|---|
| 12 améliorations avec `leader: [...]` | **0** |
| — | **13 améliorations fantômes** `LEADER:` / `SUPPORT:` (résidu ② d'`apply.mjs`) |
| `enh-leaders.mjs` : 12 octrois, 0 lien à ajouter | 0 octroi, 0 lien à ajouter |

**Pas de perte de données en base** : les 12 octrois étaient déjà écrits et
vérifiés complets (`0 lien(s) à ajouter`), et les groupes `Can Lead (MFM)`
sont toujours là. `enh-leaders.mjs` ne supprime jamais un lien (il signale
les liens en trop) — aucun risque de régression s'il est relancé. Ce qui est
perdu, c'est le **contrôle croisé** : la vérification MFM → base des octrois
LEADER est aveugle jusqu'à la correction du parser.

Les 12 octrois concernés (à re-vérifier après correction) : Catechism of
Divine Penitence (AS, Penitent Host → Repentia Squad) · Exemplar of Duty
(Upgrade) et Abhuman Detail (AM → Ogryn Squad, Bullgryn Squad) · Pact of
Cursed Pinions et Sorrowscent Vulture (CSM → Warp Talons) · Exalted Patron
(EC → Flawless Blades) · Kill Kommanda (Orks → Kommandos) · Kaptin's Hat
(Orks → Flash Gitz) · Wolf-Touched (SW → Wulfen, Wulfen with Storm Shields) ·
Bray Lord (TS → Tzaangors) · Butcher Lord (WE → Jakhals, Goremongers) ·
Disciple of Khorne (WE → Bloodcrushers, Flesh Hounds).

### Correctif proposé — NON appliqué, NON validé

Le réseau vers `mfm.warhammer-community.com` est **refusé (403)** depuis le
conteneur cowork : impossible de relire le balisage réel ni de tester une
correction. Rien n'a donc été poussé côté parser — un parser cassé sur le
serveur d'extraction coûterait plus cher que la régression actuelle.

Correctif à appliquer et valider **avec le réseau** (côté serveur du cron) :
dans `_parse_enhancement_list`, intercepter un `<li>` dont le texte complet
commence par le libellé d'octroi **avant** de le traiter comme une
amélioration, et le rattacher à `res[-1]` :

```python
if t == "li":
    targets = _leader_targets_from_text(collect_text(el))   # texte complet du <li>
    if targets and res:
        res[-1].setdefault("leader", targets)
        continue
    name, cost = _name_and_cost(el)
    ...
```

Deux points à traiter en même temps :

1. `_leader_targets_from_text` doit tolérer le libellé **`SUPPORT:`** (et son
   équivalent FR `SOUTIEN`), aujourd'hui absent de son motif et de
   `_LEADER_WORDS` — d'où le fantôme Necrons ci-dessous. Un octroi SUPPORT
   mérite un champ **distinct** (`support`), pas le champ `leader`.
2. `enh-leaders.mjs` ne connaît que `leader` : il faudra lui apprendre
   `support` (groupe `Can Support (MFM)`, convention déjà en base) pour que
   le contrôle croisé couvre les deux sens.

Garder la branche `<div>` existante : elle reste correcte si GW revient en
arrière, et les deux branches ne peuvent pas doubler l'écriture
(`setdefault` / test `"leader" not in res[-1]`).

## Reste à faire à la main (hors périmètre de ce tir)

- **Correctif parser ci-dessus** : à appliquer et valider là où le réseau MFM
  est accessible, puis relancer `enh-leaders.mjs` (dry-run) pour confirmer
  que les 12 octrois LEADER reviennent à « 0 lien à ajouter ».
- **Octroi SUPPORT jamais lu — `Murdermind` (Necrons, Cursed Legion, 15 pts)** :
  le MFM porte une ligne `SUPPORT:` sous cette amélioration ; le parser ne
  l'a **jamais** su lire (le fantôme est une *nouvelle information*, pas une
  régression — l'ancien dump ignorait la ligne en silence). En base,
  `Murdermind` (`ccef-1913-7d41-e982`) n'a **aucun** groupe `Can Support (MFM)`
  (les 6 de `Necrons.cat` portent sur des armes de Cryptek). **Les unités
  cibles sont illisibles depuis le dump** : à fournir par l'utilisateur, ou à
  relire après le correctif parser. Rien n'a été écrit — CLAUDE.md règle 6.

## Résidu `apply.mjs` inchangé — déjà tranché, ne rien en faire

Identique au dump précédent, pour lequel le marqueur avait été posé :

- **① datasheets absentes (15)** : ASTRAEUS et THUNDERHAWK GUNSHIP (tronc SM,
  6 slugs), ARES GUNSHIP et ORION ASSAULT DROPSHIP (Custodes), GARGANTUAN
  SQUIGGOTH (Orks) — abandonnés par l'utilisateur le 2026-10-22.
- **② améliorations sans entrée (13)** : **les 13 fantômes `LEADER:` /
  `SUPPORT:`** ci-dessus. Ce ne sont **pas** des améliorations manquantes :
  rien à fournir, le résidu tombera avec le correctif parser.
- **④ coût porté par les modèles (15)** et **⑤ prix à composition (3)** :
  barèmes vérifiés conformes, hors périmètre d'`apply`.
- **6 « ? » de `tier-audit`** (Windriders, Decimus Kill Team, Atalan Jackals,
  Aquila Kill Team ×2, Inquisitorial Agents) : encodages non standard
  **conformes**, détaillés dans `RESTE-v1.5-refresh.md`. Aucune des factions
  concernées n'est touchée par ce dump.
- **2 lignes AUTO Custodes** (`CALADIUS GRAV-TANK`, `VENATARI WITH VERUTUM
  LANCES` — « WARGEAR COSTS REMOVED ») sont des no-op : « aucune option
  payante retirée en bdd ».

## Pourquoi le marqueur est posé

Toutes les factions sont intégrées : 0 delta de points, 0 delta
d'amélioration, 4 audits verts. Rien n'est bloqué qu'un tir ultérieur
pourrait finir — la régression d'extraction se corrige côté serveur du cron,
avec le réseau, pas en rejouant cette tâche. Laisser le marqueur en arrière
ferait tourner la routine à vide toutes les heures et brouillerait la
détection d'un *vrai* nouveau MFM.
