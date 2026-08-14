# MCF NextGen — Discovery Checkpoint 004

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004`  
**Status:** `DURABLE_DECISION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** registrar a aprovação explícita de LEANDRO para a Q2 do Discovery e fixar o ponto de retomada em Q3.

---

# 1. Estado do questionário

```yaml
questionnaire_version: MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001
total_questions: 16
last_completed_question: 2
next_question: 3
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: NEXT_NOT_STARTED
implementation_authorized: false
architecture_final_approved: false
```

A aprovação de Q2 é uma decisão de Discovery. Ela NÃO autoriza implementação do MCF NextGen.

---

# 2. Pergunta aprovada

## Q2 — O que exatamente significa “não perder o contexto de um projeto”?

Decisão consolidada:

> Continuidade significa permitir que outro chat, modelo, agente ou humano reconstrua fielmente o estado relevante de um projeto sem depender da memória do chat anterior, preservando significado, autoridade, evidências, estado e próxima ação permitida.

O objetivo NÃO é preservar cada palavra de toda conversa. O objetivo é preservar e recuperar tudo que possa alterar uma decisão futura ou seja necessário para reconstruir o projeto com fidelidade.

---

# 3. Arquitetura de continuidade aprovada conceitualmente

Nome de trabalho:

`LAYERED_CONTINUITY_ARCHITECTURE`

Componentes conceituais:

```text
FONTES CANÔNICAS / ESTADO PERSISTENTE
            │
            ├── Framework Memory
            ├── Project Memory
            ├── Live Operational Memory
            └── Evidence / Raw Archive
                       │
                       ▼
                Continuity Builder
                       │
                       ▼
                 Project Capsule
                       │
                       ▼
             novo chat/modelo/agente
```

## 3.1 Framework Memory

Preserva regras globais, invariantes, governança, agentes, skills, protocolos e decisões de framework aplicáveis além de um único projeto.

## 3.2 Project Memory

Preserva objetivo, requisitos, arquitetura, decisões aprovadas, decisões rejeitadas relevantes, riscos, histórico consolidado, checkpoints e informações duráveis específicas do projeto.

## 3.3 Live Operational Memory

Preserva estado volátil da execução, como missão, fase, agente ativo, blockers, última ação e próxima ação permitida.

Estado live deve ser revalidado antes de ação material.

## 3.4 Evidence / Raw Archive

Preserva sob demanda evidências e histórico profundo que não precisam ocupar constantemente o contexto ativo: receipts, logs, CI, relatórios, artefatos, mensagens relevantes, snapshots e evidências históricas.

Deve existir classificação, política de retenção, redaction de secrets e proveniência.

---

# 4. Project Capsule

O `Project Capsule` NÃO é fonte de verdade e NÃO é um banco de memória independente.

Definição aprovada:

> Uma projeção compacta, versionada e derivada das fontes canônicas, do estado operacional e das evidências necessárias para retomada segura de um projeto.

Contrato conceitual mínimo candidato:

```yaml
capsule:
  schema_version:
  project_id:
  generated_at:
  source_refs:
  source_versions:
  source_shas:
  freshness_policy:
  authority_scope:
  security_classification:
  current_phase:
  current_mission:
  last_completed_action:
  next_allowed_action:
```

O schema exato permanece sujeito às perguntas posteriores e à arquitetura final.

---

# 5. Modelo de verdade e autoridade

Invariantes aprovados:

1. `Project Capsule != source of truth`.
2. `Memory != evidence`.
3. ausência de evidência NÃO pode ser promovida para `PASS`.
4. hipótese NÃO pode virar fato silenciosamente.
5. estado volátil deve ser revalidado antes de ação importante.
6. toda decisão material deve preservar autoridade e estado semântico.
7. evidências devem possuir proveniência.
8. múltiplos projetos devem possuir isolamento de memória/estado/acesso.

Estados semânticos mínimos candidatos:

```text
VERIFIED
INFERRED
UNKNOWN
APPROVED
REJECTED
SUPERSEDED
HISTORICAL
PENDING
```

---

# 6. Controle estrutural de alucinação

LEANDRO identificou alucinação de IA como preocupação central e fator que prejudica decisões humanas.

Decisão arquitetural da Q2:

> O MCF não deve depender de uma IA que nunca alucina. Deve impedir que uma possível alucinação seja promovida silenciosamente a fato oficial, decisão aprovada, estado operacional ou ação externa.

Fluxo conceitual:

