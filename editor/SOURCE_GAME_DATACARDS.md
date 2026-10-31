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

- `tracked` : **version de données suivie** (dernier état trié/intégré) + commit amont +
  `updated` = **tampon d'export** (le plus récent des `updated` des JSON à fiches et de
  `core.json` : `node editor/translations/gdc-watch.cjs --stamp <gdc>/11th/gdc`). Un
  **ré-export à version égale** (16/10 : `modelKeywords` ajouté, données toujours 995) ne
  change que ce tampon : la veille le détecte et le trie comme une nouveauté ;
- `files` : correspondance fichier amont → **nos catalogues** (premier = catalogue cible
  des outils) ; `detachmentTool: true` = détachements synchronisables par
  `gdc-sync-detachments.cjs` (chapitres divergents) ;
- `knownNoise` : artefacts connus à ignorer ; `tools` : outils associés.
- `attachOverrides` : rattachements Leader/Support qu'un document officiel **plus récent** que la
  version suivie ajoute (faction pack, errata) — `gdc-attach.cjs` les ajoute aux cibles de la fiche
  et ne les retire donc pas ; à vider quand la source les porte (ex. Eldrad/Farseer → Warlock
  Conclave, faction pack Aeldari v1.4 du 14/10/2026).

Récupérer la source suivie :

```sh
git clone --depth 1 https://github.com/game-datacards/datasources /tmp/gdc            # tête
git -C /tmp/gdc-old init -q && git -C /tmp/gdc-old fetch --depth 1 \
  https://github.com/game-datacards/datasources <tracked.commit> && git -C /tmp/gdc-old checkout -q FETCH_HEAD  # version suivie
```

## Outils (`editor/translations/`)

