# PHASE-00 ADDENDUM — 2026-10-01

**Mission:** MCF-AGENT-HARNESS-INTEROP-001  
**Scope:** research/design only  
**Implementation authorization:** FALSE  
**Purpose:** reconcile the PHASE-00 report against current primary OpenAI documentation and record material ecosystem changes discovered after the initial report.

## 1. New primary-source findings

### Dots

OpenAI's September 29, 2026 launch description establishes Dots as always-on agents with their own cloud computer and browser, connected apps, persistent context, background/proactive work, configurable action rules, approval flows, and the ability to delegate work into Codex and ChatGPT Work. OpenAI also describes specialist Dots with distinct identities and credentials for organizational responsibilities.

Source:
https://openai.com/index/introducing-dots/

Architectural consequence:
- Dots are an execution/harness surface with persistent lifecycle and provider-native authority controls.
- MCF should treat persistence, scheduling, computer access, connected apps and proactive execution as provider capabilities.
- Dots' own confirmation system is evidence of provider-native policy enforcement; it is not a substitute for MCF authority.

### ChatGPT Work

OpenAI currently describes Work as an agent for longer, multi-step tasks that can research, analyze, use connected apps/files, create finished deliverables, and run scheduled or event-triggered work. Work can pause for approval and continue after review.

Sources:
- https://openai.com/index/chatgpt-for-your-most-ambitious-work/
- https://help.openai.com/en/articles/20001275

Architectural consequence:
- Work has its own task/lifecycle semantics.
- Work Cloud and Work Local are distinct execution surfaces.
- MCF should not assume that a Work task is equivalent to an MCF mission or that Work state is authoritative for MCF governance.

### Codex

OpenAI documents Codex as a long-running, parallel agent environment with isolated worktrees, background automations, computer use, memory/context, and reusable skills. OpenAI's long-horizon guidance explicitly identifies the harness loop and durable externalized state as important to maintaining coherence.

Sources:
- https://openai.com/index/introducing-the-codex-app/
- https://openai.com/index/codex-for-almost-everything/
- https://developers.openai.com/blog/run-long-horizon-tasks-with-codex

Architectural consequence:
- Codex is a strong execution provider candidate for an MCF adapter.
- Worktrees, automation, computer use and memory belong to Codex execution semantics; MCF should consume their status/evidence rather than reproduce them.

### Agents SDK / Agents API

OpenAI's current Agents documentation explicitly distinguishes:
- Agents SDK: the application owns deployment, tools, state storage and approval decisions while the SDK runs the agent loop.
- Agents API: OpenAI runs a managed harness.

The SDK also exposes handoffs, human review, resumable state, sandbox agents and structured tracing.

Sources:
- https://developers.openai.com/api/docs/guides/agents/sdk
- https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- https://developers.openai.com/api/docs/guides/agents/integrations-observability

Architectural consequence:
- The phrase "execution provider" must include both managed and application-owned runtimes.
- A provider adapter needs an explicit ownership/trust classification for state, tools, approvals and traces.
- MCF authority cannot be inferred merely because a provider exposes its own guardrails or approvals.

## 2. Important ecosystem addition: Workspace Agents

OpenAI introduced Workspace Agents in April 2026. They are shared, Codex-powered agents for organizations that run in the cloud and operate inside organizational permissions and controls.

Source:
https://openai.com/index/introducing-workspace-agents-in-chatgpt/

This adds a distinct provider/runtime category to the capability matrix:
- shared organizational agent identity
- long-running cloud execution
- shared context/workflows
- organization-scoped permissions
- governance supplied by the host platform

MCF implication:
AgentRole must remain independent from whether the execution surface is personal, workspace-shared, managed, local, or provider-specific.

## 3. Important ecosystem addition: Symphony

OpenAI published Symphony as an open-source specification for orchestrating coding agents. The documented design turns a project-management system into a control plane for continuously running agents, decouples work from sessions and pull requests, restarts stalled agents, and uses task state/dependencies to drive parallel execution.

