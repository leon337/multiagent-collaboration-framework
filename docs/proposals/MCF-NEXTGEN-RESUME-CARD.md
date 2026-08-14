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
last_completed_question: 1
next_question: 2
Q2_started: false
```

**Não repetir Q1.**

Q2 é:

> **O que exatamente significa “não perder o contexto de um projeto”?**

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
  advanced_by_phase_zero_closeout: false
  stage: ACTIVE_DISCOVERY
  implementation_authorized: false
```

Esses valores são evidência do boundary terminal. Qualquer estado mutável posterior deve ser relido no GitHub/provider live.

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-003.md`
2. `docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`
3. `docs/proposals/MCF-MASTER-ROADMAP-001.md`
4. `docs/proposals/MCF-NEXTGEN-NOMENCLATURE-DECISION-001.md`
5. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-002.md` para histórico anterior
6. para capacidades implementadas, consultar explicitamente a fonte externa desta branch `main@b91823a947715e09d69c72999e2278523f2259be:docs/MCF-CURRENT-STATE.md` ou a versão live da `main`
7. GitHub/provider live para estado mutável

A referência ao `MCF-CURRENT-STATE.md` acima é intencionalmente qualificada pela ref `main`; esse arquivo não é declarado como presente nesta branch de discovery.

## Decisões-chave já consolidadas

- MCF nasceu para permitir continuidade durável de projetos e reduzir dependência de contexto de chat/ferramentas caras.
- ChatGPT/MESTRE é inicialmente a camada cognitiva superior.
- `AGENTE != MODELO`.
- modelos podem ser roteados/fallback sem perder identidade do agente.
- GitHub permanece memória institucional forte.
- separar Framework Memory, Project Memory e Live Operational Memory é hipótese forte.
- Pacote de Continuidade do Projeto é hipótese forte para retomada independente.
- múltiplos projetos devem ter contexto/equipe/estado isolados.
- HUMAN_GATE não é a mesma coisa que dependência operacional humana.
- Linha do Tempo dos Agentes + Central de Perguntas e Decisões são direções de UX em estudo.
- MCF deve poder criar sistemas e também factories/frameworks especializados.
- provider capability precisa ser validada antes de virar requirement.
- complexidade só permanece se resolver problema real.
- MCF NÃO está instalado na VPS atualmente; VPS é infraestrutura separada em preparação.
- Codex observado no GitHub é integração de review/update do PR, não serviço hospedado na VPS.
- a stable `v1.0.0` e a RC3 permanecem identidades duráveis no SHA qualificado `7f741e10…`.
- o encerramento da Fase Zero não autorizou arquitetura, protótipo nem implementação do NextGen.

## Classificação de artefatos anteriores

- `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md`: histórico de discovery preservado.
- `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-002.md`: `DURABLE_SESSION_CHECKPOINT` preservado; seus estados live são snapshots históricos.
- referências anteriores a stable ausente, PR #133 aberto, PR #134 pendente ou Fase Zero em fechamento devem ser lidas como **HISTORICAL**, não como estado atual.

## Próxima ação do Discovery

- Q1 permanece concluída.
- Q2 ainda não começou.
- O próximo passo permitido é LEANDRO + MESTRE iniciarem Q2.
- Ao concluir uma decisão material ou antes de nova pausa, persistir novo checkpoint conforme a política do questionário.
- Não iniciar implementação NextGen antes de Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada por LEANDRO

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`

Resultado esperado da retomada:

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_1: ACTIVE_DISCOVERY
Q1: COMPLETED
Q2: NEXT_NOT_STARTED
implementation_authorized: false
```
