import { describe, expect, it, vi } from 'vitest';

import type { ExternalActionLedger } from './external-action-ledger.js';
import type { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import type { McfRuntimeRepository } from './mcf-runtime.repository.js';
import type { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';
import { StagingDeployReconciliationService } from './staging-deploy-reconciliation.service.js';

const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';
const requestId = 'mcf-gate-d-ordering-0001';
const repositoryName = 'leon337/multiagent-collaboration-framework';
const releaseSha = 'b'.repeat(40);
const previousSha = 'a'.repeat(40);

function callbackRequest() {
  return {
    missionId,
    phaseId,
    requestId,
    releaseSha,
    workflowRunId: '4242',
    repository: repositoryName,
    completedAt: '2026-08-09T00:02:00Z',
    stagingRuntimeUrl: 'https://staging.example.invalid',
  };
}

function createScenario() {
  const mission = {
    id: missionId,
    state: 'RECOVERING' as const,
    contract: {
      selectedAgents: ['Gabriel', 'Mestre'],
      selectedSkills: ['MCF-DEPLOY-VALIDATE'],
    },
  };
  const phase = {
    id: phaseId,
    missionId,
    skillId: 'MCF-DEPLOY-VALIDATE',
    agentId: 'Gabriel',
    state: 'RECOVERING' as const,
    inputs: {
      repository: repositoryName,
      artifact_or_commit: releaseSha,
      target_environment: 'staging',
      idempotency_key: requestId,
    },
  };
  const completedMission = {
    ...mission,
    state: 'EXECUTING' as const,
  };
  const completedPhase = {
    ...phase,
    state: 'COMPLETED' as const,
  };
  const completion = {
    duplicate: false,
    mission: completedMission,
    phase: completedPhase,
  };
  const completePendingPhase = vi.fn(async () => completion);
  const repository = {
    findMission: vi.fn(async () => mission),
    findPhase: vi.fn(async () => phase),
    completePendingPhase,
  } as unknown as McfRuntimeRepository;

  const receipt = {
    receiptId: 'receipt-gate-d-ordering-4242',
    provider: 'github-actions',
    status: 'SUCCEEDED' as const,
  };
  const skill = {
    skillId: 'MCF-DEPLOY-VALIDATE',
    requiredEvidence: ['deployment_id'],
    acceptanceCriteria: ['healthy_deployment'],
    fallback: 'Mestre',
  };
  const reconcile = vi.fn(async () => receipt);
  const adapter = {
    reconcile,
  } as unknown as GitHubActionsStagingDeployAdapter;
  const execute = vi.fn(async () => ({
    skill,
    receipt,
    evidenceStatus: 'VALID' as const,
    phaseState: 'COMPLETED' as const,
    missionState: 'EXECUTING' as const,
    handoffTo: 'Mestre',
    rejectionReason: null,
    externalAction: null,
  }));
  const executor = {
    execute,
  } as unknown as SkillExecutor;
  const load = vi.fn(async () => skill);
  const registry = {
    load,
  } as unknown as SkillRegistryLoader;
  const recordEvidenceValidated = vi.fn(async () => {});
  const recordEvidenceRejected = vi.fn(async () => {});
  const ledger = {
    loadStagingDeployReconciliationAttempt: vi.fn(async () => ({
      attemptId: 'attempt-ordering',
      status: 'UNKNOWN' as const,
      expectedMissionVersion: 7,
      agentId: 'Gabriel',
      skillId: 'MCF-DEPLOY-VALIDATE',
      resource: repositoryName,
      previousSha,
      reconciliationEligible: true,
    })),
    recordEvidenceValidated,
    recordEvidenceRejected,
  } as unknown as ExternalActionLedger;

  const service = new StagingDeployReconciliationService(
    repository,
    executor,
    registry,
    ledger,
    adapter,
  );

  return {
    service,
    completion,
    completePendingPhase,
    recordEvidenceValidated,
    recordEvidenceRejected,
  };
}

describe('staging reconciliation completion ordering', () => {
  it('keeps UNKNOWN when phase completion fails', async () => {
    const scenario = createScenario();
    const failure = new Error('transient completion failure');
    scenario.completePendingPhase.mockRejectedValueOnce(failure);

    await expect(
      scenario.service.accept(callbackRequest()),
    ).rejects.toThrow(failure);

    expect(scenario.completePendingPhase).toHaveBeenCalledTimes(1);
    expect(scenario.recordEvidenceValidated).not.toHaveBeenCalled();
    expect(scenario.recordEvidenceRejected).not.toHaveBeenCalled();
  });

  it('retries ledger settlement after phase commit', async () => {
    const scenario = createScenario();
    const duplicate = {
      ...scenario.completion,
      duplicate: true,
    };
    scenario.completePendingPhase
      .mockResolvedValueOnce(scenario.completion)
      .mockResolvedValueOnce(duplicate);
    const failure = new Error('ledger temporarily unavailable');
    scenario.recordEvidenceValidated.mockRejectedValueOnce(failure);

    await expect(
      scenario.service.accept(callbackRequest()),
    ).rejects.toThrow(failure);
    await expect(scenario.service.accept(callbackRequest())).resolves.toEqual({
      accepted: true,
      duplicate: true,
      evidenceStatus: 'VALID',
      missionState: 'EXECUTING',
    });

    expect(scenario.completePendingPhase).toHaveBeenCalledTimes(2);
    expect(scenario.recordEvidenceValidated).toHaveBeenCalledTimes(2);
    expect(scenario.recordEvidenceRejected).not.toHaveBeenCalled();
  });
});
