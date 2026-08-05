import type { McfChatDispatchResponse } from '@rsa/contracts';

export const CHAT_DISPATCH_REPOSITORY = Symbol('CHAT_DISPATCH_REPOSITORY');

export interface ChatDispatchReservation {
  accountId: string;
  dispatchId: string;
  requestDigest: string;
  state: 'IN_PROGRESS' | 'COMPLETED';
  missionId: string | null;
  response: McfChatDispatchResponse | null;
}

export type ReserveChatDispatchResult =
  | { status: 'RESERVED'; reservation: ChatDispatchReservation }
  | { status: 'EXISTING'; reservation: ChatDispatchReservation };

export interface ChatDispatchRepository {
  reserve(
    accountId: string,
    dispatchId: string,
    requestDigest: string,
  ): Promise<ReserveChatDispatchResult>;
  complete(
    accountId: string,
    dispatchId: string,
    requestDigest: string,
    response: McfChatDispatchResponse,
  ): Promise<void>;
  release(accountId: string, dispatchId: string, requestDigest: string): Promise<void>;
}
