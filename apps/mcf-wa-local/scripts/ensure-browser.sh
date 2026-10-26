#!/usr/bin/env bash
# Keep the dedicated WhatsApp Web Brave profile available after login/reboot.
# This is NOT a generic desktop browser controller and never touches other profiles.
set -euo pipefail
export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-$HOME/.Xauthority}"
profile="$HOME/.config/mcf-wa-browser"
mkdir -p "$profile"
chmod 700 "$profile"

while true; do
  # Respect the existing authenticated Brave instance; do not open a second tab.
  if curl -fsS --connect-timeout 1 --max-time 3 http://127.0.0.1:9227/json/version >/dev/null 2>&1; then
    sleep 10
    continue
  fi
  if ! xprop -root >/dev/null 2>&1; then
    sleep 12
    continue
  fi
  /opt/brave.com/brave/brave \
    --user-data-dir="$profile" \
    --remote-debugging-address=127.0.0.1 \
    --remote-debugging-port=9227 \
    --no-first-run \
    --no-default-browser-check \
    --disable-background-mode \
    --new-window 'https://web.whatsapp.com/' >/dev/null 2>&1 &
  child=$!
  # Exit only when this dedicated browser exits; systemd handles shell teardown.
  wait "$child" || true
  sleep 12
done
