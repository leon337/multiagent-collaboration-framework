import { describe, expect, it } from 'vitest';

import { PasswordService } from '../identity/password.service.js';
import { InvalidPrivacyCredentialsError } from './privacy.errors.js';
import type {
  PrivacyAnonymizationResult,
  PrivacyCredentialRecord,
  PrivacyRepository,
} from './privacy.repository.js';
import { PrivacyService } from './privacy.service.js';

class MemoryPrivacyRepository implements PrivacyRepository {
  credential: PrivacyCredentialRecord | null = null;
  anonymizationResult: PrivacyAnonymizationResult = {
    status: 'COMPLETED',
    response: {
      accountId: 'account-1',
      status: 'ANONYMIZED',
      anonymizedAt: '2026-08-03T07:20:00.000Z',
      sessionsRevoked: 1,
      membershipsEnded: 0,
    },
  };

  async findCredential(): Promise<PrivacyCredentialRecord | null> {
    return this.credential;
  }

  async exportAccountData() {
    return {
      accountId: 'account-1',
      generatedAt: '2026-08-03T07:19:00.000Z',
      sections: [{ name: 'account' as const, records: [{ id: 'account-1' }] }],
    };
  }

  async anonymizeAccount(): Promise<PrivacyAnonymizationResult> {
    return this.anonymizationResult;
  }
}

describe('PrivacyService', () => {
  it('requires the current password before anonymization', async () => {
    const passwords = new PasswordService();
    const repository = new MemoryPrivacyRepository();
    repository.credential = {
      accountId: 'account-1',
      status: 'ACTIVE',
      passwordHash: await passwords.hash('correct-password'),
    };
    const service = new PrivacyService(repository, passwords);

    await expect(
      service.anonymizeAccount('account-1', 'wrong-password', 'privacy-correlation'),
    ).rejects.toBeInstanceOf(InvalidPrivacyCredentialsError);
  });

  it('surfaces stable operational blockers', async () => {
    const passwords = new PasswordService();
    const repository = new MemoryPrivacyRepository();
    repository.credential = {
      accountId: 'account-1',
      status: 'ACTIVE',
      passwordHash: await passwords.hash('correct-password'),
    };
    repository.anonymizationResult = {
      status: 'BLOCKED',
      blockers: ['ACTIVE_AGENT_RESPONSIBILITY'],
    };
    const service = new PrivacyService(repository, passwords);

    await expect(
      service.anonymizeAccount('account-1', 'correct-password', 'privacy-correlation'),
    ).rejects.toMatchObject({
      blockers: ['ACTIVE_AGENT_RESPONSIBILITY'],
    });
  });

  it('exports data only for an active account', async () => {
    const passwords = new PasswordService();
    const repository = new MemoryPrivacyRepository();
    repository.credential = {
      accountId: 'account-1',
      status: 'ACTIVE',
      passwordHash: await passwords.hash('correct-password'),
    };
    const service = new PrivacyService(repository, passwords);

    await expect(
      service.exportAccountData('account-1', 'export-correlation'),
    ).resolves.toMatchObject({
      accountId: 'account-1',
      sections: [{ name: 'account' }],
    });
  });
});
