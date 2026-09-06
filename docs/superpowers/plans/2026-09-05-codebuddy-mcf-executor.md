# CodeBuddy MCF Executor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only, evidence-producing CodeBuddy executor to the MCF `MCF-IMPLEMENT-CHANGE` flow without exposing Bash, production execution, merge or deployment capabilities.

**Architecture:** Add `codebuddy` as an allowed provider for the existing implementation skill, gate it through `PermissionEngine`, and route matching requests through `ExternalActionDispatcher` to a new `CodeBuddyExecutorAdapter`. The adapter validates a clean authorized Git worktree, invokes CodeBuddy with only Read/Edit/Glob/Grep, then derives signed evidence from Git rather than trusting model output.

**Tech Stack:** TypeScript, NestJS, Vitest, Node.js child_process/fs/path/crypto, MCF External Action Dispatcher, CodeBuddy Code 2.146.0, Git.

**Spec:** `docs/superpowers/specs/2026-09-05-codebuddy-mcf-integration-design.md`

## Global Constraints

- Provider is exactly `codebuddy`; operation is exactly `implement-change`.
- Skill is exactly `MCF-IMPLEMENT-CHANGE` with existing `SCOPED_WRITE` semantics.
- Executor is disabled by default and forbidden when `NODE_ENV=production` in v1.
- CodeBuddy receives only `Read,Edit,Glob,Grep`; no Bash, MCP, browser, deploy, GitHub write, permission bypass, merge or commit.
- Workspace must be a clean Git worktree inside one configured absolute root and its `origin` must match the declared `owner/name` resource.
- No secret values or raw model output are persisted in receipts.
- Adapter does not commit; Git/PR integration remains a separate MCF skill/gate.

---

### Task 1: Add fail-closed runtime configuration

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/config.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/config.test.ts`
- Modify: `apps/rede-social-agentes/.env.example`

**Interfaces:**
- Produces `RuntimeConfig.MCF_CODEBUDDY_EXECUTOR_ENABLED: boolean`
- Produces `RuntimeConfig.MCF_CODEBUDDY_BINARY: string`
- Produces `RuntimeConfig.MCF_CODEBUDDY_WORKSPACE_ROOT: string`
- Produces `RuntimeConfig.MCF_CODEBUDDY_MODEL: string`
- Produces `RuntimeConfig.MCF_CODEBUDDY_TIMEOUT_MS: number`

- [ ] **Step 1: Write failing config tests**

Add tests equivalent to:
```ts
it('keeps the CodeBuddy executor disabled by default', () => {
  expect(loadRuntimeConfig(baseEnvironment)).toMatchObject({
    MCF_CODEBUDDY_EXECUTOR_ENABLED: false,
    MCF_CODEBUDDY_BINARY: 'codebuddy',
    MCF_CODEBUDDY_MODEL: 'cx/gpt-5.6-sol',
    MCF_CODEBUDDY_TIMEOUT_MS: 300000,
  });
});

it('rejects CodeBuddy executor enablement in production', () => {
  expect(() => loadRuntimeConfig({
    ...productionEnvironment,
    ALLOWED_ORIGINS: 'https://rsa-pilot.pages.dev',
    MCF_CODEBUDDY_EXECUTOR_ENABLED: 'true',
    MCF_CODEBUDDY_WORKSPACE_ROOT: '/srv/mcf',
  })).toThrow(/CodeBuddy executor/i);
});

it.each(['', '/', 'relative/path'])('rejects an unsafe enabled workspace root: %s', (root) => {
  expect(() => loadRuntimeConfig({
    ...baseEnvironment,
    MCF_CODEBUDDY_EXECUTOR_ENABLED: 'true',
    MCF_CODEBUDDY_WORKSPACE_ROOT: root,
  })).toThrow(/workspace root/i);
});
```

- [ ] **Step 2: Run only the config test and verify RED**

Run:
```bash
cd apps/rede-social-agentes
corepack pnpm --filter @rsa/server test -- src/config.test.ts
```
Expected: FAIL because the CodeBuddy fields do not yet exist.

- [ ] **Step 3: Add the configuration fields and validation**

Add schema fields with these exact defaults:
```ts
MCF_CODEBUDDY_EXECUTOR_ENABLED: booleanEnvironmentValue,
MCF_CODEBUDDY_BINARY: z.string().min(1).default('codebuddy'),
MCF_CODEBUDDY_WORKSPACE_ROOT: z.string().default(''),
MCF_CODEBUDDY_MODEL: z.string().min(1).default('cx/gpt-5.6-sol'),
MCF_CODEBUDDY_TIMEOUT_MS: z.coerce.number().int().min(1000).max(540000).default(300000),
```
In `superRefine`, reject enabled production execution and reject an enabled workspace root unless it is absolute and not `/`.

- [ ] **Step 4: Document the environment variables in `.env.example`**

Add disabled/local defaults only; do not add any API keys or gateway passwords.

- [ ] **Step 5: Re-run the config test and verify GREEN**

Expected: all `config.test.ts` tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/rede-social-agentes/apps/server/src/config.ts \
        apps/rede-social-agentes/apps/server/src/config.test.ts \
        apps/rede-social-agentes/.env.example
git commit -m "feat(mcf): gate local CodeBuddy executor config"
```

