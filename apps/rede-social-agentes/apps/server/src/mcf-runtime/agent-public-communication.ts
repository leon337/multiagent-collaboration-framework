/**
 * MCF-AGENT-PUBLIC-COMMUNICATION/v1
 *
 * Pure draft composer: not a transport adapter and not an authorization grant.
 * The caller supplies the canonical AgentRoleContract (not a second role registry).
 * Email delivery evidence must be checked against the provider BEFORE this call.
 */
import type { AgentRoleContract } from './agent-execution.contracts.js';

export const MCF_AGENT_PUBLIC_COMMUNICATION = 'MCF-AGENT-PUBLIC-COMMUNICATION/v1' as const;

export type McfExternalChannel = 'email' | 'whatsapp';

export interface McfVerifiedEmailReference {
  /** Provider message ID (not a draft ID), independently verified upstream. */
  readonly messageId: string;
  readonly from: string;
  readonly to: string;
  readonly subject: string;
}

export interface McfAgentPublicMessageRequest {
  readonly agent: AgentRoleContract;
  readonly humanPrincipal: string;
  readonly recipientName: string;
  readonly channel: McfExternalChannel;
  readonly purpose: string;
  readonly details?: string;
  readonly sentEmail?: McfVerifiedEmailReference;
  /** Injected for deterministic tests; timezone is always America/Recife. */
  readonly now: Date;
}

export interface McfAgentPublicMessageDraft {
  readonly policy: typeof MCF_AGENT_PUBLIC_COMMUNICATION;
  readonly status: 'DRAFT_ONLY';
  readonly channel: McfExternalChannel;
  readonly externalSendAuthorized: false;
  readonly senderLabel: string;
  readonly text: string;
  readonly referencedEmailMessageId: string | null;
}

function required(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001f\u007f]/u.test(trimmed)) {
    throw new Error(field + ' must be non-empty, single-line printable text');
  }
  return trimmed;
}

function safeAddress(address: string, field: string): string {
  const value = required(address, field);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(value)) {
    throw new Error(field + ' must be a valid email address');
  }
  return value;
}

export function publicAgentLabel(agent: AgentRoleContract, humanPrincipal: string): string {
  const id = required(agent.agentId, 'agent.agentId');
  const role = required(agent.role, 'agent.role');
  const principal = required(humanPrincipal, 'humanPrincipal');
  // Public name is not an authority, permission, corporate office or legal signature.
  const title = id.toUpperCase() === 'MESTRE'
    ? 'Agente Digital de Operações'
    : 'Agente Digital — ' + role;
  return id.toUpperCase() + ', ' + title + ' do ' + principal;
}

export function recifeGreeting(now: Date): string {
  if (Number.isNaN(now.getTime())) throw new Error('now must be a valid Date');
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Recife',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(now));
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

/**
 * Composes text only. Caller must validate identity, recipient, authority, evidence,
 * minimization, consent and idempotency before ANY external send.
 */
export function composeMcfAgentPublicMessage(
  request: McfAgentPublicMessageRequest,
): McfAgentPublicMessageDraft {
  const recipient = required(request.recipientName, 'recipientName');
  const purpose = required(request.purpose, 'purpose');
  const principal = required(request.humanPrincipal, 'humanPrincipal');
  const label = publicAgentLabel(request.agent, principal);
  const details = request.details ? '\n' + required(request.details, 'details') : '';
  if (request.sentEmail && request.channel !== 'whatsapp') {
    throw new Error('sentEmail reference is only supported for a follow-up WhatsApp draft');
  }

  let emailNotice = '';
  if (request.sentEmail) {
    const evidence = request.sentEmail;
    required(evidence.messageId, 'sentEmail.messageId');
    const from = safeAddress(evidence.from, 'sentEmail.from');
    const to = safeAddress(evidence.to, 'sentEmail.to');
    const subject = required(evidence.subject, 'sentEmail.subject');
    emailNotice = '\nO e-mail "' + subject + '" foi enviado de ' + from + ' para ' + to + '.';
  }

  const signature = request.agent.agentId.toUpperCase() === 'MESTRE'
    ? 'MESTRE — Agente Digital de Operações'
    : request.agent.agentId.toUpperCase() + ' — Agente Digital';
  const message = recifeGreeting(request.now) + ', ' + recipient + '!\n\n' +
    'Sou ' + label + '. Atuo como agente digital, sob a responsabilidade humana de ' +
    principal + '.\n\n' +
    'A pedido dele, entro em contato sobre: ' + purpose + '.' + details + emailNotice +
    '\n\nPor gentileza, confirme o recebimento quando possível.\n\n' + signature;

  return {
    policy: MCF_AGENT_PUBLIC_COMMUNICATION,
    status: 'DRAFT_ONLY',
    channel: request.channel,
    externalSendAuthorized: false,
    senderLabel: label,
    text: message,
    referencedEmailMessageId: request.sentEmail?.messageId ?? null,
  };
}
