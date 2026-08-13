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
CONTROL_LOCK_TAG="${CONTROL_LOCK_TAG:-mcf-control/v1.0.0}"
LEANDRO_GITHUB_LOGIN="${LEANDRO_GITHUB_LOGIN:-leon337}"
LEANDRO_GITHUB_ID="${LEANDRO_GITHUB_ID:-25374535}"
WEB_FLOW_LOGIN="${WEB_FLOW_LOGIN:-web-flow}"
WEB_FLOW_ID="${WEB_FLOW_ID:-19864447}"
APPROVAL_FILE="${APPROVAL_FILE:-artifacts/phases/PHASE-STABLE-RELEASE-001/LEANDRO-HUMAN-GATE.yaml}"
APPROVAL_COMMIT_MESSAGE="${APPROVAL_COMMIT_MESSAGE:-HUMAN_GATE: approve MCF v1.0.0}"
LOCK_MESSAGE_TITLE="${LOCK_MESSAGE_TITLE:-MCF stable publication authorization consumed}"

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

live_pr_head() {
  gh_api "repos/$REPOSITORY/pulls/$PR_NUMBER" --jq '.head.sha'
}

verify_live_pr_head() {
  test "$(live_pr_head)" = "$HEAD_SHA" || return 1
}

expected_approved_receipt() {
  local parent_sha="$1"
  printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_control_head: %s\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG" "$parent_sha"
}

expected_unapproved_receipt() {
  printf 'authority: LEANDRO\nstate: NAO_APROVADO\nrelease: %s\napproved_control_head: null\napproval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED\n' "$STABLE_TAG"
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

  local parent_sha
  parent_sha="$(jq -r '.parents[0].sha // empty' <<<"$commit_json")"
  test -n "$parent_sha" || return 1
  test "$approval_content" = "$(expected_approved_receipt "$parent_sha")" || return 1
  test "$parent_content" = "$(expected_unapproved_receipt)" || return 1
  printf '%s' "$parent_sha"
}

verify_human_gate_commit_at_ref() {
  local ref="$1" commit_json parent_sha approval_content parent_content
  commit_json="$(gh_api "repos/$REPOSITORY/commits/$ref")" || return 1
  parent_sha="$(jq -r '.parents[0].sha // empty' <<<"$commit_json")"
  test -n "$parent_sha" || return 1
  approval_content="$(read_content_at_ref "$APPROVAL_FILE" "$ref")" || return 1
  parent_content="$(read_content_at_ref "$APPROVAL_FILE" "$parent_sha")" || return 1
  validate_human_gate_commit_json "$commit_json" "$approval_content" "$parent_content" >/dev/null || return 1
}

verify_direct_human_gate_live() {
  require_runtime_env || return 1
  verify_live_pr_head || return 1
  verify_human_gate_commit_at_ref "$HEAD_SHA"
}

