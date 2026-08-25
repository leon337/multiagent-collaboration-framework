# R4 — Avaliação da `MCF-MISSION-CHECKPOINT`

**Data:** `2026-08-25`  
**Modo:** execução por papéis MCF na mesma sessão; não representa runtime multiagente independente.

## MC-01 — Status da missão atual

Aplicando o contrato candidato à missão atual:

```yaml
mission_id: MCF-20260825-CODEX-WORK-RECOVERY
canonical_roadmap: docs/roadmaps/2026-08-25-codex-work-recovery-auditable-roadmap-v2.md
current_stage_at_test: R4
recovery_branch: mission/codex-work-recovery-20260825
recovery_branch_head_live: c8f6efe837be0ff1f5818fc8a4a33cb23ae67e21
main_head_live: 85ccf418740e78b5e1e3eeb7742baf6f869978c1
pr_170_live:
  state: OPEN
  merged: false
  head: 1da1a13bd8ca47bed2f4a4e560e64691788582f8
next_action: concluir R4 e executar R5
```

**Resultado:** `PASS` — etapa, fonte, branch/SHA, estado concorrente e próxima ação são recuperáveis sem pedir a Leandro para recontar a missão.

## MC-02 — Documento superseded presente no histórico

O artefato `INITIAL-ROADMAP-SUPERSEDED.md` permanece disponível para auditoria, mas o contrato o rejeita como fonte de estado corrente. `docs/roadmaps/` mantém somente o roadmap canônico desta missão.

**Resultado:** `PASS`.

## MC-03 — Novo chat

O contrato de retomada exige: localizar a missão → abrir roadmap canônico → rejeitar `SUPERSEDED` → ler etapa/último registro → reler campos mutáveis → continuar da próxima ação.

**Resultado:** `PASS_STRUCTURAL`. A prova de uma sessão realmente nova é reservada ao R5; não é simulada como evidência de runtime.

## MC-04 — Fonte live indisponível

O contrato exige `STALE`/`NAO_VERIFICADO` quando o estado mutável não puder ser relido.

**Resultado:** `PASS`.

## MC-05 — Sem fonte canônica / MC-07 — missões ambíguas

O contrato bloqueia reconstrução inventada e exige apenas desambiguação mínima.

**Resultado:** `PASS`.

## MC-06 — Não reiniciar missão existente

O contrato proíbe `restart_existing_mission_without_invalidation` e obriga retomada pela próxima ação de checkpoint válido.

**Resultado:** `PASS`.

## Beatriz — scorecard

| Critério | Resultado |
|---|---:|
| fonte canônica correta | 20/20 |
| superseded rejeitado | 15/15 |
| etapa/timestamp corretos | 15/15 |
| live relido ou stale | 15/15 |
| branch/SHA/PR | 10/10 |
| link previsto no output | 10/10 |
| próxima ação exata | 10/10 |
| sem reinício/reconstrução | 5/5 |
| **Total** | **100/100** |

**Beatriz:** `PASS_STRUCTURAL_AND_SCENARIO`.

## Emily — auditoria

- `main` foi relido live e permanece `85ccf418...`.
- PR #170 foi relida live e permanece `OPEN / merged=false / head=1da1a13...`.
- branch de recuperação foi relida live em `c8f6efe...` durante o teste.
- documento superseded não é usado como estado corrente.
- prova real de cross-chat e gatilho em outra sessão ainda pertence a R5.
- a skill segue `EXPERIMENTAL` e não é apresentada como `SkillExecutor` runtime-executável.

**Emily:** `SUFICIENTE_PARA_GATE_INTERNO_R4`, com R5 obrigatório.

## Gate operacional de Léo

**Decisão:** `APROVAR_COM_RESSALVA`.

**Ressalva:** R5 deve verificar continuidade cross-chat e tratamento de staleness/ambiguidade. Promoção ao runtime tipado não faz parte desta missão.

**Próxima ação autorizada:** `R5 — validar as duas skills e continuidade cross-chat`.