# Agent execution provider options

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Owner of this artifact: Mestre
Purpose: unblock real named-agent execution without simulating roles
Status: `EVALUATED / AUTHORIZATION GATE FOR EXTERNAL PROVIDER`

## Constraint

The mission requires 29 real, distinguishable agent executions and agent-owned artifacts. The current MCF runtime is an orchestrator/evidence ledger, not a cognitive-agent originator. The current ChatGPT tool surface has no native subagent dispatch namespace. Therefore a real execution provider is required before non-Mestre roles can receive credit.

## Option A — Extend MCF runtime with a native agent executor

Build an execution adapter inside or beside the MCF runtime that instantiates role-bound agents, runs a mission work packet, writes the artifact, and returns evidence to the existing runtime.

### Strengths
- strongest architectural ownership and provenance;
- no long-term dependency on a mission-only third party;
- can bind directly to MCF skills, mission IDs, evidence schema and receipts;
- can enforce role prompts, capability constraints and artifact contracts centrally.

### Weaknesses
- implementing it now would itself be product code before the architecture phase has passed the design gate;
- it requires model-provider credentials, evaluation, security and deployment work;
- it cannot be used to generate the independent specialist architecture that should precede its own implementation without creating a circular dependency.

### Verdict
`PREFERRED PRODUCT-DIRECTION CANDIDATE`, but not usable as the immediate architecture-team executor before design approval.

## Option B — Use an external managed-agent execution provider only as a mission execution harness

Plugin discovery found **Brainbase MCP** as an available but not currently installed integration. Its advertised capabilities include creating, inspecting, testing and running managed AI agents, orchestrations and task runs through OAuth.

The harness would be mission tooling, not a production dependency of Cognitive Ledger. It would receive only the minimum public/technical mission context needed for architecture and validation work. Real personal Ledger contents, provider secrets and private source text remain excluded.

### Strengths
- can provide distinguishable managed agent identities and task runs without pretending this coordinator is all 29 roles;
- can generate role-owned artifacts before MCF itself gains a native cognitive executor;
- OAuth connection creates an explicit authorization boundary;
- allows the MCF runtime to remain the canonical evidence/orchestration ledger while the external harness supplies actual cognitive execution.

### Weaknesses
- introduces a third-party service into mission execution;
- requires explicit account/plugin authorization by the human authority;
- capability, cost, retention and evidence-export behavior must be verified after connection before any sensitive data is allowed;
- cannot be silently installed or connected by the coordinator.

### Verdict
`RECOMMENDED IMMEDIATE UNBLOCKER`, subject to explicit connection authorization and a no-sensitive-data execution policy.

## Option C — Use OpenAI Agents SDK/Codex as a mission-only executor

The available OpenAI Developers Agents SDK skill supports building, running, evaluating and deploying real agents, but the skill is designed for Codex workflows and requires an OpenAI API credential gate before calls to the API.

### Strengths
- strong control over role identity, handoffs, tools, structured outputs and evals;
- can evolve into the native MCF executor architecture if selected later;
- clear path to deterministic artifact/evidence envelopes.

### Weaknesses
- current ChatGPT session has no Codex/subagent runtime exposed for direct invocation;
- building/deploying this executor is implementation work and needs the architecture/design gate first;
- requires API credential authorization and potentially cost.

### Verdict
`STRONG IMPLEMENTATION CANDIDATE AFTER ARCHITECTURE`, not an immediate executor in this ChatGPT surface.

## Decision

For the **immediate architecture-team execution gap**, Option B is the only discovered route that can potentially provide real separate agent runs without first implementing the product that those agents are supposed to design.

For the **product architecture**, Option A/C hybrid remains the preferred direction to evaluate: MCF-owned execution/evidence semantics with a supported model/agent runtime behind a narrow provider interface.

## Human Delegation Firewall treatment

Connecting a third-party agent provider is an authorization/security boundary, not technical implementation work. If Option B is used, Leandro's role is limited to approving/connecting the integration in the product UI. He must not be asked to provision secrets, run commands, configure agents manually, or operate the provider.

## Privacy boundary for any external mission executor

Until Júlia/Ricardo review and the provider contract is verified:

- public MCF/Cognitive Ledger code and technical architecture context only;
- synthetic examples only;
- no real memory contents;
- no Supabase service role or provider secrets;
- no raw `fontes.conteudo_bruto`;
- no production OAuth tokens;
- all returned artifacts must be copied into the MCF PRF with origin metadata/digest.