classify_stable_sha() {
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

control_lock_tag_sha() {
  gh_api "repos/$REPOSITORY/git/ref/tags/$CONTROL_LOCK_TAG" --jq '.object.sha' 2>/dev/null
}

verify_exact_stable_tag() {
  local sha
  sha="$(stable_tag_sha)" || { error "stable tag is absent"; return 1; }
  test "$(classify_stable_sha "$sha")" = EXACT || { error "stable tag points to divergent SHA: $sha"; return 1; }
}

ruleset_details_satisfy_contract() {
  local json="$1"
  test "$(jq -r '.target' <<<"$json")" = tag || return 1
  test "$(jq -r '.enforcement' <<<"$json")" = active || return 1
  jq -e --arg stable "refs/tags/$STABLE_TAG" '.conditions.ref_name.include | index($stable) != null' <<<"$json" >/dev/null || return 1
  jq -e --arg lock "refs/tags/$CONTROL_LOCK_TAG" '.conditions.ref_name.include | index($lock) != null' <<<"$json" >/dev/null || return 1
  jq -e '[.rules[].type] | index("update") != null' <<<"$json" >/dev/null || return 1
  jq -e '[.rules[].type] | index("deletion") != null' <<<"$json" >/dev/null || return 1
}

verify_server_side_tag_protection() {
  local ids id details
  ids="$(gh_api "repos/$REPOSITORY/rulesets?includes_parents=true&per_page=100" --jq '.[] | select(.target == "tag" and .enforcement == "active") | .id')" || return 1
  while IFS= read -r id; do
    [[ -n "$id" ]] || continue
    details="$(gh_api "repos/$REPOSITORY/rulesets/$id")" || continue
    if ruleset_details_satisfy_contract "$details"; then
      echo "$id"
      return 0
    fi
  done <<<"$ids"
  error "no active tag ruleset protects updates/deletions for both publication refs"
  return 1
}

lock_commit_message() {
  local approved_head="$1"
  printf '%s\n\napproved_control_head: %s\ncandidate_sha: %s\nrelease: %s\n' "$LOCK_MESSAGE_TITLE" "$approved_head" "$RC3_SHA" "$STABLE_TAG"
}

create_publication_lock_commit() {
  local approved_head="$1" tree lock_sha
  tree="$(git rev-parse "$approved_head^{tree}")" || return 1
  lock_sha="$(
    GIT_AUTHOR_NAME='MCF Stable Publication Gate' \
    GIT_AUTHOR_EMAIL='41898282+github-actions[bot]@users.noreply.github.com' \
    GIT_COMMITTER_NAME='MCF Stable Publication Gate' \
    GIT_COMMITTER_EMAIL='41898282+github-actions[bot]@users.noreply.github.com' \
    git commit-tree "$tree" -p "$approved_head" <<<"$(lock_commit_message "$approved_head")"
  )" || return 1
  test "$lock_sha" != "$approved_head" || return 1
  printf '%s' "$lock_sha"
}

validate_publication_lock_commit_json() {
  local lock_json="$1" expected_lock_sha="$2" approved_head parent_json expected_message
  test "$(jq -r '.sha' <<<"$lock_json")" = "$expected_lock_sha" || return 1
  test "$(jq '.parents | length' <<<"$lock_json")" = 1 || return 1
  test "$(jq '.files | length' <<<"$lock_json")" = 0 || return 1
  approved_head="$(jq -r '.parents[0].sha // empty' <<<"$lock_json")"
  test -n "$approved_head" || return 1
  expected_message="$(lock_commit_message "$approved_head")"
  test "$(jq -r '.commit.message' <<<"$lock_json")" = "$expected_message" || return 1
  parent_json="$(gh_api "repos/$REPOSITORY/commits/$approved_head")" || return 1
  test "$(jq -r '.commit.tree.sha' <<<"$lock_json")" = "$(jq -r '.commit.tree.sha' <<<"$parent_json")" || return 1
  verify_human_gate_commit_at_ref "$approved_head" || return 1
  printf '%s' "$approved_head"
}

verify_consumed_authorization() {
  require_runtime_env || return 1
  verify_rc_lineage || return 1
  verify_server_side_tag_protection >/dev/null || return 1
  verify_exact_stable_tag || return 1

  local lock_sha lock_json
  lock_sha="$(control_lock_tag_sha)" || { error "control lock tag is absent"; return 1; }
  lock_json="$(gh_api "repos/$REPOSITORY/commits/$lock_sha")" || return 1
  validate_publication_lock_commit_json "$lock_json" "$lock_sha" >/dev/null || {
    error "control lock tag does not encode a valid consumed HUMAN_GATE"
    return 1
  }
}

verify_effective_human_gate() {
  if verify_direct_human_gate_live; then
    echo DIRECT_UNCONSUMED
    return 0
  fi
  if verify_consumed_authorization; then
    echo CONSUMED_PROTECTED
    return 0
  fi
  return 1
}

git_atomic_push_with_token() {
  test -n "${GH_TOKEN:-}" || { error "GH_TOKEN is required for atomic publication push"; return 1; }
  local auth
  auth="$(printf 'x-access-token:%s' "$GH_TOKEN" | base64 | tr -d '\n')"
  git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $auth" push "$@"
}

