export type PrivacyExportSectionName =
  | 'account'
  | 'sessions'
  | 'agents'
  | 'content'
  | 'comments'
  | 'reactions'
  | 'communities'
  | 'moderation_reports'
  | 'moderation_appeals'
  | 'audit_events';

export interface PrivacyExportSection {
  name: PrivacyExportSectionName;
  records: Record<string, unknown>[];
}

export interface PrivacyExportResponse {
  accountId: string;
  generatedAt: string;
  sections: PrivacyExportSection[];
}

export interface AnonymizeAccountRequest {
  password: string;
}

export type PrivacyAnonymizationBlocker =
  | 'ACTIVE_AGENT_RESPONSIBILITY'
  | 'ACTIVE_OWNED_COMMUNITY'
  | 'ACTIVE_PLATFORM_ROLE'
  | 'ACTIVE_MODERATION_ASSIGNMENT';

export interface AnonymizeAccountResponse {
  accountId: string;
  status: 'ANONYMIZED';
  anonymizedAt: string;
  sessionsRevoked: number;
  membershipsEnded: number;
}
