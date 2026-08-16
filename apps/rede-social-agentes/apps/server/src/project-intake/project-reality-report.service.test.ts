import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ProjectIntentPackageV1, ProvenanceRef } from '@rsa/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import {
  calculateProjectArtifactDigest,
  RepositoryProjectArtifactStore,
  type CanonicalArtifactRef,
  type LocalProjectArtifact,
} from '../project-artifacts/repository-project-artifact.store.js';
import { IntentAlignmentService } from './intent-alignment.service.js';
import {
  calculateGapMapDigest,
  calculateRealityReadbackDigest,
  createRealityReadback,
  createReconnaissanceDraft,
  isCompletionPlanStale,
  isGapMapStale,
  machineEvidence,
  ProjectRealityReportService,
  type DerivedGapMap,
  type RealityConfirmationCommand,
  type RealityObservation,
} from './project-reality-report.service.js';

const repository = 'leon337/multiagent-collaboration-framework';
const exactSha = 'a'.repeat(40);
const schemas = fileURLToPath(new URL('../../../../../../schemas/', import.meta.url));
const pipFixturePath = fileURLToPath(
  new URL(
    '../../../../../../schemas/fixtures/v1.1/project-intent-package.valid.json',
    import.meta.url,
  ),
);
const temporaryRoots: string[] = [];

const humanProvenance: ProvenanceRef[] = [
  {
    type: 'HUMAN_DIRECT_STATEMENT',
    sourceRef: 'human:reality-confirmation',
    capturedAt: '2026-08-16T03:30:00Z',
    actor: 'LEANDRO',
  },
];

function fact(overrides: Partial<RealityObservation> = {}): RealityObservation {
  return {
    observationId: 'obs-runtime',
    domain: 'runtime',
    statement: 'The existing MCF runtime is present at the exact baseline.',
    kind: 'FACT',
    evidenceRefs: ['apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.service.ts'],
    provenance: [machineEvidence(`git:${exactSha}`, '2026-08-16T03:20:00Z', 'MESTRE')],
    ...overrides,
  };
}

async function createStore(): Promise<RepositoryProjectArtifactStore> {
  const root = await mkdtemp(join(tmpdir(), 'mcf-project-reality-'));
  temporaryRoots.push(root);
  return new RepositoryProjectArtifactStore({
    repositoryRoot: root,
    schemaDirectory: schemas,
    repository,
  });
}

async function readyPip(
  store: RepositoryProjectArtifactStore,
): Promise<LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>> {
  const pip = JSON.parse(await readFile(pipFixturePath, 'utf8')) as ProjectIntentPackageV1;
  return store.writePip(pip);
}

async function alignedPair(store: RepositoryProjectArtifactStore) {
  const alignment = new IntentAlignmentService(store);
  const pip = await readyPip(store);
  const readback = await alignment.createFinalIntentReadback(pip.reference);
  const result = await alignment.align(readback, {
    humanAuthority: 'LEANDRO',
    confirmationSourceRef: 'human-gate:i5-test-alignment',
    confirmedAt: '2026-08-16T03:25:00Z',
    expectedPipRef: pip.reference,
    finalReadbackRefOrDigest: readback.readbackDigest,
    decision: 'PASS',
  });
  if (result.outcome !== 'PASS') throw new Error('expected aligned pair');
  return { alignment, alignedPip: result.alignedPip };
}

function draft(observations: RealityObservation[] = [fact()]) {
  return createReconnaissanceDraft({
    projectId: 'mcf-v1.1',
    revisionId: 'prr-i5-001',
    methodologyPin: { version: '1.1.0', immutableRef: `git:${exactSha}` },
    createdAt: '2026-08-16T03:20:00Z',
    baseline: {
      repository,
      commitSha: exactSha,
      branch: 'feat/mcf-v1.1-project-intake-continuity',
      capturedAt: '2026-08-16T03:20:00Z',
    },
    observations,
    unresolvedFacts: [],
  });
}

function confirmation(readbackDigest: string, overrides: Partial<RealityConfirmationCommand> = {}) {
  return {
    humanAuthority: 'LEANDRO',
    confirmationSourceRef: 'human-gate:reality-confirmation-i5',
    confirmedAt: '2026-08-16T03:35:00Z',
    expectedRepository: repository,
    expectedCommitSha: exactSha,
    finalReadbackDigest: readbackDigest,
    decision: 'CONFIRMED' as const,
    ...overrides,
  };
}

