#!/usr/bin/env bash
set -euo pipefail

GH_BIN="${GH_BIN:-gh}"
REPOSITORY="${REPOSITORY:-}"
PR_NUMBER="${PR_NUMBER:-133}"
PUBLISHER_BRANCH="${PUBLISHER_BRANCH:-release/v1.0.0-stable-publish}"
APPROVAL_BRANCH="${APPROVAL_BRANCH:-release/v1.0.0-human-gate}"
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
APPROVAL_FILE="${APPROVAL_FILE:-LEANDRO-HUMAN-GATE.yaml}"
APPROVAL_COMMIT_MESSAGE="${APPROVAL_COMMIT_MESSAGE:-HUMAN_GATE: approve MCF v1.0.0}"
LOCK_MESSAGE_TITLE="${LOCK_MESSAGE_TITLE:-MCF stable publication authorization consumed}"
RELEASE_TITLE="${RELEASE_TITLE:-MCF v1.0.0}"
RELEASE_NOTES="${RELEASE_NOTES:-First stable MCF v1.0.0 release. Promoted from the fully qualified v1.0.0-RC3 candidate after exact-SHA production qualification, protected server-side authorization consumption, independent review, Class C controls and explicit LEANDRO HUMAN_GATE.}"

error() { echo "ERROR: $*" >&2; }
gh_api() { "$GH_BIN" api "$@"; }
gh_release_create() { "$GH_BIN" release create "$@"; }

require_runtime_env() {
  test -n "$REPOSITORY" || return 1
  test -n "$HEAD_SHA" || return 1
}

read_content_b64_at_ref() {
  local path="$1" ref="$2"
  gh_api "repos/$REPOSITORY/contents/$path?ref=$ref" --jq '.content' | tr -d '\r\n'
}

encode_exact_b64() {
  base64 | tr -d '\r\n'
}

read_git_ref_sha() {
  local ref_path="$1" tmp
  tmp="$(mktemp)"
  if gh_api "repos/$REPOSITORY/git/ref/$ref_path" >"$tmp" 2>/dev/null; then
    jq -r '.object.sha' "$tmp"
    rm -f "$tmp"
    return 0
  fi
  rm -f "$tmp"
  return 1
}

publisher_branch_sha() { read_git_ref_sha "heads/$PUBLISHER_BRANCH"; }
approval_branch_sha() { read_git_ref_sha "heads/$APPROVAL_BRANCH"; }
stable_tag_sha() { read_git_ref_sha "tags/$STABLE_TAG"; }
control_lock_tag_sha() { read_git_ref_sha "tags/$CONTROL_LOCK_TAG"; }

verify_rc_lineage() {
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC1" --jq '.object.sha')" = "$RC1_SHA" || return 1
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC2" --jq '.object.sha')" = "$RC2_SHA" || return 1
  test "$(gh_api "repos/$REPOSITORY/git/ref/tags/v1.0.0-RC3" --jq '.object.sha')" = "$RC3_SHA" || return 1
}

live_pr_head() {
  gh_api "repos/$REPOSITORY/pulls/$PR_NUMBER" --jq '.head.sha'
}

verify_publisher_identity() {
  require_runtime_env || return 1
  test "$(publisher_branch_sha)" = "$HEAD_SHA" || return 1
  test "$(live_pr_head)" = "$HEAD_SHA" || return 1
}

expected_unapproved_receipt() {
  printf 'authority: LEANDRO\nstate: NAO_APROVADO\nrelease: %s\napproved_publisher_head: null\nrc3: %s\napproval_method: GITHUB_WEB_VERIFIED_COMMIT_REQUIRED\n' "$STABLE_TAG" "$RC3_SHA"
}

expected_approved_receipt() {
  local publisher_sha="$1"
  printf 'authority: LEANDRO\nstate: APROVADO\nrelease: %s\napproved_publisher_head: %s\nrc3: %s\napproval_method: GITHUB_WEB_VERIFIED_COMMIT\n' "$STABLE_TAG" "$publisher_sha" "$RC3_SHA"
}

