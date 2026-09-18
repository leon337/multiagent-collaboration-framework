# MCF DeepSeek Harness Agent Teams Executor

Status: EXPERIMENTAL_BACKEND_ADAPTER  
Authority: LEANDRO  
Coordinator: MESTRE

## Decision

MCF remains the governance/source-of-truth layer. DeepSeek Harness Agent Teams may be used as an execution backend for real multi-agent and multi-task work.

```text
LEANDRO
   ↓
MCF mission / gates / evidence
   ↓
Bubble Executor
   ↓
DSH Agent Team Adapter
   ↓
DeepSeek Harness root Lead (MESTRE)
   ├─ durable teammate sessions
   ├─ mailbox
   ├─ shared task DAG
   ├─ task ownership/revision
   └─ wait/resume/interruption
   ↓
receipts/events/checkpoint back to MCF
```

## Why use the native Agent Teams backend

The official DeepSeek Harness experimental Team domain provides durable teammate identity, peer messaging, a shared task board with dependencies, continuable child sessions and explicit model-facing tools. This removes custom scheduling/state machinery from MCF while preserving MCF authority and audit rules.

Expected native tools:
- `list_agents`
- `spawn_teammate`
- `send_message`
- `team_task_create`
- `team_task_get`
- `team_task_list`
- `team_task_update`
- `wait_agent`
- `interrupt_agent`

## Safety gate

This backend is NOT assumed healthy merely because `dsh` or the Python SDK is installed.

Execution requires:
- `deepseek-harness-sdk` importable;
- explicit `DSH_HOME`;
- configured provider endpoint/credential;
- a DSH profile where the official experimental Agent Teams bundle has been enabled and validated;
- `MCF_DSH_AGENT_TEAM_READY=1` only after a health/smoke test.

If any precondition is missing, the adapter returns `DSH_AGENT_TEAM_UNAVAILABLE` and claims no teammate execution.

## Version strategy

DeepSeek Harness is pre-stable. The MCF integration must pin a tested DSH/runtime/plugin version tuple and record it in the execution receipt. Do not silently float to a new prerelease.

Recent upstream reports show incompatibilities in some Agent Teams combinations. Therefore:
- do not mix legacy subagent/workflow controls with Agent Teams until the selected tuple passes smoke tests;
- use an isolated `DSH_HOME`;
- do not make DSH Agent Teams the sole executor until regression coverage proves recovery/resume/task DAG behavior.

## MCF mapping

Stage A tasks are created with no peer dependency and may run concurrently.

Stage B fan-in tasks explicitly depend on all required Stage A task ids. Durable task state is execution evidence but does not by itself authorize implementation or production.

## Tests

Unit:
- Stage A dependency-free;
- Stage B blockers complete;
- prompt names only expected native Team controls;
- unavailable DSH never claims execution.

Integration (when DSH is available):
- create isolated DSH home;
- enable pinned Agent Teams profile;
- spawn two synthetic teammates;
- create two independent tasks;
- verify both durable member events and task states;
- create one fan-in task blocked by both;
- resume same Team session after process restart;
- verify task board + mailbox recovery.
