# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Plan

## Identificação

- Missão: `MCF-RUNTIME-006-LOT-4-D-DEBUG-INCIDENT`
- Issue: `#103`
- PR técnico: `#104`
- Classe de risco: `C`
- Baseline: `79c1a1644742cf22af60384b64685adbb1f017a3`
- Candidato pré-PRF: `933c8f72dd19219eea6112adfdd8db7c43112f2c`
- Estado do PRF: `CANDIDATE_PRF_AWAITING_EXACT_HEAD_REVALIDATION`

## Objetivo

Promover `MCF-DEBUG-INCIDENT` de contrato documental para capacidade executável governada pelo `MissionRuntime`, sem ampliar autoridade externa, de produção ou de alteração de ambiente.

## Contrato canônico confirmado

- primary owner: `Patricia`
- owners: `Patricia`, `Bruno`, `Rafael`
- handoff: `Renato`
- permission profile: `SCOPED_WRITE`
- required input: `symptom_or_evidence`
- required evidence: `reproduction`, `root_cause`, `recovery_result`
- acceptance criteria: `cause_supported`, `regression_test_added`

## Boundary do Lot 4-D

Permitido somente:

```text
provider: internal
operation: inspect-debug-incident
resource: mcf-agent-runtime
```

Continuam proibidos:

- external write;
- GitHub provider write;
- environment mutation;
- deploy e produção;
- destructive fix;
- secret access;
- public action;
- blind retry.

## Evidência semântica

`reproduction` deve identificar sintoma, método de reprodução ou caracterização e referência de evidência. `root_cause` deve identificar uma causa sustentada por evidência. `recovery_result` deve registrar ação ou mitigação, verificação, `blind_retry: false`, evidência semântica separada em `retry_evidence` demonstrando que não ocorreu blind retry e referência verificável de teste de regressão.

O booleano `blind_retry: false` isolado não constitui evidência suficiente. Evidência vazia, booleana, whitespace, placeholder ou claim não verificável deve levar a `RECOVERING`, sem handoff de sucesso.

## Equipe com entrega

- Mestre — orquestração e closeout;
- Miriam — recuperação e precedência do contexto;
- Patricia — contrato de debugging e ownership primário;
- Bruno — boundary operacional e recovery;
- Rafael — implementação;
- Renato — testes e validação;
- Beatriz — comportamento do planner e seleção;
- Vinicius — revisão de código;
- Ricardo — revisão de segurança;
- Augusto — mission trace Classe C;
- Julia — governança Classe C;
- Carmem — PRF e consistência documental;
- Emily — auditoria independente;
- Leo — technical gate;
- Gabriel — PR e merge protegido por HEAD esperado.

## Fluxo de validação

```text
baseline
→ implementação
→ CAF quando necessário
→ pré-PRF Foundation + Container Smoke
→ PRF Classe C
→ Foundation + Container Smoke no HEAD exato do PRF
→ manifesto
→ reviews especialistas
→ CAF e nova validação se review encontrar defeito
→ Augusto
→ Julia
→ Emily
→ Leo
→ base/head final
→ squash merge protegido
→ candidate/merge tree equivalence
→ canonical documentation sync separado
```

## Critérios de aceite técnico

- planner seleciona `MCF-DEBUG-INCIDENT` e produz `READY_AGENT`;
- bridge não auto-completa a skill;
- Patricia, Bruno e Rafael são owners válidos;
- non-owner é negado;
- `SCOPED_WRITE` permanece canônico;
- provider externo e ações proibidas são negados;
- evidência semântica válida conclui a fase e cria handoff para Renato;
- `blind_retry: false` sem `retry_evidence` semântico é rejeitado;
- evidência insuficiente entra em `RECOVERING` sem handoff de sucesso;
- receipt, eventos, persistência e versionamento são exercitados pelo `MissionRuntime`;
- regressões dos Lots 4-A, 4-B e 4-C permanecem verdes.

## Estado operacional preservado

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```
