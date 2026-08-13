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

fail() { echo "ERROR: $*" >&2; return 1; }
gh_api() { "$GH_BIN" api "$@"; }
gh_release_create() { "$GH_BIN" release create "$@"; }

require_runtime_env() {
  test -n "$REPOSITORY" || return 1
  test -n "$HEAD_SHA" || return 1
}

read_content_at_ref() {
  local path="$1" ref="$2"
  gh_api "repos/$REPOSITORY/contents/$path?ref=$ref" --jq '.content' | tr -d '\n' | base64 --decode
}

verify_rc_lineage() {
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC1" --jq '.object.sha')" = "$RC1_SHA" || return 1
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC2" --jq '.object.sha')" = "$RC2_SHA" || return 1
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC3" --jq '.object.sha')" = "$RC3_SHA" || return 1
}

verify_live_pr_head() {
  test "$(gh_api "repos/$REPOSITORY/pulls/$PR_NUMBER" --jq '.head.sha')" = "$HEAD_SHA" || return 1
}

validate_human_gate_commit_json() {
  local commit_json="$1" approval_content="$2" parent_content="$3"
  test "$(jq -r '.author.login' <<<"$commit_json")" = "$LEANDRO_GITHUB_LOGIN" || return 1
  test "$(jq -r '.author.id' <<<"$commit_json")" = "$LEANDRO_GITHUB_ID" || return 1
  test "$(jq -r '.committer.login' <<<"$commit_json")" = "$WEB_FLOW_LOGIN" || return 1
  test "$(jq -r '.committer.id' <<<"$commit_json")" = "$WEB_FLOW_ID" || return 1
  test "$(jq -r '.commit.verification.verified' <<<"$commit_json")" = "true" || return 1
  test "$(jq -r '.commit.verification.reason' <<<"$commit_json")" = "valid" || return 1
  test "$(jq -r '.commit.message' <<<"$commit_json")" = "$APPROVAL_COMMIT_MESSAGE" || return 1
  test "$(jq '.parents | length' <<<"$commit_json")" = "1" || return 1
  test "$(jq '.files | length' <<<"$commit_json")" = "1" || return 1
  test "$(jq -r '.files[0].filename' <<<"$commit_json")" = "$APPROVAL_FILE" || return 1
  test "$(jq -r '.files[0].status' <<<"$commit_json")" = "modified" || return 1

  local parent_sha expected_approval expected_parent
  parent_sha="$(jq -r '.parents[0].sha' <<<"$commit_json")"
  test -n "$parent_sha" || return 1
  expected_approval="$(printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_control_head: %s\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG" "$parent_sha")"
  expected_parent="$(printf 'authority: LEANDRO\nstate: NAO_APROVADO\nrelease: %s\napproved_control_head: null\napproval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED\n' "$STABLE_TAG")"
  test "$approval_content" = "$expected_approval" || return 1
  test "$parent_content" = "$expected_parent" || return 1
  printf '%s' "$parent_sha"
}

verify_human_gate_commit() {
  require_runtime_env || return 1
  verify_live_pr_head || return 1
  local commit_json parent_sha approval_content parent_content
  commit_json="$(gh_api "repos/$REPOSITORY/commits/$HEAD_SHA")" || return 1
  parent_sha="$(jq -r '.parents[0].sha // empty' <<<"$commit_json")"
  test -n "$parent_sha" || return 1
  approval_content="$(read_content_at_ref "$APPROVAL_FILE" "$HEAD_SHA")" || return 1
  parent_content="$(read_content_at_ref "$APPROVAL_FILE" "$parent_sha")" || return 1
  validate_human_gate_commit_json "$commit_json" "$approval_content" "$parent_content" >/dev/null || return 1
}

classify_tag_sha() {
  local observed="${1:-}"
  if [[ -z "$observed" ]]; then echo ABSENT
  elif [[ "$observed" == "$RC3_SHA" ]]; then echo EXACT
  else echo DIVERGENT
  fi
}

stable_tag_sha() { gh_api "repos/$REPOSITORY/git/ref/tags/$STABLE_TAG" --jq '.object.sha' 2>/dev/null; }

