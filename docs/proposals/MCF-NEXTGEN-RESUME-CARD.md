# MCF NextGen — Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR EM OUTRO CHAT.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO

## Fase atual

- Fase Zero — Construir para aprender: **COMPLETE_IN_MAIN**
- Fase atual: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**
- Nome curto: **MCF NextGen**
- Estágio: **Discovery e Planejamento / ACTIVE_DISCOVERY**
- Arquitetura final aprovada: **não**
- Protótipo autorizado: **não**
- Implementação NextGen autorizada: **não**

## Questionário

```yaml
total_questions: 16
last_completed_question: 5
next_question: 6
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6_started: false
implementation_authorized: false
```

**Não repetir Q1–Q5 salvo solicitação explícita de LEANDRO.**

Q6 é:

> **O que significa independência entre agentes e revisores?**

## Boundary terminal da Fase Zero

Snapshot terminal verificado em 2026-08-14:

```yaml
phase_zero:
  state: COMPLETE_IN_MAIN
  audited_candidate: 47f083d304b989b397b9e740228817af0c588346
  merge_main: b91823a947715e09d69c72999e2278523f2259be
  pr_136: MERGED
  issue_135: CLOSED
  P0: 0
  P1: 0
  P2: 0
  post_merge_ci: PASS
  rc3_terminal_noop: PASS
  production_health: PASS

durable_release_identity:
  stable_v1_0_0: 7f741e10d0e745a90c732e084400b11e3f5e6794
  rc3: 7f741e10d0e745a90c732e084400b11e3f5e6794
```

Esses valores representam o boundary terminal. Estado mutável posterior deve ser relido no GitHub/provider live.

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`
2. `docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`
3. `docs/proposals/MCF-MASTER-ROADMAP-001.md`
4. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md` para Q4
5. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md` para Q3
6. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md` para Q2
7. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-003.md` para a transição Fase Zero → Fase 1
8. GitHub/provider live para estado mutável

## Decisões consolidadas

### Q1 — Finalidade

- foco inicial: sistema pessoal de trabalho com IA para LEANDRO;
- continuidade durável de projetos como problema central;
- ChatGPT/MESTRE inicialmente como camada cognitiva superior;
- equipes de agentes especializados;
- primeiro provar no uso real de LEANDRO, depois generalizar;
- produto comercial é possibilidade futura, não prioridade atual.

### Q2 — Continuidade e memória

LEANDRO aprovou `LAYERED_CONTINUITY_ARCHITECTURE`:

- Framework Memory;
- Project Memory;
- Live Operational Memory;
- Evidence / Raw Archive;
- Project Capsule como snapshot derivado/versionado, não fonte de verdade;
- progressive disclosure;
- isolamento por projeto;
- `Continuity Recovery Test`/cold-start.

Invariantes:

```text
MEMÓRIA ajuda a reconstruir.
EVIDÊNCIA prova o que aconteceu.
AUTORIDADE define o que vale.
ESTADO LIVE define onde estamos agora.
UNKNOWN permanece UNKNOWN quando falta evidência.
```

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Q3 — Agente MCF

LEANDRO aprovou `Agent Contract`.

Invariantes:

```text
AGENTE != MODELO
CAPABILITY != AUTHORITY
IDENTITY CONTINUITY != CAPABILITY CONTINUITY
AGENT OUTPUT != PROJECT TRUTH
```

Lifecycle é separado de agenthood. Independência é separada de agenthood e será formalizada na Q6.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Q4 — Autonomia

LEANDRO aprovou `MISSION-BOUNDED + RISK-BASED AUTONOMY`.

Princípios:

- `Authority Envelope` conceitualmente explícito;
- `UNKNOWN_AUTHORITY = DENY`;
- autoelevação de privilégio proibida;
- conteúdo externo não expande autoridade;
- risco não depende exclusivamente do executor;
- risco cumulativo deve ser considerado;
- retries limitados/idempotentes quando aplicável;
- revogação/emergency stop;
- `TEAM_FIRST` para recovery técnico;
- R3/crítico exige HUMAN_GATE exclusivamente de LEANDRO.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

### Q5 — Roteador de Modelos de IA

LEANDRO aprovou `CAPABILITY_AND_POLICY_BASED_ROUTER`.

Princípios:

- rotear por requisitos da tarefa, não por marca/modelo;
- hard requirements são filtrados antes de custo/latência/quota;
- router não pode rebaixar hard requirements;
- `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`;
- model self-claim não é evidência;
- Model Capability Registry com proveniência/freshness/health;
- fallback somente para modelo compatível;
- silent capability downgrade proibido;
- fallback limitado e sem routing loops;
- nenhum modelo compatível → `BLOCKED / ESCALATE`;
- decisão de routing deve gerar receipt auditável;
- custo, quota e free tier nunca substituem capacidade mínima ou segurança.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

## Próxima ação do Discovery

- Q1–Q5 concluídas e aprovadas por LEANDRO.
- Q6 ainda não começou.
- Próximo passo permitido: **LEANDRO + MESTRE iniciarem Q6 — “O que significa independência entre agentes e revisores?”**
- persistir decisões materiais antes de avançar novamente.
- não iniciar implementação NextGen antes de Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`

Resultado esperado:

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_1: ACTIVE_DISCOVERY
Q1: COMPLETED
Q2: COMPLETED_APPROVED
Q3: COMPLETED_APPROVED
Q4: COMPLETED_APPROVED
Q5: COMPLETED_APPROVED
Q6: NEXT_NOT_STARTED
implementation_authorized: false
```
