# Source game-datacards — référence des fiches 11ᵉ et veille quotidienne

## La source

- Dépôt public **`https://github.com/game-datacards/datasources`**, dossier **`11th/gdc`** :
  un JSON par faction (fiches : caractéristiques, armes, aptitudes avec texte officiel,
  composition, équipement, options, points ; détachements, stratagèmes, améliorations,
  règles), multilingue (`{en, fr, de, …}`), balisage `<b>`, `<k>`, `**^^MOT-CLEF^^**`.
- **Journal amont** : `11th/changelogs/<version>_summary.md` (et `_changelog.txt` détaillé),
  `11th/versions.json` (historique version de données → commit). Chaque JSON porte
  `compatibleDataVersion` et `updated`.
- **Fiabilité — la fiche officielle fait foi à 100 %** (décision du 2026-10-07) : export
  des données de l'appli officielle ; fiche Lion El'Jonson, 27 captures Black Templars,
  Wulfen Dreadnought, Mephiston, Death Company Dreadnought/Captain, Wolf Priest **identiques**
  aux captures de l'appli. On applique **tout**, retraits compris (mots-clefs, aptitudes,
  armes, options que la fiche ne porte pas). Seule lecture particulière : la CT **« 7+ »**
  d'une arme **Torrent** est la façon dont l'appli affiche « - » → on garde `N/A`.
  Nos encodages propres (mot-clef `Hunter (…)` doublant le profil `➤ … - Hunter`, préfixe
  « (Once per …) » dans le texte) ne sont pas des écarts.

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
| `gdc-apply-weapons.cjs` | aligne caractéristiques + profils d'armes d'un catalogue (copie locale avant toute entrée partagée, CT 7+ Torrent lue N/A). `--trust` : retire aussi les mots-clefs absents de la fiche (sauf notre `Hunter (…)`) ; `--only "Fiche"`, `--skip`, `--nokw "Fiche:Arme"`. |
| `gdc-apply-abilities.cjs` | textes d'aptitudes officiels (`--rename`, `--drop`). |
| `gdc-sync-detachments.cjs` | règles, stratagèmes, améliorations des détachements (chapitres). |
| `gdc-attach.cjs` | **rattachements Leader / Support** (`attachesTo`) toutes factions : groupe `Can Lead/Support (MFM)` sur le meneur si la cible est dans sa clôture d'import, sinon lien inverse `Led By / Supported By (MFM)` sur l'unité menée ; règle + aptitude Leader/Support ajoutées si absentes ; liens absents de la fiche retirés. Invariant vérifié par `editor/audit/rattachements.mjs` (enchaîné par `valider.mjs`). |

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
| 🛠 à appliquer (caractéristiques, valeurs d'arme, mots-clefs **ajoutés ou retirés**, aptitude/arme/option ajoutée **ou retirée**, texte d'aptitude, stratagème/amélioration) | **appliquer** : `gdc-apply-weapons.cjs --trust` (dry-run d'abord, `--only "Fiche"` pour cibler), `gdc-apply-abilities.cjs`, `gdc-sync-detachments.cjs`, sinon édition ciblée via `editor/lib/catalog.js` ; FR officiel dans `translations/fr.json` ; validation CLAUDE.md règle 4. |
| 💰 points | appliquer le prix de l'appli officielle selon `MFM_PROMPT.md` (paliers, répétition) ; signaler si le dernier MFM diffère. |
| ✋ manuel (composition, options, mots-clefs de fiche, fiche nouvelle, stratagèmes hors chapitres) | encoder selon les guides (règles maison : porteurs, Upgrade, UNIQUE…). |
| ❓ doute | **seul cas** : fiche entière retirée de l'appli (Legends ?) → demander avant de supprimer. |
| 🔇 bruit connu | CT « 7+ » d'une arme Torrent = « - » (N/A) : ignorer. |

Les changements appliqués sont poussés sur une **branche `veille-gdc/v<B>`** (jamais
directement sur `main`), avec le rapport et le manifeste mis à jour (`tracked`) ; la fusion
reste une décision humaine. Une version déjà triée (branche existante) n'est pas retraitée.
