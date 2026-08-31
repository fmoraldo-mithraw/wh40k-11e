#!/usr/bin/env bash
# cron-mfm.sh — job horaire NON-INTERACTIF de récupération du MFM.
#
# Fait :
#   1. synchronise le clone dédié sur origin/main ;
#   2. génère le dump MFM depuis mfm.warhammer-community.com (mfm_parser.py) ;
#   3. compare au dump commité (editor/mfm/dump/<lang>/) — s'il est identique,
#      sort en silence ;
#   4. sinon : copie le nouveau dump, régénère les matrices nom↔id
#      (build-map.mjs, best-effort), recalcule le diff (apply.mjs, best-effort,
#      → A_RENVOYER.md), committe le tout et pousse sur main.
#
# Le push est détecté par le versant cowork (session Claude en cron, tâche
# editor/mfm/COWORK_TASK.md) qui intègre les points.
#
# Installé par install-automation.sh ; configuration lue dans
# ${MFM_STATE_DIR:-~/.local/state/wh40k-mfm}/config (REPO_DIR, COGITATOR_DIR,
# MFM_LANG, MFM_BRANCH). Journal : <state>/cron.log. Verrou anti-chevauchement.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${MFM_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/wh40k-mfm}"
mkdir -p "$STATE_DIR"
LOG="$STATE_DIR/cron.log"
log() { printf '%s  %s\n' "$(date '+%F %T')" "$*" >> "$LOG"; }

# ── verrou : jamais deux exécutions en parallèle ────────────────────────────
exec 9> "$STATE_DIR/lock"
if ! flock -n 9; then log "verrou pris — exécution précédente en cours, on saute."; exit 0; fi

# ── configuration (écrite par install-automation.sh) ────────────────────────
CONFIG="$STATE_DIR/config"
# shellcheck disable=SC1090
[ -f "$CONFIG" ] && . "$CONFIG"
REPO_DIR="${REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
MFM_LANG="${MFM_LANG:-en}"
MFM_BRANCH="${MFM_BRANCH:-main}"
# COGITATOR_DIR : requis par build-map.mjs (clôture d'import) ; défaut = dépôt frère.
export COGITATOR_DIR="${COGITATOR_DIR:-$(dirname "$REPO_DIR")/cogitator-bellicum}"
# cron a un PATH minimal : couvre les emplacements usuels de node/python3.
export PATH="$PATH:/usr/local/bin:/usr/bin:/opt/homebrew/bin:$HOME/.local/bin"

cd "$REPO_DIR"
DUMP_DIR="editor/mfm/dump/$MFM_LANG"
REPORT="editor/mfm/A_RENVOYER.md"

fail() { log "✗ $*"; exit 1; }
command -v git     >/dev/null || fail "git introuvable"
command -v node    >/dev/null || fail "node introuvable"
command -v python3 >/dev/null || fail "python3 introuvable"

# ── 1) clone dédié → état exact d'origin/main ───────────────────────────────
git fetch origin "$MFM_BRANCH" -q || fail "git fetch impossible (réseau/auth ?)"
git checkout -q "$MFM_BRANCH" 2>/dev/null || git checkout -qb "$MFM_BRANCH" "origin/$MFM_BRANCH"
git reset -q --hard "origin/$MFM_BRANCH"

# ── 2) génération du dump dans un répertoire temporaire ─────────────────────
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
if ! python3 editor/mfm/mfm_parser.py --lang "$MFM_LANG" all -o "$TMP" >> "$LOG" 2>&1; then
  fail "génération MFM échouée (site inaccessible ?) — voir $LOG"