### Task 2: Permit only the canonical CodeBuddy implementation route

**Files:**
- Modify: `skills/registry.yaml`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.codebuddy.test.ts`

**Interfaces:**
- Consumes: `MCF-IMPLEMENT-CHANGE`, provider `codebuddy`, operation `implement-change`.
- Produces: permission success only with `authorizedScope=true` and canonical repository resource.

- [ ] **Step 1: Write failing permission tests**

Test these cases:
```ts
// allowed
engine.assertAllowed(skill, 'Rafael', {
  provider: 'codebuddy',
  operation: 'implement-change',
  resource: 'leon337/multiagent-collaboration-framework',
}, { authorizedScope: true });

// denied: wrong skill
// denied: wrong operation
// denied: non-canonical repository resource
// denied: missing authorizedScope
```
Use a local `McfSkillDefinition` fixture matching the canonical `MCF-IMPLEMENT-CHANGE` contract.

- [ ] **Step 2: Run the new test and verify RED**

Expected: CodeBuddy provider is rejected because it is not yet an allowed tool/boundary.

- [ ] **Step 3: Add `CodeBuddy` to only `MCF-IMPLEMENT-CHANGE.allowed_tools`**

Change:
```yaml
allowed_tools: [GitHub, Linear, Supabase, Neon_Postgres, Render, Vercel, Cloudflare, OpenAI_Developers, Figma]
```
to:
```yaml
allowed_tools: [GitHub, Linear, Supabase, Neon_Postgres, Render, Vercel, Cloudflare, OpenAI_Developers, Figma, CodeBuddy]
```
Do not add CodeBuddy to any other skill in this mission.

- [ ] **Step 4: Add a provider-specific permission boundary**

Add a helper that, whenever provider or operation identifies CodeBuddy execution, requires all of:
```ts
skill.skillId === 'MCF-IMPLEMENT-CHANGE'
provider === 'codebuddy'
operation === 'implement-change'
isCanonicalGitHubRepositoryResource(tool.resource) === true
```
Then retain the existing `SCOPED_WRITE` check so `authorizedScope=true` remains mandatory.

- [ ] **Step 5: Re-run permission tests and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add skills/registry.yaml \
        apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.ts \
        apps/rede-social-agentes/apps/server/src/mcf-runtime/permission-engine.codebuddy.test.ts
git commit -m "feat(mcf): authorize bounded CodeBuddy implementation route"
```

### Task 3: Implement the CodeBuddy host boundary and adapter

**Files:**
- Create: `apps/rede-social-agentes/apps/server/src/mcf-runtime/codebuddy-executor.adapter.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-runtime/codebuddy-executor.adapter.test.ts`

**Interfaces:**
- Produces `CodeBuddyExecutorConfig`.
- Produces `CodeBuddyHost` interface for injected testing.
- Produces `LocalCodeBuddyHost` for Git/process operations.
- Produces `CodeBuddyExecutorAdapter implements ExternalActionAdapter`.

Use these interface shapes:
```ts
export interface CodeBuddyExecutorConfig {
  enabled: boolean;
  binary: string;
  workspaceRoot: string;
  model: string;
  timeoutMs: number;
}

export interface CodeBuddyWorkspaceSnapshot {
  realPath: string;
  repository: string;
  headSha: string;
  dirtyPaths: string[];
}

export interface CodeBuddyExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export interface CodeBuddyChangeEvidence {
  changedFiles: string[];
  diff: string;
}

export interface CodeBuddyHost {
  inspectWorkspace(workspace: string): Promise<CodeBuddyWorkspaceSnapshot>;
  execute(input: {
    binary: string;
    cwd: string;
    model: string;
    prompt: string;
    timeoutMs: number;
  }): Promise<CodeBuddyExecutionResult>;
  collectChanges(workspace: string): Promise<CodeBuddyChangeEvidence>;
}
```

