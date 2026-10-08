#!/bin/bash
# Hook SessionStart (Claude Code on the web, synchrone) : prépare aussi l'appli voisine
# (au cas où seule la session de ce dépôt déclenche un hook), exporte COGITATOR_DIR et
# rappelle l'état de reprise. Sortie : deux lignes au plus (elles entrent dans le contexte).
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$(dirname "$0")/../.."
command -v xmllint >/dev/null || echo "⚠ xmllint absent (apt-get install -y libxml2-utils)"
C=$(cd ../cogitator-bellicum 2>/dev/null && pwd || true)
if [ -n "$C" ]; then
  bash "$C/scripts/dev/prepare.sh" || echo "⚠ préparation de l'appli en échec ($C/scripts/dev/prepare.sh)"
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    { echo "export COGITATOR_DIR=\"$C\""; echo "export BSDATA_DIR=\"$PWD\""; echo "export STRICT_DATA=1"; } >> "$CLAUDE_ENV_FILE"
  fi
fi
Q=$(awk '/^## Questions ouvertes/{f=1;next} /^## /{f=0} f&&/^[0-9]+\. /{n++} END{print n+0}' ETAT.md 2>/dev/null || echo "?")
echo "wh40k-11e : lire ETAT.md ($Q question(s) ouverte(s) à l'utilisateur) · outils editor/bin/ (voir CLAUDE.md)"
