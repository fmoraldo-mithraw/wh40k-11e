---
name: livraison
description: Clôturer une tâche sur wh40k-11e et/ou cogitator-bellicum — validation, commits par faction, synchro du parseur embarqué, push des deux dépôts, mise à jour d'ETAT.md, rapport court en français. À utiliser dès qu'un changement de données ou d'appli est prêt à être committé.
---

# Livraison (données + appli)

Ordre fixe ; s'arrêter au premier ✗ et le corriger (ne jamais committer un état non validé).

1. **Données modifiées ?** `editor/bin/verifie.sh` (xmllint + valider.mjs + audit des améliorations).
   `scripts/dev/sync-data.sh` côté appli si l'appli doit voir les nouvelles données.
2. **Appli modifiée ?** `npx eslint <fichiers touchés> --max-warnings 0`, puis
   `scripts/dev/tests.sh --only <suites concernées>`, puis `scripts/dev/tests.sh` (complet, une fois).
   Comportement visible ? `node scripts/dev/ui-check.mjs …` (texte, pas de capture).
3. **Commits** (français, descriptifs, pied de page d'attribution fourni par le système) :
   - données : **un commit par faction** (`git add "<Faction>.cat"`), puis un commit doc/outils ;
   - appli : un commit par sujet.
4. **Parseur changé ?** (`scripts/bsdata-parser.mjs`) — après le commit appli :
   `COGITATOR_DIR=../cogitator-bellicum bash editor/mfm/vendor/sync-parser.sh` dans wh40k-11e,
   vérifier que l'en-tête `source-commit:` correspond au commit appli, committer.
5. **Push** : `scripts/dev/pousse.sh <branche-de-session>` (appli) et
   `editor/bin/pousse.sh <branche-de-session>` (données). Jamais de force-push.
6. **ETAT.md** : retirer ce qui est réglé, ajouter les questions ouvertes / nouvelles lignes de
   base / décisions ; committer avec le reste (ou un petit commit « ETAT »).
7. **Rapport** à l'utilisateur, court : ce qui a changé (données / appli), comment c'est vérifié
   (chiffres), **doutes** et questions — pas de liste de fichiers, pas de récit des étapes.
