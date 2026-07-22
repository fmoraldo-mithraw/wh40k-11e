# PROMPT — Intégrer un MFM (Munitorum Field Manual) dans wh40k-11e

> Prompt réutilisable : colle ce fichier comme consigne à l'agent quand le
> MFM (points des unités et des améliorations) sort. Il décrit l'encodage
> des points dans ce dépôt, **les deux nouveautés attendues** (surcoût par
> arme, prix par seuil de répétition), les pièges et la validation
> obligatoire. Conventions générales : voir `FACTION_PACK_PROMPT.md`.

Tu intègres un MFM GW (PDF) dans le dépôt `wh40k-11e` (données
BattleScribe `.cat`/`.gst`). Travaille sur la branche de dev, commit/push
par faction. Le PDF est dans `/root/.claude/uploads/<session>/`.

## Constantes

- Coût points : `typeId="51b2-306e-1021-d207"`, `name="pts"`.
- Les modifiers de coût utilisent ce même typeId dans `field`.
- DP (détachements) : `typeId="0d99-4ee2-7b3c-1f5a"` — le MFM ne les
  change pas, n'y touche pas.

## Encodage actuel des points (état des lieux, vérifié)

1. **Unité, taille de base** : `<cost name="pts" …value="N"/>` sur le
   selectionEntry `type="unit|model"` de la datasheet.
2. **Tailles supérieures** (« 10 modèles → X pts, 20 → Y pts ») :
   modifiers `type="set"` sur le champ pts, conditionnés par un décompte
   de modèles (`field="selections"`). La lib les lit/écrit :
   `readTiers(unitNode)` et `editUnit(file, id, { tiers })`
   (→ `applyTiers`). Lis ces deux fonctions avant d'écrire.
3. **Options d'armes** : aujourd'hui presque toutes à `value="0"`. Elles
   existent sous deux formes : selectionEntry `type="upgrade"` (ou
   variante de modèle `type="model"`, ex. « Khorne Berzerker w/
   eviscerator… ») dans un selectionEntryGroup, ou `entryLink` vers une
   arme partagée. `readOptions(unitNode)` lit le pts de chaque choix ;
   `editUnit(file, id, { options })` l'écrit. **Certaines unités n'ont
   pas leurs options modélisées** (groupes vides, ex. wargear du Chaos
   Rhino) — voir « Armes payantes », cas C.
4. **Améliorations** : `<cost name="pts"…/>` sur l'entrée d'amélioration
   (menu ou Upgrade). Beaucoup sont à 0 (placeholders), d'autres déjà
   chiffrées — toujours diff-checker.

## Workflow

1. **Extraction** : le MFM est une liste « unité / taille / pts » +
   améliorations par détachement. Extrais-le en table intermédiaire
   (`/tmp/mfm.json` : `{faction: {units: {name: [{models, pts}…]},
   enhancements: {detachment: {name: pts}}}}`). Méfie-toi des renvois de
   colonne et des noms abrégés ; ne devine jamais un chiffre illisible.
2. **Audit avant** : écris `/tmp/points_audit.js` qui dumpe pour chaque
   datasheet `name / coût de base / tiers / options non nulles` et chaque
   amélioration `name / pts`, et compare à `/tmp/mfm.json`. N'applique
   que les **différences** (diff-check maison : ne réécris pas une valeur
   identique).
3. **Application** : scripts Node via la lib (`editUnit({costs},
   {tiers}, {options})`, jamais de sed). Une exécution = une faction.
4. **Validation puis commit par faction** (gauntlet habituel : xmllint,
   `catalog.validate` ok 0 erreur, 0 id dupliqué vs HEAD) + re-run de
   l'audit qui doit sortir « 0 écart ». Message :
   `"<Faction>: points MFM <édition/date>"`.

## Nouveauté 1 — surcoût par arme

Le MFM peut dire « l'unité coûte +X pts si elle prend l'arme W ». Trois
cas, dans cet ordre de préférence :

- **A. L'option est un selectionEntry local à l'unité** (upgrade ou
  variante de modèle) : mets le pts **sur l'entrée d'option**
  (`editUnit({options: [{id, pts}]})`). BattleScribe additionne les
  coûts des sélections enfants — c'est exact, visible dans l'UI, et
  c'est le pattern natif.
