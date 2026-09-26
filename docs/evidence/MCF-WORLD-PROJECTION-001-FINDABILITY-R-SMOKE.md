# MCF-WORLD-PROJECTION-001 — Open Interface Findability R Smoke

Boundary: read-only experimental fixture.
Purpose: control evidence only; not human UX evidence.

## Instrument

Fresh representative fixture R:
- mission: ORION-TRACE-021
- 12 entities
- 11 relations
- 6 fixture events
- fresh current state
- fresh observed provider artifact
- one UNKNOWN item
- one STALE item

The interface remains visible and navigable during all five tasks.

Captured per task:
- answer;
- expected answer;
- correctness;
- elapsedMs;
- active surface at answer;
- interaction count;
- navigation/entity interaction path.

## Browser smoke

PASS:
- fresh fixture R loaded;
- task and interface were simultaneously visible;
- navigation remained available;
- scripted path Relations -> Agora was captured;
- active surface at answer was captured;
- all five answer controls scored correctly;
- latest result persisted in browser localStorage.

Automated 5/5 and millisecond timing are control-only and must not be treated as human evidence.
