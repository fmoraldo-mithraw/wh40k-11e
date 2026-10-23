#!/bin/bash
# branche-principale.sh — place un dépôt sur sa branche PRINCIPALE (décision du
# 2026-10-23 : on travaille toujours sur `main` côté données et `feat/v11` côté
# appli ; la branche de session ne reçoit qu'une copie via pousse.sh).
# Usage : editor/bin/branche-principale.sh <dossier-du-dépôt> <branche>
# Ne perd jamais rien : refuse (avertissement, on reste où on est) si la branche
# locale ou la branche courante a des commits absents de la cible, ou si un
# changement de commit est nécessaire avec un arbre de travail modifié.
# Sortie : une ligne.
D=${1:?dossier}; B=${2:?branche}
cd "$D" 2>/dev/null || { echo "⚠ $D introuvable"; exit 0; }
N=$(basename "$PWD")
for i in 1 2 3 4; do git fetch -q origin "$B" 2>/dev/null && break; sleep $((2**i)); done
CUR=$(git branch --show-current)
anc(){ git merge-base --is-ancestor "$1" "$2" 2>/dev/null; }
# Cible : le plus avancé de HEAD et origin/B, à condition qu'ils soient alignés.
if ! git rev-parse -q --verify "origin/$B" >/dev/null; then T=HEAD
elif anc "origin/$B" HEAD; then T=HEAD
elif anc HEAD "origin/$B"; then T="origin/$B"
else echo "⚠ $N : $CUR a divergé de origin/$B — rester sur $CUR, rebaser à la main"; exit 0; fi
if git rev-parse -q --verify "refs/heads/$B" >/dev/null && ! anc "$B" "$T"; then
  echo "⚠ $N : $B locale a des commits absents de $T — rester sur $CUR"; exit 0
fi
TC=$(git rev-parse "$T")
if [ "$TC" != "$(git rev-parse HEAD)" ] && [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "⚠ $N : arbre modifié, $B non mise à jour — rester sur $CUR"; exit 0
fi
if [ "$CUR" = "$B" ]; then git merge -q --ff-only "$TC"
else git branch -f "$B" "$TC" && git checkout -q "$B"; fi
git branch -q -u "origin/$B" "$B" 2>/dev/null || true
echo "✓ $N : sur $B ($(git log --oneline -1 | cut -c1-60))"
