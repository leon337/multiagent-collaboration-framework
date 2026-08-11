# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Plan

## Identificação
- Missão: `MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT`
- Issue: `#103`
- PR técnico: `#104`
- Classe: `C`
- Baseline: `79c1a1644742cf22af60384b64685adbb1f017a3`
- Estado: `CANDIDATE_PRF_AWAITING_EXACT_HEAD_REVALIDATION`

## Objetivo
Promover `MCF-DEBUG-INCIDENT` de contrato documental para capacidade executável governada pelo `MissionRuntime`, sem ampliar autoridade externa, de produção ou de alteração de ambiente.

## Contrato canônico
- primary owner: `Patricia`
- owners: `Patricia`, `Bruno`, `Rafael`
- handoff: `Renato`
- permission profile: `SCOPED_WRITE`
- required input: `symptom_or_evidence`
- required evidence: `reproduction`, `root_cause`, `recovery_result`
- acceptance: `cause_supported`, `regression_test_added`

## Boundary
Permitido somente `internal / inspect-debug-incident / mcf-agent-runtime`.

Continuam proibidos external write, GitHub provider write, environment mutation, deploy, produção, destructive fix, secret access, public action e blind retry.

## Evidência semântica
- reproduction: sintoma, método de reprodução/caracterização, referência verificável;
- root_cause: causa e evidência de suporte;
- recovery_result: ação/mitigação, verificação, `blind_retry: false`, `retry_evidence` semântico e referência verificável do teste de regressão.

O booleano `blind_retry: false` isolado não basta. Evidência vazia, whitespace, placeholder, objeto vazio ou booleano usado como evidência leva a `RECOVERING`, sem handoff de sucesso.

## Equipe com entrega
Mestre, Miriam, Patricia, Bruno, Rafael, Renato, Beatriz, Vinicius, Ricardo, Augusto, Julia, Carmem, Emily, Leo e Gabriel.

## Fluxo
`baseline → implementação → CAF → PRF → exact-head Foundation + Smoke → manifest → reviews → Augusto → Julia → Emily → Leo → base/head → protected squash merge → tree equivalence → canonical sync separado`.

## Critérios de aceite técnico
- planner seleciona `MCF-DEBUG-INCIDENT` em objetivos inequívocos de debug;
- primary owner Patricia, `READY_AGENT`, handoff Renato;
- bridge não auto-completa a skill;
- Patricia/Bruno/Rafael aceitos; non-owner negado;
- `SCOPED_WRITE` preservado;
- provider externo e ações proibidas negados;
- evidência válida conclui a fase e cria handoff Renato;
- `blind_retry: false` sem `retry_evidence` semântico é rejeitado;
- evidência insuficiente entra em `RECOVERING` sem handoff de sucesso;
- receipt, eventos, persistência e versionamento passam pelo MissionRuntime;
- objetivo explicitamente de segurança contendo a palavra incidente continua em `MCF-SECURITY-REVIEW`, owner Ricardo, `READY_AGENT`, risco Classe C;
- nenhuma capacidade dos Lots 4-A, 4-B ou 4-C regride.

## Estado operacional preservado
```yaml
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```
