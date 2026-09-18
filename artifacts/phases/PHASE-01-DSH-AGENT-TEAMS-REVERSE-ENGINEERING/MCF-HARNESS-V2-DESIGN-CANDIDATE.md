# MCF Multi-Agent Harness V2 — Design Candidate

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
Status: DESIGN_CANDIDATE — NOT IMPLEMENTATION AUTHORIZATION  
Date: 2026-09-18

## Objective

Make mission state durable so a process may crash, restart or change executor without losing authoritative coordination state.

## Target architecture

```text
LEANDRO
   |
HUMAN GATES
   |
MCF Mission Control
   | commands
Mission Journal (append-only + idempotency)
   | replay
Mission Projections (roster/tasks/mail/tools/artifacts/budget/gates)
   | ready tasks
Scheduler (leases + budget + dependencies)
   | executor-neutral packets
   +--> Bubble adapter
   +--> Ollama adapter
   +--> DeepSeek DSH adapter
   +--> Brainbase/other adapter
              |
       receipts/tool evidence
              |
        Mission Journal
```

## Core design

### Mission Journal

Canonical event families:

```text
mission/opened
agent/provisioning | agent/active | agent/failed
task/created | task/updated | task/leased | task/lease-renewed | task/released
tool/requested | tool/completed | tool/failed
message/queued | message/delivered
artifact/recorded
execution/started | execution/completed | execution/failed
gate/requested | gate/decided
mission/checkpoint
```

Each event carries event_id, mission_id, seq, schema_version, timestamp, actor_id, authority_context, idempotency_key, causation_id, correlation_id, payload_digest and payload.

### Projections

`RosterProjection`, `TaskBoardProjection`, `MailboxProjection`, `ToolEvidenceProjection`, `ArtifactProjection`, `BudgetProjection`, `GateProjection`, `ExecutionProjection`.

A projection failure is a visible mission fault. Invalid events are never silently skipped.

### Task board

Every task has revision and mutations require `expected_revision`. Proposed states: `pending`, `ready`, `leased`, `running`, `blocked`, `completed`, `failed`, `cancelled`, `tombstoned`. Dependencies form a validated DAG.

### Ownership lease — improvement over DSH

```text
owner_id + lease_id + lease_until + heartbeat_seq
expired lease -> recovery_required
```

Recovery may release/reassign/escalate according to risk class.

### Durable mailbox

```text
append message/queued -> flush
dispatcher -> target inbox(idempotency=message_id)
target persists receipt
append message/delivered
```

Transport adapters remain stateless. A persistent dispatcher can survive coordinator process changes.

### Executor adapter contract

```text
doctor()
provision_agent()
start_task()
interrupt()
resume()
collect_events()
dispose()
```

Executor evidence includes executor_run_id, agent_id, task_id, tool calls, artifact refs, timestamps, finish reason and resource usage.

### Tool Capability Contract

MCF should be stricter than DSH's same Team tool set: baseline agent capability -> permission profile -> task-specific narrowing -> runtime availability -> evidence requirement.

### Workspace isolation

Code-writing tasks should default to task-specific worktree/sandbox. Shared sources can be read-only; overlapping writes require reconciliation.

### Resource accounting

Aggregate root plus every worker: model tokens, wall/tool time, calls, failures, retries, queue time, active concurrency, artifact bytes and cost when applicable.

### Single lifecycle owner

One MCF mission domain owns roster/task lifecycle. Executor-native team controls are hidden behind adapters to avoid competing lifecycle owners.

## Compatibility

```text
V1 AgentPacket -> compatibility adapter -> V2 commands -> V2 journal
```

No mission is silently upgraded without runtime/schema version evidence.

## Prototype recommendation

Prototype first: journal, replay projections, CAS tasks, DAG, durable mailbox, leases, executor adapter API, task-scoped tool capability contracts, teammate-inclusive telemetry and optional workspace isolation.

Defer distributed multi-node scheduling, nested teams, speculative decomposition and production activation until prototype evidence exists.