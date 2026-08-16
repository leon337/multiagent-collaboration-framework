import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { McfArtifactRef, McfMissionContract, ProjectRealityReportV1 } from '@rsa/contracts';

import {
  RepositoryProjectArtifactStore,
  type CanonicalArtifactRef,
} from '../project-artifacts/repository-project-artifact.store.js';
import { IntentAlignmentService } from '../project-intake/intent-alignment.service.js';

export type MissionV11ContextErrorCode =
  | 'V11_CONTEXT_INCOMPLETE'
  | 'ALIGNED_PIP_REQUIRED'
  | 'ALIGNED_PIP_PAIR_INVALID'
  | 'PROJECT_CONTEXT_MISMATCH'
  | 'METHODOLOGY_PIN_MISMATCH'
  | 'PRR_REF_INVALID'
  | 'PRR_NOT_CONFIRMED'
  | 'REMOTE_CONTEXT_READER_REQUIRED'
  | 'PROJECT_ARTIFACT_ROOT_UNAVAILABLE';

export class MissionV11ContextError extends Error {
  constructor(
    readonly code: MissionV11ContextErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MissionV11ContextError';
  }
}

export interface ValidatedMissionV11Context {
  contractSchemaVersion: '1.1';
  projectId: string;
  projectEntryMode: NonNullable<McfMissionContract['projectEntryMode']>;
  methodologyPin: NonNullable<McfMissionContract['methodologyPin']>;
  alignedPipRef: McfArtifactRef;
  projectRealityReportRef?: McfArtifactRef | undefined;
}

function fail(code: MissionV11ContextErrorCode, message: string): never {
  throw new MissionV11ContextError(code, message);
}

function sameMethodologyPin(
  left: { version: string; immutableRef: string },
  right: { version: string; immutableRef: string },
): boolean {
  return left.version === right.version && left.immutableRef === right.immutableRef;
}

function assertLocalReference(reference: McfArtifactRef): void {
  if (reference.commitSha !== null) {
    fail(
      'REMOTE_CONTEXT_READER_REQUIRED',
      'remote-checkpointed v1.1 artifacts require exact-commit resolution before Mission Runtime admission',
    );
  }
}

function discoverRepositoryRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, 'schemas', 'project-intent-package-v1.schema.json'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return fail(
    'PROJECT_ARTIFACT_ROOT_UNAVAILABLE',
    'cannot locate the repository-backed MCF project artifact root',
  );
}

export class MissionV11ContextGuard {
  constructor(
    private readonly providedArtifacts?: RepositoryProjectArtifactStore,
    private readonly providedAlignment?: IntentAlignmentService,
  ) {}

  async validate(contract: McfMissionContract): Promise<ValidatedMissionV11Context> {
    if (contract.contractSchemaVersion !== '1.1') {
      fail('V11_CONTEXT_INCOMPLETE', 'MissionV11ContextGuard accepts only v1.1 contracts');
    }
    if (
      !contract.projectId ||
      !contract.projectEntryMode ||
      !contract.methodologyPin ||
      !contract.alignedPipRef
    ) {
      if (!contract.alignedPipRef) {
        fail('ALIGNED_PIP_REQUIRED', 'a v1.1 implementation mission requires alignedPipRef');
      }
      fail(
        'V11_CONTEXT_INCOMPLETE',
        'v1.1 Mission Runtime admission requires projectId, projectEntryMode and methodologyPin',
      );
    }

    const pipRef = contract.alignedPipRef;
    if (
      pipRef.artifactType !== 'PROJECT_INTENT_PACKAGE' ||
      pipRef.projectId !== contract.projectId
    ) {
      fail('PROJECT_CONTEXT_MISMATCH', 'alignedPipRef does not match the mission project context');
    }
    assertLocalReference(pipRef);

    const { artifacts, alignment } = this.dependencies(pipRef.repository);
    const pair = await alignment.verifyAlignmentPair(
      pipRef as CanonicalArtifactRef<'PROJECT_INTENT_PACKAGE'>,
    );
    if (pair.state !== 'PASS_VERIFIED') {
      fail(
        'ALIGNED_PIP_PAIR_INVALID',
        `Mission Runtime requires an exact verified PIP + Intent Alignment Receipt pair: ${pair.reason}`,
      );
    }
    if (
      pair.alignedPip.artifact.projectId !== contract.projectId ||
      !sameMethodologyPin(pair.alignedPip.artifact.methodologyPin, contract.methodologyPin)
    ) {
      fail(
        pair.alignedPip.artifact.projectId !== contract.projectId
          ? 'PROJECT_CONTEXT_MISMATCH'
          : 'METHODOLOGY_PIN_MISMATCH',
        'aligned PIP does not match the mission project or methodology pin',
      );
    }

    if (contract.projectRealityReportRef) {
      await this.assertPrr(
        artifacts,
        contract.projectRealityReportRef,
        contract.projectId,
        contract.methodologyPin,
        pipRef.repository,
      );
    }

    return {
      contractSchemaVersion: '1.1',
      projectId: contract.projectId,
      projectEntryMode: contract.projectEntryMode,
      methodologyPin: structuredClone(contract.methodologyPin),
      alignedPipRef: structuredClone(pipRef),
      ...(contract.projectRealityReportRef
        ? { projectRealityReportRef: structuredClone(contract.projectRealityReportRef) }
        : {}),
    };
  }

  private dependencies(repository: string): {
    artifacts: RepositoryProjectArtifactStore;
    alignment: IntentAlignmentService;
  } {
    if (this.providedArtifacts) {
      return {
        artifacts: this.providedArtifacts,
        alignment: this.providedAlignment ?? new IntentAlignmentService(this.providedArtifacts),
      };
    }
    const root = discoverRepositoryRoot();
    const artifacts = new RepositoryProjectArtifactStore({
      repositoryRoot: root,
      schemaDirectory: join(root, 'schemas'),
      repository,
    });
    return { artifacts, alignment: new IntentAlignmentService(artifacts) };
  }

  private async assertPrr(
    artifacts: RepositoryProjectArtifactStore,
    reference: McfArtifactRef,
    projectId: string,
    methodologyPin: { version: string; immutableRef: string },
    expectedRepository: string,
  ): Promise<void> {
    if (
      reference.artifactType !== 'PROJECT_REALITY_REPORT' ||
      reference.projectId !== projectId ||
      reference.repository !== expectedRepository
    ) {
      fail('PRR_REF_INVALID', 'projectRealityReportRef does not match the exact mission context');
    }
    assertLocalReference(reference);
    let loaded: ProjectRealityReportV1;
    try {
      loaded = (
        await artifacts.loadLocal(reference as CanonicalArtifactRef<'PROJECT_REALITY_REPORT'>)
      ).artifact;
    } catch (error) {
      fail('PRR_REF_INVALID', `projectRealityReportRef could not be verified: ${String(error)}`);
    }
    if (
      loaded.realityConfirmation.status !== 'CONFIRMED' &&
      loaded.realityConfirmation.status !== 'CONFIRMED_WITH_CORRECTIONS'
    ) {
      fail('PRR_NOT_CONFIRMED', 'Mission Runtime cannot bind an unconfirmed Project Reality Report');
    }
    if (loaded.projectId !== projectId) {
      fail('PROJECT_CONTEXT_MISMATCH', 'Project Reality Report belongs to another project');
    }
    if (!sameMethodologyPin(loaded.methodologyPin, methodologyPin)) {
      fail('METHODOLOGY_PIN_MISMATCH', 'Project Reality Report methodology pin does not match');
    }
  }
}
