# ROADMAP CANÔNICO — MCF Harness V2 na Bolha do ChatGPT

Mission ID: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
Autoridade humana final: `LEANDRO`  
Coordenador: `MESTRE`  
Release: `2.0.0`  
Estado: `ENCERRADO — ENTREGUE COM DEFERIMENTOS APROVADOS`  
Runtime canônico: `CHATGPT_BUBBLE_LOCAL_SANDBOX`

## Regra canônica

Brainbase e notebook não são runtime desta missão. GitHub é persistência/versionamento/auditoria. O modelo não é fonte de verdade; o Mission Journal é.

## R0 — Governança e continuidade
**PASS**

Mission ID, autoridade, checkpoint, anti-simulation e boundary da bolha persistidos.

## R1 — Engenharia reversa DSH + Agent Teams
**PASS**

Journal, projections, DAG/CAS, mailbox, provisioning/recovery, lifecycle ownership, capability seams e limites do DSH foram analisados e classificados em ADOPT/ADAPT/IMPROVE.

## R2 — Núcleo persistente Harness V2
**PASS_PROTOTYPE**

SQLite/WAL, idempotência, replay, CAS transacional, DAG, mailbox, leases, receipts e integridade auditável.

## R3 — Time técnico local na bolha
**PASS_TECHNICAL**

Fan-out real em processos + audit fan-in, receipts e History Pipeline E2E.

## R4 — Executor plugável
**PASS_INTERFACE / G08 DEFERIDO**

Interface de executor, crash/resume e executor swap passaram. Nenhum backend cognitivo independente bubble-native foi verificado; deferimento G08/L02 aprovado por LEANDRO.

## R5 — Sessões persistentes
**PASS_INFRASTRUCTURE**

Session ID durável, checkpoints, dedup, interrupt/resume e continuidade da mailbox.

## R6 — Workspace + Capability Tokens
**PASS_PROTOTYPE**

Isolamento por tarefa, conflito de escrita, reconciliation gate, rollback, expiração/narrowing/revogação de capabilities.

## R7 — Auditoria adversarial
**PASS_TECHNICAL / COGNITIVE AUDITOR DEFERIDO**

False-green, forged evidence, mailbox poisoning, capability escalation, stale lease, crash sem recovery, provenance e DAG inválido são rejeitados. Auditor cognitivo segue deferido com G08/L02.

## R8 — Recovery
**PASS_TECHNICAL / M09 DEFERIDO**

Export/import em store limpo, capsule, replay, mailbox, reassign e resume validados. Fresh-chat em uma segunda conversa exige ação da superfície humana; M09 deferido e aceito.

## R9 — Métricas e auto-otimização
**PASS_TELEMETRY**

Wall/queue time, retries, failure rate, active concurrency e audit rejection instrumentados. Probe real: 6/6 processos, 6 PIDs, pico 6. Model policy permanece bloqueada por G08.

## R10 — Release estável
**PASS — 2.0.0**

- 53/53 testes locais PASS;
- CI do RC exact-head PASS;
- schema/API/recovery/rollback documentados;
- painel vivo Render validado;
- HUMAN_GATE aprovado por LEANDRO;
- deferimentos G08/L02, M09 e P05 aceitos explicitamente.

## Estado final

```text
ENTREGUE
release = 2.0.0
stable = approved
merge = authorized
deferments = preserved
```

A definição original de sucesso que exigia agentes cognitivos independentes foi excepcionalmente ajustada pelo HUMAN_GATE: a infraestrutura Harness V2 é entregue estável; o backend cognitivo bubble-native permanece uma evolução futura explicitamente deferida.
