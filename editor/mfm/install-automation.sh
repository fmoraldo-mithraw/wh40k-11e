#!/usr/bin/env bash
# install-automation.sh — installe EN UNE COMMANDE l'automatisation MFM :
#
#   • un clone dédié des deux dépôts (données + app, l'app en lecture seule
#     pour la clôture d'import de build-map.mjs) ;
#   • une entrée crontab HORAIRE qui lance editor/mfm/cron-mfm.sh
#     (récupération du MFM, détection de nouveauté, push du dump/matrices) ;
#   • un premier passage immédiat pour valider la chaîne de bout en bout.
#
# Le versant « cowork » (l'agent Claude qui intègre les points quand un
# nouveau dump est poussé) est la tâche editor/mfm/COWORK_TASK.md, exécutée
# en cron par une session Claude/Cowork — aucune clef API, rien à installer
# côté serveur pour lui (voir « Lancer / relancer » dans COWORK_TASK.md).
#
# Usage (sur le serveur) — le clone initial EST le clone final, rien en /tmp.
# --filter=blob:none : clone « sans blobs » (~10× plus léger que les ~400 Mio
# du clone complet — l'historique des .cat pèse lourd et l'automatisation n'en
# a pas besoin ; git récupère les blobs à la demande) :
#   git clone --filter=blob:none git@github.com:fmoraldo-mithraw/wh40k-11e.git ~/wh40k-mfm/wh40k-11e \
#     && ~/wh40k-mfm/wh40k-11e/editor/mfm/install-automation.sh
#
# Options :
#   --dir <chemin>       racine d'installation   (défaut: ~/wh40k-mfm)
#   --lang <xx>          langue du MFM           (défaut: en)
#   --schedule "<cron>"  planification crontab   (défaut: minute aléatoire, toutes les heures)
#   --uninstall          retire l'entrée crontab et s'arrête
set -euo pipefail

c_g="\033[32m"; c_y="\033[33m"; c_r="\033[31m"; c_b="\033[1m"; c_0="\033[0m"
say() { printf "%b\n" "$*"; }
die() { printf "%b\n" "${c_r}✗ $*${c_0}" >&2; exit 1; }
ok()  { say "  ${c_g}✓${c_0} $*"; }
warn(){ say "  ${c_y}⚠${c_0} $*"; }

REPO_DATA_URL="${MFM_REPO_DATA:-git@github.com:fmoraldo-mithraw/wh40k-11e.git}"
REPO_APP_URL="${MFM_REPO_APP:-git@github.com:fmoraldo-mithraw/cogitator-bellicum.git}"
BASE_DIR="$HOME/wh40k-mfm"
MFM_LANG="en"
SCHEDULE=""
UNINSTALL=0
CRON_TAG="# wh40k-mfm-auto"

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)       BASE_DIR="${2:?}"; shift 2 ;;
    --lang)      MFM_LANG="${2:?}"; shift 2 ;;
    --schedule)  SCHEDULE="${2:?}"; shift 2 ;;
    --uninstall) UNINSTALL=1; shift ;;
    -h|--help)   sed -n '2,26p' "$0"; exit 0 ;;
    *) die "option inconnue : $1 (voir --help)" ;;
  esac
done

# ── désinstallation ─────────────────────────────────────────────────────────
if [ "$UNINSTALL" = 1 ]; then
  ( crontab -l 2>/dev/null | grep -vF "$CRON_TAG" ) | crontab - || true
  say "${c_g}✓ entrée crontab retirée.${c_0} (Le clone $BASE_DIR est conservé — supprime-le à la main si voulu.)"
  exit 0
fi

say "${c_b}▸ Installation de l'automatisation MFM${c_0}  (racine : $BASE_DIR)"

# ── 1) prérequis ────────────────────────────────────────────────────────────
say "\n${c_b}1/5  Prérequis${c_0}"
command -v git  >/dev/null || die "git est requis."
command -v crontab >/dev/null || die "crontab est requis (paquet cron/cronie)."
command -v node >/dev/null || die "node est requis (>= 18)."
NODE_MAJ="$(node -e 'console.log(process.versions.node.split(".")[0])')"
[ "$NODE_MAJ" -ge 18 ] || die "node >= 18 requis (trouvé : $(node -v))."
command -v python3 >/dev/null || die "python3 est requis."
if ! python3 -c 'import requests' 2>/dev/null; then
  warn "module python « requests » absent — tentative d'installation (--user)…"
  python3 -m pip install --user -q requests 2>/dev/null \
    || die "impossible d'installer requests ; fais-le à la main : python3 -m pip install --user requests"
fi
ok "git, crontab, node $(node -v), python3 + requests"

# ── 2) clones dédiés (données + app) ────────────────────────────────────────
say "\n${c_b}2/5  Clones dédiés${c_0}"
mkdir -p "$BASE_DIR"
DATA_DIR="$BASE_DIR/wh40k-11e"
APP_DIR="$BASE_DIR/cogitator-bellicum"
if [ -d "$DATA_DIR/.git" ]; then
  git -C "$DATA_DIR" fetch origin main -q && git -C "$DATA_DIR" reset -q --hard origin/main
  ok "wh40k-11e déjà cloné — synchronisé sur origin/main"
