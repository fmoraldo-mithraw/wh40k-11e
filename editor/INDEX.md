# Index des guides (`editor/*.md`) — carte détaillée

> Déplacé de `CLAUDE.md` (2026-10-08) pour alléger le contexte chargé à chaque session :
> `CLAUDE.md` ne garde qu'une table « tâche → guide ». Ici, la description complète
> de chaque guide. **Ne lire un guide que si la tâche le demande.** Tailles indicatives
> (`wc -c`) : les audits (`AUDIT_*`, ~45 Ko) et `SM_FICHES_OFFICIELLES_11E.md` (~40 Ko)
> sont des rapports — y chercher (`grep -n`) plutôt que les lire en entier.

## Guides d'encodage et prompts « appli consommatrice »

- **`editor/FACTION_PACK_PROMPT.md`** — LE guide d'intégration d'un
  faction pack (workflow complet, règle des améliorations, encodage,
  pièges, constantes d'ids, validation obligatoire). À suivre pour toute
  intégration de pack et, plus largement, pour toute édition de
  détachements/améliorations.
- **`editor/MFM_PROMPT.md`** — le guide d'intégration d'un MFM (points
  unités/améliorations, surcoûts par arme, prix par seuil de répétition).
  Compagnon : `editor/MFM_APP_PROMPT.md`, prompt autonome à coller dans
  le dépôt d'une application consommatrice (type NewRecruit) pour
  l'adapter à ces mécanismes.
- **`editor/MFM_CI_PROPOSAL.md`** — proposition d'intégration **continue**
  des points MFM : matrice nom↔id auto-maintenue (construite sur les données
  parsées imports-résolus → 98 % de couverture auto vs 52 % en match par
  fichier, mesuré), moteur de diff (base/paliers/répétition/améliorations via
  la lib), gauntlet + PR auto. POC de mesure dans `editor/mfm/poc/`.
- **`editor/AGENTS_DUAL_COST_PROMPT.md`** — les Agents de l'Imperium ont
  **deux jeux de prix** dans chaque MFM (armée / alliés) : chaque unité y
  apparaît **deux fois** (1ʳᵉ occurrence = prix armée = base de l'entrée,
  2ᵉ = prix allié = base + `increment` conditionné `notInstanceOf`/
  `primary-catalogue`). À lire avant toute mise à jour de points de
  `Imperium - Agents of the Imperium.cat`.
- **`editor/REPEAT_COST_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : le surcoût « 3e+ exemplaire plus cher » est en **forme
  NATIVE** (plus de marqueur) : `increment` sur pts (value=Δ) + condition
  `atLeast` valeur K `scope="roster"` ⟹ threshold=K−1 ; l'appli reconnaît la
  forme et n'applique Δ qu'aux exemplaires **au-delà du seuil** (jamais aux
  premiers, jamais à tous). Remplace le marqueur commentaire ET l'ancienne
  entrée dupliquée `(additional)`.
- **`editor/UNIQUE_DETACHMENT_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : les détachements à mot-clef `UNIQUE: X` sont **mutuellement
  exclusifs** par X. **Forme NATIVE** (plus de marqueur commentaire) :
  `categoryLink name="UNIQUE X"` vers une catégorie partagée à contrainte
  `max=1 scope="roster"` — BattleScribe/NewRecruit l'appliquent donc aussi.
- **`editor/ICON_BEARER_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) pour interpréter le rattachement « 1 modèle porte
  l'amélioration » : icônes/bannières via `<association>` (`childId="model"`
  = n'importe quel modèle, ou un modèle/groupe/catégorie précis) ; le
  porteur n'est **jamais le chef par défaut**, il sort de `scope`+`childId`.
- **`editor/ALLIED_UNITS_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : une armée dont le roster est importé d'une bibliothèque
  via `catalogueLink importRootEntries="true"` (Chaos Daemons, Imperial
  Knights) ne doit pas voir toutes ses unités tomber en « Allied Units » —
  les entrées importées sont **natives** du catalogue importateur ; le
  statut allié se décide par **mot-clef de faction**, jamais par fichier.
- **`editor/UNIT_COMPOSITION_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : pour afficher la bonne composition des unités à choix de
  taille (Jakhals, etc.), l'appli doit **résoudre les `entryLink`-vers-modèle**
  (même au niveau unité) comme des modèles, **exécuter les `modifier`**
  (`set`/`decrement`, cross-node, `repeats`) et **respecter min=0** — la donnée
  est complète, c'est l'évaluation qui manque.
- **`editor/SHARED_LIBRARY_RULES_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : les règles d'armée et de détachement des factions
  « importateur mince » (Aeldari/Drukhari/Ynnari → `Aeldari - Aeldari
  Library.cat`, etc.) ne sont **pas dans le `.cat` de la faction** (0 règle) ;
  l'appli doit **suivre les `<catalogueLink>` par `targetId`** (transitif),
  résoudre les `<infoLink type="rule">` **inter-fichiers**, et filtrer les
  détachements par condition **`primary-catalogue`**, jamais par fichier.
- **`editor/MARINE_CHAPTER_COST_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : quelques unités du **tronc commun Space Marines** (définies
  dans `Imperium - Space Marines.cat`, importées par les chapitres) ont un
  **prix différent selon le chapitre** ; encodé par un modifier de coût `set`
  conditionné **`primary-catalogue`** (marqueur `<comment>chapter-cost: XX</comment>`).
  Aucune logique spéciale côté appli : **éval BattleScribe standard** (contraste
  avec `repeat-cost`). Si le chapitre **redéfinit** l'unité localement (Black
  Templars), le prix est déjà sur l'entrée locale.
- **`editor/LEADER_LINKS_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : « quelles unités un chef peut mener », **toutes factions**,
  encodé sur chaque datasheet de chef par un `selectionEntryGroup` **déclaratif**
  `hidden`+`max=0` nommé `Can Lead (MFM)` (entryLinks vers les unités menées).
  **Source = la prose de la capacité *Leader*** (« can be attached to the following
  units: … »), redondée en données ; un seul sens (côté chef), cibles résolues
  dans la clôture d'import ; cible hors clôture (tronc SM → unité de chapitre) = lien **inverse**
  `Led By / Supported By (MFM)` sur l'unité menée. Synchro : `gdc-attach.cjs` ; invariant
  `editor/audit/rattachements.mjs` (dans `valider.mjs`). Restent dans la prose seule : rattachements
  **par mot-clef** et **accordés par amélioration**.
- **`editor/MODEL_ABILITIES_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : la plupart des capacités de datasheet sont des profils
  `Abilities` sur l'**unité**, mais quelques-unes sont portées par un
  `selectionEntry type="model"` imbriqué (ex. capacité propre à un Sergent). L'appli
  doit collecter les capacités dans **tout le sous-arbre** (unité **+** modèles),
  exclure les lignes de stats (`typeName="Unit"`) et les armes, et **dédupliquer**
  (une fois, pas une par figurine). Correctif de lecture/affichage, aucune donnée.
- **`editor/SIM_MOD_APP_PROMPT.md`** — prompt autonome (simulateur de dégâts ; aussi les effets DÉFENSIFS `def-mod:` de l'onglet Résistance, générés par `editor/gen-def-mods.mjs`) :
  les bonus **offensifs** accordés par une capacité de datasheet ou une
  amélioration (ex. compétence de Castellan Crowe) sont matérialisés par un
  marqueur `<comment>sim-mod: source="…" attacks=+1 weapon="…" whileLeading
  …</comment>` posé en **1ᵉʳ enfant** de la `selectionEntry` de l'unité ; l'appli
  parse les lignes `sim-mod:`, les attache à l'unité (`simMods`), les propose en
  **bascule** (pré-cochées si non conditionnelles) et **replie** les effets actifs
  dans l'objet `mods` de `simulate()`. Ne couvre **que** les bonus de
  capacité/amélioration — mots-clefs d'arme et règles d'armée restent côté appli.
- **`editor/STAT_MARKERS_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : les **marqueurs de stats** en `<comment>` (même canal que
  `sim-mod:`) figent en données ce qui se déduisait de la prose — `invuln: 4+
  [model="X"] [conditional]`, `fnp: 5+` (seule l'aptitude *nommée* « Feel No
  Pain N+ »), `must-warlord`/`cannot-warlord`, `leader-kw: A & B | C`. La
  donnée prime, la prose est le repli ; générateur
  `editor/gen-stat-markers.mjs`, sentinelle d'audit côté appli.
- **`editor/ENHANCEMENT_BEARERS_PROMPT.md`** — invariant **permanent** de
  liaison améliorations↔mots-clefs, à exécuter à CHAQUE modification de
  base touchant personnages ou améliorations : liens de menu
  (Warlord+Enhancements) sur chaque personnage éligible, portes de
  visibilité = clause de prose (table d'encodage OR/AND, exclusions),
  vérification des porteurs synthétisés + sentinelle CI
  `amelioration-porteur-manquant` côté appli.
- **`editor/BSDATA_PARSING_REFERENCE.md`** — **doc de référence complète** pour
  l'agent de l'appli consommatrice : tout le vocabulaire réel du format (11 types de
  modifier, 7 de condition, scopes dont `primary-catalogue`/`ancestor`/`forces`,
  `conditionGroup` and/or/**count**, `infoLink type=infoGroup`, `field=hidden/defaultAmount`,
  profils-capacité à `typeName` non-`Abilities`…), le pipeline résoudre→évaluer→agréger,
  les **idiomes multiples** (sources de trous silencieux) et un renvoi vers chaque prompt
  spécialisé. À donner à toute appli qui parse la base.
- **`editor/CONDITIONAL_WEAPON_RULES_APP_PROMPT.md`** — prompt autonome
  (application consommatrice) : les règles d'arme **conditionnées à la
  cible** de la 11e (Lethal Hits non-M/V, Hunter M/V, Devastating Wounds
  Infantry/M-V, Sustained Hits M/V), désormais dans les `sharedRules` du
  gst ; double canal mot-clef littéral + `infoLink`, sémantique évaluée
  avec les mots-clefs du défenseur, Hunter = restriction de ciblage par
  profil (`➤`).
- **`editor/DETACHMENT_ALLIES_APP_PROMPT.md`** — prompt autonome (application
  consommatrice) : alliés accordés par un **détachement** (Deathwatch Support : unités
  DEATHWATCH dans une armée Space Marines, 500 pts max, pas de Warlord, KILL TEAM =
  améliorations du détachement) ; marqueur `<comment>det-allies: keyword=… maxPts=…
  cannot-warlord kill-team-enh-only</comment>` sur la `selectionEntry` du détachement. Variante
  `native` : démons des légions (Tallyband Summoners, Carnival of Excess, Changehost of Deceit,
  Khorne Daemonkin) **1000 pts max**, plafond aussi encodé sur la catégorie `Faction: <légion>`.
- **`editor/BATTLELINE_GRANT_APP_PROMPT.md`** — grants Battleline (catégorie
  conditionnelle `add`/`set-primary` + plafond 0-3→0-6), conditionnés détachement
  (`scope="force"`) ou Warlord (drapeau de catégorie sur la sélection Warlord).
- **`editor/WEAPON_SLOTS_APP_PROMPT.md`** — arme de **base fixe** (`min≥1`) +
  **emplacement optionnel à choix** (groupe `max=1`/min 0) ; même arme en base ET en
  option = deux emplacements (ex. Chaos Rhino : combi-bolter + pintle combi-bolter/weapon).
- **`editor/AUDIT_VOCABULAIRE_APP.md`** — audit exhaustif (2026-09) du
  vocabulaire BattleScribe présent dans la base (59 tags, 170 attributs,
  combinaisons modifier × champ × portée) croisé avec sa prise en compte par
  l'appli consommatrice : ✅ / 🟡 / ❌ / ➖ par élément, écarts classés par
  impact (modifiers d'armes, options révélées, erreurs hors unité, bornes de
  groupes conditionnées).
- **`editor/AUDIT_MOTEURS_2026-09.md`** — audit 2026-09-30 par **diff de deux
  moteurs** : évaluateur BattleScribe de référence réécrit de zéro
  (`scripts/refengine/` + `scripts/engine-diff*.mjs` dans cogitator-bellicum)
  confronté au parseur de l'appli sur les 36 factions ; écarts classés (bug
  appli corrigé / bug du nouveau moteur / équivalent par conception / défaut
  de données), verdicts de `AUDIT_VOCABULAIRE_APP.md` corrigés (§7), points
  restants côté données (§8 : Sternguard sans `min`, Venerable Dreadnought SW,
  `defaultSelectionEntryId` visant une cible, ids morts, portes d'améliorations).
- **`editor/SM_FICHES_OFFICIELLES_11E.md`** — fiches 11ᵉ des chapitres divergents
  confrontées aux **données de l'appli officielle** publiées par le dépôt public
  `game-datacards/datasources` (`11th/gdc` : caractéristiques, armes, texte officiel
  des capacités, composition, options d'équipement en EN/FR). Source de référence
  pour remplacer les textes provisoires ALN et encoder les compositions ;
  régénérer avec `editor/translations/gdc-compare.cjs` (mode d'emploi en tête).
- **`editor/SOURCE_GAME_DATACARDS.md`** — la source game-datacards sauvegardée
  (`editor/sources/game-datacards.json` : version suivie, correspondance fichier ↔
  catalogue, bruits connus), ses outils `gdc-*` et la **veille quotidienne**
  (`gdc-watch.cjs` : diff amont confronté à la base, verdict par changement, règle de
  décision ; rapports dans `editor/sources/veille/`, branche `veille-gdc/v<N>`).
- `editor/README.md` — l'éditeur web (`node editor/server.js`) et la lib
  `editor/lib/catalog.js` + `editor/lib/xml.js` (round-trip XML fidèle :
  toujours passer par cette lib pour éditer, jamais de sed/regex sur les
  fichiers).

## Autres documents (non listés auparavant)

- **`editor/DEFAULT_LOADOUT_APP_PROMPT.md`** — prompt autonome (appli) : afficher le
  chargement d'arme **par défaut** d'un modèle (évaluation du loadout, aucune donnée).
- **`editor/DETACHMENT_DP_APP_PROMPT.md`** — prompt autonome (appli) : coût **DP** de
  détachement variable par sous-chapitre (Space Marines).
- **`editor/DETACHMENT_RULES_APP_PROMPT.md`** — prompt autonome (appli) : agréger
  **toutes** les règles d'un détachement, pas seulement la première.
- **`editor/SUPPORT_KEYWORD_APP_PROMPT.md`** — prompt autonome (appli) : reconnaître
  les modèles **SUPPORT** (capacité de base via `infoLink`).
- **`editor/PARSER_TEST_CASES.md`** (+ `parser-test-cases.json`) — cas de test du
  parseur, un idiome à la fois (valeurs extraites de la vraie donnée).
- **`editor/SM_CODEX_11E.md`** — journal d'intégration du codex Space Marines 11e
  (sourcé / déduit / manquant).
- **`editor/SM_DIVERGENTS_11E.md`** — reliquat de la mise à jour 11e des chapitres
  divergents (état au 2026-10-06).
- **`editor/README.md`** — l'éditeur web et la lib `editor/lib/catalog.js` + `xml.js`.
- **`ETAT.md`** (racine) — état de reprise : branches, lignes de base, questions
  ouvertes à l'utilisateur, décisions récentes.
