# MCF Agent Workspace — Phase 1 Remediation Evidence

Remediated product SHA:

    a846e163b3f6570a7a65d94e024ce46e16d0d66f

## Changes

### Coverage completeness

Snapshot v2 now exposes:
- COMPLETE / PARTIAL / UNKNOWN;
- readable / total registry count;
- unreadable registry count/list.

Live observation:

    coverage = PARTIAL
    readable = 5
    total instance dirs = 9
    unreadable = 4

Unreadable:
- archipelago-linux-clean
- archipelago-linux-clean2
- monitor
- principal

Mission UI explicitly states that observed absence under partial coverage is not global absence.

### Binding ambiguity

AgentIdentity remains deduplicated for the Overview card, but all observations are preserved.

If one identity has multiple observations:

    bindingResolution = AMBIGUOUS
    presentationSelectionBasis = LATEST_OBSERVED_FOR_DISPLAY_ONLY

This presentation representative is not a canonical session binding.

Live observations:
- Sofia: AMBIGUOUS, 3 observations
- Emily: AMBIGUOUS, 3 observations
- Eduardo: SINGLE_OBSERVATION
- Renato: SINGLE_OBSERVATION
- Rafael: SINGLE_OBSERVATION
- Patrícia: SINGLE_OBSERVATION

### UX remediation

- summary now says WORKING when it counts WORKING;
- empty slots say VAZIO / Disponível para vínculo futuro, no + create affordance;
- AGENTE and MISSÃO state are labelled separately;
- Focus includes explicit SESSION BINDING block;
- ambiguous Focus lists observed candidates and states that Workspace does not choose a canonical session automatically;
- Mission groups by mission ID when missions exist;
- empty Mission under partial coverage is explicitly qualified.

### Contract

Session Focus Contract v0.1 drafted before any session attachment implementation.

## Verification

PASS:

    npm run check
    npm test
    2/2 tests

Live Electron DOM inspection confirmed:
- coverage badge = COBERTURA PARCIAL · 5/9;
- agentGrid children = 8;
- six real Agent cards;
- two VAZIO slots;
- two AMBIGUOUS badges;
- Sofia Focus lists 3 observed bindings;
- Mission says partial coverage does not prove global absence.

## Boundary

No session attachment was implemented.

No cookies/profiles were migrated.

No legacy state was modified/deleted.

Dual Browser remains fallback.
