# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Report

## Estado

`CANDIDATE_PRF_AWAITING_EXACT_HEAD_REVALIDATION`

O incremento técnico está no PR `#104`. Este relatório registra somente evidência observada; nenhum review final, auditoria, gate ou merge é antecipado.

## Baseline e candidatos superseded

- baseline `main`: `79c1a1644742cf22af60384b64685adbb1f017a3`
- pré-PRF `933c8f72dd19219eea6112adfdd8db7c43112f2c`: Foundation `31477171098` PASS e Container Smoke `31477171096` PASS, depois superseded pelo PRF;
- primeiro PRF `9ebedbaa85bfa92d52f199df064382e075adb1d3`: Foundation `31477910252` PASS e Container Smoke `31477910266` PASS, depois `SUPERSEDED_BY_REVIEW_CAF`;
- artifact do primeiro PRF: `9096020199`, digest `sha256:e1af159fcb0c59acd403baa3dff401144dd7475b5b2225295c3e4823d6cec310`.

## Implementação

1. `McfExecutableSkillId` inclui `MCF-DEBUG-INCIDENT`.
2. Planner: `Patricia → Renato`, provider `internal`, `inspect-debug-incident`, `mcf-agent-runtime`, estado `READY_AGENT`.
3. Bridge não auto-completa a skill.
4. `PermissionEngine` preserva `SCOPED_WRITE` e aplica boundary local do Lot 4-D, sem relaxamento global.
5. Evidência semântica exige `reproduction`, `root_cause` e `recovery_result` estruturados.
6. Recuperação válida exige `blind_retry: false`, `retry_evidence` semântico e referência verificável de teste de regressão.
7. Evidência insuficiente retorna `RECOVERING` sem handoff de sucesso.

## CAF #1 — formatação

O SHA `3ea30e9aadac9600b701902f14d08a3881251692` falhou no Foundation `31476698797` em `Verify formatting`. O SHA diagnóstico `81c1f1c9ad58a895db02b70b0dafec5e7ba9349d` apenas revelou o diff canônico do Prettier. A correção foi aplicada e revalidada; nenhum PASS foi fabricado.

## CAF #2 — evidência de blind retry

Vinicius identificou no SHA `9ebedbaa85bfa92d52f199df064382e075adb1d3` que `blind_retry: false` era apenas declaração booleana. O gate foi bloqueado. A correção tornou `retry_evidence` obrigatório e semântico, com testes negativos para ausência, booleano e placeholder e persistência positiva no receipt.

## CAF #3 — sobreposição de roteamento

Beatriz identificou que os gatilhos genéricos `incidente` e `incident`, avaliados antes dos termos de segurança, poderiam capturar um objetivo explicitamente de security review e retirar o piso Classe C do `MCF-SECURITY-REVIEW`.

Correção aplicada:

- removidos os gatilhos genéricos `incidente` e `incident` da inferência de debug;
- mantidos somente sinais inequívocos como `debug`, `diagnosticar incidente`, `diagnose incident`, `root cause`, `causa raiz`, `reproduzir falha` e `investigar erro`;
- adicionado teste de regressão provando que `revisão de segurança do incidente` continua roteando para `Ricardo`, `MCF-SECURITY-REVIEW`, `READY_AGENT`, risco Classe C;
- a alteração do planner foi aplicada por commit Git granular após o conector bloquear uma substituição completa do arquivo; não houve force-push.

Como código e PRF mudaram novamente, qualquer CI/manifesta anterior é apenas histórico. O manifesto será regenerado e Foundation + Container Smoke serão refeitos no novo HEAD exato.

## Boundary preservado

```yaml
provider: internal_only
permission: SCOPED_WRITE
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

## Estado operacional

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
gate_c_real_provider_write: NOT_AUTHORIZED
human_operator_actions: 0
human_gate_leandro: NOT_REQUIRED
```
