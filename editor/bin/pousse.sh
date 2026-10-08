#!/bin/bash
# pousse.sh — publie main (données) : fetch + rebase sur origin/main + push,
# puis recopie main sur la branche de session si elle est donnée.
# Jamais de force-push. Usage : editor/bin/pousse.sh [branche-de-session]
set -e
cd "$(dirname "$0")/../.."
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "✗ arbre de travail modifié — committer d'abord"; exit 1; }
git fetch origin main -q && git rebase origin/main -q
for i in 1 2 3 4; do git push -u origin main -q && break || sleep $((2**i)); done
[ -n "$1" ] && git push origin "main:$1" -q
echo "✓ poussé : main $(git log --oneline -1 | cut -c1-70)${1:+ → $1}"
