#!/usr/bin/env bash
set -euo pipefail

GH_BIN="${GH_BIN:-gh}"
REPOSITORY="${REPOSITORY:-}"
PR_NUMBER="${PR_NUMBER:-133}"
CONTROL_BRANCH="${CONTROL_BRANCH:-release/v1.0.0-stable-publish}"
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

error() { echo "ERROR: $*" >&2; }
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
  test "$(jq -r '.commit.verification.verified' <<<"$commit_json")" = true || return 1
  test "$(jq -r '.commit.verification.reason' <<<"$commit_json")" = valid || return 1
  test "$(jq -r '.commit.message' <<<"$commit_json")" = "$APPROVAL_COMMIT_MESSAGE" || return 1
  test "$(jq '.parents | length' <<<"$commit_json")" = 1 || return 1
  test "$(jq '.files | length' <<<"$commit_json")" = 1 || return 1
  test "$(jq -r '.files[0].filename' <<<"$commit_json")" = "$APPROVAL_FILE" || return 1
  test "$(jq -r '.files[0].status' <<<"$commit_json")" = modified || return 1

  local parent_sha expected_approval expected_parent
  parent_sha="$(jq -r '.parents[0].sha // empty' <<<"$commit_json")"
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
  if [[ -z "$observed" ]]; then
    echo ABSENT
  elif [[ "$observed" == "$RC3_SHA" ]]; then
    echo EXACT
  else
    echo DIVERGENT
  fi
}

stable_tag_sha() {
  gh_api "repos/$REPOSITORY/git/ref/tags/$STABLE_TAG" --jq '.object.sha' 2>/dev/null
}

verify_exact_stable_tag() {
  local sha
  sha="$(stable_tag_sha)" || { error "stable tag is absent"; return 1; }
  test "$(classify_tag_sha "$sha")" = EXACT || { error "stable tag points to divergent SHA: $sha"; return 1; }
}

git_atomic_push_with_token() {
  test -n "${GH_TOKEN:-}" || { error "GH_TOKEN is required for atomic publication push"; return 1; }
  local auth
  auth="$(printf 'x-access-token:%s' "$GH_TOKEN" | base64 | tr -d '\n')"
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $auth" push "$@"
}

atomic_create_exact_stable_tag_with_head_lease() {
  # Server-side CAS boundary: the control branch must still point to the exact
  # approved HEAD at the same remote transaction that creates v1.0.0 at RC3.
  # Git --atomic guarantees all-or-none ref updates; explicit force-with-lease
  # rejects the whole transaction if PR HEAD moved before the server applies it.
  git_atomic_push_with_token \
    --atomic \
    --force-with-lease="refs/heads/$CONTROL_BRANCH:$HEAD_SHA" \
    origin \
    "$HEAD_SHA:refs/heads/$CONTROL_BRANCH" \
    "$RC3_SHA:refs/tags/$STABLE_TAG"
}

create_exact_stable_tag_fail_closed() {
  local existing_sha=""

  if existing_sha="$(stable_tag_sha)"; then
    test "$(classify_tag_sha "$existing_sha")" = EXACT || {
      error "stable tag already exists at divergent SHA: $existing_sha"
      return 1
    }
    echo EXISTING_EXACT
    return 0
  fi

  verify_human_gate_commit || {
    error "HUMAN_GATE invalid before atomic stable-tag boundary"
    return 1
  }
  verify_rc_lineage || {
    error "RC lineage changed before atomic stable-tag boundary"
    return 1
  }

  if atomic_create_exact_stable_tag_with_head_lease >/tmp/mcf-stable-atomic-push.out 2>/tmp/mcf-stable-atomic-push.err; then
    verify_exact_stable_tag || return 1
    echo CREATED_EXACT_ATOMIC_HEAD_LEASE
    return 0
  fi

  # Any failed atomic transaction is terminal for this run. Even an exact tag
  # created by another writer is handled only by a fresh recovery run, so an
  # old approved run can never continue after its lease failed.
  if existing_sha="$(stable_tag_sha)"; then
    if [[ "$(classify_tag_sha "$existing_sha")" == DIVERGENT ]]; then
      error "atomic publication push failed and stable tag is divergent: $existing_sha"
    else
      error "atomic publication push failed; exact stable tag now exists and requires a fresh recovery run"
    fi
  else
    cat /tmp/mcf-stable-atomic-push.err >&2 || true
    error "atomic publication push failed and stable tag remains absent"
  fi
  return 1
}

