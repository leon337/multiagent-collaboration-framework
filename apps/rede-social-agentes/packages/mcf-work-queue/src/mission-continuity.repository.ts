import type {
  McfActiveMissionFilter,
  McfBegunMissionStep,
  McfBeginMissionStepInput,
  McfBindMissionWorktreeInput,
  McfCompletedMissionStep,
  McfCompleteMissionStepInput,
  McfContinuityMissionClaim,
  McfContinuityMissionResponse,
  McfContinuityMissionSpec,
  McfContinueMissionInput,
  McfFailMissionStepInput,
  McfMissionArtifactResponse,
  McfMissionCheckpointResponse,
  McfMissionEventQuery,
  McfMissionHeartbeatInput,
  McfMissionRecoverySummary,
  McfMissionWorkEventResponse,
} from '@rsa/contracts';

export interface McfMissionContinuityRepository {
  createMission(spec: McfContinuityMissionSpec, now?: Date): Promise<McfContinuityMissionResponse>;
  getMission(missionId: string): Promise<McfContinuityMissionResponse | null>;
  discoverActive(filter?: McfActiveMissionFilter): Promise<McfContinuityMissionResponse[]>;
  listEvents(missionId: string, query?: McfMissionEventQuery): Promise<McfMissionWorkEventResponse[]>;
  listCheckpoints(missionId: string): Promise<McfMissionCheckpointResponse[]>;
  listArtifacts(missionId: string): Promise<McfMissionArtifactResponse[]>;
  claimRunnableMission(
    workerId: string,
    leaseDurationMs: number,
    now?: Date,
  ): Promise<McfContinuityMissionClaim | null>;
  heartbeatMission(
    input: McfMissionHeartbeatInput,
    now?: Date,
  ): Promise<McfContinuityMissionResponse>;
  bindWorktree(
    input: McfBindMissionWorktreeInput,
    now?: Date,
  ): Promise<McfContinuityMissionResponse>;
  beginStep(input: McfBeginMissionStepInput, now?: Date): Promise<McfBegunMissionStep>;
  completeStepAtomic(
    input: McfCompleteMissionStepInput,
    now?: Date,
  ): Promise<McfCompletedMissionStep>;
  recordStepFailure(
    input: McfFailMissionStepInput,
    now?: Date,
  ): Promise<McfContinuityMissionResponse>;
  continueMission(
    input: McfContinueMissionInput,
    now?: Date,
  ): Promise<McfContinuityMissionResponse>;
  recoverExpiredMissionLeases(now?: Date): Promise<McfMissionRecoverySummary>;
}
