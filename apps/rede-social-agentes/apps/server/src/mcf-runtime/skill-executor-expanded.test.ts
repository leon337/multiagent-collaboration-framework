import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const commitSha = '1234567890abcdef1234567890abcdef12345678';
const repository = 'leon337/multiagent-collaboration-framework';

function definition(input: {
  skillId: string;
  ownerAgents: string[];
  requiredInputs: string[];
  allowedTools: string[];
  permissionProfile: McfSkillDefinition['permissionProfile'];
  handoffTo: string;
}): McfSkillDefinition {
  return {
    skillId: input.skillId,
    name: input.skillId,
    version: '1.0.0',
    purpose: 'Expanded runtime test skill.',
    ownerAgents: input.ownerAgents,
    requiredInputs: input.requiredInputs,
    allowedTools: input.allowedTools,
    forbiddenTools: ['fabricated_evidence'],
    permissionProfile: input.permissionProfile,
    executionSteps: ['execute', 'collect_evidence'],
    requiredEvidence: ['receipt'],
    acceptanceCriteria: ['evidence_valid'],
    failureModes: ['evidence_missing'],
    fallback: 'Record a verifiable block.',
    handoffTo: input.handoffTo,
  };
}

const skills = new Map<string, McfSkillDefinition>([
  [
    'MCF-AUDIT-VISUAL-DESKTOP',
    definition({
      skillId: 'MCF-AUDIT-VISUAL-DESKTOP',
      ownerAgents: ['Augusto', 'Beatriz'],
      requiredInputs: ['audit_request', 'requested_unit', 'output_directory', 'authorizedScope'],
      allowedTools: ['SentinelX', 'Remote_Desktop_Commander'],
      permissionProfile: 'SCOPED_WRITE',
      handoffTo: 'Beatriz',
    }),
  ],
  [
    'MCF-SELECT-AGENTS',
    definition({
      skillId: 'MCF-SELECT-AGENTS',
      ownerAgents: ['Mestre', 'Leo'],
      requiredInputs: ['mission_contract'],
      allowedTools: ['GitHub'],
      permissionProfile: 'READ_ONLY',
      handoffTo: 'selected_domain_agent',
    }),
  ],
  [
    'MCF-REVIEW-CODE',
    definition({
      skillId: 'MCF-REVIEW-CODE',
      ownerAgents: ['Vinicius'],
      requiredInputs: ['diff_or_commit'],
      allowedTools: ['GitHub'],
      permissionProfile: 'READ_AND_PROPOSE',
      handoffTo: 'Rafael',
    }),
  ],
  [
    'MCF-GIT-PR-RELEASE',
    definition({
      skillId: 'MCF-GIT-PR-RELEASE',
      ownerAgents: ['Gabriel'],
      requiredInputs: ['repository', 'branch', 'acceptance_state'],
      allowedTools: ['GitHub'],
      permissionProfile: 'SCOPED_WRITE',
      handoffTo: 'Mestre',
    }),
  ],
  [
    'MCF-DEPLOY-VALIDATE',
    definition({
      skillId: 'MCF-DEPLOY-VALIDATE',
      ownerAgents: ['Bruno', 'Gabriel'],
      requiredInputs: ['artifact_or_commit', 'target_environment'],
      allowedTools: ['Render', 'Vercel', 'Cloudflare'],
      permissionProfile: 'SCOPED_WRITE',
      handoffTo: 'Augusto',
    }),
  ],
  [
    'MCF-TRACE-MISSION',
    definition({
      skillId: 'MCF-TRACE-MISSION',
      ownerAgents: ['Augusto'],
      requiredInputs: ['mission_execution'],
      allowedTools: ['GitHub'],
      permissionProfile: 'READ_ONLY',
      handoffTo: 'Beatriz',
    }),
  ],
]);

function createExecutor(): { executor: SkillExecutor; evidence: EvidenceValidator } {
  const registry = {
    load: async (skillId: string) => {
      const skill = skills.get(skillId);
      if (!skill) throw new Error(`missing ${skillId}`);
      return skill;
    },
  } as SkillRegistryLoader;
  const evidence = new EvidenceValidator();
  return {
    executor: new SkillExecutor(registry, new PermissionEngine(), evidence),
    evidence,
  };
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-expanded-0001';
});

