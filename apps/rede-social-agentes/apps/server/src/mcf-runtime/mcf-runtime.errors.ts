export class McfMissionNotFoundError extends Error {
  constructor(missionId: string) {
    super(`MCF mission not found: ${missionId}`);
    this.name = 'McfMissionNotFoundError';
  }
}

export class McfPhaseNotFoundError extends Error {
  constructor(missionId: string, phaseId: string) {
    super(`MCF phase not found: ${missionId}/${phaseId}`);
    this.name = 'McfPhaseNotFoundError';
  }
}

export class McfMissionVersionConflictError extends Error {
  constructor(missionId: string, expectedVersion: number) {
    super(`MCF mission version conflict: ${missionId} expected ${expectedVersion}`);
    this.name = 'McfMissionVersionConflictError';
  }
}

export class McfSkillNotFoundError extends Error {
  constructor(skillId: string) {
    super(`MCF skill not found: ${skillId}`);
    this.name = 'McfSkillNotFoundError';
  }
}

export class McfSkillNotExecutableError extends Error {
  constructor(skillId: string) {
    super(`MCF skill is registered but not executable in the MVP runtime: ${skillId}`);
    this.name = 'McfSkillNotExecutableError';
  }
}

export class McfSkillInputError extends Error {
  constructor(skillId: string, missingInputs: string[]) {
    super(`MCF skill ${skillId} is missing required inputs: ${missingInputs.join(', ')}`);
    this.name = 'McfSkillInputError';
  }
}

export class McfPermissionDeniedError extends Error {
  constructor(reason: string) {
    super(`MCF permission denied: ${reason}`);
    this.name = 'McfPermissionDeniedError';
  }
}

export class McfEvidenceRejectedError extends Error {
  constructor(reason: string) {
    super(`MCF evidence rejected: ${reason}`);
    this.name = 'McfEvidenceRejectedError';
  }
}

export class McfRuntimeAuthenticationError extends Error {
  constructor() {
    super('MCF runtime authentication failed.');
    this.name = 'McfRuntimeAuthenticationError';
  }
}
