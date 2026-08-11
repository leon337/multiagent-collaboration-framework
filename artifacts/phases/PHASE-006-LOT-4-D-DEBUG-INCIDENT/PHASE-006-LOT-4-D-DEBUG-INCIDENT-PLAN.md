# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Plan

## Estado da fase

```yaml
mission: MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT
issue: 103
risk_class: C
technical_pr: 104
technical_state: MERGED
canonical_sync_state: CANDIDATE
```

## Objetivo

Promover `MCF-DEBUG-INCIDENT` para capacidade executável governada pelo runtime, sem conceder nova autoridade externa, e reconciliar a documentação canônica após a integração técnica.

## Contrato

```yaml
skill_id: MCF-DEBUG-INCIDENT
primary_owner: Patricia
owners: [Patricia, Bruno, Rafael]
required_input: symptom_or_evidence
permission_profile: SCOPED_WRITE
planner_state: READY_AGENT
provider: internal
operation: inspect-debug-incident
resource: mcf-agent-runtime
handoff: Renato
required_evidence: [reproduction, root_cause, recovery_result]
acceptance: [cause_supported, regression_test_added]
```

## Boundary

```yaml
external_write: FORBIDDEN
github_provider_write: FORBIDDEN
environment_mutation: FORBIDDEN
deploy: FORBIDDEN
production_action: FORBIDDEN
destructive_fix: FORBIDDEN
secret_access: FORBIDDEN
public_action: FORBIDDEN
blind_retry: FORBIDDEN
```

`SCOPED_WRITE` permanece canônico, mas não é autorização genérica para efeito externo neste Lot.

## Evidência

`reproduction`, `root_cause` e `recovery_result` precisam conter conteúdo semântico. `recovery_result` exige ação/mitigação, verificação, `blind_retry: false`, `retry_evidence` semântico independente e referência verificável de teste de regressão.

Evidência insuficiente deve produzir `RECOVERING` e nunca handoff de sucesso.

## Validação técnica concluída

```yaml
candidate_sha: dccb41f146f5701f75d8762df89160bf2f1695a7
foundation_run: 31479541126
container_smoke_run: 31479541177
foundation: PASS
container_smoke: PASS
manifest_audit: PASS
specialist_reviews: PASS
augusto_trace: PASS
julia_governance: PASS
emily_audit: PASS
leo_gate: PASS
technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
candidate_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
merge_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
tree_equivalence: PASS
```

## Canonical sync

O sync separado deve:

1. atualizar os índices canônicos para 16 registradas / 15 executáveis / 1 documental;
2. registrar somente `MCF-CLOSE-PHASE` como documental restante;
3. preservar produção bloqueada, live staging desabilitado e Gate C real-write não autorizado;
4. atualizar este PRF para o estado técnico integrado;
5. gerar novo manifesto SHA-256;
6. passar validação documental no HEAD exato;
7. receber gate documental;
8. fazer squash merge protegido e prova de equivalência de tree;
9. somente então permitir o encerramento da Issue #103.

## Próximo boundary

`MCF-CLOSE-PHASE` permanece fora do escopo deste Lot e deverá ser formalizado separadamente.
