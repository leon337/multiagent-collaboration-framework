import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  McfMissionContract,
  ProjectIntentPackageV1,
  ProjectRealityReportV1,
} from '@rsa/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  RepositoryProjectArtifactStore,
  type LocalProjectArtifact,
} from '../project-artifacts/repository-project-artifact.store.js';
import { IntentAlignmentService } from '../project-intake/intent-alignment.service.js';
import type { CreateMcfMissionInput, McfRuntimeRepository } from './mcf-runtime.repository.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { MissionV11ContextGuard } from './mission-v11-context.guard.js';

const repositoryName = 'leon337/multiagent-collaboration-framework';
const schemas = fileURLToPath(new URL('../../../../../../schemas/', import.meta.url));
const pipFixturePath = fileURLToPath(
  new URL(
    '../../../../../../schemas/fixtures/v1.1/project-intent-package.valid.json',
    import.meta.url,
  ),
);
const prrFixturePath = fileURLToPath(
  new URL(
    '../../../../../../schemas/fixtures/v1.1/project-reality-report.valid.json',
    import.meta.url,
  ),
);
const temporaryRoots: string[] = [];

async function harness() {
  const root = await mkdtemp(join(tmpdir(), 'mcf-i6-context-'));
  temporaryRoots.push(root);
  const artifacts = new RepositoryProjectArtifactStore({
    repositoryRoot: root,
    schemaDirectory: schemas,
    repository: repositoryName,
  });
  const alignment = new IntentAlignmentService(artifacts);
  const source = JSON.parse(await readFile(pipFixturePath, 'utf8')) as ProjectIntentPackageV1;
  const local = await artifacts.writePip(source);
  const readback = await alignment.createFinalIntentReadback(local.reference);
  const aligned = await alignment.align(readback, {
    humanAuthority: 'LEANDRO',
    confirmationSourceRef: 'human-gate:i6-fixture',
    confirmedAt: '2026-08-16T03:30:00Z',
    expectedPipRef: local.reference,
    finalReadbackRefOrDigest: readback.readbackDigest,
    decision: 'PASS',
  });
  if (aligned.outcome !== 'PASS') throw new Error('expected aligned PIP fixture');

  const prrFixture = JSON.parse(await readFile(prrFixturePath, 'utf8')) as ProjectRealityReportV1;
  const prr: ProjectRealityReportV1 = {
    ...prrFixture,
    projectId: aligned.alignedPip.artifact.projectId,
    methodologyPin: structuredClone(aligned.alignedPip.artifact.methodologyPin),
    realityConfirmation: {
      status: 'CONFIRMED',
      confirmedAt: '2026-08-16T03:35:00Z',
    },
  };
  const persistedPrr = await artifacts.writePrr(prr);
  const guard = new MissionV11ContextGuard(artifacts, alignment);
  return { artifacts, alignment, alignedPip: aligned.alignedPip, prr: persistedPrr, guard };
}

function baseContract(): McfMissionContract {
  return {
    title: 'MCF v1.1 implementation mission',
    objective: 'Implement the aligned MCF v1.1 objective',
    expectedOutcome: 'Aligned outcome',
    scope: ['runtime integration'],
    outOfScope: [],
    acceptanceCriteria: ['exact refs verified'],
    riskClass: 'B',
    selectedAgents: ['Mestre'],
    selectedSkills: ['MCF-START-MISSION'],
    sourceOfTruth: ['GitHub'],
  };
}

