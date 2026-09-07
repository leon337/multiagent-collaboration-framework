import type { McfSkillDefinition } from '@rsa/contracts';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-IMPLEMENT-CHANGE',
  name: 'Implementar mudança autorizada',
  version: '1.0.0',
  purpose: 'Implementar mudança.',
  ownerAgents: ['Rafael'],
  requiredInputs: ['approved_scope', 'acceptance_criteria', 'repository', 'allowed_paths'],
  allowedTools: ['CodeBuddy'],
  forbiddenTools: [],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['implementar'],
  requiredEvidence: ['changed_files', 'base_commit_sha', 'diff_digest', 'test_results_or_handoff'],
  acceptanceCriteria: ['scope_respected'],
  failureModes: ['scope_creep'],
  fallback: 'patch',
  handoffTo: 'Vinicius',
};

const tool = {
  provider: 'codebuddy',
  operation: 'implement-change',
  resource: 'leon337/multiagent-collaboration-framework',
};
const inputs = {
  repository: tool.resource,
  allowed_paths: ['fixture.txt'],
  model: 'cx/gpt-5.6-sol',
};
const sha = 'a'.repeat(40);
const patch = 'diff --git a/fixture.txt b/fixture.txt\n+AFTER\n';
const digest = createHash('sha256').update(patch).digest('hex');

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

function receipt(evidence: EvidenceValidator, metadata: Record<string, unknown> = {}) {
  return evidence.createTrustedReceipt({
    provider: 'codebuddy',
    operation: 'implement-change',
    resource: tool.resource,
    externalId: 'local-execution-1',
    commitSha: sha,
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    metadata: {
      adapterId: 'codebuddy-implement-change-local-v1',
      repository: tool.resource,
      workspaceRelativeToRoot: 'task-1',
      baseCommitSha: sha,
      changedFiles: ['fixture.txt'],
      changedFileCount: 1,
      approvedPaths: ['fixture.txt'],
      diffDigest: digest,
      diffArtifact: {
        encoding: 'base64',
        data: Buffer.from(patch, 'utf8').toString('base64'),
        byteLength: Buffer.byteLength(patch),
      },
      model: 'cx/gpt-5.6-sol',
      testHandoff: {
        skillId: 'MCF-RUN-TESTS',
        status: 'PENDING',
        reason: 'CODEBUDDY_TOOL_POLICY_EXCLUDES_TEST_EXECUTION',
      },
      toolPolicy: ['Read', 'Edit', 'Glob', 'Grep'],
      exitCode: 0,
      durationMs: 100,
      stdoutDigest: 'c'.repeat(64),
      localOnly: true,
      committed: false,
      executionIsolation: 'DISPOSABLE_GIT_WORKTREE',
      ...metadata,
    },
  });
}

describe('EvidenceValidator CodeBuddy implementation receipts', () => {
  it('accepts a bounded local CodeBuddy change receipt', () => {
    const evidence = new EvidenceValidator();
    expect(() => evidence.verifyForSkill(receipt(evidence), tool, skill, inputs)).not.toThrow();
  });

  it('rejects a receipt without structured approved paths', () => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(receipt(evidence, { approvedPaths: undefined }), tool, skill, inputs),
    ).toThrow(/approvedPaths|allowed_paths/i);
  });

  it('rejects changed files outside the approved paths', () => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(
        receipt(evidence, {
          approvedPaths: ['fixture.txt'],
          changedFiles: ['src/outside.ts'],
          changedFileCount: 1,
        }),
        tool,
        skill,
        inputs,
      ),
    ).toThrow(/approved|scope|path/i);
  });

  it('rejects a receipt without a pending handoff to MCF-RUN-TESTS', () => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(receipt(evidence, { testHandoff: undefined }), tool, skill, inputs),
    ).toThrow(/testHandoff|MCF-RUN-TESTS|tests/i);
  });

  it('rejects a handoff to a different skill', () => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(
        receipt(evidence, {
          testHandoff: {
            skillId: 'MCF-REVIEW-CODE',
            status: 'PENDING',
            reason: 'CODEBUDDY_TOOL_POLICY_EXCLUDES_TEST_EXECUTION',
          },
        }),
        tool,
        skill,
        inputs,
      ),
    ).toThrow(/MCF-RUN-TESTS/i);
  });

  it('rejects a receipt that does not prove disposable-worktree isolation', () => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(
        receipt(evidence, { executionIsolation: undefined }),
        tool,
        skill,
        inputs,
      ),
    ).toThrow(/isolation|worktree/i);
  });

  it('rejects a receipt whose model differs from the authorized execution model', () => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(receipt(evidence, { model: 'other/model' }), tool, skill, inputs),
    ).toThrow(/model/i);
  });

  it('rejects a well-formed diff digest that does not match the signed diff artifact bytes', () => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(
        receipt(evidence, { diffDigest: 'd'.repeat(64) }),
        tool,
        skill,
        inputs,
      ),
    ).toThrow(/diffArtifact|diffDigest|digest/i);
  });

  it.each([
    ['empty changes', { changedFiles: [], changedFileCount: 0 }],
    ['wrong base sha', { baseCommitSha: 'd'.repeat(40) }],
    ['invalid diff digest', { diffDigest: 'not-a-digest' }],
    ['non-local execution', { localOnly: false }],
    ['committed execution', { committed: true }],
    ['Bash in tool policy', { toolPolicy: ['Read', 'Edit', 'Glob', 'Grep', 'Bash'] }],
  ])('rejects %s', (_name, mutation) => {
    const evidence = new EvidenceValidator();
    expect(() =>
      evidence.verifyForSkill(receipt(evidence, mutation), tool, skill, inputs),
    ).toThrow();
  });
});
