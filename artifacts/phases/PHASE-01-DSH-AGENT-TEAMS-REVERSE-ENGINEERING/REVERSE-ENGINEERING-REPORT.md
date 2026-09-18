# Phase 1 — DeepSeek Harness + Agent Teams Reverse Engineering

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
Parent: `MCF-MEMORY-LIVE-NEXT-STABLE-001` / Issue #164  
Authority: LEANDRO  
Coordinator: MESTRE  
Date: 2026-09-18  
Status: RESEARCH_EVIDENCE_CANDIDATE

## Scope and provenance

Primary source studied: `deepseek-ai/deepseek-harness`, default branch `master`, observed around commit `ddefc45fbc7f8e46dd73185e68295696d1297887`.

Key paths inspected: Agent Teams README/types/projection/journal/mailbox/task-board/task-graph/activity/lifecycle/roster, Team tools/profile patch, capability seams, Python SDK README and LICENSE.

No third-party source code is copied into MCF by this phase. The observed repository license is MIT; this phase adopts architecture concepts, not source text.

## Executive finding

```text
CURRENT MCF HARNESS
threads/processes -> model -> tool -> artifact -> manifest

DSH AGENT TEAMS
command -> durable append -> flush -> projection/replay
        -> side effect -> durable acknowledgement -> current view
```

The highest-value improvement is not more threads. It is durable event-sourced mission coordination with disposable executors.

## Confirmed mechanisms

| Mechanism | Confirmed behavior | Value for MCF |
|---|---|---|
| Implicit Team identity | Team id equals root Session id | stable team identity |
| Immutable roster identity | name/provider/context cannot silently change | provenance |
| Provisioning lifecycle | provisioning -> active/failed | crash-safe spawn reconciliation |
| Durable journal | Team events are flushed before success | state survives process death |
| Strict projection | current state replays committed events | corruption is visible |
| Per-root transaction tail | mutations serialized per Lead | avoids intra-process write races |
| Task revisions + CAS | every mutation increments revision and requires expectedRevision | no silent overwrite |
| Task DAG | dependencies are validated | native multitask graph |
| Durable mailbox | queue+flush precede delivery | safe retry |
| Delivery acknowledgement | target durable receipt precedes delivered edge | dedup after crash |
| Target-local ordering | dispatch serialized per target | stable mailbox order |
| Wait-not-poll | state change wakes waiters | lower churn |
| Lifecycle cutoff | one AbortSignal closes admission | controlled shutdown |
| Bounded disposal | cleanup deadline is explicit | no infinite teardown |
| Scoped tools | Team tools only on Team members | authority control |
| Conflict removal | overlapping legacy subagent controls disabled | one lifecycle owner |
| Capability seams | storage/tools/session/jobs/sandbox are swappable | extensibility |
| SDK subprocess boundary | Python drives DSH through JSON-RPC/stdio | executor isolation |

## Limitations we should not inherit

- one process owns a Team; no cross-process consensus;
- shared checkout; no worktree/file locking;
- write scopes are advisory;
- flat roster only;
- task ownership is not automatically released on worker death/idle;
- mailbox is not cross-process exactly-once;
- Agent Teams remains experimental;
- recent upstream reports show Agent Teams conflicts with some one-shot/workflow children;
- recent upstream report shows teammate token accounting can be incomplete.

## Gap analysis

| DSH mechanism | MCF current | Gap | Decision |
|---|---|---|---|
| durable Team journal | checkpoints + run artifacts | no event-level runtime truth | ADOPT concept |
| projection from journal | ad-hoc reconstruction | no canonical replay state | ADOPT |
| task revision CAS | static packets/dicts | no concurrent task mutation protocol | ADOPT |
| durable mailbox | textual handoffs | no ack/dedup delivery | ADOPT + improve |
| wait-for-change | future completion | no durable change notification | ADOPT |
| provisioning recovery | process futures | spawn crash loses lifecycle fact | ADOPT |
| scoped tools | shared tool registry | weak per-task narrowing | ADOPT + least privilege |
| disable overlapping orchestrators | several execution paths | lifecycle ambiguity risk | ADOPT invariant |
| subprocess SDK boundary | embedded scripts | runtime coupling | ADOPT |
| shared checkout | shared CI checkout | overlapping writes | IMPROVE with isolation |
| process-local serialization | ThreadPool/process memory | no multi-process safety | IMPROVE |
| advisory write scopes | partial path allowlists | not hard ownership | IMPROVE |
| no task lease | no durable owner today | future stale-owner risk | IMPROVE |
| experimental DSH schemas | MCF owns contracts | upstream lock-in | DO NOT COPY API |

## Reverse-engineering conclusion

```text
DURABLE COMMAND
 -> VALIDATE AUTHORITY
 -> APPEND EVENT
 -> FLUSH
 -> PROJECT
 -> EXECUTE SIDE EFFECT
 -> APPEND RECEIPT/ACK
 -> PROJECT
 -> EXPOSE CURRENT VIEW
```

MCF should reproduce these properties behind executor-neutral contracts. ChatGPT sandbox, Ollama, DeepSeek Harness, Brainbase or another runtime should be adapters, not mission truth.