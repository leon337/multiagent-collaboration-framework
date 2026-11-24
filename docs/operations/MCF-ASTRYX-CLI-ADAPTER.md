# MCF Astryx CLI Discovery Adapter

**Status:** implemented, read-only, disabled by default.  
**Skill:** `MCF-ASTRYX-COMPONENT-DISCOVERY`  
**Provider:** `mcf-astryx-cli`

## Scope in this increment

The adapter connects Astryx component discovery to the existing MCF ExternalActionDispatcher, AdapterRegistry, PermissionEngine and EvidenceValidator. It does not scaffold files or execute generated code.

Allowlisted operations:

- `list-components` → fixed argv: `exec astryx component --list`
- `read-component-docs` → fixed argv: `exec astryx component <ComponentName> --detail compact`

The runtime invokes `pnpm` with fixed arguments and resolves the project-local `astryx` executable through `pnpm exec`. The workspace must install and pin `@astryxdesign/cli` as a project dependency. Do not use `npx astryx`: that unscoped npm package name resolves to an unrelated package. The component identifier must match `^[A-Z][A-Za-z0-9]{0,63}$`.

Execution uses `execFile` (no shell), a bounded timeout, a 32 KiB output limit and a realpath-verified working directory. The receipt preserves the exact requested resource value so EvidenceValidator can verify it without alias mismatch.

## Runtime configuration

All settings are opt-in and disabled by default:

- `MCF_ASTRYX_CLI_ENABLED=true` — enable discovery.
- `MCF_ASTRYX_WORKSPACE_ROOT=/absolute/path/to/isolated/workspace` — existing workspace directory with the pinned CLI dependency installed.
- `MCF_ASTRYX_CLI_BINARY=/absolute/path/to/pnpm` — optional executable override; default is `pnpm`.

Install the scoped package in the isolated workspace and commit its lockfile before enabling:

```sh
pnpm add -D @astryxdesign/cli@<pinned-version>
pnpm exec astryx --help
```

Do not point the workspace at a production checkout. Do not set the enable flag in production without a separate authorization and deployment gate.

## Security boundary

- Skill/provider/resource/operation tuple is checked by PermissionEngine.
- Skill uses `READ_ONLY`; writes, publish and deploy are forbidden.
- Adapter supports only the two fixed discovery operations.
- Adapter is disabled unless the explicit environment flag is true.
- No shell, arbitrary command, arbitrary arguments, file writes, scaffolding or deployment.
- CLI output is bounded before receipt creation.
- Receipt is created by the existing EvidenceValidator and action is recorded by the existing external action ledger.

## Validation

The adapter test suite covers exact support boundaries, disabled-by-default behavior, fixed argv, receipt metadata and resource preservation, component-name validation and PermissionEngine rejection. Run from the server workspace:

```sh
pnpm vitest run src/mcf-runtime/astryx-cli-discovery.adapter.test.ts
pnpm typecheck
```

This increment is not a full-stack code-generation executor. Subsequent work must add governed diff-based scaffolding and visual regression only after a separate security design and test suite.
