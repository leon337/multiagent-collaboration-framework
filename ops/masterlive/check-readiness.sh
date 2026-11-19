#!/usr/bin/env bash
# Read-only checks: never start/stop services, change VPN config or print secrets.
set -u
STAGE_URL="${MCF_MASTERLIVE_STAGE_URL:-http://127.0.0.1:3102}"
PROD_URL="${MCF_MASTERLIVE_PROD_URL:-http://127.0.0.1:3099}"
STAGE_SERVICE="${MCF_MASTERLIVE_STAGE_SERVICE:-mcf-masterlive-stage.service}"
status=0
probe() {
  local label="$1" url="$2" code
  code="$(curl --fail --silent --show-error --max-time 7 --output /dev/null --write-out '%{http_code}' "$url/health")" || code=000
  printf '%s HTTP=%s\n' "$label" "$code"
  if [[ "$code" != 200 ]]; then status=1; fi
}
probe STAGING "$STAGE_URL"
probe OPERATIONAL "$PROD_URL"
if command -v systemctl >/dev/null 2>&1; then
  state="$(systemctl --user is-active "$STAGE_SERVICE" 2>/dev/null || true)"
  enabled="$(systemctl --user is-enabled "$STAGE_SERVICE" 2>/dev/null || true)"
  printf 'STAGE_SERVICE active=%s enabled=%s\n' "$state" "$enabled"
  if [[ "$state" != active || "$enabled" != enabled ]]; then status=1; fi
fi
if command -v tailscale >/dev/null 2>&1; then
  if tailscale status --json >/dev/null 2>&1; then echo 'TAILSCALE reachable=yes'; else echo 'TAILSCALE reachable=no'; status=1; fi
fi
exit "$status"
