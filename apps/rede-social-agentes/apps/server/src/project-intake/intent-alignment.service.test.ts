import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ProjectIntentPackageV1, ProvenanceRef } from '@rsa/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import {
  calculateProjectArtifactDigest,
  canonicalAlignmentReceiptPath,
  canonicalPipPath,
  RepositoryProjectArtifactStore,
  type CanonicalArtifactRef,
  type LocalProjectArtifact,
} from '../project-artifacts/repository-project-artifact.store.js';
import {
  assessIntentReadiness,
  CANONICAL_INTENT_DIMENSIONS,
} from './human-intent-discovery.service.js';
import {
  calculateFinalIntentReadbackDigest,
  type FinalIntentReadback,
  type IntentAlignmentCommand,
  IntentAlignmentService,
} from './intent-alignment.service.js';

const repository = 'leon337/multiagent-collaboration-framework';
const schemas = fileURLToPath(new URL('../../../../../../schemas/', import.meta.url));
const fixturePath = fileURLToPath(
  new URL(
    '../../../../../../schemas/fixtures/v1.1/project-intent-package.valid.json',
    import.meta.url,
  ),
);
const temporaryRoots: string[] = [];

const humanProvenance: ProvenanceRef[] = [
  {
    type: 'HUMAN_DIRECT_STATEMENT',
    sourceRef: 'conversation:alignment-change-001',
    capturedAt: '2026-08-15T14:00:00Z',
    actor: 'LEANDRO',
  },
];

const machineProvenance: ProvenanceRef[] = [
  {
    type: 'MACHINE_INFERENCE',
    sourceRef: 'analysis:alignment-change-001',
    capturedAt: '2026-08-15T14:00:00Z',
    actor: 'MESTRE',
  },
];

async function fixture(): Promise<ProjectIntentPackageV1> {
  return JSON.parse(await readFile(fixturePath, 'utf8')) as ProjectIntentPackageV1;
}

async function createStore(): Promise<RepositoryProjectArtifactStore> {
  const root = await mkdtemp(join(tmpdir(), 'mcf-intent-alignment-'));
  temporaryRoots.push(root);
  return new RepositoryProjectArtifactStore({
    repositoryRoot: root,
    schemaDirectory: schemas,
    repository,
  });
}

async function persistPip(
  store: RepositoryProjectArtifactStore,
  mutate?: (pip: ProjectIntentPackageV1) => void,
): Promise<LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>> {
  const pip = await fixture();
  mutate?.(pip);
  return store.writePip(pip);
}

function commandFor(
  pip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>,
  readback: FinalIntentReadback,
  overrides: Partial<IntentAlignmentCommand> = {},
): IntentAlignmentCommand {
  return {
    humanAuthority: 'LEANDRO',
    confirmationSourceRef: 'human-gate:intent-alignment-001',
    confirmedAt: '2026-08-15T13:00:00Z',
    expectedPipRef: pip.reference,
    finalReadbackRefOrDigest: readback.readbackDigest,
    decision: 'PASS',
    ...overrides,
  };
}

