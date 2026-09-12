import { describe, expect, it } from 'vitest';

import { handleMissionCenterApi } from './app.js';

const result = {
  snapshot: {
    schemaVersion: 1 as const,
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
  },
  stale: false,
  fetchedAt: '2026-09-12T18:00:01Z',
};

describe('handleMissionCenterApi', () => {
  it('serves sanitized mission status from GET /api/status', async () => {
    const response = await handleMissionCenterApi(
      { async getStatus() { return result; } },
      { method: 'GET', path: '/api/status' },
    );

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    const body = JSON.parse(response.body) as typeof result;
    expect(body.snapshot.missionId).toBe(result.snapshot.missionId);
    expect(JSON.stringify(body)).not.toContain('GEMINI_API_KEY');
  });

  it('returns health and fail-closed status errors without internal details', async () => {
    const failingSource = {
      async getStatus(): Promise<never> {
        throw new Error('secret internals');
      },
    };

    const health = await handleMissionCenterApi(failingSource, {
      method: 'GET',
      path: '/healthz',
    });
    expect(health.status).toBe(200);

    const unavailable = await handleMissionCenterApi(failingSource, {
      method: 'GET',
      path: '/api/status',
    });
    expect(unavailable.status).toBe(503);
    expect(unavailable.body).not.toContain('secret internals');
  });
});
