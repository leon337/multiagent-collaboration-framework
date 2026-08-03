import type {
  AnonymizeAccountResponse,
  PrivacyAnonymizationBlocker,
  PrivacyExportResponse,
} from '@rsa/contracts/privacy';

export const PRIVACY_REPOSITORY = Symbol('PRIVACY_REPOSITORY');

export interface PrivacyCredentialRecord {
  accountId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ANONYMIZED';
  passwordHash: string;
}

export type PrivacyAnonymizationResult =
  | {
      status: 'COMPLETED';
      response: AnonymizeAccountResponse;
    }
  | {
      status: 'BLOCKED';
      blockers: PrivacyAnonymizationBlocker[];
    };

export interface PrivacyRepository {
  findCredential(accountId: string): Promise<PrivacyCredentialRecord | null>;
  exportAccountData(accountId: string, correlationId: string): Promise<PrivacyExportResponse>;
  anonymizeAccount(accountId: string, correlationId: string): Promise<PrivacyAnonymizationResult>;
}
