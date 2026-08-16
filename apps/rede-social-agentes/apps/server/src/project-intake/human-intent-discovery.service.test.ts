import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ProjectIntentPackageV1, ProvenanceRef } from '@rsa/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { RepositoryProjectArtifactStore } from '../project-artifacts/repository-project-artifact.store.js';
import {
  assessIntentReadiness,
  CANONICAL_INTENT_DIMENSIONS,
  createDiscoveryPip,
  createIncrementalIntentRevision,
  createProgressiveIntentReadback,
  HumanIntentDiscoveryService,
  selectNextIntentQuestion,
  type CreateDiscoveryPipInput,
  type IntentDimensionUpdate,
} from './human-intent-discovery.service.js';

const schemas = fileURLToPath(new URL('../../../../../../schemas/', import.meta.url));
const temporaryRoots: string[] = [];

const humanProvenance: ProvenanceRef[] = [
  {
    type: 'HUMAN_DIRECT_STATEMENT',
    sourceRef: 'conversation:turn-001',
    capturedAt: '2026-08-15T12:00:00Z',
    actor: 'LEANDRO',
  },
];

const machineProvenance: ProvenanceRef[] = [
  {
    type: 'MACHINE_INFERENCE',
    sourceRef: 'analysis:inference-001',
    capturedAt: '2026-08-15T12:01:00Z',
    actor: 'CODEX_LOCAL',
  },
];

function initialInput(): CreateDiscoveryPipInput {
  return {
    projectId: 'mcf-v1.1',
    revisionId: 'intent-001',
    methodologyPin: { version: '1.1.0', immutableRef: 'methodology:mcf-v1.1' },
    createdAt: '2026-08-15T12:00:00Z',
    identity: { projectName: 'MCF' },
    originalIntent: {
      text: 'Build project intake continuity while preserving human authority.',
      provenance: humanProvenance,
    },
  };
}

function clearUpdate(dimension: IntentDimensionUpdate['dimension']): IntentDimensionUpdate {
  return {
    dimension,
    state: 'CLEAR',
    value: `Confirmed ${dimension}`,
    provenance: humanProvenance,
    readinessImpact: 'BLOCKING',
  };
}

