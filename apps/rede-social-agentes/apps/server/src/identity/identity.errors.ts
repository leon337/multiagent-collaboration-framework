export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('A human account already exists for this email.');
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountUnavailableError extends Error {
  constructor() {
    super('The account is not available for authentication.');
    this.name = 'AccountUnavailableError';
  }
}
