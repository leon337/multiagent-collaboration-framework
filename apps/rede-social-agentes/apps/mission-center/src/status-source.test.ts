import { describe, expect, it } from 'vitest';

import { MissionStatusSource, type StatusFetchResponse } from './status-source.js';

const snapshot = {
  schemaVersion: 1,
  missionId: 'MCF-GAMA-FUND-2026-001',
  title: 'Gama Fund',
  state: 'IN_PROGRESS',
  deadline: '2026-09-28',
  humanAuthority: 'LEANDRO',
  orchestrator: 'MESTRE',
  currentStage: { id: 'G3', label: 'Gemini', status: 'IN_PROGRESS' },
  stages: [{ id: 'G3', label: 'Gemini', status: 'IN_PROGRESS', evidence: [] }],
  lastAction: {
    at: '2026-09-12T18:00:00Z',
    executor: 'MESTRE',
    summary: 'Working',
    evidence: [{ type: 'commit', value: 'abc' }],
  },
  blockers: [],
  nextStep: 'Continue',
  humanGates: { g3: 'AUTHORIZED' },
  updatedAt: '2026-09-12T18:00:00Z',
};

function response(body: unknown, ok = true, status = 200): StatusFetchResponse {
  return {
    ok,
    status,
    async json() {
      return body;
    },
  };
}

describe('MissionStatusSource', () => {
  it('fetches and validates a fresh mission snapshot', async () => {
    let calls = 0;
    const source = new MissionStatusSource({
      url: 'https://example.test/status.json',
      fetcher: async () => {
        calls += 1;
        return response(snapshot);
      },
      now: () => 1000,
      ttlMs: 10000,
    });

    const result = await source.getStatus();
    expect(result.stale).toBe(false);
    expect(result.snapshot.missionId).toBe(snapshot.missionId);
    expect(calls).toBe(1);
  });

  it('uses the fresh cache within TTL without another upstream call', async () => {
    let calls = 0;
    let now = 1000;
    const source = new MissionStatusSource({
      url: 'https://example.test/status.json',
      fetcher: async () => {
        calls += 1;
        return response(snapshot);
      },
      now: () => now,
      ttlMs: 10000,
    });

    await source.getStatus();
    now = 5000;
    const second = await source.getStatus();
    expect(second.stale).toBe(false);
    expect(calls).toBe(1);
  });

  it('returns stale last-known-good data when an expired refresh fails', async () => {
    let now = 1000;
    let calls = 0;
    const source = new MissionStatusSource({
      url: 'https://example.test/status.json',
      fetcher: async () => {
        calls += 1;
        if (calls === 1) return response(snapshot);
        throw new Error('upstream down');
      },
      now: () => now,
      ttlMs: 100,
    });

    await source.getStatus();
    now = 5000;
    const fallback = await source.getStatus();
    expect(fallback.stale).toBe(true);
    expect(fallback.snapshot.missionId).toBe(snapshot.missionId);
  });

  it('fails closed on an invalid first upstream snapshot', async () => {
    const source = new MissionStatusSource({
      url: 'https://example.test/status.json',
      fetcher: async () => response({ nope: true }),
      now: () => 1000,
    });

    await expect(source.getStatus()).rejects.toThrow(/no valid cached snapshot/u);
  });
});
