# Archive — Issue #234 before mobile-first cockpit rewrite

Archived at: 2026-09-18
Original title: MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001 — Engenharia reversa DeepSeek Harness + Agent Teams

---

## Missão

**mission_id:** `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
**parent:** `MCF-MEMORY-LIVE-NEXT-STABLE-001` / Issue #164  
**autoridade humana final:** LEANDRO  
**coordenador:** MESTRE  
**classe de risco:** B (pesquisa + design + implementação isolada no MCF; sem provider live / produção)

## Objetivo

Estudar em profundidade o **DeepSeek Harness** e seu domínio **Agent Teams**, fazer engenharia reversa de arquitetura e comportamento observável, e incorporar ao **MCF Harness/Bubble Executor** os mecanismos que aumentem:

- paralelismo real;
- multitarefas e DAG;
- sessões duráveis;
- mailbox/comunicação entre agentes;
- ownership e lifecycle de tarefas;
- wait/resume/interrupt;
- recuperação após falha/restart;
- tool-loop e evidência atribuível;
- isolamento de capacidades;
- checkpoint/replay;
- anti-simulação;
- observabilidade e auditoria.

## Regra de produto

DeepSeek Harness é **referência de engenharia e benchmark**, não dependência obrigatória do runtime final.

```text
DSH + Agent Teams
   -> reverse engineering
   -> capability extraction
   -> MCF gap analysis
   -> adapt/reject/improve
   -> MCF Multi-Agent Harness V2
```

## Critérios de aceite da fase inicial

1. mapa verificável dos subsistemas do DSH/Agent Teams;
2. matriz `DSH mechanism -> MCF current -> gap -> decision`;
3. separar mecanismo público/documentado de inferência nossa;
4. identificar riscos de concorrência, recovery, compatibilidade e lock-in;
5. produzir arquitetura candidata do `MCF Multi-Agent Harness V2`;
6. testes unitários e de integração planejados antes de implementação;
7. nenhuma alegação de agente/subprocesso sem evidência real.

## Proibições desta fase

- nenhum merge automático;
- nenhuma mutation do Cognitive Ledger;
- nenhum deploy de produção;
- nenhum segredo/memória pessoal em artefatos;
- não copiar código de terceiros para o MCF sem análise de licença/proveniência;
- não tornar DeepSeek Harness dependência obrigatória.

## Execução

Pesquisa e design podem ser paralelos. A síntese ocorre após coleta independente de evidências.

## Live Dashboard

**Execution boundary:** `CHATGPT_BUBBLE_LOCAL_SANDBOX`  
**Dashboard feed:** `artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/LIVE-DASHBOARD.json`  
**Roadmap:** `artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/ROADMAP.md`  
**Checklist:** `artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/CHECKLIST.md`  
**Mission state:** `artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/MISSION-STATE.yaml`  
**Integrity manifest:** `artifacts/phases/PHASE-02-MCF-HARNESS-V2-PROTOTYPE/AUDIT-MANIFEST.sha256`

### Estado atual

- R0 Governança: PASS
- R1 Reverse engineering: PASS
- R2 Runtime persistente: PASS_PROTOTYPE
- R3 Time técnico local: PASS
- R4 Executor Cognitivo Local: IN_PROGRESS
- Time local: 5 workers + 1 auditor
- Fan-out: 5/5 PASS
- Runtime tests: 39/39 PASS
- Notebook como runtime: false
- Brainbase como runtime: false
- GitHub: persistência/versionamento/auditoria
- Vercel: observabilidade/painel

### Histórico vivo recente

- 2026-09-18 06:02 BRT — Issue #234 criada.
- 2026-09-18 06:14 BRT — engenharia reversa DSH + Agent Teams concluída.
- 2026-09-18 06:31 BRT — protótipo event-sourced criado.
- 2026-09-18 06:54 BRT — 5/5 workers locais PASS.
- 2026-09-18 07:03 BRT — DAG readiness, capabilities, hash-chain e heartbeat adicionados.
- 2026-09-18 07:07 BRT — 7/7 testes PASS.
- 2026-09-18 07:12 BRT — roadmap/checklist/state/manifest persistidos.
- 2026-09-18 07:24 BRT — projeto Vercel `predix-ai-br/mcf-harness-v2-live` criado via CLI.
- 2026-09-18 07:25 BRT — deploy dedicado bloqueado por `api-deployments-free-per-day` (quota Hobby diária).

### Vercel agora

O ecossistema Vercel existente já observa esta issue por `mcf-cockpit-live.vercel.app/api/mcf`. O projeto dedicado `mcf-harness-v2-live` está criado, mas sem Production URL enquanto a cota diária não liberar.

## LIVE MISSION FEED

**Superfície viva oficial:** https://mcf-cockpit-live.vercel.app/concept-3#mission  
**Refresh:** 60s via `/api/mcf` → GitHub REST público.  


<!-- MCF_LIVE_FEED_BEGIN -->
```yaml
live_feed:
  schema: mcf_live_mission_feed/v1
  mission_id: MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001
  status: ACTIVE
  current_phase: R4_COGNITIVE_EXECUTOR_LOCAL
  authority_human: LEANDRO
  coordinator: MESTRE
  runtime: CHATGPT_BUBBLE_LOCAL_SANDBOX
  notebook_runtime: false
  brainbase_runtime: false
  github_role: persistence_versioning_audit
  vercel_surface: mcf-cockpit-live
  updated_at: 2026-09-18T07:48:00-03:00
  evidence:
    local_workers: 5
    local_auditor: 1
    fanout_pass: 5/5
    runtime_tests_pass: 39/39
    cognitive_agents_claimed: false
  roadmap:
    R0: PASS
    R1: PASS
    R2: PASS_PROTOTYPE
    R3: PASS
    R4: IN_PROGRESS
    R5: PENDING
    R6: PARTIAL
    R7: PENDING
    R8: PARTIAL
    R9: PENDING
    R10: PENDING
