# MCF-AGENT-WORKSPACE-001 — Phase 2 Main-UI Proof

Date: 2026-09-26

Product repository:
leon337/mcf-agent-workspace

Product evidence SHA:
9b397e5cac1465f01608758119c927e41e5044c5

## Result

PASS — exact legacy scope only.

The main Agent Workspace UI successfully materialized:

Patrícia -> Rafael -> Patrícia

using one Operational Surface and the explicit process-lifetime Session Store Lease model.

## Important runtime finding

Visual detach does not release the physical Chromium store.

A safe fallback requires:
1. handoff request;
2. surfaces hidden/destroyed;
3. lease state moves to RELEASING;
4. Workspace process exits;
5. supervisor outside the store-owning process lineage verifies zero handles;
6. only then the Dual Browser fallback starts.

The final implementation uses a supervised parent launcher. Real Session Focus is fail-closed when the Workspace is launched without that parent.

## Integrated proof

Observed through the actual main UI / preload / main-process path:

- supervised UI enabled for Patrícia/Rafael;
- unsupervised UI disabled real Session Focus;
- one active Operational Surface at a time;
- exact binding revalidation remained FRESH;
- A->B->A preserved explicit sessionRef/profilePartitionRef identity;
- hiding the surface left both stores LEASED + INACTIVE_IN_WORKSPACE;
- Return to Dual Browser terminated Workspace with the handoff code;
- parent launcher invoked the external Node supervisor;
- supervisor verified both stores at zero handles;
- notebook-team2 launched only after release verification;
- exact pre-run bindings recovered READY with verified handshake;
- fallback closed;
- both stores returned to zero handles.

Regression baseline:
42/42 tests PASS.

## Gate history

Sofia: PASS for exact legacy main-UI integration with explicit lease visibility and supervised handoff.

Emily: PASS; no Critical/High/Medium blocker for the exact audited scope.

Leonardo product direction had already selected process-lifetime lease / controlled fallback as the preferred Phase 2 path.

## Boundary

Authorized:
- experimental Session Focus for notebook-team2 / Patrícia + Rafael only;
- supervised launcher;
- explicit process-lifetime leases;
- fail-closed Return to Dual Browser.

Not authorized:
- production;
- cutover;
- Dual Browser removal;
- other agents/instances/providers;
- generic partition ownership;
- profile/storage migration;
- automatic sends;
- detach = release.