consume_human_gate_atomically() {
  verify_direct_human_gate_live || { error "direct HUMAN_GATE is invalid before consumption"; return 1; }
  verify_rc_lineage || { error "RC lineage changed before consumption"; return 1; }
  verify_server_side_tag_protection >/dev/null || { error "required server-side tag protection is absent"; return 1; }

  if stable_tag_sha >/dev/null 2>&1 || control_lock_tag_sha >/dev/null 2>&1; then
    error "publication refs already exist; direct consumption requires both refs absent"
    return 1
  fi

  local lock_sha
  lock_sha="$(create_publication_lock_commit "$HEAD_SHA")" || return 1

  # This is the irreversible authorization-consumption boundary. The branch
  # update is deliberately non-noop, so the expected old HEAD is transmitted
  # to receive-pack. --atomic makes branch lock + stable tag + control-lock tag
  # all-or-none. If the live control branch moved, no publication ref is created.
  if ! git_atomic_push_with_token \
    --atomic \
    --force-with-lease="refs/heads/$CONTROL_BRANCH:$HEAD_SHA" \
    origin \
    "$lock_sha:refs/heads/$CONTROL_BRANCH" \
    "$RC3_SHA:refs/tags/$STABLE_TAG" \
    "$lock_sha:refs/tags/$CONTROL_LOCK_TAG" \
    >/tmp/mcf-stable-consume.out 2>/tmp/mcf-stable-consume.err; then
    cat /tmp/mcf-stable-consume.err >&2 || true
    error "atomic HUMAN_GATE consumption failed"
    return 1
  fi

  test "$(git ls-remote origin "refs/heads/$CONTROL_BRANCH" | cut -f1)" = "$lock_sha" || return 1
  test "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)" = "$RC3_SHA" || return 1
  test "$(git ls-remote origin "refs/tags/$CONTROL_LOCK_TAG" | cut -f1)" = "$lock_sha" || return 1

  echo "consumed_lock_sha=$lock_sha"
  echo "publication_state=CONSUMED_AWAITING_FRESH_RECOVERY"
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

  local stable_sha="" lock_sha="" current_release
  stable_sha="$(stable_tag_sha 2>/dev/null || true)"
  lock_sha="$(control_lock_tag_sha 2>/dev/null || true)"

  if [[ -z "$stable_sha" && -z "$lock_sha" ]]; then
    consume_human_gate_atomically
    # Deliberately stop after the first irreversible mutation. Release creation
    # is a fresh recovery execution against the protected consumed refs.
    return 0
  fi

  if [[ -z "$stable_sha" || -z "$lock_sha" ]]; then
    error "partial publication refs are inconsistent"
    return 1
  fi

  verify_consumed_authorization || return 1

  if current_release="$(release_json)"; then
    validate_exact_release_json "$current_release" || {
      error "existing stable release is incompatible"
      return 1
    }
    echo "stable_release_state=EXISTING_EXACT_RECOVERY_NOOP"
    return 0
  fi

  # After consumption, live PR HEAD is no longer the authority. The protected
  # control-lock tag is the immutable receipt. A later PR commit cannot reuse or
  # revoke the consumed approval; before consumption, any HEAD change makes the
  # atomic branch lease fail. This explicitly closes the snapshot/revocation gap.
  verify_consumed_authorization || return 1

  gh_release_create "$STABLE_TAG" \
    --repo "$REPOSITORY" \
    --verify-tag \
    --target "$RC3_SHA" \
    --title 'MCF v1.0.0' \
    --notes 'First stable MCF v1.0.0 release. Promoted from the fully qualified v1.0.0-RC3 candidate after exact-SHA production qualification, protected server-side authorization consumption, independent review, Class C controls and explicit LEANDRO HUMAN_GATE.' \
    --latest || return 1

  current_release="$(release_json)" || return 1
  validate_exact_release_json "$current_release" || return 1
  verify_consumed_authorization || return 1
  test "$(gh_api "repos/$REPOSITORY/releases/latest" --jq '.tag_name')" = "$STABLE_TAG" || return 1

  echo "stable_release_state=CREATED_EXACT"
}