```text
pergunta/fato alegado
      ↓
recuperar fonte/evidência
      ↓
evidência suficiente?
  ┌───┴───┐
 NÃO     SIM
  │       │
UNKNOWN   VERIFIED/INFERRED
  │       │
  └───┬───┘
      ↓
decisão/ação crítica?
  ┌───┴───┐
 NÃO     SIM
  │       │
resposta  verificação independente + gate
```

Regras aprovadas:

```yaml
hallucination_controls:
  evidence_before_fact: true
  unknown_must_remain_unknown: true
  hypothesis_cannot_become_fact_silently: true
  critical_decisions_require_verification: true
  critical_actions_require_gate: true
  provenance_required: true
```

Zero alucinação não é assumido como propriedade alcançável de modelos generativos. O objetivo arquitetural é detecção, contenção, rastreabilidade e prevenção de promoção indevida.

---

# 7. Temporalidade e retenção

Modelo conceitual aprovado:

```text
HOT MEMORY
- missão atual
- fase atual
- blockers
- agente ativo
- próxima ação

WARM MEMORY
- objetivo
- requisitos
- decisões
- arquitetura
- histórico consolidado

COLD ARCHIVE
- logs
- receipts
- conversas relevantes
- CI
- relatórios
- evidências antigas
```

A política concreta de retenção será definida posteriormente. A decisão desta Q2 é que as camadas NÃO devem ter retenção ou carregamento idênticos.

---

# 8. Segurança e consistência

Requisitos conceituais aprovados:

- isolamento por projeto;
- controle de acesso;
- redaction de secrets;
- política de retenção;
- schema versionado;
- mecanismo de migração/backward compatibility;
- proteção contra concorrência/overwrites entre agentes;
- orçamento de contexto e progressive disclosure;
- consulta sob demanda ao arquivo histórico/evidencial.

---

# 9. Continuity Recovery Test

A continuidade deve ser comprovada empiricamente, não apenas declarada.

Teste conceitual obrigatório:

1. encerrar o chat/sessão anterior;
2. iniciar um novo contexto sem histórico bruto;
3. fornecer o Project Capsule e acesso permitido às fontes;
4. preferencialmente variar modelo/agente/provider em testes posteriores;
5. solicitar reconstrução do projeto;
6. verificar se o novo contexto recupera corretamente objetivo, estado, decisões, autoridade, riscos, pendências e próxima ação sem LEANDRO recontar o projeto.

Critério conceitual de PASS:

```yaml
continuity_recovery:
  project_objective_recovered: true
  current_state_recovered: true
  approved_decisions_recovered: true
  rejected_or_superseded_state_preserved: true
  authority_preserved: true
  risks_and_blockers_recovered: true
  completed_and_pending_work_recovered: true
  next_allowed_action_recovered: true
  human_retelling_required: false
```

Os detalhes métricos serão definidos nas perguntas posteriores, especialmente Q13 e Q14.

---

# 10. Distinção fundamental aprovada

```text
MEMÓRIA
ajuda a reconstruir

EVIDÊNCIA
prova o que aconteceu

AUTORIDADE
define o que vale

ESTADO LIVE
define onde estamos agora
```

Essa distinção passa a ser requisito conceitual da arquitetura final da Fase 1.

---

# 11. Itens deliberadamente não decididos em Q2

Para evitar mistura entre perguntas, Q2 NÃO fecha:

- definição completa de agente — Q3;
- autonomia e stop conditions — Q4;
- roteamento de modelos — Q5;
- independência de revisores — Q6;
- orquestração graph/loops/paralelo — Q7;
- implementação concreta da persistência — Q8/Q11;
- UX/observabilidade — Q9;
- segurança/gates completos — Q12;
- métricas finais — Q13;
- portabilidade/cold-start detalhado — Q14;
- simplificação/ablation — Q15;
- arquitetura final e GO/NO-GO — Q16.

---

# 12. Aprovação humana

```yaml
human_gate:
  authority: LEANDRO
  decision: APPROVED
  scope: Q2_DISCOVERY_DECISION
  implementation_authorized: false
```

LEANDRO aprovou explicitamente a Q2 após revisão crítica, refinamento e inclusão de controles estruturais contra alucinação.

---

# 13. Ponto exato de retomada

```yaml
phase: MCF_NEXTGEN_ACTIVE_DISCOVERY
last_completed_question: 2
next_question: 3
Q2: COMPLETED_APPROVED
Q3: NEXT_NOT_STARTED
next_action: LEANDRO_AND_MESTRE_START_Q3
implementation_authorized: false
```

**Não repetir Q1 ou Q2 salvo solicitação explícita de LEANDRO.**
