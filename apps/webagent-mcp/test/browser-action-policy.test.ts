import { describe, expect, it } from 'vitest';
import {
  AllowWriteBrowserActionPolicy,
  ReadOnlyBrowserActionPolicy,
  classifyBrowserAction,
} from '../src/browser-actions.js';
import { OperationError } from '../src/execution.js';

describe('browser action policy', () => {
  it('classifies navigation as READ and interactive mutations as WRITE', () => {
    expect(classifyBrowserAction({ type: 'navigate', url: 'https://example.com/' })).toBe('READ');
    expect(classifyBrowserAction({ type: 'click', selector: '#submit' })).toBe('WRITE');
    expect(classifyBrowserAction({ type: 'fill', selector: '#name', value: 'secret' })).toBe('WRITE');
    expect(classifyBrowserAction({ type: 'select', selector: '#role', value: 'admin' })).toBe('WRITE');
    expect(classifyBrowserAction({ type: 'press', selector: '#name', key: 'Enter' })).toBe('WRITE');
  });

  it('allows READ but denies WRITE by default with a stable error code', () => {
    const policy = new ReadOnlyBrowserActionPolicy();

    expect(() => policy.assertAllowed({ type: 'navigate', url: 'https://example.com/' })).not.toThrow();

    try {
      policy.assertAllowed({ type: 'fill', selector: '#name', value: 'Leandro' });
      throw new Error('expected policy denial');
    } catch (error) {
      expect(error).toBeInstanceOf(OperationError);
      expect((error as OperationError).code).toBe('ACTION_POLICY_DENIED');
    }
  });

  it('allows explicit WRITE policy while still exposing risk classification', () => {
    const policy = new AllowWriteBrowserActionPolicy();
    expect(() => policy.assertAllowed({ type: 'click', selector: '#submit' })).not.toThrow();
  });
});
