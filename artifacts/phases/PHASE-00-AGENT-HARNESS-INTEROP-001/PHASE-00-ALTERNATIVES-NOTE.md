# PHASE-00 ALTERNATIVES NOTE — Control Plane / Durable Execution

**Mission:** MCF-AGENT-HARNESS-INTEROP-001
**Scope:** research/design only
**Implementation authorization:** FALSE

## 1. Why alternatives matter

The mission asks whether MCF should remain a provider-specific harness or become a provider-independent governance/orchestration control plane. Existing systems show that these concerns can be separated in several ways.

## 2. Temporal — durable execution substrate

Temporal defines durable Workflow Executions backed by event history. Workflows can resume after crashes or outages, and its AI guidance includes human approval, long-running activities, cancellation and saga patterns.

Sources:
- https://docs.temporal.io/temporal
- https://docs.temporal.io/ai
- https://docs.temporal.io/tasks

Assessment:
- Temporal is strongest as a durable execution substrate.
- It does not by itself provide MCF's agent-role registry, human governance model, provider-neutral agent contract, or evidence semantics.
- MCF could conceptually use a durable execution substrate underneath MissionRuntime in a future design, but that is outside this mission and requires separate authorization.

## 3. MCP — capability interoperability layer

The MCP ecosystem provides standardized client/server lifecycle, transports, authorization, tools and other interoperability primitives. MCP authorization can protect an entire server or individual tools with OAuth-based controls.

Sources:
- https://modelcontextprotocol.io/
- https://go.sdk.modelcontextprotocol.io/
- https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html

Assessment:
- MCP is complementary to the proposed Provider Adapter Layer.
- MCP answers how agents access capabilities; it does not by itself answer who is authorized to run a mission, which provider should execute it, how mission authority persists, or how cross-provider evidence is reconciled.
- MCF should therefore treat MCP as a capability/interoperability mechanism, not as a replacement for mission governance.

## 4. OpenAI Symphony — orchestration pattern

Symphony demonstrates an agent orchestration model in which project-management state becomes a control plane for continuously running coding agents. It decouples work from sessions and pull requests and includes restart/recovery behavior.

Source:
https://openai.com/index/open-source-codex-orchestration-symphony/

Assessment:
- This is the closest newly documented architectural analogue to MCF's control-plane thesis.
- Symphony is coding-focused; MCF's proposed scope is broader because it includes human authority, evidence, cross-provider routing, mission contracts and governance.
- The important shared principle is durable work identity independent of a transient agent session.

## 5. OpenAI Agents SDK / Agents API — managed/application harnesses

The Agents SDK provides an application-owned agent runtime with handoffs, guardrails, human review, resumable state and tracing. The Agents API provides a managed harness.

Sources:
- https://developers.openai.com/api/docs/guides/agents/sdk
- https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- https://developers.openai.com/api/docs/guides/agents/integrations-observability

Assessment:
- These are execution runtimes, not provider-neutral governance planes.
- Their built-in approvals and traces should be mapped into MCF evidence/approval boundaries rather than assumed to be equivalent to MCF authority.

## 6. Comparative boundary

| System | Primary concern | Durable work state | Human approval | Provider-neutral governance |
|---|---|---:|---:|---:|
| MCF | Mission governance + orchestration | Yes | Yes | Proposed |
| Dots | Persistent personal agent execution | Yes | Yes | No |
| ChatGPT Work | Long-form task execution | Yes | Yes | No |
| Codex | Engineering/agent execution | Yes | Yes/review | No |
| Agents SDK/API | Agent runtime/harness | Yes/stateful | Yes | SDK/API-specific |
| Symphony | Coding-agent orchestration | Yes | Human review | Task/orchestration-specific |
| Temporal | Durable workflow execution | Yes | Pattern support | Runtime substrate |
| MCP | Capability interoperability | Session/tool lifecycle | Auth/approval mechanisms | Protocol-level, not mission governance |

## 7. Architectural conclusion for this mission

The alternatives reinforce a layered architecture:

1. Mission/governance plane
2. Agent contract
3. Provider adapter boundary
4. Execution runtime
5. Capability/tool protocols such as MCP
6. Evidence/reconciliation returning upward

The mission should avoid turning MCF into a duplicate of Temporal, MCP, Symphony, Dots, Work, Codex or an Agents runtime. Those systems solve overlapping but different layers.

## 8. Implementation boundary

This note is architectural research only. It does not authorize:
- Temporal adoption
- MCP runtime changes
- provider adapters
- Agent Contract schema changes
- MissionRuntime refactoring
- production changes
- deployment or merge of implementation code

Any such change remains subject to the existing HUMAN_GATE and separate implementation authorization.
