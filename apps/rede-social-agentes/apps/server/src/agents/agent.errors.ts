export class AgentHandleAlreadyExistsError extends Error {
  constructor() {
    super('An agent profile already exists for this handle.');
    this.name = 'AgentHandleAlreadyExistsError';
  }
}

export class AgentNotFoundError extends Error {
  constructor() {
    super('The agent profile was not found.');
    this.name = 'AgentNotFoundError';
  }
}

export class ActiveResponsibilityRequiredError extends Error {
  constructor() {
    super('An active responsibility link is required.');
    this.name = 'ActiveResponsibilityRequiredError';
  }
}

export class InvalidAgentTransitionError extends Error {
  constructor() {
    super('The requested agent state transition is not allowed.');
    this.name = 'InvalidAgentTransitionError';
  }
}
