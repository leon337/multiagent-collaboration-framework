# PHASE-006-LOT-4-D-DEBUG-INCIDENT — Report

## Estado

`CANDIDATE_PRF_AWAITING_EXACT_HEAD_REVALIDATION`

O incremento técnico foi implementado no PR `#104`. Este relatório registra somente evidência já observada. Reviews, auditoria, gate e merge ainda não são declarados como concluídos neste candidato PRF.

## Baseline e candidato pré-PRF

- baseline `main`: `79c1a1644742cf22af60384b64685adbb1f017a3`
- candidato pré-PRF: `933c8f72dd19219eea6112adfdd8db7c43112f2c`
- Foundation: run `31477171098` — `PASS`
- Container Smoke: run `31477171096` — `PASS`
- Vitest artifact: `9095733417`
- Vitest artifact digest: `sha256:9ae9c59a9e8824749a465d22fae1d0eebb0b2956e2235853b9aa26c99b71c69c`

## Implementação observada

1. `McfExecutableSkillId` passou a incluir `MCF-DEBUG-INCIDENT`.
2. O planner possui configuração explícita `Patricia → Renato`, provider `internal`, operação `inspect-debug-incident`, recurso `mcf-agent-runtime` e estado `READY_AGENT`.
3. A skill foi incluída no executor governado, sem permitir auto-completion pelo `ChatRuntimeBridge`.
4. O `PermissionEngine` preserva `SCOPED_WRITE` e adiciona boundary local ao Lot 4-D, sem relaxamento global.
5. A validação interna exige evidência semântica estruturada para reprodução, causa raiz e recuperação.
6. Recuperação válida exige `blind_retry: false` e referência concreta de teste de regressão.
7. Evidência inválida retorna `RECOVERING` e não cria handoff de sucesso.

## Testes do candidato pré-PRF

O Foundation registrou:

- ops: `20 passed`, `0 failed`;
- web: `5 passed`, `0 failed`;
- server: `122 test files passed`, `524 tests passed`, `0 failed`;
- `skill-executor-lot4-debug-incident.test.ts`: `33 tests passed`;
- `mission-runtime-lot4-debug-incident.integration.test.ts`: `2 tests passed`;
- `chat-runtime-bridge-lot4-debug-incident.integration.test.ts`: `1 test passed`;
- `chat-mission-planner-lot4-debug-incident.test.ts`: `3 tests passed`;
- format, lint, typecheck, dupla migração e build: `PASS`.

O Container Smoke do mesmo SHA concluiu `PASS`.

## CAF observado

O primeiro candidato funcional `3ea30e9aadac9600b701902f14d08a3881251692` falhou no Foundation run `31476698797` na etapa `Verify formatting`. Nenhum PASS funcional foi fabricado.

Foi criado o SHA diagnóstico `81c1f1c9ad58a895db02b70b0dafec5e7ba9349d` exclusivamente para obter o diff canônico do Prettier. Ele não é candidato de gate. Após aplicação objetiva da formatação e remoção do hook diagnóstico, surgiu o candidato pré-PRF `933c8f72dd19219eea6112adfdd8db7c43112f2c`, que passou Foundation e Container Smoke.

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

Gerar o manifesto SHA-256 do PRF e reexecutar Foundation + Container Smoke no HEAD exato resultante. Nenhum review ou gate anterior ao novo HEAD poderá ser usado como evidência final.
