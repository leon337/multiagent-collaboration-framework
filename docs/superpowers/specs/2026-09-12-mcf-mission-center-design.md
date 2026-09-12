# MCF Mission Center — MVP Design

## Objective
Provide LEANDRO with a web application on the MCF VPS for following `MCF-GAMA-FUND-2026-001` without using the GitHub interface, while preserving GitHub/repository artifacts as evidence sources.

## Scope
The MVP is read-only. It shows mission state, G0–G10 progress, current stage, last real action, executor, evidence references, blockers, next step, HUMAN_GATE state and freshness.

## Architecture
Create a standalone workspace app at `apps/rede-social-agentes/apps/mission-center`.

The Node server:
- binds to `127.0.0.1` by default;
- serves the static dashboard;
- exposes `GET /api/status`;
- fetches one machine-readable mission projection from `MCF_MISSION_STATUS_URL`;
- validates the projection before returning it;
- caches the last valid snapshot for a short TTL;
- serves the last known good snapshot with an explicit stale flag when upstream is temporarily unavailable;
- never sends GitHub, Mission Control or Gemini credentials to the browser.

The browser:
- polls `/api/status` every 15 seconds;
- renders stages, current status, evidence, blockers and freshness;
- does not perform mutations or HUMAN_GATE actions in the MVP.

## Mission projection
Canonical path for this mission:
`artifacts/missions/MCF-GAMA-FUND-2026-001/mission-status.json`

The projection does not replace PRFs or Issue #205. It is the dashboard-facing read model and must obey `CLAIM <= EVIDENCE`.

Required fields:
- `schemaVersion`;
- `missionId`;
- `title`;
- `state`;
- `deadline`;
- `humanAuthority`;
- `orchestrator`;
- `currentStage`;
- `stages`;
- `lastAction`;
- `blockers`;
- `nextStep`;
- `humanGates`;
- `updatedAt`.

Every stage entry includes its status and evidence references. `NO_EVIDENCE = NOT_EXECUTED` remains binding.

## Security
- localhost-only binding by default;
- no browser-side secrets;
- no write endpoint;
- no shell execution;
- upstream URL configured server-side;
- response validation before rendering;
- fail closed on an invalid first snapshot;
- stale last-known-good data must be visibly marked.

## Deployment
The process is designed to run behind the existing VPS networking layer. Tailscale/private exposure is preferred; public exposure with authentication is a separate decision and is not required to build or test the MVP.

## Acceptance criteria
1. dashboard renders all G0–G10 stages;
2. current G3 state is visible;
3. polling refreshes status without page reload;
4. upstream invalid data is rejected;
5. upstream outage returns last-known-good with `stale=true` when available;
6. browser receives no service credentials;
7. server binds localhost by default;
8. unit tests pass without external network access.
