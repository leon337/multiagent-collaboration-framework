#!/usr/bin/env bash
# MCF ORACLE portable Linux bootstrap — no secrets, no paid AI API.
# Run from a trusted checkout of this repository. Never copy ~/.codex.
set -euo pipefail
umask 077

usage() {
  printf 'Usage: %s [--staging-only | --check | --install]\n' "$0"
  printf '  --staging-only  Stage bridge and schemas without npm or OAuth (CI safe).\n'
  printf '  --check         Verify staged assets, Python and Codex CLI status (read-only).\n'
  printf '  --install       Stage bridge, install official Codex CLI if absent (OAuth separate).\n'
}

mode="${1:---check}"
case "$mode" in
  --staging-only|--check|--install) ;;
  *) usage; exit 2 ;;
esac

if [[ -z "${HOME:-}" || ! -d "$HOME" ]]; then
  printf '%s\n' 'ERROR: valid HOME required' >&2
  exit 2
fi
if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' 'ERROR: Python 3 required' >&2
  exit 2
fi
if [[ "${OPENAI_API_KEY+x}" == x ]]; then
  printf '%s\n' 'WARNING: OPENAI_API_KEY present in parent environment; bridge strips it from Codex child.' >&2
fi

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
destination="$HOME/.local/share/mcf-oracle-bridge"
state="$HOME/.local/state/mcf-oracle-bridge"
required=(
  'tools/oracle-bridge/oracle_bridge.py'
  'tools/oracle-bridge/test_oracle_bridge.py'
  'schemas/mcf-oracle-request.v1.schema.json'
  'schemas/mcf-oracle-decision.v1.schema.json'
)

if [[ "$mode" == --staging-only || "$mode" == --install ]]; then
  mkdir -p -- "$destination/tools/oracle-bridge" "$destination/schemas" "$state" "$HOME/.local/bin"
  chmod 0700 "$state"
  for relative in "${required[@]}"; do
    if [[ ! -f "$repo_root/$relative" ]]; then
      printf 'ERROR: missing tracked file %s\n' "$relative" >&2
      exit 2
    fi
    install -m 0600 -- "$repo_root/$relative" "$destination/$relative"
  done
fi

for relative in "${required[@]}"; do
  if [[ ! -f "$destination/$relative" ]]; then
    printf 'ERROR: bridge asset not installed: %s\n' "$relative" >&2
    exit 2
  fi
done
python3 -m py_compile "$destination/tools/oracle-bridge/oracle_bridge.py"
python3 - <<'PY'
import json, pathlib
p=pathlib.Path.home()/'.local/share/mcf-oracle-bridge/schemas'
for name in ('mcf-oracle-request.v1.schema.json','mcf-oracle-decision.v1.schema.json'):
    v=json.loads((p/name).read_text(encoding='utf8'))
    assert v.get('type')=='object' and v.get('additionalProperties') is False
print('MCF_ORACLE_SCHEMA_PRECHECK=PASS')
PY

if [[ "$mode" == --install ]]; then
  cli="$HOME/.local/bin/codex"
  if [[ ! -x "$cli" ]]; then
    if ! command -v npm >/dev/null 2>&1; then
      printf '%s\n' 'ERROR: npm required to install Codex CLI' >&2
      exit 2
    fi
    npm install --global --prefix "$HOME/.local" --no-audit --no-fund @openai/codex@0.163.0
  fi
fi

cli="$HOME/.local/bin/codex"
if [[ -x "$cli" ]]; then
  "$cli" --version
  if "$cli" login status 2>&1 | grep -q 'Logged in using ChatGPT'; then
    printf 'MCF_ORACLE_CODEX_CHATGPT_AUTH=CONFIRMED\n'
  else
    printf 'MCF_ORACLE_CODEX_CHATGPT_AUTH=REQUIRES_USER_LOGIN\n'
  fi
else
  printf 'MCF_ORACLE_CODEX_INSTALLED=NO\n'
fi
printf 'MCF_ORACLE_BRIDGE_STAGE=PASS\n'
