#!/usr/bin/env bash
set -Eeuo pipefail

# Sanitized reference implementation for:
# MCF-DUAL-VPS-WORKSPACE-ONECLICK-001
#
# Required environment/config:
#   MCF_VPS_SSH_HOST      SSH config alias for the VPS
#   MCF_VPS_LOCAL_PORT    local RDP forward port (default 13389)
#   MCF_VPS_REMOTE_PORT   remote XRDP loopback port (default 3389)
#   MCF_VPS_MONITOR_1     monitor for Workspace 1 (default VGA-1)
#   MCF_VPS_MONITOR_2     monitor for Workspace 2 (default LVDS-1)
#   MCF_VPS_PROFILE_1     Remmina profile path
#   MCF_VPS_PROFILE_2     Remmina profile path
#
# The SSH config alias should define HostName/User/IdentityFile and a
# LocalForward matching the chosen local/remote ports. Do not put secrets here.

SSH_HOST="${MCF_VPS_SSH_HOST:?set MCF_VPS_SSH_HOST to an SSH config alias}"
LOCAL_PORT="${MCF_VPS_LOCAL_PORT:-13389}"
REMOTE_PORT="${MCF_VPS_REMOTE_PORT:-3389}"
MONITOR_1="${MCF_VPS_MONITOR_1:-VGA-1}"
MONITOR_2="${MCF_VPS_MONITOR_2:-LVDS-1}"
PROFILE_1="${MCF_VPS_PROFILE_1:?set MCF_VPS_PROFILE_1}"
PROFILE_2="${MCF_VPS_PROFILE_2:?set MCF_VPS_PROFILE_2}"
REMOTE_HELPER="${MCF_VPS_REMOTE_HELPER:-~/.local/bin/mcf-rdp-brave-newest-two}"
TITLE_1="${MCF_VPS_TITLE_1:-VPS Workspace 1}"
TITLE_2="${MCF_VPS_TITLE_2:-VPS Workspace 2}"
APP_ID_1="${MCF_VPS_APP_ID_1:-org.remmina.Remmina.mcfworkspace1}"
APP_ID_2="${MCF_VPS_APP_ID_2:-org.remmina.Remmina.mcfworkspace2}"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/mcf-dual-vps"
mkdir -p "$STATE"
LOG="$STATE/launcher.log"
exec > >(tee -a "$LOG") 2>&1

log(){ printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }
fail(){ log "FAIL $*"; exit 1; }

exec 9>"$STATE/launcher.lock"
flock -n 9 || { log 'REUSE launcher_already_running'; exit 0; }

for cmd in xrandr wmctrl remmina ssh ssh-add ss flock; do
  command -v "$cmd" >/dev/null || fail "missing_command=$cmd"
done

export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-$HOME/.Xauthority}"

monitor_geometry(){
  xrandr --query | awk -v out="$1" '$1==out && $2=="connected" {
    for(i=1;i<=NF;i++) if($i ~ /^[0-9]+x[0-9]+\+[0-9]+\+[0-9]+$/){print $i; exit}
  }'
}
parse_geometry(){ sed -E 's/^([0-9]+)x([0-9]+)\+([0-9]+)\+([0-9]+)$/\1 \2 \3 \4/' <<<"$1"; }

G1="$(monitor_geometry "$MONITOR_1")"
G2="$(monitor_geometry "$MONITOR_2")"
[ -n "$G1" ] || fail "$MONITOR_1 not_connected"
[ -n "$G2" ] || fail "$MONITOR_2 not_connected"
read -r W1 H1 X1 Y1 <<<"$(parse_geometry "$G1")"
read -r W2 H2 X2 Y2 <<<"$(parse_geometry "$G2")"
log "PASS monitors $MONITOR_1=$G1 $MONITOR_2=$G2"

