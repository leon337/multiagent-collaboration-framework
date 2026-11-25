import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../database.service.js';
import { MissionChatService } from './mission-chat.service.js';

const makeRow = () => ({
  sequence: '11',
  id: 'd8c90c88-684f-4f27-82bf-1011fcba6b62',
  room_id: 'geral',
  actor_kind: 'HUMAN' as const,
  actor_id: 'human-1',
  actor_label: 'Operador',
  kind: 'MESSAGE' as const,
  content: 'Teste de mensagem',
  trust_label: 'AUTHENTICATED_HUMAN' as const,
  request_fingerprint: null,
  created_at: new Date('2026-11-21T10:00:00.000Z'),
});

function setup() {
  const query = vi.fn();
  const service = new MissionChatService({ query } as unknown as DatabaseService);
  return { service, query };
}

describe('MissionChatService MVP', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('denies a different account when human authority is bound', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', 'reserved-human-id');
    const { service } = setup();
    expect(() => service.assertHumanAuthority('different-id')).toThrow();
    expect(() => service.assertHumanAuthority('reserved-human-id')).not.toThrow();
  });

  it('fails closed without a reserved human in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID', '');
    const { service } = setup();
    expect(() => service.assertHumanAuthority('anyone')).toThrow();
  });

  it('rejects reads from unknown mission rooms', async () => {
    const { service, query } = setup();
    query.mockResolvedValue({ rows: [] });
    await expect(service.messages('missing-mission', '0')).rejects.toThrow();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns stored messages, never an invented agent reply', async () => {
    const { service, query } = setup();
    query.mockResolvedValue({ rows: [makeRow()] });
    const messages = await service.messages('geral', '0');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      sequence: '11',
      actorKind: 'HUMAN',
      trustLabel: 'AUTHENTICATED_HUMAN',
    });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('marks runtime messages as reported, not as verified execution', async () => {
    const { service, query } = setup();
    query.mockResolvedValue({
      rows: [
        {
          ...makeRow(),
          actor_kind: 'AGENT_REPORTED',
          actor_id: 'SOFIA',
          trust_label: 'RUNTIME_REPORTED',
        },
      ],
    });
    const result = await service.send(
      'geral',
      { kind: 'AGENT_REPORTED', id: 'SOFIA', label: 'Sofia' },
      'RESULT',
      'Relato sem recibo de execução',
      'c6b911fd-a0ab-4f75-bbca-c0652b88a887',
    );
    expect(result.trustLabel).toBe('RUNTIME_REPORTED');
    const values = query.mock.calls[0]?.[1] as unknown[];
    expect(values[8]).toBe('RUNTIME_REPORTED');
  });

  it('does not replace an already accepted idempotency key', async () => {
    const { service, query } = setup();
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
      rows: [{ ...makeRow(), request_fingerprint: 'different-request' }],
    });
    await expect(
      service.send(
        'geral',
        { kind: 'AGENT_REPORTED', id: 'SOFIA', label: 'Sofia' },
        'RESULT',
        'Novo texto',
        'e13df98d-5165-4f9f-b774-1b8486f95404',
      ),
    ).rejects.toThrow();
  });
});
