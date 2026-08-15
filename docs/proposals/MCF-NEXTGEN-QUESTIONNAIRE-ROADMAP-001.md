# MCF NextGen — Roadmap do Questionário de Discovery

**ID:** `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001`  
**Status:** `ACTIVE_DISCOVERY`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`

---

## 1. Regra do questionário

O questionário possui **16 perguntas canônicas**.

- uma pergunta por vez;
- LEANDRO pode escolher, combinar ou propor resposta;
- MESTRE registra decisões, consequências, contradições e pontos abertos;
- decisões relevantes são persistidas no GitHub antes de avançar;
- pergunta concluída não é repetida salvo solicitação de LEANDRO;
- hipótese não vira implementação automaticamente;
- Q1–Q16 serão conciliadas antes de qualquer implementação NextGen.

---

## 2. Estado atual

```yaml
question_count_total: 16
questions_completed: 10
questions_remaining: 6
last_completed_question: 10
next_question: 11
question_01: COMPLETED
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
question_05: COMPLETED_APPROVED_BY_LEANDRO
question_06: COMPLETED_APPROVED_BY_LEANDRO
question_07: COMPLETED_APPROVED_BY_LEANDRO
question_08: COMPLETED_APPROVED_BY_LEANDRO
question_09: COMPLETED_APPROVED_BY_LEANDRO
question_10: COMPLETED_APPROVED_BY_LEANDRO
question_11: NOT_STARTED
implementation_authorized: false
```

---

## 3. Decisões concluídas

### Q1 — Finalidade principal
**Status:** `COMPLETED`

Foco inicial: sistema pessoal de trabalho com IA para LEANDRO, continuidade durável de projetos, equipes especializadas e prova em uso real antes de generalização.

### Q2 — Continuidade de contexto
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e live state separados; Project Capsule derivado; `UNKNOWN` permanece `UNKNOWN`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Q3 — Agente MCF
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `AGENT OUTPUT != PROJECT TRUTH`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Q4 — Autonomia
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`MISSION-BOUNDED + RISK-BASED AUTONOMY`; `Authority Envelope`; `TEAM_FIRST`; HUMAN_GATE exclusivamente de LEANDRO quando exigido pela política.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

### Q5 — Roteador de modelos
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements antes de custo/latência/quota; fallback compatível/limitado; routing receipt.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

### Q6 — Independência
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`INDEPENDENCE != DIVERSITY`; blind-first, evidência própria e decisão própria para revisão independente; assurance proporcional ao risco.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md`.

### Q7 — Orquestração
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico, loops limitados, paralelismo seguro, joins explícitos, replanning versionado, Complexity Budget e Completion Contract.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

### Q8 — Persistência e documentação
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`LAYERED_CANONICAL_PERSISTENCE`; canonical knowledge, operational state, transition ledger, evidence e derived views; consistência durável, provenance, freshness, schema versioning e restorability.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md`.

### Q9 — Experiência humana e observabilidade
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`ACTIONABLE_PROGRESSIVE_OBSERVABILITY`; Decision Inbox, atenção humana separada de severidade operacional, aprovação version-bound, UI derivada com freshness, progressive disclosure e notificações orientadas a mudança material.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-011.md`.

### Q10 — Core vs Factory / Plugin / Perfil
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão: `MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`.

Síntese:

- Core dividido conceitualmente entre `Constitutional Kernel` e contratos de Core Services;
- extensões dependem do Core; Core não depende de extensão específica;
- Plugin adiciona capacidade executável;
- Skill adiciona procedimento governado;
- Profile é configuração declarativa e não executa lógica arbitrária;
- Factory gera blueprint versionado e não mantém autoridade no runtime;
- Extension Manifest versionado é obrigatório para extensões materiais;
- `INSTALLED != ENABLED != AUTHORIZED`;
- compatibilidade desconhecida falha fechada;
- dependências circulares entre extensões são proibidas;
- conflito de Profiles não usa `last writer wins` silencioso;
- falha de extensão deve ser contida sem corromper Core;
- remoção de extensão não destrói interpretabilidade histórica;
- `Agent Contract` pertence ao Core; catálogo fixo de agentes nomeados não pertence ao Core por padrão;
- especificações novas não usam rótulos `R0–R4` isolados: risco e assurance devem ser namespaced ou semanticamente nomeados.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-012.md`.

---

## 4. Perguntas restantes

### Q11 — Como deve funcionar a infraestrutura e o placement de serviços?
**Status:** `NEXT / NOT_STARTED`

Definir self-host/SaaS, VPS como opção e não dependência, containers, bancos, filas, MCPs, workers, isolamento, backup/restore, portabilidade e critérios econômicos/técnicos de placement.

### Q12 — Quais controles de segurança, permissões e gates são essenciais?
**Status:** `PENDING`

### Q13 — Como provar que o MCF vale o custo e a complexidade?
**Status:** `PENDING`

### Q14 — Como validar portabilidade e utilidade fora do ambiente atual?
**Status:** `PENDING`

### Q15 — O que deve ser preservado, simplificado, removido ou substituído?
**Status:** `PENDING`

Regra: **nenhuma complexidade é preservada apenas porque já existe**.

### Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?
**Status:** `PENDING`

---

## 5. Política de checkpoint

Persistir checkpoint quando houver decisão arquitetônica, aprovação de LEANDRO, mudança relevante, descoberta de lacuna, pausa, missão grande ou troca de sessão/projeto.

---

## 6. Protocolo de retomada

1. consultar GitHub live;
2. ler `MCF-NEXTGEN-RESUME-CARD.md`;
3. ler checkpoint mais recente;
4. ler este roadmap;
5. verificar boundaries operacionais;
6. continuar exatamente na `next_question`.

```yaml
last_completed_question: 10
next_question: 11
instruction: NÃO REPETIR Q1-Q10
implementation_authorized: false
```