# Reuse a live agent. If none exists, start a session-local one and ask the
# human for the key passphrase through ssh-add. The passphrase is never stored.
AGENT=""
for candidate in "${SSH_AUTH_SOCK:-}" "${XDG_RUNTIME_DIR:-/run/user/$UID}/mcf-vps-ssh-agent.sock"; do
  [ -n "$candidate" ] || continue
  if [ -S "$candidate" ] && SSH_AUTH_SOCK="$candidate" ssh-add -l >/dev/null 2>&1; then
    AGENT="$candidate"; break
  fi
done
if [ -z "$AGENT" ]; then
  AGENT="${XDG_RUNTIME_DIR:-/run/user/$UID}/mcf-vps-ssh-agent.sock"
  rm -f "$AGENT"
  eval "$(ssh-agent -a "$AGENT" -s)" >/dev/null
  export SSH_AUTH_SOCK="$AGENT"
  log 'AUTH ssh-add_required'
  ssh-add || fail 'ssh_key_not_loaded'
else
  export SSH_AUTH_SOCK="$AGENT"
  log 'REUSE ssh_agent'
fi

if ss -ltnp 2>/dev/null | grep -q "127.0.0.1:$LOCAL_PORT"; then
  ss -ltnp 2>/dev/null | grep "127.0.0.1:$LOCAL_PORT" | grep -q 'ssh' || fail "port_${LOCAL_PORT}_owned_by_non_ssh"
  log "REUSE tunnel=127.0.0.1:$LOCAL_PORT"
else
  log "START tunnel=127.0.0.1:$LOCAL_PORT"
  ssh -fN -o IdentityAgent="$AGENT" "$SSH_HOST" || fail 'ssh_tunnel_start_failed'
  for _ in $(seq 1 20); do
    ss -ltn 2>/dev/null | grep -q "127.0.0.1:$LOCAL_PORT" && break
    sleep .5
  done
  ss -ltn 2>/dev/null | grep -q "127.0.0.1:$LOCAL_PORT" || fail 'ssh_tunnel_not_listening'
fi

POLICY="$(ssh -o IdentityAgent="$AGENT" -o ClearAllForwardings=yes -o ConnectTimeout=8 "$SSH_HOST" "grep -E '^Policy=' /etc/xrdp/sesman.ini 2>/dev/null" || true)"
[ "$POLICY" = 'Policy=UBC' ] || fail "xrdp_policy_unexpected=${POLICY:-unreadable}"
log 'PASS xrdp_policy=UBC'

ensure_window(){
  local app_id="$1" title="$2" profile="$3"
  if wmctrl -l | grep -Fq "$title"; then
    log "REUSE window=$title"
  else
    log "START window=$title"
    remmina --gapplication-app-id "$app_id" -c "$profile" >"$STATE/${app_id##*.}.log" 2>&1 &
  fi
  for _ in $(seq 1 60); do
    wmctrl -l | grep -Fq "$title" && return 0
    sleep .5
  done
  fail "window_timeout=$title"
}

layout_window(){
  local title="$1" x="$2" y="$3" w="$4" h="$5"
  wmctrl -r "$title" -b remove,fullscreen,maximized_vert,maximized_horz 2>/dev/null || true
  sleep .2
  wmctrl -r "$title" -e "0,$x,$y,$w,$h" || fail "move_failed=$title"
  sleep .3
  wmctrl -r "$title" -b add,fullscreen 2>/dev/null || true
}

ensure_window "$APP_ID_1" "$TITLE_1" "$PROFILE_1"
ensure_window "$APP_ID_2" "$TITLE_2" "$PROFILE_2"
layout_window "$TITLE_1" "$X1" "$Y1" "$W1" "$H1"
layout_window "$TITLE_2" "$X2" "$Y2" "$W2" "$H2"

BRAVE_RESULT="$(ssh -o IdentityAgent="$AGENT" -o ClearAllForwardings=yes "$SSH_HOST" "$REMOTE_HELPER" 2>&1)" || fail "remote_brave_helper_failed: $BRAVE_RESULT"
printf '%s\n' "$BRAVE_RESULT"

log 'READY dual_vps_workspace'
