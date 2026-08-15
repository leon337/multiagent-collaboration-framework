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
questions_completed: 11
questions_remaining: 5
last_completed_question: 11
next_question: 12
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
question_11: COMPLETED_APPROVED_BY_LEANDRO
question_12: NOT_STARTED
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

`MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`; Constitutional Kernel + Core Service contracts; extensões governadas/versionadas; Profile declarativo; Factory gera blueprint; dependência Extension→Core; compatibilidade fail-closed.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-012.md`.

### Q11 — Infraestrutura e placement
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão: `PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`.

Síntese:

- Control, State, Execution, Integration e Presentation são planos lógicos, não necessariamente serviços físicos separados;
- autoridade canônica do Control Plane é lógica e única; multi-writer sem coordenação/fencing é proibido;
- State Plane pode ser local/self-hosted; scratch privado de worker não vira project truth;
- queue não é fonte de verdade da task;
- execução distribuída usa attempt identity, leases e fencing/epoch ou equivalente;
- clock do worker não é autoridade de lease;
- partição sem revalidação de autoridade não permite novo efeito material;
- execução offline, se existir, depende de envelope pré-autorizado e limitado;
- efeitos materiais atravessam fronteira governada; blind retry é proibido;
- placement preserva hard requirements de confiança, locality, capacidade, autoridade e compatibilidade;
- data locality inclui input, output, evidence, telemetry e cache;
- incompatibilidade desconhecida de worker/runtime torna node inelegível;
- source revision e artifact digest são identidades distintas;
- app redeploy/rollback, data restore, compensation e failover são conceitos diferentes;
- admission control e backpressure são obrigatórios; spawning ilimitado é proibido;
- recovery considera failure domains e ponto coerente entre state/ledger/evidence/configuração;
- emergency stop remoto pode não ser instantâneo sob partição; autoridade material remota deve ser limitada/expirável;
- portabilidade não exige active multi-cloud;
- provider binding não pertence à identidade constitucional;
- placement material produz `Placement Receipt`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md`.

---

## 4. Perguntas restantes

### Q12 — Quais controles de segurança, permissões e gates são essenciais?
**Status:** `NEXT / NOT_STARTED`

Definir autenticação, identidade de workloads/agentes, least privilege, secrets, sandbox, network/egress policy, extensão/supply-chain trust, prompt-injection boundaries, gates, revogação e enforcement técnico de autoridade.

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
last_completed_question: 11
next_question: 12
instruction: NÃO REPETIR Q1-Q11
implementation_authorized: false
```
