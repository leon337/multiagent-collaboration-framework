# CHECKLIST — MCF Harness Graph Engine 2.2

Legend: `[x]` concluído · `[~]` parcial · `[ ]` pendente.

## G0 — Governança
- [x] G001 — Issue própria (#241).
- [x] G002 — Branch própria sobre main.
- [x] G003 — Missão separada do hardening #239.
- [x] G004 — main protegida.
- [x] G005 — merge exige HUMAN_GATE.

## G1 — Graph Definition / Journal
- [ ] G101 — schema `mcf_graph/v1`.
- [ ] G102 — node IDs estáveis.
- [ ] G103 — dependências explícitas.
- [ ] G104 — referência inexistente falha fechado.
- [ ] G105 — ciclo falha fechado.
- [ ] G106 — graph lifecycle events.
- [ ] G107 — node lifecycle events.
- [ ] G108 — replay/projection do graph.

## G2 — Scheduler
- [ ] G201 — detectar nós READY.
- [ ] G202 — fan-out independente.
- [ ] G203 — fan-in por dependência.
- [ ] G204 — lease/CAS por nó.
- [ ] G205 — backpressure.
- [ ] G206 — PASS exige receipt.
- [ ] G207 — failure bloqueia dependentes.
- [ ] G208 — deterministic scheduling.

## G3 — Bounded Loops
- [ ] G301 — max_iterations obrigatório.
- [ ] G302 — timeout obrigatório.
- [ ] G303 — execute/validate/repair.
- [ ] G304 — loop receipt por iteração.
- [ ] G305 — loop exhaustion fail-closed.
- [ ] G306 — loop recovery after interruption.

## G4 — Runtime Pool
- [ ] G401 — slot accounting.
- [ ] G402 — adaptive team size.
- [ ] G403 — queue/backpressure.
- [ ] G404 — process lifecycle receipts.
- [ ] G405 — no cognitive-agent claim.

## G5 — E2E
- [ ] G501 — START → TEST_A/B/C → AUDIT → END.
- [ ] G502 — paralelismo observado.
- [ ] G503 — fan-in só após três testes.
- [ ] G504 — bounded repair loop max 3.
- [ ] G505 — failure injection.
- [ ] G506 — restart/replay.

## Gate
- [ ] unit tests verdes.
- [ ] integration tests verdes.
- [ ] CI exact-head verde.
- [ ] Production Readiness verde.
- [ ] HUMAN_GATE para merge.