validate_human_gate_commit_json() {
  local commit_json="$1" approval_b64="$2" parent_b64="$3" expected_publisher_sha="$4"
  local expected_approval_b64 expected_parent_b64
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
  expected_approval_b64="$(expected_approved_receipt "$expected_publisher_sha" | encode_exact_b64)"
  expected_parent_b64="$(expected_unapproved_receipt | encode_exact_b64)"
  test "$approval_b64" = "$expected_approval_b64" || return 1
  test "$parent_b64" = "$expected_parent_b64" || return 1
  jq -r '.sha' <<<"$commit_json"
}

verify_human_gate_commit_at_ref() {
  local ref="$1" expected_publisher_sha="$2" commit_json parent_sha approval_b64 parent_b64
  commit_json="$(gh_api "repos/$REPOSITORY/commits/$ref")" || return 1
  parent_sha="$(jq -r '.parents[0].sha // empty' <<<"$commit_json")"
  test -n "$parent_sha" || return 1
  approval_b64="$(read_content_b64_at_ref "$APPROVAL_FILE" "$ref")" || return 1
  parent_b64="$(read_content_b64_at_ref "$APPROVAL_FILE" "$parent_sha")" || return 1
  validate_human_gate_commit_json "$commit_json" "$approval_b64" "$parent_b64" "$expected_publisher_sha"
}

verify_direct_human_gate_live() {
  require_runtime_env || return 1
  verify_publisher_identity || return 1
  local approval_sha
  approval_sha="$(approval_branch_sha)" || { error "approval branch is absent"; return 1; }
  verify_human_gate_commit_at_ref "$approval_sha" "$HEAD_SHA"
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

verify_exact_stable_tag() {
  local sha
  sha="$(stable_tag_sha)" || { error "stable tag is absent"; return 1; }
  test "$(classify_stable_sha "$sha")" = EXACT || { error "stable tag points to divergent SHA: $sha"; return 1; }
}

ruleset_base_contract() {
  local json="$1" target="$2"
  test "$(jq -r '.target' <<<"$json")" = "$target" || return 1
  test "$(jq -r '.enforcement' <<<"$json")" = active || return 1
  test "$(jq '(.bypass_actors // []) | length' <<<"$json")" = 0 || return 1
  test "$(jq '(.conditions.ref_name.exclude // []) | length' <<<"$json")" = 0 || return 1
}

tag_ruleset_details_satisfy_contract() {
  local json="$1"
  ruleset_base_contract "$json" tag || return 1
  jq -e --arg stable "refs/tags/$STABLE_TAG" '.conditions.ref_name.include | index($stable) != null' <<<"$json" >/dev/null || return 1
  jq -e --arg lock "refs/tags/$CONTROL_LOCK_TAG" '.conditions.ref_name.include | index($lock) != null' <<<"$json" >/dev/null || return 1
  jq -e '[.rules[].type] | index("update") != null' <<<"$json" >/dev/null || return 1
  jq -e '[.rules[].type] | index("deletion") != null' <<<"$json" >/dev/null || return 1
  jq -e '[.rules[].type] | index("creation") == null' <<<"$json" >/dev/null || return 1
}

publisher_ruleset_details_satisfy_contract() {
  local json="$1"
  ruleset_base_contract "$json" branch || return 1
  jq -e --arg branch "refs/heads/$PUBLISHER_BRANCH" '.conditions.ref_name.include | index($branch) != null' <<<"$json" >/dev/null || return 1
  jq -e '[.rules[].type] | index("update") != null' <<<"$json" >/dev/null || return 1
  jq -e '[.rules[].type] | index("deletion") != null' <<<"$json" >/dev/null || return 1
}

verify_server_side_publication_protection() {
  local ids id details tag_id="" publisher_id=""
  ids="$(gh_api "repos/$REPOSITORY/rulesets?includes_parents=true&per_page=100" --jq '.[] | select(.enforcement == "active") | .id')" || return 1
  while IFS= read -r id; do
    [[ -n "$id" ]] || continue
    details="$(gh_api "repos/$REPOSITORY/rulesets/$id")" || continue
    if [[ -z "$tag_id" ]] && tag_ruleset_details_satisfy_contract "$details"; then tag_id="$id"; fi
    if [[ -z "$publisher_id" ]] && publisher_ruleset_details_satisfy_contract "$details"; then publisher_id="$id"; fi
  done <<<"$ids"
  test -n "$tag_id" || { error "no active tag ruleset with update/deletion, creation allowed, zero bypass/exclusions protects both publication tags"; return 1; }
  test -n "$publisher_id" || { error "no active whole-branch publisher ruleset with update/deletion and zero bypass/exclusions protects the immutable publisher"; return 1; }
  printf 'tag_ruleset=%s publisher_ruleset=%s\n' "$tag_id" "$publisher_id"
}

lock_commit_message() {
  local publisher_sha="$1" approval_sha="$2"
  printf '%s\n\npublisher_head: %s\napproval_commit: %s\ncandidate_sha: %s\nrelease: %s\napproval_ref: refs/heads/%s\n' \
    "$LOCK_MESSAGE_TITLE" "$publisher_sha" "$approval_sha" "$RC3_SHA" "$STABLE_TAG" "$APPROVAL_BRANCH"
}

fetch_approval_commit_for_git() {
  local approval_sha="$1"
  git fetch --no-tags origin "refs/heads/$APPROVAL_BRANCH:refs/remotes/origin/$APPROVAL_BRANCH" >/dev/null 2>&1 || return 1
  git cat-file -e "$approval_sha^{commit}" || return 1
}

create_publication_lock_commit() {
  local publisher_sha="$1" approval_sha="$2" tree lock_sha
  fetch_approval_commit_for_git "$approval_sha" || return 1
  tree="$(git rev-parse "$approval_sha^{tree}")" || return 1
  lock_sha="$(
    GIT_AUTHOR_NAME='MCF Stable Publication Gate' \
    GIT_AUTHOR_EMAIL='41898282+github-actions[bot]@users.noreply.github.com' \
    GIT_COMMITTER_NAME='MCF Stable Publication Gate' \
    GIT_COMMITTER_EMAIL='41898282+github-actions[bot]@users.noreply.github.com' \
    git commit-tree "$tree" -p "$approval_sha" <<<"$(lock_commit_message "$publisher_sha" "$approval_sha")"
  )" || return 1
  test "$lock_sha" != "$approval_sha" || return 1
  printf '%s' "$lock_sha"
}

