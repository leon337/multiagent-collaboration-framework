import { describe, expect, it, vi } from 'vitest';
import { PostgresInitialHumanBootstrapRepository } from './postgres-initial-human-bootstrap.repository.js';

const input = {
  accountId: '11111111-1111-4111-8111-111111111111',
  email: 'authority@example.test',
  displayName: 'Leandro',
  passwordHash: 'scrypt$v1$hash',
  sessionId: '22222222-2222-4222-8222-222222222222',
  tokenHash: 'session-token-hash',
  expiresAt: new Date('2026-09-14T20:00:00.000Z'),
  now: new Date('2026-09-07T20:00:00.000Z'),
  correlationId: 'bootstrap-correlation',
};

describe('PostgresInitialHumanBootstrapRepository', () => {
  it('creates the initial human and session atomically when the database is empty', async () => {
    const client = { query: vi.fn() };
    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ created_at: input.now }] })
      .mockResolvedValue({ rows: [] });
    const database = { transaction: vi.fn(async (work) => work(client)) };
    const repository = new PostgresInitialHumanBootstrapRepository(database as never);

    await expect(repository.createInitialHuman(input)).resolves.toEqual({
      status: 'CREATED',
      createdAt: input.now,
    });
    expect(database.transaction).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0]?.[0]).toMatch(/pg_advisory_xact_lock/iu);
    expect(client.query.mock.calls[1]?.[0]).toMatch(/lock table "accounts"/iu);
    expect(client.query.mock.calls[2]?.[0]).toMatch(/from "accounts"/iu);
  });

  it('fails closed without inserts when any account already exists', async () => {
    const client = { query: vi.fn() };
    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'existing-account' }] });
    const database = { transaction: vi.fn(async (work) => work(client)) };
    const repository = new PostgresInitialHumanBootstrapRepository(database as never);

    await expect(repository.createInitialHuman(input)).resolves.toEqual({
      status: 'ALREADY_INITIALIZED',
    });
    expect(client.query).toHaveBeenCalledTimes(3);
    expect(client.query.mock.calls.some(([sql]) => /insert\s+into/iu.test(String(sql)))).toBe(
      false,
    );
  });
});
