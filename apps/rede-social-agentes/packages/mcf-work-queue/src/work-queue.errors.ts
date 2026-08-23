export class McfWorkQueueError extends Error {}

export class McfWorkSpecError extends McfWorkQueueError {
  constructor(message: string) {
    super(message);
    this.name = 'McfWorkSpecError';
  }
}

export class McfWorkDispatchConflictError extends McfWorkQueueError {
  constructor(dispatchId: string) {
    super(`dispatch ${dispatchId} is already bound to a different work specification`);
    this.name = 'McfWorkDispatchConflictError';
  }
}

export class McfWorkJobNotFoundError extends McfWorkQueueError {
  constructor(jobId: string) {
    super(`work job ${jobId} was not found`);
    this.name = 'McfWorkJobNotFoundError';
  }
}

export class McfWorkStateConflictError extends McfWorkQueueError {
  constructor(jobId: string, message: string) {
    super(`work job ${jobId} state conflict: ${message}`);
    this.name = 'McfWorkStateConflictError';
  }
}

export class McfWorkLeaseLostError extends McfWorkQueueError {
  constructor(jobId: string) {
    super(`work job ${jobId} lease is no longer owned by this worker`);
    this.name = 'McfWorkLeaseLostError';
  }
}

export class McfWorkGateConflictError extends McfWorkQueueError {
  constructor(jobId: string, message: string) {
    super(`work job ${jobId} gate conflict: ${message}`);
    this.name = 'McfWorkGateConflictError';
  }
}

export class McfContinuityMissionNotFoundError extends McfWorkQueueError {
  constructor(missionId: string) {
    super(`continuity mission ${missionId} was not found`);
    this.name = 'McfContinuityMissionNotFoundError';
  }
}

export class McfContinuityMissionConflictError extends McfWorkQueueError {
  constructor(missionId: string, message: string) {
    super(`continuity mission ${missionId} conflict: ${message}`);
    this.name = 'McfContinuityMissionConflictError';
  }
}

export class McfContinuityMissionLeaseLostError extends McfWorkQueueError {
  constructor(missionId: string) {
    super(`continuity mission ${missionId} lease or fencing token is no longer valid`);
    this.name = 'McfContinuityMissionLeaseLostError';
  }
}
