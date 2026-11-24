# MCF Astryx CLI Discovery and Scaffold Proposal Adapter

**Status:** implemented in this branch; disabled by default.  
**Skill:** `MCF-ASTRYX-COMPONENT-DISCOVERY@0.2.0`  
**Provider:** `mcf-astryx-cli`  
**Permission profile:** `READ_AND_PROPOSE`

## Scope

The adapter connects Astryx to the MCF `ExternalActionDispatcher`, `AdapterRegistry`, `PermissionEngine` and `EvidenceValidator`. It supports component/template discovery and one bounded scaffold proposal operation. Astryx never writes to the target checkout, applies a diff, commits, merges or deploys.

Allowlisted operations:

| Operation | Fixed argv | Effect |
|---|---|---|
| `list-components` | `--json component --list` | Read-only catalog at `detail: names` |
| `read-component-docs` | `--json component <Name> --detail compact` | Read-only component docs |
| `list-templates` | `--json template --list` | Read-only template catalog |
| `read-template-source` | `--json template <id>` | Read-only template source |
| `read-template-skeleton` | `--json template <id> --skeleton` | Read-only structural skeleton |
| `draft-template-scaffold` | `--json template <id> <repository-relative-file>` | Copies exactly one file into a unique disposable workspace, then returns source + add-file diff proposal |

The runtime resolves `@astryxdesign/cli` and `@astryxdesign/core` from workspace package manifests, verifies package names, semantic versions and package-root containment, and invokes the exact CLI binary through `process.execPath` with `execFile`. It does not use a shell, PATH lookup, global CLI, or model-supplied executable. Do not use `npx astryx`: the unscoped npm package name is unrelated.

For every operation, the CLI must return the JSON envelope with `meta.answeredBy` reporting project-local CLI/Core versions. The CLI-reported Core version must exactly match the installed local Core package version. The receipt binds package roots, versions, Node executable, CLI binary, exact arguments, workspace, exit code, bounded output and SHA-256 digest.

## Disposable scaffold proposal

`draft-template-scaffold` requires:

- `templateId`: bounded Astryx template identifier;
- `targetPath`: explicit repository-relative source file path (`.tsx`, `.jsx`, `.ts` or `.js`);
- `repository`: canonical owner/repository;
- `baseCommitSha`: exact 40-character SHA of the intended target workspace;
- `allowed_paths`: non-empty explicit path scopes containing `targetPath`.

The adapter creates a unique child workspace under the isolated CLI workspace and runs the fixed `template <id> <targetPath>` command there. It accepts exactly one regular file, rejects symlinks, traversal, unapproved paths, empty/oversized output and mismatched CLI copy receipts. It then emits a canonical new-file diff and source artifact, each bound by SHA-256, in a signed receipt. The temporary directory is removed before the receipt is returned. A failed cleanup means no successful receipt is emitted.

The proposal receipt is not authorization to write. It is a reviewable, content-addressed input for the separate MCF implementation step.

## Applying a proposal

Application is delegated to `MCF-IMPLEMENT-CHANGE` using the existing CodeBuddy adapter. When `scaffoldProposalReceipt` is supplied, the adapter:

1. verifies the signed Astryx proposal and its source/diff digests;
2. binds repository, exact base SHA and target path to the current clean workspace;
3. requires `authorizedScope=true` and the `SCOPED_WRITE` permission profile;
4. requires a v1.1 HDF context with `actionClass=SCOPED_WRITE`, non-production environment, TEAM_FIRST evidence, the exact proposal receipt in evidenceRefs, and a human-gate decision approved by LEANDRO;
5. restricts changes to `allowed_paths` and requires CodeBuddy to materialize the proposed target file;
6. executes in a disposable Git worktree and Bubblewrap filesystem/process sandbox;
7. publishes only the validated Git-derived diff into the authorized workspace, without committing or deploying.

The existing CodeBuddy host validates the published diff and performs transactional reverse-apply restoration if publication or disposable-worktree cleanup fails. The test suite explicitly verifies that rollback path. A successful implementation receipt remains local, uncommitted and pending the separate MCF test/review handoff.

## Runtime configuration

All settings are opt-in and disabled by default:

- `MCF_ASTRYX_CLI_ENABLED=true` — enable component/template discovery and disposable proposals.
- `MCF_ASTRYX_WORKSPACE_ROOT=/absolute/path/to/isolated/workspace` — required when enabled; must point to an isolated directory with pinned CLI and Core dependencies.

Missing or relative paths fail closed. A workspace overlapping the runtime checkout or one of its parent/child directories is rejected. The runtime executable is fixed to `process.execPath`; no executable override or inherited PATH fallback is supported.

Install the scoped packages in the isolated workspace and commit the lockfile before enabling:

```sh
pnpm add -D @astryxdesign/cli@0.7.17 @astryxdesign/core@0.7.17
pnpm exec astryx --help
```

Do not point the workspace at a production checkout. Do not enable the adapter in production without separate authorization and a deployment gate.

## Security boundary

- Exact skill/provider/resource/operation tuple; no arbitrary commands or flags.
- Astryx scaffold writes only to a unique disposable workspace, never to the target checkout.
- Explicit `allowed_paths`, canonical repository, exact base SHA and bounded source/diff artifacts.
- `READ_AND_PROPOSE` permits the proposal but not application.
- Application requires `SCOPED_WRITE`, explicit scope and a LEANDRO HDF approval after TEAM_FIRST.
- The application path is a separate CodeBuddy adapter with disposable Git worktree, Bubblewrap, signed diff evidence and rollback.
- Child CLI environment is allowlisted; database credentials and MCF receipt secrets are not inherited.
- CLI/Core package roots and versions must match the installed local packages.
- Receipts are signed by the existing EvidenceValidator and recorded by the external action ledger.
- No commit, merge, publish, production write or deploy.

## Validation

The branch adds unit coverage for component/template discovery, bounded output, scratch proposal generation, path traversal rejection, proposal cleanup, semantic receipt validation, permission boundaries and CodeBuddy HDF enforcement. MissionRuntime E2E covers both read-only discovery and the signed disposable proposal. The real CLI integration test uses pinned CLI/Core 0.7.17 packages in an isolated CI workspace.

The non-production full-stack qualification fixture is in `examples/astryx-fullstack-pilot/`. Its separate workflow builds React 19 + Astryx, runs an authenticated API against a per-run PostgreSQL schema and migration, checks desktop/mobile browser flows, axe accessibility and pixel baselines. It never uses the Potiguar production database or deploys.

Run server checks from the server workspace:

```sh
pnpm vitest run src/mcf-runtime/astryx-cli-discovery.adapter.test.ts
pnpm vitest run src/mcf-runtime/astryx-cli-discovery.runtime-e2e.test.ts
pnpm vitest run src/mcf-runtime/codebuddy-executor.adapter.test.ts
pnpm typecheck
```

This adapter increment does not promote the orchestration Skill to `CURRENT_IMPLEMENTED` by itself. Promotion requires the full-stack pilot workflow, current CI, documentation validation and review evidence to pass on the exact PR head.
