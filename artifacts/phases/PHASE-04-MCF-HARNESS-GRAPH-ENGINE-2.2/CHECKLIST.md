# CHECKLIST — MCF Harness Graph Engine 2.2

Legend: `[x]` concluído · `[~]` validação final · `[ ]` pendente.

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
- [x] G108 — replay/projection.
- [x] G109 — materialização idempotente após retry/crash.
- [x] G110 — receipt persistido antes da promoção do node.
- [x] G111 — reconcile de lease sem graph/node_started.
- [x] G112 — completed task sem receipt fica bloqueada, nunca PASS.

## G2 — Scheduler
- [x] G201 — detectar nós READY.
- [x] G202 — fan-out independente.
- [x] G203 — fan-in por dependência.
- [x] G204 — lease/CAS por nó via MissionRuntime.
- [x] G205 — backpressure via LocalRuntimePool.
- [x] G206 — PASS exige receipt.
- [x] G207 — receipt actor vinculado ao lease owner.
- [x] G208 — failure bloqueia dependentes.
- [x] G209 — scheduling determinístico.
- [x] G210 — `GraphScheduler` explícito.

## G3 — Bounded Loops
- [x] G301 — max_iterations obrigatório.
- [x] G302 — timeout obrigatório.
- [x] G303 — execute/validate/repair.
- [x] G304 — evidência por validação/reparo.
- [x] G305 — loop exhaustion fail-closed.
- [x] G306 — replay após reopen.
- [x] G307 — final failed iteration encerra imediatamente.

## G4 — Runtime Pool
- [x] G401 — slot accounting.
- [x] G402 — adaptive team size via runtime_metrics.policy().
- [x] G403 — backpressure.
- [x] G404 — lifecycle events no Mission Journal.
- [x] G405 — no cognitive-agent claim.
- [x] G406 — 4-process / 2-slot contention.
- [x] G407 — run_id identity binding.
- [x] G408 — shrink abaixo de active slots é rejeitado.

## G5 — E2E
- [x] G501 — START → TEST_A/B/C → AUDIT → END.
- [x] G502 — 3 runtime cells / 3 PIDs / pico 3.
- [x] G503 — fan-in só após três testes.
- [x] G504 — bounded repair loop max 3.
- [x] G505 — failure injection.
- [x] G506 — graph/loop/pool replay após reopen.
- [x] G507 — crash reconciliation de graph.
- [x] G508 — missing receipt fail-closed.

## Gate
- [x] unit tests — 83 PASS no SHA técnico.
- [x] integration tests — PASS.
- [x] Harness CI SHA técnico — run 35393552144 SUCCESS.
- [x] Production Readiness SHA técnico — run 35393552168 SUCCESS.
- [~] exact-head final documental — revalidação após este commit.
- [ ] HUMAN_GATE para merge.