| Outil | Rôle |
|---|---|
| `gdc-watch.cjs` | **veille** : diff amont (version suivie → tête) confronté à notre base, verdict par changement, rapport MD/JSON. Mots-clefs : un mot-clef **de figurine** (`modelKeywords`, qui remonte aussi dans les mots-clefs de l'unité) se compare aux catégories de la **figurine de même nom** (nom anglais ou traductions, au pluriel près ; figurine absente — modèles ajoutés par une aptitude, ex. Split — : toute la fiche) → ✅ si présent, ✋ sinon. `--stamp <gdc>` : tampon d'export et nouveauté (`aucune` / `version` / `ré-export`). Ne modifie rien. |
| `gdc-compare.cjs` | rapport complet base ↔ source, **toutes les factions** : `--gdc <gdc> --out-dir <dossier> [--only a.json,…]` → un Markdown + un JSON par fichier amont + index (caractéristiques, armes champ par champ, mots-clefs d'unité et de figurine, aptitudes et invulnérable ; chaque copie d'une fiche comparée, y compris hors faction — Deathwatch du catalogue Agents) ; écarts classés **vrai** (à corriger) / **voulu** (vrai écart conservé sur décision de l'utilisateur, consigné dans `editor/sources/gdc-ecarts-voulus.json` aux valeurs exactes : il redevient vrai si la base ou l'officiel change ; entrée périmée signalée « écart voulu introuvable ») / **nom** (faux positif d'appariement) / **modélisation** (choix de la base), avec `fichier:ligne`. Profils lus **comme l'appli les affiche** : modificateurs de **porteur** évalués contre la fiche comparée (set/increment/append d'une caractéristique conditionné par `instanceOf`/`notInstanceOf` de portée `ancestor`/`root-entry`/`unit`/`model` : catégories, id d'entrée, figurines traversées — Storm Bolter partagé SM 2+ d'un Captain, Mechanicus pistol 3+ d'un CHARACTER ; toute autre condition reste non appliquée) ; **règles projetées par un détachement** ignorées (profil/infoLink masqué sur une liste vide et révélé seulement par une sélection `roster`/`force` : invulnérables 5+ de Warrior Bioform Onslaught, Brazen Fury, Disciples of Be'lakor…). Ancien usage (`<rapport.md> [gdc]`) : les cinq chapitres divergents en un fichier (`editor/SM_FICHES_OFFICIELLES_11E.md`). Lecture seule. |
| `gdc-apply-weapons.cjs` | aligne caractéristiques + profils d'armes d'un catalogue (copie locale avant toute entrée partagée, CT 7+ Torrent lue N/A). Une caractéristique modifiée pour la fiche par un modificateur de **porteur** (même règle que `gdc-compare.cjs`) n'est jamais réécrite ni copiée : valeur effective = officielle → rien, sinon `⚠ … corriger le modificateur`. `--trust` : retire aussi les mots-clefs absents de la fiche (sauf notre `Hunter (…)`) ; `--only "Fiche"`, `--skip`, `--nokw "Fiche:Arme"`. **Garde des noms** (l'appli enregistre les choix par nom et résout leurs armes par le nom des profils) : jamais le nom d'une entrée (`⚠ … entrée non renommée`), pas celui d'un profil par défaut (`⚠ … profil non renommé` ; `--rename-profils` l'autorise) ; un appariement par élimination vers un nom officiel réduit à un suffixe de mode (strike / sweep / melee / ranged / standard) est seulement signalé, rien n'est écrit. |
| `gdc-apply-abilities.cjs` | textes d'aptitudes officiels (`--rename`, `--drop`). |
| `gdc-sync-detachments.cjs` | règles, stratagèmes, améliorations des détachements (chapitres). |
| `gdc-attach.cjs` | **rattachements Leader / Support** (`attachesTo`) toutes factions : groupe `Can Lead/Support (MFM)` sur le meneur si la cible est dans sa clôture d'import, sinon lien inverse `Led By / Supported By (MFM)` sur l'unité menée ; règle + aptitude Leader/Support ajoutées si absentes ; liens absents de la fiche retirés, y compris tout un sens que la fiche ne porte pas ; cibles **Legends** (`editor/mfm/legends.json`) jamais liées. `--prose` : réécrit la liste de la prose Leader/Support (et sa traduction FR) quand elle diffère — à lancer avec chaque `--write`, l'appli affiche cette prose. Noms appariés tirets typographiques normalisés, fiches hidden exposées comprises, alias `editor/mfm/aliases.json`. Invariant vérifié par `editor/audit/rattachements.mjs` (enchaîné par `valider.mjs`) ; contrôle croisé avec le MFM : `editor/mfm/bodyguard-audit.mjs`. |

Tous s'exécutent **à blanc** par défaut ; `--write` applique. Toujours relire le dry-run :
il couvre toutes les divergences du catalogue, pas seulement le changement du jour.

## Veille quotidienne (routine)

```sh
node editor/translations/gdc-watch.cjs --stamp /tmp/gdc/11th/gdc     # {"nouveaute": "aucune" | "version" | "ré-export"}
node editor/translations/gdc-watch.cjs --old /tmp/gdc-old/11th/gdc --new /tmp/gdc/11th/gdc \
  --changelogs /tmp/gdc/11th/changelogs --out editor/sources/veille/<date>-v<A>-v<B>.md --json /tmp/veille.json
```

Nouvelle version → branche `veille-gdc/v<B>` ; ré-export à version égale → `veille-gdc/v<B>-r2`,
`-r3`… (premier suffixe libre).

### Règle de décision (ce qu'on fait de chaque nouveauté)

| Verdict | Décision |
|---|---|
| ✅ déjà conforme | rien. |
| 🛠 à appliquer (caractéristiques, valeurs d'arme, mots-clefs **ajoutés ou retirés**, aptitude/arme/option ajoutée **ou retirée**, texte d'aptitude, stratagème/amélioration) | **appliquer** : `gdc-apply-weapons.cjs --trust` (dry-run d'abord, `--only "Fiche"` pour cibler), `gdc-apply-abilities.cjs`, `gdc-sync-detachments.cjs`, sinon édition ciblée via `editor/lib/catalog.js` ; FR officiel dans `translations/fr.json` ; validation CLAUDE.md règle 4. |
| 💰 points | appliquer le prix de l'appli officielle selon `MFM_PROMPT.md` (paliers, répétition) ; signaler si le dernier MFM diffère. |
| ✋ manuel (composition, options, mots-clefs absents de notre fiche ou de la figurine, fiche nouvelle, stratagèmes hors chapitres) | encoder selon les guides (règles maison : porteurs, Upgrade, UNIQUE…). Un mot-clef de figurine déjà porté par la figurine de même nom (ou par l'unité) est ✅, pas ✋. |
| ❓ doute | **seul cas** : fiche entière retirée de l'appli officielle → si le MFM la range en **Legends**, la retirer de la base (rien de Legends dans la base ni l'appli, décision du 2026-10-29 ; `gdc-watch` la classe 🛠) ; sinon demander avant de supprimer. |
| 🔇 bruit connu | CT « 7+ » d'une arme Torrent = « - » (N/A) : ignorer. Nouvelle fiche amont **Legends** au MFM (`editor/mfm/legends.json`) : hors base, ignorer (décision du 2026-10-29). Fiche **abandonnée** (`editor/mfm/abandons.json` : Astraeus, Thunderhawk Gunship du tronc SM, Gargantuan Squiggoth, Ares, Orion) : ignorer. |

Les changements appliqués sont poussés sur une **branche `veille-gdc/v<B>[-r<k>]`** (jamais
directement sur `main`), avec le rapport et le manifeste mis à jour (`tracked`) ; la fusion
reste une décision humaine. Une version déjà triée (branche existante) n'est pas retraitée.
