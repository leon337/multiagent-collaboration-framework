import { describe, expect, it, vi } from 'vitest';
import { HumanAuthorityBootstrapController } from './human-authority-bootstrap.controller.js';
import type { HumanAuthorityBootstrapService } from './human-authority-bootstrap.service.js';

describe('HumanAuthorityBootstrapController', () => {
  it('rejects caller-supplied account identity', async () => {
    const controller = new HumanAuthorityBootstrapController({
      createIntent: vi.fn(),
    } as unknown as HumanAuthorityBootstrapService);
    const request = { id: 'corr', authenticatedHuman: { accountId: 'server-derived' } } as never;

    await expect(
      controller.createIntent(
        {
          action: 'BIND_CURRENT_AUTHENTICATED_ACCOUNT',
          target: 'STAGING',
          accountId: 'caller-value',
        },
        request,
      ),
    ).rejects.toThrow();
  });
});
