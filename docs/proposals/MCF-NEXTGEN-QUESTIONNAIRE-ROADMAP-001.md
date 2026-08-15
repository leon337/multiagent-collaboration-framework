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
questions_completed: 15
questions_remaining: 1
last_completed_question: 15
next_question: 16
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
question_14: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
question_15: COMPLETED_APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW
question_16: NOT_STARTED
implementation_authorized: false
```

---

## 3. Decisões concluídas

### Q1 — Finalidade principal
Foco inicial: sistema pessoal de trabalho com IA para LEANDRO, continuidade durável, equipes especializadas e prova em uso real antes de generalização.

### Q2 — Continuidade de contexto
`LAYERED_CONTINUITY_ARCHITECTURE`. Checkpoint 004.

### Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`. Checkpoint 005.

### Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; Authority Envelope; TEAM_FIRST; HUMAN_GATE exclusivamente de LEANDRO quando exigido. Checkpoint 006.

### Q5 — Roteador de modelos
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements antes de otimização; fallback compatível; Routing Receipt. Checkpoint 007.

### Q6 — Independência
`INDEPENDENCE != DIVERSITY`; blind-first, evidência e decisão próprias; assurance proporcional ao risco. Checkpoint 008.

### Q7 — Orquestração
`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico, loops limitados, paralelismo seguro, joins, replanning versionado e Completion Contract. Checkpoint 009.

### Q8 — Persistência
`LAYERED_CANONICAL_PERSISTENCE`; canonical knowledge, operational state, transition ledger, evidence e derived views. Checkpoint 010.

### Q9 — Experiência humana e observabilidade
`ACTIONABLE_PROGRESSIVE_OBSERVABILITY`; Decision Inbox, progressive disclosure, freshness e atenção humana orientada à mudança material. Checkpoint 011.

### Q10 — Core vs extensões
`MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`; Constitutional Kernel + Core Services; plugins/skills/profiles/factories governados. Checkpoint 012.

### Q11 — Infraestrutura e placement
`PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`; logical planes, durable dispatch, fencing/epoch, fail-closed em partições, recovery coerente e provider-neutral Core. Checkpoint 013.

### Q12 — Segurança, permissões e gates
`POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`; default deny, delegação atenuante, enforcement fora do modelo, HUMAN_GATE de LEANDRO effect-bound/replay-protected, secret minimization e supply-chain trust verificável. Checkpoint 014.

### Q13 — Métricas e prova de valor
`PREDECLARED_COMPARATIVE_VALUE_EVALUATION`; Evaluation Contract prévio, baseline crível, hard constraints antes de otimização, scorecard multidimensional e evidência para Q15. Checkpoint 015.

### Q14 — Portabilidade e utilidade externa
`CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION`; portability matrix, clean-room, migration-safe activation, authority rebinding, exit portability, Fresh Project/Operator/Context e níveis de evidência externa. Checkpoint 016.

### Q15 — Preservar, simplificar, remover ou substituir
**Status:** `COMPLETED / APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW`

Decisão: `PRESERVE_INVARIANTS_REDUCE_IMPLEMENTATION`.

Síntese:

- preservar invariantes/capacidades, não necessariamente implementações atuais;
- disposições: `PRESERVE`, `SIMPLIFY`, `REPLACE`, `REMOVE`, `INCONCLUSIVE`, `ADD_REQUIRED`;
- ausência de evidência exige `INCONCLUSIVE` em vez de poda inventada;
- `REMOVE_FROM_CORE != DELETE`;
- durable state, evidence/provenance, transition ledger, receipts, governed effects, fail-closed, TEAM_FIRST, Agent/Skill Contracts, observability/recovery e stable baseline são preservados semanticamente;
- receipts/docs operacionais devem ser automatizados/derivados sem remover auditabilidade;
- keyword planner, special-case PermissionEngine, HDF com identidades hardcoded e taxonomia A/B/C canônica futura devem ser substituídos gradualmente;
- 29 agentes permanecem como história/contratos, mas não como requisito do Core e seu default ativo fica sujeito a evidência;
- 16 skills permanecem como evidência/regressão, sem congelar provider bindings ou handoffs atuais;
- GitHub, Render e PostgreSQL podem continuar adapters/defaults, não identidade constitucional;
- runtime deve reduzir coupling ao host `rede-social-agentes` por boundary lógico, sem implicar microservices;
- stable v1.0.0 é baseline/migration source, não rollback automático após mudança de dados/schema;
- disposition decisions precisam respeitar dependency graph;
- sunset exige replacement, semantic conformance, migration/compatibility e ausência de dependência ativa;
- capabilities novas aprovadas em Q1–Q14 entram como `ADD_REQUIRED`, sem autorização de implementação.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-017.md`.

---

## 4. Pergunta restante

### Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?
**Status:** `NEXT / NOT_STARTED`

Reconciliar Q1–Q15; definir arquitetura alvo, boundaries finais, plano de migração/compatibilidade, acceptance criteria, riscos/recovery e GO/NO-GO conceitual. Nenhuma implementação é autorizada sem aprovação final explícita de LEANDRO conforme o protocolo vigente.

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
last_completed_question: 15
next_question: 16
instruction: NÃO REPETIR Q1-Q15
implementation_authorized: false
```
