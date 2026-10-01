# PHASE-00 REPORT — MCF-AGENT-HARNESS-INTEROP-001

**Estado:** RESEARCH_COMPLETED_WITH_EXTERNAL_EXECUTOR_LIMITATION  
**Autoridade:** LEANDRO  
**Orquestrador:** MESTRE  
**Risco:** B  
**Implementation authorization:** FALSE  
**Scope:** research/design only

## 1. Execution record

Seven canonical MCF agent sessions were opened through the MCF Dual Browser Agent Bridge for Sofia, Miriam, Ricardo, Augusto, Emily, Leonardo and Mestre. The bootstrap turn was sent and each session received its canonical contract.

The local SentinelX host subsequently disconnected while the agents were processing the substantive follow-up. Therefore this report does **not** claim substantive findings authored by those seven sessions. Their session creation/bootstrap is evidence; their unavailable research output is a recorded execution limitation.

The architectural research below was completed by the orchestrator from the live MCF repository and primary provider documentation. No runtime, schema, provider, production or deploy mutation was performed.

## 2. Current-state MCF baseline

Verified against GitHub live:

- MCF is an executable multiagent framework, not merely a methodology.
- Runtime path: `apps/rede-social-agentes/apps/server/src/mcf-runtime/`.
- Core flow is mission -> MissionRuntime/persistence -> skill registry/planner -> Human Delegation Firewall / Permission Engine -> Skill Executor / External Action Dispatcher -> adapter -> Evidence Validator + receipts + event ledger -> handoff/CAF/gate/checkpoint.
- Persistent missions/phases/events/handoffs/receipts are implemented.
- Human Delegation Firewall and permission profiles are implemented.
- External Action Dispatcher and evidence-backed adapters exist.
- A local deterministic multiagent execution path exists, but is explicitly not evidence of independent cognition.
- The canonical agent registry contains 29 named roles; role identity is separate from proof of independent model execution.
- MCF already has experimental provider-agnostic web research skill contracts, with provider lists including Web Native, GitHub, OpenAI Developers, Exa, Consensus, Sider Scholar, ChatGPT Work and Firecrawl.
- MCF's own documentation explicitly distinguishes current implementation from proposed/under-study architecture.
- Mission Control is documented as separate from the Execution Plane and not a second source of truth.
- Generic NextGen Authority Envelope and contractual authority binding are not yet implemented.
- Persistent MissionRuntime pause/resume for running missions is not implemented.