```
<!-- MCF_LIVE_FEED_END -->

### Histórico vivo

| Hora BRT | Ator | Evento | Evidência |
|---|---|---|---|
| 06:02 | MESTRE | Missão #234 criada | Issue #234 |
| 06:14 | MESTRE | Reverse engineering DSH + Agent Teams concluída | PR #235 |
| 06:31 | MESTRE | Protótipo event-sourced criado | PR #236 |
| 06:54 | worker-team | Fan-out local concluído | 5/5 PASS |
| 07:03 | MESTRE | DAG readiness, capabilities, hash-chain e heartbeat adicionados | runtime V2 |
| 07:07 | worker-tests | Segundo ciclo validado | 7/7 PASS |
| 07:12 | MESTRE | Roadmap/checklist/state/manifest persistidos | branch do protótipo |
| 07:24 | MESTRE | Projeto Vercel dedicado criado | `mcf-harness-v2-live` |
| 07:25 | MESTRE | Deploy dedicado bloqueado por quota Hobby | `api-deployments-free-per-day` |
| 07:48 | MESTRE | Alternativa viva ativada via `mcf-cockpit-live` | API pública dinâmica |
| 08:05 | MESTRE | History Pipeline v1 ativado | 8 eventos automáticos · 12/12 PASS |
| 08:18 | MESTRE | R4 executor boundary validado | 16/16 PASS · G08 BLOCKED |

### History Pipeline v1

Estado: **PASS_E2E**

- 8 eventos reais gravados automaticamente na última execução;
- início do time → 5 resultados de workers → auditor → conclusão;
- append-only + idempotência + hash-chain;
- escrita concorrente serializada entre processos;
- replay detecta adulteração e sequência inválida;
- `chain_head=ab7f47da1f01ed91e28d3976956317cb5bce01a5584dde9e378229486adeca88`;
- suíte total: **12/12 PASS**.

A partir deste checkpoint, cada ciclo do `local_team_runner` registra automaticamente seu histórico local. A projeção para GitHub/Issue é o boundary de sincronização para o cockpit Vercel.

### History Pipeline E2E validado

Fluxo comprovado:

```text
local_team_runner
  -> live-history.jsonl
  -> live-history-projection.json
  -> LIVE-DASHBOARD.json
  -> Issue #234
  -> mcf-cockpit-live /api/mcf
  -> Concept 3 / Missão
