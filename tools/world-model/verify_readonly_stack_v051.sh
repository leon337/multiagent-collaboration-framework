#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
TOOLS="$ROOT/tools/world-model"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

MISSION="$ROOT/context/missions/mcf-world-projection-001.json"
PROJECT="$ROOT/context/projects/multiagent-collaboration-framework.yaml"
SNAPSHOT="$ROOT/docs/evidence/MCF-WORLD-REAL-PROVIDER-SNAPSHOT-20260926T094030Z.json"
OWNERSHIP="$ROOT/docs/contracts/MCF-WORLD-REAL-SOURCE-OWNERSHIP-v0.1.json"
ANCHOR_META="$ROOT/docs/examples/MCF-WORLD-EVIDENCE-ANCHORS-v0.1.json"
BASE="$TMP/operational-base.json"
ADAPTER_OUT="$TMP/adapter"

echo "MCF WORLD READ-ONLY STACK v0.5.1"
echo "root=$ROOT"
echo "head=$(git -C "$ROOT" rev-parse HEAD)"

echo "[1/12] model contract"
python3 "$TOOLS/verify_contract.py"
node "$TOOLS/verify_schema.js"

echo "[2/12] core adapter"
python3 "$TOOLS/test_adapter_v01.py"
python3 "$TOOLS/prove_rebuild_v01.py"

echo "[3/12] generated adapter schema"
python3 "$TOOLS/adapter_v01.py" \
  --revision "$(git -C "$ROOT" rev-parse HEAD)" \
  --generated-at "2026-09-26T13:00:00Z" \
  --output-dir "$ADAPTER_OUT"
node "$TOOLS/verify_adapter_output.js" "$ADAPTER_OUT"

echo "[4/12] context consumer v0.1"
python3 "$TOOLS/test_consumer_v01.py"

echo "[5/12] context consumer v0.2"
python3 "$TOOLS/test_consumer_v02.py"

echo "[6/12] full architecture pipeline"
python3 "$TOOLS/test_full_pipeline_v01.py"

echo "[7/12] real-source adapter"
python3 "$TOOLS/test_real_source_adapter_v01.py"

echo "[8/12] prepare operational base"
python3 "$TOOLS/real_source_adapter_v01.py" \
  --mission-file "$MISSION" \
  --project-registry "$PROJECT" \
  --provider-snapshot "$SNAPSHOT" \
  --ownership "$OWNERSHIP" \
  --evaluation-time "2026-09-26T09:44:30Z" \
  --output "$BASE"

echo "[9/12] operational context"
MCF_WORLD_OPERATIONAL_BASE="$BASE" python3 "$TOOLS/test_operational_context_v01.py"

echo "[10/12] evidence navigation + source preview"
python3 "$TOOLS/test_context_navigation_v03.py"
python3 "$TOOLS/test_source_preview_v04.py"

echo "[11/12] explicit evidence anchor + hardening"
python3 "$TOOLS/test_evidence_anchor_v05.py"
node "$TOOLS/verify_anchor_metadata.js" "$ANCHOR_META"

echo "[12/12] invariant grep"
if grep -R -nE 'fetch\(|XMLHttpRequest|new WebSocket|localStorage' \
  "$TOOLS/context_consumer_v03.py" \
  "$TOOLS/context_consumer_v04.py" \
  "$TOOLS/context_consumer_v05.py"; then
  echo "FAIL: forbidden client persistence/network primitive found" >&2
  exit 1
fi

echo "READONLY_STACK_V051 PASS"
echo "functional_expansion=HOLD_PENDING_HUMAN_VALIDATION"
