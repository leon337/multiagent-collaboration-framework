# MCF NextGen — Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR EM OUTRO CHAT.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO

## Fase atual

- Fase Zero: ainda fechando boundary stable/documentação
- Fase 1 futura: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**
- Nome curto: **MCF NextGen**
- Estágio do NextGen: **Discovery e Planejamento**

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

## Estado live observado no checkpoint

```yaml
main: 7f741e10d0e745a90c732e084400b11e3f5e6794
RC3: 7f741e10d0e745a90c732e084400b11e3f5e6794

PR133:
  state: OPEN
  observed_head: 5875c459128e849fa76b735fb33f0c45a8355b20
  purpose: stable publication control plane
  architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
  P0: 0
  P1: 2
  P2: 0
  READY_FOR_HUMAN_GATE: false
  HUMAN_GATE: NOT_APPROVED

PR134:
  state: OPEN
  observed_head: c8d2696a419f0781f3417ff8fa95149f031f9654
  purpose: documentation reconciliation
  action: DO_NOT_MERGE_BEFORE_STABLE_BOUNDARY

stable_v1_0_0:
  tag: ABSENT_AT_LAST_READBACK
  release: ABSENT_AT_LAST_READBACK
```

**Revalidar tudo que for estado live antes de afirmar que continua igual.**

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-002.md`
2. `docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`
3. `docs/proposals/MCF-MASTER-ROADMAP-001.md`
4. `docs/proposals/MCF-NEXTGEN-NOMENCLATURE-DECISION-001.md`
5. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md` se precisar do histórico anterior
6. GitHub live: `main`, PR #133, PR #134, stable tag/release, rulesets/workflows pertinentes

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

## Próxima ação

1. verificar o boundary operacional atual no GitHub;
2. se ainda houver trabalho da stable, concluir esse fluxo sem iniciar publicação sem HUMAN_GATE;
3. preservar PR #134 até a ordem segura de integração;
4. quando o discovery for retomado, iniciar **Q2**;
5. persistir nova decisão/checkpoint antes de nova pausa.

## Comando mínimo de retomada por LEANDRO

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`

Isso deve ser suficiente para uma nova sessão reconstruir o estado sem pedir a LEANDRO que repita o contexto.