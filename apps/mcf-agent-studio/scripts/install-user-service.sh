#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYMLINK="${HOME}/.local/share/mcf-agent-studio"
SERVICE_DIR="${HOME}/.config/systemd/user"
mkdir -p "$(dirname "$SYMLINK")" "$SERVICE_DIR"
if [[ ! -e "$SYMLINK" && ! -L "$SYMLINK" ]]; then
  ln -s "$APP_DIR" "$SYMLINK"
fi
if [[ "$(readlink -f "$SYMLINK")" != "$APP_DIR" ]]; then
  echo "Caminho $SYMLINK ja aponta para outro projeto; nao sobrescrito." >&2
  exit 1
fi
# systemd's WorkingDirectory needs a space-free literal path; use the symlink.
cat > "${SERVICE_DIR}/mcf-agent-studio.service" <<'UNIT'
[Unit]
Description=MCF Agent Studio (localhost)
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/.local/share/mcf-agent-studio
ExecStart=/usr/bin/node %h/.local/share/mcf-agent-studio/server.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
UMask=0077
Environment=AGENT_STUDIO_PORT=4317

[Install]
WantedBy=default.target
UNIT
systemctl --user daemon-reload
systemctl --user enable --now mcf-agent-studio.service
systemctl --user is-active mcf-agent-studio.service
curl --fail --silent --max-time 5 http://127.0.0.1:4317/health
printf '\n'