self_test_receipt_predicate() {
  local pass=0 parent=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  local base approved json bad stale
  base="$(expected_unapproved_receipt)"
  approved="$(expected_approved_receipt "$parent")"
  json="$(jq -n --arg p "$parent" --arg m "$APPROVAL_COMMIT_MESSAGE" --arg f "$APPROVAL_FILE" '{author:{login:"leon337",id:25374535},committer:{login:"web-flow",id:19864447},commit:{message:$m,verification:{verified:true,reason:"valid"}},parents:[{sha:$p}],files:[{filename:$f,status:"modified"}]}')"

  validate_human_gate_commit_json "$json" "$approved" "$base" >/dev/null && pass=$((pass+1))
  bad="$(jq '.committer={login:"chatgpt-codex-connector[bot]",id:199175422}|.commit.verification={verified:false,reason:"unsigned"}' <<<"$json")"
  if ! validate_human_gate_commit_json "$bad" "$approved" "$base" >/dev/null 2>&1; then pass=$((pass+1)); fi
  stale="$(expected_approved_receipt bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb)"
  if ! validate_human_gate_commit_json "$json" "$stale" "$base" >/dev/null 2>&1; then pass=$((pass+1)); fi
  if ! validate_human_gate_commit_json "$json" "$base" "$base" >/dev/null 2>&1; then pass=$((pass+1)); fi
  echo "$pass"
}