async function confirmedHarness() {
  const store = await createStore();
  const { alignment, alignedPip } = await alignedPair(store);
  const service = new ProjectRealityReportService(store, alignment);
  const readback = createRealityReadback(draft());
  const prr = await service.confirmAndPersist(readback, confirmation(readback.readbackDigest));
  return { store, service, alignedPip, prr };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('MCF v1.1 existing-project reconnaissance and PRR pipeline', () => {
  it('keeps reconnaissance read-only and binds the derived read-back to an exact SHA baseline', () => {
    const working = draft();
    const first = createRealityReadback(working);
    const second = createRealityReadback(working);

    expect(working).toMatchObject({
      viewType: 'WORKING_RECONNAISSANCE_DRAFT',
      authorityClass: 'WORKING_PROPOSED_ARTIFACT',
      readOnlyFirst: true,
      implementationAuthorized: false,
    });
    expect(first).toEqual(second);
    expect(first.exactBaseline.commitSha).toBe(exactSha);
    expect(first.readbackDigest).toBe(calculateRealityReadbackDigest(first));
    expect(first.implementationAuthorized).toBe(false);
  });

  it('fails closed when the baseline lacks an exact commit SHA', () => {
    expect(() =>
      createReconnaissanceDraft({
        ...draft(),
        baseline: { ...draft().baseline, commitSha: 'main' },
      }),
    ).toThrow(expect.objectContaining({ code: 'BASELINE_INVALID' }));
  });

  it('requires concrete evidence for FACT', () => {
    expect(() => draft([fact({ evidenceRefs: [] })])).toThrow(
      expect.objectContaining({ code: 'FACT_EVIDENCE_REQUIRED' }),
    );
  });

  it('does not promote a human-only technical assertion to FACT', () => {
    expect(() => draft([fact({ provenance: humanProvenance })])).toThrow(
      expect.objectContaining({ code: 'FACT_MACHINE_EVIDENCE_REQUIRED' }),
    );
  });

  it('preserves INFERENCE, UNKNOWN and CONFLICTING as explicit classes', () => {
    const readback = createRealityReadback(
      draft([
        fact(),
        fact({ observationId: 'obs-inference', kind: 'INFERENCE', evidenceRefs: [] }),
        fact({ observationId: 'obs-unknown', kind: 'UNKNOWN', evidenceRefs: [] }),
        fact({ observationId: 'obs-conflict', kind: 'CONFLICTING', evidenceRefs: [] }),
      ]),
    );

    expect(readback.inferenceObservationIds).toEqual(['obs-inference']);
    expect(readback.unknownObservationIds).toEqual(['obs-unknown']);
    expect(readback.conflictingObservationIds).toEqual(['obs-conflict']);
  });

  it('persists only a confirmed canonical PRR and round-trips its exact digest', async () => {
    const store = await createStore();
    const { alignment } = await alignedPair(store);
    const service = new ProjectRealityReportService(store, alignment);
    const readback = createRealityReadback(draft());

    const persisted = await service.confirmAndPersist(readback, confirmation(readback.readbackDigest));

    expect(persisted.artifact.realityConfirmation.status).toBe('CONFIRMED');
    expect(persisted.reference.path).toBe('.mcf/reality/prr-prr-i5-001.json');
    expect(await store.loadLocal(persisted.reference)).toEqual(persisted);
  });

  it('requires correction references for CONFIRMED_WITH_CORRECTIONS', async () => {
    const store = await createStore();
    const { alignment } = await alignedPair(store);
    const service = new ProjectRealityReportService(store, alignment);
    const readback = createRealityReadback(draft());

    await expect(
      service.confirmAndPersist(
        readback,
        confirmation(readback.readbackDigest, {
          decision: 'CONFIRMED_WITH_CORRECTIONS',
          correctionRefs: [],
        }),
      ),
    ).rejects.toMatchObject({ code: 'REALITY_CONFIRMATION_INVALID' });
  });

  it('inherits I2 immutability and rejects changed content at the same PRR revision', async () => {
    const { service, prr } = await confirmedHarness();
    const changedReadback = createRealityReadback(
      draft([fact({ statement: 'Changed reality requires a successor PRR revision.' })]),
    );

    await expect(
      service.confirmAndPersist(changedReadback, confirmation(changedReadback.readbackDigest)),
    ).rejects.toMatchObject({ code: 'PRR_REVISION_IMMUTABLE' });
    expect(prr.artifact.revisionId).toBe('prr-i5-001');
  });

  it('creates a derived Gap Map only from exact confirmed PRR + verified aligned PIP pair', async () => {
    const { service, prr, alignedPip } = await confirmedHarness();
    const gapMap = await service.createGapMap({
      prrRef: prr.reference,
      alignedPipRef: alignedPip.reference,
      analysisVersion: 'gap-analysis-v1',
      comparisons: [
        {
          gapId: 'gap-runtime',
          statement: 'Runtime must satisfy the aligned desired outcome.',
          material: true,
          asIsObservationIds: ['obs-runtime'],
          toBeIntentDimensionRefs: ['DESIRED_OUTCOME'],
          toBeHumanDecisionIds: [],
          unresolved: false,
        },
      ],
    });

    expect(gapMap).toMatchObject({
      authorityClass: 'DERIVED_REBUILDABLE_VIEW',
      sourcePrrRef: prr.reference,
      sourceAlignedPipRef: alignedPip.reference,
      implementationAuthorized: false,
    });
    expect(gapMap.gapMapDigest).toBe(calculateGapMapDigest(gapMap));
  });

  it('rejects an ALIGNED PIP without the exact alignment receipt pair', async () => {
    const store = await createStore();
    const alignment = new IntentAlignmentService(store);
    const service = new ProjectRealityReportService(store, alignment);
    const readback = createRealityReadback(draft());
    const prr = await service.confirmAndPersist(readback, confirmation(readback.readbackDigest));
    const source = await readyPip(store);
    const alignedArtifact = structuredClone(source.artifact);
    alignedArtifact.lifecycle = 'ALIGNED';
    alignedArtifact.alignment = {
      status: 'ALIGNED',
      receiptRef: '.mcf/receipts/intent-alignment-missing.json',
      alignedAt: '2026-08-16T03:25:00Z',
    };
    alignedArtifact.contentDigest = calculateProjectArtifactDigest(alignedArtifact);
    const alignedOnly = await store.writePip(alignedArtifact);

    await expect(
      service.createGapMap({
        prrRef: prr.reference,
        alignedPipRef: alignedOnly.reference,
        analysisVersion: 'gap-analysis-v1',
        comparisons: [],
      }),
    ).rejects.toMatchObject({ code: 'ALIGNMENT_PAIR_REQUIRED' });
  });

  it('rejects Gap Map comparisons that are not bound to exact PRR/PIP inputs', async () => {
    const { service, prr, alignedPip } = await confirmedHarness();

    await expect(
      service.createGapMap({
        prrRef: prr.reference,
        alignedPipRef: alignedPip.reference,
        analysisVersion: 'gap-analysis-v1',
        comparisons: [
          {
            gapId: 'gap-invalid',
            statement: 'Invalid reference.',
            material: true,
            asIsObservationIds: ['obs-does-not-exist'],
            toBeIntentDimensionRefs: ['DESIRED_OUTCOME'],
            toBeHumanDecisionIds: [],
            unresolved: false,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'GAP_COMPARISON_INVALID' });
  });

  it('creates a working plan for material gaps without conferring implementation authority', async () => {
    const { service, prr, alignedPip } = await confirmedHarness();
    const gapMap = await service.createGapMap({
      prrRef: prr.reference,
      alignedPipRef: alignedPip.reference,
      analysisVersion: 'gap-analysis-v1',
      comparisons: [
        {
          gapId: 'gap-runtime',
          statement: 'Material runtime gap.',
          material: true,
          asIsObservationIds: ['obs-runtime'],
          toBeIntentDimensionRefs: ['DESIRED_OUTCOME'],
          toBeHumanDecisionIds: [],
          unresolved: false,
        },
      ],
    });

    const plan = service.createCompletionRecoveryPlan(gapMap, [
      { itemId: 'plan-1', gapId: 'gap-runtime', statement: 'Close the validated runtime gap.' },
    ]);

    expect(plan).toMatchObject({
      authorityClass: 'WORKING_PROPOSED_ARTIFACT',
      implementationAuthorized: false,
      sourceGapMapDigest: gapMap.gapMapDigest,
    });
  });

  it('does not fabricate a plan when there is no material validated gap', async () => {
    const { service, prr, alignedPip } = await confirmedHarness();
    const gapMap = await service.createGapMap({
      prrRef: prr.reference,
      alignedPipRef: alignedPip.reference,
      analysisVersion: 'gap-analysis-v1',
      comparisons: [],
    });

    expect(() => service.createCompletionRecoveryPlan(gapMap, [])).toThrow(
      expect.objectContaining({ code: 'NO_MATERIAL_GAP' }),
    );
  });

  it('marks Gap Maps and plans stale when their exact derived inputs change', async () => {
    const { service, prr, alignedPip } = await confirmedHarness();
    const gapMap = await service.createGapMap({
      prrRef: prr.reference,
      alignedPipRef: alignedPip.reference,
      analysisVersion: 'gap-analysis-v1',
      comparisons: [
        {
          gapId: 'gap-runtime',
          statement: 'Material runtime gap.',
          material: true,
          asIsObservationIds: ['obs-runtime'],
          toBeIntentDimensionRefs: ['DESIRED_OUTCOME'],
          toBeHumanDecisionIds: [],
          unresolved: false,
        },
      ],
    });
    const plan = service.createCompletionRecoveryPlan(gapMap, [
      { itemId: 'plan-1', gapId: 'gap-runtime', statement: 'Close it.' },
    ]);
    const newerPrrRef = {
      ...prr.reference,
      revisionId: 'prr-i5-002',
      path: '.mcf/reality/prr-prr-i5-002.json',
    } satisfies CanonicalArtifactRef<'PROJECT_REALITY_REPORT'>;
    const changedGapMap = { ...gapMap, analysisVersion: 'gap-analysis-v2' } as DerivedGapMap;
    changedGapMap.gapMapDigest = calculateGapMapDigest(changedGapMap);

    expect(isGapMapStale(gapMap, newerPrrRef, alignedPip.reference)).toBe(true);
    expect(isCompletionPlanStale(plan, changedGapMap)).toBe(true);
  });
});
