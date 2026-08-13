#!/usr/bin/env bash
set -euo pipefail

GH_BIN="${GH_BIN:-gh}"
REPOSITORY="${REPOSITORY:-}"
PR_NUMBER="${PR_NUMBER:-133}"
HEAD_SHA="${HEAD_SHA:-}"
RC1_SHA="${RC1_SHA:-9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8}"
RC2_SHA="${RC2_SHA:-d73d936a63cc9462a95bcf481f4b8e1d4b255719}"
RC3_SHA="${RC3_SHA:-7f741e10d0e745a90c732e084400b11e3f5e6794}"
STABLE_TAG="${STABLE_TAG:-v1.0.0}"
LEANDRO_GITHUB_LOGIN="${LEANDRO_GITHUB_LOGIN:-leon337}"
LEANDRO_GITHUB_ID="${LEANDRO_GITHUB_ID:-25374535}"
WEB_FLOW_LOGIN="${WEB_FLOW_LOGIN:-web-flow}"
WEB_FLOW_ID="${WEB_FLOW_ID:-19864447}"
APPROVAL_FILE="${APPROVAL_FILE:-artifacts/phases/PHASE-STABLE-RELEASE-001/LEANDRO-HUMAN-GATE.yaml}"
APPROVAL_COMMIT_MESSAGE="${APPROVAL_COMMIT_MESSAGE:-HUMAN_GATE: approve MCF v1.0.0}"

fail() {
  echo "ERROR: $*" >&2
  return 1
}

gh_api() {
  "$GH_BIN" api "$@"
}

gh_release_create() {
  "$GH_BIN" release create "$@"
}

require_runtime_env() {
  test -n "$REPOSITORY" || fail "REPOSITORY is required"
  test -n "$HEAD_SHA" || fail "HEAD_SHA is required"
}

read_content_at_ref() {
  local path="$1"
  local ref="$2"
  gh_api "repos/$REPOSITORY/contents/$path?ref=$ref" --jq '.content' | tr -d '\n' | base64 --decode
}

verify_rc_lineage() {
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC1" --jq '.object.sha')" = "$RC1_SHA"
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC2" --jq '.object.sha')" = "$RC2_SHA"
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC3" --jq '.object.sha')" = "$RC3_SHA"
}

verify_live_pr_head() {
  test "$(gh_api "repos/$REPOSITORY/pulls/$PR_NUMBER" --jq '.head.sha')" = "$HEAD_SHA"
}

validate_human_gate_commit_json() {
  local commit_json="$1"
  local approval_content="$2"
  local parent_content="$3"

  test "$(jq -r '.author.login' <<<"$commit_json")" = "$LEANDRO_GITHUB_LOGIN"
  test "$(jq -r '.author.id' <<<"$commit_json")" = "$LEANDRO_GITHUB_ID"
  test "$(jq -r '.committer.login' <<<"$commit_json")" = "$WEB_FLOW_LOGIN"
  test "$(jq -r '.committer.id' <<<"$commit_json")" = "$WEB_FLOW_ID"
  test "$(jq -r '.commit.verification.verified' <<<"$commit_json")" = "true"
  test "$(jq -r '.commit.verification.reason' <<<"$commit_json")" = "valid"
  test "$(jq -r '.commit.message' <<<"$commit_json")" = "$APPROVAL_COMMIT_MESSAGE"
  test "$(jq '.parents | length' <<<"$commit_json")" = "1"
  test "$(jq '.files | length' <<<"$commit_json")" = "1"
  test "$(jq -r '.files[0].filename' <<<"$commit_json")" = "$APPROVAL_FILE"
  test "$(jq -r '.files[0].status' <<<"$commit_json")" = "modified"

  local parent_sha
  parent_sha="$(jq -r '.parents[0].sha' <<<"$commit_json")"
  test -n "$parent_sha"

  local expected_approval expected_parent
  expected_approval="$(printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_control_head: %s\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG" "$parent_sha")"
  expected_parent="$(printf 'authority: LEANDRO\nstate: NAO_APROVADO\nrelease: %s\napproved_control_head: null\napproval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED\n' "$STABLE_TAG")"

  test "$approval_content" = "$expected_approval"
  test "$parent_content" = "$expected_parent"

  printf '%s' "$parent_sha"
}