- [ ] **Step 1: Write adapter tests first**

Cover at minimum:
```text
supports=false when disabled
supports=true only for MCF-IMPLEMENT-CHANGE/codebuddy/implement-change
workspace outside root -> INVALID_CONTEXT before execute
repository mismatch -> INVALID_CONTEXT before execute
dirty workspace -> RESERVATION_CONFLICT before execute
timeout -> ADAPTER_TIMEOUT
non-zero exit -> ADAPTER_FAILURE
successful zero-change run -> INVALID_RESPONSE
successful changed-file run -> signed receipt with digests
CodeBuddy args/tool policy contain Read,Edit,Glob,Grep and never Bash/MCP
```
Use a fake `CodeBuddyHost`; no real process in unit tests.

- [ ] **Step 2: Run the adapter tests and verify RED**

Expected: module not found / class not implemented.

- [ ] **Step 3: Implement request validation and path containment**

Use `realpath`/`resolve` semantics and `path.relative` to prove the workspace remains within the configured root. Reject empty scope, empty acceptance criteria, non-canonical repository, workspace mismatch and model/request type errors with `ExternalActionAdapterError('INVALID_CONTEXT', ...)`.

- [ ] **Step 4: Implement `LocalCodeBuddyHost.inspectWorkspace`**

Use `git -C <workspace>` through `execFile`, never shell interpolation, to collect:
```text
rev-parse --show-toplevel
rev-parse HEAD
remote get-url origin
status --porcelain=v1 -z
```
Normalize HTTPS and SSH GitHub origin URLs to canonical `owner/name`. Map non-repository/missing origin to `INVALID_CONTEXT` without including credential-bearing URLs in errors.

- [ ] **Step 5: Implement constrained CodeBuddy execution**

Spawn/exec CodeBuddy with these semantic arguments:
```text
-p <constructed prompt>
--no-session-persistence
--tools Read,Edit,Glob,Grep
--permission-mode acceptEdits
--model <selected model>
--output-format json
```
Do not pass `--auth none`, `--allowedTools Bash(...)`, `--dangerously-*`, or permission bypass flags. Cap stdout/stderr capture and map timeout/missing binary/non-zero exit to typed adapter errors without embedding raw output in error messages.

- [ ] **Step 6: Derive post-run evidence from Git**

Require at least one changed path. Calculate:
```ts
diffDigest = sha256(changeEvidence.diff)
stdoutDigest = sha256(execution.stdout)
```
Do not store raw stdout/stderr in receipt metadata.

Create the trusted receipt with:
```ts
provider: 'codebuddy'
operation: 'implement-change'
resource: request.tool.resource
externalId: randomUUID()
commitSha: baseHeadSha
status: 'SUCCEEDED'
```
and metadata required by the spec.

- [ ] **Step 7: Re-run adapter tests and verify GREEN**

- [ ] **Step 8: Commit**

```bash
git add apps/rede-social-agentes/apps/server/src/mcf-runtime/codebuddy-executor.adapter.ts \
        apps/rede-social-agentes/apps/server/src/mcf-runtime/codebuddy-executor.adapter.test.ts
git commit -m "feat(mcf): add local CodeBuddy executor adapter"
```

### Task 4: Add CodeBuddy-specific evidence validation

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/evidence-validator.ts`
- Create: `apps/rede-social-agentes/apps/server/src/mcf-runtime/evidence-validator.codebuddy.test.ts`

**Interfaces:**
- Consumes signed CodeBuddy receipt.
- Produces `verifyForSkill` rejection unless receipt proves bounded local change evidence.

- [ ] **Step 1: Write failing evidence tests**

Create a signed fixture and prove acceptance only when:
```text
provider=codebuddy
operation=implement-change
commitSha is exact 40-char SHA
metadata.repository matches tool.resource and inputs.repository
metadata.baseCommitSha equals receipt.commitSha
changedFiles is non-empty
changedFileCount equals changedFiles.length
diffDigest and stdoutDigest are lowercase 64-char SHA-256 hex
localOnly=true
committed=false
exitCode=0
toolPolicy exactly contains Read/Edit/Glob/Grep and excludes Bash/MCP
```
Also mutate each critical field in separate test cases and expect `McfEvidenceRejectedError`.

- [ ] **Step 2: Run evidence tests and verify RED**

- [ ] **Step 3: Implement `validateCodeBuddyImplementReceipt`**

Call it from `verifyForSkill` only when `skill.skillId === 'MCF-IMPLEMENT-CHANGE'` and canonical operation is `implement-change`.

- [ ] **Step 4: Re-run evidence tests and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add apps/rede-social-agentes/apps/server/src/mcf-runtime/evidence-validator.ts \
        apps/rede-social-agentes/apps/server/src/mcf-runtime/evidence-validator.codebuddy.test.ts
git commit -m "test(mcf): validate CodeBuddy change receipts"
```