describe('SkillExecutor expanded batch', () => {
  it('executes agent selection internally and resolves the selected domain handoff', async () => {
    const { executor } = createExecutor();
    const result = await executor.execute({
      skillId: 'MCF-SELECT-AGENTS',
      agentId: 'Mestre',
      inputs: {
        mission_contract: { objective: 'Implement runtime' },
        selected_domain_agent: 'Rafael',
      },
      tool: {
        provider: 'internal',
        operation: 'inspect-selection',
        resource: 'mcf-chat-bridge',
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      handoffTo: 'Rafael',
    });
    expect(result.receipt?.metadata.handoffTo).toBe('Rafael');
  });

  it('rejects selection without an explicit domain handoff', async () => {
    const { executor } = createExecutor();
    await expect(
      executor.execute({
        skillId: 'MCF-SELECT-AGENTS',
        agentId: 'Mestre',
        inputs: { mission_contract: { objective: 'Implement runtime' } },
        tool: {
          provider: 'internal',
          operation: 'inspect-selection',
          resource: 'mcf-chat-bridge',
        },
      }),
    ).rejects.toThrow(/selected_domain_agent/u);
  });

  it('executes mission trace internally without external claims', async () => {
    const { executor } = createExecutor();
    const result = await executor.execute({
      skillId: 'MCF-TRACE-MISSION',
      agentId: 'Augusto',
      inputs: { mission_execution: { missionId: 'mission-1', events: [] } },
      tool: {
        provider: 'internal',
        operation: 'inspect-mission',
        resource: 'mcf-mission-timeline',
      },
    });

    expect(result).toMatchObject({ evidenceStatus: 'VALID', handoffTo: 'Beatriz' });
  });

  it('accepts a signed GitHub code-review receipt with semantic evidence', async () => {
    const { executor, evidence } = createExecutor();
    const tool = {
      provider: 'github',
      operation: 'inspect-code',
      resource: repository,
    };
    const receipt = evidence.createTrustedReceipt({
      ...tool,
      externalId: 'pr-55-review',
      commitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        findingsCount: 2,
        verdict: 'PASS_WITH_MINOR_RESERVATIONS',
        reviewedFiles: ['src/runtime.ts', 'src/runtime.test.ts'],
      },
    });

    const result = await executor.execute({
      skillId: 'MCF-REVIEW-CODE',
      agentId: 'Vinicius',
      inputs: { diff_or_commit: commitSha },
      tool: { ...tool, externalReceipt: receipt },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      handoffTo: 'Rafael',
    });
  });

  it('marks a signed but semantically incomplete review receipt invalid', async () => {
    const { executor, evidence } = createExecutor();
    const tool = {
      provider: 'github',
      operation: 'inspect-code',
      resource: repository,
    };
    const receipt = evidence.createTrustedReceipt({
      ...tool,
      externalId: 'pr-55-review',
      commitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: { findingsCount: 0, verdict: 'PASS' },
    });

    const result = await executor.execute({
      skillId: 'MCF-REVIEW-CODE',
      agentId: 'Vinicius',
      inputs: { diff_or_commit: commitSha },
      tool: { ...tool, externalReceipt: receipt },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      missionState: 'RECOVERING',
    });
    expect(result.rejectionReason).toMatch(/reviewedFiles/u);
  });

  it('accepts PR evidence only with green CI and an approved gate', async () => {
    const { executor, evidence } = createExecutor();
    const tool = { provider: 'github', operation: 'pull-request', resource: repository };
    const receipt = evidence.createTrustedReceipt({
      ...tool,
      externalId: '57',
      commitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: { ciStatus: 'success', gateDecision: 'approved', prState: 'merged' },
    });

    const result = await executor.execute({
      skillId: 'MCF-GIT-PR-RELEASE',
      agentId: 'Gabriel',
      inputs: {
        repository,
        branch: 'feature/runtime',
        acceptance_state: 'approved',
        authorizedScope: true,
      },
      tool: { ...tool, externalReceipt: receipt },
    });

    expect(result).toMatchObject({ evidenceStatus: 'VALID', handoffTo: 'Mestre' });
  });

  it('rejects a PR receipt with red CI even when the signature is valid', async () => {
    const { executor, evidence } = createExecutor();
    const tool = { provider: 'github', operation: 'pull-request', resource: repository };
    const receipt = evidence.createTrustedReceipt({
      ...tool,
      externalId: '57',
      commitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: { ciStatus: 'failure', gateDecision: 'approved', prState: 'open' },
    });

    const result = await executor.execute({
      skillId: 'MCF-GIT-PR-RELEASE',
      agentId: 'Gabriel',
      inputs: {
        repository,
        branch: 'feature/runtime',
        acceptance_state: 'approved',
        authorizedScope: true,
      },
      tool: { ...tool, externalReceipt: receipt },
    });

    expect(result.evidenceStatus).toBe('INVALID');
    expect(result.rejectionReason).toMatch(/successful CI/u);
  });

  it('accepts a healthy staging deployment receipt with rollback available', async () => {
    const { executor, evidence } = createExecutor();
    const tool = {
      provider: 'render',
      operation: 'deploy-validate',
      resource: 'mcf-runtime-staging-api',
    };
    const receipt = evidence.createTrustedReceipt({
      ...tool,
      externalId: 'dep-staging-1',
      commitSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        deploymentStatus: 'live',
        smokeStatus: 'pass',
        rollbackAvailable: true,
      },
    });

    const result = await executor.execute({
      skillId: 'MCF-DEPLOY-VALIDATE',
      agentId: 'Bruno',
      inputs: {
        artifact_or_commit: commitSha,
        target_environment: 'staging',
        authorizedScope: true,
      },
      tool: { ...tool, externalReceipt: receipt },
    });

    expect(result).toMatchObject({ evidenceStatus: 'VALID', handoffTo: 'Augusto' });
  });

  it('requires a material gate for production targets in Portuguese', async () => {
    const { executor } = createExecutor();
    await expect(
      executor.execute({
        skillId: 'MCF-DEPLOY-VALIDATE',
        agentId: 'Bruno',
        inputs: {
          artifact_or_commit: commitSha,
          target_environment: 'produção',
          authorizedScope: true,
        },
        tool: {
          provider: 'render',
          operation: 'deploy-validate',
          resource: 'mcf-runtime-api',
        },
      }),
    ).rejects.toThrow(/humanGateApproved/u);
  });

  it('accepts a semantically complete SentinelX visual desktop audit receipt', async () => {
    const { executor, evidence } = createExecutor();
    const tool = {
      provider: 'SentinelX',
      operation: 'audit-desktop-visual',
      resource: 'authorized-desktop-session',
    };
    const receipt = evidence.createTrustedReceipt({
      ...tool,
      externalId: 'visual-audit-1',
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        requestedUnit: 'browser-window',
        expectedSurfaceCount: 3,
        actualSurfaceCount: 3,
        rawArtifact: '/tmp/audit-raw.png',
        annotatedArtifact: '/tmp/audit-annotated.png',
        verificationArtifact: '/tmp/audit-verification.png',
        surfaceInventory: [
          {
            windowId: '0x1',
            title: 'Left - Brave',
            x: 0,
            y: 0,
            width: 1360,
            height: 768,
            label: 'Current GROK BOT conversation',
          },
          {
            windowId: '0x2',
            title: 'Center - Brave',
            x: 1360,
            y: 0,
            width: 680,
            height: 714,
            label: 'GROK BOT chats',
          },
          {
            windowId: '0x3',
            title: 'Right - Brave',
            x: 2040,
            y: 0,
            width: 680,
            height: 714,
            label: 'GROK BOT chats',
          },
        ],
        elapsedMs: 3448,
        openVerified: true,
        criticalFailures: [],
        interpretationMode: 'ocr-fallback',
      },
    });

    const result = await executor.execute({
      skillId: 'MCF-AUDIT-VISUAL-DESKTOP',
      agentId: 'Augusto',
      inputs: {
        audit_request: 'Annotate the three Brave surfaces',
        requested_unit: 'browser-window',
        output_directory: '/tmp',
        authorizedScope: true,
        expected_surface_count: 3,
        time_budget_ms: 8000,
      },
      tool: { ...tool, externalReceipt: receipt },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      handoffTo: 'Beatriz',
    });
  });

  it('rejects visual audit evidence when the annotated artifact was not really opened', async () => {
    const { executor, evidence } = createExecutor();
    const tool = {
      provider: 'SentinelX',
      operation: 'audit-desktop-visual',
      resource: 'authorized-desktop-session',
    };
    const receipt = evidence.createTrustedReceipt({
      ...tool,
      externalId: 'visual-audit-not-opened',
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        requestedUnit: 'browser-window',
        expectedSurfaceCount: 1,
        actualSurfaceCount: 1,
        rawArtifact: '/tmp/raw.png',
        annotatedArtifact: '/tmp/annotated.png',
        verificationArtifact: '/tmp/verification.png',
        surfaceInventory: [
          {
            windowId: '0x1',
            title: 'Brave',
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            label: 'Visible content',
          },
        ],
        elapsedMs: 2000,
        openVerified: false,
        criticalFailures: [],
        interpretationMode: 'ocr-fallback',
      },
    });

    const result = await executor.execute({
      skillId: 'MCF-AUDIT-VISUAL-DESKTOP',
      agentId: 'Augusto',
      inputs: {
        audit_request: 'Audit one window',
        requested_unit: 'browser-window',
        output_directory: '/tmp',
        authorizedScope: true,
      },
      tool: { ...tool, externalReceipt: receipt },
    });

    expect(result.evidenceStatus).toBe('INVALID');
    expect(result.rejectionReason).toMatch(/openVerified/u);
  });

  it('rejects a visual desktop audit request that uses an operation outside the bounded adapter', async () => {
    const { executor } = createExecutor();
    await expect(
      executor.execute({
        skillId: 'MCF-AUDIT-VISUAL-DESKTOP',
        agentId: 'Augusto',
        inputs: {
          audit_request: 'Audit the browser surfaces',
          requested_unit: 'browser-window',
          output_directory: '/tmp',
          authorizedScope: true,
        },
        tool: {
          provider: 'SentinelX',
          operation: 'execute-arbitrary-command',
          resource: 'authorized-desktop-session',
        },
      }),
    ).rejects.toThrow(/audit-desktop-visual/u);
  });
});
