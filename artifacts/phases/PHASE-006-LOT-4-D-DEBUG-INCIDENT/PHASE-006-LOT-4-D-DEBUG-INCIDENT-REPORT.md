# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Report

## Estado

`CANDIDATE_PRF_AWAITING_EXACT_HEAD_REVALIDATION`

O incremento técnico foi implementado no PR `#104`. Este relatório registra somente evidência já observada. Reviews, auditoria, gate e merge ainda não são declarados como concluídos neste candidato PRF.

## Baseline e candidatos superseded

- baseline `main`: `79c1a1644742cf22af60384b64685adbb1f017a3`
- candidato pré-PRF: `933c8f72dd19219eea6112adfdd8db7c43112f2c`
  - Foundation `31477171098`: `PASS`
  - Container Smoke `31477171096`: `PASS`
- primeiro candidato PRF: `9ebedbaa85bfa92d52f199df064382e075adb1d3`
  - Foundation `31477910252`: `PASS`
  - Container Smoke `31477910266`: `PASS`
  - estado posterior: `SUPERSEDED_BY_REVIEW_CAF`
- Vitest artifact do primeiro candidato PRF: `9096020199`
- Vitest artifact digest: `sha256:e1af159fcb0c59acd403baa3dff401144dd7475b5b2225295c3e4823d6cec310`

## Implementação observada

1. `McfExecutableSkillId` passou a incluir `MCF-DEBUG-INCIDENT`.
2. O planner possui configuração explícita `Patricia → Renato`, provider `internal`, operação `inspect-debug-incident`, recurso `mcf-agent-runtime` e estado `READY_AGENT`.
3. A skill foi incluída no executor governado, sem permitir auto-completion pelo `ChatRuntimeBridge`.
4. O `PermissionEngine` preserva `SCOPED_WRITE` e adiciona boundary local ao Lot 4-D, sem relaxamento global.
5. A validação interna exige evidência semântica estruturada para reprodução, causa raiz e recuperação.
6. Recuperação válida exige declaração `blind_retry: false`, evidência semântica separada em `retry_evidence` e referência concreta de teste de regressão.
7. Evidência inválida retorna `RECOVERING` e não cria handoff de sucesso.

## Testes observados antes do CAF #2

No candidato `9ebedbaa85bfa92d52f199df064382e075adb1d3`, o Foundation registrou format, lint, typecheck, dupla migração, testes e build como `PASS`; o Container Smoke também concluiu `PASS`.

Esses resultados foram invalidados para gate quando o review especialista encontrou um defeito semântico e o código mudou. Eles permanecem somente como histórico do trace.

## CAF #1 — formatação

O primeiro candidato funcional `3ea30e9aadac9600b701902f14d08a3881251692` falhou no Foundation run `31476698797` na etapa `Verify formatting`. Nenhum PASS funcional foi fabricado.

Foi criado o SHA diagnóstico `81c1f1c9ad58a895db02b70b0dafec5e7ba9349d` exclusivamente para obter o diff canônico do Prettier. Ele não é candidato de gate. Após aplicação objetiva da formatação e remoção do hook diagnóstico, surgiu o candidato pré-PRF `933c8f72dd19219eea6112adfdd8db7c43112f2c`, que passou Foundation e Container Smoke.

## CAF #2 — evidência de blind retry

Durante o review de Vinicius no SHA `9ebedbaa85bfa92d52f199df064382e075adb1d3`, foi identificado que `blind_retry: false` ainda era somente uma afirmação booleana. Isso conflitava com a exigência do Lot 4-D de não aceitar evidência meramente booleana e de demonstrar que não ocorreu blind retry.

Correção aplicada:

- `recovery_result` continua exigindo `blind_retry: false`;
- passou a exigir também `retry_evidence` semanticamente significativo;
- ausência, booleano ou placeholder em `retry_evidence` são rejeitados;
- os testes positivos persistem a evidência de tentativas no receipt;
- os testes negativos provam que o booleano isolado não autoriza sucesso.

Como houve alteração após CI/review, todas as evidências de gate do SHA `9ebedbaa...` foram invalidadas e serão refeitas no novo HEAD após a reconciliação do PRF e do manifesto.

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

## Próximo passo obrigatório

Regerar o manifesto SHA-256 do PRF e reexecutar Foundation + Container Smoke no HEAD exato resultante. Nenhum review ou gate anterior ao novo HEAD poderá ser usado como evidência final.
