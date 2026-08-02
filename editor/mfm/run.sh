#!/usr/bin/env bash
# run.sh — orchestre l'intégration continue MFM en une commande :
#   0. GÉNÈRE les fichiers MFM depuis le site (mfm_parser.py) — sauf si un
#      dossier json existant est fourni
#   1. régénère les matrices nom↔id (build-map)
#   2. calcule le diff des points en dry-run (apply)
#   3. affiche un RÉSUMÉ : modifications auto-applicables + modifications
#      MANQUANTES à renvoyer (écrites aussi dans editor/mfm/A_RENVOYER.md)
#   4. propose de committer & pusher les modifications
#
# Usage :
#   editor/mfm/run.sh                     # génère le MFM (réseau) puis tout le reste
#   editor/mfm/run.sh --lang fr           # autre langue (défaut: en)
#   editor/mfm/run.sh <dir-json-mfm>      # utilise un dump existant (hors-ligne)
set -euo pipefail

# ── emplacements ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT="$SCRIPT_DIR/A_RENVOYER.md"

c_g="\033[32m"; c_y="\033[33m"; c_r="\033[31m"; c_b="\033[1m"; c_0="\033[0m"
say()  { printf "%b\n" "$*"; }
die()  { printf "%b\n" "${c_r}✗ $*${c_0}" >&2; exit 1; }

# ── arguments : [--lang XX] [dir-json-mfm] ──────────────────────────────────
LANG_MFM="en"; MFM_DIR="${MFM_DIR:-}"
while [ $# -gt 0 ]; do
  case "$1" in
    --lang) LANG_MFM="${2:?--lang attend une valeur}"; shift 2 ;;
    --lang=*) LANG_MFM="${1#--lang=}"; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) MFM_DIR="$1"; shift ;;
  esac
done

command -v node >/dev/null || die "node introuvable dans le PATH."
cd "$REPO"

# ── 0) génération des fichiers MFM (réseau) si aucun dossier fourni ──────────
if [ -z "$MFM_DIR" ]; then
  command -v python3 >/dev/null || die "python3 requis pour générer le MFM (ou fournis un dossier json existant)."
  python3 -c "import requests" 2>/dev/null || die "module python « requests » manquant — pip install requests, ou fournis un dump existant."
  MFM_DIR="$SCRIPT_DIR/dump/$LANG_MFM"
  say "${c_b}▸ 0/3  Génération du MFM (${LANG_MFM}) depuis warhammer-community…${c_0}"
  mkdir -p "$MFM_DIR"
  # mfm_parser.py all : écrit un <slug>.json par faction dans -o.
  python3 "$SCRIPT_DIR/mfm_parser.py" --lang "$LANG_MFM" all -o "$MFM_DIR" 2>&1 | sed 's/^/    /' \
    || die "échec de la génération MFM (réseau/proxy ?). Fournis un dump existant en argument."
  say "    ${c_g}✓ MFM généré : $(ls "$MFM_DIR"/*.json 2>/dev/null | wc -l) factions → ${MFM_DIR#$REPO/}${c_0}"
fi

[ -d "$MFM_DIR" ] || die "dossier MFM introuvable : $MFM_DIR"
ls "$MFM_DIR"/*.json >/dev/null 2>&1 || die "aucun <faction>.json dans $MFM_DIR"

# ── 1) matrices ─────────────────────────────────────────────────────────────
say "\n${c_b}▸ 1/3  Régénération des matrices nom↔id…${c_0}"
node editor/mfm/build-map.mjs "$MFM_DIR" | sed 's/^/    /'

# ── 2) dry-run (capturé) ────────────────────────────────────────────────────
say "\n${c_b}▸ 2/3  Diff des points (dry-run, aucune écriture)…${c_0}"
APPLY_OUT="$(node editor/mfm/apply.mjs "$MFM_DIR")"

# Bloc « à me renvoyer » → fichier + extraits.
{
  echo "# MFM — à renvoyer ($(basename "$MFM_DIR"))"
  echo
  printf '%s\n' "$APPLY_OUT" | sed -n '/⚑ À ME RENVOYER/,/════ DRY-RUN/p' | sed '$d'
} > "$REPORT"

AUTO="$(printf '%s\n' "$APPLY_OUT" | sed -n '/DELTAS AUTO-APPLICABLES/,/⚑ À ME RENVOYER/p' | sed '$d')"
STATLINE="$(printf '%s\n' "$APPLY_OUT" | grep -E 'Unités examinées:' || true)"
TORESEND="$(printf '%s\n' "$APPLY_OUT" | grep -oE 'À ME RENVOYER: [0-9]+' | grep -oE '[0-9]+' || echo 0)"

# ── 3) résumé ───────────────────────────────────────────────────────────────
say "\n${c_b}▸ 3/3  Résumé${c_0}"
say "\n${c_g}── Modifications auto-applicables (Phase 3) ──${c_0}"
printf '%s\n' "$AUTO" | sed 's/^/  /'
say "\n${c_y}── À M'ENVOYER (non traité automatiquement) : ${TORESEND} items ──${c_0}"
say "  Détail complet écrit dans : ${c_b}editor/mfm/A_RENVOYER.md${c_0}"
# En-têtes de catégorie (terminent par « [N] ») = ventilation par type d'action.
printf '%s\n' "$APPLY_OUT" | grep -E '\[[0-9]+\]$' | sed 's/^/  /' || true
say "\n  ${STATLINE}"

# ── état git ────────────────────────────────────────────────────────────────
# Modifications versionnées à committer : matrices + alias + rapport, ET tout
# fichier de données .cat/.gst modifié (si une écriture Phase 3 a eu lieu).
mapfile -t CHANGED < <(git status --porcelain -- editor/mfm '*.cat' '*.gst' | sed 's/^...//')
say "\n${c_b}── Fichiers modifiés (git) ──${c_0}"
if [ "${#CHANGED[@]}" -eq 0 ]; then
  say "  (aucun — bdd déjà alignée, rien à committer)"
  exit 0
fi
git status --short -- editor/mfm '*.cat' '*.gst' | sed 's/^/  /'

# ── proposition commit + push ───────────────────────────────────────────────
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
say ""
read -r -p "$(printf "${c_b}Committer & pusher ces modifications sur '%s' ? [o/N] ${c_0}" "$BRANCH")" ans
case "${ans:-}" in
  o|O|oui|y|Y|yes)
    git add editor/mfm
    # inclure les .cat/.gst modifiés (écritures Phase 3), le cas échéant
    git add -u -- '*.cat' '*.gst' 2>/dev/null || true
    MSG="MFM: intégration points $(basename "$MFM_DIR") — matrices + ${TORESEND} à traiter"
    git commit -q -m "$MSG"
    say "${c_g}✓ commit créé.${c_0}"
    n=0; delay=2
    until git push -u origin "$BRANCH"; do
      n=$((n+1)); [ "$n" -ge 4 ] && die "push échoué après 4 tentatives."
      say "${c_y}push échoué, nouvelle tentative dans ${delay}s…${c_0}"; sleep "$delay"; delay=$((delay*2))
    done
    say "${c_g}✓ poussé sur origin/${BRANCH}.${c_0}"
    ;;
  *)
    say "Annulé — rien n'a été committé. (Matrices régénérées, A_RENVOYER.md à jour.)"
    ;;
esac
