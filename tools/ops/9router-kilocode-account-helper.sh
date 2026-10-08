#!/usr/bin/env bash
set -euo pipefail

# MCF v1.4.0 operational helper.
# One Kilo Code Gmail account at a time through 9Router native OAuth.
# Never asks for or prints passwords, access tokens, refresh tokens, API keys, or cookies.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
MCF_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ROUTER_HOME="${HOME}/.9router"
DB="$ROUTER_HOME/db/data.sqlite"
ROUTER_URL="${NINE_ROUTER_URL:-http://127.0.0.1:20128}"
PROVIDER_URL="$ROUTER_URL/dashboard/providers/kilocode"
MIN_ROUTER_VERSION="0.5.95"
POLL_SECONDS=2
TIMEOUT_SECONDS=600

version_ge() {
  [ "$1" = "$2" ] || [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
}

mask_email() {
  python3 - "$1" <<'PY'
import sys
e=sys.argv[1]
local,domain=e.split("@",1)
print(local[:2]+"***@"+domain)
PY
}

router_version() {
  9router --version 2>/dev/null | tr -d '[:space:]'
}

health_check() {
  curl -fsS --max-time 4 "$ROUTER_URL/api/health" >/dev/null 2>&1
}

ensure_round_robin_runtime() {
  local chunk="$HOME/.nvm/versions/node/v22.23.2/lib/node_modules/9router/app/.next-cli-build/server/chunks/4884.js"
  [ -f "$chunk" ] || { echo "✗ 9Router runtime bundle not found: $chunk"; return 1; }

  if grep -q '"lastUsedAt","errorCode","consecutiveUseCount"' "$chunk"; then
    echo "✓ 9Router round-robin persistence fix: already installed"
    return 0
  fi

  echo "• 9Router runtime lacks lastUsedAt persistence; repairing..."
  local backup="$ROUTER_HOME/db/backups/9router-chunk-4884-before-roundrobin-helper-$(date -u +%Y%m%dT%H%M%SZ).js"
  mkdir -p "$(dirname "$backup")"
  cp -a "$chunk" "$backup"

  python3 - "$chunk" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()
old = '"lastTested","lastError","lastErrorAt","rateLimitedUntil","expiresIn","errorCode","consecutiveUseCount","idToken","lastRefreshAt"'
new = '"lastTested","lastError","lastErrorAt","rateLimitedUntil","expiresIn","lastUsedAt","errorCode","consecutiveUseCount","idToken","lastRefreshAt"'
if old not in s:
    raise SystemExit("round-robin patch target not found")
p.write_text(s.replace(old, new, 1))
PY

  echo "✓ runtime repaired"
  echo "✓ runtime backup: $backup"

  if health_check; then
    echo "• Restarting the running 9Router so the repair takes effect..."
    local pids
    pids="$(fuser -t 20128/tcp 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      kill $pids 2>/dev/null || true
      sleep 2
    fi
  fi
}

ensure_server() {
  if health_check; then
    echo "✓ 9Router health: OK"
    return 0
  fi
  echo "• 9Router não responde em $ROUTER_URL; iniciando..."
  (
    cd "$HOME/.nvm/versions/node/v22.23.2/lib/node_modules/9router/app"
    exec env PORT=20128 HOSTNAME=127.0.0.1 node custom-server.js
  ) >/tmp/9router-mcf-helper.log 2>&1 </dev/null &
  local pid=$!
  for _ in $(seq 1 30); do
    if health_check; then
      echo "✓ 9Router iniciado (PID $pid)"
      return 0
    fi
    sleep 1
  done
  echo "✗ 9Router não ficou saudável. Log: /tmp/9router-mcf-helper.log" >&2
  return 1
}

backup_db() {
  local out="$ROUTER_HOME/db/backups/data.sqlite.before-kilocode-helper-$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$(dirname "$out")"
  python3 - "$DB" "$out" <<'PY'
import sqlite3,sys
src,dst=sys.argv[1:]
con=sqlite3.connect(src)
bak=sqlite3.connect(dst)
con.backup(bak)
bak.close(); con.close()
print(dst)
PY
}

ensure_round_robin() {
  python3 - "$DB" <<'PY'
import json,sqlite3,sys
db=sys.argv[1]
con=sqlite3.connect(db)
row=con.execute("SELECT id,data FROM settings ORDER BY id LIMIT 1").fetchone()
if not row:
    raise SystemExit("settings row missing")
sid,data=row
obj=json.loads(data)
ps=obj.get("providerStrategies") or {}
cur=ps.get("kilocode") or {}
desired={"fallbackStrategy":"round-robin","stickyRoundRobinLimit":3}
changed=(cur != desired)
if changed:
    ps["kilocode"]=desired
    obj["providerStrategies"]=ps
    con.execute("UPDATE settings SET data=? WHERE id=?", (json.dumps(obj,separators=(',',':')),sid))
    con.commit()
print("ROUTING_CHANGED="+("1" if changed else "0"))
print("KILO_STRATEGY="+str((obj.get("providerStrategies") or {}).get("kilocode",{}).get("fallbackStrategy")))
print("KILO_STICKY="+str((obj.get("providerStrategies") or {}).get("kilocode",{}).get("stickyRoundRobinLimit")))
con.close()
PY
}

connections_report() {
  python3 - "$DB" <<'PY'
import sqlite3,sys
con=sqlite3.connect(sys.argv[1])
rows=con.execute("""
SELECT email,isActive,priority
FROM providerConnections
WHERE lower(provider)='kilocode' AND lower(authType)='oauth'
ORDER BY priority,id
""").fetchall()
print("KILO_OAUTH_COUNT="+str(len(rows)))
for email,active,priority in rows:
    label=email or "(sem email)"
    if "@" in label:
        local,domain=label.split("@",1)
        label=local[:2]+"***@"+domain
    print(f" - {label} | active={bool(active)} | priority={priority}")
con.close()
PY
}

safe_account_state() {
  python3 - "$DB" "$1" <<'PY'
import json,sqlite3,sys
db,email=sys.argv[1:]
con=sqlite3.connect(db)
row=con.execute("""
SELECT isActive,data,priority
FROM providerConnections
WHERE lower(provider)='kilocode'
  AND lower(authType)='oauth'
  AND lower(email)=lower(?)
ORDER BY updatedAt DESC
LIMIT 1
""",(email,)).fetchone()
if not row:
    print("FOUND=0")
    raise SystemExit
active,data,priority=row
try: d=json.loads(data)
except Exception: d={}
print("FOUND=1")
print("ACTIVE="+str(bool(active)))
print("PRIORITY="+str(priority))
print("TEST_STATUS="+str(d.get("testStatus") or ""))
print("ERROR_CODE="+str(d.get("errorCode") or ""))
print("BACKOFF_LEVEL="+str(d.get("backoffLevel") if d.get("backoffLevel") is not None else ""))
con.close()
PY
}

validate_runtime() {
  echo "--- Diagnóstico seguro ---"
  command -v 9router >/dev/null || { echo "✗ 9Router não encontrado"; return 1; }
  local v; v="$(router_version)"
  echo "9Router version: $v"
  version_ge "$v" "$MIN_ROUTER_VERSION" || {
    echo "✗ exige 9Router >= $MIN_ROUTER_VERSION"; return 1; }
  [ -f "$DB" ] || { echo "✗ DB não encontrado: $DB"; return 1; }
  sqlite3 "$DB" "PRAGMA integrity_check;" | grep -qx 'ok' || {
    echo "✗ integridade SQLite falhou"; return 1; }
  ensure_round_robin_runtime
  ensure_server
  connections_report
  local strategy sticky
  strategy="$(sqlite3 "$DB" "SELECT json_extract(data,'$.providerStrategies.kilocode.fallbackStrategy') FROM settings LIMIT 1;")"
  sticky="$(sqlite3 "$DB" "SELECT json_extract(data,'$.providerStrategies.kilocode.stickyRoundRobinLimit') FROM settings LIMIT 1;")"
  echo "Kilo routing: strategy=${strategy:-<default>} sticky=${sticky:-<default>}"
}

self_test() {
  validate_runtime
  echo "✓ SELF-TEST PASS"
}

add_one() {
  validate_runtime
  echo
  read -r -p "Gmail da conta Kilo Code a adicionar: " email
  email="${email,,}"
  [[ "$email" =~ ^[^[:space:]@]+@(gmail\.com|googlemail\.com)$ ]] || {
    echo "✗ informe uma conta Gmail válida."; return 2; }

  local masked; masked="$(mask_email "$email")"
  local existing
  existing="$(python3 - "$DB" "$email" <<'PY'
import sqlite3,sys
con=sqlite3.connect(sys.argv[1])
print(con.execute("""
SELECT count(*) FROM providerConnections
WHERE lower(provider)='kilocode' AND lower(authType)='oauth' AND lower(email)=lower(?)
""",(sys.argv[2],)).fetchone()[0])
con.close()
PY
)"
  [ "$existing" -eq 0 ] || {
    echo "✗ $masked já está cadastrado."; safe_account_state "$email"; return 3; }

  local before backup
  before="$(sqlite3 "$DB" "SELECT count(*) FROM providerConnections WHERE lower(provider)='kilocode' AND lower(authType)='oauth';")"
  backup="$(backup_db)"
  echo "✓ backup: $backup"

  local routing
  routing="$(ensure_round_robin)"
  printf '%s\n' "$routing"

  if command -v xdg-open >/dev/null; then
    DISPLAY="${DISPLAY:-:0.0}" XAUTHORITY="${XAUTHORITY:-$HOME/.Xauthority}" \
      xdg-open "$PROVIDER_URL" >/dev/null 2>&1 || true
  fi

  echo
  echo "=== 1 conta por vez ==="
  echo "Conta-alvo: $masked"
  echo "No navegador: Kilo Code → Add Connection → OAuth."
  echo "Escolha a conta Google $masked e conclua o OAuth."
  echo "O terminal NÃO pede senha nem token."
  echo
  echo "Aguardando o 9Router registrar a nova conexão (até 10 min)..."

  local elapsed=0
  while [ "$elapsed" -lt "$TIMEOUT_SECONDS" ]; do
    local count; count="$(sqlite3 "$DB" "SELECT count(*) FROM providerConnections WHERE lower(provider)='kilocode' AND lower(authType)='oauth';")"
    if [ "$count" -gt "$before" ]; then
      local state; state="$(safe_account_state "$email")"
      printf '%s\n' "$state"
      local found active status error backoff
      found="$(printf '%s\n' "$state" | awk -F= '/^FOUND=/{print $2}')"
      active="$(printf '%s\n' "$state" | awk -F= '/^ACTIVE=/{print $2}')"
      status="$(printf '%s\n' "$state" | awk -F= '/^TEST_STATUS=/{print $2}')"
      error="$(printf '%s\n' "$state" | awk -F= '/^ERROR_CODE=/{print $2}')"
      backoff="$(printf '%s\n' "$state" | awk -F= '/^BACKOFF_LEVEL=/{print $2}')"
      if [ "$found" = "1" ] && [ "$active" = "True" ] && [ "$status" = "active" ] && [ -z "$error" ] && { [ -z "$backoff" ] || [ "$backoff" = "0" ]; }; then
        sqlite3 "$DB" "PRAGMA integrity_check;" | grep -qx 'ok' || {
          echo "✗ integridade SQLite falhou após inclusão"; return 1; }
        echo "✓ Conta adicionada e saudável: $masked"
        connections_report
        echo "✓ Kilo permanece em round-robin, sticky=3."
        echo "✓ ADD_ACCOUNT PASS"
        return 0
      fi
    fi
    sleep "$POLL_SECONDS"
    elapsed=$((elapsed+POLL_SECONDS))
  done

  echo "✗ timeout: nova conta não confirmada."
  echo "Backup: $backup"
  return 1
}

case "${1:---add-one}" in
  --self-test) self_test ;;
  --add-one) add_one ;;
  -h|--help)
    cat <<'TXT'
MCF / 9Router / Kilo Code — helper de contas Gmail

  --self-test   diagnostica 9Router + DB + Kilo + round-robin.
  --add-one     pede UMA conta Gmail, abre o Kilo no 9Router e espera o OAuth.

Regras:
  - uma conta por vez;
  - aceita somente Gmail/Googlemail;
  - senha, token e API key nunca são solicitados ou exibidos;
  - Kilo usa round-robin com sticky=3;
  - nenhum provider adapter é adicionado ao core do MCF.
TXT
    ;;
  *) echo "Uso: $0 [--self-test|--add-one]"; exit 2 ;;
esac