Primary MCF sources:
- `README.md`
- `docs/MCF-CURRENT-STATE.md`
- `docs/runtime/README.md`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`
- `skills/registry.yaml`

## 3. Provider capability matrix

| Capability | MCF | OpenAI Dots | ChatGPT Work | Codex | OpenAI Agents SDK/API |
|---|---|---|---|---|---|
| Explicit agent role/identity | Yes, canonical 29-role registry | Yes, persistent named dot | Yes, task/work surface | Yes, coding-agent identity/workflows | Yes, Agent definitions |
| Long-running work | Persistent mission runtime | Always-on/ongoing work | Long tasks + scheduled/event-triggered work | Background/long-running tasks | Run/state/continuation patterns |
| Background/scheduled execution | Partial; scheduler/lifecycle gaps remain | Yes | Yes | Yes | Background mode/API patterns |
| Computer/browser execution | Via adapters/local tooling; governed | Cloud computer; optional local computer | Browser/cloud execution | Cloud/local computer/browser surfaces | Sandbox/computer/tool integrations |
| Memory/continuity | MCF context/evidence/checkpoints | Dot memory + connected context | Project/task context | Coding context/workspaces | Session/history/server-managed continuation |
| Multi-agent orchestration | Core purpose | Can delegate ongoing work, but product-specific | Can delegate/subtasks/workflows | Parallel agent workflows | Handoffs / agents-as-tools |
| Human approval | Core governance/gates | Rules: act/pre-approved/ask/hand-off | Approval controls | Human review/control | Guardrails/approvals/interruption/resume |
| Evidence/traceability | Receipts + event ledger + evidence validator | Product activity/review surfaces | Task/progress/result surfaces | Traces/review/PR artifacts | Built-in structured tracing |
| Provider-independent contract | Target of this mission; not yet formalized | No | No | No | SDK-specific |
| Provider adapter boundary | Existing adapters, but no canonical external-provider contract | Provider-native | Provider-native | Provider-native | Runtime-specific |
| Kill/cancel/pause | Governance primitives exist; persistent running-mission pause gap | Pause dot | Task control | Stop/background controls | Interrupt/resume state |
| Local/self-hosted execution | Yes in bounded local runtime paths | Optional local computer access | Work Local | Local/remote dev environments | SDK runs in app; sandbox/runtime options |
| API-triggered operation | MCF runtime/API | Product surfaces | Workspace Agents API + scheduled triggers | APIs/integrations | API-native |
| Main architectural role | Governance/orchestration control plane candidate | Agent product/execution surface | General work execution surface | Engineering execution surface | Agent runtime/harness |

Provider facts are supported by primary OpenAI sources listed in section 9.

## 4. Gap analysis

### G1 — Agent Role vs Execution Provider
**Gap:** MCF has canonical roles and skills plus execution adapters, but no single formal contract that makes role identity independent from the runtime/provider.

**Impact:** provider-specific assumptions can leak into mission contracts.

**Required direction:** introduce conceptual separation:
`AgentRole` -> `ExecutionProvider` -> `CapabilityBinding`.

### G2 — Provider adapter contract
**Gap:** adapters exist, but the interop contract needs a stable provider-neutral interface for start/run/pause/resume/cancel/status/result/evidence.

**Required direction:** provider adapter interface owned by MCF; provider implementations remain outside the canonical governance model.

### G3 — Authority portability
**Gap:** MCF has strong local authority/governance boundaries, but a generic cross-provider Authority Envelope is not implemented.

**Required direction:** authority must be bound to mission, agent role, provider, capability, action scope, expiration and approval state.

### G4 — Evidence portability
**Gap:** MCF evidence/receipts are mature locally, but provider-native traces/results do not yet have a normalized cross-provider evidence contract.

**Required direction:** normalize provider output into MCF evidence records without treating provider-native logs as authority.

### G5 — Long-running lifecycle
**Gap:** Dots/Work/Codex now expose always-on/background/scheduled workflows while MCF documentation still identifies persistent running-mission pause/resume as not implemented.

**Required direction:** extend lifecycle semantics rather than replace MissionRuntime.

### G6 — Scheduler/proactive work
**Gap:** scheduled/event-triggered work is becoming a provider capability; MCF has an experimental monitoring/scheduling skill but no finalized provider-neutral scheduler contract.

**Required direction:** Scheduler should emit governed mission events; provider schedulers must remain adapters.

### G7 — Human approval gateway
**Gap:** MCF has gates and permission controls; provider-native approvals differ in semantics.

**Required direction:** a provider-neutral approval state machine with explicit resume semantics.

### G8 — Cancellation and uncertain outcome
**Gap:** provider APIs differ on cancellation and lost responses.

**Required direction:** model `RUNNING`, `INTERRUPTED`, `CANCEL_REQUESTED`, `EFFECT_UNKNOWN`, `COMPLETED`, `FAILED` explicitly. Never infer external non-effect from a transport error.

## 5. Agent Contract proposal

Conceptual contract:

```yaml
agent_role:
  id:
  role:
  contract_version:
  competencies:
  prohibited_substitutions:
  evidence_requirements:

execution_provider:
  provider_id:
  adapter_version:
  capabilities:
  lifecycle:
  environment:
  trust_class:

authority:
  mission_id:
  role_id:
  provider_id:
  capability:
  scope:
  expires_at:
  approval_ref:

