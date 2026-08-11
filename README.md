# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, instrumentalização controlada, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.
- O protocolo operacional vigente está em `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

## Regras operacionais centrais

- execução silenciosa de agentes é proibida;
- toda atuação deve ser exposta cronologicamente pelo padrão ESEV;
- agentes sem entrega real não podem ser listados como participantes;
- falhas recuperáveis seguem CAF e retornam ao fluxo original;
- fases Classe B/C exigem PRF próprio e rastreável;
- ações externas exigem autorização, menor privilégio e evidência verificável;
- sucesso não pode ser fabricado por texto, booleano ou ausência de evidência;
- CI verde conclui a fase que ele prova, não a missão inteira;
- Leandro não é executor técnico padrão e só recebe `HUMAN_GATE` em matérias reservadas;
- produção permanece bloqueada até gate material próprio.

## Runtime executável

```text
objetivo conversacional
→ Chat-to-Runtime Bridge
→ MissionRuntime
→ SkillRegistryLoader
→ Human Delegation Firewall
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ PostgreSQL / Event Ledger
→ Handoff / CAF
→ trace final verificado
```

### Estado canônico após o Lot 4-D

```yaml
skills_registradas: 16
skills_executaveis: 15
skills_documentais: 1
remaining_documental:
  - MCF-CLOSE-PHASE

mcf_debug_incident:
  executable: true
  planner_state: READY_AGENT
  primary_owner: Patricia
  owners:
    - Patricia
    - Bruno
    - Rafael
  handoff: Renato
  permission_profile: SCOPED_WRITE
  provider: internal
  operation: inspect-debug-incident
  resource: mcf-agent-runtime
  external_write: false
  semantic_evidence: PASS
  blind_retry_protection: PASS
  destructive_fix_protection: PASS
  regression_test_evidence: PASS

runtime_006_lote_4d:
  issue: 103
  technical_pr: 104
  technical_candidate: dccb41f146f5701f75d8762df89160bf2f1695a7
  technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
  candidate_merge_tree_equivalence: PASS
  foundation_run: 31479541126
  container_smoke_run: 31479541177
  specialist_reviews: PASS
  independent_audit_emily: PASS
  leo_gate: PASS
  canonical_sync: IN_PROGRESS

production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
```

### Skills executáveis

- `MCF-START-MISSION`
- `MCF-SELECT-AGENTS`
- `MCF-RECOVER-CONTEXT`
- `MCF-DEFINE-PRODUCT`
- `MCF-DESIGN-EXPERIENCE`
- `MCF-DESIGN-ARCHITECTURE`
- `MCF-EVALUATE-AGENTS`
- `MCF-SECURITY-REVIEW`
- `MCF-DEBUG-INCIDENT`
- `MCF-IMPLEMENT-CHANGE`
- `MCF-REVIEW-CODE`
- `MCF-RUN-TESTS`
- `MCF-GIT-PR-RELEASE`
- `MCF-DEPLOY-VALIDATE`
- `MCF-TRACE-MISSION`

`MCF-CLOSE-PHASE` permanece documental e é o próximo boundary separado do RUNTIME-006.

## RUNTIME-006 — progresso

| Boundary | Estado |
|---|---|
| Fundação / estabilização | Integrado |
| Gate A — contrato comum | Integrado |
| Gate B — leitura externa | Integrado |
| C1/C2 — escrita reversível | Integrado tecnicamente; Gate C real-write continua parcial |
| Gate D — staging | Integrado |
| Observabilidade / recuperação | Integrado |
| Lot 4-A — quatro skills de domínio | Integrado |
| Lot 4-B — `MCF-EVALUATE-AGENTS` | Integrado |
| Lot 4-C — `MCF-SECURITY-REVIEW` | Integrado |
| Lot 4-D — `MCF-DEBUG-INCIDENT` | Integrado tecnicamente; canonical sync em fechamento |
| `MCF-CLOSE-PHASE` | Próximo boundary; não implementado neste Lot |
| Release Candidate | Pendente |
| Produção | Bloqueada |

### Lot 4-D — Debug Incident

A Issue `#103` e o PR técnico `#104` promovem `MCF-DEBUG-INCIDENT` para execução governada `READY_AGENT`.

O boundary técnico é deliberadamente restrito:

```text
internal / inspect-debug-incident / mcf-agent-runtime
```

O perfil canônico continua `SCOPED_WRITE`, mas não concede escrita externa neste Lot. GitHub write, mutação de ambiente, deploy, produção, destructive fix, secret/public action e blind retry permanecem proibidos.

A recuperação válida precisa demonstrar:

- reprodução ou caracterização significativa;
- causa raiz sustentada;
- ação, isolamento ou mitigação;
- verificação do resultado;
- `blind_retry: false` **mais** `retry_evidence` semântico independente;
- referência verificável de teste de regressão.

Evidência insuficiente leva a `RECOVERING`, sem handoff de sucesso para Renato.

O candidato técnico `dccb41f146f5701f75d8762df89160bf2f1695a7` passou Foundation `31479541126`, Container Smoke `31479541177`, reviews especialistas, trace de Augusto, governança de Júlia, PRF/manifesto de Carmem, auditoria independente de Emily e gate técnico de Léo. O squash merge `94d8944c25ac26df3facb4f343a7a75c2489d704` compartilha com o candidato a mesma tree `39d2cd29b5990d4261e23655c272691c8a60b4e7`.

Três CAFs ficaram registrados no PRF:

1. correção de formatação canônica;
2. rejeição de `blind_retry: false` como prova isolada, tornando `retry_evidence` obrigatório;
3. remoção de termos genéricos `incidente/incident` que poderiam capturar uma rota explícita de security review e remover seu piso Classe C.

## Estado dos limites externos

O MCF não deve inferir autoridade externa a partir da existência de uma skill ou adapter.

```yaml
gate_c_real_provider_write: NOT_AUTHORIZED
live_staging_adapter: DISABLED
production: BLOCKED
publicacao_social_automatica: false
```

## Documentação canônica

- `docs/runtime/README.md`
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `docs/decisions/MCF-DEC-061-GITHUB-ACTIONS-ONE-SHOT-TEAM-FIRST-FALLBACK.md`
- `artifacts/phases/PHASE-006-LOT-4-D-DEBUG-INCIDENT/`

O detalhe histórico dos Lots anteriores permanece nos respectivos PRFs, Issues, PRs e decisões. Este README apresenta somente o estado canônico atual.

## Próximo boundary

Após concluir e integrar o canonical documentation sync do Lot 4-D, o próximo boundary do RUNTIME-006 será formalizado separadamente para:

`MCF-CLOSE-PHASE`

Ele **não** faz parte da implementação do Lot 4-D.