Source:
https://openai.com/index/open-source-codex-orchestration-symphony/

This is architecturally relevant because it demonstrates a second control-plane pattern adjacent to MCF:
- task/state system as control plane
- agent sessions as replaceable execution workers
- continuous execution
- restart/recovery
- dependency-aware parallelism

MCF difference:
- MCF's intended control plane is broader than coding orchestration because it includes authority, evidence, human gates, cross-provider routing, and mission governance.
- Symphony therefore validates the general usefulness of separating work state from agent sessions, but does not establish MCF's broader governance model.

## 4. Important correction: ChatGPT Agent mode

OpenAI's current Help Center states that the former ChatGPT Agent mode is no longer available and directs users to ChatGPT Work for longer multi-step tasks.

Source:
https://help.openai.com/pt-br/articles/11752874-chatgpt-agent

MCF implication:
Future capability matrices should use current Work terminology rather than treating legacy "ChatGPT Agent mode" as a separate current provider.

## 5. Refined provider-neutral boundary

    MCF Mission / Governance Plane
            |
            +-- AgentRole
            +-- Authority Envelope
            +-- Capability Binding
            +-- Provider Routing
            +-- Human Approval
            +-- Evidence Contract
            +-- Reconciliation
            |
            v
    Provider Adapter
            |
            +-- Dots
            +-- Work
            +-- Codex
            +-- Agents API
            +-- Agents SDK runtime
            +-- Workspace Agents
            +-- local/self-hosted runtime

The adapter boundary should be treated as a semantic translation boundary, not merely an API wrapper. It must translate lifecycle, identity, authority context, status, cancellation, result and evidence semantics while preserving provenance.

## 6. New risk identified: control-plane collision

Two systems can both claim to be a control plane:
- MCF may govern a mission.
- A provider may govern its own execution.

Therefore the contract must explicitly distinguish:

1. Mission authority — what MCF/LEANDRO authorizes.
2. Provider execution policy — what the provider permits or blocks.
3. Tool/application permissions — what the connected capability permits.
4. Human approval state — whether a specific consequential action is approved.
5. Observed execution state — what actually happened.

A provider denial must not be interpreted as an MCF authorization change. An MCF approval must not bypass provider safety or workspace controls.

## 7. Revised acceptance tests

Before any implementation authorization, add these tests to the evaluation plan:

- Same AgentRole routed to two providers with different lifecycle semantics.
- Provider policy denial versus MCF authorization: verify they remain separate facts.
- Provider approval granted but MCF approval absent: action remains unauthorized by MCF.
- MCF approval granted but provider refuses execution: mission remains authorized but execution fails/blocks.
- Provider loses connectivity after a possible side effect: state becomes EFFECT_UNKNOWN until reconciled.
- Provider reports completion with trace/artifact evidence: normalize provenance without elevating evidence to authority.
- Provider restarts an execution: preserve mission/run lineage and prevent duplicate effects.
- Workspace/shared agent identity differs from personal AgentRole: preserve both identities explicitly.
- Provider scheduler triggers work after original authority expiry: reject or require renewed authorization.

## 8. Updated architectural assessment

The new primary sources do not invalidate the PHASE-00 direction. They increase the importance of making the provider boundary explicit.

The strongest evidence now supports these statements:

- Agent roles and execution runtimes are distinct concepts.
- Persistent/background execution creates lifecycle semantics that a governance plane must reconcile.
- Provider-native approvals and policies cannot be assumed equivalent to MCF authority.
- Provider traces and artifacts are evidence inputs, not authority.
- Long-running execution requires durable mission/run identity independent of a single chat/session.
- A provider adapter needs lifecycle and evidence semantics, not just request/response translation.
- The MCF target architecture remains PROPOSED / HUMAN_GATE REQUIRED / NOT AUTHORIZED FOR IMPLEMENTATION.

## 9. Status

This addendum is research evidence only.

No runtime, schema, provider integration, production deployment, credentials, or implementation behavior was changed by this addendum.