### Task 5: Wire the adapter into the live runtime registry

**Files:**
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.ts`
- Modify: `apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.adapter-registry.test.ts`

**Interfaces:**
- Consumes: runtime config and `EvidenceValidator`.
- Produces: `AdapterRegistry` containing the CodeBuddy adapter, which self-disables through `supports()` when configuration is disabled.

- [ ] **Step 1: Update the module regression test first**

Require `CodeBuddyExecutorAdapter` in the registry provider `inject` list and assert its adapter id is present in the constructed registry.

- [ ] **Step 2: Run the module test and verify RED**

- [ ] **Step 3: Register the adapter factory**

Factory construction must read `loadRuntimeConfig()` and pass only the five CodeBuddy config fields to the adapter. Add it to `AdapterRegistry` after the existing GitHub adapters.

- [ ] **Step 4: Re-run the module test and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.ts \
        apps/rede-social-agentes/apps/server/src/mcf-runtime/mcf-runtime.module.adapter-registry.test.ts
git commit -m "feat(mcf): register CodeBuddy executor"
```

### Task 6: Run focused and full repository validation

**Files:** none beyond prior tasks.

**Interfaces:**
- Consumes: Tasks 1-5.
- Produces: fresh evidence for merge readiness; does not merge.

- [ ] **Step 1: Run focused tests**

```bash
cd apps/rede-social-agentes
corepack pnpm --filter @rsa/server test -- \
  src/config.test.ts \
  src/mcf-runtime/permission-engine.codebuddy.test.ts \
  src/mcf-runtime/codebuddy-executor.adapter.test.ts \
  src/mcf-runtime/evidence-validator.codebuddy.test.ts \
  src/mcf-runtime/mcf-runtime.module.adapter-registry.test.ts
```
Expected: zero failures.

- [ ] **Step 2: Run server typecheck**

```bash
corepack pnpm --filter @rsa/server typecheck
```
Expected: exit 0.

- [ ] **Step 3: Run workspace format/lint/test/build verification**

```bash
corepack pnpm verify
```
Expected: exit 0. If unrelated baseline failures exist, report them with evidence and do not label the branch verified.

### Task 7: Perform a live local CodeBuddy smoke in a disposable worktree

**Files:**
- Runtime-only disposable Git worktree and one existing test fixture/file.
- No merge, push, deployment or publication.

**Interfaces:**
- Consumes: enabled local CodeBuddy config, canonical CodeBuddy 2.146.0, 9Router-backed model.
- Produces: one real signed MCF receipt plus an independently verified filesystem change.

- [ ] **Step 1: Create a clean disposable worktree from the feature branch**

Use a project-local ignored worktree path. Record exact starting SHA and verify `git status --porcelain` is empty.

- [ ] **Step 2: Enable the adapter only for the local test process**

Set:
```text
NODE_ENV=development
MCF_CODEBUDDY_EXECUTOR_ENABLED=true
MCF_CODEBUDDY_BINARY=<canonical codebuddy path>
MCF_CODEBUDDY_WORKSPACE_ROOT=<disposable worktree parent>
MCF_CODEBUDDY_MODEL=cx/gpt-5.6-sol
MCF_CODEBUDDY_TIMEOUT_MS=300000
```
Do not export or print 9Router credentials.

- [ ] **Step 3: Dispatch a bounded implementation request**

Use `MCF-IMPLEMENT-CHANGE`, provider `codebuddy`, operation `implement-change`, canonical repository resource, `authorizedScope=true`, and a minimal scope that changes one predetermined harmless fixture line.

- [ ] **Step 4: Independently verify the edit**

Use Git/Read outside CodeBuddy to confirm the exact file change and that no unexpected paths changed. Verify the receipt signature and CodeBuddy-specific metadata through `EvidenceValidator.verifyForSkill`.

- [ ] **Step 5: Clean the disposable worktree**

Remove only the disposable test worktree after evidence is recorded. Do not alter the feature branch working tree.

- [ ] **Step 6: Record final evidence without merge**

Report branch/head SHA, focused/full test results, live receipt id/digests, changed file path, CodeBuddy model, and the explicit state `merge=false`, `deploy=false`, `publication=false`.