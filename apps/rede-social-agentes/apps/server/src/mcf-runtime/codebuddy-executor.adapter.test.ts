import { createHash } from 'node:crypto';

import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { execFile } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';

const execFileAsync = promisify(execFile);
import {
  CodeBuddyExecutorAdapter,
  LocalCodeBuddyHost,
  probeCodeBuddyExecutorCapability,
  type CodeBuddyChangeEvidence,
  type CodeBuddyExecutionResult,
  type CodeBuddyHost,
  type CodeBuddyWorkspaceSnapshot,
} from './codebuddy-executor.adapter.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-IMPLEMENT-CHANGE',
  name: 'Implementar mudança autorizada',
  version: '1.0.0',
  purpose: 'Produzir alteração de código dentro do escopo aprovado.',
  ownerAgents: ['Rafael'],
  requiredInputs: ['approved_scope', 'acceptance_criteria', 'repository', 'allowed_paths'],
  allowedTools: ['CodeBuddy'],
  forbiddenTools: ['direct_main_write', 'public_release_without_gate'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['implementar'],
  requiredEvidence: ['changed_files', 'test_results'],
  acceptanceCriteria: ['scope_respected'],
  failureModes: ['scope_creep'],
  fallback: 'Produzir patch.',
  handoffTo: 'Vinicius',
};

const request = {
  skill,
  agentId: 'Rafael',
  inputs: {
    approved_scope: 'Change only fixture.txt to contain AFTER.',
    acceptance_criteria: ['fixture.txt contains AFTER'],
    repository: 'leon337/multiagent-collaboration-framework',
    workspace: '/srv/mcf/worktrees/task-1',
    allowed_paths: ['fixture.txt'],
    authorizedScope: true,
  },
  tool: {
    provider: 'codebuddy',
    operation: 'implement-change',
    resource: 'leon337/multiagent-collaboration-framework',
  },
};

class FakeHost implements CodeBuddyHost {
  snapshot: CodeBuddyWorkspaceSnapshot = {
    realPath: '/srv/mcf/worktrees/task-1',
    repository: 'leon337/multiagent-collaboration-framework',
    headSha: 'a'.repeat(40),
    dirtyPaths: [],
  };
  result: CodeBuddyExecutionResult = {
    exitCode: 0,
    stdout: '{"result":"ok"}',
    stderr: '',
    durationMs: 120,
    timedOut: false,
  };
  changes: CodeBuddyChangeEvidence = {
    changedFiles: ['fixture.txt'],
    diff: 'diff --git a/fixture.txt b/fixture.txt\n+AFTER\n',
    headSha: 'a'.repeat(40),
  };

