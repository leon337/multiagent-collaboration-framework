# MCF Astryx CLI Discovery Adapter

**Status:** implemented, read-only, disabled by default.  
**Skill:** `MCF-ASTRYX-COMPONENT-DISCOVERY`  
**Provider:** `mcf-astryx-cli`

## Scope in this increment

The adapter connects Astryx component discovery to the existing MCF ExternalActionDispatcher, AdapterRegistry, PermissionEngine and EvidenceValidator. It does not scaffold files or execute generated code.

Allowlisted operations:

- `list-components` → fixed argv: `--json component --list`
- `read-component-docs` → fixed argv: `--json component <ComponentName> --detail compact`

The runtime resolves `@astryxdesign/cli` from the workspace package manifest, verifies its package root and binary remain inside the workspace, and invokes that exact binary through `process.execPath` with `execFile` (no shell or PATH lookup). The workspace must install and pin both `@astryxdesign/cli` and `@astryxdesign/core` as project dependencies. Do not use `npx astryx`: that unscoped npm package name resolves to an unrelated package. The component identifier must match `^[A-Z][A-Za-z0-9]{0,63}# MCF Astryx CLI Discovery Adapter

**Status:** implemented, read-only, disabled by default.  
**Skill:** `MCF-ASTRYX-COMPONENT-DISCOVERY`  
**Provider:** `mcf-astryx-cli`

## Scope in this increment

The adapter connects Astryx component discovery to the existing MCF ExternalActionDispatcher, AdapterRegistry, PermissionEngine and EvidenceValidator. It does not scaffold files or execute generated code.

Allowlisted operations:

.

Execution uses `execFile` (no shell), a bounded timeout, a 32 KiB output limit and a realpath-verified working directory. Node's `SIGTERM` timeout outcome is classified as retryable `ADAPTER_TIMEOUT`, rather than a permanent generic failure. The CLI must return the documented JSON envelope with `meta.answeredBy` reporting project-local CLI and Core versions. JSON mode is a fixed allowlisted argument, not model-controlled input. The receipt binds those versions, the exact Node executable, package root, CLI binary, argv, workspace, exit code, bounded stdout/stderr, byte count and SHA-256 digest. Stderr is truncated on UTF-8 code-point boundaries so the byte cap is exact. EvidenceValidator checks the envelope type, component identity, package provenance, fixed command, output digest and read-only status. The receipt also preserves the exact requested resource value so EvidenceValidator can verify it without alias mismatch.

## Runtime configuration

All settings are opt-in and disabled by default:

- `MCF_ASTRYX_CLI_ENABLED=true` — enable discovery.
- `MCF_ASTRYX_WORKSPACE_ROOT=/absolute/path/to/isolated/workspace` — required when enabled; existing workspace directory with the pinned CLI and Core dependencies installed. Missing or relative paths fail closed; a workspace that overlaps the runtime checkout or one of its parent/child directories is also rejected.

The runtime executable is fixed to `process.execPath`; no binary override or inherited PATH fallback is supported.

Install the scoped package in the isolated workspace and commit its lockfile before enabling:

```sh
pnpm add -D @astryxdesign/cli@0.7.17 @astryxdesign/core@0.7.17
pnpm exec astryx --help
```

Do not point the workspace at a production checkout. Do not set the enable flag in production without a separate authorization and deployment gate. This adapter exposes only component catalog and component documentation reads in this increment; template source, template skeleton, scaffolding, file writes and deployment are intentionally not exposed.

## Security boundary

- Skill/provider/resource/operation tuple is checked by PermissionEngine.
- Skill uses `READ_ONLY`; writes, publish and deploy are forbidden.
- Adapter supports only the two fixed discovery operations.
- Adapter is disabled unless the explicit environment flag is true.
- No shell, arbitrary command, arbitrary arguments, PATH lookup, global CLI fallback, file writes, scaffolding or deployment.
- The package manifest and resolved CLI binary must remain inside the isolated workspace.
- CLI output is bounded before receipt creation.
- Receipt is created by the existing EvidenceValidator and action is recorded by the existing external action ledger.

## Validation

The test suite covers exact support boundaries, disabled-by-default behavior, workspace isolation, workspace-local binary resolution, UTF-8 stderr bounds, timeout classification, fixed JSON argv, package provenance, receipt semantics, output bounds, component-name validation, PermissionEngine rejection, runtime registry wiring, canonical MissionRuntime E2E and a real CLI integration test using pinned published CLI/Core 0.7.17 packages in an isolated CI workspace. Run from the server workspace:

```sh
pnpm vitest run src/mcf-runtime/astryx-cli-discovery.adapter.test.ts
pnpm typecheck
```

This increment is not a full-stack code-generation executor. Subsequent work must add governed diff-based scaffolding and visual regression only after a separate security design and test suite.
