#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
VERIFY="$ROOT/tools/world-model/verify_readonly_stack_v051.sh"
TEST_TMP="$(mktemp -d /tmp/mcf-world-preflight-test.XXXXXX)"
trap 'chmod -R u+rwx "$TEST_TMP" 2>/dev/null || true; rm -rf "$TEST_TMP"' EXIT

count_checkpoint_dirs() {
  find "$TEST_TMP" -mindepth 1 -maxdepth 2 -type d -name 'mcf-world-readonly-v051.*' | wc -l
}

assert_no_workspace() {
  local label="$1"
  local count
  count="$(count_checkpoint_dirs)"
  [[ "$count" -eq 0 ]] || {
    echo "FAIL: checkpoint temp dir created before $label abort" >&2
    find "$TEST_TMP" -mindepth 1 -maxdepth 2 -type d -name 'mcf-world-readonly-v051.*' >&2
    exit 1
  }
}

run_expect() {
  local expected="$1"
  local pattern="$2"
  local logfile="$3"
  shift 3
  set +e
  "$@" >"$logfile" 2>&1
  local rc=$?
  set -e
  if [[ "$rc" -ne "$expected" ]]; then
    echo "FAIL: expected exit=$expected got=$rc" >&2
    cat "$logfile" >&2
    exit 1
  fi
  grep -q "$pattern" "$logfile"
}

run_expect 3 "insufficient free space" "$TEST_TMP/low-space.log"   env TMPDIR="$TEST_TMP" MCF_WORLD_MIN_FREE_BYTES=999999999999999 "$VERIFY"
assert_no_workspace "low-space"

run_expect 2 "MCF_WORLD_MIN_FREE_BYTES must be a non-negative integer" "$TEST_TMP/invalid-bytes.log"   env TMPDIR="$TEST_TMP" MCF_WORLD_MIN_FREE_BYTES=not-a-number "$VERIFY"
assert_no_workspace "invalid-bytes-threshold"

run_expect 2 "MCF_WORLD_MIN_FREE_INODES must be a non-negative integer" "$TEST_TMP/invalid-inodes.log"   env TMPDIR="$TEST_TMP" MCF_WORLD_MIN_FREE_INODES=not-a-number "$VERIFY"
assert_no_workspace "invalid-inodes-threshold"

run_expect 4 "insufficient free inodes" "$TEST_TMP/low-inodes.log"   env TMPDIR="$TEST_TMP" MCF_WORLD_MIN_FREE_BYTES=0 MCF_WORLD_MIN_FREE_INODES=999999999999999 "$VERIFY"
assert_no_workspace "low-inodes"

touch "$TEST_TMP/not-a-directory"
run_expect 2 "temporary parent is not a directory" "$TEST_TMP/not-directory.log"   env TMPDIR="$TEST_TMP/not-a-directory" "$VERIFY"
assert_no_workspace "not-directory"

mkdir "$TEST_TMP/not-writable"
chmod 500 "$TEST_TMP/not-writable"
run_expect 2 "temporary parent is not writable/searchable" "$TEST_TMP/not-writable.log"   env TMPDIR="$TEST_TMP/not-writable" "$VERIFY"
chmod 700 "$TEST_TMP/not-writable"
assert_no_workspace "not-writable"

echo "READONLY_CHECKPOINT_PREFLIGHT_TEST PASS"
