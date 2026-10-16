# MCF Agent Workspace — Phase 1 and Session Focus Gate

Mission: MCF-AGENT-WORKSPACE-001

## Initial product

Initial product SHA:

    3450a35b99f828f098bc5899d5bd201059dc1184

### Leonardo / Product

Verdict:

    PASS — Phase 1

Key conclusion:
- Agent Workspace is the correct successor direction for Dual Browser;
- the scaling unit changes from application window to AgentSlot + AgentSession;
- immediate cutover is not authorized;
- next functional slice is Session Focus.

Minimum future cutover criteria:
- correct agent/session binding;
- A -> B -> A focus switching with session preservation;
- no new desktop windows for agent switching;
- real multi-agent mission completed in Workspace;
- explicit failure/recovery;
- fallback verified;
- no critical parity gap.

### Laura / UX initial

Verdict:

    CONDITIONAL

Required:
- make WORKING summary exact;
- remove false + affordance on empty slots;
- expose SESSION binding explicitly;
- make Mission mission-centric;
- label agent state vs mission state separately.

## Remediated product

Remediated product SHA:

    a846e163b3f6570a7a65d94e024ce46e16d0d66f

### Laura / UX re-gate

Verdict:

    PASS

All five UX blockers resolved.

Additional improvements:
- explicit coverage COMPLETE / PARTIAL;
- readable / total registries;
- multiple observations preserved;
- ambiguous bindings visible.

### Emily / Independent

Verdict:

    PASS — Session Focus contract accepted for prototype-only controlled implementation

Previous Medium issues closed:
- partial coverage no longer implies global absence;
- identity dedupe no longer resolves session identity.

Emily authorized prototype-only controlled Session Focus under strict fail-closed/isolation rules.

Not authorized:
- automatic messages;
- Agent Operations;
- cutover;
- cookie/profile migration;
- legacy deletion;
- production.

### Sofia / Architecture

Verdict on Session Focus Contract v0.1:

    CONDITIONAL

The contract correctly separated identity/session/slot/surface and fail-closed behavior.

Remaining blocker before real attachment:
- explicit property ownership matrix;
- explicit freshness authority/rule;
- providerSessionLifecycle separated from surfaceLifecycle.

Authorized next scope:
- typed SessionBinding/schema;
- ownership/freshness contract;
- fail-closed resolver;
- OperationalSurface state machine;
- unit/fixture tests;
- A -> B -> A logical identity/partition resolution.

## Preparatory implementation

Product SHA:

    fe8babef5839a2fe9c788f0be567b3ecf028a42c

Implemented:
- contracts/session-binding.schema.json
- docs/SESSION-BINDING-OWNERSHIP.md
- revised docs/SESSION-FOCUS-CONTRACT.md
- src/main/session-binding.mjs
- src/main/operational-surface-state.mjs
- src/main/session-focus-controller.mjs
- negative/fail-closed tests
- A -> B -> A logical partition preservation test

Verification:

    npm run check = PASS
    npm test = 15 passed / 0 failed

No live WebContents/session attachment is implemented at this checkpoint.

## Current decision

    PHASE_1 = PASS_READ_ONLY_BASELINE
    PHASE_2_PREPARATORY = IMPLEMENTED_PENDING_REGATE
    REAL_SESSION_ATTACHMENT = NOT_YET_AUTHORIZED_BY_ARCHITECTURE_REGATE
    DUAL_BROWSER = BOOTSTRAP_FALLBACK
    CUTOVER = NOT_AUTHORIZED
    PRODUCTION = NOT_AUTHORIZED
