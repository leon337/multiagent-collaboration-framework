# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.
- O protocolo operacional vigente está em `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

## Regras centrais

- ESEV obrigatório: atuação real deve ser exposta cronologicamente;
- CAF obrigatório para falhas recuperáveis;
- PRF rastreável para fases Classe B/C;
- sucesso sem evidência é proibido;
- evidência de gate pertence ao SHA exato;
- Leandro não é executor técnico padrão;
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

## Estado canônico após o Lot 4-D

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
  owners: [Patricia, Bruno, Rafael]
  handoff: Renato
  permission_profile: SCOPED_WRITE
  provider: internal
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
  technical_tree_equivalence: PASS
  canonical_pr: 105
  canonical_candidate: 41f2ed1cda3e9cb2812bb7f8e8bee9553a0140b9
  canonical_merge: 59b230e8ad834b88c1dc4363bc9a28499881e1fe
  canonical_sync: COMPLETE

production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
```

## Skills executáveis

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

Documental restante: `MCF-CLOSE-PHASE`.

## Lot 4-D — Debug Incident

`MCF-DEBUG-INCIDENT` opera como `READY_AGENT`, com Patricia como primary owner e Renato como handoff. O boundary do Lot permanece:

```text
internal / inspect-debug-incident / mcf-agent-runtime
```

O perfil canônico continua `SCOPED_WRITE`, mas GitHub write, mutação de ambiente, deploy, produção, destructive fix, secret/public action e blind retry continuam proibidos.

A recuperação válida exige reprodução ou caracterização, causa sustentada, ação/mitigação, verificação, `blind_retry: false`, `retry_evidence` semântico independente e referência verificável de teste de regressão. Evidência insuficiente leva a `RECOVERING`, sem handoff de sucesso.

### Evidência técnica

```yaml
foundation_run: 31479541126
foundation: PASS
container_smoke_run: 31479541177
container_smoke: PASS
manifest_audit: PASS
specialist_reviews: PASS
augusto_trace: PASS
julia_governance: PASS
emily_audit: PASS
leo_gate: PASS
technical_merge: COMPLETE
candidate_merge_tree_equivalence: PASS
```

Três CAFs ficaram preservados no PRF: formatação, prova semântica de ausência de blind retry e correção da sobreposição de roteamento com security review.

## Canonical documentation sync

O PR documental `#105` foi mesclado separadamente após validação documental, manifesto, governança, auditoria independente e gate documental. A sincronização reconciliou o estado para `16 / 15 / 1` e deixou somente `MCF-CLOSE-PHASE` como boundary documental futuro.

## Documentação canônica

- `docs/runtime/README.md`
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `artifacts/phases/PHASE-006-LOT-4-D-DEBUG-INCIDENT/`

## Próximo boundary

`MCF-CLOSE-PHASE`

Ele não foi implementado pelo Lot 4-D e deve ser formalizado separadamente.