```

A validação da API pública confirmou simultaneamente:
- Issue #234 presente;
- `History Pipeline v1` presente;
- `12/12 PASS` presente;
- chain head esperado presente.

Q09/Q10: **PASS**.

### R4 — Executor boundary

Estado: **PARTIAL / BLOCKED_G08**

PASS:
- `CognitiveExecutor` interface;
- doctor/provision/start/interrupt/resume/collect/dispose;
- `LocalProcessExecutor` durável, explicitamente `cognitive=false`;
- SIGKILL injection + nova instância + resume;
- Mission Journal preservado após crash;
- executor swap/reopen;
- suíte local total: **16/16 PASS**.

BLOCKER:
- nenhum backend LLM independente e bubble-native foi verificado no ambiente atual;
- Brainbase permanece fora da missão;
- notebook não é runtime;
- serviços externos de agentes/modelos não serão tratados como execução local.

Gate: `BLOCKED_G08`.

### R5 — Sessões persistentes

Estado: **PASS_INFRASTRUCTURE**

Validado no runtime local da bolha:
- session ID durável no Mission Journal;
- checkpoint sequencial de contexto;
- contexto da tarefa persistido apenas por hash/referência;
- memória institucional mantida fora da sessão;
- message dedup idempotente;
- interrupt/resume após reopen;
- mailbox preservada durante a interrupção;
- suíte total: **21/21 PASS**.

Non-claim: ainda não existe backend LLM independente bubble-native, portanto nenhuma sessão é apresentada como sessão cognitiva real.

### R6 — Workspace + Capability Tokens

Estado: **PASS_PROTOTYPE**

Validado na bolha:
- workspace por task;
- owner/path binding;
- path traversal e prefixos falham fechado;
- detecção de conflito de escrita;
- reconciliation requer gate explícito;
- conflito não resolvido é rejeitado;
- receipt de reconciliação;
- checkpoint + rollback;
- capability token HMAC-SHA256 com expiração;
- binding agent + task;
- child token só reduz capabilities;
- revogação persistente;
- suíte total: **29/29 PASS**.

Correção auditável: o primeiro evento R6 foi escrito com o Mission ID pai. O evento foi preservado; um novo evento foi anexado à cadeia local canônica `-LOCAL`. Cadeia canônica após R6: **12 eventos**, head `9a18b3c1482ca59f39ad34cf797e6f835c4bba0b2acd9c9a2345e2a01c565c6e`.

Limites: tool-output sanitation, threat model amplo de confused deputy e política ampla de secrets permanecem pendentes.

### R7 — Auditoria adversarial técnica

Estado: **PASS_TECHNICAL / COGNITIVE_PENDING**

O auditor determinístico `cognitive=false` rejeita:
- false green;
- receipt ausente;
- evidence forgery;
- mailbox poisoning;
- capability escalation;
- stale lease;
- crash/recovery sem checkpoint;
- provenance ausente;
- DAG inválido.

Um pacote válido é aceito. Parecer real separado: **PASS**, zero findings falhos, receipt SHA `2ea745dbc4e36b3c16a83996487db8cab30c3c38891ee5d798a2b97b4c491286`.

Suíte total: **39/39 PASS**.
História local: **13 eventos**, chain head `505b7519a37306d2fa61d875957cd02e7e220fe2c4273436c99dc6e4d88d3950`.

L02 permanece pendente: não há auditor cognitivo independente enquanto G08 estiver bloqueado.

