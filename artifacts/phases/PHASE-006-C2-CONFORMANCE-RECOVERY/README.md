# PHASE-006-C2-CONFORMANCE-RECOVERY

Pacote de Rastreabilidade da Fase criado para recuperar a conformidade do MCF-RUNTIME-006-C2 com o Protocolo Operacional Unificado.

## Motivo

A execução anterior do C2 apresentou deriva operacional: checkpoints encerraram respostas, o loop orientado a objetivo foi interrompido e a fase avançou sem PRF completo. Este pacote **não reescreve retrospectivamente** essa execução; registra a falha e a recuperação CAF a partir do ponto em que ela foi capturada.

## Ordem de leitura

1. `PHASE-006-C2-PLAN.md`
2. `PHASE-006-C2-DECISIONS.md`
3. `PHASE-006-C2-REPORT.md`
4. `PHASE-006-C2-VALIDATION.txt`
5. `PHASE-006-C2-VALIDATION-FULL.txt`
6. `PHASE-006-C2-SMOKE.txt`
7. `PHASE-006-C2-CHECKPOINT.yaml`
8. `PHASE-006-C2-ARTIFACT-MANIFEST.sha256`

## Estado ao criar o pacote

```yaml
issue: 81
parent_issue: 79
pull_request: 80
source_head: e9250b7967f6dcba45b270e4887a495f34145755
pr_state: DRAFT
source_head_ci: PASS
production: BLOCKED
real_c2_provider_write: NOT_AUTHORIZED
new_functional_changes_in_recovery: false
recovery_state: AGUARDANDO_CI_DO_PRF
```

## Regra de retorno

A recuperação só retorna ao gate original do C2 após:

- CI verde do HEAD exato que contém este PRF;
- auditoria de conformidade;
- decisão operacional de Léo;
- checkpoint atualizado.

LEANDRO não é executor técnico desta fase e nenhuma ação humana está requerida neste checkpoint.