validate_publication_lock_commit_json() {
  local lock_json="$1" expected_lock_sha="$2" expected_publisher_sha="$3"
  local approval_sha parent_json expected_message
  test "$(jq -r '.sha' <<<"$lock_json")" = "$expected_lock_sha" || return 1
  test "$(jq '.parents | length' <<<"$lock_json")" = 1 || return 1
  test "$(jq '.files | length' <<<"$lock_json")" = 0 || return 1
  approval_sha="$(jq -r '.parents[0].sha // empty' <<<"$lock_json")"
  test -n "$approval_sha" || return 1
  expected_message="$(lock_commit_message "$expected_publisher_sha" "$approval_sha")"
  test "$(jq -r '.commit.message' <<<"$lock_json")" = "$expected_message" || return 1
  parent_json="$(gh_api "repos/$REPOSITORY/commits/$approval_sha")" || return 1
  test "$(jq -r '.commit.tree.sha' <<<"$lock_json")" = "$(jq -r '.commit.tree.sha' <<<"$parent_json")" || return 1
  verify_human_gate_commit_at_ref "$approval_sha" "$expected_publisher_sha" >/dev/null || return 1
  printf '%s' "$approval_sha"
}

verify_consumed_authorization() {
  require_runtime_env || return 1
  verify_publisher_identity || return 1
  verify_rc_lineage || return 1
  verify_server_side_publication_protection >/dev/null || return 1
  verify_exact_stable_tag || return 1

  local lock_sha lock_json
  lock_sha="$(control_lock_tag_sha)" || { error "control lock tag is absent"; return 1; }
  lock_json="$(gh_api "repos/$REPOSITORY/commits/$lock_sha")" || return 1
  validate_publication_lock_commit_json "$lock_json" "$lock_sha" "$HEAD_SHA" >/dev/null || {
    error "control lock tag does not encode consumed authority for this publisher SHA"
    return 1
  }
}

