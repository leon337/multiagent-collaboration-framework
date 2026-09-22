import type { CreateMcfMissionRequest, McfMissionResponse } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import { MissionRuntimeController } from './mission-runtime.controller.js';
import type { MissionRuntimeService } from './mission-runtime.service.js';

function response(contract: CreateMcfMissionRequest['contract']): McfMissionResponse {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    contract,
    state: 'PLANNED',
    currentPhaseId: null,
    currentAgentId: null,
    version: 1,
    createdAt: '2026-09-22T07:05:00.000Z',
    updatedAt: '2026-09-22T07:05:00.000Z',
  };
}

describe('MissionRuntimeController v1.1 contract preservation', () => {
  it('preserves the complete v1.1 extension through HTTP body parsing', async () => {
    const createMission = vi.fn(async (input: CreateMcfMissionRequest) => response(input.contract));
    const controller = new MissionRuntimeController({
      createMission,
    } as unknown as MissionRuntimeService);

    const alignedPipRef = {
      artifactType: 'PROJECT_INTENT_PACKAGE',
      schemaVersion: '1.0',
      projectId: 'multiagent-collaboration-framework',
      revisionId: 'v1.1-canonical-001',
      path: '.mcf/intent/pip-v1.1-canonical-001.json',
      contentDigest: 'sha256:4469d5f4d2b0f06e0a834a5cb0874e5df4f59a553e711b76040e30fa2e521371',
      repository: 'leon337/multiagent-collaboration-framework',
      commitSha: null,
    };

    const realityRef = {
      artifactType: 'PROJECT_REALITY_REPORT',
      schemaVersion: '1.0',
      projectId: 'multiagent-collaboration-framework',
      revisionId: 'reality-001',
      path: '.mcf/reality/reality-001.json',
      contentDigest: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      repository: 'leon337/multiagent-collaboration-framework',
      commitSha: null,
    };

    const checkpointRef = {
      artifactType: 'MCF_CHECKPOINT',
      schemaVersion: '1.1',
      projectId: 'multiagent-collaboration-framework',
      revisionId: 'checkpoint-001',
      path: '.mcf/checkpoints/checkpoint-001.json',
      contentDigest: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      repository: 'leon337/multiagent-collaboration-framework',
      commitSha: null,
    };

    await controller.createMission(
      {
        contract: {
          title: 'Governed v1.1 production promotion',
          objective:
            'Promote one exact qualified MCF revision through the governed production boundary.',
          expectedOutcome: 'The exact authorized release SHA is verified in production.',
          scope: ['exact-SHA production promotion'],
          outOfScope: ['unrelated repository changes'],
          acceptanceCriteria: ['production health/version equals the authorized release SHA'],
          riskClass: 'C',
          selectedAgents: ['LÉO'],
          selectedSkills: ['MCF-DEPLOY-VALIDATE'],
          sourceOfTruth: ['leon337/multiagent-collaboration-framework'],
          contractSchemaVersion: '1.1',
          projectId: 'multiagent-collaboration-framework',
          projectEntryMode: 'ADOPT_EXISTING_PROJECT',
          methodologyPin: {
            version: '1.1.0',
            immutableRef: 'git:5dc055cb7d402e5774b40b82723a8f008cd00e80',
          },
          alignedPipRef,
          projectRealityReportRef: realityRef,
          standingAuthorizations: [
            {
              authorizationId: 'prod-release-window-001',
              projectId: 'multiagent-collaboration-framework',
              missionId: '22222222-2222-4222-8222-222222222222',
              grantedBy: 'LEANDRO',
              grantedAt: '2026-09-22T07:00:00.000Z',
              actionClasses: ['release-public'],
              environments: ['production'],
              maximumCost: null,
              reversibleOnly: false,
              expiresAt: '2026-09-23T07:00:00.000Z',
              boundary: 'release-sha:cccccccccccccccccccccccccccccccccccccccc',
              exclusions: ['unrelated changes'],
              evidenceRequirements: ['exact SHA health verification'],
              sourceDecisionRef: 'human-authority:test',
              status: 'ACTIVE',
            },
          ],
          continuityCheckpointRef: checkpointRef,
        },
      },
      { id: 'correlation-v11-controller-test' } as never,
    );

    expect(createMission).toHaveBeenCalledOnce();
    expect(createMission).toHaveBeenCalledWith({
      contract: expect.objectContaining({
        contractSchemaVersion: '1.1',
        projectId: 'multiagent-collaboration-framework',
        projectEntryMode: 'ADOPT_EXISTING_PROJECT',
        methodologyPin: {
          version: '1.1.0',
          immutableRef: 'git:5dc055cb7d402e5774b40b82723a8f008cd00e80',
        },
        alignedPipRef,
        projectRealityReportRef: realityRef,
        standingAuthorizations: [
          expect.objectContaining({
            authorizationId: 'prod-release-window-001',
            grantedBy: 'LEANDRO',
            environments: ['production'],
          }),
        ],
        continuityCheckpointRef: checkpointRef,
      }),
    });
  });
});
