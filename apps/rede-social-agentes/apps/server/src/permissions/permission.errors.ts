export class PermissionGrantAlreadyExistsError extends Error {
  constructor() {
    super('An active permission grant already exists for this scope.');
    this.name = 'PermissionGrantAlreadyExistsError';
  }
}

export class PermissionResourceAccessDeniedError extends Error {
  constructor() {
    super('The permission resource is unavailable to this account.');
    this.name = 'PermissionResourceAccessDeniedError';
  }
}
