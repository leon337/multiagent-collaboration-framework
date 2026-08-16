import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  McfMissionContract,
  McfStandingAuthorization,
  ProjectIntentPackageV1,
  ProvenanceRef,
} from '@rsa/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { HumanDelegationGuard } from '../mcf-runtime/human-delegation-guard.js';
import type { McfRuntimeRepository } from '../mcf-runtime/mcf-runtime.repository.js';
import { MissionRuntimeService } from '../mcf-runtime/mission-runtime.service.js';
import { MissionV11ContextGuard } from '../mcf-runtime/mission-v11-context.guard.js';
import { ContinuityRecoveryService } from '../mcf-runtime/continuity-recovery.service.js';
import { RepositoryProjectArtifactStore } from '../project-artifacts/repository-project-artifact.store.js';
import {
  CANONICAL_INTENT_DIMENSIONS,
  HumanIntentDiscoveryService,
  createDiscoveryPip,
  createIncrementalIntentRevision,
} from '../project-intake/human-intent-discovery.service.js';
import { IntentAlignmentService } from '../project-intake/intent-alignment.service.js';
import { transitionMcfActivation } from '../project-intake/project-activation.js';
import { classifyProjectEntry } from '../project-intake/project-entry-classifier.js';
import {
  ProjectRealityReportService,
  createRealityReadback,
  createReconnaissanceDraft,
  isGapMapStale,
  machineEvidence,
} from '../project-intake/project-reality-report.service.js';

const repository = 'leon337/multiagent-collaboration-framework';
const schemas = fileURLToPath(new URL('../../../../../../schemas/', import.meta.url));
const temporaryRoots: string[] = [];
const methodologyPin = {
  version: '1.1.0',
  immutableRef: 'decision-ledger:MCF-V1.1-Q1-Q20',
};
const humanProvenance: ProvenanceRef[] = [
  {
    type: 'HUMAN_DIRECT_STATEMENT',
    sourceRef: 'human-gate:q19-controlled-scenario',
    capturedAt: '2026-08-16T04:00:00Z',
    actor: 'LEANDRO',
  },
];
const machineInference: ProvenanceRef[] = [
  {
    type: 'MACHINE_INFERENCE',
    sourceRef: 'fixture:controlled-repository-analysis',
    capturedAt: '2026-08-16T04:00:00Z',
    actor: 'MESTRE',
  },
];

interface ReadyHarness {
  store: RepositoryProjectArtifactStore;
  alignment: IntentAlignmentService;
  projectId: string;
  ready: Awaited<ReturnType<HumanIntentDiscoveryService['persistIncrementalRevision']>>;
}

async function createStore(prefix: string): Promise<RepositoryProjectArtifactStore> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryRoots.push(root);
  return new RepositoryProjectArtifactStore({
    repositoryRoot: root,
    schemaDirectory: schemas,
    repository,
  });
}

async function createReadyProject(projectId: string): Promise<ReadyHarness> {
  const store = await createStore(`mcf-q19-${projectId}-`);
  const discovery = new HumanIntentDiscoveryService(store);
  const initial = await discovery.persistInitialPip({
    projectId,
    revisionId: 'pip-r1',
    methodologyPin,
    createdAt: '2026-08-16T04:00:00Z',
    identity: { projectName: projectId, repository },
    originalIntent: {
      text: `Deliver ${projectId} under the approved MCF v1.1 intent envelope.`,
      provenance: structuredClone(humanProvenance),
    },
  });
  const ready = await discovery.persistIncrementalRevision(initial.artifact, {
    revisionId: 'pip-r2',
    createdAt: '2026-08-16T04:01:00Z',
    updates: CANONICAL_INTENT_DIMENSIONS.map((dimension) => ({
      dimension,
      state: 'CLEAR' as const,
      value: `confirmed:${dimension}`,
      provenance: structuredClone(humanProvenance),
      readinessImpact: 'NONE' as const,
    })),
  });
  expect(ready.artifact.lifecycle).toBe('READY_FOR_ALIGNMENT');
  expect(ready.artifact.readiness.state).toBe('READY_FOR_ALIGNMENT');
  return { store, alignment: new IntentAlignmentService(store), projectId, ready };
}

