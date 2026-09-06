# CodeBuddy MCF Integration Design

**Date:** 2026-09-05  
**Status:** APPROVED  
**Scope:** Linux-only consolidation of CodeBuddy, stable local Web UI, and bounded MCF execution adapter.

## 1. Goal

Use the existing Linux stack more effectively instead of adding a Windows VM. Consolidate CodeBuddy 2.146.0 as the primary development agent, make its local Web UI stable and protected, and expose CodeBuddy as a bounded executor for `MCF-IMPLEMENT-CHANGE` through the existing MCF External Action Dispatcher.

## 2. Non-goals

- No WorkBuddy Desktop emulation or Windows VM.
- No public exposure of the CodeBuddy Web UI.
- No automatic merge, release, production deploy, force-push, or publication.
- No unrestricted Bash in the CodeBuddy executor v1.
- No extraction or logging of CodeBuddy, 9Router, OAuth, or gateway secrets.
- No production-hosted CodeBuddy executor in v1.

## 3. Current state

- `codebuddy` resolves to the npm installation and reports 2.146.0.
- A second native 2.146.0 binary exists and is retained only as rollback.
- The npm CodeBuddy UI is on localhost port 46514.
- A second temporary native UI on port 46515 is incorrectly labelled as WorkBuddy and must be retired.
- The 46515 process previously crashed when started from `/home/leo`: the Explorer reached 10,000 filesystem watches and the process terminated after an uncaught `EPIPE` during `git/check-ignore`.
- The MCF runtime already has an `ExternalActionDispatcher`, `AdapterRegistry`, durable ledger/reservation semantics, signed receipts, permission profiles, and `MCF-IMPLEMENT-CHANGE`.

## 4. Target topology

```text
MESTRE / DSH
    |
    v
MCF mission + MCF-IMPLEMENT-CHANGE
    |
    v
PermissionEngine
    |
    v
ExternalActionDispatcher
    |
    v
CodeBuddyExecutorAdapter
    |
    +-- authorized workspace is inspected but never used as CodeBuddy cwd
    +-- detached disposable Git worktree at the captured base SHA
    +-- CodeBuddy 2.146.0 with Read / Edit / Glob / Grep only
    +-- selected 9Router-backed model
    +-- validate complete effects + publish validated patch only
    |
    v
signed McfToolReceipt + retrievable diff bytes + changed-files evidence
```

## 5. CodeBuddy consolidation

The npm installation at the normal `codebuddy` command becomes canonical. The native 2.146.0 binary remains available under a rollback-only path and is not advertised as WorkBuddy.

The existing `~/.codebuddy` state, history, authentication, and custom model configuration are preserved. The isolated `~/.workbuddy-enterprise` profile is retained only until the consolidation is verified, then renamed or archived rather than silently deleted.

## 6. Stable Web UI

Create one persistent user service named `codebuddy-web.service` with:

- bind: `127.0.0.1` only;
- port: `46514`;
- authentication: `none` while the service is strictly bound to localhost; re-enable authentication before any Tailscale/remote exposure;
- agent: `cli`;
- permission mode: `default`;
- working directory: `/home/leo/Documentos/GitHub/multiagent-collaboration-framework`;
- restart policy: `on-failure`;
- `--auth none` is allowed only for the persistent localhost-only service; remote exposure is out of scope until authentication is restored.

Retire the temporary port 46515 unit and the misleading `workbuddy-enterprise-*` service names after verification. The service must survive restart and must not watch `/home/leo` as its workspace root.

## 7. MCF adapter contract

### 7.1 Routing

The adapter id is `codebuddy-implement-change-local-v1`.

It matches only:

- skill: `MCF-IMPLEMENT-CHANGE`;
- provider: `codebuddy`;
- operation: `implement-change`.

`skills/registry.yaml` adds `CodeBuddy` to the allowed tools for `MCF-IMPLEMENT-CHANGE`. Existing `SCOPED_WRITE` semantics remain in force, including `inputs.authorizedScope=true` for the non-internal provider.

### 7.2 Local-only enablement

