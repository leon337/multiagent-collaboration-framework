#!/usr/bin/env bash
set -Eeuo pipefail

# Remote user-space helper for MCF dual-workspace field pattern.
# It opens/reuses one Brave user-data-dir for each of the two most recent
# XRDP Xorg displays. It does not use sudo and does not kill stale sessions.

log(){ printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }

BRAVE="${MCF_BRAVE_BIN:-$(command -v brave-browser || command -v brave || true)}"
[ -n "$BRAVE" ] || { log 'FAIL brave_not_found'; exit 20; }

# Xorg processes are sorted by elapsed time ascending: the two smallest values
# are the two newest sessions. This is intentionally conservative and safe for
# the validated two-client workflow. See the runbook's known limitation.
mapfile -t DISPLAYS < <(
  ps -u "$USER" -o etimes=,args= |
    awk '/\/usr\/lib\/xorg\/Xorg :[0-9]+ / {
      for(i=1;i<=NF;i++) if($i ~ /^:[0-9]+$/){print $1, $i}
    }' |
    sort -n |
    awk '!seen[$2]++ {print $2}' |
    head -n 2
)

[ "${#DISPLAYS[@]}" -eq 2 ] || {
  log "FAIL expected_two_recent_xrdp_displays found=${#DISPLAYS[@]}"
  exit 21
}

for display in "${DISPLAYS[@]}"; do
  tag="${display#:}"
  profile="${MCF_BRAVE_PROFILE_ROOT:-$HOME/.config/BraveSoftware}/MCF-RDP-$tag"

  if pgrep -u "$USER" -af -- "--user-data-dir=$profile" >/dev/null 2>&1; then
    log "REUSE brave display=$display profile=$profile"
    continue
  fi

  session_pid=""
  for pid in $(pgrep -u "$USER" xfce4-session || true); do
    process_display="$(tr '\0' '\n' <"/proc/$pid/environ" 2>/dev/null | sed -n 's/^DISPLAY=//p' | head -n1)"
    if [ "${process_display%%.*}" = "$display" ]; then
      session_pid="$pid"
      break
    fi
  done

  [ -n "$session_pid" ] || {
    log "FAIL no_xfce_session display=$display"
    exit 22
  }

  env_value(){
    tr '\0' '\n' <"/proc/$session_pid/environ" 2>/dev/null | sed -n "s/^$1=//p" | head -n1
  }

  full_display="$(env_value DISPLAY)"
  xauthority="$(env_value XAUTHORITY)"
  dbus="$(env_value DBUS_SESSION_BUS_ADDRESS)"
  xdg_runtime="$(env_value XDG_RUNTIME_DIR)"

  mkdir -p "$profile" "${XDG_STATE_HOME:-$HOME/.local/state}/mcf-dual-vps"
  browser_log="${XDG_STATE_HOME:-$HOME/.local/state}/mcf-dual-vps/brave-$tag.log"

  DISPLAY="$full_display" \
  XAUTHORITY="${xauthority:-$HOME/.Xauthority}" \
  DBUS_SESSION_BUS_ADDRESS="$dbus" \
  XDG_RUNTIME_DIR="$xdg_runtime" \
    nohup "$BRAVE" \
      --user-data-dir="$profile" \
      --no-default-browser-check \
      --new-window about:blank \
      >"$browser_log" 2>&1 &

  log "START brave display=$display profile=$profile"
done

printf 'DISPLAYS=%s,%s\n' "${DISPLAYS[0]}" "${DISPLAYS[1]}"