async function readyHarness(): Promise<{
  store: RepositoryProjectArtifactStore;
  service: IntentAlignmentService;
  pip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>;
  readback: FinalIntentReadback;
}> {
  const store = await createStore();
  const service = new IntentAlignmentService(store);
  const pip = await persistPip(store);
  const readback = await service.createFinalIntentReadback(pip.reference);
  return { store, service, pip, readback };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('MCF v1.1 Intent Alignment boundary', () => {
  it('creates a deterministic derived final read-back bound to the exact PIP', async () => {
    const store = await createStore();
    const pip = await persistPip(store, (artifact) => {
      artifact.humanDecisions.unshift({
        decisionId: 'V11-Q19-OLD',
        status: 'SUPERSEDED',
        statement: 'Prior qualification intent preserved for history.',
        provenance: structuredClone(humanProvenance),
      });
    });
    const service = new IntentAlignmentService(store);

    const first = await service.createFinalIntentReadback(pip.reference);
    const second = await service.createFinalIntentReadback(pip.reference);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      viewType: 'DERIVED_FINAL_INTENT_READBACK',
      authorityClass: 'DERIVED_REBUILDABLE_VIEW',
      sourcePipRef: pip.reference,
      exactPipRevision: pip.artifact.revisionId,
      exactPipContentDigest: pip.reference.contentDigest,
      implementationAuthorized: false,
    });
    expect(first.dimensions.map(({ dimension }) => dimension)).toEqual(CANONICAL_INTENT_DIMENSIONS);
    expect(first.currentHumanDecisions).toHaveLength(1);
    expect(first.supersededHumanDecisionHistory).toEqual([pip.artifact.humanDecisions[0]]);
    expect(first.readbackDigest).toBe(calculateFinalIntentReadbackDigest(first));
  });

  it('persists and verifies a PASS pair bound to the exact aligned revision and digest', async () => {
    const { store, service, pip, readback } = await readyHarness();

    const result = await service.align(readback, commandFor(pip, readback));

    expect(result.outcome).toBe('PASS');
    if (result.outcome !== 'PASS') throw new Error('expected PASS');
    expect(result.implementationAuthorized).toBe(false);
    expect(result.alignedPip.artifact).toMatchObject({
      projectId: pip.artifact.projectId,
      revisionId: pip.artifact.revisionId,
      lifecycle: 'ALIGNED',
      alignment: {
        status: 'ALIGNED',
        receiptRef: canonicalAlignmentReceiptPath(`alignment-${pip.artifact.revisionId}`),
        alignedAt: '2026-08-15T13:00:00Z',
      },
    });
    expect(result.receipt.artifact).toMatchObject({
      projectId: pip.artifact.projectId,
      pipRef: result.alignedPip.reference,
      decision: 'PASS',
      humanAuthority: 'LEANDRO',
      confirmationSourceRef: 'human-gate:intent-alignment-001',
    });
    expect(result.receipt.artifact.pipRef.contentDigest).toBe(
      result.alignedPip.artifact.contentDigest,
    );
    expect(await service.verifyAlignmentPair(result.alignedPip.reference)).toMatchObject({
      state: 'PASS_VERIFIED',
      implementationAuthorized: false,
    });
    expect(await store.loadLocal(result.alignedPip.reference)).toEqual(result.alignedPip);
    expect(await store.loadLocal(result.receipt.reference)).toEqual(result.receipt);
  });

  it('rejects PASS for a PIP that is not READY_FOR_ALIGNMENT', async () => {
    const store = await createStore();
    const pip = await persistPip(store, (artifact) => {
      artifact.lifecycle = 'DISCOVERY_IN_PROGRESS';
      artifact.readiness.state = 'NOT_READY';
    });
    const service = new IntentAlignmentService(store);
    const readback = await service.createFinalIntentReadback(pip.reference);

    await expect(service.align(readback, commandFor(pip, readback))).rejects.toMatchObject({
      code: 'PIP_NOT_READY',
    });
  });

  it('rejects PASS when a blocking unknown remains', async () => {
    const store = await createStore();
    const pip = await persistPip(store, (artifact) => {
      artifact.unknowns = [
        { id: 'unknown:scope', statement: 'Scope remains open.', blocking: true },
      ];
      artifact.readiness.blockingUnknownIds = ['unknown:scope'];
    });
    const service = new IntentAlignmentService(store);
    const readback = await service.createFinalIntentReadback(pip.reference);

    await expect(service.align(readback, commandFor(pip, readback))).rejects.toMatchObject({
      code: 'BLOCKING_UNKNOWN',
    });
  });

  it.each([
    [
      'blocker',
      (pip: ProjectIntentPackageV1) => pip.blockers.push({ id: 'b-1', statement: 'Blocked.' }),
    ],
    [
      'conflict',
      (pip: ProjectIntentPackageV1) =>
        pip.conflicts.push({ id: 'c-1', statement: 'Unresolved.', sourceRefs: ['human:1'] }),
    ],
  ])('rejects PASS with an unresolved %s', async (_label, mutate) => {
    const store = await createStore();
    const pip = await persistPip(store, mutate);
    const service = new IntentAlignmentService(store);
    const readback = await service.createFinalIntentReadback(pip.reference);

    await expect(service.align(readback, commandFor(pip, readback))).rejects.toMatchObject({
      code: 'BLOCKER_OR_CONFLICT',
    });
  });

  it('rejects confirmation authority other than LEANDRO', async () => {
    const { service, pip, readback } = await readyHarness();

    await expect(
      service.align(readback, commandFor(pip, readback, { humanAuthority: 'MESTRE' })),
    ).rejects.toMatchObject({ code: 'ALIGNMENT_AUTHORITY_INVALID' });
  });

  it.each([
    ['missing source', { confirmationSourceRef: '' }],
    ['invalid timestamp', { confirmedAt: '' }],
  ] satisfies Array<[string, Partial<IntentAlignmentCommand>]>)(
    'rejects a confirmation with %s',
    async (_label, override) => {
      const { service, pip, readback } = await readyHarness();

      await expect(
        service.align(readback, commandFor(pip, readback, override)),
      ).rejects.toMatchObject({ code: 'ALIGNMENT_CONFIRMATION_INVALID' });
    },
  );

  it('rejects an expected PIP revision mismatch', async () => {
    const { service, pip, readback } = await readyHarness();
    const mismatch = {
      ...pip.reference,
      revisionId: 'pip-other',
      path: canonicalPipPath('pip-other'),
    } satisfies CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;

    await expect(
      service.align(readback, commandFor(pip, readback, { expectedPipRef: mismatch })),
    ).rejects.toMatchObject({ code: 'PIP_REF_REVISION_MISMATCH' });
  });

  it('rejects an expected PIP digest mismatch', async () => {
    const { service, pip, readback } = await readyHarness();
    const mismatch = {
      ...pip.reference,
      contentDigest: `sha256:${'f'.repeat(64)}`,
    } satisfies CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>;

    await expect(
      service.align(readback, commandFor(pip, readback, { expectedPipRef: mismatch })),
    ).rejects.toMatchObject({ code: 'PIP_REF_DIGEST_MISMATCH' });
  });

  it.each([
    [
      'project',
      (ref: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>) => ({
        ...ref,
        projectId: 'other-project',
      }),
    ],
    [
      'path',
      (ref: CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>) => ({
        ...ref,
        path: '.mcf/intent/other.json',
      }),
    ],
  ])('rejects an expected PIP %s mismatch', async (_label, mutate) => {
    const { service, pip, readback } = await readyHarness();

    await expect(
      service.align(
        readback,
        commandFor(pip, readback, {
          expectedPipRef: mutate(pip.reference),
        }),
      ),
    ).rejects.toMatchObject({ code: 'PIP_REF_MISMATCH' });
  });

  it('rejects a final read-back bound to another revision', async () => {
    const store = await createStore();
    const first = await persistPip(store);
    const second = await persistPip(store, (artifact) => {
      artifact.revisionId = 'pip-002';
      artifact.supersedesRevisionId = first.artifact.revisionId;
    });
    const service = new IntentAlignmentService(store);
    const secondReadback = await service.createFinalIntentReadback(second.reference);

    await expect(
      service.align(secondReadback, commandFor(first, secondReadback)),
    ).rejects.toMatchObject({ code: 'PIP_REF_REVISION_MISMATCH' });
  });

  it('rejects a tampered final read-back even when its digest field is recomputed', async () => {
    const { service, pip, readback } = await readyHarness();
    const tampered = structuredClone(readback);
    tampered.dimensions[0]!.record.value = 'fabricated derived intent';
    tampered.readbackDigest = calculateFinalIntentReadbackDigest(tampered);

    await expect(
      service.align(
        tampered,
        commandFor(pip, tampered, { finalReadbackRefOrDigest: tampered.readbackDigest }),
      ),
    ).rejects.toMatchObject({ code: 'FINAL_READBACK_INVALID' });
  });

  it('returns explicit correction without aligning or creating a receipt', async () => {
    const { store, service, pip, readback } = await readyHarness();

    const result = await service.align(
      readback,
      commandFor(pip, readback, { decision: 'REJECTED_FOR_CORRECTION' }),
    );

    expect(result).toEqual({
      outcome: 'REJECTED_FOR_CORRECTION',
      pipRef: pip.reference,
      correctionRequired: true,
      implementationAuthorized: false,
    });
    expect(await store.loadLocal(pip.reference)).toEqual(pip);
    await expect(
      store.resolveLocalAlignmentReceipt(
        pip.artifact.projectId,
        `alignment-${pip.artifact.revisionId}`,
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('classifies partial persistence without PASS and retries deterministically', async () => {
    const { store, pip, readback } = await readyHarness();
    const command = commandFor(pip, readback);
    const failing = new IntentAlignmentService(store, {
      afterAlignedPipPersisted: async () => {
        throw new Error('injected failure between PIP and receipt persistence');
      },
    });

    await expect(failing.align(readback, command)).rejects.toMatchObject({
      code: 'ALIGNMENT_PAIR_INCOMPLETE',
    });
    const partialPip = await store.resolveLocalPipRevision(
      pip.artifact.projectId,
      pip.artifact.revisionId,
    );
    expect(partialPip.artifact.lifecycle).toBe('ALIGNED');
    expect(await failing.verifyAlignmentPair(partialPip.reference)).toEqual({
      state: 'INCOMPLETE',
      reason: 'aligned PIP exists without its receipt',
      implementationAuthorized: false,
    });

    const recovered = await new IntentAlignmentService(store).align(readback, command);
    expect(recovered).toMatchObject({ outcome: 'PASS', implementationAuthorized: false });
  });

  it('keeps an aligned revision immutable', async () => {
    const { store, service, pip, readback } = await readyHarness();
    const result = await service.align(readback, commandFor(pip, readback));
    if (result.outcome !== 'PASS') throw new Error('expected PASS');
    const mutation = structuredClone(result.alignedPip.artifact);
    mutation.originalIntent.text = 'Mutation of aligned intent is forbidden.';

    await expect(store.writePip(mutation)).rejects.toMatchObject({
      code: 'ALIGNED_PIP_IMMUTABLE',
    });
    await expect(
      service.createFinalIntentReadback(result.alignedPip.reference),
    ).rejects.toMatchObject({ code: 'ALIGNED_REVISION_IMMUTABLE' });
  });

  it('preserves the old aligned pair and creates a reopened successor for material change', async () => {
    const { store, service, pip, readback } = await readyHarness();
    const aligned = await service.align(readback, commandFor(pip, readback));
    if (aligned.outcome !== 'PASS') throw new Error('expected PASS');
    const oldPip = structuredClone(aligned.alignedPip);
    const oldReceipt = structuredClone(aligned.receipt);

    const reopened = await service.reopenAfterMaterialChange(aligned.alignedPip.reference, {
      revisionId: 'pip-002',
      createdAt: '2026-08-15T14:00:00Z',
      updates: [
        {
          dimension: 'FUTURE_VISION',
          state: 'CLEAR',
          value: 'The future vision now includes federated collaboration.',
          provenance: humanProvenance,
          readinessImpact: 'NON_BLOCKING',
        },
      ],
    });

    expect(reopened.priorAlignedPip).toEqual(oldPip);
    expect(reopened.priorReceipt).toEqual(oldReceipt);
    expect(reopened.successorPip.artifact).toMatchObject({
      revisionId: 'pip-002',
      supersedesRevisionId: pip.artifact.revisionId,
      lifecycle: 'REOPENED_AFTER_MATERIAL_CHANGE',
      readiness: { state: 'NOT_READY' },
      alignment: { status: 'REOPENED' },
    });
    expect(reopened.implementationAuthorized).toBe(false);
    expect(await store.loadLocal(oldPip.reference)).toEqual(oldPip);
    expect(await store.loadLocal(oldReceipt.reference)).toEqual(oldReceipt);

    const successorReadback = await service.createFinalIntentReadback(
      reopened.successorPip.reference,
    );
    await expect(
      service.align(
        successorReadback,
        commandFor(reopened.successorPip, successorReadback, {
          confirmedAt: '2026-08-15T15:00:00Z',
        }),
      ),
    ).rejects.toMatchObject({ code: 'PIP_NOT_READY' });

    const reassessed = assessIntentReadiness(
      reopened.successorPip.artifact,
      '2026-08-15T15:00:00Z',
    );
    expect(reassessed.pip.lifecycle).toBe('READY_FOR_ALIGNMENT');
    expect(reassessed.pip.alignment.status).toBe('NOT_ALIGNED');
    expect(reassessed.implementationAuthorized).toBe(false);
  });

  it('rejects machine-only provenance for material reopen', async () => {
    const { service, pip, readback } = await readyHarness();
    const aligned = await service.align(readback, commandFor(pip, readback));
    if (aligned.outcome !== 'PASS') throw new Error('expected PASS');

    await expect(
      service.reopenAfterMaterialChange(aligned.alignedPip.reference, {
        revisionId: 'pip-002',
        createdAt: '2026-08-15T14:00:00Z',
        updates: [
          {
            dimension: 'FUTURE_VISION',
            state: 'PARTIAL',
            value: 'Machine-proposed change.',
            provenance: machineProvenance,
            readinessImpact: 'NON_BLOCKING',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'MATERIAL_CHANGE_PROVENANCE_REQUIRED' });
  });

  it('does not accept another confirmation for an already aligned exact revision', async () => {
    const { service, pip, readback } = await readyHarness();
    const first = await service.align(readback, commandFor(pip, readback));
    expect(first.outcome).toBe('PASS');

    await expect(
      service.align(readback, commandFor(pip, readback, { decision: 'REJECTED_FOR_CORRECTION' })),
    ).rejects.toMatchObject({ code: 'ALIGNED_REVISION_IMMUTABLE' });
    await expect(
      service.align(
        readback,
        commandFor(pip, readback, {
          confirmationSourceRef: 'human-gate:different-confirmation',
        }),
      ),
    ).rejects.toMatchObject({ code: 'ALIGNED_REVISION_IMMUTABLE' });
  });

  it('keeps the aligned digest equal to its canonical content calculation', async () => {
    const { service, pip, readback } = await readyHarness();
    const result = await service.align(readback, commandFor(pip, readback));
    if (result.outcome !== 'PASS') throw new Error('expected PASS');

    expect(result.alignedPip.artifact.contentDigest).toBe(
      calculateProjectArtifactDigest(result.alignedPip.artifact),
    );
  });
});
