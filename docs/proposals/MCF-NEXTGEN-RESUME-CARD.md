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
- Fase atual de trabalho: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**
- Nome curto: **MCF NextGen**
- Estágio: **Discovery e Planejamento / ACTIVE_DISCOVERY**
- Arquitetura final aprovada: **não**
- Protótipo autorizado: **não**
- Implementação NextGen autorizada: **não**

## Questionário

```yaml
total_questions: 16
last_completed_question: 2
next_question: 3
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3_started: false
```

**Não repetir Q1 ou Q2 salvo solicitação explícita de LEANDRO.**

Q3 é:

> **O que é um agente de verdade no MCF?**

## Boundary terminal da Fase Zero

A Fase Zero foi encerrada formalmente pela missão `MCF-PHASE-0-FINALIZATION-001`.

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

nextgen:
  stage: ACTIVE_DISCOVERY
  implementation_authorized: false
```

Esses valores são evidência do boundary terminal. Qualquer estado mutável posterior deve ser relido no GitHub/provider live.

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`
2. `docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`
3. `docs/proposals/MCF-MASTER-ROADMAP-001.md`
4. `docs/proposals/MCF-NEXTGEN-NOMENCLATURE-DECISION-001.md`
5. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-003.md` para a transição Fase Zero → Fase 1
6. checkpoints 001/002 somente para histórico adicional
7. para capacidades implementadas, consultar explicitamente `main@b91823a947715e09d69c72999e2278523f2259be:docs/MCF-CURRENT-STATE.md` ou a versão live da `main`
8. GitHub/provider live para estado mutável

## Decisões-chave consolidadas

### Q1 — finalidade

- foco primário: sistema pessoal de trabalho com IA para LEANDRO;
- continuidade durável de projetos como problema central;
- ChatGPT/MESTRE inicialmente como camada cognitiva superior;
- equipes de agentes especializados;
- primeiro provar no uso real de LEANDRO, depois generalizar;
- produto comercial é possibilidade futura, não prioridade inicial.

### Q2 — continuidade e memória

LEANDRO aprovou uma **Arquitetura de Continuidade em Camadas**:

- Framework Memory;
- Project Memory;
- Live Operational Memory;
- Evidence / Raw Archive;
- `Project Capsule` como snapshot derivado/versionado para retomada, **não** fonte de verdade;
- progressive disclosure e consulta histórica sob demanda;
- isolamento por projeto, controle de acesso, retenção, redaction de secrets e schema versionado;
- `Continuity Recovery Test`/cold-start como prova empírica de continuidade.

Invariantes Q2:

```text
MEMÓRIA ajuda a reconstruir.
EVIDÊNCIA prova o que aconteceu.
AUTORIDADE define o que vale.
ESTADO LIVE define onde estamos agora.
```

Controle estrutural de alucinação aprovado conceitualmente:

```yaml
memory_is_evidence: false
capsule_is_source_of_truth: false
unknown_must_remain_unknown: true
hypothesis_cannot_become_fact_silently: true
live_state_requires_revalidation: true
critical_decisions_require_verification: true
critical_actions_require_gate: true
provenance_required: true
```

O objetivo NÃO é presumir que modelos generativos terão zero alucinação; é impedir que uma alucinação seja promovida silenciosamente a fato oficial, decisão aprovada, estado operacional ou ação externa.

Checkpoint canônico da decisão: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

## Outras invariantes existentes

- `AGENTE != MODELO` permanece princípio forte; sua definição completa é objeto da Q3.
- múltiplos projetos devem ter contexto/equipe/estado isolados.
- HUMAN_GATE não é a mesma coisa que dependência operacional humana.
- provider capability precisa ser validada antes de virar requirement.
- complexidade só permanece se resolver problema real.
- MCF NÃO está instalado na VPS atualmente; VPS é infraestrutura separada em preparação.
- stable `v1.0.0` e RC3 permanecem identidades duráveis no SHA qualificado `7f741e10…`.
- o encerramento da Fase Zero e as aprovações Q1/Q2 NÃO autorizaram implementação NextGen.

## Próxima ação do Discovery

- Q1 concluída.
- Q2 concluída e aprovada por LEANDRO.
- Q3 ainda não começou.
- Próximo passo permitido: **LEANDRO + MESTRE iniciarem Q3 — “O que é um agente de verdade no MCF?”**
- persistir decisões materiais antes de avançar novamente.
- não iniciar implementação NextGen antes de Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada por LEANDRO

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`

Resultado esperado:

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_1: ACTIVE_DISCOVERY
Q1: COMPLETED
Q2: COMPLETED_APPROVED
Q3: NEXT_NOT_STARTED
implementation_authorized: false
```
