# MCF v1.2.0 — Human Control + Visible Copresence

**Data do marco:** 2026-08-27
**Tipo:** minor, retrocompatível
**Autoridade humana:** Leandro

## O que entra

### `HUMANO NO CONTROLE`

Gate suspensivo imediato da autoridade humana final. Como comando independente, normalizado por caixa/espaços, ele interrompe novas ações, preserva estado, cria checkpoint e exige retomada humana explícita.

### Execução visível e GUI autorizada

O MCF passa a tratar uma GUI autorizada como superfície operacional governada. Quando Leandro pedir auditabilidade visual e o ambiente permitir, Mestre/equipe podem operar GUI por ferramentas aprovadas mantendo terminal/log/receipt observável.

A release exige verdade sobre o mecanismo: automação de janela não pode ser descrita como digitação manual ou percepção visual humana.

### Privacidade preservada

Auditabilidade não autoriza expor senhas, API keys, tokens ou cookies. Estado e efeito devem ser comprovados sem revelar o segredo.

## Evidência de campo

- gate `humano no controle`: PASS e confirmação humana deliberada;
- digitação GUI sem envio: PASS;
- envio GUI + round-trip `hello word`: PASS;
- copresença ChatGPT app + terminal de auditoria: PASS.

Artefato: `artifacts/field-validation/MCF-V1.2.0-HUMAN-CONTROL-VISIBLE-GUI-20260827.md`.

## Limite explícito

O `MissionRuntime` de referência ainda não possui API genérica persistente de pause/resume acionada por mensagem humana. A v1.2.0 oficializa o comportamento de governança/orquestração e não inventa enforcement universal onde ele não existe.

## SemVer

`v1.2.0` foi escolhido porque a combinação de Human Control + Visible GUI Copresence é uma capacidade nova retrocompatível, não apenas correção editorial.

## Publicação

Merge/tag/release somente sobre candidata qualificada, sem achados críticos/altos bloqueantes, conforme autorização explícita de Leandro nesta missão.