async function createService(): Promise<{
  root: string;
  service: HumanIntentDiscoveryService;
  store: RepositoryProjectArtifactStore;
}> {
  const root = await mkdtemp(join(tmpdir(), 'mcf-intent-discovery-'));
  temporaryRoots.push(root);
  const store = new RepositoryProjectArtifactStore({
    repositoryRoot: root,
    schemaDirectory: schemas,
    repository: 'leon337/multiagent-collaboration-framework',
  });
  return { root, service: new HumanIntentDiscoveryService(store), store };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('MCF v1.1 Human Intent Discovery', () => {
  it('creates all 20 canonical dimensions without inventing answers', () => {
    const pip = createDiscoveryPip(initialInput());

    expect(CANONICAL_INTENT_DIMENSIONS).toHaveLength(20);
    expect(Object.keys(pip.dimensions)).toEqual([...CANONICAL_INTENT_DIMENSIONS]);
    expect(Object.values(pip.dimensions).every((record) => record.state === 'UNKNOWN')).toBe(true);
    expect(pip.readiness.state).toBe('NOT_READY');
    expect(pip.humanDecisions).toEqual([]);
  });

  it('reuses MCF-DEFINE-PRODUCT output while keeping authority provenance-bound', () => {
    const pip = createDiscoveryPip({
      ...initialInput(),
      productDefinition: {
        sourceSkill: 'MCF-DEFINE-PRODUCT',
        problemStatement: 'Continuity is currently fragile.',
        requirements: ['Canonical PIP revisions'],
        acceptanceCriteria: ['Resume without chat history'],
        provenance: machineProvenance,
      },
    });

    expect(pip.dimensions.PROBLEM).toMatchObject({
      state: 'PARTIAL',
      value: 'Continuity is currently fragile.',
    });
    expect(pip.dimensions.PROBLEM.provenance).toEqual(machineProvenance);
    expect(pip.humanDecisions).toEqual([]);
  });

  it('prioritizes a high-leverage blocking question and explains the selection', () => {
    const pip = createDiscoveryPip(initialInput());
    pip.dimensions.FUTURE_VISION.readinessImpact = 'NON_BLOCKING';

    const selected = selectNextIntentQuestion(pip, [
      {
        questionId: 'future',
        prompt: 'What is the long-term vision?',
        questionClass: 'HUMAN_INTENT',
        targetDimensions: ['FUTURE_VISION'],
        informationGain: 100,
      },
      {
        questionId: 'core',
        prompt: 'Who has which critical problem and outcome?',
        questionClass: 'HUMAN_INTENT',
        targetDimensions: ['PROBLEM', 'TARGET_USERS', 'DESIRED_OUTCOME'],
        informationGain: 70,
      },
      {
        questionId: 'technical',
        prompt: 'Which internal helper name should be used?',
        questionClass: 'TEAM_FIRST_TECHNICAL',
        targetDimensions: ['PROBLEM', 'TARGET_USERS', 'DESIRED_OUTCOME', 'MUST_HAVE'],
        informationGain: 1_000,
      },
    ]);

    expect(selected).toMatchObject({
      questionId: 'core',
      blockingDimensions: ['PROBLEM', 'TARGET_USERS', 'DESIRED_OUTCOME'],
      unresolvedDimensions: ['PROBLEM', 'TARGET_USERS', 'DESIRED_OUTCOME'],
      routing: 'HUMAN_AUTHORITY',
    });
    expect(selected?.selectionReason).toContain('3 blocking');
  });

  it('does not re-ask a resolved dimension without an explicit material reason', () => {
    const current = createDiscoveryPip(initialInput());
    const successor = createIncrementalIntentRevision(current, {
      revisionId: 'intent-002',
      createdAt: '2026-08-15T12:10:00Z',
      updates: [clearUpdate('PROBLEM')],
    });
    const candidate = {
      questionId: 'problem',
      prompt: 'What problem are we solving?',
      questionClass: 'HUMAN_INTENT' as const,
      targetDimensions: ['PROBLEM'] as const,
      informationGain: 80,
    };

    expect(
      selectNextIntentQuestion(successor, [
        { ...candidate, targetDimensions: [...candidate.targetDimensions] },
      ]),
    ).toBeNull();
    expect(
      selectNextIntentQuestion(successor, [
        {
          ...candidate,
          targetDimensions: [...candidate.targetDimensions],
          materialReason: 'New contradictory human statement received.',
        },
      ]),
    ).toMatchObject({ questionId: 'problem', unresolvedDimensions: [] });
  });

  it('emits a provenance-preserving progressive read-back as a derived view', () => {
    const pip = createDiscoveryPip(initialInput());
    const readback = createProgressiveIntentReadback(pip);

    expect(readback).toMatchObject({
      viewType: 'DERIVED_PROGRESSIVE_READBACK',
      sourceArtifact: {
        artifactType: 'PROJECT_INTENT_PACKAGE',
        revisionId: 'intent-001',
      },
      reusedSkillSemantics: 'MCF-DEFINE-PRODUCT',
      implementationAuthorized: false,
    });
    expect(readback.dimensions).toHaveLength(20);
    expect(readback.dimensions[0]?.record.provenance).toEqual(humanProvenance);
  });

  it('keeps readiness NOT_READY while a blocking unknown exists', () => {
    const assessment = assessIntentReadiness(
      createDiscoveryPip(initialInput()),
      '2026-08-15T12:05:00Z',
    );

    expect(assessment.pip.readiness.state).toBe('NOT_READY');
    expect(assessment.blockingUnknownIds).toContain('dimension:PROBLEM');
    expect(assessment.pip.lifecycle).toBe('DISCOVERY_IN_PROGRESS');
    expect(assessment.implementationAuthorized).toBe(false);
  });

  it('uses CONDITIONALLY_READY when only non-blocking intent remains unresolved', () => {
    const pip = createIncrementalIntentRevision(createDiscoveryPip(initialInput()), {
      revisionId: 'intent-002',
      createdAt: '2026-08-15T12:10:00Z',
      updates: CANONICAL_INTENT_DIMENSIONS.map((dimension) => ({
        dimension,
        state: 'PARTIAL',
        value: `Partial ${dimension}`,
        provenance: humanProvenance,
        readinessImpact: 'NON_BLOCKING',
      })),
    });
    const assessment = assessIntentReadiness(pip, '2026-08-15T12:11:00Z');

    expect(assessment.pip.readiness.state).toBe('CONDITIONALLY_READY');
    expect(assessment.pip.lifecycle).toBe('DISCOVERY_IN_PROGRESS');
    expect(assessment.implementationAuthorized).toBe(false);
  });

  it('marks a fully resolved working revision READY_FOR_ALIGNMENT without granting authority', () => {
    const pip = createIncrementalIntentRevision(createDiscoveryPip(initialInput()), {
      revisionId: 'intent-002',
      createdAt: '2026-08-15T12:10:00Z',
      updates: CANONICAL_INTENT_DIMENSIONS.map(clearUpdate),
    });
    const assessment = assessIntentReadiness(pip, '2026-08-15T12:11:00Z');

    expect(assessment.pip.lifecycle).toBe('READY_FOR_ALIGNMENT');
    expect(assessment.pip.readiness.state).toBe('READY_FOR_ALIGNMENT');
    expect(assessment.pip.alignment).toEqual({ status: 'NOT_ALIGNED' });
    expect(assessment.implementationAuthorized).toBe(false);
  });

  it('rejects machine-only provenance as a clear human preference', () => {
    const pip = createDiscoveryPip(initialInput());

    expect(() =>
      createIncrementalIntentRevision(pip, {
        revisionId: 'intent-002',
        createdAt: '2026-08-15T12:10:00Z',
        updates: [
          {
            ...clearUpdate('AUTOMATION_LEVEL'),
            value: 'FULL_AUTOMATION',
            provenance: machineProvenance,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'MACHINE_AUTHORITY_BOUNDARY' }));
  });

  it('rejects machine inference creating a human decision', () => {
    const pip = createDiscoveryPip(initialInput());

    expect(() =>
      createIncrementalIntentRevision(pip, {
        revisionId: 'intent-002',
        createdAt: '2026-08-15T12:10:00Z',
        updates: [],
        humanDecisions: [
          {
            decisionId: 'decision-001',
            status: 'CURRENT',
            statement: 'The machine decided the product preference.',
            provenance: machineProvenance,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'MACHINE_AUTHORITY_BOUNDARY' }));
  });

  it('persists supersession while preserving the prior human decision history', async () => {
    const { service, store } = await createService();
    const priorDecision = {
      decisionId: 'decision-001',
      status: 'CURRENT' as const,
      statement: 'The first launch will target internal teams.',
      provenance: structuredClone(humanProvenance),
    };
    const initial = await service.persistInitialPip(initialInput());
    const withPrior = await service.persistIncrementalRevision(initial.artifact, {
      revisionId: 'intent-002',
      createdAt: '2026-08-15T12:10:00Z',
      updates: [],
      humanDecisions: [priorDecision],
    });
    const replacement = {
      decisionId: 'decision-002',
      status: 'CURRENT' as const,
      statement: 'The first launch will target external maintainers.',
      supersedesDecisionId: 'decision-001',
      provenance: [
        {
          type: 'HUMAN_CONFIRMED_SYNTHESIS' as const,
          sourceRef: 'conversation:turn-002',
          capturedAt: '2026-08-15T12:20:00Z',
          actor: 'LEANDRO',
        },
      ],
    };

    const successor = await service.persistIncrementalRevision(withPrior.artifact, {
      revisionId: 'intent-003',
      createdAt: '2026-08-15T12:20:00Z',
      updates: [],
      humanDecisions: [replacement],
    });

    const loaded = await store.loadLocal(successor.reference);
    expect(withPrior.artifact.humanDecisions[0]).toEqual(priorDecision);
    expect(loaded.artifact.humanDecisions[0]).toEqual({
      ...priorDecision,
      status: 'SUPERSEDED',
    });
    expect(loaded.artifact.humanDecisions[0]?.statement).toBe(priorDecision.statement);
    expect(loaded.artifact.humanDecisions[0]?.provenance).toEqual(priorDecision.provenance);
    expect(loaded.artifact.humanDecisions[1]).toEqual(replacement);
    expect(loaded.artifact.humanDecisions[1]).toMatchObject({
      status: 'CURRENT',
      supersedesDecisionId: 'decision-001',
    });
  });

  it('rejects supersession of an unknown human decision', () => {
    const pip = createDiscoveryPip(initialInput());

    expect(() =>
      createIncrementalIntentRevision(pip, {
        revisionId: 'intent-002',
        createdAt: '2026-08-15T12:10:00Z',
        updates: [],
        humanDecisions: [
          {
            decisionId: 'decision-002',
            status: 'CURRENT',
            statement: 'Replacement with no historical target.',
            supersedesDecisionId: 'missing-decision',
            provenance: humanProvenance,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'DECISION_SUPERSESSION_INVALID' }));
  });

  it('rejects machine-only human decision supersession', () => {
    const withPrior = createIncrementalIntentRevision(createDiscoveryPip(initialInput()), {
      revisionId: 'intent-002',
      createdAt: '2026-08-15T12:10:00Z',
      updates: [],
      humanDecisions: [
        {
          decisionId: 'decision-001',
          status: 'CURRENT',
          statement: 'Keep the product private.',
          provenance: humanProvenance,
        },
      ],
    });

    expect(() =>
      createIncrementalIntentRevision(withPrior, {
        revisionId: 'intent-003',
        createdAt: '2026-08-15T12:20:00Z',
        updates: [],
        humanDecisions: [
          {
            decisionId: 'decision-002',
            status: 'CURRENT',
            statement: 'Publish the product publicly.',
            supersedesDecisionId: 'decision-001',
            provenance: machineProvenance,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'MACHINE_AUTHORITY_BOUNDARY' }));
  });

  it('rejects multiple CURRENT replacements for the same material decision', () => {
    const withPrior = createIncrementalIntentRevision(createDiscoveryPip(initialInput()), {
      revisionId: 'intent-002',
      createdAt: '2026-08-15T12:10:00Z',
      updates: [],
      humanDecisions: [
        {
          decisionId: 'decision-001',
          status: 'CURRENT',
          statement: 'Initial material choice.',
          provenance: humanProvenance,
        },
      ],
    });

    expect(() =>
      createIncrementalIntentRevision(withPrior, {
        revisionId: 'intent-003',
        createdAt: '2026-08-15T12:20:00Z',
        updates: [],
        humanDecisions: [
          {
            decisionId: 'decision-002',
            status: 'CURRENT',
            statement: 'First conflicting replacement.',
            supersedesDecisionId: 'decision-001',
            provenance: humanProvenance,
          },
          {
            decisionId: 'decision-003',
            status: 'CURRENT',
            statement: 'Second conflicting replacement.',
            supersedesDecisionId: 'decision-001',
            provenance: humanProvenance,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: 'DECISION_CONFLICT' }));
  });

  it('persists and loads an incremental successor revision through the I2 store', async () => {
    const { root, service, store } = await createService();
    const initial = await service.persistInitialPip(initialInput());
    const successor = await service.persistIncrementalRevision(initial.artifact, {
      revisionId: 'intent-002',
      createdAt: '2026-08-15T12:10:00Z',
      updates: [clearUpdate('PROBLEM'), clearUpdate('DESIRED_OUTCOME')],
    });

    expect(successor.artifact.supersedesRevisionId).toBe('intent-001');
    expect(successor.reference.path).toBe('.mcf/intent/pip-intent-002.json');
    expect(await store.loadLocal(successor.reference)).toEqual(successor);
    await expect(readFile(join(root, initial.reference.path), 'utf8')).resolves.toContain(
      'intent-001',
    );
  });

  it('rejects attempts to cross the I4 aligned boundary', async () => {
    const { service } = await createService();
    const pip = createDiscoveryPip(initialInput()) as ProjectIntentPackageV1;
    pip.lifecycle = 'ALIGNED';
    pip.alignment = {
      status: 'ALIGNED',
      receiptRef: '.mcf/receipts/intent-alignment-forbidden.json',
      alignedAt: '2026-08-15T12:30:00Z',
    };

    await expect(
      service.persistIncrementalRevision(pip, {
        revisionId: 'intent-002',
        createdAt: '2026-08-15T12:31:00Z',
        updates: [],
      }),
    ).rejects.toMatchObject({ code: 'I4_BOUNDARY' });
    expect(service).not.toHaveProperty('writeAlignmentReceipt');
  });
});