verify_exact_stable_tag() {
  local sha
  sha="$(stable_tag_sha)" || fail "stable tag is absent"
  test "$(classify_tag_sha "$sha")" = EXACT || fail "stable tag points to divergent SHA: $sha"
}

create_exact_stable_tag_fail_closed() {
  local existing_sha=""
  if existing_sha="$(stable_tag_sha)"; then
    test "$(classify_tag_sha "$existing_sha")" = EXACT || fail "stable tag already exists at divergent SHA: $existing_sha"
    echo EXISTING_EXACT
    return 0
  fi

  if gh_api --method POST "repos/$REPOSITORY/git/refs" -f ref="refs/tags/$STABLE_TAG" -f sha="$RC3_SHA" >/tmp/mcf-stable-tag-create.json 2>/tmp/mcf-stable-tag-create.err; then
    verify_exact_stable_tag || return 1
    echo CREATED_EXACT
    return 0
  fi

  if existing_sha="$(stable_tag_sha)"; then
    test "$(classify_tag_sha "$existing_sha")" = EXACT || fail "concurrent stable tag appeared at divergent SHA: $existing_sha"
    echo CONCURRENT_EXACT
    return 0
  fi

  cat /tmp/mcf-stable-tag-create.err >&2 || true
  fail "stable tag create failed and no exact ref exists"
}

release_json() { gh_api "repos/$REPOSITORY/releases/tags/$STABLE_TAG" 2>/dev/null; }

validate_exact_release_json() {
  local json="$1"
  test "$(jq -r '.tag_name' <<<"$json")" = "$STABLE_TAG" || return 1
  test "$(jq -r '.target_commitish' <<<"$json")" = "$RC3_SHA" || return 1
  test "$(jq -r '.draft' <<<"$json")" = false || return 1
  test "$(jq -r '.prerelease' <<<"$json")" = false || return 1
}

publish_or_recover() {
  require_runtime_env || return 1
  verify_human_gate_commit || fail "immutable HUMAN_GATE receipt is absent or invalid"
  verify_rc_lineage || fail "RC lineage changed"
  verify_live_pr_head || fail "PR HEAD changed"

  local tag_transition current_release
  tag_transition="$(create_exact_stable_tag_fail_closed)" || return 1
  verify_exact_stable_tag || return 1

  if current_release="$(release_json)"; then
    validate_exact_release_json "$current_release" || fail "existing stable release is incompatible"
    echo "stable_tag_transition=$tag_transition"
    echo "stable_release_state=EXISTING_EXACT_RECOVERY_NOOP"
    return 0
  fi

  verify_human_gate_commit || fail "immutable HUMAN_GATE receipt no longer matches live HEAD"
  verify_rc_lineage || fail "RC lineage changed before release"
  verify_exact_stable_tag || fail "stable tag is not exact RC3 before release"

  gh_release_create "$STABLE_TAG" --repo "$REPOSITORY" --verify-tag \
    --title 'MCF v1.0.0' \
    --notes 'First stable MCF v1.0.0 release. Promoted from the fully qualified v1.0.0-RC3 candidate after exact-SHA production qualification, fail-closed stable-tag creation, independent review, Class C controls and explicit immutable LEANDRO HUMAN_GATE.' \
    --latest

  current_release="$(release_json)" || return 1
  validate_exact_release_json "$current_release" || return 1
  verify_exact_stable_tag || return 1
  test "$(gh_api "repos/$REPOSITORY/releases/latest" --jq '.tag_name')" = "$STABLE_TAG" || return 1
  echo "stable_tag_transition=$tag_transition"
  echo "stable_release_state=CREATED_EXACT"
}

simulate_boundary() {
  local gate="$1" head="$2" tag_before="$3" create_result="$4" release_state="$5"
  [[ "$gate" == VALID && "$head" == VALID ]] || { echo DENY_NO_MUTATION; return; }
  case "$tag_before" in
    DIVERGENT) echo FAIL_BEFORE_RELEASE; return ;;
    EXACT) : ;;
    ABSENT)
      case "$create_result" in
        CREATED_EXACT|CONCURRENT_EXACT) : ;;
        CONCURRENT_DIVERGENT|CREATE_FAILED) echo FAIL_BEFORE_RELEASE; return ;;
        *) echo FAIL_BEFORE_RELEASE; return ;;
      esac
      ;;
  esac
  case "$release_state" in
    INCOMPATIBLE) echo FAIL_BEFORE_RELEASE ;;
    EXACT) echo RECOVERY_NOOP ;;
    ABSENT) echo RELEASE_ALLOWED_AFTER_EXACT_TAG ;;
    *) echo FAIL_BEFORE_RELEASE ;;
  esac
}

