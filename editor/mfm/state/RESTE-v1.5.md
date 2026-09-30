# MFM v1.5 — ce qui reste à intégrer

Passe cowork du 2026-09-30 (`editor/mfm/COWORK_TASK.md`). Les 23 factions
hors tronc Space Marines sont intégrées et vérifiées ; ce fichier liste le
reste, à reprendre au prochain passage **disposant du parser de l'app**.

## 1. Bloquant — matrices du tronc Space Marines à régénérer

> **Débloqué (commit d96f6f2)** : build-map.mjs retombe désormais sur la copie
> vendorisée `editor/mfm/vendor/bsdata-parser.mjs` — plus besoin du dépôt de
> l'app. Vérification du 2026-09-30 : matrices régénérées → apply.mjs trouve
> 128 deltas points + 127 améliorations auto, **tous sur les 6 slugs SM**,
> et 284 lignes de résidu. Reste à dérouler apply → phase3 --write sur ces slugs.

`build-map.mjs` a besoin du parser `scripts/bsdata-parser.mjs` de
cogitator-bellicum (clôture d'import). Ce dépôt est **hors périmètre** de
l'environnement cowork (clone refusé, 403) : les matrices n'ont donc pas pu
être régénérées.

Pour les 23 autres factions c'est sans conséquence — leurs `.cat` n'avaient
pas bougé depuis la dernière construction, le cache `current` a été
dé-périmé par `refresh-current.mjs` et le diff est exact (apply.mjs : 0
delta restant).

Pour les **6 slugs du tronc SM** (`space-marines`, `black-templars`,
`blood-angels`, `dark-angels`, `deathwatch`, `space-wolves`) c'est
bloquant : l'intégration du codex 11e (commits `e9e140c`…`55941b8`) a
réécrit les fiches, supprimé 7 datasheets et posé des « points provisoires
du leak ». Les matrices commitées pointent encore sur l'état d'avant :

- **448 bsId disparus** (107 datasheets + 341 améliorations) ;
- ~187 deltas et ~161 lignes de résidu affichés par `apply.mjs` pour ces
  slugs sont donc **non fiables** — ni appliqués, ni à croire en l'état.

À faire : `COGITATOR_DIR=… node editor/mfm/build-map.mjs editor/mfm/dump/en`
puis `node editor/mfm/apply.mjs …` et `node editor/mfm/phase3.mjs … --write`
sur ces 6 slugs.

Les **détachements** SM, eux, ont été traités : `dp-audit.mjs` lit la bdd
directement (pas de matrice) — DP, Force Disposition et mots-clefs UNIQUE
sont alignés, 0 écart.

## 2. Résidu réel hors tronc SM (vérifié à la main, rien à écrire sauf ①)

- ① **[Orks] GARGANTUAN SQUIGGOTH** — aucune datasheet en base. Datasheet à
  créer (ou alias à poser si elle existe sous un autre nom).
- ② **[Necrons] Mortality Shroud (Aura) (Upgrade)** (THE PHAERON'S ARMOURY) —
  **prix déjà correct** (10 pts, `fdcf-7096-7ec8-948e`). Simple défaut
  d'appariement : la base la nomme « Mortality Shroud Upgrade », le MFM
  « Mortality Shroud (Aura) (Upgrade) ». `enhStrip` de build-map ne tolère le
  suffixe « Upgrade » qu'entre parenthèses — à étendre pour clore les 10
  lignes ② (les 9 autres sont du tronc SM, même motif).
- ④ **Coûts portés par les modèles** — vérifiés un à un dans le XML,
  **déjà conformes** : IRONSTRIDER BALLISTARII (80/modèle + increment 10 à
  3 modèles = 250 ✓, répétition +15 ✓), HIPPOGRIFF AFV (70 ×2 = 140 ✓),
  LOKHUST HEAVY DESTROYERS (50/modèle + increment 15 à 3 = 165 ✓,
  répétition +10 ✓).
- ⑤ **Prix à composition** — vérifiés, **déjà conformes** : GRETCHIN
  (45 de base, `set 80` dès >10 modèles) ; TIDEWALL SHIELDLINE
  (85 + plateforme 20).

## 3. Détachements MFM non appariés (dp-audit)

Neuf noms sans entrée en base, tous du tronc SM — nouveaux détachements ou
renommages à examiner avec le codex : DEATHWATCH SUPPORT (5 chapitres),
FIST OF THE GOD-EMPEROR, VOW-SWORN CRUSADERS (Black Templars),
CERAMITE SENTINELS, MEDUSA'S WRATH (Space Marines).