else
  # Clone sans blobs (léger) avec retries — le clone complet (~400 Mio
  # d'historique) casse facilement sur une liaison moyenne (early EOF).
  cloned=0
  for attempt in 1 2 3; do
    if git clone -q --filter=blob:none "$REPO_DATA_URL" "$DATA_DIR"; then cloned=1; break; fi
    rm -rf "$DATA_DIR"
    warn "clone interrompu (tentative $attempt/3) — nouvelle tentative dans $((attempt*5))s…"
    sleep $((attempt*5))
  done
  [ "$cloned" = 1 ] || git clone -q "$REPO_DATA_URL" "$DATA_DIR" \
    || die "clone de $REPO_DATA_URL impossible (auth ssh ? liaison ? réessaie : git clone --filter=blob:none $REPO_DATA_URL $DATA_DIR)"
  ok "wh40k-11e cloné (sans blobs historiques)"
fi
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin -q && ok "cogitator-bellicum déjà cloné — synchronisé"
else
  if git clone -q --depth 1 "$REPO_APP_URL" "$APP_DIR" || { sleep 5; git clone -q --depth 1 "$REPO_APP_URL" "$APP_DIR"; }; then
    ok "cogitator-bellicum cloné (lecture seule, pour la clôture d'import)"
  else
    warn "clone de cogitator-bellicum impossible — build-map sera dégradé (le dump partira quand même, l'agent régénérera les matrices)."
  fi
fi
# Identité git du bot (commits du cron) — reprend l'identité globale si présente.
git -C "$DATA_DIR" config user.name  >/dev/null 2>&1 || git -C "$DATA_DIR" config user.name  "MFM auto"
git -C "$DATA_DIR" config user.email >/dev/null 2>&1 || git -C "$DATA_DIR" config user.email "mfm-auto@$(hostname -s 2>/dev/null || echo serveur)"

# ── 3) droit de push ────────────────────────────────────────────────────────
say "\n${c_b}3/5  Droit de push sur origin/main${c_0}"
if git -C "$DATA_DIR" push --dry-run origin main >/dev/null 2>&1; then
  ok "push possible"
else
  warn "push --dry-run a échoué : le cron détectera les nouveaux MFM mais ne pourra PAS les pousser."
  warn "→ installe une clef ssh/deploy key avec écriture sur le dépôt, puis relance ce script."
fi

# ── 4) configuration + crontab ──────────────────────────────────────────────
say "\n${c_b}4/5  Configuration + crontab (horaire)${c_0}"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/wh40k-mfm"
mkdir -p "$STATE_DIR"
cat > "$STATE_DIR/config" <<EOF
# Écrit par install-automation.sh — lu par cron-mfm.sh
REPO_DIR="$DATA_DIR"
COGITATOR_DIR="$APP_DIR"
MFM_LANG="$MFM_LANG"
MFM_BRANCH="main"
EOF
CRON_SCRIPT="$DATA_DIR/editor/mfm/cron-mfm.sh"
chmod +x "$CRON_SCRIPT" "$DATA_DIR/editor/mfm/install-automation.sh" 2>/dev/null || true
[ -x "$CRON_SCRIPT" ] || die "cron-mfm.sh introuvable dans le clone ($CRON_SCRIPT)."
if [ -z "$SCHEDULE" ]; then
  SCHEDULE="$(( RANDOM % 60 )) * * * *"   # minute aléatoire : poli envers le site
fi
CRON_LINE="$SCHEDULE $CRON_SCRIPT >> $STATE_DIR/cron.log 2>&1 $CRON_TAG"
# « || true » : sur une machine sans crontab (ou crontab vide), crontab -l
# et/ou grep sortent en erreur — sous set -e/pipefail ça tuait le script ici.
( { crontab -l 2>/dev/null | grep -vF "$CRON_TAG"; } || true; echo "$CRON_LINE" ) | crontab -
ok "crontab installé : ${c_b}$SCHEDULE${c_0}  →  $CRON_SCRIPT"
ok "journal : $STATE_DIR/cron.log"

# ── 5) premier passage de validation ────────────────────────────────────────
say "\n${c_b}5/5  Premier passage (validation de bout en bout)…${c_0}"
if MFM_STATE_DIR="$STATE_DIR" "$CRON_SCRIPT"; then
  ok "chaîne validée — dernière ligne du journal :"
  tail -n 1 "$STATE_DIR/cron.log" | sed 's/^/      /'
else
  warn "le premier passage a échoué — voir $STATE_DIR/cron.log :"
  tail -n 3 "$STATE_DIR/cron.log" | sed 's/^/      /'
fi

say "
${c_g}${c_b}Installation terminée.${c_0}
  • Toutes les heures : récupération du MFM ; s'il est nouveau → dump +
    matrices + rapport poussés sur main.
  • Côté cowork, la session Claude en cron détecte ce push (marqueur
    state/integre.txt), applique les points et rend compte du résidu.

${c_y}Versant cowork${c_0} : dans une session Claude/Cowork, dis simplement
  « Planifie un cron horaire qui exécute editor/mfm/COWORK_TASK.md »
(les crons de session expirent au bout de 7 jours — même phrase pour relancer).

Commandes utiles :
  tail -f $STATE_DIR/cron.log            # suivre le cron
  $CRON_SCRIPT                            # forcer un passage
  $DATA_DIR/editor/mfm/install-automation.sh --uninstall   # retirer le cron"
