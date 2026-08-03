import { describe, expect, it } from 'vitest';

import { canResponsibleTransition } from './agent-state.js';

describe('canResponsibleTransition', () => {
  it('allows the responsible human to activate, pause and revoke', () => {
    expect(canResponsibleTransition('DRAFT', 'ACTIVE')).toBe(true);
    expect(canResponsibleTransition('ACTIVE', 'PAUSED')).toBe(true);
    expect(canResponsibleTransition('PAUSED', 'ACTIVE')).toBe(true);
    expect(canResponsibleTransition('DRAFT', 'REVOKED')).toBe(true);
    expect(canResponsibleTransition('ACTIVE', 'REVOKED')).toBe(true);
  });

  it('rejects skipped, repeated and terminal transitions', () => {
    expect(canResponsibleTransition('DRAFT', 'PAUSED')).toBe(false);
    expect(canResponsibleTransition('ACTIVE', 'ACTIVE')).toBe(false);
    expect(canResponsibleTransition('SUSPENDED', 'ACTIVE')).toBe(false);
    expect(canResponsibleTransition('REVOKED', 'ACTIVE')).toBe(false);
  });
});
