# PHASE-006-GATE-D-INTEGRATION

Pacote documental da integração do Gate D do `MCF-RUNTIME-006`.

## Escopo

Este PRF registra somente o gate de integração do candidato já fechado. Ele não reabre o Gate D técnico, não ativa produção e não ativa o staging adapter no live registry.

## Arquivos

- `PHASE-006-GATE-D-INTEGRATION-PLAN.md` — contrato e critérios;
- `PHASE-006-GATE-D-INTEGRATION-REPORT.md` — execução real;
- `PHASE-006-GATE-D-INTEGRATION-VALIDATION.txt` — validações pós-merge;
- `PHASE-006-GATE-D-INTEGRATION-SMOKE.txt` — smoke/health/version/readiness;
- `PHASE-006-GATE-D-INTEGRATION-CHECKPOINT.yaml` — checkpoint de fechamento;
- `PHASE-006-GATE-D-INTEGRATION-DECISIONS.md` — decisões da integração;
- `PHASE-006-GATE-D-INTEGRATION-ARTIFACT-MANIFEST.sha256` — manifesto de integridade.

## Limites

```yaml
production: BLOCKED
live_staging_adapter: DISABLED
human_operator_actions_target: 0
```
