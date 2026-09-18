# ROADMAP — MCF Harness Graph Engine 2.2

Mission: `MCF-HARNESS-GRAPH-ENGINE-2.2-001`  
Issue: #241  
Authority: LEANDRO  
Coordinator: MESTRE  
Base: `main` / Harness V2 `2.0.0`  
Runtime boundary: ChatGPT bubble local sandbox

## G0 — Fundação da missão
- Issue/branch/checkpoint próprios.
- Main protegida.
- Feed vivo independente.
- Sem mistura com PR #239.

Status: **PASS**

## G1 — Graph Journal + Graph Definition
- schema do graph;
- node IDs estáveis;
- dependências explícitas;
- validação de referências;
- rejeição de ciclos;
- eventos duráveis de lifecycle.

Status: **IN_PROGRESS**

## G2 — Graph Scheduler
- READY derivado do graph;
- fan-out apenas entre nós independentes;
- fan-in por dependências;
- CAS/lease via runtime existente;
- nenhum PASS sem receipt.

Status: **PENDING**

## G3 — Bounded Loop Controller
- max_iterations obrigatório;
- timeout obrigatório;
- budget opcional;
- execute → validate → repair;
- saída explícita PASS/FAIL/BLOCKED.

Status: **PENDING**

## G4 — Local Runtime Pool
- limite de slots;
- integração com runtime_metrics;
- expansão/redução adaptativa;
- backpressure;
- sem claim cognitivo.

Status: **PENDING**

## G5 — MVP E2E
Primeira prova:

```text
        ┌→ TEST_A ─┐
START ──┼→ TEST_B ─┼→ AUDIT → END
        └→ TEST_C ─┘
```

Segunda prova:

```text
CODE → TEST → (FAIL ? REPAIR → TEST : PASS)
              max_iterations = 3
```

Status: **PENDING**

## G6 — Gate
- unit tests;
- integration tests;
- receipts;
- Mission Journal evidence;
- exact-head CI;
- HUMAN_GATE antes de merge.

Status: **PENDING**

## Fora do MVP
- graph-of-graphs;
- speculative execution;
- shadow runtime;
- promoção automática;
- efeitos externos sem gate.
