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

Le mécanisme en service est une **Routine Claude** (déclencheur planifié
stocké côté serveur Claude — durable : il survit aux conteneurs et aux
sessions, contrairement aux crons de session, volatils). Routine active :
« MFM cowork — intégration des nouveaux dumps », horaire (:23 UTC),
chaque tir ouvre une session fraîche dans l'environnement des deux dépôts
et exécute CETTE tâche ; notification push à l'utilisateur quand un tir a
réellement intégré quelque chose (les no-op sont silencieux).

Gestion : visible et modifiable dans l'interface Routines de claude.ai,
ou depuis une session Claude Code (« liste mes routines », « mets la
routine MFM cowork en pause », « change sa cadence »). Pour la recréer si
elle a été supprimée, dans une session Claude Code de cet environnement :

> « Crée une routine horaire qui exécute `editor/mfm/COWORK_TASK.md`
> (session fraîche à chaque tir, notification push) »

Repli sans Routine : un cron de session (« Planifie un cron horaire qui
exécute editor/mfm/COWORK_TASK.md ») fonctionne aussi, mais il est
éphémère (lié à la session, 7 jours max) — à relancer à chaque session.