async function alignReady(harness: ReadyHarness) {
  const readback = await harness.alignment.createFinalIntentReadback(harness.ready.reference);
  const result = await harness.alignment.align(readback, {
    humanAuthority: 'LEANDRO',
    confirmationSourceRef: 'human-gate:q19-intent-alignment',
    confirmedAt: '2026-08-16T04:02:00Z',
    expectedPipRef: harness.ready.reference,
    finalReadbackRefOrDigest: readback.readbackDigest,
    decision: 'PASS',
  });
  expect(result.outcome).toBe('PASS');
  if (result.outcome !== 'PASS') throw new Error('expected aligned project');
  return result;
}

function missionContract(
  projectId: string,
  alignedPipRef: McfMissionContract['alignedPipRef'],
  projectEntryMode: NonNullable<McfMissionContract['projectEntryMode']> = 'NEW_PROJECT',
): McfMissionContract {
  return {
    title: `Q19 ${projectId}`,
    objective: `Qualify ${projectId}`,
    expectedOutcome: 'Exact validated MCF v1.1 mission context',
    scope: ['controlled-fixture'],
    outOfScope: ['production'],
    acceptanceCriteria: ['exact context validates'],
    riskClass: 'A',
    selectedAgents: ['LÉO'],
    selectedSkills: ['MCF-START-MISSION'],
    sourceOfTruth: [repository],
    contractSchemaVersion: '1.1',
    projectId,
    projectEntryMode,
    methodologyPin,
    alignedPipRef,
  };
}

function legacyContract(): McfMissionContract {
  return {
    title: 'Legacy v1.0 representative mission',
    objective: 'Preserve stable v1.0 behavior',
    expectedOutcome: 'Mission remains valid without v1.1 fields',
    scope: ['legacy'],
    outOfScope: [],
    acceptanceCriteria: ['legacy path accepted'],
    riskClass: 'A',
    selectedAgents: ['LÉO'],
    selectedSkills: ['MCF-START-MISSION'],
    sourceOfTruth: [repository],
  };
}

function runtimeHarness(v11?: MissionV11ContextGuard) {
  let createCount = 0;
  const stored: unknown[] = [];
  const runtimeRepository = {
    async createMission(input: { mission: unknown }) {
      createCount += 1;
      stored.push(structuredClone(input.mission));
      return input.mission;
    },
  } as unknown as McfRuntimeRepository;
  const runtime = new MissionRuntimeService(
    runtimeRepository,
    {} as never,
    {} as never,
    {} as never,
    v11,
  );
  return { runtime, getCreateCount: () => createCount, stored };
}

function standingAuthorization(
  overrides: Partial<McfStandingAuthorization> = {},
): McfStandingAuthorization {
  return {
    authorizationId: 'AUTH-Q19-001',
    projectId: 'q19-permissions',
    missionId: 'mission-q19',
    grantedBy: 'LEANDRO',
    grantedAt: '2026-08-16T03:00:00Z',
    actionClasses: ['WRITE_TEST_FIXTURE'],
    environments: ['staging'],
    maximumCost: { currency: 'USD', amount: 10 },
    reversibleOnly: true,
    expiresAt: '2026-08-17T00:00:00Z',
    boundary: 'qualification',
    exclusions: [],
    evidenceRequirements: ['evidence:q19'],
    sourceDecisionRef: 'human-gate:q19-standing-auth',
    status: 'ACTIVE',
    ...overrides,
  };
}

