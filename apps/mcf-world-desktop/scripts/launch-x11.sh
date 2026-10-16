#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="$ROOT/.runtime"
LOG="$RUNTIME/mcf-world.log"
PIDFILE="$RUNTIME/launcher.pid"
mkdir -p "$RUNTIME"
export DISPLAY=:0
export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
NODE22_BIN=/home/leo/.nvm/versions/node/v22.23.2/bin
if [[ -x "$NODE22_BIN/node" ]]; then export PATH="$NODE22_BIN:$PATH"; fi
cd "$ROOT"
if [[ -f "$PIDFILE" ]]; then
  old_pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "MCF World 3D already running launcher_pid=$old_pid"
    exit 0
  fi
fi
nohup npm start >> "$LOG" 2>&1 < /dev/null &
echo $! > "$PIDFILE"
echo "MCF World 3D launch requested launcher_pid=$! log=$LOG"
