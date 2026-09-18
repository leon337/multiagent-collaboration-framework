# CHECKLIST — MCF Harness Graph Engine 2.2

Legend: `[x]` concluído · `[~]` parcial · `[ ]` pendente.

## G0 — Governança
- [x] G001 — Issue própria (#241).
- [x] G002 — Branch própria sobre main.
- [x] G003 — Missão separada do hardening #239.
- [x] G004 — main protegida.
- [x] G005 — merge exige HUMAN_GATE.

## G1 — Graph Definition / Journal
- [x] G101 — schema `mcf_graph/v1`.
- [x] G102 — node IDs estáveis.
- [x] G103 — dependências explícitas.
- [x] G104 — referência inexistente falha fechado.
- [x] G105 — ciclo falha fechado.
- [x] G106 — graph lifecycle events.
- [x] G107 — node lifecycle events.
- [x] G108 — replay/projection do graph.

## G2 — Scheduler
- [x] G201 — detectar nós READY.
- [x] G202 — fan-out independente.
- [x] G203 — fan-in por dependência.
- [x] G204 — lease/CAS por nó via MissionRuntime.
- [x] G205 — backpressure via LocalRuntimePool.
- [x] G206 — PASS exige receipt.
- [x] G207 — failure bloqueia dependentes e falha o graph.
- [x] G208 — scheduling determinístico por dependências/ordenação estável.

## G3 — Bounded Loops
- [x] G301 — max_iterations obrigatório.
- [x] G302 — timeout obrigatório.
- [x] G303 — execute/validate/repair.
- [x] G304 — eventos/evidence por iteração no Journal.
- [x] G305 — loop exhaustion fail-closed.
- [x] G306 — replay do loop após reopen.

## G4 — Runtime Pool
- [x] G401 — slot accounting.
- [x] G402 — adaptive team size usando runtime_metrics.policy().
- [x] G403 — slot backpressure + prova multiprocesso em CI.
- [x] G404 — pool acquire/release events no Mission Journal.
- [x] G405 — no cognitive-agent claim (`cognitive=false`).

## G5 — E2E
- [x] G501 — START → TEST_A/B/C → AUDIT → END.
- [x] G502 — 3 runtime cells / 3 PIDs / pico 3.
- [x] G503 — fan-in só após três testes.
- [x] G504 — bounded repair loop max 3.
- [x] G505 — failure injection impede AUDIT e falha graph.
- [x] G506 — graph/loop/pool replay após reopen.

## Gate
- [~] unit tests verdes — Harness CI do head anterior PASS; head atual em validação.
- [~] integration tests verdes — E2E multiprocesso PASS no head anterior; head atual em validação.
- [~] CI exact-head — aguardando head `804a97a2…`.
- [~] Production Readiness — aguardando head `804a97a2…`.
- [ ] HUMAN_GATE para merge.
