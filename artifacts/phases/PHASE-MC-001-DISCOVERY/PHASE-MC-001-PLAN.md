# PHASE-MC-001 — MCF Mission Control Discovery

**Classificação:** `PLANNED / DISCOVERY_IN_PROGRESS`  
**Risk class:** `B`  
**Implementation authorized:** `false`  
**Issue:** #141  
**Branch:** `planning/mcf-mission-control-discovery`  
**Baseline:** `main@5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`  
**Methodology pin:** `MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES v1.1 @ 5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`

## 1. Mission contract

```yaml
mission_id: MCF-MISSION-CONTROL-001
parent_mission_id: null
phase_id: PHASE-MC-001-DISCOVERY
title: MCF Mission Control — Control & Observability Plane
objective: >-
  Contratar e alinhar um mecanismo oficial para LEANDRO acompanhar projetos,
  missões e trabalho observável da equipe do MCF em tempo real, reutilizando
  a persistência e o event ledger existentes e sem criar uma segunda fonte de verdade.
expected_outcome: >-
  PIP/readback alinhável, requisitos do MVP, arquitetura candidata, fronteiras
  de segurança e critérios de aceite suficientes para um boundary posterior de implementação.
scope:
  - intent discovery e product definition
  - dashboard de projetos e missões
  - mission/phase/agent/skill current state
  - timeline e live event feed
  - blocked missions
  - handoffs
  - evidence e receipts
  - read API agregada e sanitizada
  - SSE como candidato de realtime push
  - PWA/web administrativa separada da web social
out_of_scope:
  - código de implementação nesta fase
  - produção
  - edição direta de main
  - HUMAN_GATE operacional com approve/reject
  - agent heartbeat externo
  - telemetria de chats/Codex/TreeView
  - analytics avançado, custos/tokens e ranking
inputs:
  - declaração original de LEANDRO nesta conversa
  - auditoria do runtime e observabilidade atual
  - recomendação arquitetural aprovada para iniciar sob governança MCF
source_of_truth:
  - instrução explícita atual de LEANDRO
  - GitHub live do repositório oficial
  - docs/MCF-CURRENT-STATE.md
  - docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md
  - código/testes atuais do runtime, observability e project-intake
assumptions:
  - Mission Control deve permanecer desacoplado do caminho crítico de execução
  - event ledger existente permanece autoridade primária para fatos de execução
  - realtime no MVP é predominantemente server-to-client
authorizations:
  - discovery e documentação
  - consultas read-only ao repositório
  - branch de planning reversível
  - Issue e artefatos de rastreabilidade da fase
prohibitions:
  - implementar produto antes do alinhamento e do boundary de implementação
  - escrever diretamente em main
  - publicar/deployar
  - declarar presença online de agente a partir de currentAgentId
  - expor payload bruto/segredos no navegador
  - criar banco/runtime/event ledger paralelo
risk_class: B
current_state: DISCOVERY_IN_PROGRESS
cycle: 1
selected_agents:
  - Mestre
  - Leonardo
  - Sofia
  - Ricardo
  - Augusto
  - Beatriz
  - Miriam
  - Carmem
  - Emily
decision_authority: Leo
human_escalation_triggers:
  - mudança material de objetivo ou finalidade
  - novo custo financeiro relevante
  - exposição pública relevante
  - credenciais/dados sensíveis excepcionais
  - ação externa irreversível
  - conflito estratégico
  - alinhamento final da intenção
phase_artifact_directory: artifacts/phases/PHASE-MC-001-DISCOVERY/
```

## 2. Acceptance criteria da fase

A fase só pode avançar para gate de fechamento quando:

1. as 20 dimensões canônicas do Project Intent Package estiverem classificadas sem invenção de intenção humana;
2. não houver unknown bloqueante, blocker ou conflito material para alinhamento;
3. houver readback final vinculado à revisão exata da intenção;
4. LEANDRO for a única autoridade do alinhamento final;
5. arquitetura proposta preservar o MissionRuntime e o event ledger como núcleo existente;
6. risco de vazamento de payload/segredo tiver controle explícito;
7. `currentAgentId` estiver semanticamente separado de presença/heartbeat;
8. requisitos do MVP e não-goals estiverem explícitos;
9. Augusto verificar rastreabilidade/ESEV da fase;
10. Emily executar auditoria independente antes do gate;
11. PRF Classe B estiver completo ou cada item não aplicável estiver justificado.

## 3. Seleção de agentes e entrega real

| Agente | Entrega nesta fase |
|---|---|
| Mestre | contrato, sequência ESEV, checkpoints e gate orchestration |
| Leonardo | requisitos, jornadas e Definition of Done |
| Sofia | arquitetura e separação Execution Plane × Control Plane |
| Ricardo | threat/safety boundary para observabilidade, sessão e futuros HUMAN_GATE writes |
| Augusto | observabilidade multiagente, taxonomia de eventos, rastreabilidade e semântica de presença |
| Beatriz | limites entre estado observável e alegações sobre atividade cognitiva dos agentes |
| Miriam | continuidade, precedência, fonte de verdade e retomada sem dependência do chat |
| Carmem | consistência documental do PRF |
| Emily | auditoria independente do pacote antes do gate |

