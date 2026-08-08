import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionDispatcher } from './external-action-dispatcher.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const RELEASE_SHA = 'b'.repeat(40);
const PREVIOUS_SHA = 'a'.repeat(40);
const KEY = 'mcf-gate-d-idempotency-0001';
const RUN_ID = 4242;

const deploySkill: McfSkillDefinition = {
  skillId: 'MCF-DEPLOY-VALIDATE',
  name: 'Deploy Validate',
  version: '1.0.0',
  purpose: 'verified staging deployment',
  ownerAgents: ['Gabriel'],
  requiredInputs: ['artifact_or_commit', 'target_environment'],
  allowedTools: ['GitHub', 'Render'],
  forbiddenTools: ['public_production_without_gate'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: ['deployment_id', 'target', 'smoke_result', 'rollback_state'],
  acceptanceCriteria: ['healthy_deployment', 'rollback_available'],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

const executionContext = {
  missionId: 'mission-gate-d',
  phaseId: 'phase-gate-d',
  expectedMissionVersion: 7,
};

const inputs = {
  repository: REPOSITORY,
  artifact_or_commit: RELEASE_SHA,
  target_environment: 'staging',
  idempotency_key: KEY,
  authorizedScope: true,
};

function registry(): SkillRegistryLoader {
  return { load: async () => deploySkill } as unknown as SkillRegistryLoader;
}

function receipt(
  outcome: 'DEPLOYED' | 'RECOVERED',
  overrides: Record<string, unknown> = {},
): McfToolReceipt {
  const evidence = new EvidenceValidator();
  const recovered = outcome === 'RECOVERED';
  const conclusion = recovered ? 'failure' : 'success';
  return evidence.createTrustedReceipt({
    provider: 'github-actions',
    operation: 'deploy-staging',
    resource: REPOSITORY,
    externalId: String(RUN_ID),
    commitSha: RELEASE_SHA,
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    metadata: {
      adapterId: 'github-actions-staging-deploy-v1',
      adapterVersion: '1.0.0',
      repository: REPOSITORY,
      workflowPath: '.github/workflows/mcf-runtime-staging-deploy.yml',
      workflowRunId: RUN_ID,
      workflowRunUrl: `https://github.com/${REPOSITORY}/actions/runs/${RUN_ID}`,
      workflowDisplayTitle: `MCF staging deploy ${KEY} ${RELEASE_SHA}`,
      workflowEvent: 'workflow_dispatch',
      workflowStatus: 'completed',
      workflowConclusion: conclusion,
      conclusion,
      requestId: KEY,
      idempotencyKey: KEY,
      requestedSha: RELEASE_SHA,
      previousSha: PREVIOUS_SHA,
      verifiedSha: recovered ? PREVIOUS_SHA : RELEASE_SHA,
      stagingReady: true,
      stagingReadyStatus: 200,
      deploymentProvider: 'render',
      targetEnvironment: 'staging',
      deploymentOutcome: outcome,
      deploymentStatus: recovered ? 'recovered' : 'success',
      smokeStatus: 'pass',
      rollbackAvailable: true,
      recoveryStrategy: 'REDEPLOY_PREVIOUS_HEALTHY_SHA',
      nativeRollbackClaimed: false,
      resultStatus: recovered ? 'RECOVERED' : 'SUCCEEDED',
      requestBudget: { requests: 12, limit: 250 },
      requiredPermissions: ['actions:read', 'actions:write', 'contents:read'],
      evidenceUrls: [
        `https://github.com/${REPOSITORY}/actions/runs/${RUN_ID}`,
        `https://github.com/${REPOSITORY}/commit/${RELEASE_SHA}`,
      ],
      skillId: deploySkill.skillId,
      skillVersion: deploySkill.version,
      agentId: 'Gabriel',
      missionId: executionContext.missionId,
      phaseId: executionContext.phaseId,
      expectedMissionVersion: executionContext.expectedMissionVersion,
      ...overrides,
    },
  });
}

function executeInput(externalReceipt?: McfToolReceipt) {
  return {
    skillId: deploySkill.skillId,
    agentId: 'Gabriel',
    inputs,
    tool: {
      provider: 'github',
      operation: 'deploy-staging',
      resource: REPOSITORY,
      ...(externalReceipt ? { externalReceipt } : {}),
    },
    executionContext,
  };
}

describe('SkillExecutor Gate D staging semantics', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts exact healthy DEPLOYED evidence', async () => {
    const executor = new SkillExecutor(
      registry(),
      new PermissionEngine(),
      new EvidenceValidator(),
    );

    const result = await executor.execute(executeInput(receipt('DEPLOYED')));

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Mestre',
      rejectionReason: null,
    });
  });

  it('routes a cryptographically valid RECOVERED deployment into RECOVERING', async () => {
    const recovered = receipt('RECOVERED');
    const recordEvidenceRejected = vi.fn(async () => {});
    const dispatcher = {
      dispatch: vi.fn(async () => ({
        status: 'EXECUTED',
        adapterId: 'github-actions-staging-deploy-v1',
        attemptId: 'attempt-gate-d',
        receipt: recovered,
      })),
      recordEvidenceValidated: vi.fn(async () => {}),
      recordEvidenceRejected,
    } as unknown as ExternalActionDispatcher;
    const executor = new SkillExecutor(
      registry(),
      new PermissionEngine(),
      new EvidenceValidator(),
      dispatcher,
    );

    const result = await executor.execute(executeInput());

    expect(result).toMatchObject({
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      missionState: 'RECOVERING',
      handoffTo: null,
      externalAction: {
        status: 'EXECUTED',
        adapterId: 'github-actions-staging-deploy-v1',
        attemptId: 'attempt-gate-d',
      },
    });
    expect(result.rejectionReason).toMatch(/previous healthy SHA was restored/u);
    expect(recordEvidenceRejected).toHaveBeenCalledWith(
      'attempt-gate-d',
      recovered.receiptId,
      expect.stringMatching(/previous healthy SHA was restored/u),
    );
  });

  it('rejects signed but semantically inconsistent staging evidence', async () => {
    const executor = new SkillExecutor(
      registry(),
      new PermissionEngine(),
      new EvidenceValidator(),
    );
    const invalid = receipt('DEPLOYED', {
      workflowRunUrl: `https://github.com/${REPOSITORY}/actions/runs/9999`,
    });

    const result = await executor.execute(executeInput(invalid));

    expect(result).toMatchObject({
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      missionState: 'RECOVERING',
      handoffTo: null,
    });
    expect(result.rejectionReason).toMatch(/workflowRunUrl must match workflowRunId/u);
  });
});