verify_effective_human_gate() {
  if verify_consumed_authorization; then
    echo CONSUMED_PROTECTED
    return 0
  fi
  if verify_direct_human_gate_live >/dev/null; then
    echo DIRECT_UNCONSUMED
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
  local approval_sha stable_sha="" existing_lock="" lock_sha
  approval_sha="$(verify_direct_human_gate_live)" || { error "direct HUMAN_GATE is invalid before consumption"; return 1; }
  verify_rc_lineage || { error "RC lineage changed before consumption"; return 1; }
  verify_server_side_publication_protection >/dev/null || { error "required server-side publication protection is absent"; return 1; }

  stable_sha="$(stable_tag_sha 2>/dev/null || true)"
  existing_lock="$(control_lock_tag_sha 2>/dev/null || true)"

  test -z "$existing_lock" || { error "control lock already exists; direct consumption is not allowed"; return 1; }
  if [[ -n "$stable_sha" && "$stable_sha" != "$RC3_SHA" ]]; then
    error "existing stable tag is divergent before authorization consumption"
    return 1
  fi

  lock_sha="$(create_publication_lock_commit "$HEAD_SHA" "$approval_sha")" || return 1

  local -a push_args
  push_args=(
    --atomic
    --force-with-lease="refs/heads/$APPROVAL_BRANCH:$approval_sha"
    origin
    "$lock_sha:refs/heads/$APPROVAL_BRANCH"
    "$lock_sha:refs/tags/$CONTROL_LOCK_TAG"
  )
  if [[ -z "$stable_sha" ]]; then push_args+=("$RC3_SHA:refs/tags/$STABLE_TAG"); fi

  if ! git_atomic_push_with_token "${push_args[@]}" >/tmp/mcf-stable-consume.out 2>/tmp/mcf-stable-consume.err; then
    cat /tmp/mcf-stable-consume.err >&2 || true
    error "atomic HUMAN_GATE consumption failed"
    return 1
  fi

  test "$(git ls-remote origin "refs/heads/$PUBLISHER_BRANCH" | cut -f1)" = "$HEAD_SHA" || return 1
  test "$(git ls-remote origin "refs/heads/$APPROVAL_BRANCH" | cut -f1)" = "$lock_sha" || return 1
  test "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)" = "$RC3_SHA" || return 1
  test "$(git ls-remote origin "refs/tags/$CONTROL_LOCK_TAG" | cut -f1)" = "$lock_sha" || return 1

  echo "consumed_lock_sha=$lock_sha"
  echo "consumed_approval_sha=$approval_sha"
  if [[ -n "$stable_sha" ]]; then
    echo "publication_state=EXACT_TAG_ADOPTED_AWAITING_SAME_PUBLISHER_RERUN"
  else
    echo "publication_state=CONSUMED_AWAITING_SAME_PUBLISHER_RERUN"
  fi
}

release_json() { gh_api "repos/$REPOSITORY/releases/tags/$STABLE_TAG" 2>/dev/null; }

validate_exact_release_json() {
  local json="$1"
  test "$(jq -r '.tag_name' <<<"$json")" = "$STABLE_TAG" || return 1
  test "$(jq -r '.target_commitish' <<<"$json")" = "$RC3_SHA" || return 1
  test "$(jq -r '.draft' <<<"$json")" = false || return 1
  test "$(jq -r '.prerelease' <<<"$json")" = false || return 1
  test "$(jq -r '.name' <<<"$json")" = "$RELEASE_TITLE" || return 1
  test "$(jq -r '.body' <<<"$json")" = "$RELEASE_NOTES" || return 1
}

verify_latest_release() {
  test "$(gh_api "repos/$REPOSITORY/releases/latest" --jq '.tag_name')" = "$STABLE_TAG" || return 1
}

