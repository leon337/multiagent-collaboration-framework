#!/usr/bin/env bash
set -euo pipefail
script="$(dirname "$(realpath "$0")")/../../ops/bubble-executor/import-git-bundle.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/source"
git init -q -b main "$tmp/source"
git -C "$tmp/source" config user.name 'MCF Smoke'
git -C "$tmp/source" config user.email 'mcf-smoke@example.invalid'
printf 'alpha\n' > "$tmp/source/README.md"
git -C "$tmp/source" add .
git -C "$tmp/source" commit -qm 'first'
printf 'beta\n' > "$tmp/source/test.txt"
git -C "$tmp/source" add .
git -C "$tmp/source" commit -qm 'second'
expected="$(git -C "$tmp/source" rev-parse HEAD)"
git -C "$tmp/source" bundle create "$tmp/source.bundle" --all
bash "$script" "$tmp/source.bundle" "$tmp/imported" "$expected" https://github.com/example/sample.git > "$tmp/out"
grep -Fx "VERIFIED_SHA=$expected" "$tmp/out"
test "$(git -C "$tmp/imported" rev-parse HEAD)" = "$expected"
test "$(git -C "$tmp/imported" remote get-url origin)" = 'https://github.com/example/sample.git'
test "$(git -C "$tmp/imported" ls-files | wc -l)" -eq 2
test -z "$(git -C "$tmp/imported" status --porcelain)"
echo 'TEST: VALID_BUNDLE PASS'
if bash "$script" "$tmp/missing.bundle" "$tmp/absent" "$expected" https://example.invalid/repo.git >/dev/null 2>&1; then exit 20; fi
test ! -e "$tmp/absent"
echo 'TEST: MISSING_BUNDLE_FAIL_CLOSED PASS'
if bash "$script" "$tmp/source.bundle" "$tmp/imported" "$expected" https://example.invalid/repo.git >/dev/null 2>&1; then exit 21; fi
echo 'TEST: EXISTING_DESTINATION_FAIL_CLOSED PASS'
wrong_sha='0000000000000000000000000000000000000000'
if bash "$script" "$tmp/source.bundle" "$tmp/not_imported" "$wrong_sha" https://example.invalid/repo.git >/dev/null 2>&1; then exit 22; fi
test ! -e "$tmp/not_imported"
echo 'TEST: SHA_MISMATCH_FAIL_CLOSED PASS'
printf 'garbage\n' > "$tmp/invalid.bundle"
if bash "$script" "$tmp/invalid.bundle" "$tmp/invalid_dest" "$expected" https://example.invalid/repo.git >/dev/null 2>&1; then exit 23; fi
test ! -e "$tmp/invalid_dest"
echo 'TEST: INVALID_BUNDLE_FAIL_CLOSED PASS'
echo 'SUMMARY: 5/5 PASS'
