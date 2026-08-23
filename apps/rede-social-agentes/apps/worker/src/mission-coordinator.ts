import type {
  AtomicCheckpointStore,
  CheckpointReceipt,
  StepArtifactReference,
  StepResultMarker,
  StepValidationResult,
} from './checkpoint.js';
import { createStepExecutionKey } from './checkpoint.js';
import { assertFullCommitSha, assertSafeIdentifier } from './policy.js';

export type PersistentMissionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING_GATE'
  | 'RETRY_WAIT'
  | 'BLOCKED_AUTH'
  | 'BLOCKED_POLICY'
  | 'HUMAN_GATE'
  | 'BLOCKED'
  | 'FAILED'
  | 'SUCCEEDED'
  | 'CANCELLED';

export interface RunnableMissionStep {
  readonly stepKey: string;
  readonly stepOrder: number;
  readonly objective: string;
  readonly acceptanceCriteria: readonly string[];
  readonly verificationProfiles: readonly string[];
  readonly attempt: number;
}

export interface MissionProgress {
  readonly missionId: string;
  readonly status: PersistentMissionStatus;
  readonly stateVersion: number;
  readonly currentStep: RunnableMissionStep | null;
}

export interface ClaimedMission extends MissionProgress {
  readonly missionSpecDigest: string;
  readonly repositoryKey: string;
  readonly baseCommitSha: string;
  readonly leaseToken: string;
  readonly fencingToken: number;
}

export interface MissionStepTransition {
  readonly stateVersion: number;
  readonly step: RunnableMissionStep;
}

export interface MissionStepFailure {
  readonly code: string;
  readonly message: string;
  readonly kind: 'TRANSIENT' | 'AUTH' | 'POLICY' | 'PERMANENT' | 'HUMAN_GATE';
  readonly retryable: boolean;
}

interface FencedMissionMutation {
  readonly missionId: string;
  readonly leaseToken: string;
  readonly fencingToken: number;
  readonly expectedStateVersion: number;
}

export interface MissionStatePort {
  beginStep(
    input: FencedMissionMutation & {
      readonly stepKey: string;
      readonly executionKey: string;
    },
  ): Promise<MissionStepTransition>;
  completeStepAtomic(
    input: FencedMissionMutation & {
      readonly stepKey: string;
      readonly executionKey: string;
      readonly result: StepResultMarker;
      readonly checkpoint: CheckpointReceipt;
    },
  ): Promise<MissionProgress>;
  failStep(
    input: FencedMissionMutation & {
      readonly stepKey: string;
      readonly executionKey: string;
      readonly failure: MissionStepFailure;
    },
  ): Promise<MissionProgress>;
  blockStep(
    input: FencedMissionMutation & {
      readonly stepKey: string;
      readonly executionKey: string;
      readonly failure: MissionStepFailure & { readonly kind: 'HUMAN_GATE' };
    },
  ): Promise<MissionProgress>;
  yieldMission(
    input: FencedMissionMutation & { readonly reason: 'STEP_LIMIT_REACHED' },
  ): Promise<MissionProgress>;
}

export interface MissionWorktree {
  readonly path: string;
  readonly baseCommitSha: string;
}

export interface MissionWorktreePort {
  ensure(input: {
    readonly missionId: string;
    readonly repositoryKey: string;
    readonly baseCommitSha: string;
  }): Promise<MissionWorktree>;
}

export interface MissionStepExecutionInput {
  readonly missionId: string;
  readonly missionSpecDigest: string;
  readonly repositoryKey: string;
  readonly baseCommitSha: string;
  readonly worktreePath: string;
  readonly step: RunnableMissionStep;
  readonly executionKey: string;
  readonly signal: AbortSignal;
}

export interface MissionStepExecutionOutput {
  readonly outcome: 'COMPLETED';
  readonly summary: string;
  readonly changedFiles: readonly string[];
  readonly patchDigest: string;
  readonly artifacts: readonly StepArtifactReference[];
  readonly validations: readonly StepValidationResult[];
  readonly completedAt: string;
}

export interface MissionStepExecutorPort {
  execute(input: MissionStepExecutionInput): Promise<MissionStepExecutionOutput>;
}

export interface MissionCoordinatorOptions {
  readonly state: MissionStatePort;
  readonly checkpoints: AtomicCheckpointStore;
  readonly worktrees: MissionWorktreePort;
  readonly executor: MissionStepExecutorPort;
  readonly maximumStepsPerRun?: number;
  readonly now?: () => Date;
  readonly classifyFailure?: (error: unknown) => MissionStepFailure;
}