release_json() {
  gh_api "repos/$REPOSITORY/releases/tags/$STABLE_TAG" 2>/dev/null
}

validate_exact_release_json() {
  local json="$1"
  test "$(jq -r '.tag_name' <<<"$json")" = "$STABLE_TAG" || return 1
  test "$(jq -r '.target_commitish' <<<"$json")" = "$RC3_SHA" || return 1
  test "$(jq -r '.draft' <<<"$json")" = false || return 1
  test "$(jq -r '.prerelease' <<<"$json")" = false || return 1
}

publish_or_recover() {
  require_runtime_env || return 1
  verify_human_gate_commit || {
    error "immutable HUMAN_GATE receipt is absent or invalid"
    return 1
  }
  verify_rc_lineage || {
    error "RC lineage changed"
    return 1
  }

  local tag_transition current_release
  tag_transition="$(create_exact_stable_tag_fail_closed)" || return 1
  verify_exact_stable_tag || return 1

  if current_release="$(release_json)"; then
    validate_exact_release_json "$current_release" || {
      error "existing stable release is incompatible"
      return 1
    }
    echo "stable_tag_transition=$tag_transition"
    echo "stable_release_state=EXISTING_EXACT_RECOVERY_NOOP"
    return 0
  fi

  # Tag-only recovery is valid only with an exact RC3 tag and a still-valid
  # immutable HUMAN_GATE receipt. The first stable mutation itself is protected
  # by the atomic branch-lease transaction above.
  verify_human_gate_commit || {
    error "immutable HUMAN_GATE receipt no longer matches live HEAD"
    return 1
  }
  verify_rc_lineage || {
    error "RC lineage changed before release"
    return 1
  }
  verify_exact_stable_tag || {
    error "stable tag is not exact RC3 before release"
    return 1
  }

  gh_release_create "$STABLE_TAG" \
    --repo "$REPOSITORY" \
    --verify-tag \
    --target "$RC3_SHA" \
    --title 'MCF v1.0.0' \
    --notes 'First stable MCF v1.0.0 release. Promoted from the fully qualified v1.0.0-RC3 candidate after exact-SHA production qualification, server-side atomic control-head lease, independent review, Class C controls and explicit immutable LEANDRO HUMAN_GATE.' \
    --latest || return 1

  current_release="$(release_json)" || return 1
  validate_exact_release_json "$current_release" || return 1
  verify_exact_stable_tag || return 1
  test "$(gh_api "repos/$REPOSITORY/releases/latest" --jq '.tag_name')" = "$STABLE_TAG" || return 1

  echo "stable_tag_transition=$tag_transition"
  echo "stable_release_state=CREATED_EXACT"
}

self_test_receipt_predicate() {
  local pass=0 parent=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  local base approved json bad stale

  base="$(printf 'authority: LEANDRO\nstate: NAO_APROVADO\nrelease: %s\napproved_control_head: null\napproval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED\n' "$STABLE_TAG")"
  approved="$(printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_control_head: %s\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG" "$parent")"
  json="$(jq -n --arg p "$parent" --arg m "$APPROVAL_COMMIT_MESSAGE" --arg f "$APPROVAL_FILE" '{author:{login:"leon337",id:25374535},committer:{login:"web-flow",id:19864447},commit:{message:$m,verification:{verified:true,reason:"valid"}},parents:[{sha:$p}],files:[{filename:$f,status:"modified"}]}')"

  validate_human_gate_commit_json "$json" "$approved" "$base" >/dev/null && pass=$((pass+1))

  bad="$(jq '.committer={login:"chatgpt-codex-connector[bot]",id:199175422}|.commit.verification={verified:false,reason:"unsigned"}' <<<"$json")"
  if ! validate_human_gate_commit_json "$bad" "$approved" "$base" >/dev/null 2>&1; then pass=$((pass+1)); fi

  stale="$(printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_control_head: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG")"
  if ! validate_human_gate_commit_json "$json" "$stale" "$base" >/dev/null 2>&1; then pass=$((pass+1)); fi

  if ! validate_human_gate_commit_json "$json" "$base" "$base" >/dev/null 2>&1; then pass=$((pass+1)); fi

  echo "$pass"
}

