import type { FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import type { MissionControlService } from './mission-control.service.js';
import { MissionControlReadController } from './mission-control-read.controller.js';

function create(service: { latest: (repo: string) => Promise<unknown> }) {
  return new MissionControlReadController(service as unknown as MissionControlService);
}

const request = { id: 'mcf-read-test-1' } as FastifyRequest;

describe('MissionControlReadController', () => {
  it('delegates only the fixed read operation with a valid repository', async () => {
    const payload = {
      source: 'MCF_MISSION_CONTROL_READ_ONLY',
      repository: 'leon337/multiagent-collaboration-framework',
      mission: { id: 'mission-1' },
    };
    const latest = vi.fn(async () => payload);
    const controller = create({ latest });
    await expect(
      controller.latest('leon337/multiagent-collaboration-framework', request),
    ).resolves.toEqual(payload);
    expect(latest).toHaveBeenCalledOnce();
    expect(latest).toHaveBeenCalledWith('leon337/multiagent-collaboration-framework');
    expect('dispatch' in controller).toBe(false);
  });

  it.each([
    undefined,
    '',
    '../outside',
    'https://example.com/a',
    'bad/repo/extra',
    'other/repository',
  ])('rejects a noncanonical repository parameter: %s', async (name) => {
    const latest = vi.fn(async () => null);
    await expect(create({ latest }).latest(name, request)).rejects.toThrow();
    expect(latest).not.toHaveBeenCalled();
  });

  it('does not invent data when there is no canonical mission', async () => {
    const latest = vi.fn(async () => null);
    await expect(
      create({ latest }).latest('leon337/multiagent-collaboration-framework', request),
    ).rejects.toThrow();
    expect(latest).toHaveBeenCalledOnce();
  });
});