export interface MissionRunResult extends MissionProgress {
  readonly executedStepCount: number;
  readonly recoveredStepCount: number;
}

export class MissionStateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissionStateConflictError';
  }
}

function defaultFailure(error: unknown): MissionStepFailure {
  const message = error instanceof Error ? error.message.slice(0, 2_000) : 'Unknown step failure';
  return {
    code: 'MISSION_STEP_EXECUTION_FAILED',
    message,
    kind: 'TRANSIENT',
    retryable: true,
  };
}

function assertActive(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw signal.reason instanceof Error ? signal.reason : new Error('mission execution was aborted');
}

function validateClaim(claim: ClaimedMission): void {
  assertSafeIdentifier(claim.missionId, 'mission id');
  assertSafeIdentifier(claim.repositoryKey, 'repository key');
  assertFullCommitSha(claim.baseCommitSha);
  if (!/^[a-f0-9]{64}$/u.test(claim.missionSpecDigest)) {
    throw new Error('mission specification digest is invalid');
  }
  if (!Number.isSafeInteger(claim.stateVersion) || claim.stateVersion < 0) {
    throw new Error('mission state version is invalid');
  }
  if (!Number.isSafeInteger(claim.fencingToken) || claim.fencingToken < 1) {
    throw new Error('mission fencing token is invalid');
  }
  if (claim.leaseToken.length < 1 || claim.leaseToken.includes('\0')) {
    throw new Error('mission lease token is invalid');
  }
}

function validateStep(step: RunnableMissionStep): void {
  assertSafeIdentifier(step.stepKey, 'step key');
  if (!Number.isSafeInteger(step.stepOrder) || step.stepOrder < 0 || step.stepOrder > 100_000) {
    throw new Error('mission step order is invalid');
  }
  if (!Number.isSafeInteger(step.attempt) || step.attempt < 1 || step.attempt > 1_000_000) {
    throw new Error('mission step attempt is invalid');
  }
  if (step.objective.trim().length === 0 || step.objective.length > 32_000) {
    throw new Error('mission step objective is invalid');
  }
  if (step.acceptanceCriteria.length < 1 || step.acceptanceCriteria.length > 128) {
    throw new Error('mission step acceptance criteria are invalid');
  }
  if (step.verificationProfiles.length > 32 || new Set(step.verificationProfiles).size !== step.verificationProfiles.length) {
    throw new Error('mission step verification profiles are invalid');
  }
}

export class MissionCoordinator {
  readonly #state: MissionStatePort;
  readonly #checkpoints: AtomicCheckpointStore;
  readonly #worktrees: MissionWorktreePort;
  readonly #executor: MissionStepExecutorPort;
  readonly #maximumStepsPerRun: number;
  readonly #now: () => Date;
  readonly #classifyFailure: (error: unknown) => MissionStepFailure;

  constructor(options: MissionCoordinatorOptions) {
    const maximumStepsPerRun = options.maximumStepsPerRun ?? 64;
    if (!Number.isSafeInteger(maximumStepsPerRun) || maximumStepsPerRun < 1 || maximumStepsPerRun > 1_000) {
      throw new Error('maximum steps per run must be between 1 and 1000');
    }
    this.#state = options.state;
    this.#checkpoints = options.checkpoints;
    this.#worktrees = options.worktrees;
    this.#executor = options.executor;
    this.#maximumStepsPerRun = maximumStepsPerRun;
    this.#now = options.now ?? (() => new Date());
    this.#classifyFailure = options.classifyFailure ?? defaultFailure;
  }

