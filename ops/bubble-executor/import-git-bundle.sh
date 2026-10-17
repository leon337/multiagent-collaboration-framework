#!/usr/bin/env bash
# Import a pre-delivered Git bundle into a temporary staging checkout.
# Offline only; never overwrites an existing destination.
set -euo pipefail
if [[ $# -ne 4 ]]; then
  echo 'Usage: import-git-bundle.sh BUNDLE DEST EXPECTED_SHA ORIGIN_URL' >&2
  exit 64
fi
bundle="$1"; dest="$2"; expected="$3"; remote_url="$4"
if [[ ! -f "$bundle" ]]; then
  echo "BUNDLE_NOT_FOUND: $bundle" >&2; exit 66
fi
if [[ -e "$dest" ]]; then
  echo "DESTINATION_EXISTS: $dest" >&2; exit 73
fi
if ! [[ "$expected" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'INVALID_EXPECTED_SHA' >&2; exit 64
fi
if ! git bundle list-heads "$bundle" >/dev/null 2>&1; then
  echo 'INVALID_OR_INCOMPLETE_BUNDLE' >&2; exit 65
fi
parent="$(dirname "$dest")"
mkdir -p "$parent"
staging="$(mktemp -d "${parent}/.git-bundle-import.XXXXXXXX")"
cleanup() { [[ ! -d "$staging" ]] || rm -rf -- "$staging"; }
trap cleanup EXIT
git clone --quiet "$bundle" "$staging/checkout"
actual="$(git -C "$staging/checkout" rev-parse HEAD)"
if [[ "$actual" != "$expected" ]]; then
  echo "SHA_MISMATCH expected=$expected actual=$actual" >&2
  exit 1
fi
if ! git -C "$staging/checkout" diff --quiet --exit-code || \
   ! git -C "$staging/checkout" diff --cached --quiet --exit-code; then
  echo 'DIRTY_IMPORT' >&2; exit 1
fi
git -C "$staging/checkout" remote set-url origin "$remote_url"
mv "$staging/checkout" "$dest"
echo "IMPORTED_PATH=$dest"
echo "VERIFIED_SHA=$actual"
echo "TRACKED_FILES=$(git -C "$dest" ls-files | wc -l)"
echo "ORIGIN=$(git -C "$dest" remote get-url origin)"
echo "WORKTREE_DIRTY_COUNT=$(git -C "$dest" status --porcelain | wc -l)"