The adapter is disabled by default. Runtime configuration adds:

- `MCF_CODEBUDDY_EXECUTOR_ENABLED=false`;
- `MCF_CODEBUDDY_BINARY=codebuddy`;
- `MCF_CODEBUDDY_WORKSPACE_ROOT=`;
- `MCF_CODEBUDDY_MODEL=cx/gpt-5.6-sol`;
- `MCF_CODEBUDDY_TIMEOUT_MS=300000`.

When enabled, `MCF_CODEBUDDY_WORKSPACE_ROOT` must be an absolute non-root path. `NODE_ENV=production` rejects `MCF_CODEBUDDY_EXECUTOR_ENABLED=true` in v1.

### 7.3 Request inputs

The adapter requires:

- `approved_scope`: non-empty string;
- `acceptance_criteria`: non-empty string or non-empty string array;
- `repository`: canonical `owner/name` matching `tool.resource`;
- `workspace`: absolute path contained by `MCF_CODEBUDDY_WORKSPACE_ROOT`;
- `authorizedScope: true` through the existing permission profile.

Optional input:

- `model`: if provided, it must exactly equal `MCF_CODEBUDDY_MODEL`; v1 intentionally supports one configured model rather than an arbitrary caller-selected model.

### 7.4 Workspace safety

Before CodeBuddy runs, the adapter must:

1. resolve the real workspace path;
2. prove it is inside the configured workspace root;
3. prove it is a Git worktree/repository;
4. prove the `origin` repository matches `tool.resource` and `inputs.repository`;
5. require a clean working tree;
6. record the exact 40-character base commit SHA.

The adapter also rejects unsafe `allowed_paths`, including symlink-mediated paths that can resolve outside the repository. The adapter fails closed before model invocation on any mismatch.

CodeBuddy never executes in the authorized workspace. After the checks above, the adapter creates a detached disposable Git worktree at the captured base SHA and uses that worktree as CodeBuddy cwd.

### 7.5 CodeBuddy execution policy

Invoke CodeBuddy non-interactively with session persistence disabled. The v1 tool set is fixed to filesystem-oriented development tools only:

- Read;
- Edit;
- Glob;
- Grep.

Bash, MCP, deploy, browser automation, GitHub writes, and permission bypass are excluded from the v1 executor. Edits may be auto-accepted; all other CodeBuddy permissions remain constrained by the explicit tool set.

The prompt is constructed by the adapter from `approved_scope`, `allowed_paths`, `acceptance_criteria`, repository and MCF mission identifiers. The adapter does not accept a raw shell command.

The local host launches CodeBuddy in its own process group and terminates the process group on timeout before cleanup. Ignored files, untracked files, tracked edits and rename/copy effects are collected from the disposable worktree. Any effect outside `allowed_paths`, any symlink escape, or any change to the detached HEAD rejects the run.

Only after validation does the MCF-controlled publisher apply the validated patch to the authorized workspace. CodeBuddy itself never publishes into that workspace.

### 7.6 Post-execution evidence

After CodeBuddy exits successfully, the adapter must inspect Git rather than trusting model text. A successful receipt requires at least one changed path.

Receipt metadata includes:

- `adapterId`;
- `repository`;
- `workspaceRelativeToRoot`;
- `baseCommitSha`;
- `changedFiles`;
- `changedFileCount`;
- `diffDigest` (SHA-256 of the exact canonical Git diff bytes);
- `diffArtifact` containing those exact bytes as signed base64 metadata plus byte length, allowing independent recomputation;
- `executionIsolation: DISPOSABLE_GIT_WORKTREE`;
- `model`;
- `toolPolicy`;
- `exitCode`;
- `durationMs`;
- `stdoutDigest`;
- `localOnly: true`;
- `committed: false`.

The receipt `commitSha` is the unchanged base commit SHA and is explicitly labelled as such in metadata. The adapter does not create a commit in v1; Git commit/PR remains a separate MCF gate and skill.

