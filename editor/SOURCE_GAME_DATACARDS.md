# Source game-datacards — référence des fiches 11ᵉ et veille quotidienne

## La source

- Dépôt public **`https://github.com/game-datacards/datasources`**, dossier **`11th/gdc`** :
  un JSON par faction (fiches : caractéristiques, armes, aptitudes avec texte officiel,
  composition, équipement, options, points ; détachements, stratagèmes, améliorations,
  règles), multilingue (`{en, fr, de, …}`), balisage `<b>`, `<k>`, `**^^MOT-CLEF^^**`.
- **Journal amont** : `11th/changelogs/<version>_summary.md` (et `_changelog.txt` détaillé),
  `11th/versions.json` (historique version de données → commit). Chaque JSON porte
  `compatibleDataVersion` et `updated`.
- **Fiabilité** : export des données de l'appli officielle ; fiche Lion El'Jonson et
  27 captures Black Templars **identiques** aux captures de l'appli (oct. 2026). Bruits
  connus listés dans le manifeste (`knownNoise`) : CT 7+ des armes Torrent, mots-clefs
  d'arme parfois omis ou mal attribués → **ne jamais retirer un mot-clef sur la seule
  foi de la source**.

## Le fichier de sauvegarde : `editor/sources/game-datacards.json`

Manifeste versionné de la source :

- `tracked` : **version de données suivie** (dernier état trié/intégré) + commit amont ;
- `files` : correspondance fichier amont → **nos catalogues** (premier = catalogue cible
  des outils) ; `detachmentTool: true` = détachements synchronisables par
  `gdc-sync-detachments.cjs` (chapitres divergents) ;
- `knownNoise` : artefacts connus à ignorer ; `tools` : outils associés.

Récupérer la source suivie :

```sh
git clone --depth 1 https://github.com/game-datacards/datasources /tmp/gdc            # tête
git -C /tmp/gdc-old init -q && git -C /tmp/gdc-old fetch --depth 1 \
  https://github.com/game-datacards/datasources <tracked.commit> && git -C /tmp/gdc-old checkout -q FETCH_HEAD  # version suivie
```

## Outils (`editor/translations/`)

| Outil | Rôle |
|---|---|
| `gdc-watch.cjs` | **veille** : diff amont (version suivie → tête) confronté à notre base, verdict par changement, rapport MD/JSON. Ne modifie rien. |
| `gdc-compare.cjs` | rapport complet base ↔ source pour les chapitres (`editor/SM_FICHES_OFFICIELLES_11E.md`). |
| `gdc-apply-weapons.cjs` | aligne caractéristiques + profils d'armes d'un catalogue (copie locale avant toute entrée partagée, n'enlève aucun mot-clef, ignore CT 7+ Torrent). `--skip`, `--nokw "Fiche:Arme"`. |
| `gdc-apply-abilities.cjs` | textes d'aptitudes officiels (`--rename`, `--drop`). |
| `gdc-sync-detachments.cjs` | règles, stratagèmes, améliorations des détachements (chapitres). |

Tous s'exécutent **à blanc** par défaut ; `--write` applique. Toujours relire le dry-run :
il couvre toutes les divergences du catalogue, pas seulement le changement du jour.

## Veille quotidienne (routine)

```sh
node editor/translations/gdc-watch.cjs --old /tmp/gdc-old/11th/gdc --new /tmp/gdc/11th/gdc \
  --changelogs /tmp/gdc/11th/changelogs --out editor/sources/veille/<date>-v<A>-v<B>.md --json /tmp/veille.json
```

### Règle de décision (ce qu'on fait de chaque nouveauté)

| Verdict | Décision |
|---|---|
| ✅ déjà conforme | rien. |
| 🛠 à appliquer (caractéristiques, valeurs d'arme, ajout de mot-clef, texte d'aptitude, stratagème/amélioration d'un chapitre) | **appliquer** avec l'outil indiqué, en ne gardant du dry-run que les lignes des fiches signalées (sinon édition ciblée via `editor/lib/catalog.js`) ; FR officiel dans `translations/fr.json` ; validation CLAUDE.md règle 4. |
| 💰 points | **ne pas appliquer** sans MFM : la source suit l'appli, le MFM fait foi (`MFM_PROMPT.md`, paliers/répétition). Signaler. |
| ✋ manuel (composition, options, mots-clefs de fiche, fiche nouvelle, stratagèmes hors chapitres) | préparer la proposition dans le rapport, ne pas encoder automatiquement (règles maison : porteurs, Upgrade, UNIQUE…). |
| ❓ doute (retrait de mot-clef, d'aptitude, d'arme, de fiche) | ne rien retirer ; demander confirmation à l'utilisateur. |
| 🔇 bruit connu | ignorer. |

Les changements appliqués sont poussés sur une **branche `veille-gdc/v<B>`** (jamais
directement sur `main`), avec le rapport et le manifeste mis à jour (`tracked`) ; la fusion
reste une décision humaine. Une version déjà triée (branche existante) n'est pas retraitée.