execution:
  run_id:
  parent_run_id:
  input_ref:
  status:
  cancellation:
  result_ref:

evidence:
  receipt_ids:
  trace_refs:
  artifact_refs:
  provider_evidence_refs:
```

The important architectural rule is that `agent_role` remains provider-neutral.

## 6. Provider Adapter proposal

Required adapter operations:

- `capabilities()`
- `start()`
- `resume()`
- `interrupt()`
- `cancel()`
- `status()`
- `collect_result()`
- `collect_evidence()`
- `health()`

The adapter must not decide MCF authority. It receives already-authorized work and returns structured status/evidence.

## 7. Evidence Contract proposal

Minimum normalized evidence:

```yaml
evidence:
  evidence_id:
  mission_id:
  run_id:
  provider_id:
  agent_role_id:
  action:
  observed_at:
  source:
  artifact_refs:
  provider_trace_refs:
  outcome:
  integrity:
  limitations:
```

Rule: evidence proves what was observed; evidence does not grant new authority.

## 8. Authority / Approval model

Recommended decision flow:

```
Mission intent
  -> AgentRole selection
  -> Provider selection
  -> Capability binding
  -> Authority validation
  -> Human approval if required
  -> Provider adapter
  -> Execution
  -> Evidence normalization
  -> Reconciliation
  -> Handoff / close