self_test() {
  local pass=0 parent=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  local base approved json bad stale
  base="$(printf 'authority: LEANDRO\nstate: NAO_APROVADO\nrelease: %s\napproved_control_head: null\napproval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED\n' "$STABLE_TAG")"
  approved="$(printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_control_head: %s\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG" "$parent")"
  json="$(jq -n --arg p "$parent" --arg m "$APPROVAL_COMMIT_MESSAGE" --arg f "$APPROVAL_FILE" '{author:{login:"leon337",id:25374535},committer:{login:"web-flow",id:19864447},commit:{message:$m,verification:{verified:true,reason:"valid"}},parents:[{sha:$p}],files:[{filename:$f,status:"modified"}]}')"
  validate_human_gate_commit_json "$json" "$approved" "$base" >/dev/null && pass=$((pass+1))
  bad="$(jq '.committer={login:"chatgpt-codex-connector[bot]",id:199175422}|.commit.verification={verified:false,reason:"unsigned"}' <<<"$json")"
  ! validate_human_gate_commit_json "$bad" "$approved" "$base" >/dev/null 2>&1 && pass=$((pass+1))
  stale="$(printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_control_head: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG")"
  ! validate_human_gate_commit_json "$json" "$stale" "$base" >/dev/null 2>&1 && pass=$((pass+1))
  ! validate_human_gate_commit_json "$json" "$base" "$base" >/dev/null 2>&1 && pass=$((pass+1))

  test "$(simulate_boundary VALID VALID ABSENT CREATED_EXACT ABSENT)" = RELEASE_ALLOWED_AFTER_EXACT_TAG && pass=$((pass+1))
  test "$(simulate_boundary VALID VALID ABSENT CONCURRENT_DIVERGENT ABSENT)" = FAIL_BEFORE_RELEASE && pass=$((pass+1))
  test "$(simulate_boundary VALID VALID EXACT CREATED_EXACT EXACT)" = RECOVERY_NOOP && pass=$((pass+1))
  test "$(simulate_boundary VALID VALID DIVERGENT CREATED_EXACT ABSENT)" = FAIL_BEFORE_RELEASE && pass=$((pass+1))
  test "$(simulate_boundary VALID VALID EXACT CREATED_EXACT INCOMPATIBLE)" = FAIL_BEFORE_RELEASE && pass=$((pass+1))
  test "$(simulate_boundary ABSENT VALID ABSENT CREATED_EXACT ABSENT)" = DENY_NO_MUTATION && pass=$((pass+1))
  test "$(simulate_boundary STALE VALID ABSENT CREATED_EXACT ABSENT)" = DENY_NO_MUTATION && pass=$((pass+1))
  test "$(simulate_boundary APP VALID ABSENT CREATED_EXACT ABSENT)" = DENY_NO_MUTATION && pass=$((pass+1))
  test "$(simulate_boundary REVOKED VALID ABSENT CREATED_EXACT ABSENT)" = DENY_NO_MUTATION && pass=$((pass+1))
  test "$(simulate_boundary VALID CHANGED ABSENT CREATED_EXACT ABSENT)" = DENY_NO_MUTATION && pass=$((pass+1))
  test "$(simulate_boundary VALID VALID ABSENT CONCURRENT_EXACT ABSENT)" = RELEASE_ALLOWED_AFTER_EXACT_TAG && pass=$((pass+1))
  test "$(simulate_boundary VALID VALID ABSENT CREATE_FAILED ABSENT)" = FAIL_BEFORE_RELEASE && pass=$((pass+1))

  echo "publication_boundary_self_tests=$pass"
  test "$pass" = 16
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    publish) publish_or_recover ;;
    verify-human-gate) verify_human_gate_commit ;;
    self-test) self_test ;;
    *) echo "usage: $0 {publish|verify-human-gate|self-test}" >&2; exit 2 ;;
  esac
fi
