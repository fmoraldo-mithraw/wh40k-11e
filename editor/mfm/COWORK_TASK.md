# COWORK_TASK — intégration d'un nouveau MFM (tâche exécutable par l'agent)

> Tâche périodique du versant « cowork » de l'automatisation MFM (voir
> README, section Automatisation). Le cron serveur (`cron-mfm.sh`) pousse le
> nouveau dump sur `main` ; CETTE tâche, exécutée en cron par une session
> Claude/Cowork, détecte ce push et intègre les points. Elle est écrite pour
> être **idempotente et silencieuse** quand il n'y a rien à faire.

## Étape 0 — auto-provisionnement (session sans clones)

Si `/home/user/wh40k-11e` n'existe pas (session planifiée ouverte dans un
environnement non provisionné — répertoire home vide), clone d'abord :

```sh
git clone --filter=blob:none https://github.com/fmoraldo-mithraw/wh40k-11e.git /home/user/wh40k-11e
git clone --depth 1 https://github.com/fmoraldo-mithraw/cogitator-bellicum.git /home/user/cogitator-bellicum
```

(Le second est requis seulement pour `build-map` ; en cas d'échec du
clone, continuer — les matrices commitées font l'affaire.) Si le clone de
wh40k-11e échoue aussi (pas de credentials git dans l'environnement),
terminer en signalant l'échec de provisionnement — ne rien inventer.

## Déclencheur — détection d'un dump non intégré

1. `git fetch origin main` dans le clone local de wh40k-11e.
2. Comparer le hash d'arbre du dump sur origin/main :
   `git rev-parse origin/main:editor/mfm/dump/en`
   avec le contenu de `editor/mfm/state/integre.txt` **sur origin/main**
   (`git show origin/main:editor/mfm/state/integre.txt`).
3. **Égaux → rien à faire.** Terminer en silence (no-op), ne rien pousser,
   ne pas solliciter l'utilisateur.
4. Différents → un dump a été poussé sans être intégré : dérouler
   l'intégration ci-dessous.

## Intégration

Se placer sur `main` à jour (`git checkout main && git reset --hard
origin/main`), puis :

1. **Lire les références** (elles font autorité) : `CLAUDE.md` (règles
   maison), `editor/mfm/README.md` (chaîne et garde-fous),
   `editor/MFM_PROMPT.md` (encodage des points),
   `editor/AGENTS_DUAL_COST_PROMPT.md` (Agents : chaque unité 2× dans le
   MFM), `editor/MARINE_CHAPTER_COST_APP_PROMPT.md` (coûts de chapitre —
   jamais d'écriture brute sur un bsId partagé à prix divergent).
2. **Chaîne de diff** : si besoin régénérer les matrices
   (`node editor/mfm/build-map.mjs editor/mfm/dump/en` — nécessite le
   parseur de l'app, `COGITATOR_DIR=…/cogitator-bellicum`), puis
   `node editor/mfm/apply.mjs editor/mfm/dump/en` (dry-run) pour obtenir
   les **DELTAS AUTO-APPLICABLES** et le bloc **« À ME RENVOYER »**.
2bis. **Audit détachements** : `node editor/mfm/dp-audit.mjs
   editor/mfm/dump/en` — apply.mjs ne couvre que les POINTS ; les coûts DP,
   Force Dispositions et mots-clefs UNIQUE (retraits compris) se vérifient
   avec cet outil (overrides par chapitre évalués, exception Orks bornée à
   ≤ v1.3). Corriger chaque écart signalé via `editor/lib/catalog.js`.
2ter. **Audit surcoûts d'armes** : `node editor/mfm/wpn-audit.mjs
   editor/mfm/dump/en` — les profils « per <arme> = N pts » sont aussi hors
   du périmètre d'apply. L'outil accepte les formes réelles d'encodage
   (option nommée, paire de sponsons 2×N, option combinée, modèle-variante,
   coût porté par l'entryLink). Corriger les « ✗ » ; vérifier à la main les
   « ? » restants avant de conclure.
3. **Appliquer les deltas AUTO** via `editor/lib/catalog.js` UNIQUEMENT
   (jamais de sed/regex sur les `.cat`) : coût de base, paliers de taille,
   prix par répétition (forme NATIVE increment + atLeast), points
   d'améliorations.
4. **Traiter le résidu** (« À ME RENVOYER ») quand la donnée en base suffit
   à trancher ; ne JAMAIS inventer une valeur douteuse — le reste est
   rapporté tel quel à l'utilisateur.
5. **Orks** : plus d'exception depuis le MFM v1.4 (intégré, codex 11e en
   base) — les Orks se traitent comme toute faction. La borne « ≤ v1.3 » des
   outils (dp-audit, wpn-audit) est inerte pour tout MFM ≥ v1.4.
5bis. **Résidu qui N'EST PAS du résidu** — à APPLIQUER, pas à renvoyer :
   - « MFM a un prix par répétition (Δ=…) que la bdd n'encode pas » → poser
     la **forme native** (modifier `increment` pts value=Δ + condition
     `atLeast` value=N+1 `scope="roster"` childId=id de l'unité, voir
     `editor/MFM_PROMPT.md`) sur chaque cible de la matrice ; N = « 1ST TO
     Nth » (ou 1 pour « 1ST UNIT »), Δ constant sur tous les paliers (sinon
     → renvoyer).
   - « prix de taille MFM [X] non atteignable » → corriger le `set` du palier
     (valeur unique dans l'unité) ; « composition (taille non “N model”) »
     (Gretchin : « 10 Gretchin ») → comparer à la main le barème, souvent déjà
     conforme.
   - Régénérer les matrices (`build-map.mjs`) **avant** le diff (les champs
     `current` des matrices sont un cache de la bdd : périmés, ils font
     ressortir des écarts déjà corrigés) **et après** les écritures, puis
     re-lancer `apply.mjs` : le résidu Orks doit tomber à « pas de datasheet
     » (Gargantuan Squiggoth, hors base) + composition Gretchin. **Committer
     les matrices** régénérées avec les données.
6. **Validation obligatoire** avant tout commit :
   `node editor/audit/valider.mjs` → 0 erreur, 0 id dupliqué nouveau.
   Ne jamais committer un état non validé.
7. **Marquer l'intégration** : écrire le hash d'arbre du dump intégré dans
   `editor/mfm/state/integre.txt`
   (`git rev-parse origin/main:editor/mfm/dump/en > editor/mfm/state/integre.txt`)
   et l'inclure dans le commit — c'est ce qui rend la tâche idempotente.
8. **Commits par faction** (messages français descriptifs), puis push sur
   `main` (retries avec backoff). Respecter les conventions de commit du
   dépôt (trailer Co-Authored-By + Claude-Session ; jamais d'identifiant de
   modèle dans les artefacts poussés).
9. **Rendre compte à l'utilisateur** dans la session : version du MFM,
   deltas appliqués par faction, résidu traité, et la liste exacte de ce
   qui reste à faire à la main.

## Lancer / relancer le cron cowork

Le mécanisme en service est une **Routine Claude** (déclencheur planifié
stocké côté serveur Claude — durable : il survit aux conteneurs et aux
sessions, contrairement aux crons de session, volatils). Routine active :
« MFM cowork — intégration des nouveaux dumps », horaire (:23 UTC),
chaque tir ouvre une session fraîche dans l'environnement des deux dépôts
et exécute CETTE tâche ; notification push à l'utilisateur quand un tir a
réellement intégré quelque chose (les no-op sont silencieux).

### ⚠ La Routine DOIT être créée avec le dépôt attaché

Piège constaté (tirs en échec en boucle) : une routine créée **sans
source attachée** ouvre un conteneur **vide** — ni `/home/user/wh40k-11e`,
ni credentials de push. Elle ne peut alors ni lire CETTE tâche (le fichier
vit dans le dépôt absent), ni pousser quoi que ce soit : chaque tir échoue
et notifie.

**Créer la routine depuis l'interface Routines de claude.ai en
sélectionnant le dépôt `wh40k-11e`** (même environnement que les sessions
interactives : dépôt cloné + droit de push). Prompt à coller — autonome,
il ne dépend pas d'un fichier pour démarrer :

```
Versant cowork de l'automatisation MFM du dépôt wh40k-11e.
1. Si /home/user/wh40k-11e n'existe pas, clone-le (lecture anonyme OK) :
   git clone --filter=blob:none https://github.com/fmoraldo-mithraw/wh40k-11e.git /home/user/wh40k-11e
   puis, best-effort : git clone --depth 1 https://github.com/fmoraldo-mithraw/cogitator-bellicum.git /home/user/cogitator-bellicum
   Si le clone échoue, termine en signalant l'échec de provisionnement.
2. cd /home/user/wh40k-11e && git fetch origin main, puis compare
   `git rev-parse origin/main:editor/mfm/dump/en` à
   `git show origin/main:editor/mfm/state/integre.txt`.
   ÉGAUX -> no-op TOTAL et SILENCIEUX : ne notifie pas, n'écris rien, termine.
   DIFFÉRENTS -> lis editor/mfm/COWORK_TASK.md et applique-la intégralement.
   Orks : aucune exception (MFM ≥ v1.4). Régénère les matrices AVANT le diff
   et APRÈS tes écritures ; les « prix par répétition non encodés » et les
   « paliers non atteignables » s'APPLIQUENT (forme native), ils ne se
   renvoient pas (COWORK_TASK.md § 5bis).
3. Ne notifie l'utilisateur QUE si une intégration a réellement eu lieu,
   ou si un écart de données exige un arbitrage humain. Un échec technique
   d'environnement se signale UNE fois, pas à chaque tir.
Réponses en français.
```

Cadence conseillée : **quotidienne**, pas horaire — un MFM sort tous les
quelques mois, le cron serveur le détecte dans l'heure, et le marqueur
`state/integre.txt` fait que le cowork rattrape n'importe quel retard à
son premier tir. 24× moins de tirs pour le même résultat.

Gestion : interface Routines de claude.ai (pause, cadence, suppression) —
c'est aussi là qu'on **met en pause une routine qui échoue en boucle**.

Repli sans Routine : un cron de session (« Planifie un cron horaire qui
exécute editor/mfm/COWORK_TASK.md ») fonctionne aussi, mais il est
éphémère (lié à la session, 7 jours max) — à relancer à chaque session.
