#!/usr/bin/env bash
# Rollback conservador; por padrão restaura o estado anterior a esta missão.
set -euo pipefail
MODE="--baseline"
if [[ $# -gt 0 ]];then MODE="$1";fi
RUN_DIR="$HOME/agent-sandbox/runs/MCF-CODEBUDDY-CONTROL-001"
if [[ "$MODE" == "--baseline" ]]; then
  RECEIPT="$RUN_DIR/backup-receipt.json"
  BEFORE_ENABLED="disabled"
  BEFORE_ACTIVE="inactive"
elif [[ "$MODE" == "--latest" ]]; then
  RECEIPT="$RUN_DIR/receipt-latest.json"
  BEFORE_ENABLED="$(python3 - "$RECEIPT" <<'PY'
import json,sys
print(json.load(open(sys.argv[1])).get('before_enabled','disabled'))
PY
)"
  BEFORE_ACTIVE="$(python3 - "$RECEIPT" <<'PY'
import json,sys
print(json.load(open(sys.argv[1])).get('before_active','inactive'))
PY
)"
else
  echo "Uso: rollback-local.sh [--baseline|--latest]" >&2
  exit 2
fi
test -f "$RECEIPT" || { echo "Recibo do backup indisponível: $RECEIPT" >&2; exit 1; }
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
test -S "$XDG_RUNTIME_DIR/bus"

if [[ "$BEFORE_ACTIVE" != active ]];then
  systemctl --user stop codebuddy-web.service || true
fi

python3 - "$RECEIPT" <<'PY'
import json,os,pathlib,shutil,sys
receipt=json.loads(pathlib.Path(sys.argv[1]).read_text())
home=pathlib.Path.home()
backup_root=(home/'.codebuddy/backups/mcf-codebuddy-control-001').resolve()
pairs=[(pathlib.Path(receipt['settings_backup']),home/'.codebuddy/settings.json'),
       (pathlib.Path(receipt['service_backup']),home/'.config/systemd/user/codebuddy-web.service')]
for src,dst in pairs:
    if not src.is_file() or not src.resolve().is_relative_to(backup_root):
        raise PermissionError("Backup inexistente ou fora do diretório autorizado")
for src,dst in pairs:shutil.copy2(src,dst)
os.chmod(home/'.codebuddy/settings.json',0o600)
print('CONFIGURACOES_RESTAURADAS')
PY
systemctl --user daemon-reload
if [[ "$BEFORE_ENABLED" == enabled ]];then
  systemctl --user enable codebuddy-web.service
else
  systemctl --user disable codebuddy-web.service
fi
if [[ "$BEFORE_ACTIVE" == active ]];then
  systemctl --user restart codebuddy-web.service
else
  systemctl --user stop codebuddy-web.service || true
fi
if [[ "$MODE" == "--baseline" ]];then
  TARGET="$HOME/agent-sandbox/bin/mcf-codebuddy"
  SOURCE="$(cd "$(dirname "$0")" && pwd)/mcf-codebuddy.py"
  if [[ -f "$TARGET" && -f "$SOURCE" ]] && cmp -s "$TARGET" "$SOURCE";then
    rm -f "$TARGET"
    echo 'WRAPPER_REVERTIDO'
  else
    echo 'Wrapper alterado/ausente; mantido para evitar perda de alterações'
  fi
fi
echo "MCF_CODEBUDDY_ROLLBACK_OK"