function v11Contract(
  alignedPip: LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>,
  prr?: LocalProjectArtifact<'PROJECT_REALITY_REPORT'>,
): McfMissionContract {
  return {
    ...baseContract(),
    contractSchemaVersion: '1.1',
    projectId: alignedPip.artifact.projectId,
    projectEntryMode: 'ADOPT_EXISTING_PROJECT',
    methodologyPin: structuredClone(alignedPip.artifact.methodologyPin),
    alignedPipRef: structuredClone(alignedPip.reference),
    ...(prr ? { projectRealityReportRef: structuredClone(prr.reference) } : {}),
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('MCF v1.1 mission context guard', () => {
  it('accepts an exact verified aligned PIP pair and confirmed PRR', async () => {
    const { alignedPip, prr, guard } = await harness();
    const result = await guard.validate(v11Contract(alignedPip, prr));

    expect(result).toMatchObject({
      contractSchemaVersion: '1.1',
      projectId: alignedPip.artifact.projectId,
      projectEntryMode: 'ADOPT_EXISTING_PROJECT',
      alignedPipRef: alignedPip.reference,
      projectRealityReportRef: prr.reference,
    });
  });

  it('rejects a v1.1 mission without alignedPipRef', async () => {
    const { guard } = await harness();
    await expect(
      guard.validate({
        ...baseContract(),
        contractSchemaVersion: '1.1',
        projectId: 'mcf-v1.1',
        projectEntryMode: 'NEW_PROJECT',
        methodologyPin: { version: '1.1.0', immutableRef: 'git:test' },
      }),
    ).rejects.toMatchObject({ code: 'ALIGNED_PIP_REQUIRED' });
  });

  it('rejects an aligned PIP marker without its exact receipt pair', async () => {
    const { artifacts, alignedPip, guard } = await harness();
    const broken = structuredClone(alignedPip.artifact);
    broken.revisionId = 'broken-pair';
    broken.alignment = {
      status: 'ALIGNED',
      receiptRef: '.mcf/receipts/intent-alignment-alignment-broken-pair.json',
      alignedAt: '2026-08-16T03:30:00Z',
    };
    const persisted = await artifacts.writePip(broken);

    await expect(guard.validate(v11Contract(persisted))).rejects.toMatchObject({
      code: 'ALIGNED_PIP_PAIR_INVALID',
    });
  });

  it('fails closed on project or methodology mismatch', async () => {
    const { alignedPip, guard } = await harness();

    await expect(
      guard.validate({ ...v11Contract(alignedPip), projectId: 'another-project' }),
    ).rejects.toMatchObject({ code: 'PROJECT_CONTEXT_MISMATCH' });
    await expect(
      guard.validate({
        ...v11Contract(alignedPip),
        methodologyPin: { version: '1.1.0', immutableRef: 'git:wrong' },
      }),
    ).rejects.toMatchObject({ code: 'METHODOLOGY_PIN_MISMATCH' });
  });

  it('rejects a referenced PRR that is not Reality Confirmed', async () => {
    const { artifacts, alignedPip, guard } = await harness();
    const fixture = JSON.parse(await readFile(prrFixturePath, 'utf8')) as ProjectRealityReportV1;
    const pending = await artifacts.writePrr({
      ...fixture,
      revisionId: 'pending-i6',
      projectId: alignedPip.artifact.projectId,
      methodologyPin: structuredClone(alignedPip.artifact.methodologyPin),
      realityConfirmation: { status: 'PENDING' },
    });

    await expect(guard.validate(v11Contract(alignedPip, pending))).rejects.toMatchObject({
      code: 'PRR_NOT_CONFIRMED',
    });
  });
});

describe('MissionRuntimeService v1.1 integration', () => {
  it('keeps the legacy v1.0 create path unchanged', async () => {
    const captured: CreateMcfMissionInput[] = [];
    const repository = {
      createMission: vi.fn(async (input: CreateMcfMissionInput) => {
        captured.push(input);
        return input.mission;
      }),
    } as unknown as McfRuntimeRepository;
    const guard = { validate: vi.fn() };
    const service = new MissionRuntimeService(
      repository,
      {} as never,
      {} as never,
      {} as never,
      guard as never,
    );

    const result = await service.createMission({ contract: baseContract() });

    expect(result.contract.contractSchemaVersion).toBeUndefined();
    expect(guard.validate).not.toHaveBeenCalled();
    expect(captured[0]?.event.payload).toEqual({
      title: baseContract().title,
      riskClass: baseContract().riskClass,
      selectedAgents: baseContract().selectedAgents,
      selectedSkills: baseContract().selectedSkills,
    });
  });

  it('validates v1.1 context before persistence and exposes exact refs in the existing event ledger', async () => {
    const { alignedPip, prr } = await harness();
    const contract = v11Contract(alignedPip, prr);
    const captured: CreateMcfMissionInput[] = [];
    const repository = {
      createMission: vi.fn(async (input: CreateMcfMissionInput) => {
        captured.push(input);
        return input.mission;
      }),
    } as unknown as McfRuntimeRepository;
    const guard = { validate: vi.fn(async () => contract) };
    const service = new MissionRuntimeService(
      repository,
      {} as never,
      {} as never,
      {} as never,
      guard as never,
    );

    await service.createMission({ contract });

    expect(guard.validate).toHaveBeenCalledWith(contract);
    expect(captured[0]?.event.eventType).toBe('MISSION_CREATED');
    expect(captured[0]?.event.payload).toMatchObject({
      contractSchemaVersion: '1.1',
      projectId: contract.projectId,
      projectEntryMode: contract.projectEntryMode,
      methodologyPin: contract.methodologyPin,
      alignedPipRef: contract.alignedPipRef,
      projectRealityReportRef: contract.projectRealityReportRef,
    });
  });

  it('fails closed before persistence when v1.1 context validation fails', async () => {
    const repository = {
      createMission: vi.fn(),
    } as unknown as McfRuntimeRepository;
    const guard = {
      validate: vi.fn(async () => {
        throw Object.assign(new Error('invalid v1.1 context'), {
          code: 'ALIGNED_PIP_PAIR_INVALID',
        });
      }),
    };
    const service = new MissionRuntimeService(
      repository,
      {} as never,
      {} as never,
      {} as never,
      guard as never,
    );

    await expect(
      service.createMission({
        contract: {
          ...baseContract(),
          contractSchemaVersion: '1.1',
          projectId: 'mcf-v1.1',
          projectEntryMode: 'NEW_PROJECT',
          methodologyPin: { version: '1.1.0', immutableRef: 'git:test' },
          alignedPipRef: {
            artifactType: 'PROJECT_INTENT_PACKAGE',
            schemaVersion: '1.0',
            projectId: 'mcf-v1.1',
            revisionId: 'missing',
            path: '.mcf/intent/pip-missing.json',
            contentDigest: `sha256:${'0'.repeat(64)}`,
            repository: repositoryName,
            commitSha: null,
          },
        },
      }),
    ).rejects.toMatchObject({ code: 'ALIGNED_PIP_PAIR_INVALID' });
    expect(repository.createMission).not.toHaveBeenCalled();
  });
});
