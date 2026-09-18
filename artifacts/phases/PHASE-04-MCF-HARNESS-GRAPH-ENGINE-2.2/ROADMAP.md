# ROADMAP — MCF Harness Graph Engine 2.2

Mission: `MCF-HARNESS-GRAPH-ENGINE-2.2-001`  
Issue: #241  
PR: #242 — **MERGED**  
Authority: LEANDRO  
Coordinator: MESTRE  
Runtime boundary: ChatGPT bubble local sandbox

## G0 — Fundação
Status: **PASS**

Issue, branch, cockpit feed e PR próprios. Main protegida e Graph Engine separado do hardening #239.

## G1 — Graph Journal + Graph Definition
Status: **PASS**

- `mcf_graph/v1`;
- node IDs estáveis;
- dependências explícitas;
- missing refs/ciclos fail-closed;
- materialização topológica e idempotente;
- lifecycle durável no Mission Journal;
- projection/replay;
- crash reconciliation de lease e completion.

## G2 — Graph Scheduler
Status: **PASS**

- `GraphScheduler` explícito;
- READY derivado de dependências;
- fan-out apenas entre nós independentes;
- fan-in por dependência;
- lease/CAS via MissionRuntime;
- Runtime Pool backpressure;
- receipt obrigatório e vinculado ao lease owner;
- failure bloqueia dependentes;
- scheduling determinístico.

## G3 — Bounded Loop Controller
Status: **PASS**

- max_iterations obrigatório;
- timeout obrigatório;
- budget opcional;
- execute → validate → repair;
- evidência obrigatória em fail/repair/PASS;
- exhaustion fail-closed;
- replay após reopen.

## G4 — Local Runtime Pool
Status: **PASS**

- slot accounting;
- `runtime_metrics.policy()`;
- expansão/redução adaptativa;
- backpressure;
- 4 processos concorrendo por 2 slots;
- run_id não pode mudar task/worker;
- pool não encolhe abaixo dos slots ativos;
- `cognitive=false`.

## G5 — MVP E2E
Status: **PASS**

```text
        ┌→ TEST_A ─┐
START ──┼→ TEST_B ─┼→ AUDIT → END
        └→ TEST_C ─┘
```

Prova:
- 3 runtime cells;
- 3 PIDs distintos;
- pico de concorrência 3;
- AUDIT só fica READY após TEST_A/B/C;
- failure injection em um ramo impede fan-in de sucesso;
- bounded repair loop passa na terceira iteração;
- três falhas consecutivas encerram por max_iterations.

## G6 — Gate e entrega
Status: **ENTREGUE**

- Human authority LEANDRO autorizou conclusão sem novas confirmações;
- PR #242 saiu de draft e foi mergeado por squash;
- merge commit: `7867b28932183ed3f38c4cc7eb6b8c158ebbea69`;
- Documentation validation na main: **SUCCESS** — run `35396058116`;
- Production Readiness na main: **SUCCESS** — run `35396058156`.

## Fora do MVP

- graph-of-graphs;
- speculative execution;
- shadow runtime;
- promoção automática;
- efeitos externos sem gate.

Esses itens permanecem para ciclos posteriores e não são claims desta entrega.
