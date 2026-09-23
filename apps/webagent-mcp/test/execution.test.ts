import { describe, expect, it } from 'vitest';
import { executeEnvelope } from '../src/execution.js';

describe('executeEnvelope', () => {
  it('returns data with timing and runtime evidence on success', async () => {
    const result = await executeEnvelope('unit.success', async () => ({ value: 7 }), {
      evidence: [{ kind: 'request', ref: 'test://success' }],
    });

    expect(result.ok).toBe(true);
    expect(result.operation).toBe('unit.success');
    expect(result.data).toEqual({ value: 7 });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.startedAt).toMatch(/T/);
    expect(result.finishedAt).toMatch(/T/);
    expect(result.evidence).toEqual([{ kind: 'request', ref: 'test://success' }]);
  });

  it('converts thrown errors into a stable envelope without stack leakage', async () => {
    const result = await executeEnvelope('unit.failure', async () => {
      throw new Error('provider exploded');
    });

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({ code: 'OPERATION_FAILED', message: 'provider exploded' });
    expect(JSON.stringify(result.error)).not.toContain('stack');
    expect(result.data).toBeUndefined();
  });
});
