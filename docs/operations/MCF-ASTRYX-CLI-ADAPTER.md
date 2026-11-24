# MCF Astryx CLI Discovery Adapter

**Status:** implemented, read-only, disabled by default.  
**Skill:** `MCF-ASTRYX-COMPONENT-DISCOVERY`  
**Provider:** `mcf-astryx-cli`

## Scope

The adapter connects Astryx component discovery to the existing MCF `ExternalActionDispatcher`, `AdapterRegistry`, `PermissionEngine` and `EvidenceValidator`. It does not scaffold files, modify a project, execute generated code, or deploy applications.

Allowlisted operations:

- `list-components` → fixed arguments: `--json component --list`
- `read-component-docs` → fixed arguments: `--json component <ComponentName> --detail compact`

The runtime resolves `@astryxdesign/cli` from the workspace package manifest, verifies that the package root and binary remain inside the workspace, and invokes that exact binary through `process.execPath` with `execFile`. It does not use a shell, PATH lookup, global CLI, or model-supplied executable. The workspace must install and pin both `@astryxdesign/cli` and `@astryxdesign/core` as project dependencies. Do not use `npx astryx`: the unscoped npm package name is unrelated. Component identifiers must match `^[A-Z][A-Za-z0-9]{0,63}$`.

The CLI must return the documented JSON envelope with `meta.answeredBy` reporting project-local CLI and Core versions. JSON mode and all command arguments are fixed by the adapter. The receipt binds the versions, Node executable, package root, CLI binary, exact arguments, workspace, exit code, bounded stdout/stderr, byte count and SHA-256 digest. Stderr truncation respects UTF-8 code-point boundaries. `EvidenceValidator` checks the envelope type, component identity, package provenance, fixed command, output digest, workspace boundary and read-only status. The receipt preserves the exact requested resource value for verification.

## Runtime configuration

All settings are opt-in and disabled by default:

- `MCF_ASTRYX_CLI_ENABLED=true` — enable component discovery.
- `MCF_ASTRYX_WORKSPACE_ROOT=/absolute/path/to/isolated/workspace` — required when enabled; must point to an existing isolated directory with pinned CLI and Core dependencies installed.

Missing or relative paths fail closed. A workspace overlapping the runtime checkout or one of its parent/child directories is rejected. The runtime executable is fixed to `process.execPath`; no executable override or inherited PATH fallback is supported.

Install the scoped packages in the isolated workspace and commit the lockfile before enabling:

```sh
pnpm add -D @astryxdesign/cli@0.7.17 @astryxdesign/core@0.7.17
pnpm exec astryx --help
```

Do not point the workspace at a production checkout. Do not enable the adapter in production without separate authorization and a deployment gate.

## Security boundary

- Permission checks bind the exact skill/provider/resource/operation tuple.
- The skill uses the `READ_ONLY` permission profile; writes, publish and deploy are forbidden.
- Only the two fixed discovery operations are supported.
- The adapter is disabled unless the explicit enable flag is true.
- No shell, arbitrary command, arbitrary arguments, PATH lookup, global CLI fallback, file writes, scaffolding or deployment.
- The package manifest and resolved CLI binary must remain inside the isolated workspace.
- CLI output and stderr are bounded before receipt creation.
- Receipts are created by the existing `EvidenceValidator`; the action is recorded by the existing external action ledger.

## Validation

The branch includes unit tests for support boundaries, disabled-by-default behavior, workspace isolation, project-local binary resolution, UTF-8 stderr bounds, timeout classification, fixed JSON arguments, package provenance, receipt semantics, output bounds, component-name validation and `PermissionEngine` rejection. It also includes runtime registry tests, a `MissionRuntime` E2E test and a real CLI integration test using pinned CLI/Core packages in an isolated CI workspace.

Run from the server workspace:

```sh
pnpm vitest run src/mcf-runtime/astryx-cli-discovery.adapter.test.ts
pnpm typecheck
```

This increment is not a full-stack code-generation executor. Governed diff-based scaffolding, UI generation, backend generation, visual regression, human approval and rollback require a separate implementation and security validation.
