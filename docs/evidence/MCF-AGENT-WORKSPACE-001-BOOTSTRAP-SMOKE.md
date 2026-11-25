# MCF Agent Workspace — Phase 1 Bootstrap Smoke

Mission: MCF-AGENT-WORKSPACE-001

Product repository:

    leon337/mcf-agent-workspace

Initial product SHA:

    3450a35b99f828f098bc5899d5bd201059dc1184

## Static verification

PASS:

    npm run check
    npm test

Adapter tests:
- 2 passed;
- 0 failed.

## Live legacy observation

The read-only adapter observed the current Dual Browser instance registry.

Visible specialist slots:

1. Sofia — RECONCILING — notebook
2. Eduardo — RECONCILING — notebook-team3
3. Renato — ERROR — notebook-team3
4. Emily — RECONCILING — notebook
5. Rafael — READY — notebook-team2
6. Patrícia — READY — notebook-team2

Two additional slots remained available.

Observed legacy instance directories with readable identity registries:

- lifecycle-race-smoke
- notebook
- notebook-bench
- notebook-team2
- notebook-team3

No non-terminal missions were observed at this moment.

The adapter reported unreadable/missing identity registries for some other legacy directories. These were diagnostics only; no mutation was attempted.

## Electron smoke

The product was launched using the Electron binary already installed with the active Dual Browser to avoid duplicating dependencies on a disk-constrained notebook.

PASS:

- BrowserWindow opened with title MCF Agent Workspace;
- renderer loaded;
- six real agents rendered;
- summary reported 6 agents / 5 legacy instances / 0 non-terminal missions;
- selecting the first agent switched to Focus;
- Operational Surface title updated to Sofia · sessão operacional.

## Boundary

This smoke proves:
- one window can aggregate several existing agents;
- the legacy adapter can deduplicate specialists;
- Overview/Focus wiring works.

It does not prove:
- session embedding;
- operational parity;
- resource savings;
- live session discovery completeness;
- production readiness.

Laura/Leonardo/Sofia/Emily review is required before Phase 2.