self_test_atomic_git_boundary() (
  set -euo pipefail
  local root pass=0
  root="$(mktemp -d)"
  trap 'rm -rf "$root"' EXIT

  setup_repo() {
    local name="$1"
    git init --bare "$root/$name.git" >/dev/null
    git clone "$root/$name.git" "$root/$name-a" >/dev/null 2>&1
    (
      cd "$root/$name-a"
      git config user.email test@example.invalid
      git config user.name mcf-boundary-test
      printf 'base\n' >state.txt
      git add state.txt
      git commit -m base >/dev/null
      git branch -M "$CONTROL_BRANCH"
      git push origin "$CONTROL_BRANCH" >/dev/null
    )
  }

  setup_repo stable-head
  (
    cd "$root/stable-head-a"
    local_head="$(git rev-parse HEAD)"
    git push --atomic \
      --force-with-lease="refs/heads/$CONTROL_BRANCH:$local_head" \
      origin \
      "$local_head:refs/heads/$CONTROL_BRANCH" \
      "$local_head:refs/tags/$STABLE_TAG" >/dev/null
    test "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)" = "$local_head"
  )
  pass=$((pass+1))
  echo "PASS: atomic lease + unchanged control HEAD creates exact tag" >&2

  setup_repo moved-head
  git clone "$root/moved-head.git" "$root/moved-head-b" >/dev/null 2>&1
  (
    cd "$root/moved-head-b"
    git config user.email test2@example.invalid
    git config user.name mcf-boundary-racer
    git checkout "$CONTROL_BRANCH" >/dev/null 2>&1
    printf 'racer\n' >>state.txt
    git commit -am racer >/dev/null
    git push origin "$CONTROL_BRANCH" >/dev/null
  )
  (
    cd "$root/moved-head-a"
    stale_head="$(git rev-parse HEAD)"
    if git push --atomic \
      --force-with-lease="refs/heads/$CONTROL_BRANCH:$stale_head" \
      origin \
      "$stale_head:refs/heads/$CONTROL_BRANCH" \
      "$stale_head:refs/tags/$STABLE_TAG" >/dev/null 2>&1; then
      echo "FAIL: stale control HEAD unexpectedly passed atomic lease" >&2
      return 1
    fi
    test -z "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)"
  )
  pass=$((pass+1))
  echo "PASS: control HEAD moved immediately before mutation -> atomic transaction creates no tag" >&2

  echo "$pass"
)