Agentes de implementação não são selecionados nesta fase para evitar participação decorativa.

## 4. Invariantes arquiteturais já estabelecidos

```text
MissionRuntime / Skills / Tools
            |
            v
     Persistence + Event Ledger
            |
            +----> Mission Control Read/Projection Layer
                         |
                      REST + SSE
                         |
                    Admin PWA/Web
```

- Mission Control DOWN => MCF continua executando.
- Dashboard não escreve no caminho de execução no MVP read-only.
- Não criar segunda fonte de verdade.
- Realtime deve derivar de fatos persistidos/verificáveis.
- Projeções administrativas devem ser sanitizadas.

## 5. Progressive intent readback — ciclo 1

As declarações abaixo são síntese provisória das entradas humanas já recebidas; estados `PARTIAL`/`UNKNOWN` exigem continuação do discovery antes de alinhamento.

| Dimensão | Estado | Readback atual |
|---|---|---|
| PROBLEM | CLEAR | Falta um mecanismo único para acompanhar projetos e trabalho da equipe MCF em tempo real. |
| MOTIVATION | CLEAR | LEANDRO precisa supervisionar múltiplos projetos sem procurar estado manualmente em cada fluxo. |
| DESIRED_OUTCOME | CLEAR | Central operacional de acompanhamento do MCF. |
| TARGET_USERS | CLEAR | LEANDRO como usuário primário do Mission Control. |
| CRITICAL_USER_JOURNEYS | PARTIAL | Ver projetos, abrir missão, entender estado/atividade/bloqueios; cobertura de executores externos ainda não alinhada. |
| MUST_HAVE | PARTIAL | Projetos, missões, estado, timeline/live feed e evidência; fronteira exata do realtime ainda aberta. |
| SHOULD_HAVE | PARTIAL | Handoffs, blocked missions e enriquecimentos operacionais; priorização fina ainda aberta. |
| NON_GOALS | PARTIAL | Não interferir no motor; writes de HUMAN_GATE e telemetria externa ficam fora do primeiro boundary proposto, pendente de alinhamento humano. |
| PRIORITIES_AND_TRADEOFFS | CLEAR | Preservar estabilidade do MCF e reutilizar fundações existentes antes de adicionar infraestrutura. |
| BUSINESS_RULES | PARTIAL | Evidência antes de sucesso, fonte de verdade única e segregação de autoridade; regras de retenção/visibilidade ainda abertas. |
| DATA_AND_SENSITIVITY | PARTIAL | Eventos podem conter payload sensível; UI deve receber projeções sanitizadas. Política detalhada ainda aberta. |
| ROLES_AND_PERMISSIONS | PARTIAL | LEANDRO é autoridade humana final; modelo de acesso administrativo do Mission Control ainda precisa ser fechado. |
| AUTOMATION_LEVEL | PARTIAL | Atualização automática do painel é desejada; ações automáticas/escritas não pertencem ao MVP read-only proposto. |
| INTEGRATIONS | PARTIAL | Runtime/PostgreSQL/GitHub são centrais; chats/Codex/TreeView ainda não foram classificados como MVP ou evolução. |
| PLATFORM_AND_USAGE_CONTEXT | CLEAR | Painel web/PWA administrativo. |
| COST_AND_RESOURCE_CONSTRAINTS | PARTIAL | Solução deve ser leve e aproveitar infraestrutura existente; limites objetivos ainda não definidos. |
| QUALITY_EXPECTATIONS | CLEAR | Rastreável, estável, verificável, sem degradação do runtime. |
| FAILURE_TOLERANCE | CLEAR | Falha do Mission Control não pode parar o MCF. |
| DEFINITION_OF_DONE | PARTIAL | Precisa de critérios mensuráveis de atualização, cobertura e aceitação visual/funcional. |
| FUTURE_VISION | PARTIAL | Heartbeat, telemetria externa, analytics, custos e integrações podem evoluir após MVP. |

## 6. Próxima pergunta de maior ganho de informação

A próxima pergunta deve resolver simultaneamente `CRITICAL_USER_JOURNEYS`, `MUST_HAVE` e `INTEGRATIONS`:

> No MVP, “acompanhar o trabalho da equipe em tempo real” precisa incluir também os agentes que estejam trabalhando fora do runtime central — por exemplo, sessões de ChatGPT/Codex/TreeView — ou o primeiro MVP pode acompanhar somente projetos/missões/eventos já registrados no runtime do MCF?

Até essa decisão, o estado permanece `DISCOVERY_IN_PROGRESS` e `implementationAuthorized: false`.
