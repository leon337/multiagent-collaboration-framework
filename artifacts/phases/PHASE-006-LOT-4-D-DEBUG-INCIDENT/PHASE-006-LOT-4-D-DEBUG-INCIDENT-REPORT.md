# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Report

## Resultado técnico

`MCF-DEBUG-INCIDENT` foi promovida a capacidade executável governada e integrada por squash no PR técnico `#104`.

```yaml
technical_candidate: dccb41f146f5701f75d8762df89160bf2f1695a7
technical_merge: 94d8944c25ac26df3facb4f343a7a75c2489d704
candidate_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
merge_tree: 39d2cd29b5990d4261e23655c272691c8a60b4e7
candidate_merge_tree_equivalence: PASS
```

## Comportamento integrado

- planner seleciona a skill em objetivos inequívocos de debug;
- primary owner: Patricia;
- owners válidos: Patricia, Bruno, Rafael;
- state: `READY_AGENT`;
- bridge não auto-completa a skill;
- handoff: Renato somente após sucesso válido;
- `SCOPED_WRITE` permanece canônico;
- execução Lot 4-D limitada a `internal / inspect-debug-incident / mcf-agent-runtime`;
- provider externo e efeitos proibidos são recusados;
- evidência insuficiente produz `RECOVERING`.

## Evidência semântica

### reproduction

Requer:
- sintoma significativo;
- método de reprodução ou caracterização;
- referência verificável.

### root_cause

Requer:
- causa significativa;
- evidência de suporte.

### recovery_result

Requer:
- ação, isolamento ou mitigação;
- verificação do resultado;
- `blind_retry: false`;
- `retry_evidence` semântico independente;
- referência verificável de teste de regressão.

Booleanos, placeholders, vazio, whitespace e objetos vazios não substituem evidência.

## Validação do candidato técnico

```yaml
foundation_run: 31479541126
foundation: PASS
container_smoke_run: 31479541177
container_smoke: PASS
server_test_files: 122
server_tests: 527
web_tests: 5
ops_tests: 20
failed_tests: 0
vitest_artifact: 9096661981
vitest_digest: sha256:e689b3f6453666992509676f30f63f98d49a33582ca8adcf378c732f3f36848f
manifest_audit: PASS
beatriz_review: PASS
vinicius_review: PASS
ricardo_review: PASS
renato_validation: PASS
augusto_trace: PASS
julia_governance: PASS
carmem_prf: PASS
emily_independent_audit: PASS
leo_technical_gate: PASS
```

## CAFs preservados

### CAF #1 — formatting

O candidato `3ea30e9a...` falhou no Foundation `31476698797` em formatação. Um SHA diagnóstico foi usado apenas para emitir o diff canônico do Prettier; depois houve novo SHA e revalidação.

### CAF #2 — blind retry

Vinicius bloqueou o primeiro PRF porque `blind_retry: false` isolado era claim booleano. `retry_evidence` semântico passou a ser obrigatório e os testes negativos/positivos foram ampliados.

### CAF #3 — routing

Beatriz bloqueou uma sobreposição potencial entre o termo genérico de incidente e security review. `incidente/incident` deixaram de ser gatilhos genéricos de debug e foi adicionada regressão que mantém security review com Ricardo e Classe C.

## Integração

O merge técnico ocorreu somente após o gate no SHA exato e foi protegido por `expected_head_sha`. A tree Git do candidato e a tree do squash merge são idênticas.

## Canonical documentation sync

Estado neste PRF:

```yaml
technical_integration: COMPLETE
canonical_documentation_sync: CANDIDATE
issue_103: OPEN_UNTIL_DOCUMENTARY_MERGE
```

A sincronização documental separada atualiza índices canônicos para `16 / 15 / 1`, regenera o manifesto, passa por validação/gate documental e só então permite fechar a Issue #103.

## Limites preservados

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```
