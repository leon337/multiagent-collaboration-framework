#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
VERIFY="$ROOT/tools/world-model/verify_readonly_stack_v051.sh"
TEST_TMP="$(mktemp -d /tmp/mcf-world-preflight-test.XXXXXX)"
trap 'rm -rf "$TEST_TMP"' EXIT

count_checkpoint_dirs() {
  find "$TEST_TMP" -mindepth 1 -maxdepth 1 -type d -name 'mcf-world-readonly-v051.*' | wc -l
}

before="$(count_checkpoint_dirs)"

set +e
TMPDIR="$TEST_TMP" MCF_WORLD_MIN_FREE_BYTES=999999999999999 "$VERIFY" >"$TEST_TMP/low-space.log" 2>&1
rc=$?
set -e
if [[ "$rc" -ne 3 ]]; then
  echo "FAIL: low-space preflight exit=$rc expected=3" >&2
  cat "$TEST_TMP/low-space.log" >&2
  exit 1
fi
grep -q "insufficient free space" "$TEST_TMP/low-space.log"
after_low="$(count_checkpoint_dirs)"
[[ "$before" == "$after_low" ]] || { echo "FAIL: checkpoint temp dir created before low-space abort" >&2; exit 1; }

set +e
TMPDIR="$TEST_TMP" MCF_WORLD_MIN_FREE_BYTES=not-a-number "$VERIFY" >"$TEST_TMP/invalid-threshold.log" 2>&1
rc=$?
set -e
if [[ "$rc" -ne 2 ]]; then
  echo "FAIL: invalid-threshold preflight exit=$rc expected=2" >&2
  cat "$TEST_TMP/invalid-threshold.log" >&2
  exit 1
fi
grep -q "must be a non-negative integer" "$TEST_TMP/invalid-threshold.log"
after_invalid="$(count_checkpoint_dirs)"
[[ "$before" == "$after_invalid" ]] || { echo "FAIL: checkpoint temp dir created before invalid-threshold abort" >&2; exit 1; }

echo "READONLY_CHECKPOINT_PREFLIGHT_TEST PASS"
