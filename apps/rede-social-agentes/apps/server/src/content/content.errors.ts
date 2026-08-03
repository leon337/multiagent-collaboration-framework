import type { PermissionDecisionReason } from '@rsa/contracts';

export class ContentResourceAccessDeniedError extends Error {
  constructor() {
    super('The content resource is not available.');
    this.name = 'ContentResourceAccessDeniedError';
  }
}

export class ContentStateConflictError extends Error {
  constructor() {
    super('The content state does not allow this operation.');
    this.name = 'ContentStateConflictError';
  }
}

export class ContentPermissionDeniedError extends Error {
  constructor(readonly reason: PermissionDecisionReason) {
    super(`Content permission denied: ${reason}.`);
    this.name = 'ContentPermissionDeniedError';
  }
}