- **B. L'option est un `entryLink` vers une arme partagée** : si le
  surcoût vaut pour tous les utilisateurs de l'arme, coût sur l'entrée
  partagée ; si le surcoût **dépend de la datasheet**, coût sur
  **l'entryLink local** (un entryLink porte ses propres `<costs>`,
  `readOptions` les lit déjà). Ne chiffre jamais l'entrée partagée avec
  la valeur d'une seule datasheet — vérifie `weaponUsage(weaponId)`.
- **C. L'option n'est pas modélisée** (groupe vide / arme en simple
  profil) : crée d'abord l'option (`addOptionChoice` ou entrée locale
  avec contrainte `max 1 @parent`), puis cas A. En dernier recours
  seulement (option impossible à modéliser proprement), modifier
  conditionnel sur le coût de l'unité :
  `increment <X> field=pts` + condition
  `atLeast 1 field="selections" scope="parent" childId="<id arme>"
  shared="true"` — documente-le en `<comment>`.

## Nouveauté 2 — prix par seuil de répétition (RÈGLE FIGÉE — révisée)

**Sémantique** : « les N premiers exemplaires au prix de base, chaque
exemplaire **au-delà du Nième** à un autre prix ». Le MFM donne les deux prix.

**Encodage (décision utilisateur, remplace l'ancien)** : surcoût porté par un
**modifier de coût** sur le `selectionEntry` de l'unité + un **marqueur**
`<comment>` ; c'est l'**application** qui n'applique le surcoût qu'aux
exemplaires au-delà du Nème. **On ne duplique plus l'entrée.** L'ancien pattern
« entrée scindée / `(additional)` » (`splitRepeatTier`) est **abandonné** :
l'entrée cachée n'apparaissait jamais dans les applis à parsing statique (le 3e
exemplaire ne coûtait pas plus cher). `removeRepeatTier` sert désormais à
**déposer** d'anciennes jumelles avant de poser le modifier.

```xml
<modifier type="increment" field="51b2-306e-1021-d207" value="Δ">
  <comment>repeat-cost: threshold=N delta=Δ (surcout par exemplaire au-dela du Neme uniquement; voir editor/REPEAT_COST_APP_PROMPT.md)</comment>
  <conditions>
    <condition type="atLeast" value="N+1" field="selections" scope="roster"
               childId="<id de l'unité>" shared="true"
               includeChildSelections="true" includeChildForces="true"/>
  </conditions>
</modifier>
```

- `value` = Δ = prix_fort − prix_base (**forfait par exemplaire**, constant
  quelle que soit la taille). `threshold=N` dans le marqueur (= `value` de la
  condition − 1). Coût de base + paliers de taille (`set` pts) restent encodés
  comme d'habitude ; le repeat-cost s'ajoute par-dessus.
- Δ supposé **constant** sur tous les paliers de taille ; si le MFM donne des Δ
  différents par taille → **demander** (un forfait unique ne suffit pas).
- **Pièges** : créer le `<modifiers>` manquant avec `selfClose=false` (sinon le
  modifier est perdu au save) ; déposer toute ancienne jumelle `(additional)`
  **dans une passe séparée** (`removeRepeatTier`) avant d'ajouter le modifier —
  ne pas entrelacer dépose et ajout dans la même boucle.
- **Côté application** : `editor/REPEAT_COST_APP_PROMPT.md` (compter les
  exemplaires dans le roster ; N premiers au prix normal, le reste à +Δ ;
  **jamais** Δ sur tous).

La brique « increment + `<repeats>` + condition seuil » existe déjà dans
le dépôt pour des paliers **intra-unité** (par modèle au-delà du Nième) ;
réutilise-la telle quelle si le MFM introduit des paliers par modèle.

## Améliorations

- `editDetachment(file, id, {enhancements: [{id, pts}…]})` ou édition
  directe du `<cost>` de l'entrée. Les améliorations sont par
  détachement : un même nom dans deux détachements = deux entrées, deux
  prix possibles.
- Les « X Upgrade » (rattachées aux unités) se chiffrent pareil — leur
  coût s'ajoute à l'unité porteuse automatiquement.

## Pièges

- **Bibliothèques partagées** (Aeldari/Drukhari, Tyranids/GSC, Chaos
  Knights/Daemons Library…) : la datasheet peut vivre dans un autre
  fichier que la faction du MFM. Résous par `datasheetsForTargeting` /
  l'index `byId`, et chiffre l'entrée **source**, pas l'entryLink,
  sauf surcoût spécifique à la faction (alors coût sur le link).
- `scope="roster"` compte tout le roster (multi-détachements compris) ;
  `scope="force"` un seul détachement. Le MFM parle d'« armée » →
  roster. Toujours `shared="true"` sur les conditions par childId.
- Unités à double entrée (ex. personnage à pied / monté) : le seuil de
  répétition vise-t-il chaque entrée ou l'ensemble ? Lis le texte GW ;
  pour viser l'ensemble, la condition peut porter sur une
  **categoryEntry** commune (childId = id de catégorie) plutôt que sur
  l'entrée.
- Ne touche ni aux profils, ni aux règles, ni aux mots-clefs : un MFM ne
  change que des nombres. Tout écart non numérique dans ton diff est un
  bug de ton script.
- 0 id dupliqué : tout nouvel élément (option créée, clone scindé,
  modifier) prend `c.newId()`.

## Retour d'expérience (MFM 22-07-2026) — erreurs réellement commises, à ne pas refaire

Chaque point ci-dessous a nécessité une correction après coup. Relire
**avant** d'écrire le moindre script d'application.

### 1. Surcoût par arme : TOUTES les occurrences, TOUS les fichiers

- Une datasheet peut porter la même arme dans **plusieurs emplacements**
  (Defiler : hades lascannon/heavy reaper autocannon dans 2 slots ;
  Knight Despoiler : 2 slots de bras). Le surcoût MFM s'applique à
  **chaque** emplacement. Bug commis : seule la 1ʳᵉ occurrence corrigée,
  le 2ᵉ slot resté à l'ancien prix.
- La même datasheet peut être **dupliquée localement dans plusieurs
  fichiers** (Defiler existe en copie locale dans CSM, Death Guard,
  Thousand Sons, Emperor's Children ET World Eaters). Corriger les 5,
  pas seulement le fichier de la faction en cours.
- **Options groupées** : « 2 ectoplasma cannons » = 2 × le surcoût
  unitaire (10 si l'arme vaut +5). Ne pas laisser à 0 sous prétexte que
  l'entrée unitaire est chiffrée ailleurs.
- **Faux positif légitime** : tarification par modèle (Ironstrider
  Ballistarius autocannon 80 / lascannon 90 = surcoût +10 encodé dans
  la différence de prix des variantes de modèle). Vérifier avant de
  « corriger ».
- **Contrôle obligatoire en fin de passe** : script type `weapons_check`
  — pour chaque entrée `per` du MFM (toutes factions), lister TOUTES les
  occurrences (selectionEntry + entryLink) dans le sous-arbre de chaque
  unité homonyme de TOUS les fichiers, et comparer chaque valeur.
  Un lien sans `<costs>` alors que le MFM donne un surcoût = bug
  (Knight Despoiler/Crusader étaient à 0 sans que l'audit standard le
  voie).

### 2. Améliorations « introuvables » = presque toujours des variantes de nom

Sur ~20 « introuvables » du 22-07, **zéro** création nécessaire : tout
était variante de graphie. Réflexe : **renommer à l'orthographe MFM**,
jamais créer un doublon. Variantes rencontrées :
- suffixes `[Aura]` / `(Aura)` / `(Psychic)` absents du MFM ;
- typos : Slaugterthirst→Slaughterthirst, Sublime Presence→Prescience,
  Camoflage→camouflage, Denounciation→Denunciation ;
- espacement/tirets : Spy-skull Datalink→Spy-skull Data Link,
  Priority-drop→Priority Drop, Arch Negator→Arch-negator,
  Intraneural→Introneural Biotech ;
- articles : Master of **the** Machine War, Herald of **the** Sacred
  Slaughter ; pluriels : Stormseer's→Stormseers' ;
- renommage complet : « Sharp Eyes, Light Fingers Upgrade » →
  « Sharp Eyes Upgrade ».
Pièges d'audit associés :
- une amélioration du même nom peut exister dans **plusieurs
  détachements à des prix différents** (Mistweave 20 en Fateful
  Performance / 15 en Ghosts of the Webway ; Towering Arrogance 15/20 ;
  Periapt 20/25 ; Archraider 15/35) — comparer **par détachement**,
  jamais par nom seul ;
- ignorer les **copies Crusade à 0 pts** (groupes « … Battle Honours »,
  « Regimental Commendations ») : ce ne sont pas des améliorations MFM.

### 3. Normalisation des noms (dump MFM et repo)

- Tirets Unicode : U+2011 (`‑`), U+2013/2014 → normaliser en `-`
  (« Parasitic Woe‑reaper » ne matchait pas sinon).
- Milliers : toujours parser le champ `raw` (« 2,200 pts ») — le champ
  `points` du dump a déjà été buggé là-dessus.
- Apostrophes `’` vs `'`, accents, ARMOR/ARMOUR, pluriels : normaliser.
- **Agents de l'Imperium : chaque unité apparaît 2× dans le dump**
  (1ʳᵉ = prix armée, 2ᵉ = prix alliés). Garder la PREMIÈRE occurrence
  comme base, encoder l'écart en increment allié — lire
  `AGENTS_DUAL_COST_PROMPT.md` AVANT tout traitement de ce fichier.
- Alias d'unités : « SOUL GRINDER » (MFM) = 4 entrées par dieu dans la
  bibliothèque Daemons (Khorne/Tzeentch/Nurgle/Slaanesh Soul Grinder) —
  vérifier les 4.

### 4. Détachements : DP, Force Disposition, UNIQUE — à auditer aussi

Oublié lors de la passe 22-07 (rattrapé après coup) : le MFM porte pour
chaque détachement un **coût DP**, une **Force Disposition** et un
éventuel mot-clef **UNIQUE** — et GW les **rebalance** d'une édition à
l'autre (22-07 : ~75 changements de FD/DP, dont des retraits de UNIQUE
« unique tag removed »). Contrôle systématique obligatoire (script type
`det_check`) : comparer `det_meta` du dump (dp/fd/unique) à l'entrée de
détachement du repo. Pièges :
- le **même détachement partagé** peut avoir un **DP différent selon le
  chapitre** (Stormlance 3 en SM/DA/SW mais 2 en BT/BA/DW ; Bastion 3 en
  BT) — encodé par modifier `set` sur le champ DP conditionné
  `primary-catalogue` (marqueur `chapter-cost:`) : un checker qui ne lit
  que le coût de base sort des faux positifs ;
- noms : « Ordo Hereticus, Purgation Force » (MFM) = « Purgation Force
  (Ordo Hereticus) » (repo) ; ne pas confondre avec les **Specialisms**
  d'Inquisiteur qui portent les mêmes noms courts « Ordo Malleus »… ;
- le champ `unique` du dump est préfixé « UNIQUE: » et vaut parfois
  « UNIQUE TAG REMOVED » (= retirer le `<comment>unique-detachment:`).

### 5. Le dossier Drive contient plus que les faction packs

Le dossier `W40k/mfm` du 22-07 contenait aussi
`…universal_rules_updates….pdf` (mises à jour de règles **universelles**,
hors packs) — oublié lors de la première passe. Toujours **lister le
dossier entier** et rapprocher chaque PDF de la liste traitée. Les règles
universelles sont des errata « par motif » (ex. « for 0CP » sans nom de
stratagème → réduction 1CP) : chercher les motifs dans TOUS les fichiers
(.cat **et** .gst), en n'appliquant qu'aux textes qui matchent vraiment
(la plupart des « for 0CP » noment leur stratagème et restent valides).
Noter aussi : un pack absent du dossier (Astra Militarum, Deathwatch) ou
daté d'une édition antérieure (Blood Angels 08-06) = pas de rules updates
à appliquer pour cette faction, points MFM seulement.

### 6. Ne jamais déclarer un résiduel « expliqué » sans preuve

Chaque ligne restante de l'audit doit avoir une explication **vérifiée
dans le XML** (prix par modèle, copie Crusade, homonyme multi-détachement,
alias). « Probablement encodé ailleurs » n'est pas une explication : les
armes du Knight Despoiler sont restées à 0 précisément à cause de ce
raccourci.

## Validation finale (obligatoire, par faction)

1. `xmllint --noout` sur chaque fichier touché.
2. `catalog.validate({dirtyOnly:false})` → ok, 0 erreur.
3. Ids dupliqués identiques à HEAD (`grep -oE 'id="[^"]+"' | sort |
   uniq -d`).
4. Re-run `/tmp/points_audit.js` → 0 écart vs `/tmp/mfm.json`.
5. `c.auditRepeatTiers()` → `[]` (0 problème) si des scissions existent.
6. Diff git lisible : uniquement des `value="…"` de coûts, des modifiers
   de coût, et les éventuelles entrées d'option/scission documentées.
