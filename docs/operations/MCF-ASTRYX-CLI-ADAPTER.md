# MCF Astryx CLI Discovery Adapter

**Status:** implemented, read-only, disabled by default.  
**Skill:** `MCF-FULLSTACK-VISUAL-DEVELOPMENT`  
**Provider:** `mcf-astryx-cli`

## Scope in this increment

The adapter connects Astryx component discovery to the existing MCF ExternalActionDispatcher, AdapterRegistry, PermissionEngine and EvidenceValidator. It does not scaffold files or execute generated code.

Allowlisted operations:

- `list-components` → fixed argv: `component --list`
- `read-component-docs` → fixed argv: `component <ComponentName> --compact`

The component identifier must match `^[A-Z][A-Za-z0-9]{0,63}$`. Model input is never interpreted as a shell command. Execution uses `execFile` (no shell), a bounded timeout, a 32 KiB output limit and a realpath-verified working directory. Only bounded stdout/stderr and command metadata are included in the trusted MCF receipt.

## Runtime configuration

All settings are opt-in and disabled by default:

- `MCF_ASTRYX_CLI_ENABLED=true` — enable discovery.
- `MCF_ASTRYX_WORKSPACE_ROOT=/absolute/path/to/isolated/workspace` — existing workspace directory.
- `MCF_ASTRYX_CLI_BINARY=/absolute/path/to/astryx` — optional executable override; default is `astryx` resolved by the runtime PATH.

Install and pin the Astryx CLI in the authorized workspace before enabling. Keep the package lockfile committed. Do not point the workspace at a production checkout. Do not set the enable flag in production without a separate authorization and deployment gate.

## Security boundary

- Skill/provider/resource/operation tuple is checked by PermissionEngine.
- Skill uses `READ_ONLY`; writes, publish and deploy are forbidden.
- Adapter supports only the two fixed discovery operations.
- Adapter is disabled unless the explicit environment flag is true.
- No shell, arbitrary command, arbitrary arguments, file writes, scaffolding or deployment.
- CLI output is bounded before receipt creation.
- Receipt is created by the existing EvidenceValidator and action is recorded by the existing external action ledger.

## Validation

The adapter test suite covers exact support boundaries, disabled-by-default behavior, fixed argv, receipt metadata, component-name validation and PermissionEngine rejection. Run from the server workspace:

```sh
pnpm vitest run src/mcf-runtime/astryx-cli-discovery.adapter.test.ts
pnpm typecheck
```

This increment is not a full-stack code-generation executor. Subsequent work must add governed diff-based scaffolding and visual regression only after a separate security design and test suite.
