import { describe, expect, it } from 'vitest';

import {
  ContinuityRecoveryService,
  type McfCheckpointBuildInput,
  type McfResumeDecisionInput,
} from './continuity-recovery.service.js';

function checkpointInput(
  overrides: Partial<McfCheckpointBuildInput> = {},
): McfCheckpointBuildInput {
  return {
    projectId: 'project-1',
    missionId: 'mission-1',
    methodologyPin: {
      version: '1.1.0',
      immutableRef: 'git:methodology@abc123',
    },
    missionContractRef: 'mission-contract:mission-1:v1',
    repositoryState: {
      repository: 'leon337/multiagent-collaboration-framework',
      branch: 'feat/mcf-v1.1-project-intake-continuity',
      checkpointSha: 'a'.repeat(40),
      capturedAt: '2026-08-16T04:00:00.000Z',
      volatile: true,
    },
    pendingHumanGates: ['gate-1'],
    activeStandingAuthorizationIds: ['AUTH-001'],
    currentPhase: 'I8',
    objective: 'Implement transferable continuity',
    currentState: 'EXECUTING',
    materialDecisionRefs: ['decision:q17'],
    evidenceRefs: ['ci:exact-head'],
    openFindingRefs: [],
    nextAction: 'Resume I8 verification',
    responsibleAgent: 'Mestre',
    resumeInstructions: 'Verify canonical checkpoint and live GitHub state before continuing.',
    hasUncheckpointedLocalState: false,
    ...overrides,
  };
}

function resumeInput(
  service: ContinuityRecoveryService,
  overrides: Partial<McfResumeDecisionInput> = {},
): McfResumeDecisionInput {
  const checkpoint = service.createCheckpoint(checkpointInput());
  return {
    checkpoint,
    liveRepositoryState: {
      repository: checkpoint.repositoryState.repository,
      branch: checkpoint.repositoryState.branch,
      headSha: checkpoint.repositoryState.checkpointSha!,
      capturedAt: '2026-08-16T04:01:00.000Z',
    },
    authoritativeRecordsResolved: true,
    methodologyPinValid: true,
    checkpointIntegrityValid: true,
    materialDriftExplainable: false,
    ...overrides,
  };
}

describe('ContinuityRecoveryService', () => {
  const service = new ContinuityRecoveryService();

  it('creates checkpoints for canonical material transfer events', () => {
    expect(service.shouldCreateCheckpoint('MATERIAL_HUMAN_DECISION')).toBe(true);
    expect(service.shouldCreateCheckpoint('PHASE_OR_MISSION_BOUNDARY')).toBe(true);
    expect(service.shouldCreateCheckpoint('PLANNED_CHAT_TRANSFER')).toBe(true);
    expect(service.shouldCreateCheckpoint('MATERIAL_CONTEXT_LOSS_RISK')).toBe(true);
  });

  it('marks an exact remote checkpoint transferable when no local-only work remains', () => {
    const checkpoint = service.createCheckpoint(checkpointInput());

    expect(checkpoint.transferability).toBe('TRANSFERABLE');
    expect(checkpoint.resumeRouteHint).toBe('FAST_RESUME');
    expect(checkpoint.repositoryState.checkpointSha).toBe('a'.repeat(40));
  });

  it('never declares local uncheckpointed work transferred', () => {
    const checkpoint = service.createCheckpoint(
      checkpointInput({ hasUncheckpointedLocalState: true }),
    );

    expect(checkpoint.transferability).toBe('BLOCKED_LOCAL_ONLY_STATE');
    expect(checkpoint.resumeRouteHint).toBe('RECOVER_MCF_PROJECT');
  });

  it('never invents a remote checkpoint when checkpointSha is absent', () => {
    const input = checkpointInput();
    const checkpoint = service.createCheckpoint({
      ...input,
      repositoryState: {
        ...input.repositoryState,
        checkpointSha: null,
      },
    });

    expect(checkpoint.repositoryState.checkpointSha).toBeNull();
    expect(checkpoint.transferability).toBe('BLOCKED_LOCAL_ONLY_STATE');
    expect(checkpoint.resumeRouteHint).toBe('RECOVER_MCF_PROJECT');
  });

  it('generates Resume Card only as a derived rebuildable orientation view', () => {
    const checkpoint = service.createCheckpoint(checkpointInput());
    const card = service.deriveResumeCard(checkpoint);

    expect(card.classification).toBe('DERIVED_REBUILDABLE_VIEW');
    expect(card.authorityNotice).toBe('ORIENTATION_ONLY_CANONICAL_CHECKPOINT_WINS');
    expect(card.checkpointSha).toBe(checkpoint.repositoryState.checkpointSha);
    expect(card.nextAction).toBe(checkpoint.nextAction);
  });

  it('uses FAST_RESUME only for an exact compatible live state', () => {
    expect(service.decideResumeRoute(resumeInput(service))).toBe('FAST_RESUME');
  });

  it('uses RECONCILE for explainable live drift', () => {
    const input = resumeInput(service);
    expect(
      service.decideResumeRoute({
        ...input,
        liveRepositoryState: {
          ...input.liveRepositoryState!,
          headSha: 'b'.repeat(40),
        },
        materialDriftExplainable: true,
      }),
    ).toBe('RECONCILE');
  });

  it('routes unexplained material divergence to RECOVER_MCF_PROJECT', () => {
    const input = resumeInput(service);
    expect(
      service.decideResumeRoute({
        ...input,
        liveRepositoryState: {
          ...input.liveRepositoryState!,
          headSha: 'c'.repeat(40),
        },
        materialDriftExplainable: false,
      }),
    ).toBe('RECOVER_MCF_PROJECT');
  });

  it('routes missing or invalid authoritative continuity state to recovery', () => {
    expect(
      service.decideResumeRoute(
        resumeInput(service, {
          authoritativeRecordsResolved: false,
        }),
      ),
    ).toBe('RECOVER_MCF_PROJECT');
    expect(
      service.decideResumeRoute(
        resumeInput(service, {
          methodologyPinValid: false,
        }),
      ),
    ).toBe('RECOVER_MCF_PROJECT');
    expect(
      service.decideResumeRoute(
        resumeInput(service, {
          checkpointIntegrityValid: false,
        }),
      ),
    ).toBe('RECOVER_MCF_PROJECT');
  });

  it('does not require previous chat transcript or chat memory for verified resume', () => {
    const inputWithoutAnyChatContext = resumeInput(service);

    expect(service.decideResumeRoute(inputWithoutAnyChatContext)).toBe('FAST_RESUME');
  });

  it('routes repository identity mismatch to recovery even when drift is explainable', () => {
    const input = resumeInput(service);
    expect(
      service.decideResumeRoute({
        ...input,
        liveRepositoryState: {
          ...input.liveRepositoryState!,
          repository: 'other/repository',
        },
        materialDriftExplainable: true,
      }),
    ).toBe('RECOVER_MCF_PROJECT');
  });
});
