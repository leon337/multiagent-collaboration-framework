# T20 — Registro de Auditoria Visual Operacional — 2026-08-30

```yaml
t20_visual_audit_run:
  date: 2026-08-30
  goal_reference: "Reexecutar auditoria visual de três superfícies de navegador com menor tempo"
  requested_unit: "janelas/superfícies operacionais de navegador"
  detected_physical_monitors: 2
  detected_operational_surfaces: 3
  baseline_ms: 536885
  elapsed_ms: 52499
  improvement_percent: 90.22
  score:
    operational_unit: 2
    geometry: 2
    annotation_fidelity: 2
    traceability: 2
    temporal_efficiency: 2
    total: 10
  artifacts:
    raw: "/home/leo/Documentos/GitHub/caixadepandora/t20_reexec_20260830_155101_raw.png"
    annotated: "/home/leo/Documentos/GitHub/caixadepandora/t20_reexec_20260830_155101_anotado.png"
    verification: "/home/leo/Documentos/GitHub/caixadepandora/t20_reexec_20260830_155101_verificacao.png"
  human_feedback: "PENDING"
  verdict: PASS
```

## Evidência e interpretação

O baseline foi calculado pelos timestamps dos artefatos da primeira execução: `telas_3_monitores_20260830_151315_raw.png` até `telas_3_monitores_20260830_151315_aberto_no_desktop.png`, resultando em 536.885 ms.

A reexecução foi medida do timestamp do novo raw até o timestamp da captura de verificação final, resultando em 52.499 ms. O novo tempo representa 9,78% do baseline e redução de 90,22%.

As três superfícies foram tratadas como janelas operacionais, não como monitores físicos. Cada caixa descreve apenas conteúdo visível na captura.

## Falha operacional preservada

Antes da criação do raw, uma tentativa com `sentinel_exec` falhou por ausência do contexto X11 privilegiado. A recuperação usou a rota já validada com `sentinel_script_run` e `sudo`. Como a falha ocorreu antes do raw, ela não entra na métrica normativa `raw → verificação`, mas permanece registrada como custo operacional da missão e oportunidade de melhoria futura.
