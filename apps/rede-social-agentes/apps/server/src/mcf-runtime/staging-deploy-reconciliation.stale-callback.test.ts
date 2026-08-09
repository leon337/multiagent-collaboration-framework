import { describe, expect, it, vi } from 'vitest';

import type { ExternalActionLedger } from './external-action-ledger.js';
import type { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import type { McfRuntimeRepository } from './mcf-runtime.repository.js';
import type { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';
import { StagingDeployReconciliationService } from './staging-deploy-reconciliation.service.js';

const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';
const newerPhaseId = '33333333-3333-4333-8333-333333333333';
const requestId = 'mcf-gate-d-stale-0001';
const repositoryName = 'leon337/multiagent-collaboration-framework';
const releaseSha = 'b'.repeat(40);

function callbackRequest() {
  return {
    missionId,
    phaseId,
    requestId,
    releaseSha,
    workflowRunId: '5252',
    repository: repositoryName,
    completedAt: '2026-08-09T00:02:00Z',
    stagingRuntimeUrl: 'https://staging.example.invalid',
  };
}

describe('StagingDeployReconciliationService stale callbacks', () => {
  it('rejects a callback after the mission advanced beyond its pending version and phase', async () => {
    const repository = {
      findMission: vi.fn(async () => ({
        id: missionId,
        contract: {
          title: 'Gate D stale callback',
          objective: 'Reject stale asynchronous completion.',
          expectedOutcome: 'Newer mission state is preserved.',
          scope: ['staging'],
          outOfScope: ['production'],
          acceptanceCriteria: ['stale callback rejected'],
          riskClass: 'B' as const,
          selectedAgents: ['Gabriel', 'Mestre'],
          selectedSkills: ['MCF-DEPLOY-VALIDATE'],
          sourceOfTruth: ['issue-83'],
        },
        state: 'EXECUTING' as const,
        currentPhaseId: newerPhaseId,
        currentAgentId: 'Mestre',
        version: 9,
        createdAt: new Date('2026-08-09T00:00:00Z'),
        updatedAt: new Date('2026-08-09T00:03:00Z'),
      })),
      findPhase: vi.fn(async () => ({
        id: phaseId,
        missionId,
        skillId: 'MCF-DEPLOY-VALIDATE',
        agentId: 'Gabriel',
        state: 'RECOVERING' as const,
        cycle: 1,
        inputs: {
          repository: repositoryName,
          artifact_or_commit: releaseSha,
          target_environment: 'staging',
          idempotency_key: requestId,
        },
        expectedEvidence: ['deployment_id'],
        startedAt: new Date('2026-08-09T00:00:00Z'),
        completedAt: null,
        createdAt: new Date('2026-08-09T00:00:00Z'),
        updatedAt: new Date('2026-08-09T00:01:00Z'),
      })),
      listEvents: vi.fn(async () => []),
      completePendingPhase: vi.fn(),
    } as unknown as McfRuntimeRepository;
    const reconcile = vi.fn();
    const adapter = { reconcile } as unknown as GitHubActionsStagingDeployAdapter;
    const executor = { execute: vi.fn() } as unknown as SkillExecutor;
    const registry = { load: vi.fn() } as unknown as SkillRegistryLoader;
    const recordEvidenceValidated = vi.fn();
    const recordEvidenceRejected = vi.fn();
    const ledger = {
      loadStagingDeployReconciliationAttempt: vi.fn(async () => ({
        attemptId: 'attempt-stale',
        status: 'UNKNOWN' as const,
        expectedMissionVersion: 7,
        agentId: 'Gabriel',
        skillId: 'MCF-DEPLOY-VALIDATE',
        resource: repositoryName,
        previousSha: 'a'.repeat(40),
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

    await expect(service.accept(callbackRequest())).rejects.toThrow(
      'staging callback is stale for the current mission version or phase',
    );

    expect(repository.listEvents).toHaveBeenCalledTimes(1);
    expect(reconcile).not.toHaveBeenCalled();
    expect(repository.completePendingPhase).not.toHaveBeenCalled();
    expect(recordEvidenceValidated).not.toHaveBeenCalled();
    expect(recordEvidenceRejected).not.toHaveBeenCalled();
  });
});