self_test_ruleset_predicate() {
  local pass=0 good missing_update wrong_ref
  good="$(jq -n --arg stable "refs/tags/$STABLE_TAG" --arg lock "refs/tags/$CONTROL_LOCK_TAG" '{target:"tag",enforcement:"active",conditions:{ref_name:{include:[$stable,$lock],exclude:[]}},rules:[{type:"update",parameters:{update_allows_fetch_and_merge:false}},{type:"deletion"}]}')"
  ruleset_details_satisfy_contract "$good" && pass=$((pass+1))
  missing_update="$(jq ' .rules=[{"type":"deletion"}]' <<<"$good")"
  if ! ruleset_details_satisfy_contract "$missing_update"; then pass=$((pass+1)); fi
  wrong_ref="$(jq '.conditions.ref_name.include=["refs/tags/other"]' <<<"$good")"
  if ! ruleset_details_satisfy_contract "$wrong_ref"; then pass=$((pass+1)); fi
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
    approved="$(git rev-parse HEAD)"
    tree="$(git rev-parse "$approved^{tree}")"
    lock="$(git commit-tree "$tree" -p "$approved" <<<"lock")"
    test "$lock" != "$approved"
    GIT_TRACE_PACKET=1 git push --atomic \
      --force-with-lease="refs/heads/$CONTROL_BRANCH:$approved" \
      origin \
      "$lock:refs/heads/$CONTROL_BRANCH" \
      "$approved:refs/tags/$STABLE_TAG" \
      "$lock:refs/tags/$CONTROL_LOCK_TAG" \
      >/dev/null 2>"$root/packet.log"
    grep -F "refs/heads/$CONTROL_BRANCH" "$root/packet.log" >/dev/null
    test "$(git ls-remote origin "refs/heads/$CONTROL_BRANCH" | cut -f1)" = "$lock"
    test "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)" = "$approved"
    test "$(git ls-remote origin "refs/tags/$CONTROL_LOCK_TAG" | cut -f1)" = "$lock"
  )
  pass=$((pass+1))
  echo "PASS: non-noop control-head CAS is transmitted with both publication refs" >&2

  setup_repo moved-head
  git clone "$root/moved-head.git" "$root/moved-head-b" >/dev/null 2>&1
  (
    cd "$root/moved-head-a"
    approved="$(git rev-parse HEAD)"
    tree="$(git rev-parse "$approved^{tree}")"
    lock="$(git commit-tree "$tree" -p "$approved" <<<"lock")"
    printf '%s\n%s\n' "$approved" "$lock" >"$root/stale-values"
  )
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
    approved="$(sed -n '1p' "$root/stale-values")"
    lock="$(sed -n '2p' "$root/stale-values")"
    if git push --atomic \
      --force-with-lease="refs/heads/$CONTROL_BRANCH:$approved" \
      origin \
      "$lock:refs/heads/$CONTROL_BRANCH" \
      "$approved:refs/tags/$STABLE_TAG" \
      "$lock:refs/tags/$CONTROL_LOCK_TAG" \
      >/dev/null 2>&1; then
      echo "FAIL: stale control HEAD unexpectedly passed server-side CAS" >&2
      return 1
    fi
    test -z "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)"
    test -z "$(git ls-remote origin "refs/tags/$CONTROL_LOCK_TAG" | cut -f1)"
  )
  pass=$((pass+1))
  echo "PASS: control HEAD moved immediately before transaction -> no publication refs" >&2
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
    write_state stable "${1:-ABSENT}"
    write_state lock "${2:-ABSENT}"
    write_state release "${3:-ABSENT}"
    write_state gate "${4:-VALID}"
    write_state protection "${5:-VALID}"
    write_state consume_mode "${6:-SUCCESS}"
    write_state release_create_calls 0
    write_state consume_calls 0
  }

  require_runtime_env() { return 0; }
  verify_rc_lineage() { return 0; }
  verify_server_side_tag_protection() { test "$(read_state protection)" = VALID; }
  verify_live_pr_head() { test "$(read_state gate)" != HEAD_CHANGED; }
  verify_human_gate_commit_at_ref() { test "$(read_state gate)" = VALID; }
  verify_direct_human_gate_live() { test "$(read_state gate)" = VALID; }

  stable_tag_sha() {
    case "$(read_state stable)" in
      ABSENT) return 1 ;;
      RC3) printf '%s\n' "$RC3_SHA" ;;
      WRONG) printf '%s\n' cccccccccccccccccccccccccccccccccccccccc ;;
    esac
  }
  control_lock_tag_sha() {
    case "$(read_state lock)" in
      ABSENT) return 1 ;;
      LOCK) printf '%s\n' eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee ;;
      WRONG) printf '%s\n' ffffffffffffffffffffffffffffffffffffffff ;;
    esac
  }

  verify_consumed_authorization() {
    test "$(read_state protection)" = VALID || return 1
    test "$(read_state stable)" = RC3 || return 1
    test "$(read_state lock)" = LOCK || return 1
    case "$(read_state gate)" in
      STALE|APP|ABSENT) return 1 ;;
      *) return 0 ;;
    esac
  }

  consume_human_gate_atomically() {
    inc_counter consume_calls
    test "$(read_state gate)" = VALID || return 1
    test "$(read_state protection)" = VALID || return 1
    case "$(read_state consume_mode)" in
      SUCCESS)
        write_state stable RC3
        write_state lock LOCK
        echo publication_state=CONSUMED_AWAITING_FRESH_RECOVERY
        return 0
        ;;
      HEAD_CHANGED)
        return 1
        ;;
      *) return 1 ;;
    esac
  }

  release_json() {
    case "$(read_state release)" in
      ABSENT) return 1 ;;
      EXACT) jq -n --arg tag "$STABLE_TAG" --arg sha "$RC3_SHA" '{tag_name:$tag,target_commitish:$sha,draft:false,prerelease:false}' ;;
      INCOMPATIBLE) jq -n --arg tag "$STABLE_TAG" '{tag_name:$tag,target_commitish:"dddddddddddddddddddddddddddddddddddddddd",draft:false,prerelease:false}' ;;
    esac
  }
  gh_release_create() {
    inc_counter release_create_calls
    test "$(read_state stable)" = RC3
    test "$(read_state lock)" = LOCK
    write_state release EXACT
  }
  gh_api() {
    if [[ "${1:-}" == *"/releases/latest" ]]; then printf '%s\n' "$STABLE_TAG"; return 0; fi
    return 97
  }

  passed() { pass=$((pass+1)); echo "PASS: $1" >&2; }
  failed() { echo "FAIL: $1" >&2; return 1; }
  no_release_writes() { test "$(read_state release_create_calls)" = 0; }
  no_consumption() { test "$(read_state consume_calls)" = 0; }

  reset_state ABSENT ABSENT ABSENT VALID VALID SUCCESS
  if publish_or_recover >/dev/null 2>&1 && test "$(read_state consume_calls)" = 1 && no_release_writes && test "$(read_state stable)" = RC3 && test "$(read_state lock)" = LOCK; then passed "valid HUMAN_GATE consumes into refs but does not publish Release in same run"; else failed "valid HUMAN_GATE consumes into refs"; fi

  reset_state ABSENT ABSENT ABSENT VALID VALID HEAD_CHANGED
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes && test "$(read_state stable)" = ABSENT && test "$(read_state lock)" = ABSENT; then passed "HEAD moves at consumption boundary -> no tag/release"; else failed "HEAD moves at consumption boundary"; fi

  reset_state RC3 LOCK ABSENT VALID VALID SUCCESS
  if publish_or_recover >/dev/null 2>&1 && test "$(read_state release_create_calls)" = 1; then passed "exact protected consumed refs + no Release -> safe recovery"; else failed "tag-only recovery"; fi

  reset_state WRONG LOCK ABSENT VALID VALID SUCCESS
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "wrong-SHA stable tag -> fail closed"; else failed "wrong tag"; fi

  reset_state RC3 ABSENT ABSENT VALID VALID SUCCESS
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "stable tag without control lock -> fail closed"; else failed "missing lock"; fi

  reset_state RC3 LOCK EXACT VALID VALID SUCCESS
  if publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "exact protected refs + exact Release -> idempotent NOOP"; else failed "exact NOOP"; fi

  reset_state RC3 LOCK INCOMPATIBLE VALID VALID SUCCESS
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes; then passed "incompatible Release -> fail closed"; else failed "incompatible release"; fi

  reset_state ABSENT ABSENT ABSENT ABSENT VALID SUCCESS
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes && test "$(read_state stable)" = ABSENT; then passed "HUMAN_GATE absent -> no mutation"; else failed "absent gate"; fi

  reset_state ABSENT ABSENT ABSENT STALE VALID SUCCESS
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes && test "$(read_state stable)" = ABSENT; then passed "stale receipt -> no mutation"; else failed "stale receipt"; fi

  reset_state ABSENT ABSENT ABSENT APP VALID SUCCESS
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes && test "$(read_state stable)" = ABSENT; then passed "App/invalid receipt -> no mutation"; else failed "app receipt"; fi

  reset_state ABSENT ABSENT ABSENT VALID MISSING SUCCESS
  if ! publish_or_recover >/dev/null 2>&1 && no_release_writes && test "$(read_state stable)" = ABSENT; then passed "missing server-side tag protection -> no mutation"; else failed "missing protection"; fi

  reset_state RC3 LOCK ABSENT HEAD_CHANGED VALID SUCCESS
  if publish_or_recover >/dev/null 2>&1 && test "$(read_state release_create_calls)" = 1; then passed "after consumption, later PR HEAD movement cannot invalidate protected consumed authority"; else failed "consumed authority recovery"; fi

  echo "$pass"
)

