import type { PrivacyAnonymizationBlocker } from '@rsa/contracts/privacy';

export class InvalidPrivacyCredentialsError extends Error {}

export class PrivacyAccountUnavailableError extends Error {}

export class PrivacyAnonymizationBlockedError extends Error {
  constructor(readonly blockers: PrivacyAnonymizationBlocker[]) {
    super('Account anonymization is blocked by active operational dependencies.');
  }
}
