#!/usr/bin/env bash
# Régénère editor/mfm/vendor/bsdata-parser.mjs : copie AUTONOME (bundle
# esbuild, fast-xml-parser + src/lib/comp.js inclus) du parser de l'app
# cogitator-bellicum. build-map.mjs s'en sert en REPLI quand le dépôt de
# l'app n'est pas disponible (routine cowork : clone refusé → plus de blocage).
#
# usage : editor/mfm/vendor/sync-parser.sh [--check]
#   COGITATOR_DIR=<repo app> (défaut : dépôt frère ../cogitator-bellicum,
#   node_modules installés).
#   --check : n'écrit rien ; code 1 si la copie est périmée vs les sources.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
APP="${COGITATOR_DIR:-$(dirname "$REPO")/cogitator-bellicum}"
OUT="$HERE/bsdata-parser.mjs"
SRCS=(scripts/bsdata-parser.mjs src/lib/comp.js)
[ -f "$APP/scripts/bsdata-parser.mjs" ] || { echo "sync-parser: app introuvable ($APP)" >&2; exit 2; }
SUM="$(cd "$APP" && cat "${SRCS[@]}" | sha256sum | cut -c1-16)"
CUR="$(sed -n 's/^\/\/ source-sha256: //p' "$OUT" 2>/dev/null | head -1 || true)"
if [ "${1:-}" = "--check" ]; then
  if [ "$SUM" = "$CUR" ]; then echo "sync-parser: à jour ($SUM)"; exit 0; fi
  echo "sync-parser: PÉRIMÉ (copie $CUR ≠ sources $SUM) — relancer editor/mfm/vendor/sync-parser.sh" >&2; exit 1
fi
[ "$SUM" = "$CUR" ] && { echo "sync-parser: déjà à jour ($SUM)"; exit 0; }
COMMIT="$(git -C "$APP" log -1 --format=%h -- "${SRCS[@]}" 2>/dev/null || echo '?')"
TMP="$(mktemp)"
(cd "$APP" && npx --no-install esbuild scripts/bsdata-parser.mjs --bundle --platform=node \
  --format=esm --target=node18 --log-level=warning --outfile="$TMP")
{
  echo "// GÉNÉRÉ — ne pas éditer. Copie autonome du parser de cogitator-bellicum"
  echo "// (scripts/bsdata-parser.mjs + dépendances), repli de build-map.mjs."
  echo "// Régénérer : editor/mfm/vendor/sync-parser.sh"
  echo "// source-commit: $COMMIT"
  echo "// source-sha256: $SUM"
  cat "$TMP"
} > "$OUT"
rm -f "$TMP"
echo "sync-parser: écrit $OUT (commit $COMMIT, $SUM)"
