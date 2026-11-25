# ADR — MCF Agent Workspace as Dual Browser Successor

Status: ACCEPTED FOR MISSION EXECUTION
Date: 2026-09-26

## Decision

Build MCF Agent Workspace as a distinct product rather than continuously expanding the Dual Browser window model.

The existing Dual Browser remains operational bootstrap/fallback until the new product demonstrates parity.

## Why

The scaling unit of the old architecture was effectively an application window.

The new scaling unit must be an Agent Slot backed by a distinct AgentIdentity and AgentSession.

This lets the system represent many agents without requiring many desktop windows or live browser surfaces.

## Consequences

Positive:
- one global operational view;
- lower cognitive overhead;
- lower expected rendering cost;
- clearer separation of identity/session/layout;
- cleaner future integration with MCF World.

Costs:
- compatibility layer required during migration;
- live session discovery must reconcile bindings and sessions;
- cutover cannot occur until parity is demonstrated.

## Rejected approach

Do not simply add more Dual Browser instances or increase the fixed number of panes inside each legacy instance.

That preserves the wrong unit of scaling.