publish_or_recover() {
  require_runtime_env || return 1

  local stable_sha="" lock_sha="" current_release
  stable_sha="$(stable_tag_sha 2>/dev/null || true)"
  lock_sha="$(control_lock_tag_sha 2>/dev/null || true)"

  if [[ -z "$lock_sha" ]]; then
    if [[ -n "$stable_sha" && "$stable_sha" != "$RC3_SHA" ]]; then
      error "stable tag is divergent and no consumed authorization exists"
      return 1
    fi
    consume_human_gate_atomically || return 1
    return 0
  fi

  if [[ -z "$stable_sha" ]]; then
    error "control lock exists without stable tag"
    return 1
  fi

  verify_consumed_authorization || return 1

  if current_release="$(release_json)"; then
    validate_exact_release_json "$current_release" || { error "existing stable release is incompatible"; return 1; }
    verify_latest_release || { error "existing exact stable release is not latest"; return 1; }
    echo "stable_release_state=EXISTING_EXACT_RECOVERY_NOOP"
    return 0
  fi

  verify_consumed_authorization || return 1

  gh_release_create "$STABLE_TAG" \
    --repo "$REPOSITORY" \
    --verify-tag \
    --target "$RC3_SHA" \
    --title "$RELEASE_TITLE" \
    --notes "$RELEASE_NOTES" \
    --latest || return 1

  current_release="$(release_json)" || return 1
  validate_exact_release_json "$current_release" || return 1
  verify_consumed_authorization || return 1
  verify_latest_release || return 1
  echo "stable_release_state=CREATED_EXACT"
}

self_test_receipt_predicate() {
  local pass=0 parent=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa publisher=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
  local base_b64 approved_b64 json bad stale_b64 wrong_rc3_b64 missing_b64 extra_b64 missing_parent_b64 extra_parent_b64
  base_b64="$(expected_unapproved_receipt | encode_exact_b64)"
  approved_b64="$(expected_approved_receipt "$publisher" | encode_exact_b64)"
  json="$(jq -n --arg sha cccccccccccccccccccccccccccccccccccccccc --arg p "$parent" --arg m "$APPROVAL_COMMIT_MESSAGE" --arg f "$APPROVAL_FILE" '{sha:$sha,author:{login:"leon337",id:25374535},committer:{login:"web-flow",id:19864447},commit:{message:$m,verification:{verified:true,reason:"valid"}},parents:[{sha:$p}],files:[{filename:$f,status:"modified"}]}')"
  validate_human_gate_commit_json "$json" "$approved_b64" "$base_b64" "$publisher" >/dev/null && pass=$((pass+1))
  bad="$(jq '.committer={login:"chatgpt-codex-connector[bot]",id:199175422}|.commit.verification={verified:false,reason:"unsigned"}' <<<"$json")"
  if ! validate_human_gate_commit_json "$bad" "$approved_b64" "$base_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  stale_b64="$(expected_approved_receipt dddddddddddddddddddddddddddddddddddddddd | encode_exact_b64)"
  if ! validate_human_gate_commit_json "$json" "$stale_b64" "$base_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  if ! validate_human_gate_commit_json "$json" "$base_b64" "$base_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  wrong_rc3_b64="$(expected_approved_receipt "$publisher" | sed "s/$RC3_SHA/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee/" | encode_exact_b64)"
  if ! validate_human_gate_commit_json "$json" "$wrong_rc3_b64" "$base_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  bad="$(jq '.files[0].filename="other.yaml"' <<<"$json")"
  if ! validate_human_gate_commit_json "$bad" "$approved_b64" "$base_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi

  missing_b64="$(printf '%s' "$(expected_approved_receipt "$publisher")" | encode_exact_b64)"
  if ! validate_human_gate_commit_json "$json" "$missing_b64" "$base_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  extra_b64="$( { expected_approved_receipt "$publisher"; printf '\n'; } | encode_exact_b64)"
  if ! validate_human_gate_commit_json "$json" "$extra_b64" "$base_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  missing_parent_b64="$(printf '%s' "$(expected_unapproved_receipt)" | encode_exact_b64)"
  if ! validate_human_gate_commit_json "$json" "$approved_b64" "$missing_parent_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  extra_parent_b64="$( { expected_unapproved_receipt; printf '\n'; } | encode_exact_b64)"
  if ! validate_human_gate_commit_json "$json" "$approved_b64" "$extra_parent_b64" "$publisher" >/dev/null 2>&1; then pass=$((pass+1)); fi
  echo "$pass"
}

