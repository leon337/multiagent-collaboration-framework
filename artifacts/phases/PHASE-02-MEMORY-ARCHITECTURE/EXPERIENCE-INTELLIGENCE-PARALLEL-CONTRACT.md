# Experience Intelligence Layer — Parallel Discovery Contract

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
Authority: LEANDRO  
Coordinator: Mestre  
State: `DISCOVERY_EXECUTION_PREPARED`

## Purpose

Replace specialist dependency chains during discovery/design with a fan-out/fan-in model.

```text
Mestre
  ├─ Miriam
  ├─ Sofia
  ├─ Manoel
  ├─ Ricardo
  ├─ Júlia
  ├─ Beatriz
  ├─ Augusto
  └─ Emily
       ↓
deterministic fan-in manifest
       ↓
later consolidation / audit / gate
```

No specialist receives another specialist's output during fan-out.

## Valid specialist execution

A specialist output is eligible for fan-in only when all are present:

1. distinct execution UUID;
2. role-bound work packet;
3. at least one actual read-only tool request selected by that execution;
4. harness-recorded tool observation digest;
5. non-empty role artifact with required headings;
6. artifact SHA-256;
7. no simulated external action.

Invariant:

```text
AGENT_ASSIGNED
  + REAL_EXECUTION
  + TOOL_CALL_EVIDENCED
  + ARTIFACT_DIGEST
  = FAN_IN_ELIGIBLE
```

## Tool boundary

Allowed fallback tools are read-only:

- repository text search;
- repository file read;
- repository file listing;
- Git history read;
- HTTPS fetch to a fixed public allowlist.

No credentials, provider mutation, private Ledger content, shell requested by the model, arbitrary URL or write operation is exposed.

Tool output is explicitly treated as untrusted data.

## Failure semantics

One specialist failure does not stop peer executions. All submitted fan-out tasks are allowed to finish. After collection:

- any missing specialist evidence -> workflow fails;
- successful peers retain their evidence;
- no phase gate may be inferred from partial success;
- `FALSE_GREEN=NO`.

## Brainbase relationship

LEANDRO authorized Brainbase billable runs for this mission on 2026-09-18. Brainbase is the preferred managed executor when available.

Current observed provider state during pilot:

```text
BILLING_UNAVAILABLE
HTTP 503
MODEL_EXECUTION=NO
TOOL_CALL_EXECUTION=NO
```

Therefore this GitHub/Ollama harness is a contingency executor, not a replacement architectural commitment. Brainbase and the fallback must obey the same evidence contract.

## Non-authorization

This artifact does not authorize:

- Cognitive Ledger live mutation;
- production deployment;
- secrets use;
- real private memory in CI;
- release publication;
- automatic institutionalization of any agent conclusion.

Discovery evidence remains advisory until MCF governance and human gates accept it.
