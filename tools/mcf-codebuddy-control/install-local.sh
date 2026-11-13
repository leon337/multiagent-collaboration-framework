#!/usr/bin/env bash
# Instalação idempotente e governada da bridge local CodeBuddy para o MCF.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UNIT="$HOME/.config/systemd/user/codebuddy-web.service"
SETTINGS="$HOME/.codebuddy/settings.json"
TARGET="$HOME/agent-sandbox/bin/mcf-codebuddy"
RUN_DIR="$HOME/agent-sandbox/runs/MCF-CODEBUDDY-CONTROL-001"
BACKUP_DIR="$HOME/.codebuddy/backups/mcf-codebuddy-control-001"
REPO="$HOME/multiagent-collaboration-framework"

test -f "$UNIT" || { echo "ERRO: unidade do CodeBuddy não existe" >&2; exit 1; }
test -f "$SETTINGS" || { echo "ERRO: configuração CodeBuddy não existe" >&2; exit 1; }
test -d "$REPO" || { echo "ERRO: repositório do MCF não existe" >&2; exit 1; }
test -x "$HOME/.nvm/versions/node/v22.23.2/bin/codebuddy" || {
  echo "ERRO: CodeBuddy CLI esperado não instalado" >&2; exit 1;
}
mkdir -p "$BACKUP_DIR" "$RUN_DIR" "$(dirname "$TARGET")"
chmod 700 "$BACKUP_DIR" "$RUN_DIR"

export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
test -S "$XDG_RUNTIME_DIR/bus" || {
  echo "ERRO: sessão systemd --user indisponível" >&2; exit 1;
}
BEFORE_ENABLED="$(systemctl --user is-enabled codebuddy-web.service || true)"
BEFORE_ACTIVE="$(systemctl --user is-active codebuddy-web.service || true)"
STAMP="$(date +%Y%m%dT%H%M%S)"
B_SETTINGS="$BACKUP_DIR/settings.json.$STAMP.bak"
B_UNIT="$BACKUP_DIR/codebuddy-web.service.$STAMP.bak"
cp -p "$SETTINGS" "$B_SETTINGS"
cp -p "$UNIT" "$B_UNIT"
chmod 600 "$B_SETTINGS" "$B_UNIT"

python3 - <<'PY'
import json, os, tempfile
from pathlib import Path
home=Path.home()
settings=home/'.codebuddy/settings.json'
unit=home/'.config/systemd/user/codebuddy-web.service'
repo=home/'multiagent-collaboration-framework'
config=json.loads(settings.read_text())
gateway=config.get('gateway',{})
if gateway.get('auth')!='password' or not gateway.get('password'):
    raise RuntimeError('Recusado: falta senha configurada do CodeBuddy')
trusted=config.get('trustedDirectories',[])
stale='/home/leo/Documentos/GitHub/multiagent-collaboration-framework'
new=[]
for x in trusted:
    fixed=str(repo) if x==stale else x
    if fixed not in new: new.append(fixed)
if str(repo) not in new: new.append(str(repo))
config['trustedDirectories']=new
source=unit.read_text()
if '--host 127.0.0.1 --port 46514' not in source:
    raise RuntimeError('Recusado: bind/porta inesperados no serviço existente')
patched=source.replace('--auth none','--auth password')
if '--auth password' not in patched: raise RuntimeError('Autenticação ausente')
if '--model fast-model' not in patched:
    patched=patched.replace('--agent cli --permission-mode default',
                            '--agent cli --model fast-model --permission-mode default')
if '--model fast-model' not in patched: raise RuntimeError('Modelo não fixado')
if 'Environment=CODEBUDDY_FORCE_HEADLESS_BUNDLE=1' not in patched:
    patched=patched.replace('[Service]\n','[Service]\nEnvironment=CODEBUDDY_FORCE_HEADLESS_BUNDLE=1\n',1)
def write_atomic(path, data, mode):
    with tempfile.NamedTemporaryFile(mode='w',dir=path.parent,delete=False) as t:
        name=t.name;t.write(data);t.flush();os.fsync(t.fileno())
    os.chmod(name,mode);os.replace(name,path)
write_atomic(settings,json.dumps(config,ensure_ascii=False,indent=2)+'\n',0o600)
write_atomic(unit,patched,0o644)
PY

install -m 755 "$SCRIPT_DIR/mcf-codebuddy.py" "$TARGET"
python3 - "$RUN_DIR/receipt-latest.json" "$B_SETTINGS" "$B_UNIT" "$BEFORE_ENABLED" "$BEFORE_ACTIVE" "$TARGET" <<'PY'
import json,sys,pathlib,os
p=pathlib.Path(sys.argv[1])
data={"settings_backup":sys.argv[2],"service_backup":sys.argv[3],
      "before_enabled":sys.argv[4],"before_active":sys.argv[5],
      "installed_binary":sys.argv[6], "service":"codebuddy-web.service"}
p.write_text(json.dumps(data,indent=2)+'\n')
os.chmod(p,0o600)
PY
systemctl --user daemon-reload
systemctl --user enable --now codebuddy-web.service
systemctl --user restart codebuddy-web.service
for attempt in $(seq 1 25); do
  if "$TARGET" doctor >"$RUN_DIR/doctor-last.json"; then
    cat "$RUN_DIR/doctor-last.json"
    echo "MCF_CODEBUDDY_INSTALL_OK"
    exit 0
  fi
  sleep 1
done
cat "$RUN_DIR/doctor-last.json" >&2
echo "ERRO: gateway não ficou pronto após o restart" >&2
exit 1
