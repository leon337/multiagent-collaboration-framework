# Agent execution provider options — zero-cost recovery

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Owner: Mestre
Purpose: obtain real, distinguishable named-agent execution without role simulation and without new paid cost.
Status: `ZERO_COST_ROUTE_SELECTED / CI_PROOF_PENDING`

## Constraint

The MCF runtime already validates mission/skill/agent/evidence/Receipt semantics, but governed cognitive skills require execution evidence originating from the selected agent. Coordinator-authored prose cannot be submitted as Sofia/Miriam/Ricardo/etc. evidence.

LEANDRO additionally established a zero-new-cost constraint. Therefore any route that is billable, requires paid API calls or pushes technical operation onto LEANDRO is out of scope.

## Option A — Native MCF cognitive executor

Build a provider abstraction behind MCF that can execute role-bound agents and return evidence directly to the runtime.

Verdict: `PREFERRED PRODUCT DIRECTION`, but not the immediate Phase 2 harness because implementing the product executor before the architecture gate would create a circular dependency.

## Option B — Brainbase managed-agent tasks

Brainbase can provide distinguishable managed identities and task runs. The identities were materialized during investigation, but actual task runs are billable.

Verdict: `REJECTED FOR THIS MISSION` under the zero-new-cost invariant. PR #169 was closed without merge. No task run executed and no private memory/secrets were sent.

## Option C — LEANDRO workstation OpenClaw/Ollama

The ecosystem already contains a local runner pattern in `leon337/predixai-platform` using OpenClaw local mode and `ollama/qwen2.5:1.5b`, explicitly without paid API requirement.

Verdict: `VALID TECHNICAL PRECEDENT`, but not used as the mission execution path because this ChatGPT surface cannot invoke LEANDRO's workstation directly and the Human Delegation Firewall forbids turning him into the technical operator.

## Option D — Standard public GitHub Actions runner + local Ollama

Current GitHub documentation states that standard GitHub-hosted runners are free for public repositories. The MCF repository is public. A standard `ubuntu-latest` runner can install Ollama, pull an open local model and execute role-bound local model subprocesses without paid model APIs.

The branch adds:

- `.github/workflows/mcf-zero-cost-agent-harness.yml`;
- `ops/mission-agent-harness/zero_cost_phase2_agents.py`.

Each selected agent execution receives:

- named MCF role and competence-aligned work packet;
- fresh local `ollama run` subprocess;
- unique UUID;
- start/end timing;
- non-empty Markdown artifact with required ESEV headings;
- SHA-256 of output;
- explicit handoff marker in the workflow log.

No personal memory, raw private source, secret or provider token is included in prompts.

Verdict: `SELECTED IMMEDIATE ZERO_COST MISSION HARNESS`, pending real CI execution evidence.

## Selected Phase 2 chain

`Miriam -> Sofia -> Manoel -> Daniela -> Ricardo -> Júlia -> Tiago -> Rafael -> Eduardo -> Bruno -> Renato -> Beatriz -> Augusto -> Emily -> Léo`

This is a phase-specific selection, not a decorative full-roster run. Other official agents remain available in the 29-agent pool and enter only when their competence has concrete work.

## Acceptance

`GATE-RUNTIME-REALITY` is not satisfied merely because the harness code exists. It passes for a named agent only after the CI run contains attributable subprocess evidence and a valid artifact. If Ollama/model execution fails, the agent remains unexecuted and CAF applies.

## Long-term note

The mission harness is not a production dependency and must not become the permanent MCF executor by accident. The final product architecture may reuse the provider abstraction idea while keeping the mission's release feature focused on governed Cognitive Ledger memory.