self_test_real_state_machine() (
  set -euo pipefail
  local tmp pass=0
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT

  write_state() { printf '%s' "$2" >"$tmp/$1"; }
  read_state() { cat "$tmp/$1"; }
  inc_counter() { local n; n="$(read_state "$1")"; write_state "$1" "$((n+1))"; }

  reset_state() {
    write_state tag "${1:-ABSENT}"
    write_state race "${2:-NONE}"
    write_state release "${3:-ABSENT}"
    write_state gate "${4:-VALID}"
    write_state head "${5:-VALID}"
    write_state gate_checks 0
    write_state head_checks 0
    write_state tag_create_calls 0
    write_state release_create_calls 0
  }

  require_runtime_env() { return 0; }
  verify_rc_lineage() { return 0; }

  verify_live_pr_head() {
    inc_counter head_checks
    case "$(read_state head)" in
      VALID) return 0 ;;
      CHANGED) return 1 ;;
      *) return 1 ;;
    esac
  }

  verify_human_gate_commit() {
    inc_counter gate_checks
    case "$(read_state gate)" in
      VALID) verify_live_pr_head ;;
      ABSENT|STALE|APP|REVOKED) return 1 ;;
      *) return 1 ;;
    esac
  }

  stable_tag_sha() {
    case "$(read_state tag)" in
      ABSENT) return 1 ;;
      RC3) printf '%s\n' "$RC3_SHA" ;;
      WRONG) printf '%s\n' cccccccccccccccccccccccccccccccccccccccc ;;
      *) return 2 ;;
    esac
  }

  atomic_create_exact_stable_tag_with_head_lease() {
    inc_counter tag_create_calls
    case "$(read_state race)" in
      NONE) write_state tag RC3; return 0 ;;
      WRONG) write_state tag WRONG; return 1 ;;
      EXACT) write_state tag RC3; return 1 ;;
      HEAD_CHANGED) write_state head CHANGED; return 1 ;;
      FAILED) return 1 ;;
      *) return 2 ;;
    esac
  }

  release_json() {
    case "$(read_state release)" in
      ABSENT) return 1 ;;
      EXACT) jq -n --arg tag "$STABLE_TAG" --arg sha "$RC3_SHA" '{tag_name:$tag,target_commitish:$sha,draft:false,prerelease:false}' ;;
      INCOMPATIBLE) jq -n --arg tag "$STABLE_TAG" '{tag_name:$tag,target_commitish:"dddddddddddddddddddddddddddddddddddddddd",draft:false,prerelease:false}' ;;
      *) return 2 ;;
    esac
  }

  gh_api() {
    if [[ "${1:-}" == *"/releases/latest" ]]; then
      printf '%s\n' "$STABLE_TAG"
      return 0
    fi
    return 97
  }

  gh_release_create() {
    inc_counter release_create_calls
    test "$(read_state tag)" = RC3 || return 98
    write_state release EXACT
  }

  passed() { pass=$((pass+1)); echo "PASS: $1" >&2; }
  failed() { echo "FAIL: $1" >&2; return 1; }
  no_release_writes() { test "$(read_state release_create_calls)" = 0; }
  no_tag_writes() { test "$(read_state tag_create_calls)" = 0; }

  reset_state ABSENT NONE ABSENT VALID VALID
  if publish_or_recover >/dev/null 2>&1 && test "$(read_state tag_create_calls)" = 1 && test "$(read_state release_create_calls)" = 1; then passed "valid approval + stable control HEAD -> path permitted"; else failed "valid approval + stable control HEAD -> path permitted"; fi

  reset_state ABSENT HEAD_CHANGED ABSENT VALID VALID
  if ! publish_or_recover >/dev/null 2>&1 && test "$(read_state tag_create_calls)" = 1 && no_release_writes && test "$(read_state tag)" = ABSENT; then passed "HEAD changes at first stable mutation -> no tag/release"; else failed "HEAD changes at first stable mutation -> no tag/release"; fi

  reset_state RC3 NONE ABSENT VALID VALID
  if publish_or_recover >/dev/null 2>&1 && no_tag_writes && test "$(read_state release_create_calls)" = 1; then passed "exact RC3 tag + no release -> safe recovery"; else failed "exact RC3 tag + no release -> safe recovery"; fi

  reset_state WRONG NONE ABSENT VALID VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "wrong-SHA tag -> fail closed"; else failed "wrong-SHA tag -> fail closed"; fi

  reset_state RC3 NONE EXACT VALID VALID
  if publish_or_recover >/dev/null 2>&1 && no_tag_writes && no_release_writes; then passed "exact tag + exact release -> idempotent NOOP"; else failed "exact tag + exact release -> idempotent NOOP"; fi

  reset_state RC3 NONE INCOMPATIBLE VALID VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "incompatible release -> fail closed"; else failed "incompatible release -> fail closed"; fi

  reset_state ABSENT NONE ABSENT ABSENT VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_tag_writes && no_release_writes; then passed "HUMAN_GATE absent -> no mutation"; else failed "HUMAN_GATE absent -> no mutation"; fi

  reset_state ABSENT NONE ABSENT STALE VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_tag_writes && no_release_writes; then passed "stale receipt -> no mutation"; else failed "stale receipt -> no mutation"; fi

  reset_state ABSENT NONE ABSENT APP VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_tag_writes && no_release_writes; then passed "App-mediated/invalid receipt -> no mutation"; else failed "App-mediated/invalid receipt -> no mutation"; fi

  reset_state ABSENT WRONG ABSENT VALID VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "concurrent divergent tag -> fail before release"; else failed "concurrent divergent tag -> fail before release"; fi

  reset_state ABSENT EXACT ABSENT VALID VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "concurrent exact tag during failed transaction -> fresh recovery required"; else failed "concurrent exact tag during failed transaction -> fresh recovery required"; fi

  reset_state ABSENT FAILED ABSENT VALID VALID
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "atomic push failure without tag -> no release"; else failed "atomic push failure without tag -> no release"; fi

  echo "$pass"
)

self_test() {
  local receipt atomic_git real total
  receipt="$(self_test_receipt_predicate)"
  atomic_git="$(self_test_atomic_git_boundary)"
  real="$(self_test_real_state_machine)"
  total=$((receipt + atomic_git + real))

  echo "publication_boundary_receipt_tests=$receipt"
  echo "publication_boundary_atomic_git_tests=$atomic_git"
  echo "publication_boundary_real_state_machine_tests=$real"
  echo "publication_boundary_self_tests=$total"

  test "$receipt" = 4
  test "$atomic_git" = 2
  test "$real" = 12
  test "$total" = 18
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    publish) publish_or_recover ;;
    verify-human-gate) verify_human_gate_commit ;;
    self-test) self_test ;;
    *) echo "usage: $0 {publish|verify-human-gate|self-test}" >&2; exit 2 ;;
  esac
fi
