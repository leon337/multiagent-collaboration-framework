# Context Fabric CF-0 + Minimal CF-1 — Plan Amendment 002

**Mission:** `MCF-ARCHITECTURE-CONVERGENCE-001` — Issue #147
**Amends:** `2026-08-20-context-fabric-cf0-cf1-implementation-plan.md` and Amendment 001
**Reason:** replace the planned vulnerable YAML parser patch with its security-fixed patch
**Audited implementation base:** `027405348bec031edae0ac756643979e93a94452`
**Implementation authorized by LEANDRO:** `true`, limited to the local CF-0 + minimal CF-1 boundary
**Production authorized:** `false`

---

## 1. Exact correction

Amendment 001 selected the exact direct dependency `yaml@2.8.1` and required a plan correction if another version became necessary. During final implementation verification on 2026-08-23, `pnpm audit --prod` reported `GHSA-48c2-rrv3-qjmp` against versions `<2.8.3`.

The selected version is therefore corrected as follows:

```text
SUPERSEDED: yaml@2.8.1
CURRENT:    yaml@2.8.3
```

The applicable installation command is:

```bash
cd apps/rede-social-agentes
pnpm --filter @rsa/server add yaml@2.8.3 --save-exact
```

This amendment supersedes only the exact version and command in Amendment 001 section 5. It does not change any other task, contract, schema, source-loader behavior, authority boundary or forbidden surface.

## 2. Security and compatibility rationale

- the package remains the same direct YAML 1.2 parser already selected by the approved plan;
- `2.8.3` is a patch-level correction and introduces no additional runtime package or external service;
- the repository loader continues to enforce its own byte, AST-depth, node-count, alias, anchor, tag and JSON-safety limits before materialization;
- the patched dependency is still used only by repository-native, read-only Context Fabric loading;
- no network, database, cache, provider, deployment, Mission Control or production coupling is introduced.

Keeping `2.8.1` would make the existing production dependency audit fail. The security patch is therefore required for the approved implementation to satisfy its original gate rather than an expansion of scope.

## 3. Revalidation evidence

The corrected dependency has passed locally with the repository-required toolchain:

```text
Node.js                      24.18.0
pnpm                         11.17.0
frozen lockfile install      PASS
pnpm audit --prod            PASS — no known vulnerabilities
Context Fabric tests         PASS — 49/49
server typecheck             PASS
targeted Context lint        PASS
targeted Context format      PASS
```

Complete workspace and Production Readiness-equivalent evidence is recorded in the implementation appendix of the Gate 0 rerun audit after final verification.

## 4. Gate effect

The dependency correction is non-material to architecture and preserves the Gate 0 compatibility matrix. It does not grant additional implementation, external-write, release, merge or production authority.

```text
PLAN_DEPENDENCY_VERSION_CORRECTED      = true
PRE_IMPLEMENTATION_AUDIT_PASS          = preserved
SEPARATE_IMPLEMENTATION_AUTHORIZATION  = true
PRODUCTION_AUTHORIZATION               = false
PUSH_OR_MERGE_AUTHORIZATION            = false
```
