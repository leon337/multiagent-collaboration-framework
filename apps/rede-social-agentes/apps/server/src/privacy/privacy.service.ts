import { Inject, Injectable } from '@nestjs/common';
import type { AnonymizeAccountResponse, PrivacyExportResponse } from '@rsa/contracts/privacy';

import { PasswordService } from '../identity/password.service.js';
import {
  InvalidPrivacyCredentialsError,
  PrivacyAccountUnavailableError,
  PrivacyAnonymizationBlockedError,
} from './privacy.errors.js';
import { PRIVACY_REPOSITORY, type PrivacyRepository } from './privacy.repository.js';

@Injectable()
export class PrivacyService {
  constructor(
    @Inject(PRIVACY_REPOSITORY) private readonly repository: PrivacyRepository,
    @Inject(PasswordService) private readonly passwords: PasswordService,
  ) {}

  async exportAccountData(
    accountId: string,
    correlationId: string,
  ): Promise<PrivacyExportResponse> {
    const credential = await this.repository.findCredential(accountId);
    if (!credential || credential.status !== 'ACTIVE') {
      throw new PrivacyAccountUnavailableError();
    }
    return this.repository.exportAccountData(accountId, correlationId);
  }

  async anonymizeAccount(
    accountId: string,
    password: string,
    correlationId: string,
  ): Promise<AnonymizeAccountResponse> {
    const credential = await this.repository.findCredential(accountId);
    if (!credential || credential.status !== 'ACTIVE') {
      await this.passwords.consumeVerificationCost(password);
      throw new PrivacyAccountUnavailableError();
    }

    const passwordIsValid = await this.passwords.verify(password, credential.passwordHash);
    if (!passwordIsValid) {
      throw new InvalidPrivacyCredentialsError();
    }

    const result = await this.repository.anonymizeAccount(accountId, correlationId);
    if (result.status === 'BLOCKED') {
      throw new PrivacyAnonymizationBlockedError(result.blockers);
    }
    return result.response;
  }
}
