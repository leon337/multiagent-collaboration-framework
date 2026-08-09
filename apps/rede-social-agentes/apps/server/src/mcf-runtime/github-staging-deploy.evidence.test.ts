import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import {
  stagingDeploymentOutcome,
  verifyGitHubStagingDeployEvidence,
} from './github-staging-deploy.evidence.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';
const RELEASE_SHA = 'b'.repeat(40);
const PREVIOUS_SHA = 'a'.repeat(40);
const KEY = 'mcf-gate-d-idempotency-0001';
const RUN_ID = 4242;

const skill: McfSkillDefinition = {
  skillId: 'MCF-DEPLOY-VALIDATE',
  name: 'Deploy Validate',
  version: '1.0.0',
  purpose: 'verified staging deployment',
  ownerAgents: ['Bruno', 'Gabriel'],
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

const tool = { provider: 'github', operation: 'deploy-staging', resource: REPOSITORY };

const inputs = {
  repository: REPOSITORY,
  artifact_or_commit: RELEASE_SHA,
  target_environment: 'staging',
  idempotency_key: KEY,
  authorizedScope: true,
};

const context = {
  agentId: 'Gabriel',
  executionContext: {
    missionId: 'mission-gate-d',
    phaseId: 'phase-gate-d',
    expectedMissionVersion: 7,
  },
};

function receipt(
  outcome: 'DEPLOYED' | 'NOOP' | 'RECOVERED' = 'DEPLOYED',
  overrides: Record<string, unknown> = {},
): McfToolReceipt {
  const previousSha = outcome === 'NOOP' ? RELEASE_SHA : PREVIOUS_SHA;
  const verifiedSha = outcome === 'RECOVERED' ? previousSha : RELEASE_SHA;
  const conclusion = outcome === 'RECOVERED' ? 'failure' : 'success';
  const evidence = new EvidenceValidator();
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
      workflowDisplayTitle: `MCF staging deploy ${KEY} ${RELEASE_SHA} ${context.executionContext.missionId} ${context.executionContext.phaseId}`,
      workflowEvent: 'workflow_dispatch',
      workflowStatus: 'completed',
      workflowConclusion: conclusion,
      conclusion,
      requestId: KEY,
      idempotencyKey: KEY,
      requestedSha: RELEASE_SHA,
      previousSha,
      verifiedSha,
      stagingReady: true,
      stagingReadyStatus: 200,
      deploymentProvider: 'render',
      targetEnvironment: 'staging',
      deploymentOutcome: outcome,
      deploymentStatus: outcome === 'RECOVERED' ? 'recovered' : 'success',
      smokeStatus: 'pass',
      rollbackAvailable: true,
      recoveryStrategy: 'REDEPLOY_PREVIOUS_HEALTHY_SHA',
      nativeRollbackClaimed: false,
      resultStatus: outcome === 'RECOVERED' ? 'RECOVERED' : 'SUCCEEDED',
      requestBudget: { requests: 12, limit: 250 },
      requiredPermissions: ['actions:read', 'actions:write', 'contents:read'],
      evidenceUrls: [
        `https://github.com/${REPOSITORY}/actions/runs/${RUN_ID}`,
        `https://github.com/${REPOSITORY}/commit/${RELEASE_SHA}`,
      ],
      skillId: skill.skillId,
      skillVersion: skill.version,
      agentId: context.agentId,
      missionId: context.executionContext.missionId,
      phaseId: context.executionContext.phaseId,
      expectedMissionVersion: context.executionContext.expectedMissionVersion,
      ...overrides,
    },
  });
}

function verify(value: McfToolReceipt, inputOverrides: Record<string, unknown> = {}) {
  const evidence = new EvidenceValidator();
  evidence.verify(value, tool);
  verifyGitHubStagingDeployEvidence(value, tool, skill, { ...inputs, ...inputOverrides }, context);
}

describe('GitHub staging deploy evidence', () => {
  beforeEach(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('accepts exact healthy DEPLOYED evidence', () => {
    const value = receipt('DEPLOYED');
    expect(() => verify(value)).not.toThrow();
    expect(stagingDeploymentOutcome(value)).toBe('DEPLOYED');
  });

  it('accepts NOOP only when the requested release was already the previous healthy SHA', () => {
    expect(() => verify(receipt('NOOP'))).not.toThrow();
  });

  it('accepts RECOVERED as valid evidence of restored previous SHA', () => {
    const value = receipt('RECOVERED');
    expect(() => verify(value)).not.toThrow();
    expect(stagingDeploymentOutcome(value)).toBe('RECOVERED');
  });

  it('rejects a workflow URL that is not bound to the external run id', () => {
    const value = receipt('DEPLOYED', {
      workflowRunUrl: `https://github.com/${REPOSITORY}/actions/runs/9999`,
    });
    expect(() => verify(value)).toThrow(/workflowRunUrl must match workflowRunId/u);
  });

  it('rejects a verified SHA that does not match the requested release', () => {
    const value = receipt('DEPLOYED', { verifiedSha: PREVIOUS_SHA });
    expect(() => verify(value)).toThrow(/exact healthy release/u);
  });

  it('rejects recovery that claims native Render rollback', () => {
    const value = receipt('RECOVERED', { nativeRollbackClaimed: true });
    expect(() => verify(value)).toThrow(/recovery\/smoke metadata is invalid/u);
  });

  it('rejects mismatched generic and workflow conclusions', () => {
    const value = receipt('DEPLOYED', { conclusion: 'failure' });
    expect(() => verify(value)).toThrow(/conclusion aliases do not match/u);
  });

  it('rejects evidence bound to another mission version', () => {
    const value = receipt('DEPLOYED', { expectedMissionVersion: 8 });
    expect(() => verify(value)).toThrow(/governed execution context/u);
  });

  it('rejects production input even with otherwise valid receipt', () => {
    const value = receipt('DEPLOYED');
    expect(() => verify(value, { target_environment: 'production' })).toThrow(
      /target_environment=staging/u,
    );
  });
});
