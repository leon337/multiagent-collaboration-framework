# Runtime execution-boundary audit

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Audit type: coordinator preflight / anti-simulation gate
Status: `BLOCKING_FOR_NAMED_AGENT_CREDIT`

## Question under test

Can the currently deployed/in-repository MCF runtime be treated as proof that a named MCF agent actually performed cognitive work and authored an artifact?

## Evidence inspected

Repository implementation at MCF main `08fef949c49496050596e9681aaf011259e51f77`:

- `apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-runtime-bridge.controller.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-runtime-bridge.service.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/chat-mission-planner.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/mission-runtime.controller.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/skill-executor.ts`
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/internal-skill-evidence.ts`
- `apps/rede-social-agentes/apps/server/package.json`
- Render service inventory and current staging deployment metadata.

## Findings

### F1 — Runtime is real orchestration/evidence infrastructure

The MCF server exposes mission creation, phase execution, timeline and Chat dispatch endpoints. It enforces selected skill/agent/tool combinations, mission versions, permission checks, evidence validation and external receipts. This is executable software, not documentation-only governance.

### F2 — Governed internal agent skills do not originate their own cognitive evidence

`SkillExecutor` calls `collectInternalExecutionEvidence(skill, inputs)` for governed internal skills. `collectInternalExecutionEvidence` requires `inputs.execution_evidence` and rejects the phase when that evidence is absent or malformed. The runtime then wraps that supplied evidence in a receipt and validates it.

Therefore the runtime validates evidence *provided to it*; this code path does not itself invoke a model/agent that creates the architecture, threat model, context recovery, UX design or other cognitive work.

### F3 — Chat bridge deliberately stops before governed agent work

The Chat bridge automatically executes bootstrap/planning-only internal steps. Its service marks later governed steps as `READY_AGENT`/`READY_EXTERNAL` and describes the next action as the named agent executing the skill and supplying verifiable `execution_evidence`.

This is consistent with ESEV, but it means a bridge dispatch alone cannot be counted as the named agent's completed work.

### F4 — Current server package has no model/agent execution dependency

The server dependencies include NestJS, MCP SDK, validation and workspace packages, but no model-provider/LLM agent runtime dependency that would independently produce a selected agent's cognitive artifact.

### F5 — Live staging runtime is not current MCF main

Render service `mcf-runtime-staging-api` is live from commit `3d6367fb6a821c2e1b4acb7976aef82fac06daf5`, while current MCF main is `08fef949c49496050596e9681aaf011259e51f77`. The service is configured with auto-deploy disabled. This staging instance therefore cannot be assumed to contain the latest roadmap/governance recovery commits.

### F6 — Current ChatGPT tool surface does not expose authenticated MCF mission POST execution

The MCF Chat/mission controllers are protected by the application's session-auth boundary (and CI callbacks by the MCF runtime token guard). The connector/tool surface available in this mission allows GitHub/Render/provider operations but does not expose an authenticated MCF `POST /v1/mcf/chat/dispatch` or arbitrary authenticated HTTP action into that service.

No user credential or secret will be requested to work around this. The Human Delegation Firewall forbids turning Leandro into the technical operator for this gap.

## Verdict

`GATE-RUNTIME-REALITY = NOT SATISFIED` for crediting named cognitive agents.

The MCF runtime can be used as an orchestration/evidence ledger only after a real agent-execution source is connected or otherwise made invocable. Creating prose locally and inserting it into `execution_evidence` under another agent's name would be role simulation and is prohibited.

## Required remediation outcome

Before Sofia, Miriam, Ricardo, Júlia, Beatriz, Emily or any other named agent receives execution credit, the mission must establish a non-simulated execution boundary with:

1. distinguishable agent execution identity;
2. mission/phase/skill binding;
3. real artifact production by that executor;
4. verifiable artifact reference/digest;
5. runtime Receipt and chronological handoff;
6. no user-operated technical workaround.

The architecture phase may continue only with coordinator/source-recovery artifacts until that boundary is established. No implementation is authorized by this finding.
