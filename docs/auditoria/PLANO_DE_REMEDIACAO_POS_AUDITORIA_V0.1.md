# Plano de Remediação Pós-Auditoria v0.1

**Origem:** auditoria mestre #2  
**Linear:** LEA-274 / LEA-275  
**PR:** #1  
**Estado:** `READY`

## 1. Objetivo

Transformar os achados consolidados da auditoria v0.1 em trabalho verificável antes de qualquer tentativa de liberação do framework.

## 2. Frentes obrigatórias

### RMD-01 — Estados, transições e autoridade

Entregas:

- `docs/governanca/FLUXO_OPERACIONAL.md`;
- `docs/governanca/LOOP_ORIENTADO_A_OBJETIVO.md`;
- `docs/governanca/MATRIZ_DE_AUTORIDADE.md`.

Critério: cada estado, transição, responsável, revisor e aprovador deve ser explícito.

### RMD-02 — Contratos dos agentes

Entregas:

- sete contratos em `docs/agentes/`;
- `docs/agentes/MATRIZ_RACI.md`.

Critério: missão, entradas, saídas, limites, autoridade, critérios e passagem de bastão definidos.

### RMD-03 — Governança GitHub–Linear

Entrega:

- `docs/governanca/GOVERNANCA_GITHUB_LINEAR.md`.

Critério: fontes de verdade, reconciliação, operação em modo limitado e tratamento de divergências definidos.

### RMD-04 — Arquitetura e padrão documental

Entregas:

- índice central de documentação;
- `docs/governanca/GLOSSARIO.md`;
- política de versionamento e status documental;
- referências cruzadas válidas.

### RMD-05 — Controles de publicação

Entregas:

- `docs/governanca/PROCESSO_DE_PUBLICACAO.md`;
- templates e checklists;
- validação automatizada de arquivos e links internos.

## 3. Ordem de execução

1. RMD-01;
2. RMD-02;
3. RMD-03;
4. RMD-04;
5. RMD-05;
6. reteste de Emily;
7. parecer do Mestre;
8. decisão de Leandro.

## 4. Regra de encerramento

Este plano somente poderá ser encerrado quando todas as frentes possuírem artefatos, commits, revisão, evidências e reconciliação com LEA-274. O PR #1 permanece draft durante a remediação.