function authorizationContext(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    projectId: 'q19-permissions',
    missionId: 'mission-q19',
    actionClass: 'WRITE_TEST_FIXTURE',
    environment: 'staging',
    estimatedCost: { currency: 'USD', amount: 1 },
    reversible: true,
    observedAt: '2026-08-16T04:00:00Z',
    boundary: 'qualification',
    evidenceRefs: ['evidence:q19'],
    reservedHumanAuthority: false,
    standingAuthorizations: [],
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('MCF v1.1 Q19 controlled qualification scenarios', () => {
  it('QP-001 NEW_PROJECT end-to-end controlled scenario', async () => {
    expect(transitionMcfActivation('NOT_ACTIVE', 'BEGIN_ACTIVATION').state).toBe('ACTIVATING');
    expect(transitionMcfActivation('ACTIVATING', 'COMPLETE_ACTIVATION').state).toBe('ACTIVE');
    expect(
      classifyProjectEntry({
        repository: 'ABSENT',
        projectArtifact: 'ABSENT',
        continuityCheckpoint: 'ABSENT',
        sourceReferences: ['fixture:new-project'],
        precedenceDecisions: ['repository-absence-verified'],
        contradictions: [],
      }),
    ).toMatchObject({ status: 'CLASSIFIED', entryMode: 'NEW_PROJECT' });

    const harness = await createReadyProject('qp001-new-project');
    expect(Object.keys(harness.ready.artifact.dimensions)).toHaveLength(20);
    const guard = new MissionV11ContextGuard(harness.store, harness.alignment);
    await expect(
      guard.validate(missionContract(harness.projectId, harness.ready.reference)),
    ).rejects.toThrow(/exact verified PIP \+ Intent Alignment Receipt pair/u);

    const aligned = await alignReady(harness);
    expect(
      await guard.validate(missionContract(harness.projectId, aligned.alignedPip.reference)),
    ).toMatchObject({
      projectId: harness.projectId,
      projectEntryMode: 'NEW_PROJECT',
      alignedPipRef: aligned.alignedPip.reference,
    });
    expect(aligned.implementationAuthorized).toBe(false);
  });

  it('QP-002 ADOPT_EXISTING_PROJECT controlled incomplete repository scenario', async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'mcf-q19-adopt-fixture-'));
    temporaryRoots.push(fixtureRoot);
    await mkdir(join(fixtureRoot, 'src'), { recursive: true });
    await writeFile(join(fixtureRoot, 'src/app.ts'), 'export const implemented = true;\n', 'utf8');
    await writeFile(join(fixtureRoot, 'README.md'), 'Status: complete (stale)\n', 'utf8');
    const beforeCode = await readFile(join(fixtureRoot, 'src/app.ts'), 'utf8');
    const beforeDocs = await readFile(join(fixtureRoot, 'README.md'), 'utf8');

    expect(
      classifyProjectEntry({
        repository: 'PRESENT',
        projectArtifact: 'ABSENT',
        continuityCheckpoint: 'ABSENT',
        sourceReferences: ['fixture:src/app.ts', 'fixture:README.md'],
        precedenceDecisions: ['live-code-precedes-stale-doc'],
        contradictions: [],
      }),
    ).toMatchObject({
      status: 'CLASSIFIED',
      entryMode: 'ADOPT_EXISTING_PROJECT',
      realityReconnaissanceRequired: true,
    });

    const harness = await createReadyProject('qp002-adopt');
    const aligned = await alignReady(harness);
    const reality = new ProjectRealityReportService(harness.store, harness.alignment);
    const draft = createReconnaissanceDraft({
      projectId: harness.projectId,
      revisionId: 'prr-r1',
      methodologyPin,
      createdAt: '2026-08-16T04:03:00Z',
      baseline: {
        repository,
        commitSha: 'b'.repeat(40),
        branch: 'fixture/adopt',
        capturedAt: '2026-08-16T04:03:00Z',
      },
      observations: [
        {
          observationId: 'obs-code',
          domain: 'implementation',
          statement: 'Controlled fixture contains implemented code.',
          kind: 'FACT',
          evidenceRefs: ['fixture:src/app.ts'],
          provenance: [machineEvidence('fixture:src/app.ts', '2026-08-16T04:03:00Z')],
        },
        {
          observationId: 'obs-docs',
          domain: 'documentation',
          statement: 'README completion statement is stale relative to known gaps.',
          kind: 'INFERENCE',
          evidenceRefs: ['fixture:README.md'],
          provenance: structuredClone(machineInference),
        },
        {
          observationId: 'obs-gap',
          domain: 'completion',
          statement: 'A known material gap still requires comparison to human intent.',
          kind: 'UNKNOWN',
          evidenceRefs: [],
          provenance: structuredClone(machineInference),
        },
      ],
      unresolvedFacts: [
        {
          id: 'unknown-gap',
          statement: 'Exact completion state requires validated comparison.',
          evidenceNeeded: ['aligned-pip'],
        },
      ],
    });
    const readback = createRealityReadback(draft);
    const prr = await reality.confirmAndPersist(readback, {
      humanAuthority: 'LEANDRO',
      confirmationSourceRef: 'human-gate:q19-reality-confirmation',
      confirmedAt: '2026-08-16T04:04:00Z',
      expectedRepository: repository,
      expectedCommitSha: 'b'.repeat(40),
      finalReadbackDigest: readback.readbackDigest,
      decision: 'CONFIRMED',
    });
    const gapMap = await reality.createGapMap({
      prrRef: prr.reference,
      alignedPipRef: aligned.alignedPip.reference,
      analysisVersion: 'q19-v1',
      comparisons: [
        {
          gapId: 'gap-001',
          statement: 'Known repository gap versus confirmed MUST_HAVE intent.',
          material: true,
          asIsObservationIds: ['obs-code', 'obs-gap'],
          toBeIntentDimensionRefs: ['MUST_HAVE'],
          toBeHumanDecisionIds: [],
          unresolved: false,
        },
      ],
    });
    const reopened = await harness.alignment.reopenAfterMaterialChange(
      aligned.alignedPip.reference,
      {
        revisionId: 'pip-r3',
        createdAt: '2026-08-16T04:05:00Z',
        updates: [
          {
            dimension: 'MUST_HAVE',
            state: 'CLEAR',
            value: 'human-corrected-must-have',
            provenance: structuredClone(humanProvenance),
            readinessImpact: 'NONE',
          },
        ],
      },
    );

    expect(await readFile(join(fixtureRoot, 'src/app.ts'), 'utf8')).toBe(beforeCode);
    expect(await readFile(join(fixtureRoot, 'README.md'), 'utf8')).toBe(beforeDocs);
    expect(
      prr.artifact.observations.find((item) => item.observationId === 'obs-code')?.statement,
    ).toBe('Controlled fixture contains implemented code.');
    expect(reopened.successorPip.artifact.dimensions.MUST_HAVE.value).toBe(
      'human-corrected-must-have',
    );
    expect(gapMap.sourcePrrRef).toEqual(prr.reference);
    expect(gapMap.sourceAlignedPipRef).toEqual(aligned.alignedPip.reference);
  });

  it('QP-003 RESUME_MCF_PROJECT FAST_RESUME clean-room scenario', () => {
    const producer = new ContinuityRecoveryService();
    const checkpoint = producer.createCheckpoint({
      projectId: 'qp003-resume',
      missionId: 'mission-qp003',
      methodologyPin,
      missionContractRef: 'mission-contract:qp003',
      repositoryState: {
        repository,
        branch: 'feat/qp003',
        checkpointSha: 'c'.repeat(40),
        capturedAt: '2026-08-16T04:00:00Z',
        volatile: true,
      },
      currentPhase: 'I8',
      objective: 'Resume without prior chat',
      currentState: 'CHECKPOINTED',
      evidenceRefs: ['checkpoint:qp003'],
      nextAction: 'CONTINUE_FROM_CANONICAL_CHECKPOINT',
      responsibleAgent: 'MESTRE',
      resumeInstructions: 'Resolve canonical checkpoint and live state.',
      hasUncheckpointedLocalState: false,
    });
    const resumeCard = producer.deriveResumeCard(checkpoint);

    const freshContext = new ContinuityRecoveryService();
    const route = freshContext.decideResumeRoute({
      checkpoint: structuredClone(checkpoint),
      liveRepositoryState: {
        repository,
        branch: 'feat/qp003',
        headSha: 'c'.repeat(40),
        capturedAt: '2026-08-16T04:10:00Z',
      },
      authoritativeRecordsResolved: true,
      methodologyPinValid: true,
      checkpointIntegrityValid: true,
      materialDriftExplainable: false,
    });

    expect(route).toBe('FAST_RESUME');
    expect(resumeCard.nextAction).toBe('CONTINUE_FROM_CANONICAL_CHECKPOINT');
    expect(resumeCard.authorityNotice).toBe('ORIENTATION_ONLY_CANONICAL_CHECKPOINT_WINS');
    expect(JSON.stringify(checkpoint)).not.toContain('chatTranscript');
    expect(JSON.stringify(resumeCard)).not.toContain('chatTranscript');
  });

  it('QP-010 pending HUMAN_GATE blocks only the affected action scenario', () => {
    const guard = new HumanDelegationGuard();
    const pendingReserved = authorizationContext({
      actionClass: 'MATERIAL_STRATEGIC_CHANGE',
      reservedHumanAuthority: true,
      standingAuthorizations: [],
      teamFirst: {
        attempted: true,
        evidenceRefs: ['team-first:q19'],
        fallbackExhausted: true,
      },
      humanGateDecision: { status: 'PENDING' },
    });
    expect(() => guard.assertAllowed('LÉO', { v11AuthorizationContext: pendingReserved })).toThrow(
      /approved by LEANDRO/u,
    );

    expect(() =>
      guard.assertAllowed('LÉO', {
        v11AuthorizationContext: authorizationContext({
          actionClass: 'SAFE_DOCUMENTATION',
          reservedHumanAuthority: false,
        }),
      }),
    ).not.toThrow();
    expect(() =>
      guard.assertAllowed('LÉO', {
        v11AuthorizationContext: authorizationContext({
          actionClass: 'SAFE_TEST_WORK',
          reservedHumanAuthority: false,
        }),
      }),
    ).not.toThrow();
  });

  it('QP-012 v1.0 to v1.1 explicit safe-boundary upgrade scenario', async () => {
    const legacy = legacyContract();
    const legacySnapshot = structuredClone(legacy);
    const legacyRuntime = runtimeHarness();
    const legacyMission = await legacyRuntime.runtime.createMission({ contract: legacy });
    expect(legacyMission.contract).toEqual(legacySnapshot);

    const harness = await createReadyProject('qp012-upgrade');
    const aligned = await alignReady(harness);
    const guard = new MissionV11ContextGuard(harness.store, harness.alignment);
    const upgradedRuntime = runtimeHarness(guard);
    const upgradedContract = missionContract(harness.projectId, aligned.alignedPip.reference);
    const upgradedMission = await upgradedRuntime.runtime.createMission({
      contract: upgradedContract,
    });

    expect(legacy).toEqual(legacySnapshot);
    expect(legacy.contractSchemaVersion).toBeUndefined();
    expect(upgradedMission.contract.contractSchemaVersion).toBe('1.1');
    expect(upgradedMission.contract.methodologyPin).toEqual(methodologyPin);
    expect(upgradedMission.contract.alignedPipRef).toEqual(aligned.alignedPip.reference);
  });

  it('QP-013 migration failure preserves original compatibility scenario', async () => {
    const legacy = legacyContract();
    const harness = await createReadyProject('qp013-migration-failure');
    const aligned = await alignReady(harness);
    const guard = new MissionV11ContextGuard(harness.store, harness.alignment);
    const runtime = runtimeHarness(guard);
    const original = await runtime.runtime.createMission({ contract: legacy });
    expect(runtime.getCreateCount()).toBe(1);

    const invalidRef = {
      ...aligned.alignedPip.reference,
      contentDigest: `sha256:${'f'.repeat(64)}`,
    };
    await expect(
      runtime.runtime.createMission({
        contract: missionContract(harness.projectId, invalidRef),
      }),
    ).rejects.toThrow(/exact verified PIP \+ Intent Alignment Receipt pair/u);

    expect(runtime.getCreateCount()).toBe(1);
    expect(original.contract).toEqual(legacy);
    expect(original.contract.contractSchemaVersion).toBeUndefined();
  });

  it('QP-014 source-authority precedence preserves canonical history and live volatile state', async () => {
    const harness = await createReadyProject('qp014-authority');
    const aligned = await alignReady(harness);
    const canonicalObjective = aligned.alignedPip.artifact.dimensions.DESIRED_OUTCOME.value;
    const continuity = new ContinuityRecoveryService();
    const checkpoint = continuity.createCheckpoint({
      projectId: harness.projectId,
      missionId: 'mission-qp014',
      methodologyPin,
      missionContractRef: 'mission-contract:qp014',
      alignedPipRef: aligned.alignedPip.reference,
      repositoryState: {
        repository,
        branch: 'feat/qp014',
        checkpointSha: 'd'.repeat(40),
        capturedAt: '2026-08-16T04:00:00Z',
        volatile: true,
      },
      currentPhase: 'I8',
      objective: String(canonicalObjective),
      currentState: 'CANONICAL_STATE',
      evidenceRefs: ['checkpoint:qp014'],
      nextAction: 'RECONCILE_LIVE_STATE',
      responsibleAgent: 'MESTRE',
      resumeInstructions: 'Canonical records precede derived orientation.',
      hasUncheckpointedLocalState: false,
    });
    const derived = continuity.deriveResumeCard(checkpoint);
    const brokenResumeCard = { ...derived, currentState: 'BROKEN_OBJECTIVE_Y' };
    const historicalCheckpoint = structuredClone(checkpoint);
    const route = continuity.decideResumeRoute({
      checkpoint,
      liveRepositoryState: {
        repository,
        branch: 'feat/qp014',
        headSha: 'e'.repeat(40),
        capturedAt: '2026-08-16T04:10:00Z',
      },
      authoritativeRecordsResolved: true,
      methodologyPinValid: true,
      checkpointIntegrityValid: true,
      materialDriftExplainable: true,
    });

    expect(canonicalObjective).not.toBe(brokenResumeCard.currentState);
    expect(derived.authorityNotice).toBe('ORIENTATION_ONLY_CANONICAL_CHECKPOINT_WINS');
    expect(route).toBe('RECONCILE');
    expect(checkpoint).toEqual(historicalCheckpoint);
    expect(checkpoint.repositoryState.checkpointSha).toBe('d'.repeat(40));
  });

  it('QP-019 local-only transfer negative clean-room scenario', () => {
    const producer = new ContinuityRecoveryService();
    const checkpoint = producer.createCheckpoint({
      projectId: 'qp019-local-only',
      missionId: 'mission-qp019',
      methodologyPin,
      missionContractRef: 'mission-contract:qp019',
      repositoryState: {
        repository,
        branch: 'feat/qp019',
        checkpointSha: 'a'.repeat(40),
        capturedAt: '2026-08-16T04:00:00Z',
        volatile: true,
      },
      currentPhase: 'I8',
      objective: 'Protect uncheckpointed local state',
      currentState: 'LOCAL_WORK_EXISTS',
      evidenceRefs: ['local-status:dirty'],
      nextAction: 'RECOVER_OR_DECLARE_LOCAL_GAP',
      responsibleAgent: 'MESTRE',
      resumeInstructions: 'Never claim local-only work transferred.',
      hasUncheckpointedLocalState: true,
    });
    expect(checkpoint.transferability).toBe('BLOCKED_LOCAL_ONLY_STATE');

    const remoteFreshContext = new ContinuityRecoveryService();
    expect(
      remoteFreshContext.decideResumeRoute({
        checkpoint,
        liveRepositoryState: {
          repository,
          branch: 'feat/qp019',
          headSha: 'a'.repeat(40),
          capturedAt: '2026-08-16T04:10:00Z',
        },
        authoritativeRecordsResolved: true,
        methodologyPinValid: true,
        checkpointIntegrityValid: true,
        materialDriftExplainable: false,
      }),
    ).toBe('RECOVER_MCF_PROJECT');
  });

  it('QP-006 to QP-009 standing authorization and material gate behavior remain executable', () => {
    const guard = new HumanDelegationGuard();
    const active = standingAuthorization();
    expect(() =>
      guard.assertAllowed('LÉO', {
        v11AuthorizationContext: authorizationContext({
          reservedHumanAuthority: true,
          standingAuthorizations: [active],
        }),
      }),
    ).not.toThrow();

    for (const authorization of [
      standingAuthorization({ environments: ['production'] }),
      standingAuthorization({ expiresAt: '2026-08-15T00:00:00Z' }),
      standingAuthorization({ maximumCost: { currency: 'USD', amount: 0.5 } }),
      standingAuthorization({ exclusions: ['WRITE_TEST_FIXTURE'] }),
      standingAuthorization({ reversibleOnly: true }),
    ]) {
      const context = authorization.reversibleOnly
        ? authorizationContext({
            reservedHumanAuthority: true,
            reversible: false,
            standingAuthorizations: [authorization],
          })
        : authorizationContext({
            reservedHumanAuthority: true,
            standingAuthorizations: [authorization],
          });
      expect(() => guard.assertAllowed('LÉO', { v11AuthorizationContext: context })).toThrow();
    }
  });

  it('QP-015 machine inference cannot silently become human intent', () => {
    const initial: ProjectIntentPackageV1 = createDiscoveryPip({
      projectId: 'qp015-inference',
      revisionId: 'pip-r1',
      methodologyPin,
      createdAt: '2026-08-16T04:00:00Z',
      originalIntent: {
        text: 'Human intent remains human-owned.',
        provenance: structuredClone(humanProvenance),
      },
    });
    expect(() =>
      createIncrementalIntentRevision(initial, {
        revisionId: 'pip-r2',
        createdAt: '2026-08-16T04:01:00Z',
        updates: [],
        humanDecisions: [
          {
            decisionId: 'machine-fabricated',
            status: 'CURRENT',
            statement: 'Repository architecture is now a human MUST_HAVE.',
            provenance: structuredClone(machineInference),
          },
        ],
      }),
    ).toThrow(/machine inference or evidence cannot create/u);
  });

  it('QP-017 material PRR baseline change makes exact derived Gap Map stale', async () => {
    const harness = await createReadyProject('qp017-prr');
    const aligned = await alignReady(harness);
    const reality = new ProjectRealityReportService(harness.store, harness.alignment);
    const draft = createReconnaissanceDraft({
      projectId: harness.projectId,
      revisionId: 'prr-r1',
      methodologyPin,
      createdAt: '2026-08-16T04:03:00Z',
      baseline: {
        repository,
        commitSha: '1'.repeat(40),
        capturedAt: '2026-08-16T04:03:00Z',
      },
      observations: [
        {
          observationId: 'obs-1',
          domain: 'baseline',
          statement: 'Baseline one is verified.',
          kind: 'FACT',
          evidenceRefs: ['git:baseline-one'],
          provenance: [machineEvidence('git:baseline-one', '2026-08-16T04:03:00Z')],
        },
      ],
      unresolvedFacts: [],
    });
    const readback = createRealityReadback(draft);
    const prr = await reality.confirmAndPersist(readback, {
      humanAuthority: 'LEANDRO',
      confirmationSourceRef: 'human-gate:q19-prr',
      confirmedAt: '2026-08-16T04:04:00Z',
      expectedRepository: repository,
      expectedCommitSha: '1'.repeat(40),
      finalReadbackDigest: readback.readbackDigest,
      decision: 'CONFIRMED',
    });
    const gapMap = await reality.createGapMap({
      prrRef: prr.reference,
      alignedPipRef: aligned.alignedPip.reference,
      analysisVersion: 'q19-prr-v1',
      comparisons: [
        {
          gapId: 'gap-baseline',
          statement: 'Baseline compared to human intent.',
          material: true,
          asIsObservationIds: ['obs-1'],
          toBeIntentDimensionRefs: ['DESIRED_OUTCOME'],
          toBeHumanDecisionIds: [],
          unresolved: false,
        },
      ],
    });
    const nextPrrRef = {
      ...prr.reference,
      revisionId: 'prr-r2',
      path: '.mcf/reality/prr-prr-r2.json',
      contentDigest: `sha256:${'2'.repeat(64)}`,
    };
    expect(isGapMapStale(gapMap, nextPrrRef, aligned.alignedPip.reference)).toBe(true);
    expect((await harness.store.loadLocal(prr.reference)).artifact.baseline.commitSha).toBe(
      '1'.repeat(40),
    );
  });
});
