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
- Leandro não é executor técnico padrão nem destinatário de handoff técnico;
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

## Estado técnico após o Lot 4-E

```yaml
skills_registradas: 16
skills_executaveis: 16
skills_documentais: 0
remaining_documental: []

mcf_close_phase:
  executable: true
  planner_state: READY_AGENT
  primary_owner: Carmem
  owners: [Carmem, Emily, Leo, Mestre]
  handoff: Mestre
  permission_profile: SCOPED_WRITE
  provider: internal
  operation: close-phase
  resource: mcf-agent-runtime
  external_write: false
  truthful_terminal_state: REQUIRED
  hdf: ACTIVE

runtime_006_lote_4e:
  issue: 107
  technical_pr: 108
  technical_candidate: 3b202d26b08d8acb72538db77e0e3b86d540dc97
  technical_merge: 6cf9af35407b97d84028078ab6843570b47103fe
  candidate_merge_tree_equivalence: PASS
  canonical_sync: IN_PROGRESS

production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
```

## Skills executáveis

1. `MCF-START-MISSION`
2. `MCF-SELECT-AGENTS`
3. `MCF-RECOVER-CONTEXT`
4. `MCF-DEFINE-PRODUCT`
5. `MCF-DESIGN-EXPERIENCE`
6. `MCF-DESIGN-ARCHITECTURE`
7. `MCF-IMPLEMENT-CHANGE`
8. `MCF-REVIEW-CODE`
9. `MCF-RUN-TESTS`
10. `MCF-GIT-PR-RELEASE`
11. `MCF-DEPLOY-VALIDATE`
12. `MCF-TRACE-MISSION`
13. `MCF-EVALUATE-AGENTS`
14. `MCF-SECURITY-REVIEW`
15. `MCF-DEBUG-INCIDENT`
16. `MCF-CLOSE-PHASE`

Não há skill documental remanescente no runtime integrado.

## Lot 4-E — Close Phase

`MCF-CLOSE-PHASE` opera como `READY_AGENT`, com Carmem como primary owner e Mestre como handoff técnico. O boundary integrado permanece:

```text
internal / close-phase / mcf-agent-runtime
```

A skill exige evidência semântica estruturada para `phase_pack`, `audit_verdict`, `leo_decision` e `checkpoint`. Um estado `ENTREGUE` é rejeitado se houver objetivo não atendido, blockers, findings não resolvidos ou bloqueantes, auditoria não-PASS, próxima ação pendente, ação humana pendente, decisão não aprovadora de Léo ou divergência entre decisão e checkpoint.

O antigo `handoff_to: Leandro` foi reconciliado para `handoff_to: Mestre`. LEANDRO permanece autoridade humana final e só pode ser acionado por um `HUMAN_GATE` explícito; não é executor nem handoff técnico.

### Evidência técnica

```yaml
final_candidate: 3b202d26b08d8acb72538db77e0e3b86d540dc97
foundation_run: 31485695643
foundation: PASS
container_smoke_run: 31485695636
container_smoke: PASS
documentation_validation_run: 31485695606
documentation_validation: PASS
server_test_files: 125
server_tests: 562
failed_tests: 0
prf_manifest_audit_run: 31485724987
prf_manifest_audit: PASS
specialist_reviews: PASS
augusto_trace: PASS
carmem_prf_review: PASS
julia_governance: PASS
emily_independent_audit: PASS
leo_gate: PASS
technical_merge: COMPLETE
candidate_merge_tree_equivalence: PASS
post_merge_documentation_run: 31486181380
post_merge_documentation: PASS
```

## Documentação canônica

- `docs/runtime/README.md`
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `artifacts/phases/PHASE-006-LOT-4-E-CLOSE-PHASE/`

## Próximo boundary

Após concluir a sincronização documental canônica do Lot 4-E, o próximo boundary separado do RUNTIME-006 é a preparação da **Release Candidate / Gate E**.

Produção continua fora desse boundary e permanece `BLOCKED`.
