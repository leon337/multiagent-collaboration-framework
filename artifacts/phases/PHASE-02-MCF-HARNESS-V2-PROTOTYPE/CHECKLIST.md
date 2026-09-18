# CHECKLIST VIVO — MCF Harness V2 na Bolha

Mission ID: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`
Owner humano: `LEANDRO`
Coordenador: `MESTRE`
Última atualização: `2026-09-18`

Legenda:
- `[x]` concluído com evidência
- `[~]` parcial / em andamento
- `[ ]` pendente
- `[!]` bloqueado
- `[-]` fora de escopo

## A. Governança e execução
- [x] A01 Mission ID canônico.
- [x] A02 LEANDRO = autoridade humana final.
- [x] A03 MESTRE = coordenador.
- [x] A04 EXECUTION_BOUNDARY=CHATGPT_BUBBLE_LOCAL_SANDBOX.
- [x] A05 Brainbase fora do runtime desta missão.
- [x] A06 notebook fora do runtime desta missão.
- [x] A07 GitHub limitado a persistência/versionamento/auditoria.
- [x] A08 anti-simulation obrigatório.
- [x] A09 crédito de agente exige execução + evidência reais.
- [ ] A10 autoridade por evento com verificação forte.

## B. Engenharia reversa
- [x] B01 DeepSeek Harness estudado.
- [x] B02 Agent Teams estudado.
- [x] B03 durable journal analisado.
- [x] B04 projection/replay analisado.
- [x] B05 task DAG/CAS analisados.
- [x] B06 mailbox/recovery analisados.
- [x] B07 lifecycle ownership analisado.
- [x] B08 limitações separadas de padrões adotáveis.
- [x] B09 DSH não será dependência obrigatória.

## C. Mission Journal e Projection
- [x] C01 SQLite/WAL.
- [x] C02 sequence monotônica.
- [x] C03 idempotency key.
- [x] C04 replay determinístico.
- [x] C05 sequência não contígua falha.
- [x] C06 hash-chain.
- [x] C07 tamper detectado em teste.
- [ ] C08 anchor externo/assinatura do hash-chain.
- [ ] C09 migração/versionamento de schema.
- [ ] C10 snapshot/compaction auditável.

## D. Task Board / DAG / Concorrência
- [x] D01 task IDs estáveis.
- [x] D02 revision por task.
- [x] D03 CAS transacional.
- [x] D04 duas conexões concorrentes testadas.
- [x] D05 um único vencedor por revisão.
- [x] D06 DAG validado.
- [x] D07 ciclo rejeitado.
- [x] D08 readiness por dependência.
- [x] D09 lease.
- [x] D10 expiry.
- [x] D11 heartbeat/renew.
- [ ] D12 fairness.
- [ ] D13 backpressure.
- [ ] D14 priority/preemption.

## E. Mailbox
- [x] E01 message/queued persistente.
- [x] E02 message/delivered persistente.
- [x] E03 replay após reopen.
- [x] E04 target mismatch rejeitado.
- [ ] E05 dispatcher desacoplado.
- [ ] E06 ordem por target sob carga.
- [ ] E07 dedup após crash inbox/ack.
- [ ] E08 mailbox limits/backpressure.

## F. Agent lifecycle
- [x] F01 agent/provisioning.
- [x] F02 agent/active.
- [x] F03 agent/failed.
- [x] F04 transição contraditória rejeitada.
- [ ] F05 reconcile após crash real.
- [ ] F06 session ID cognitivo durável.
- [ ] F07 pause/resume.
- [ ] F08 interrupt sem perda de mailbox.
- [ ] F09 reassignment governado.

## G. Executor Cognitivo Local
- [ ] G01 definir CognitiveExecutor.
- [ ] G02 doctor().
- [ ] G03 run_task().
- [ ] G04 resume().
- [ ] G05 interrupt().
- [ ] G06 collect_events().
- [ ] G07 dispose().
- [ ] G08 identificar backend cognitivo executável dentro da bolha.
- [ ] G09 executar 2 agentes cognitivos independentes.
- [ ] G10 correlacionar modelo/tool calls com receipts.
- [ ] G11 provar que falha do executor não destrói Mission Journal.

## H. Capabilities e segurança
- [x] H01 capabilities por task.
- [x] H02 tool fora da allowlist falha fechado.
- [ ] H03 capability token com expiração.
- [ ] H04 narrowing agente + task.
- [ ] H05 impedir widening pelo executor.
- [ ] H06 sanitizar tool output.
- [ ] H07 confused deputy protection.
- [ ] H08 política de secrets.
- [ ] H09 threat model em testes negativos.

## I. Workspace Isolation
- [~] I01 conceito definido.
- [ ] I02 workspace isolado por task.
- [ ] I03 path ownership.
- [ ] I04 detectar overlap de escrita.
- [ ] I05 merge/reconciliation governado.
- [ ] I06 teste de conflito de arquivos.
- [ ] I07 rollback por task.

## J. Execution receipts / Tool evidence
- [x] J01 execution/started.
- [x] J02 execution/completed.
- [x] J03 execution/failed.
- [x] J04 tool/requested.
- [x] J05 tool/completed.
- [x] J06 tool/failed.
- [x] J07 result digest.
- [x] J08 artifact refs.
- [x] J09 resource usage inicial.
- [ ] J10 receipt schema v1.
- [ ] J11 attestation quando suportado.
- [ ] J12 accounting de todos os agentes cognitivos.

## K. Time local da bolha
- [x] K01 worker-journal.
- [x] K02 worker-recovery.
- [x] K03 worker-observability.
- [x] K04 worker-tests.
- [x] K05 worker-security.
- [x] K06 fan-out em processos independentes.
- [x] K07 auditor-local em fan-in.
- [x] K08 receipts por worker.
- [x] K09 manifest do time.
- [x] K10 NOTEBOOK_USED=false.
- [x] K11 BRAINBASE_USED=false.
- [x] K12 cognitive_agents_claimed=false sem LLM executor.
- [ ] K13 converter workers em agentes cognitivos mantendo topologia.

## L. Auditoria adversarial
- [x] L01 auditor técnico local inicial.
- [ ] L02 auditor cognitivo independente.
- [ ] L03 false-green test.
- [ ] L04 evidence forgery test.
- [ ] L05 mailbox poisoning test.
- [ ] L06 capability escalation test.
- [ ] L07 stale lease test.
- [ ] L08 executor crash test.
- [ ] L09 parecer final separado do Mestre.

## M. Recovery entre chats
- [x] M01 checkpoint local.
- [x] M02 persistência no MCF/GitHub.
- [x] M03 instrução para não redirecionar a Brainbase.
- [ ] M04 recuperar MISSION-STATE.yaml automaticamente.
- [ ] M05 materialização automática do workspace.
- [ ] M06 replay do journal no novo chat.
- [ ] M07 restauração de sessions cognitivas.
- [ ] M08 resume/reassign.
- [ ] M09 teste E2E de troca de chat.

## N. Testes
- [x] N01 CAS concorrente.
- [x] N02 mailbox após reopen.
- [x] N03 lease expiry.
- [x] N04 lease heartbeat.
- [x] N05 receipt correlation.
- [x] N06 capability deny.
- [x] N07 DAG readiness.
- [x] N08 hash-chain tamper detection.
- [ ] N09 SIGKILL injection.
- [ ] N10 storage failure injection.
- [ ] N11 partial receipt/artifact failure.
- [ ] N12 executor swap.
- [ ] N13 long-running fan-out/fan-in.
- [ ] N14 soak test.

## O. Métricas e auto-otimização
- [ ] O01 wall time.
- [ ] O02 queue time.
- [ ] O03 tool time.
- [ ] O04 retries.
- [ ] O05 failure rate.
- [ ] O06 active concurrency.
- [ ] O07 audit rejection rate.
- [ ] O08 model/context usage.
- [ ] O09 política adaptativa de modelo.
- [ ] O10 política adaptativa de team size.

## P. Release
- [ ] P01 schema versionado.
- [ ] P02 documentação de API/runtime.
- [ ] P03 runbook recovery.
- [ ] P04 rollback testado.
- [ ] P05 compatibilidade V1→V2.
- [ ] P06 unit tests verdes.
- [ ] P07 integration tests verdes.
- [ ] P08 auditoria independente verde.
- [ ] P09 zero dependência obrigatória notebook/Brainbase/VPS.
- [ ] P10 HUMAN_GATE de LEANDRO.

## Próximo bloco
```text
G01 → G08  Executor Cognitivo Local
G09 → G11  Primeiros agentes cognitivos reais
F06 → F08  Sessões persistentes
I02 → I06  Workspace isolation
L02 → L09  Auditor cognitivo
M04 → M09  Recovery entre chats
```

## Estado agregado
- Fundação/governança: PASS
- Engenharia reversa: PASS
- Runtime persistente: PASS_PROTOTYPE
- Time técnico local: PASS
- Time cognitivo local: NOT_YET_IMPLEMENTED
- Recovery entre chats: PARTIAL
- Stable release: NOT_AUTHORIZED