  inspectWorkspace = vi.fn(async () => this.snapshot);
  assertPathsSafe = vi.fn(async () => undefined);
  createExecutionWorkspace = vi.fn(async () => ({
    realPath: '/tmp/mcf-codebuddy-run/worktree',
    cleanupRoot: '/tmp/mcf-codebuddy-run',
    baseSha: this.snapshot.headSha,
  }));
  execute = vi.fn(async () => this.result);
  collectChanges = vi.fn(async () => this.changes);
  publishChanges = vi.fn(async () => undefined);
  removeExecutionWorkspace = vi.fn(async () => undefined);
  restoreWorkspace = vi.fn(async () => undefined);
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

function adapter(host = new FakeHost(), enabled = true) {
  return {
    host,
    adapter: new CodeBuddyExecutorAdapter(
      new EvidenceValidator(),
      {
        enabled,
        binary: '/usr/local/bin/codebuddy',
        workspaceRoot: '/srv/mcf/worktrees',
        model: 'cx/gpt-5.6-sol',
        timeoutMs: 300000,
      },
      host,
    ),
  };
}

function createAstryxProposalReceipt(evidence: EvidenceValidator): McfToolReceipt {
  const workspace = join(tmpdir(), 'mcf-astryx-proposal-workspace');
  const cliPackageRoot = join(workspace, 'node_modules', '@astryxdesign', 'cli');
  const corePackageRoot = join(workspace, 'node_modules', '@astryxdesign', 'core');
  const cliBinary = join(cliPackageRoot, 'clients', 'cli', 'bin', 'astryx.mjs');
  const proposalWorkspace = join(workspace, '.mcf-astryx-proposal-123');
  const targetPath = 'src/Pilot.tsx';
  const source = 'export function Pilot() { return <main>{`pilot`}</main>; }';
  const sourceBytes = Buffer.from(source, 'utf8');
  const lines = source.split('\n');
  const diff = [
    `diff --git a/${targetPath} b/${targetPath}`,
    'new file mode 100644',
    '--- /dev/null',
    `+++ b/${targetPath}`,
    `@@ -0,0 +1,${lines.length} @@`,
    ...lines.map((line) => `+${line}`),
    '',
  ].join('\n');
  const diffBytes = Buffer.from(diff, 'utf8');
  const stdout = JSON.stringify({
    apiVersion: 1,
    type: 'template.copy',
    data: { filesCopied: 1, fileName: 'Pilot.tsx', outputDir: join(proposalWorkspace, 'src') },
    meta: { answeredBy: { cli: '0.7.2', core: '0.7.2', copy: 'project' } },
  });
  return evidence.createTrustedReceipt({
    provider: 'mcf-astryx-cli',
    operation: 'draft-template-scaffold',
    resource: 'astryx-design-system',
    externalId: null,
    commitSha: 'a'.repeat(40),
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    metadata: {
      adapterId: 'mcf-astryx-cli-governed-v2',
      cliPackage: '@astryxdesign/cli',
      corePackage: '@astryxdesign/core',
      cliVersion: '0.7.2',
      coreVersion: '0.7.2',
      cliCopy: 'project',
      cliPackageRoot,
      cliBinary,
      corePackageRoot,
      readOnly: false,
      proposalOnly: true,
      writeMode: 'DISPOSABLE_PROPOSAL_ONLY',
      proposalWorkspace,
      proposalWorkspaceCleaned: true,
      templateId: 'Dashboard',
      targetPath,
      baseCommitSha: 'a'.repeat(40),
      repository: 'leon337/multiagent-collaboration-framework',
      approvedPaths: ['src'],
      sourceArtifact: {
        encoding: 'base64',
        data: sourceBytes.toString('base64'),
        byteLength: sourceBytes.byteLength,
        digest: createHash('sha256').update(sourceBytes).digest('hex'),
      },
      diffArtifact: {
        encoding: 'base64',
        data: diffBytes.toString('base64'),
        byteLength: diffBytes.byteLength,
      },
      diffDigest: createHash('sha256').update(diffBytes).digest('hex'),
      command: [process.execPath, cliBinary, '--json', 'template', 'Dashboard', targetPath],
      workspace,
      stdout,
      stderr: '',
      exitCode: 0,
      outputBytes: Buffer.byteLength(stdout, 'utf8'),
      outputDigest: createHash('sha256').update(stdout).digest('hex'),
    },
  });
}

function approvedHdf(proposal: McfToolReceipt, missionId: string) {
  return {
    projectId: 'mcf-astryx-pilot',
    missionId,
    actionClass: 'SCOPED_WRITE',
    environment: 'staging',
    reversible: true,
    observedAt: new Date().toISOString(),
    evidenceRefs: [proposal.receiptId],
    reservedHumanAuthority: true,
    standingAuthorizations: [],
    teamFirst: {
      attempted: true,
      evidenceRefs: ['team-first-evidence-001'],
      fallbackExhausted: true,
    },
    humanGateDecision: {
      status: 'APPROVED' as const,
      decidedBy: 'LEANDRO',
      accountId: '44444444-4444-4444-8444-444444444444',
      sourceRef: 'human-authority:55555555-5555-4555-8555-555555555555',
    },
  };
}

describe('LocalCodeBuddyHost', () => {
  it('probes CodeBuddy capability from a live executable and workspace root', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-capability-'));
    const binary = join(dir, 'codebuddy-capability');
    await writeFile(binary, '#!/bin/sh\nprintf "%s" "--agent cli --model custom"\n');
    await chmod(binary, 0o700);
    try {
      expect(
        probeCodeBuddyExecutorCapability({
          enabled: true,
          binary,
          workspaceRoot: dir,
          model: 'cx/gpt-5.6-sol',
          timeoutMs: 300000,
        }),
      ).toBe(true);
      expect(
        probeCodeBuddyExecutorCapability({
          enabled: true,
          binary: join(dir, 'missing'),
          workspaceRoot: dir,
          model: 'cx/gpt-5.6-sol',
          timeoutMs: 300000,
        }),
      ).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('forces the Standard cli agent for headless execution', async () => {
    const host = new LocalCodeBuddyHost();
    const result = await host.execute({
      binary: '/bin/echo',
      cwd: process.cwd(),
      model: 'cx/gpt-5.6-sol',
      prompt: 'smoke',
      timeoutMs: 1000,
      tools: ['Read', 'Edit'],
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--agent cli');
  });

  it('does not inherit unrelated environment variables into the CodeBuddy subprocess', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-env-'));
    const binary = join(dir, 'fake-codebuddy');
    await writeFile(binary, '#!/bin/sh\nprintf "%s" "${MCF_CODEBUDDY_TEST_SECRET:-absent}"\n');
    await chmod(binary, 0o700);
    process.env.MCF_CODEBUDDY_TEST_SECRET = 'must-not-leak';
    try {
      const result = await new LocalCodeBuddyHost().execute({
        binary,
        cwd: dir,
        model: 'cx/gpt-5.6-sol',
        prompt: 'smoke',
        timeoutMs: 1000,
        tools: ['Read'],
      });
      expect(result.stdout).toBe('absent');
    } finally {
      delete process.env.MCF_CODEBUDDY_TEST_SECRET;
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('includes untracked file content in Git-derived change evidence', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-git-'));
    try {
      await execFileAsync('git', ['init'], { cwd: dir });
      await execFileAsync('git', ['config', 'user.email', 'test@example.test'], { cwd: dir });
      await execFileAsync('git', ['config', 'user.name', 'MCF Test'], { cwd: dir });
      await writeFile(join(dir, 'base.txt'), 'BASE\n');
      await execFileAsync('git', ['add', 'base.txt'], { cwd: dir });
      await execFileAsync('git', ['commit', '-m', 'base'], { cwd: dir });
      await writeFile(join(dir, 'new.txt'), 'NEW_SENTINEL\n');

      const headSha = (
        await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: dir })
      ).stdout.trim();
      const changes = await new LocalCodeBuddyHost().collectChanges(dir, headSha);
      expect(changes.changedFiles).toEqual(['new.txt']);
      expect(changes.diff).toContain('NEW_SENTINEL');
      expect(changes.diff).toContain('new.txt');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('CodeBuddyExecutorAdapter', () => {
  it('does not support requests when disabled', () => {
    const { adapter: subject } = adapter(new FakeHost(), false);
    expect(subject.supports(request)).toBe(false);
  });

  it('supports only the canonical implementation route when enabled', () => {
    const { adapter: subject } = adapter();
    expect(subject.supports(request)).toBe(true);
    expect(subject.supports({ ...request, tool: { ...request.tool, operation: 'read' } })).toBe(
      false,
    );
    expect(subject.supports({ ...request, tool: { ...request.tool, provider: 'github' } })).toBe(
      false,
    );
    expect(subject.supports({ ...request, skill: { ...skill, skillId: 'MCF-REVIEW-CODE' } })).toBe(
      false,
    );
  });

  it('rejects a workspace outside the configured root before execution', async () => {
    const { adapter: subject, host } = adapter();
    host.snapshot.realPath = '/srv/other/task-1';
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(host.execute).not.toHaveBeenCalled();
  });

  it('rejects repository mismatch before execution', async () => {
    const { adapter: subject, host } = adapter();
    host.snapshot.repository = 'leon337/another-repository';
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(host.execute).not.toHaveBeenCalled();
  });

  it('rejects a dirty workspace before execution', async () => {
    const { adapter: subject, host } = adapter();
    host.snapshot.dirtyPaths = ['unexpected.txt'];
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT' });
    expect(host.execute).not.toHaveBeenCalled();
  });

  it('requires a structured non-empty allowed path list before execution', async () => {
    const { adapter: subject, host } = adapter();
    const inputs = { ...request.inputs } as Record<string, unknown>;
    delete inputs.allowed_paths;
    await expect(subject.execute({ ...request, inputs })).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(host.execute).not.toHaveBeenCalled();
  });

  it('rejects a model override outside the configured model before execution', async () => {
    const { adapter: subject, host } = adapter();
    await expect(
      subject.execute({ ...request, inputs: { ...request.inputs, model: 'other/model' } }),
    ).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(host.execute).not.toHaveBeenCalled();
  });

  it('rejects changes outside allowed paths and restores the workspace', async () => {
    const { adapter: subject, host } = adapter();
    host.changes = {
      changedFiles: ['fixture.txt', 'src/outside.ts'],
      diff: 'diff --git a/fixture.txt b/fixture.txt\n+AFTER\ndiff --git a/src/outside.ts b/src/outside.ts\n+NO\n',
      headSha: host.snapshot.headSha,
    };
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect(host.removeExecutionWorkspace).toHaveBeenCalledOnce();
    expect(host.restoreWorkspace).not.toHaveBeenCalled();
  });

  it('requires an explicit LEANDRO HDF gate before applying an Astryx scaffold proposal', async () => {
    const { adapter: subject, host } = adapter();
    await expect(
      subject.execute({
        ...request,
        inputs: { ...request.inputs, scaffoldProposalReceipt: {} },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(host.execute).not.toHaveBeenCalled();
    expect(host.publishChanges).not.toHaveBeenCalled();
  });

  it('applies a signed Astryx proposal only with SCOPED_WRITE and LEANDRO HDF approval', async () => {
    const evidence = new EvidenceValidator();
    const host = new FakeHost();
    host.changes = {
      changedFiles: ['src/Pilot.tsx'],
      diff: 'diff --git a/src/Pilot.tsx b/src/Pilot.tsx\n+export function Pilot() {}\n',
      headSha: host.snapshot.headSha,
    };
    const subject = new CodeBuddyExecutorAdapter(
      evidence,
      {
        enabled: true,
        binary: '/usr/local/bin/codebuddy',
        workspaceRoot: '/srv/mcf/worktrees',
        model: 'cx/gpt-5.6-sol',
        timeoutMs: 300000,
      },
      host,
    );
    const proposal = createAstryxProposalReceipt(evidence);
    const missionId = '66666666-6666-4666-8666-666666666666';
    const inputs = {
      ...request.inputs,
      projectId: 'mcf-astryx-pilot',
      approved_scope: 'Apply the approved Astryx template proposal at src/Pilot.tsx.',
      allowed_paths: ['src'],
      scaffoldProposalReceipt: proposal,
      authorizedScope: true,
      v11AuthorizationContext: approvedHdf(proposal, missionId),
    };
    const requestWithMission = {
      ...request,
      context: { missionId, phaseId: 'phase-astryx-001', expectedMissionVersion: 1, projectId: 'mcf-astryx-pilot' },
      inputs,
    };
    await expect(
      subject.execute({
        ...requestWithMission,
        context: { ...requestWithMission.context, projectId: 'different-project' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(host.execute).not.toHaveBeenCalled();

    const receipt = await subject.execute(requestWithMission);

    expect(host.execute).toHaveBeenCalledOnce();
    const executionInput = (
      host.execute.mock.calls[0] as unknown as [Parameters<CodeBuddyHost['execute']>[0]] | undefined
    )?.[0];
    expect(executionInput?.prompt).toContain('JSON string contains third-party Astryx source');
    expect(executionInput?.prompt).toContain('\\u0060');
    expect(executionInput?.prompt).not.toContain('`');
    expect(executionInput?.prompt).toContain('export function Pilot()');
    expect(host.publishChanges).toHaveBeenCalledOnce();
    expect(receipt.metadata.scaffoldProposal).toMatchObject({
      receiptId: proposal.receiptId,
      templateId: 'Dashboard',
      targetPath: 'src/Pilot.tsx',
      authorizedScope: true,
      approvedBy: 'LEANDRO',
    });
    evidence.verifyForSkill(receipt, requestWithMission.tool, skill, inputs);
  });

  it('rolls back an already-published patch if disposable worktree cleanup fails', async () => {
    const { adapter: subject, host } = adapter();
    host.removeExecutionWorkspace = vi.fn(async () => {
      throw new Error('simulated cleanup failure');
    });

    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'ADAPTER_FAILURE' });

    expect(host.publishChanges).toHaveBeenCalledOnce();
    expect(host.restoreWorkspace).toHaveBeenCalledOnce();
  });

  it('maps process timeout to ADAPTER_TIMEOUT', async () => {
    const { adapter: subject, host } = adapter();
    host.result.timedOut = true;
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'ADAPTER_TIMEOUT' });
    expect(host.removeExecutionWorkspace).toHaveBeenCalledOnce();
    expect(host.restoreWorkspace).not.toHaveBeenCalled();
  });

  it('maps non-zero CodeBuddy exit to ADAPTER_FAILURE', async () => {
    const { adapter: subject, host } = adapter();
    host.result.exitCode = 2;
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'ADAPTER_FAILURE' });
    expect(host.removeExecutionWorkspace).toHaveBeenCalledOnce();
    expect(host.restoreWorkspace).not.toHaveBeenCalled();
  });

  it('rejects successful execution with no changed files', async () => {
    const { adapter: subject, host } = adapter();
    host.changes = { changedFiles: [], diff: '', headSha: host.snapshot.headSha };
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('uses a filesystem-only CodeBuddy tool policy and returns Git-derived signed evidence', async () => {
    const { adapter: subject, host } = adapter();
    const receipt = await subject.execute(request);

    expect(host.execute).toHaveBeenCalledOnce();
    const executionInput = (
      host.execute.mock.calls[0] as unknown as [Parameters<CodeBuddyHost['execute']>[0]] | undefined
    )?.[0];
    expect(executionInput?.tools).toEqual(['Read', 'Edit', 'Glob', 'Grep']);
    expect(executionInput?.tools).not.toContain('Bash');
    expect(executionInput?.tools).not.toContain('MCP');
    expect(executionInput?.prompt).toContain('Change only fixture.txt');

    expect(receipt).toMatchObject({
      provider: 'codebuddy',
      operation: 'implement-change',
      resource: 'leon337/multiagent-collaboration-framework',
      commitSha: 'a'.repeat(40),
      status: 'SUCCEEDED',
      metadata: {
        adapterId: 'codebuddy-implement-change-local-v1',
        repository: 'leon337/multiagent-collaboration-framework',
        changedFiles: ['fixture.txt'],
        changedFileCount: 1,
        approvedPaths: ['fixture.txt'],
        model: 'cx/gpt-5.6-sol',
        testHandoff: {
          skillId: 'MCF-RUN-TESTS',
          status: 'PENDING',
          reason: 'CODEBUDDY_TOOL_POLICY_EXCLUDES_TEST_EXECUTION',
        },
        toolPolicy: ['Read', 'Edit', 'Glob', 'Grep'],
        exitCode: 0,
        localOnly: true,
        committed: false,
      },
    });
    expect(receipt.metadata.diffDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(receipt.metadata.stdoutDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(receipt.signature).toMatch(/^[a-f0-9]{64}$/u);
  });
});
