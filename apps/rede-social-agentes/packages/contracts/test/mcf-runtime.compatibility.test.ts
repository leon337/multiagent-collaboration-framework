import { describe, expectTypeOf, it } from 'vitest';

import type {
  McfEventType,
  McfMissionState,
  McfPermissionProfile,
  McfPhaseState,
  McfResumeRoute,
} from '../src/index.js';

describe('MCF runtime public contract compatibility', () => {
  it('preserves the current continuity, mission, phase, and permission literals', () => {
    expectTypeOf<McfResumeRoute>().toEqualTypeOf<
      'FAST_RESUME' | 'RECONCILE' | 'RECOVER_MCF_PROJECT'
    >();
    expectTypeOf<McfMissionState>().toEqualTypeOf<
      | 'PLANNED'
      | 'EXECUTING'
      | 'RECOVERING'
      | 'WAITING_EXTERNAL'
      | 'BLOCKED_RISK'
      | 'COMPLETED'
      | 'CANCELLED'
    >();
    expectTypeOf<McfPhaseState>().toEqualTypeOf<
      'PLANNED' | 'EXECUTING' | 'WAITING_EVIDENCE' | 'RECOVERING' | 'FAILED' | 'COMPLETED'
    >();
    expectTypeOf<McfPermissionProfile>().toEqualTypeOf<
      'READ_ONLY' | 'READ_AND_PROPOSE' | 'SCOPED_WRITE' | 'SENSITIVE_CONTROLLED' | 'HUMAN_GATE'
    >();
  });

  it('preserves the public gate event literals', () => {
    type GateEvents = Extract<McfEventType, 'GATE_REQUIRED' | 'GATE_APPROVED' | 'GATE_REJECTED'>;

    expectTypeOf<GateEvents>().toEqualTypeOf<'GATE_REQUIRED' | 'GATE_APPROVED' | 'GATE_REJECTED'>();
  });
});
