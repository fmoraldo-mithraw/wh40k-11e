#!/bin/bash
# verifie.sh — validation CLAUDE.md règle 4 en UNE commande, sortie courte :
# xmllint sur les .cat/.gst modifiés (vs HEAD + non suivis), puis
# editor/audit/valider.mjs (lib round-trip + références, cliquet ids dupliqués,
# defaultSelectionEntryId, rattachements Leader/Support), puis l'audit des
# améliorations de l'appli (scripts/data-audit.mjs : amelioration-porteur-manquant,
# ligne de base) si le dépôt cogitator-bellicum est à côté ($COGITATOR_DIR).
# Code de sortie ≠ 0 au moindre échec. Usage : editor/bin/verifie.sh [--rapide]
cd "$(dirname "$0")/../.." || exit 2
mapfile -d '' F < <(git diff -z --name-only HEAD -- '*.cat' '*.gst'; git ls-files -z --others --exclude-standard -- '*.cat' '*.gst')
if [ ${#F[@]} -gt 0 ]; then
  xmllint --noout "${F[@]}" || { echo "✗ xmllint"; exit 1; }
  echo "✓ xmllint (${#F[@]} fichier(s) modifié(s))"
else
  echo "· aucun .cat/.gst modifié vs HEAD"
fi
OUT=$(node editor/audit/valider.mjs 2>&1); RC=$?
echo "$OUT" | grep -E "✓|✗|en erreur|dépassement|cassé|ERREUR|manqu" | sed 's/^ *//'
[ $RC -eq 0 ] && echo "✓ valider.mjs" || echo "✗ valider.mjs (code $RC) — relancer node editor/audit/valider.mjs pour le détail"
[ $RC -eq 0 ] || exit $RC
COG=${COGITATOR_DIR:-../cogitator-bellicum}
if [ "$1" != "--rapide" ] && [ -f "$COG/scripts/data-audit.mjs" ]; then
  A=$(BSDATA_DIR="$PWD" node "$COG/scripts/data-audit.mjs" 2>&1); RA=$?
  echo "$A" | grep -E "anomalies|NOUVELLE|✗" | head -12
  [ $RA -eq 0 ] && echo "✓ audit des améliorations (appli)" || { echo "✗ audit des améliorations (code $RA)"; exit $RA; }
fi
exit 0
