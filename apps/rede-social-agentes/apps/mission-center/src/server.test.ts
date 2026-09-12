import type { AddressInfo } from 'node:net';

import { describe, expect, it } from 'vitest';

import { createMissionCenterServer } from './server.js';

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

describe('createMissionCenterServer', () => {
  it('serves API and static dashboard over a real HTTP listener', async () => {
    const server = createMissionCenterServer({ async getStatus() { return result; } });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    try {
      const address = server.address() as AddressInfo;
      const base = `http://127.0.0.1:${address.port}`;
      const api = await fetch(`${base}/api/status`);
      expect(api.status).toBe(200);
      expect((await api.json()) as { snapshot: { missionId: string } }).toMatchObject({
        snapshot: { missionId: result.snapshot.missionId },
      });

      const page = await fetch(base);
      expect(page.status).toBe(200);
      expect(await page.text()).toMatch(/MCF Mission Center/u);
      expect(page.headers.get('content-security-policy')).toMatch(/default-src 'self'/u);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
