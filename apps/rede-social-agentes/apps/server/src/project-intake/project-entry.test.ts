import { describe, expect, it } from 'vitest';

import { transitionMcfActivation } from './project-activation.js';
import { classifyProjectEntry, type ProjectEntryEvidence } from './project-entry-classifier.js';

function evidence(overrides: Partial<ProjectEntryEvidence> = {}): ProjectEntryEvidence {
  return {
    repository: 'ABSENT',
    projectArtifact: 'ABSENT',
    continuityCheckpoint: 'ABSENT',
    sourceReferences: ['workspace:inspection'],
    precedenceDecisions: ['live repository state precedes historical volatile state'],
    contradictions: [],
    ...overrides,
  };
}

describe('MCF v1.1 activation and project entry', () => {
  it('allows only NOT_ACTIVE -> ACTIVATING -> ACTIVE', () => {
    const activating = transitionMcfActivation('NOT_ACTIVE', 'BEGIN_ACTIVATION');
    const active = transitionMcfActivation(activating.state, 'COMPLETE_ACTIVATION');

    expect(activating.state).toBe('ACTIVATING');
    expect(active).toMatchObject({
      state: 'ACTIVE',
      laterOperationalSkill: 'MCF-START-MISSION',
      implementationAuthorized: false,
    });
    expect(() => transitionMcfActivation('NOT_ACTIVE', 'COMPLETE_ACTIVATION')).toThrow(
      'invalid MCF activation transition',
    );
    expect(() => transitionMcfActivation('ACTIVE', 'BEGIN_ACTIVATION')).toThrow(
      'invalid MCF activation transition',
    );
  });

  it('classifies a project with no repository or continuity as NEW_PROJECT', () => {
    expect(classifyProjectEntry(evidence())).toMatchObject({
      status: 'CLASSIFIED',
      entryMode: 'NEW_PROJECT',
      recoveryRoute: null,
      sourceSkill: 'MCF-RECOVER-CONTEXT',
    });
  });

  it('classifies an existing repository without MCF continuity as ADOPT_EXISTING_PROJECT', () => {
    expect(classifyProjectEntry(evidence({ repository: 'PRESENT' }))).toMatchObject({
      status: 'CLASSIFIED',
      entryMode: 'ADOPT_EXISTING_PROJECT',
      realityReconnaissanceRequired: true,
    });
  });

  it('classifies exact valid project and checkpoint continuity as RESUME_MCF_PROJECT', () => {
    expect(
      classifyProjectEntry(
        evidence({
          repository: 'PRESENT',
          projectArtifact: 'VALID',
          continuityCheckpoint: 'VALID',
        }),
      ),
    ).toMatchObject({
      status: 'CLASSIFIED',
      entryMode: 'RESUME_MCF_PROJECT',
      recoveryRoute: null,
    });
  });

  it('routes broken continuity to RECOVER_MCF_PROJECT without creating a fourth entry mode', () => {
    expect(
      classifyProjectEntry(
        evidence({
          repository: 'PRESENT',
          projectArtifact: 'VALID',
          continuityCheckpoint: 'INVALID',
        }),
      ),
    ).toEqual({
      status: 'RECOVERY_REQUIRED',
      entryMode: null,
      recoveryRoute: 'RECOVER_MCF_PROJECT',
      sourceSkill: 'MCF-RECOVER-CONTEXT',
      reasons: ['INCOMPLETE_OR_INVALID_MCF_CONTINUITY'],
      fullRecoveryExecutionAuthorized: false,
      implementationAuthorized: false,
    });
  });

  it('keeps ambiguous or conflicting evidence explicitly unresolved', () => {
    expect(
      classifyProjectEntry(
        evidence({ repository: 'CONFLICTING', contradictions: ['repo identity differs'] }),
      ),
    ).toMatchObject({
      status: 'UNRESOLVED',
      entryMode: null,
      recoveryRoute: null,
      reasons: ['CONFLICTING_ENTRY_EVIDENCE', 'repo identity differs'],
    });
    expect(
      classifyProjectEntry(evidence({ sourceReferences: [], precedenceDecisions: [] })),
    ).toMatchObject({
      status: 'UNRESOLVED',
      reasons: ['SOURCE_REFERENCES_MISSING', 'PRECEDENCE_DECISIONS_MISSING'],
    });
  });
});
