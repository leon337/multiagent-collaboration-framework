# ROADMAP CANÔNICO — MCF Harness V2 na Bolha do ChatGPT

Mission ID: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`
Autoridade humana final: `LEANDRO`
Coordenador: `MESTRE`
Data-base: `2026-09-18`
Estado do roadmap: `ATIVO`
Runtime canônico: `CHATGPT_BUBBLE_LOCAL_SANDBOX`

## Regra canônica

Esta missão opera **dentro da bolha do ChatGPT**.

- Brainbase: fora do runtime desta missão.
- Notebook do usuário: fora do runtime desta missão.
- GitHub: persistência, versionamento, continuidade e auditoria; não é o executor principal.
- VPS: adaptador futuro/opcional; não é requisito para o núcleo.
- Nenhum agente recebe crédito sem execução e evidência reais.
- Nenhum estado crítico depende apenas da memória de um processo ou de um chat.
- LEANDRO mantém autoridade humana final.

## R0 — Governança, escopo e continuidade
Estado: `CONCLUÍDA`

Entregas:
- Mission ID canônico.
- Issue #234.
- regra de execução local na bolha.
- checkpoint local persistente.
- branch/protótipo separados de produção.

Gate: `PASS`

## R1 — Engenharia reversa DeepSeek Harness + Agent Teams
Estado: `CONCLUÍDA`

Mecanismos estudados:
- durable journal;
- projection/replay;
- roster durável;
- task DAG;
- CAS por revisão;
- mailbox durável;
- provisioning/recovery;
- wait/interrupt;
- capability seams;
- lifecycle ownership;
- SDK/process boundary.

Decisão: adotar propriedades, não copiar a API nem tornar DSH dependência obrigatória.

Gate: `PASS`

## R2 — Núcleo persistente do Harness V2
Estado: `CONCLUÍDA — PROTÓTIPO`

Implementado e validado:
- SQLite/WAL Mission Journal;
- sequência monotônica;
- idempotency keys;
- replay determinístico;
- task revisions;
- CAS transacional;
- DAG e detecção de ciclos;
- mailbox queue/ack;
- leases e expiração;
- provisioning `provisioning → active|failed`;
- execution receipts;
- tool evidence correlation;
- hash-chain de eventos;
- task-scoped capabilities;
- lease heartbeat.

Gate: `PASS_PROTOTYPE`

## R3 — Time técnico local dentro da bolha
Estado: `CONCLUÍDA — TÉCNICA`

Topologia:

```text
Mestre
  ├─ worker-journal
  ├─ worker-recovery
  ├─ worker-observability
  ├─ worker-tests
  └─ worker-security
          ↓
     auditor-local
```

Evidência:
- processos independentes;
- receipts separados;
- fan-in posterior;
- 5/5 workers PASS;
- 7/7 testes runtime PASS;
- NOTEBOOK_USED=false;
- BRAINBASE_USED=false;
- cognitive_agents_claimed=false.

Gate: `PASS_TECHNICAL`

## R4 — Executor Cognitivo Local Plugável
Estado: `PRÓXIMA FASE`

Entregas planejadas:
- interface `CognitiveExecutor`;
- `doctor()`;
- `run_task()`;
- `resume()`;
- `interrupt()`;
- `collect_events()`;
- `dispose()`;
- primeiro backend cognitivo executável dentro da bolha;
- receipts de modelo e tools correlacionados ao Journal.

Critério de aceite:
- pelo menos 2 agentes cognitivos independentes;
- task ID, execution ID e receipt próprios;
- nenhuma alegação sem evento correspondente;
- reinício do executor não apaga o estado da missão.

Gate: `PENDENTE`

## R5 — Sessões persistentes por agente
Estado: `PENDENTE`

- AgentSession estável;
- session ID durável;
- checkpoint de contexto por tarefa;
- retomada após interrupção;
- deduplicação de mensagens;
- separação memória de tarefa / memória institucional.

## R6 — Workspace isolado + Capability Tokens
Estado: `PARCIAL`

Já existe:
- capabilities por tarefa.

Falta:
- workspace/worktree isolado por tarefa;
- merge/reconciliation governado;
- token/capability com expiração;
- deny-by-default para todas as tools;
- teste de colisão de escrita.

## R7 — Auditor Cognitivo Adversarial
Estado: `PENDENTE`

Cobertura mínima:
- false green;
- receipt ausente;
- tool evidence inconsistente;
- race conditions;
- DAG inválido;
- replay/tamper;
- capability escalation;
- mailbox poisoning;
- stale lease;
- executor crash;
- resultado sem provenance.

## R8 — Recovery entre chats e executor swap
Estado: `PENDENTE`

Fluxo-alvo:

```text
RECOVER
 → MATERIALIZE
 → DOCTOR
 → REPLAY JOURNAL
 → RESTORE SESSIONS
 → SELECT EXECUTOR
 → RESUME READY TASKS
 → RECEIPT
 → CHECKPOINT
```

Critério de aceite:
- novo chat recupera roadmap/checklist/state;
- journal e tasks consistentes;
- agente interrompido pode ser retomado ou reassigned;
- troca de executor preserva Mission ID e task history.

## R9 — Avaliação, desempenho e auto-otimização
Estado: `PENDENTE`

Métricas:
- wall time;
- queue time;
- tool time;
- retries;
- failures;
- active concurrency;
- task success;
- audit rejection rate;
- resource usage;
- contexto/tokens quando disponível;
- qualidade por tipo de tarefa.

Saída:
- política de escolha de modelo;
- política de tamanho do time;
- política de timeout;
- política de fan-out/fan-in;
- limites de recursos por missão.

## R10 — Release estável do Bubble Multi-Agent Runtime
Estado: `PENDENTE`

Requisitos:
- gates R0–R9 resolvidos ou formalmente deferidos;
- testes unitários e integração verdes;
- recovery testado;
- auditoria independente verde;
- documentação e runbook;
- schema versionado;
- rollback;
- zero dependência obrigatória de Brainbase/notebook/VPS;
- aprovação final de LEANDRO.

Gate: `HUMAN_GATE`

## Ordem executiva atual

```text
R4 Executor Cognitivo Local
  ↓
R5 Sessões Persistentes
  ↓
R6 Workspace + Capabilities
  ↓
R7 Auditor Cognitivo
  ↓
R8 Recovery entre Chats
  ↓
R9 Evals / Auto-otimização
  ↓
R10 Stable
```

## Definição de sucesso

A missão só está concluída quando LEANDRO puder, a partir da interface do ChatGPT, iniciar uma missão e obter:

```text
pedido humano
   ↓
Mestre
   ↓
time cognitivo dentro da bolha
   ↓
execução paralela governada
   ↓
evidência + auditoria
   ↓
resultado
   ↓
continuidade entre chats
```

sem precisar operar notebook, terminal, VPS ou outro orquestrador externo no fluxo normal.
