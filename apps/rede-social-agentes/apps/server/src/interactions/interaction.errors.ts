import type { PermissionDecisionReason } from '@rsa/contracts';

export class InteractionResourceNotAvailableError extends Error {
  constructor() {
    super('Interaction resource is not available.');
  }
}

export class InteractionStateConflictError extends Error {
  constructor() {
    super('Interaction state does not allow this operation.');
  }
}

export class InteractionPermissionDeniedError extends Error {
  constructor(readonly reason: PermissionDecisionReason) {
    super(`Interaction permission denied: ${reason}.`);
  }
}

export class InvalidCommentCursorError extends Error {
  constructor() {
    super('Invalid comment cursor.');
  }
}