self_test_ruleset_predicate() {
  local pass=0 tag_good publisher_good candidate
  tag_good="$(jq -n --arg stable "refs/tags/$STABLE_TAG" --arg lock "refs/tags/$CONTROL_LOCK_TAG" '{target:"tag",enforcement:"active",bypass_actors:[],conditions:{ref_name:{include:[$stable,$lock],exclude:[]}},rules:[{type:"update"},{type:"deletion"}]}')"
  tag_ruleset_details_satisfy_contract "$tag_good" && pass=$((pass+1))
  candidate="$(jq '.rules=[{"type":"deletion"}]' <<<"$tag_good")"; if ! tag_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
  candidate="$(jq '.conditions.ref_name.include=["refs/tags/other"]' <<<"$tag_good")"; if ! tag_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
  candidate="$(jq '.bypass_actors=[{"actor_id":1,"actor_type":"RepositoryRole","bypass_mode":"always"}]' <<<"$tag_good")"; if ! tag_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
  candidate="$(jq --arg stable "refs/tags/$STABLE_TAG" '.conditions.ref_name.exclude=[$stable]' <<<"$tag_good")"; if ! tag_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
  candidate="$(jq '.rules += [{"type":"creation"}]' <<<"$tag_good")"; if ! tag_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi

  publisher_good="$(jq -n --arg branch "refs/heads/$PUBLISHER_BRANCH" '{target:"branch",enforcement:"active",bypass_actors:[],conditions:{ref_name:{include:[$branch],exclude:[]}},rules:[{type:"update"},{type:"deletion"}]}')"
  publisher_ruleset_details_satisfy_contract "$publisher_good" && pass=$((pass+1))
  candidate="$(jq '.rules=[{"type":"deletion"}]' <<<"$publisher_good")"; if ! publisher_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
  candidate="$(jq '.conditions.ref_name.include=["refs/heads/other"]' <<<"$publisher_good")"; if ! publisher_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
  candidate="$(jq '.conditions.ref_name.exclude=["refs/heads/release/*"]' <<<"$publisher_good")"; if ! publisher_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
  candidate="$(jq '.bypass_actors=[{"actor_id":1,"actor_type":"RepositoryRole","bypass_mode":"always"}]' <<<"$publisher_good")"; if ! publisher_ruleset_details_satisfy_contract "$candidate"; then pass=$((pass+1)); fi
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
      printf 'publisher\n' >publisher.txt
      git add publisher.txt
      git commit -m publisher >/dev/null
      git branch -M "$PUBLISHER_BRANCH"
      git push origin "$PUBLISHER_BRANCH" >/dev/null
      publisher="$(git rev-parse HEAD)"
      git checkout --orphan approval >/dev/null 2>&1
      git rm -rf . >/dev/null 2>&1 || true
      printf 'authority: LEANDRO\nstate: APROVADO\n' >"$APPROVAL_FILE"
      git add "$APPROVAL_FILE"
      git commit -m approval >/dev/null
      git branch -M "$APPROVAL_BRANCH"
      git push origin "$APPROVAL_BRANCH" >/dev/null
      printf '%s\n' "$publisher" >"$root/$name-publisher"
    )
  }

  setup_repo stable
  (
    cd "$root/stable-a"
    publisher="$(cat "$root/stable-publisher")"
    approval="$(git rev-parse HEAD)"
    tree="$(git rev-parse "$approval^{tree}")"
    lock="$(git commit-tree "$tree" -p "$approval" <<<"lock")"
    git push --atomic --force-with-lease="refs/heads/$APPROVAL_BRANCH:$approval" origin \
      "$lock:refs/heads/$APPROVAL_BRANCH" "$publisher:refs/tags/$STABLE_TAG" "$lock:refs/tags/$CONTROL_LOCK_TAG" >/dev/null
    test "$(git ls-remote origin "refs/heads/$PUBLISHER_BRANCH" | cut -f1)" = "$publisher"
    test "$(git ls-remote origin "refs/heads/$APPROVAL_BRANCH" | cut -f1)" = "$lock"
    test "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)" = "$publisher"
    test "$(git ls-remote origin "refs/tags/$CONTROL_LOCK_TAG" | cut -f1)" = "$lock"
  ); pass=$((pass+1))

  setup_repo revoked
  git clone "$root/revoked.git" "$root/revoked-b" >/dev/null 2>&1
  (
    cd "$root/revoked-a"
    approval="$(git rev-parse HEAD)"
    tree="$(git rev-parse "$approval^{tree}")"
    lock="$(git commit-tree "$tree" -p "$approval" <<<"lock")"
    printf '%s\n%s\n' "$approval" "$lock" >"$root/revoked-values"
  )
  (
    cd "$root/revoked-b"
    git config user.email racer@example.invalid
    git config user.name racer
    git checkout "$APPROVAL_BRANCH" >/dev/null 2>&1
    printf 'revoked\n' >>"$APPROVAL_FILE"
    git commit -am revoked >/dev/null
    git push origin "$APPROVAL_BRANCH" >/dev/null
  )
  (
    cd "$root/revoked-a"
    publisher="$(cat "$root/revoked-publisher")"
    approval="$(sed -n '1p' "$root/revoked-values")"
    lock="$(sed -n '2p' "$root/revoked-values")"
    if git push --atomic --force-with-lease="refs/heads/$APPROVAL_BRANCH:$approval" origin \
      "$lock:refs/heads/$APPROVAL_BRANCH" "$publisher:refs/tags/$STABLE_TAG" "$lock:refs/tags/$CONTROL_LOCK_TAG" >/dev/null 2>&1; then return 1; fi
    test -z "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)"
    test -z "$(git ls-remote origin "refs/tags/$CONTROL_LOCK_TAG" | cut -f1)"
  ); pass=$((pass+1))

  setup_repo tagonly
  (
    cd "$root/tagonly-a"
    publisher="$(cat "$root/tagonly-publisher")"
    git tag "$STABLE_TAG" "$publisher"
    git push origin "refs/tags/$STABLE_TAG" >/dev/null
    approval="$(git rev-parse HEAD)"
    tree="$(git rev-parse "$approval^{tree}")"
    lock="$(git commit-tree "$tree" -p "$approval" <<<"lock")"
    git push --atomic --force-with-lease="refs/heads/$APPROVAL_BRANCH:$approval" origin \
      "$lock:refs/heads/$APPROVAL_BRANCH" "$lock:refs/tags/$CONTROL_LOCK_TAG" >/dev/null
    test "$(git ls-remote origin "refs/heads/$APPROVAL_BRANCH" | cut -f1)" = "$lock"
    test "$(git ls-remote origin "refs/tags/$STABLE_TAG" | cut -f1)" = "$publisher"
    test "$(git ls-remote origin "refs/tags/$CONTROL_LOCK_TAG" | cut -f1)" = "$lock"
  ); pass=$((pass+1))

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
    write_state approval "${4:-VALID}"
    write_state publisher "${5:-VALID}"
    write_state protection "${6:-VALID}"
    write_state consume_mode "${7:-SUCCESS}"
    write_state latest "${8:-EXACT}"
    write_state release_create_calls 0
    write_state consume_calls 0
  }

  require_runtime_env() { return 0; }
  verify_rc_lineage() { return 0; }
  verify_publisher_identity() { test "$(read_state publisher)" = VALID; }
  verify_server_side_publication_protection() { test "$(read_state protection)" = VALID; }
  verify_direct_human_gate_live() {
    test "$(read_state publisher)" = VALID || return 1
    test "$(read_state approval)" = VALID || return 1
    printf '%s\n' aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  }
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
    test "$(read_state publisher)" = VALID &&
    test "$(read_state protection)" = VALID &&
    test "$(read_state stable)" = RC3 &&
    test "$(read_state lock)" = LOCK
  }
  consume_human_gate_atomically() {
    inc_counter consume_calls
    test "$(read_state publisher)" = VALID || return 1
    test "$(read_state approval)" = VALID || return 1
    test "$(read_state protection)" = VALID || return 1
    test "$(read_state lock)" = ABSENT || return 1
    test "$(read_state stable)" != WRONG || return 1
    test "$(read_state consume_mode)" = SUCCESS || return 1
    if [[ "$(read_state stable)" = ABSENT ]]; then write_state stable RC3; fi
    write_state lock LOCK
    return 0
  }
  release_json() {
    case "$(read_state release)" in
      ABSENT) return 1 ;;
      EXACT) jq -n --arg tag "$STABLE_TAG" --arg sha "$RC3_SHA" --arg name "$RELEASE_TITLE" --arg body "$RELEASE_NOTES" '{tag_name:$tag,target_commitish:$sha,draft:false,prerelease:false,name:$name,body:$body}' ;;
      INCOMPATIBLE) jq -n --arg tag "$STABLE_TAG" --arg name "$RELEASE_TITLE" --arg body "$RELEASE_NOTES" '{tag_name:$tag,target_commitish:"dddddddddddddddddddddddddddddddddddddddd",draft:false,prerelease:false,name:$name,body:$body}' ;;
      BAD_METADATA) jq -n --arg tag "$STABLE_TAG" --arg sha "$RC3_SHA" '{tag_name:$tag,target_commitish:$sha,draft:false,prerelease:false,name:"wrong",body:"wrong"}' ;;
    esac
  }
  gh_release_create() {
    inc_counter release_create_calls
    test "$(read_state publisher)" = VALID
    test "$(read_state stable)" = RC3
    test "$(read_state lock)" = LOCK
    write_state release EXACT
    write_state latest EXACT
  }
  gh_api() {
    if [[ "${1:-}" == *"/releases/latest" ]]; then
      if [[ "$(read_state latest)" = EXACT ]]; then printf '%s\n' "$STABLE_TAG"; else printf '%s\n' other; fi
      return 0
    fi
    return 97
  }
  passed() { pass=$((pass+1)); }
  no_release_writes() { test "$(read_state release_create_calls)" = 0; }

  reset_state ABSENT ABSENT ABSENT VALID VALID VALID SUCCESS; publish_or_recover >/dev/null 2>&1 && test "$(read_state consume_calls)" = 1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT VALID DIFFERENT VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT STALE VALID VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT ABSENT VALID VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT APP VALID VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT VALID VALID VALID LEASE_FAIL; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT HEAD_MISMATCH VALID VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT VALID VALID VALID SUCCESS; publish_or_recover >/dev/null 2>&1 && test "$(read_state stable)" = RC3 && passed
  reset_state WRONG ABSENT ABSENT VALID VALID VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state RC3 ABSENT ABSENT VALID VALID VALID SUCCESS; publish_or_recover >/dev/null 2>&1 && test "$(read_state lock)" = LOCK && no_release_writes && passed
  reset_state ABSENT LOCK ABSENT VALID VALID VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state RC3 LOCK ABSENT VALID VALID VALID SUCCESS; publish_or_recover >/dev/null 2>&1 && test "$(read_state release_create_calls)" = 1 && passed
  reset_state RC3 LOCK ABSENT ABSENT VALID VALID SUCCESS; publish_or_recover >/dev/null 2>&1 && test "$(read_state release_create_calls)" = 1 && passed
  reset_state RC3 LOCK ABSENT ABSENT DIFFERENT VALID SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT VALID VALID MISSING_TAG SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state ABSENT ABSENT ABSENT VALID VALID MISSING_PUBLISHER SUCCESS; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state RC3 LOCK EXACT ABSENT VALID VALID SUCCESS EXACT; publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state RC3 LOCK INCOMPATIBLE ABSENT VALID VALID SUCCESS EXACT; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state RC3 LOCK BAD_METADATA ABSENT VALID VALID SUCCESS EXACT; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed
  reset_state RC3 LOCK EXACT ABSENT VALID VALID SUCCESS WRONG; ! publish_or_recover >/dev/null 2>&1 && no_release_writes && passed

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
  test "$receipt" = 10
  test "$ruleset" = 11
  test "$atomic_git" = 3
  test "$real" = 20
  test "$total" = 44
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    publish) publish_or_recover ;;
    verify-human-gate) verify_direct_human_gate_live ;;
    verify-effective-gate) verify_effective_human_gate ;;
    verify-consumed-gate) verify_consumed_authorization ;;
    protection-status) verify_server_side_publication_protection ;;
    self-test) self_test ;;
    *) echo "usage: $0 {publish|verify-human-gate|verify-effective-gate|verify-consumed-gate|protection-status|self-test}" >&2; exit 2 ;;
  esac
fi
