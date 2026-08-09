import type { McfMissionState } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { ExternalActionLedger } from './external-action-ledger.js';
import type { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import type { McfRuntimeRepository } from './mcf-runtime.repository.js';
import type { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';
import { StagingDeployReconciliationService } from './staging-deploy-reconciliation.service.js';

const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';
const requestId = 'mcf-gate-d-settled-0001';
const releaseSha = 'b'.repeat(40);
const previousSha = 'a'.repeat(40);
const repositoryName = 'leon337/multiagent-collaboration-framework';

function missionRecord(state: McfMissionState) {
  return {
    id: missionId,
    contract: {
      title: 'Gate D',
      objective: 'Validate staging deploy',
      expectedOutcome: 'Verified staging deploy',
      scope: ['staging'],
      outOfScope: ['production'],
      acceptanceCriteria: ['verified'],
      riskClass: 'B' as const,
      selectedAgents: ['Gabriel', 'Mestre'],
      selectedSkills: ['MCF-DEPLOY-VALIDATE'],
      sourceOfTruth: ['issue-83'],
    },
    state,
    currentPhaseId: phaseId,
    currentAgentId: 'Gabriel',
    version: 8,
    createdAt: new Date('2026-08-09T00:00:00Z'),
    updatedAt: new Date('2026-08-09T00:00:00Z'),
  };
}

function phaseRecord(state: 'COMPLETED' | 'RECOVERING', completed: boolean) {
  return {
    id: phaseId,
    missionId,
    skillId: 'MCF-DEPLOY-VALIDATE',
    agentId: 'Gabriel',
    state,
    cycle: 1,
    inputs: {
      repository: repositoryName,
      artifact_or_commit: releaseSha,
      target_environment: 'staging',
      idempotency_key: requestId,
    },
    expectedEvidence: ['deployment_id'],
    startedAt: new Date('2026-08-09T00:00:00Z'),
    completedAt: completed ? new Date('2026-08-09T00:01:00Z') : null,
    createdAt: new Date('2026-08-09T00:00:00Z'),
    updatedAt: new Date('2026-08-09T00:01:00Z'),
  };
}

function createSettledScenario(
  status: 'EVIDENCE_VALIDATED' | 'EVIDENCE_REJECTED',
  missionState: McfMissionState,
) {
  const mission = missionRecord(missionState);
  const phase = phaseRecord(
    status === 'EVIDENCE_VALIDATED' ? 'COMPLETED' : 'RECOVERING',
    status === 'EVIDENCE_VALIDATED',
  );

  const completePendingPhase = vi.fn();
  const repository = {
    findMission: vi.fn(async () => mission),
    findPhase: vi.fn(async () => phase),
    completePendingPhase,
  } as unknown as McfRuntimeRepository;
  const reconcile = vi.fn();
  const adapter = { reconcile } as unknown as GitHubActionsStagingDeployAdapter;
  const execute = vi.fn();
  const executor = { execute } as unknown as SkillExecutor;
  const load = vi.fn();
  const registry = { load } as unknown as SkillRegistryLoader;
  const recordEvidenceValidated = vi.fn();
  const recordEvidenceRejected = vi.fn();
  const ledger = {
    loadStagingDeployReconciliationAttempt: vi.fn(async () => ({
      attemptId: 'attempt-settled',
      status,
      expectedMissionVersion: 7,
      agentId: 'Gabriel',
      skillId: 'MCF-DEPLOY-VALIDATE',
      resource: repositoryName,
      previousSha: null,
      reconciliationEligible: false,
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
    reconcile,
    execute,
    load,
    completePendingPhase,
    recordEvidenceValidated,
    recordEvidenceRejected,
  };
}

function createUnknownScenario() {
  const mission = missionRecord('RECOVERING');
  const phase = phaseRecord('RECOVERING', false);
  const completedMission = { ...mission, state: 'EXECUTING' as const, version: 9 };
  const completedPhase = phaseRecord('COMPLETED', true);
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
    receiptId: 'receipt-gate-d-reconcile-4242',
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
  const adapter = { reconcile } as unknown as GitHubActionsStagingDeployAdapter;
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
  const executor = { execute } as unknown as SkillExecutor;
  const load = vi.fn(async () => skill);
  const registry = { load } as unknown as SkillRegistryLoader;
  const recordEvidenceValidated = vi.fn(async () => {});
  const recordEvidenceRejected = vi.fn(async () => {});
  const ledger = {
    loadStagingDeployReconciliationAttempt: vi.fn(async () => ({
      attemptId: 'attempt-unknown',
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
    reconcile,
    execute,
    load,
    completePendingPhase,
    recordEvidenceValidated,
    recordEvidenceRejected,
    completion,
  };
}

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

describe('StagingDeployReconciliationService settled callbacks', () => {
  it('accepts a callback as a duplicate after evidence was already validated', async () => {
    const scenario = createSettledScenario('EVIDENCE_VALIDATED', 'EXECUTING');

    await expect(scenario.service.accept(callbackRequest())).resolves.toEqual({
      accepted: true,
      duplicate: true,
      evidenceStatus: 'VALID',
      missionState: 'EXECUTING',
    });

    expect(scenario.reconcile).not.toHaveBeenCalled();
    expect(scenario.execute).not.toHaveBeenCalled();
    expect(scenario.load).not.toHaveBeenCalled();
    expect(scenario.completePendingPhase).not.toHaveBeenCalled();
    expect(scenario.recordEvidenceValidated).not.toHaveBeenCalled();
    expect(scenario.recordEvidenceRejected).not.toHaveBeenCalled();
  });

  it('accepts a callback as a duplicate after evidence was already rejected', async () => {
    const scenario = createSettledScenario('EVIDENCE_REJECTED', 'RECOVERING');

    await expect(scenario.service.accept(callbackRequest())).resolves.toEqual({
      accepted: true,
      duplicate: true,
      evidenceStatus: 'INVALID',
      missionState: 'RECOVERING',
    });

    expect(scenario.reconcile).not.toHaveBeenCalled();
    expect(scenario.execute).not.toHaveBeenCalled();
    expect(scenario.load).not.toHaveBeenCalled();
    expect(scenario.completePendingPhase).not.toHaveBeenCalled();
    expect(scenario.recordEvidenceValidated).not.toHaveBeenCalled();
    expect(scenario.recordEvidenceRejected).not.toHaveBeenCalled();
  });
});

describe('StagingDeployReconciliationService durable completion ordering', () => {
  it('does not settle evidence when phase completion fails', async () => {
    const scenario = createUnknownScenario();
    scenario.completePendingPhase.mockRejectedValueOnce(new Error('transient completion failure'));

    await expect(scenario.service.accept(callbackRequest())).rejects.toThrow(
      'transient completion failure',
    );

    expect(scenario.completePendingPhase).toHaveBeenCalledTimes(1);
    expect(scenario.recordEvidenceValidated).not.toHaveBeenCalled();
    expect(scenario.recordEvidenceRejected).not.toHaveBeenCalled();
  });

  it('can retry ledger settlement after the phase transaction already committed', async () => {
    const scenario = createUnknownScenario();
    scenario.completePendingPhase
      .mockResolvedValueOnce(scenario.completion)
      .mockResolvedValueOnce({ ...scenario.completion, duplicate: true });
    scenario.recordEvidenceValidated.mockRejectedValueOnce(new Error('ledger temporarily unavailable'));

    await expect(scenario.service.accept(callbackRequest())).rejects.toThrow(
      'ledger temporarily unavailable',
    );

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
