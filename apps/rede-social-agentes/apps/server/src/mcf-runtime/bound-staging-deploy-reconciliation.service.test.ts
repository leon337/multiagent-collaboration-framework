import { describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../database.service.js';
import { BoundStagingDeployReconciliationService } from './bound-staging-deploy-reconciliation.service.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import type { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import type { McfRuntimeRepository } from './mcf-runtime.repository.js';
import type { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';
import { canonicalizeStagingRuntimeUrl } from './staging-runtime-origin.js';

const request = {
  missionId: 'mission-gate-d-origin',
  phaseId: 'phase-gate-d-origin',
  requestId: 'mcf-gate-d-origin-123456789',
  releaseSha: 'd'.repeat(40),
  workflowRunId: '4242',
  repository: 'leon337/multiagent-collaboration-framework',
  completedAt: '2026-08-10T20:30:00Z',
  stagingRuntimeUrl: 'https://attacker.example',
};

describe('Gate D durable staging origin binding', () => {
  it('canonicalizes equivalent authorized HTTPS origins', () => {
    expect(canonicalizeStagingRuntimeUrl('https://STAGING.example/')).toBe(
      'https://staging.example',
    );
  });

  it('rejects a callback-supplied staging origin before mutable provider reconciliation', async () => {
    const ledger = {
      loadStagingDeployReconciliationAttempt: vi.fn(async () => ({
        attemptId: 'attempt-gate-d-origin',
        status: 'UNKNOWN',
        expectedMissionVersion: 1,
        agentId: 'Gabriel',
        skillId: 'MCF-DEPLOY-VALIDATE',
        resource: request.repository,
        previousSha: 'a'.repeat(40),
        reconciliationEligible: true,
      })),
    } as unknown as ExternalActionLedger;
    const database = {
      query: vi.fn(async () => ({
        rows: [
          {
            payload: {
              kind: 'STAGING_ORIGIN_BOUND',
              attemptId: 'attempt-gate-d-origin',
              idempotencyKey: request.requestId,
              repository: request.repository,
              stagingRuntimeUrl: 'https://staging.example',
              stagingOriginBound: true,
            },
          },
        ],
      })),
    } as unknown as DatabaseService;
    const repository = {
      findMission: vi.fn(),
      findPhase: vi.fn(),
    } as unknown as McfRuntimeRepository;
    const adapter = { reconcile: vi.fn() } as unknown as GitHubActionsStagingDeployAdapter;

    const service = new BoundStagingDeployReconciliationService(
      repository,
      {} as SkillExecutor,
      {} as SkillRegistryLoader,
      ledger,
      adapter,
      database,
    );

    await expect(service.accept(request)).rejects.toThrow(
      'staging callback runtime origin does not match the durable authorized staging origin',
    );
    expect(repository.findMission).not.toHaveBeenCalled();
    expect(adapter.reconcile).not.toHaveBeenCalled();
  });
});
