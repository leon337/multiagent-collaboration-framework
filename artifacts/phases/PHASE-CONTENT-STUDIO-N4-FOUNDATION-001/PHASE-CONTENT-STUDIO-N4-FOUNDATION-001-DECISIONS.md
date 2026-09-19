# PHASE-CONTENT-STUDIO-N4-FOUNDATION-001 — Decisões

## N4-D001 — núcleo experimental isolado

O MVP permanece em `experimentos/mcf-content-studio-n4/`. Promoção para `apps/` é gate posterior.

## N4-D002 — separação de responsabilidades

`CONTENT != COMPONENT != TEMPLATE != PREVIEW != MASTER`.

Instavar permanece orientado a storyboard/VideoSpec; Remotion a composição/motion; Explain a experiência educacional interativa quando usado.

## N4-D003 — Player para experimentação

O Video Lab usa `@remotion/player` para modificar props e avaliar componentes sem gerar MP4 a cada iteração.

## N4-D004 — registry governado

Somente componentes `APPROVED` podem ser auto-selecionados. Estados anteriores não equivalem a confiança.

## N4-D005 — importação externa não é instalação automática

O componente externo RenderComp foi fixado por revisão, licença, dependências, segurança, adaptação e preview antes de `APPROVED`.

## N4-D006 — paralelismo com isolamento

Tracks independentes usam fan-out em branches e fan-in por PRs internos para reduzir colisão.

## N4-D007 — review HTML como superfície principal

Para validação iterativa, HTML autocontido com player e contexto passa a ser a principal superfície de review quando tecnicamente prático.

## N4-D008 — container para iteração, CI para evidência

Iterações rápidas podem ocorrer localmente/container. GitHub CI permanece a prova reproduzível ligada ao commit da missão.

## N4-D009 — preview não é master

Stills, Video Lab, MP4 piloto e Review Lab podem passar sem autorizar publicação.

## N4-D010 — benchmark #251 preservado corretamente

O benchmark #251 não deve ser convertido em comparação numérica com stills. A comparação é processual até haver workload equivalente.

## N4-D011 — áudio atual é review asset

A narração atual valida sincronização e UX, mas não é promovida automaticamente a asset de produção durável.

## N4-D012 — escala bloqueada até G8

As nove aulas restantes não entram em migração em massa até auditoria, gate interno e decisão humana de escala.
