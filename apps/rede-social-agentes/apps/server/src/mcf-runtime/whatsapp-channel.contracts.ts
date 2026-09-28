export interface WhatsAppInboundEnvelope {
  messageId: string;
  phoneNumberId: string;
  senderWaId: string;
  messageType: string;
  textBody: string | null;
  providerTimestamp: Date | null;
  metadata: Record<string, unknown>;
}

export type WhatsAppInboxState = 'RECEIVED' | 'CLAIMED' | 'PROCESSED';

export interface WhatsAppInboxMessage extends WhatsAppInboundEnvelope {
  senderHash: string;
  state: WhatsAppInboxState;
  claimOwner: string | null;
  claimedAt: Date | null;
  processedAt: Date | null;
  receivedAt: Date;
  updatedAt: Date;
}