`EvidenceValidator.verifyForSkill` adds a CodeBuddy-specific validator for `MCF-IMPLEMENT-CHANGE` / `implement-change`. It decodes `diffArtifact`, verifies its byte length, recomputes SHA-256 and requires equality with `diffDigest`; it also requires disposable-worktree isolation and rejects empty change sets, provider mismatches, invalid digests, or `committed=true`.

## 8. Failure semantics

- disabled executor -> `NOT_HANDLED` through adapter matching being false;
- invalid/mismatched workspace -> `INVALID_CONTEXT`, non-retryable;
- dirty workspace -> `RESERVATION_CONFLICT`, retryable only after workspace cleanup/reselection;
- missing binary -> `TARGET_NOT_FOUND`, non-retryable;
- timeout -> `ADAPTER_TIMEOUT`, retryable;
- CodeBuddy non-zero exit -> `ADAPTER_FAILURE`, retryability false unless timeout/network is proven separately;
- CodeBuddy success with no filesystem changes -> `INVALID_RESPONSE`, non-retryable;
- any ignored/out-of-scope/symlink/HEAD mutation in the execution worktree -> fail closed before publication;
- disposable worktree cleanup failure -> `ADAPTER_FAILURE`; if publication already happened, the publisher restores only the affected paths against the captured base SHA and verifies the restored state.

No failure path may expose secret values in errors, logs, receipts, stdout excerpts, or test fixtures.

## 9. Tests

Unit and integration tests cover:

- routing only when enabled and on the exact skill/provider/operation;
- production configuration refuses enablement;
- path traversal / workspace escape rejected before CodeBuddy invocation;
- repository mismatch rejected before invocation;
- dirty workspace rejected before invocation;
- fixed tool policy contains no Bash/MCP;
- timeout maps to `ADAPTER_TIMEOUT`;
- non-zero exit maps to `ADAPTER_FAILURE`;
- empty diff rejected;
- changed files and digests are derived from Git evidence;
- CodeBuddy cwd is a detached disposable worktree, not the authorized workspace;
- ignored out-of-scope effects are detected without contaminating the authorized workspace;
- rename across the allowed-path boundary is rejected;
- symlink-mediated escape is rejected before invocation;
- timeout terminates descendant processes before delayed writes;
- restoration targets the captured SHA and verifies cleanup;
- a well-formed but incorrect diff digest is rejected by recomputing the signed diff artifact;
- planner enablement is based on a local capability probe, not the feature flag alone;
- receipt signature and CodeBuddy-specific evidence validation;
- `McfRuntimeModule` includes the adapter in `AdapterRegistry`;
- registry permits CodeBuddy only for the authorized implementation skill.

A live local smoke test uses a disposable Git worktree/file, a 9Router-backed CodeBuddy model, and verifies the resulting file content independently after execution.

## 10. Acceptance criteria

1. The canonical `codebuddy` command reports 2.146.0 and the rollback binary remains available.
2. Only one persistent CodeBuddy Web UI remains, on authenticated localhost port 46514.
3. Service restart returns HTTP 200 and ACP connects without the 10,000-watcher/EPIPE failure.
4. The MCF adapter is disabled by default and cannot be enabled in production.
5. An authorized local MCF implementation request causes CodeBuddy to edit only a detached disposable worktree with no Bash; the MCF publisher applies only the validated patch to the authorized workspace.
6. MCF receives a signed receipt whose changed files and exact diff bytes are independently derived from Git, and whose `diffDigest` can be recomputed from `diffArtifact`.
7. A separate verification confirms the expected edit; no merge, release, deploy or publication occurs.
8. All affected unit tests, typecheck and relevant validation pass before completion is claimed.

## 11. Rollback

- Restore the previous npm launcher/service if the canonical CodeBuddy service fails.
- Keep the native 2.146.0 binary as an explicit rollback command until final validation.
- Disable `MCF_CODEBUDDY_EXECUTOR_ENABLED` to remove the adapter from routing without code rollback. Startup capability probing also keeps CodeBuddy out of routing when the binary or workspace capability is not positively available.
- Revert the feature branch commits to remove the MCF integration. No database migration is introduced.