fi
ls "$TMP"/*.json >/dev/null 2>&1 || fail "génération MFM : aucun json produit"

# ── 3) comparaison avec le dump commité ─────────────────────────────────────
if [ -d "$DUMP_DIR" ] && diff -rq "$DUMP_DIR" "$TMP" >/dev/null 2>&1; then
  log "aucun changement (MFM identique au dump commité)."
  exit 0
fi

VERSION="$(python3 - "$TMP" <<'PY'
import json, sys, glob, os
vs = set()
for f in glob.glob(os.path.join(sys.argv[1], "*.json")):
    if os.path.basename(f).startswith("_"): continue
    try: v = json.load(open(f)).get("version")
    except Exception: continue
    if v: vs.add(str(v))
print("+".join(sorted(vs)) or "?")
PY
)"
NCH="$({ diff -rq "$DUMP_DIR" "$TMP" 2>/dev/null || true; } | wc -l | tr -d ' ')"
log "NOUVEAU MFM détecté (version ${VERSION}, ${NCH} fichier(s) modifié(s))."

# ── 4) copie + matrices + diff (best-effort) + commit + push ────────────────
mkdir -p "$DUMP_DIR"
rm -f "$DUMP_DIR"/*.json
cp "$TMP"/*.json "$DUMP_DIR/"

# Matrices et rapport : best-effort — même si la chaîne échoue (nouvelles
# unités inconnues, parser app absent…), le dump DOIT partir : c'est le canal
# de transmission vers l'agent d'intégration, qui saura régénérer le reste.
if node editor/mfm/build-map.mjs "$DUMP_DIR" >> "$LOG" 2>&1; then
  log "matrices régénérées."
else
  log "⚠ build-map a échoué — dump poussé seul, l'agent régénérera."
fi
if APPLY_OUT="$(node editor/mfm/apply.mjs "$DUMP_DIR" 2>>"$LOG")"; then
  {
    echo "# MFM — à renvoyer ($MFM_LANG, ${VERSION})"
    echo
    printf '%s\n' "$APPLY_OUT" | sed -n '/⚑ À ME RENVOYER/,/════ DRY-RUN/p' | sed '$d'
  } > "$REPORT"
  log "diff calculé — rapport A_RENVOYER.md mis à jour."
else
  log "⚠ apply (dry-run) a échoué — rapport non régénéré."
fi
# Audit DP / Force Disposition des détachements (trou v1.3 : apply ne couvre
# que les points) — best-effort, annexé au rapport.
if DPA_OUT="$(node editor/mfm/dp-audit.mjs "$DUMP_DIR" 2>>"$LOG")"; then
  { echo; echo "## Audit DP / Force Disposition"; echo; printf '%s\n' "$DPA_OUT"; } >> "$REPORT"
  log "audit DP/FD : OK."
else
  { echo; echo "## Audit DP / Force Disposition (ÉCARTS)"; echo; printf '%s\n' "${DPA_OUT:-<échec du script>}"; } >> "$REPORT"
  log "⚠ audit DP/FD : écarts détectés (ou échec) — voir A_RENVOYER.md."
fi
# Audit des surcoûts d'armes (« per <arme> », hors périmètre d'apply) —
# best-effort, annexé au rapport.
if WPA_OUT="$(node editor/mfm/wpn-audit.mjs "$DUMP_DIR" 2>>"$LOG")"; then
  { echo; echo "## Audit surcoûts d'armes"; echo; printf '%s\n' "$WPA_OUT"; } >> "$REPORT"
  log "audit surcoûts d'armes : OK."
else
  { echo; echo "## Audit surcoûts d'armes (ÉCARTS)"; echo; printf '%s\n' "${WPA_OUT:-<échec du script>}"; } >> "$REPORT"
  log "⚠ audit surcoûts d'armes : écarts détectés (ou échec) — voir A_RENVOYER.md."
fi

git add editor/mfm
if git diff --cached --quiet; then
  log "rien à committer après régénération (curieux) — abandon."
  exit 0
fi
git commit -q -m "MFM ${VERSION} : nouveau dump détecté (auto, cron horaire)

Dump ${MFM_LANG} + matrices nom↔id + rapport A_RENVOYER régénérés par
editor/mfm/cron-mfm.sh. L'intégration des points est prise en charge par
le versant cowork (COWORK_TASK.md), qui détecte ce push via le marqueur
state/integre.txt."

n=0; delay=2
until git push -u origin "$MFM_BRANCH" -q 2>> "$LOG"; do
  n=$((n+1)); [ "$n" -ge 4 ] && fail "push échoué après 4 tentatives."
  log "push échoué, nouvelle tentative dans ${delay}s…"; sleep "$delay"; delay=$((delay*2))
done
log "✓ poussé sur origin/${MFM_BRANCH} — le workflow mfm-cowork prend le relais."
