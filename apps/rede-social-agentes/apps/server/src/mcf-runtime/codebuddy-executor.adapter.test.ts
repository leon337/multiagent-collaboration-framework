import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import {
  CodeBuddyExecutorAdapter,
  LocalCodeBuddyHost,
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
  requiredInputs: ['approved_scope', 'acceptance_criteria', 'repository'],
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
  };

  inspectWorkspace = vi.fn(async () => this.snapshot);
  execute = vi.fn(async () => this.result);
  collectChanges = vi.fn(async () => this.changes);
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

describe('LocalCodeBuddyHost', () => {
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

  it('maps process timeout to ADAPTER_TIMEOUT', async () => {
    const { adapter: subject, host } = adapter();
    host.result.timedOut = true;
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'ADAPTER_TIMEOUT' });
  });

  it('maps non-zero CodeBuddy exit to ADAPTER_FAILURE', async () => {
    const { adapter: subject, host } = adapter();
    host.result.exitCode = 2;
    await expect(subject.execute(request)).rejects.toMatchObject({ code: 'ADAPTER_FAILURE' });
  });

  it('rejects successful execution with no changed files', async () => {
    const { adapter: subject, host } = adapter();
    host.changes = { changedFiles: [], diff: '' };
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
        model: 'cx/gpt-5.6-sol',
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
