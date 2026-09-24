import { describe, expect, it } from 'vitest';
import { OperationError } from '../src/execution.js';
import { PublicEgressPolicy } from '../src/egress-policy.js';

describe('PublicEgressPolicy', () => {
  it.each([
    'http://127.0.0.1/',
    'http://10.0.0.5/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
    'http://localhost/',
    'https://user:pass@example.com/',
  ])('rejects blocked destination %s', async (rawUrl) => {
    const policy = new PublicEgressPolicy(async () => ['93.184.216.34']);

    await expect(policy.assertAllowed(new URL(rawUrl))).rejects.toMatchObject({
      code: 'EGRESS_BLOCKED',
    } satisfies Partial<OperationError>);
  });

  it('rejects a public hostname that resolves to a private address', async () => {
    const policy = new PublicEgressPolicy(async () => ['192.168.1.25']);

    await expect(policy.assertAllowed(new URL('https://example.com/'))).rejects.toMatchObject({
      code: 'EGRESS_BLOCKED',
    });
  });

  it('allows an HTTPS public hostname resolving only to public addresses', async () => {
    const policy = new PublicEgressPolicy(async () => ['93.184.216.34']);

    await expect(policy.assertAllowed(new URL('https://example.com/'))).resolves.toBeUndefined();
  });
});
