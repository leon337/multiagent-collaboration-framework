# MCF Bubble Executor — Persistent Runtime Contract

Status: CANDIDATE — ACTIVE after merge  
Runtime: ChatGPT sandbox / bubble\nExecution boundary: `CHATGPT_BUBBLE_LOCAL_SANDBOX`  
Coordinator: MESTRE  
Human authority: LEANDRO

## Purpose

Make sandbox execution recoverable across chats without requiring LEANDRO to restate the same orchestration rules.

## Canonical rule

The ChatGPT sandbox is **ephemeral compute**, not persistent storage. Therefore:

```text
NEW CHAT
  -> recover mission from GitHub/MCF
  -> materialize mission contract into sandbox
  -> run capability doctor
  -> select allowed executor
  -> execute only what the runtime can prove
  -> emit receipt/checkpoint
  -> persist state back to GitHub/MCF
```

Persistence belongs to GitHub/MCF. The sandbox may cache state for the current conversation, but that cache is never the sole source of truth.

## Executor precedence

1. sandbox-local model executor, when actually installed and available;
2. connected authorized agent executor exposed inside ChatGPT;
3. external governed executor already authorized by the mission;
4. if none exists: `MODEL_EXECUTOR_UNAVAILABLE`, with no simulated subagent credit.

## Anti-simulation invariant

A named agent is credited only when there is attributable real execution evidence. Local worker processes without a cognitive model may support orchestration, validation and receipts, but do not count as independent cognitive agents.

## Automatic recovery contract

For an existing mission, MESTRE should not ask LEANDRO to repeat the execution model if the persistent mission source already contains it. Recovery should read, in order:

1. current LEANDRO instruction;
2. MCF operating instructions;
3. mission issue/PR/checkpoint;
4. this Bubble Executor contract;
5. sandbox capability doctor.

Only unresolved human-reserved gates are escalated.

## Current sandbox capability semantics

The executor reports facts, not assumptions:

- `sandbox_persistent=false` always;
- network availability is probed;
- local model binaries are probed;
- remote API viability is never inferred from SDK presence alone;
- absence of a model executor does not prevent sandbox-side orchestration, validation, evidence packaging or checkpoint generation.

## Tests

Required unit tests:
- authority invariant;
- mission mismatch fail-closed;
- no false local-model claim;
- checkpoint digest generation.

Required integration test:

```text
recover/import contract
 -> prepare-run
 -> checkpoint
 -> restart process
 -> recover same mission state from persisted external contract
```

The last step must use GitHub/MCF or another explicitly authorized persistent source, not rely on the prior sandbox filesystem.


## Reconciled cross-chat proof

The runtime state directory is configurable through `MCF_BUBBLE_STATE_DIR`. The
integration suite uses two different state directories and imports the same
versioned mission contract into each process. This proves recovery from an
external GitHub/MCF contract instead of relying on a previous sandbox cache.

Canonical mission contract:
`context/missions/mcf-memory-live-next-stable.json`.
