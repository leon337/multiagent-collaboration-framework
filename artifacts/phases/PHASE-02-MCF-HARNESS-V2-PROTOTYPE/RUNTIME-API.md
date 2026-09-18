# MCF Harness V2 — Runtime API

## Source of truth

The Mission Journal is authoritative. Executors are disposable adapters.

## Core operations

- task create/update/lease/recovery with revision-CAS and DAG validation;
- durable mailbox queue/delivery;
- durable agent sessions with checkpoint, interrupt and resume;
- execution/tool receipts;
- task workspace isolation and reconciliation gate;
- capability tokens with expiry, narrowing and revocation;
- recovery bundle export/import;
- runtime metrics and adaptive policy.

## Executor boundary

`CognitiveExecutor` defines doctor, provision, start, interrupt, resume, collect and dispose. The validated local process adapter deliberately reports `cognitive=false`.

## Current hard boundary

No independent bubble-native cognitive LLM backend is verified. `G08` remains blocked. No external provider is silently substituted.
