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
questions_completed: 14
questions_remaining: 2
last_completed_question: 14
next_question: 15
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
question_15: NOT_STARTED
implementation_authorized: false
```

---

## 3. Decisões concluídas

### Q1 — Finalidade principal
Foco inicial: sistema pessoal de trabalho com IA para LEANDRO, continuidade durável, equipes especializadas e prova em uso real antes de generalização.

### Q2 — Continuidade de contexto
`LAYERED_CONTINUITY_ARCHITECTURE`. Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

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
`PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`; logical planes, durable dispatch, leases + fencing/epoch, fail-closed em partições, recovery coerente e provider-neutral Core. Checkpoint 013.

### Q12 — Segurança, permissões e gates
`POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`; default deny, delegação atenuante, enforcement fora do modelo, HUMAN_GATE de LEANDRO effect-bound/replay-protected, secret minimization, worker blast-radius limitado e supply-chain trust verificável. Checkpoint 014.

### Q13 — Métricas e prova de valor
`PREDECLARED_COMPARATIVE_VALUE_EVALUATION`; Evaluation Contract prévio, baseline crível, hard constraints antes de otimização, scorecard multidimensional, uncertainty/generalization scope e `component_value_evidence` para Q15. Checkpoint 015.

### Q14 — Portabilidade e utilidade externa
**Status:** `COMPLETED / APPROVED_BY_LEANDRO_AFTER_NO_BLOCKER_REVIEW`

Decisão: `CLEAN_ROOM_PORTABILITY_AND_EXTERNAL_UTILITY_VALIDATION`.

Síntese:

- portabilidade é matriz, não booleano;
- clean-room usa artefato identificado e não depende de working tree, chat anterior ou dependências não documentadas;
- compatibility envelope e negative tests precisam ser declarados;
- dimensões: runtime, provider, data, operational, project/domain, context e exit portability;
- níveis de evidência: `DECLARED`, `CONFORMANCE_TESTED`, `MIGRATION_PROVED`, `FIELD_PROVED`;
- migração usa checkpoint coerente e trata in-flight tasks/effects para impedir replay silencioso;
- import passa por `VALIDATE -> RECONCILE -> ACTIVATE`; nenhum novo efeito material antes da ativação;
- HUMAN_GATE/temporary authority não atravessam automaticamente ambientes;
- secrets são rebindados, não copiados como estado normal;
- target policy/capabilities devem satisfazer hard requirements;
- semantic equivalence não exige byte identity; identity mapping auditável é permitido;
- export sozinho não prova portabilidade; import/reconstruction precisa ser testado;
- evidence references externas precisam continuar resolvíveis/arquivadas ou ser marcadas broken;
- Factory/Profile/default distribution também entram na prova para detectar lock-in deslocado;
- Fresh Project, Fresh Operator e Fresh Context fazem parte da sequência de validação;
- external utility distingue `DEMO`, `CONTROLLED_TRIAL`, `INDEPENDENT_TRIAL`, `FIELD_USE`;
- onboarding esperado é separado de rescue/hidden manual fixes;
- uma experiência externa não autoriza generalização universal;
- Portability Receipt registra a prova;
- claims preservados exigem futura portability regression suite;
- Q14 reutiliza a metodologia de Q13.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-016.md`.

---

## 4. Perguntas restantes

### Q15 — O que deve ser preservado, simplificado, removido ou substituído?
**Status:** `NEXT / NOT_STARTED`

Classificar o que existe hoje e o que foi proposto em Q1–Q14 usando `PRESERVE / MODIFY / SIMPLIFY / REMOVE / REPLACE / ADD`, sem preservar complexidade por inércia.

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
last_completed_question: 14
next_question: 15
instruction: NÃO REPETIR Q1-Q14
implementation_authorized: false
```
