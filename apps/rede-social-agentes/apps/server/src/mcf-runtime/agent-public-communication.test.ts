import { describe, expect, it } from 'vitest';
import type { AgentRoleContract } from './agent-execution.contracts.js';
import {
  MCF_AGENT_PUBLIC_COMMUNICATION,
  composeMcfAgentPublicMessage,
  publicAgentLabel,
  recifeGreeting,
} from './agent-public-communication.js';

const mestre: AgentRoleContract = {
  agentId: 'MESTRE',
  role: 'Ponte oficial e orquestração',
  version: '1',
  capabilities: [],
};

const base = {
  agent: mestre,
  humanPrincipal: 'Leandro',
  recipientName: 'Robson',
  channel: 'whatsapp' as const,
  purpose: 'Romaneio de Embarque nº 002',
  details: '10 itens, totalizando 372 peças',
  now: new Date('2026-11-12T18:53:00Z'),
};

describe('MCF public communication v1', () => {
  it('identifies the agent and its human principal without authorizing transport', () => {
    const draft = composeMcfAgentPublicMessage(base);
    expect(draft.policy).toBe(MCF_AGENT_PUBLIC_COMMUNICATION);
    expect(draft.status).toBe('DRAFT_ONLY');
    expect(draft.externalSendAuthorized).toBe(false);
    expect(draft.text).toContain('Boa tarde, Robson!');
    expect(draft.text).toContain('MESTRE, Agente Digital de Operações do Leandro');
    expect(draft.text).not.toContain('foi enviado');
  });

  it('references a sent email only when a provider receipt is explicitly supplied', () => {
    const draft = composeMcfAgentPublicMessage({
      ...base,
      sentEmail: {
        messageId: '1a1d119534a13a9a',
        from: 'potiguaradm23@gmail.com',
        to: 'potiguarengenharia.pe@gmail.com',
        subject: 'Romaneio de Embarque nº 002',
      },
    });
    expect(draft.referencedEmailMessageId).toBe('1a1d119534a13a9a');
    expect(draft.text).toContain(
      'foi enviado de potiguaradm23@gmail.com para potiguarengenharia.pe@gmail.com',
    );
  });

  it('rejects absent or malformed evidence data', () => {
    const missingId = {
      ...base,
      sentEmail: {
        messageId: '',
        from: 'a@example.com',
        to: 'b@example.com',
        subject: 'Teste',
      },
    };
    const wrongSender = {
      ...base,
      sentEmail: {
        messageId: 'x',
        from: 'not-email',
        to: 'b@example.com',
        subject: 'Teste',
      },
    };
    expect(() => composeMcfAgentPublicMessage(missingId)).toThrow('sentEmail.messageId');
    expect(() => composeMcfAgentPublicMessage(wrongSender)).toThrow('sentEmail.from');
  });

  it('does not reuse an email-send confirmation in the email drafting channel', () => {
    const invalid = {
      ...base,
      channel: 'email' as const,
      sentEmail: {
        messageId: 'x',
        from: 'a@example.com',
        to: 'b@example.com',
        subject: 'Teste',
      },
    };
    expect(() => composeMcfAgentPublicMessage(invalid)).toThrow('only supported');
  });

  it('derives specialists from their canonical role instead of inventing offices', () => {
    const specialist = {
      ...mestre,
      agentId: 'SOFIA',
      role: 'Arquitetura de Software',
    };
    expect(publicAgentLabel(specialist, 'Leandro')).toBe(
      'SOFIA, Agente Digital — Arquitetura de Software do Leandro',
    );
  });

  it('uses Recife local hour for morning, afternoon and evening', () => {
    expect(recifeGreeting(new Date('2026-11-12T11:00:00Z'))).toBe('Bom dia');
    expect(recifeGreeting(new Date('2026-11-12T18:00:00Z'))).toBe('Boa tarde');
    expect(recifeGreeting(new Date('2026-11-13T01:00:00Z'))).toBe('Boa noite');
  });

  it('rejects blank and multiline recipients', () => {
    const blank = { ...base, recipientName: ' ' };
    const multiline = { ...base, recipientName: 'Robson\\nBCC:' };
    expect(() => composeMcfAgentPublicMessage(blank)).toThrow('recipientName');
    expect(() => composeMcfAgentPublicMessage(multiline)).toThrow('recipientName');
  });
});
