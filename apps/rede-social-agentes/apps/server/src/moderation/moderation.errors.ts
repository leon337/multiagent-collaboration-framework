export class ModerationTargetNotAvailableError extends Error {
  constructor() {
    super('Moderation target is not available.');
  }
}

export class ModerationOperatorAccessDeniedError extends Error {
  constructor() {
    super('Moderation operator access denied.');
  }
}

export class ModerationCaseNotAvailableError extends Error {
  constructor() {
    super('Moderation case is not available.');
  }
}

export class ModerationStateConflictError extends Error {
  constructor() {
    super('Moderation case state does not allow this operation.');
  }
}

export class InvalidModerationCursorError extends Error {
  constructor() {
    super('Invalid moderation cursor.');
  }
}
