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
questions_completed: 13
questions_remaining: 3
last_completed_question: 13
next_question: 14
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
question_13: COMPLETED_APPROVED_BY_LEANDRO
question_14: NOT_STARTED
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

`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements antes de custo/latência/quota; fallback compatível/limitado; Routing Receipt.

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

`ACTIONABLE_PROGRESSIVE_OBSERVABILITY`; Decision Inbox, atenção humana separada de severidade operacional, aprovação version-bound, UI derivada com freshness, progressive disclosure e notificações por mudança material.

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

`POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`; default deny, cadeia de delegação atenuante, enforcement fora do modelo para efeitos materiais, HUMAN_GATE de LEANDRO effect-bound/replay-protected, trust propagation, secret minimization, worker blast-radius limitado, cross-project deny e supply-chain trust verificável.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md`.

### Q13 — Métricas, prova de valor e custo
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão: `PREDECLARED_COMPARATIVE_VALUE_EVALUATION`.

Síntese:

- toda alegação forte de valor nasce de Evaluation Contract definido antes da execução;
- baseline deve ser crível e responder à hipótese testada;
- modos: `CONTROLLED_COMPONENT`, `EQUAL_BUDGET`, `PRACTICAL_ALTERNATIVE`;
- Development, Regression, Holdout e Real-world sets têm funções distintas;
- ground truth determinístico é preferido quando disponível; candidate self-grading sozinho é insuficiente;
- runs estocásticos exigem repetição/uncertainty quando a variância for material;
- modelos, providers, profiles, graders e scenarios relevantes são versionados;
- hard constraints precedem otimização; falha crítica não pode desaparecer em média;
- `UNAUTHORIZED_SUCCESS = FAILURE`;
- correct block/unknown contam como corretos, mas overblocking/false unknown também são falhas;
- scorecard default é multidimensional, sem score único ocultando trade-offs;
- custo marginal e estrutural são separados;
- métricas distinguem `OBSERVED`, `COMPUTED`, `HUMAN_REPORTED`, `ESTIMATED`;
- benchmark controlado e field observation produzem tipos diferentes de evidência;
- conclusions possíveis: `BENEFICIAL`, `NON_INFERIOR`, `TRADEOFF`, `REGRESSED`, `DISQUALIFIED_HARD_CONSTRAINT`, `INCONCLUSIVE`;
- complexidade só se justifica por valor mensurável ou invariante obrigatório;
- preservar invariante não obriga preservar a implementação atual;
- Q13 produz `component_value_evidence` para orientar Q15.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-015.md`.

---

## 4. Perguntas restantes

### Q14 — Como validar portabilidade e utilidade fora do ambiente atual?
**Status:** `NEXT / NOT_STARTED`

Definir como provar portabilidade real entre providers/runtimes/projetos e como validar utilidade para contextos externos sem confundir compatibilidade declarada, demo controlada e evidência de uso real.

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
last_completed_question: 13
next_question: 14
instruction: NÃO REPETIR Q1-Q13
implementation_authorized: false
```
