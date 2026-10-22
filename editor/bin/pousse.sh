#!/bin/bash
# pousse.sh — publie main (données) : fetch + rebase sur origin/main + push,
# puis recopie main sur la branche de session si elle est donnée.
# Jamais de force-push. Usage : editor/bin/pousse.sh [branche-de-session]
set -e
cd "$(dirname "$0")/../.."
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "✗ arbre de travail modifié — committer d'abord"; exit 1; }
# Commits faits sur une autre branche (de session) : main doit les contenir.
# Fast-forward sûr si main est un ancêtre de HEAD ; sinon on refuse (le 22/10,
# 10 commits de session n'étaient jamais partis parce que main était restée
# en arrière et que le script poussait une main périmée en annonçant un succès).
CUR=$(git branch --show-current)
if [ "$CUR" != "main" ]; then
  git merge-base --is-ancestor main HEAD || { echo "✗ branche $CUR divergée de main — rebaser sur main d'abord"; exit 1; }
  git branch -f main HEAD
fi
git fetch origin main -q && git rebase origin/main -q
# Rebase fait depuis la branche courante : refléter sur main si on n'y est pas.
[ "$CUR" = "main" ] || git branch -f main HEAD
OK=; for i in 1 2 3 4; do git push -u origin main:main -q && { OK=1; break; }; sleep $((2**i)); done
[ -n "$OK" ] || { echo "✗ push de main en échec après 4 essais"; exit 1; }
[ -n "$1" ] && git push origin "main:$1" -q
[ "$CUR" = "main" ] || git branch -u origin/main main >/dev/null 2>&1 || true
echo "✓ poussé : main $(git log --oneline -1 | cut -c1-70)${1:+ → $1}"
