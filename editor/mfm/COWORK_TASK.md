# COWORK_TASK — intégration d'un nouveau MFM (tâche exécutable par l'agent)

> Tâche périodique du versant « cowork » de l'automatisation MFM (voir
> README, section Automatisation). Le cron serveur (`cron-mfm.sh`) pousse le
> nouveau dump sur `main` ; CETTE tâche, exécutée en cron par une session
> Claude/Cowork, détecte ce push et intègre les points. Elle est écrite pour
> être **idempotente et silencieuse** quand il n'y a rien à faire.

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
3. **Appliquer les deltas AUTO** via `editor/lib/catalog.js` UNIQUEMENT
   (jamais de sed/regex sur les `.cat`) : coût de base, paliers de taille,
   prix par répétition (forme NATIVE increment + atLeast), points
   d'améliorations.
4. **Traiter le résidu** (« À ME RENVOYER ») quand la donnée en base suffit
   à trancher ; ne JAMAIS inventer une valeur douteuse — le reste est
   rapporté tel quel à l'utilisateur.
5. **Exception Orks** : ne pas appliquer un MFM de version ≤ v1.3 aux Orks
   (le codex en base est plus récent). Un MFM v1.4+ s'applique normalement.
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

Les crons de session sont **éphémères** (liés à la session, expiration 7
jours). Dans une session Claude Code/Cowork disposant des deux dépôts, une
seule phrase suffit :

> « Planifie un cron horaire qui exécute `editor/mfm/COWORK_TASK.md` »

L'agent doit alors créer un cron (~horaire, minute décalée) dont le prompt
est : *« Exécute la tâche editor/mfm/COWORK_TASK.md du dépôt wh40k-11e :
détection d'un dump MFM non intégré, intégration si besoin, sinon no-op
silencieux. »*