  async run(claim: ClaimedMission, signal: AbortSignal): Promise<MissionRunResult> {
    validateClaim(claim);
    assertActive(signal);
    const worktree = await this.#worktrees.ensure({
      missionId: claim.missionId,
      repositoryKey: claim.repositoryKey,
      baseCommitSha: claim.baseCommitSha,
    });
    if (worktree.baseCommitSha !== claim.baseCommitSha) {
      throw new Error('persistent worktree base SHA does not match the mission claim');
    }

    let progress: MissionProgress = claim;
    let executedStepCount = 0;
    let recoveredStepCount = 0;

    while (progress.status === 'RUNNING' && progress.currentStep !== null) {
      assertActive(signal);
      if (executedStepCount + recoveredStepCount >= this.#maximumStepsPerRun) {
        progress = await this.#state.yieldMission({
          missionId: claim.missionId,
          leaseToken: claim.leaseToken,
          fencingToken: claim.fencingToken,
          expectedStateVersion: progress.stateVersion,
          reason: 'STEP_LIMIT_REACHED',
        });
        break;
      }

      const step = progress.currentStep;
      validateStep(step);
      const executionKey = createStepExecutionKey({
        missionId: claim.missionId,
        missionSpecDigest: claim.missionSpecDigest,
        stepKey: step.stepKey,
        stepOrder: step.stepOrder,
      });
      const durableResult = await this.#checkpoints.readResultRecord(
        claim.missionId,
        step.stepKey,
        executionKey,
      );

      if (durableResult !== null) {
        progress = await this.#state.completeStepAtomic({
          missionId: claim.missionId,
          stepKey: step.stepKey,
          leaseToken: claim.leaseToken,
          fencingToken: claim.fencingToken,
          expectedStateVersion: progress.stateVersion,
          executionKey,
          result: durableResult.marker,
          checkpoint: durableResult.receipt,
        });
        recoveredStepCount += 1;
        continue;
      }

      const transition = await this.#state.beginStep({
        missionId: claim.missionId,
        stepKey: step.stepKey,
        leaseToken: claim.leaseToken,
        fencingToken: claim.fencingToken,
        expectedStateVersion: progress.stateVersion,
        executionKey,
      });
      validateStep(transition.step);
      if (
        transition.step.stepKey !== step.stepKey ||
        transition.step.stepOrder !== step.stepOrder
      ) {
        throw new MissionStateConflictError('beginStep returned a different current step');
      }

      const startedAt = this.#now().toISOString();
      await this.#checkpoints.writeStarted({
        schemaVersion: '1.0',
        kind: 'STEP_STARTED',
        missionId: claim.missionId,
        stepKey: step.stepKey,
        stepOrder: step.stepOrder,
        executionKey,
        attempt: transition.step.attempt,
        stateVersionStarted: transition.stateVersion,
        baseCommitSha: claim.baseCommitSha,
        worktreePath: worktree.path,
        startedAt,
      });

      let output: MissionStepExecutionOutput;
      try {
        output = await this.#executor.execute({
          missionId: claim.missionId,
          missionSpecDigest: claim.missionSpecDigest,
          repositoryKey: claim.repositoryKey,
          baseCommitSha: claim.baseCommitSha,
          worktreePath: worktree.path,
          step: transition.step,
          executionKey,
          signal,
        });
        assertActive(signal);
      } catch (error) {
        if (signal.aborted) assertActive(signal);
        const classified = this.#classifyFailure(error);
        const mutation = {
          missionId: claim.missionId,
          stepKey: step.stepKey,
          leaseToken: claim.leaseToken,
          fencingToken: claim.fencingToken,
          expectedStateVersion: transition.stateVersion,
          executionKey,
        } as const;
        progress =
          classified.kind === 'HUMAN_GATE'
            ? await this.#state.blockStep({ ...mutation, failure: classified })
            : await this.#state.failStep({ ...mutation, failure: classified });
        return { ...progress, executedStepCount, recoveredStepCount };
      }

      if (output.outcome !== 'COMPLETED') {
        throw new Error('executor returned a non-completed outcome instead of a typed failure');
      }

      const marker: StepResultMarker = {
        schemaVersion: '1.0',
        kind: 'STEP_RESULT',
        missionId: claim.missionId,
        stepKey: step.stepKey,
        stepOrder: step.stepOrder,
        executionKey,
        attempt: transition.step.attempt,
        baseCommitSha: claim.baseCommitSha,
        worktreePath: worktree.path,
        outcome: output.outcome,
        summary: output.summary,
        changedFiles: [...output.changedFiles],
        patchDigest: output.patchDigest,
        artifacts: [...output.artifacts],
        validations: [...output.validations],
        completedAt: output.completedAt,
      };
      const checkpoint = await this.#checkpoints.writeResult(marker);
      executedStepCount += 1;
      progress = await this.#state.completeStepAtomic({
        missionId: claim.missionId,
        stepKey: step.stepKey,
        leaseToken: claim.leaseToken,
        fencingToken: claim.fencingToken,
        expectedStateVersion: transition.stateVersion,
        executionKey,
        result: marker,
        checkpoint,
      });
    }

    return { ...progress, executedStepCount, recoveredStepCount };
  }
}