verify_human_gate_commit() {
  require_runtime_env
  verify_live_pr_head

  local commit_json parent_sha approval_content parent_content
  commit_json="$(gh_api "repos/$REPOSITORY/commits/$HEAD_SHA")"
  parent_sha="$(jq -r '.parents[0].sha // empty' <<<"$commit_json")"
  test -n "$parent_sha"
  approval_content="$(read_content_at_ref "$APPROVAL_FILE" "$HEAD_SHA")"
  parent_content="$(read_content_at_ref "$APPROVAL_FILE" "$parent_sha")"

  validate_human_gate_commit_json "$commit_json" "$approval_content" "$parent_content" >/dev/null
}

stable_tag_sha() {
  gh_api "repos/$REPOSITORY/git/ref/tags/$STABLE_TAG" --jq '.object.sha' 2>/dev/null
}

verify_exact_stable_tag() {
  local sha
  sha="$(stable_tag_sha)" || fail "stable tag is absent"
  test "$sha" = "$RC3_SHA" || fail "stable tag points to divergent SHA: $sha"
}

create_exact_stable_tag_fail_closed() {
  local existing_sha
  if existing_sha="$(stable_tag_sha)"; then
    test "$existing_sha" = "$RC3_SHA" || fail "stable tag already exists at divergent SHA: $existing_sha"
    echo "EXISTING_EXACT"
    return 0
  fi

  if gh_api --method POST "repos/$REPOSITORY/git/refs" \
    -f ref="refs/tags/$STABLE_TAG" \
    -f sha="$RC3_SHA" >/tmp/mcf-stable-tag-create.json 2>/tmp/mcf-stable-tag-create.err; then
    verify_exact_stable_tag
    echo "CREATED_EXACT"
    return 0
  fi

  # A failed create may mean another writer won the create race. Inspect the
  # resulting ref before any GitHub Release call. Divergent state fails closed.
  if existing_sha="$(stable_tag_sha)"; then
    test "$existing_sha" = "$RC3_SHA" || fail "concurrent stable tag appeared at divergent SHA: $existing_sha"
    echo "CONCURRENT_EXACT"
    return 0
  fi

  cat /tmp/mcf-stable-tag-create.err >&2 || true
  fail "stable tag create failed and no exact ref exists"
}

release_json() {
  gh_api "repos/$REPOSITORY/releases/tags/$STABLE_TAG" 2>/dev/null
}

validate_exact_release_json() {
  local json="$1"
  test "$(jq -r '.tag_name' <<<"$json")" = "$STABLE_TAG"
  test "$(jq -r '.target_commitish' <<<"$json")" = "$RC3_SHA"
  test "$(jq -r '.draft' <<<"$json")" = "false"
  test "$(jq -r '.prerelease' <<<"$json")" = "false"
}

publish_or_recover() {
  require_runtime_env

  # The human authorization is an immutable, GitHub-verified web commit. It is
  # consumed at this boundary; mutable Issue comments are intentionally ignored.
  verify_human_gate_commit
  verify_rc_lineage
  verify_live_pr_head

  local tag_transition current_release
  tag_transition="$(create_exact_stable_tag_fail_closed)"
  verify_exact_stable_tag

  if current_release="$(release_json)"; then
    validate_exact_release_json "$current_release"
    echo "stable_tag_transition=$tag_transition"
    echo "stable_release_state=EXISTING_EXACT_RECOVERY_NOOP"
    return 0
  fi

  # Revalidate the immutable approval/head and exact tag before release creation.
  # gh release create uses --verify-tag and never auto-creates/reuses an absent
  # tag via --target. The tag identity was explicitly created/validated above.
  verify_human_gate_commit
  verify_rc_lineage
  verify_exact_stable_tag

  gh_release_create "$STABLE_TAG" \
    --repo "$REPOSITORY" \
    --verify-tag \
    --title 'MCF v1.0.0' \
    --notes 'First stable MCF v1.0.0 release. Promoted from the fully qualified v1.0.0-RC3 candidate after exact-SHA production qualification, fail-closed stable-tag creation, independent review, Class C controls and explicit immutable LEANDRO HUMAN_GATE.' \
    --latest

  current_release="$(release_json)"
  validate_exact_release_json "$current_release"
  verify_exact_stable_tag
  test "$(gh_api "repos/$REPOSITORY/releases/latest" --jq '.tag_name')" = "$STABLE_TAG"

  echo "stable_tag_transition=$tag_transition"
  echo "stable_release_state=CREATED_EXACT"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    publish)
      publish_or_recover
      ;;
    verify-human-gate)
      verify_human_gate_commit
      ;;
    *)
      echo "usage: $0 {publish|verify-human-gate}" >&2
      exit 2
      ;;
  esac
fi