self_test() {
  local receipt ruleset atomic_git real total
  receipt="$(self_test_receipt_predicate)"
  ruleset="$(self_test_ruleset_predicate)"
  atomic_git="$(self_test_atomic_git_boundary)"
  real="$(self_test_real_state_machine)"
  total=$((receipt + ruleset + atomic_git + real))

  echo "publication_boundary_receipt_tests=$receipt"
  echo "publication_boundary_ruleset_tests=$ruleset"
  echo "publication_boundary_atomic_git_tests=$atomic_git"
  echo "publication_boundary_real_state_machine_tests=$real"
  echo "publication_boundary_self_tests=$total"

  test "$receipt" = 4
  test "$ruleset" = 3
  test "$atomic_git" = 2
  test "$real" = 12
  test "$total" = 21
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    publish) publish_or_recover ;;
    verify-human-gate) verify_direct_human_gate_live ;;
    verify-effective-gate) verify_effective_human_gate ;;
    verify-consumed-gate) verify_consumed_authorization ;;
    protection-status) verify_server_side_tag_protection ;;
    self-test) self_test ;;
    *) echo "usage: $0 {publish|verify-human-gate|verify-effective-gate|verify-consumed-gate|protection-status|self-test}" >&2; exit 2 ;;
  esac
fi