```

A provider must never be able to elevate its own permissions.

Human approval should be single-purpose/contextual and resumable, not a reusable blanket permission.

## 9. Primary provider evidence

### Dots
OpenAI describes Dots as always-on agents with their own cloud computer, ongoing responsibility, connected apps, memory, scheduled tasks, background research, pause controls and configurable confirmation rules. Dots can optionally access a user's local computer, and can create Codex cloud tasks. citeturn0search0turn5search0

### ChatGPT Work
OpenAI describes Work as an agent for longer tasks that can research, analyze, work across connected apps/files, create finished artifacts, ask for approvals, and run scheduled or event-triggered tasks. citeturn3search1turn3search2

### Codex
OpenAI describes Codex as an engineering agent that can plan, modify code, test, prepare PRs, run multiple agents in parallel and perform background work. OpenAI also describes computer use and long-running workflows. citeturn0search2turn0search8turn0search15

### OpenAI Agents SDK/API
OpenAI's Agents SDK explicitly separates agent definitions, runtime loops, handoffs, guardrails/human review, state/continuation, sandboxing and tracing. OpenAI also distinguishes the SDK (application-owned runtime) from the managed Agents API harness. citeturn4search0turn4search5

### MCP
OpenAI documents remote and local MCP as an interoperability mechanism for extending agents with external capabilities, including explicit approval controls. citeturn4search3turn4search11

## 10. Hypotheses

### H1 — CONFIRMED
Separating Agent Role from Execution Provider is supported by the existing MCF role model plus the provider diversity observed in Dots, Work, Codex and the Agents SDK.

### H2 — INCONCLUSIVE
The MCF architecture is compatible with a control-plane position, but direct adapter implementations for Dots/Work/Codex were not authorized or tested in this mission.

### H3 — CONFIRMED
Authority, evidence, handoff and governance are meaningful independent concerns. MCF already treats them as first-class governance/runtime concerns, while providers expose execution-specific semantics.

### H4 — CONFIRMED
Computer, browser, memory and background execution vary by provider and therefore should be modeled as capabilities/bindings of execution providers rather than hard-coded MCF primitives.

### H5 — INCONCLUSIVE
Persistent/background agents clearly add lifecycle and scheduler requirements. The available evidence does not justify claiming that MissionRuntime can be extended without any structural refactor.

## 11. Threat model

| Threat | Control |
|---|---|
| Provider escalates authority | Authority validated before adapter invocation |
| Provider trace mistaken for MCF authority | Separate evidence from authorization |
| Lost response causes duplicate external effect | EFFECT_UNKNOWN + reconciliation before retry |
| Stale approval reused | Context-bound, single-use approval |
| Cross-provider identity confusion | Stable AgentRole ID + provider/run identity |
| Provider-specific prompt changes governance | Governance remains outside provider prompt |
| Background task exceeds original scope | Revalidate authority at each material effect |
| Memory leaks across provider boundaries | Explicit memory scope + provenance |
| Adapter silently changes semantics | Contract version + capability declaration + conformance tests |
| Kill switch only stops UI, not execution | Provider lifecycle status must be reconciled with MissionRuntime |

## 12. Compatibility disposition

### PRESERVE
- MissionRuntime
- canonical 29-agent role registry
- Skill registry
- Human Delegation Firewall
- Permission Engine
- Evidence Validator
- receipts/event ledger
- handoffs/checkpoints/gates/CAF/PRF
- human authority boundaries
- existing local execution provider

### INTENTIONAL_CHANGE — future authorization required
- formal Agent Contract
- formal Execution Provider contract
- Provider Adapter Layer contract
- normalized Evidence Contract
- contextual Authority Envelope
- lifecycle state model for long-running/provider-managed work
- provider-neutral scheduler interface

### NOT_TOUCHED
- current production runtime
- production deployment
- canonical agent contracts
- Governance v2 activation
- Mission Control implementation
- provider production credentials

### BLOCKED
- provider-specific production adapters
- Dots/Work/Codex production integration
- schema/runtime mutation
- deployment or merge as an implementation step

## 13. Architecture options

### Option A — Provider-specific integrations
Lowest initial abstraction, highest long-term coupling.

### Option B — MCF Control Plane + Provider Adapter Layer
Separates governance/orchestration from execution and matches the current MCF direction.

### Option C — MCF as one peer harness
Simpler boundary but duplicates capabilities already supplied by external runtimes and weakens the value of MCF governance.

### Proposed ADR position
Use **Option B as the target architecture**, but keep it **PROPOSED / NOT AUTHORIZED FOR IMPLEMENTATION**.

## 14. ADR — proposed

**ADR title:** MCF as provider-independent governance/orchestration control plane.

**Decision status:** PROPOSED — HUMAN_GATE REQUIRED.

**Decision:** Formalize a provider-neutral contract boundary between MCF governance/orchestration and execution providers. Preserve provider-specific features behind adapters.

**Why:** the ecosystem now contains multiple execution surfaces with overlapping but non-identical lifecycle, computer-use, memory, scheduling, approval and tracing semantics. A provider-neutral control plane prevents MCF from becoming coupled to any one execution surface.

**Non-goals:** reproducing Dots, Work or Codex UX; replacing their runtimes; implementing provider adapters in this mission.

## 15. Evaluation plan

Before implementation authorization:

1. Conformance test an abstract Provider Adapter against a fake provider.
2. Prove role/provider separation with the same AgentRole routed to two fake providers.
3. Prove approval scope cannot cross provider/run boundaries.
4. Simulate provider timeout -> EFFECT_UNKNOWN -> reconciliation -> safe continuation.
5. Simulate provider restart during a long-running mission.
6. Verify evidence normalization preserves provider provenance.
7. Verify cancellation is reconciled rather than assumed.
8. Run a provider compatibility matrix for Dots, Work, Codex and one local runtime.
9. Run Emily independent audit against the resulting artifacts.
10. Require HUMAN_GATE before runtime/schema implementation.

## 16. HUMAN_GATE package

**Question for LEANDRO:**

Should the MCF formally adopt the architectural direction:

> **MCF = provider-independent governance + orchestration control plane; external harnesses/runtimes = execution providers behind adapters.**

Decision remains human-owned.

**Current recommendation from the research:** treat this as the target architecture, not as an implementation authorization.

**Implementation authorization:** FALSE.
