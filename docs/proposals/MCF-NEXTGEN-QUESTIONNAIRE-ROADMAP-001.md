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
questions_completed: 12
questions_remaining: 4
last_completed_question: 12
next_question: 13
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
question_12: COMPLETED_APPROVED_BY_LEANDRO_CONCEPTUALLY
question_13: NOT_STARTED
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

`PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`; verdade/governança centralizadas logicamente, execução distribuível conforme hard requirements; fencing/epoch, fail-closed em partições, recovery coerente e portabilidade sem provider como identidade do Core.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md`.

### Q12 — Segurança, permissões e gates
**Status:** `COMPLETED / APPROVED_BY_LEANDRO_CONCEPTUALLY`

Decisão: `POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`.

Síntese:

- default deny para identidade, autoridade, compatibilidade e gates ausentes/obsoletos;
- `AUTHENTICATED != AUTHORIZED`;
- efeitos materiais preservam principal/delegation chain; delegação só pode atenuar autoridade;
- autorização é contextual e, quando aplicável, vinculada a mission/task/attempt/action/resource/audience/environment/security domain/policy/state/expiry;
- model compliance não é security boundary; efeitos materiais exigem policy enforcement verificável fora do modelo;
- bypass direto do governed effect boundary é proibido quando arquiteturalmente controlável;
- mudança de security policy/permissions/gates/credential bindings é efeito privilegiado;
- HUMAN_GATE pertence a LEANDRO e é effect/precondition-bound, expiráveis, protegido contra replay e com modo explícito de consumo;
- fatos/effect preview crítico devem ser separados de recomendação da IA;
- conteúdo externo nunca é autoridade e permanece não confiável através de transformações/handoffs;
- output de modelo não é comando material seguro por definição; ferramentas materiais exigem validação tipada quando aplicável;
- secrets não entram em memória/prompt/log/telemetry por default; preferir references/brokers e credenciais curtas/escopadas;
- workers não são trust peers do Control Plane e devem possuir blast radius limitado;
- cross-project access é `DENY` por default e isolamento alcança storage/credentials conforme aplicável;
- classificação de dados propaga; modelo não pode se autodesclassificar;
- extensões materiais exigem digest, provenance e verificação contra trust policy; `PROVENANCE_PRESENT != ARTIFACT_TRUSTED`;
- Authorization Receipts registram decisão de segurança, mas `RECEIPT != EFFECT_PROOF`;
- revogação e autoridade material remota limitada são obrigatórias;
- Complexity Budget/admission control também funcionam como security budgets;
- políticas de segurança são ativos críticos sujeitos a versionamento, change control, provenance e integridade;
- Core usa autoridade interna por papel; binding atual pode ser LÉO; HUMAN_GATE permanece LEANDRO.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md`.

---

## 4. Perguntas restantes

### Q13 — Como provar que o MCF vale o custo e a complexidade?
**Status:** `NEXT / NOT_STARTED`

Definir métricas, baselines, custo total, qualidade, tempo, retrabalho, autonomia útil, taxa de recuperação, consumo de modelos/providers e critérios objetivos para provar que as camadas adicionadas geram valor real.

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
last_completed_question: 12
next_question: 13
instruction: NÃO REPETIR Q1-Q12
implementation_authorized: false
```
