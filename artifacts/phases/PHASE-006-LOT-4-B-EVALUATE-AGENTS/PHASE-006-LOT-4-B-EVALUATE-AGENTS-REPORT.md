# PHASE-006-LOT-4-B-EVALUATE-AGENTS — Relatório

## Estado
`CANDIDATE_READY_FOR_EXACT_HEAD_VALIDATION`

Este relatório descreve um candidato pré-gate. Não significa aprovação, merge ou conclusão da fase.

## Rastreamento
- Issue: `#97`
- PR draft: `#98`
- Branch: `feat/mcf-runtime-006-lot4-b-evaluate-agents`
- Base: `5a03c443ff3e4d80755b8bd0b8c6bd3cf350f6a3`
- HEAD de implementação imediatamente anterior ao PRF: `791ed0f8114dd9d6e071fc668d4c9be2536dffa4`

## Implementação
O candidato:
- adiciona `MCF-EVALUATE-AGENTS` ao contrato tipado executável;
- infere avaliação/benchmark/scorecard no planner;
- usa `READY_AGENT`, owner primário Beatriz e handoff Emily;
- executa com provider `internal` e operação `inspect-agent-evaluation`, compatível com `READ_ONLY`;
- exige `test_cases`, `scores` e `regressions`;
- rejeita evidência ausente, vazia ou placeholder;
- aceita Beatriz e Tiago como owners;
- preserva `PermissionEngine` e HDF;
- prova persistência/versionamento pelo `MissionRuntime`.

## Findings e correções
1. Dois workflows temporários de implementação tiveram YAML inválido e zero jobs; nenhum runtime foi parcialmente aplicado por eles.
2. O candidato inicial `77a41f2bcfd162b41b0745187207d1431e5a2ed5` passou Smoke `31463062318`, mas Foundation `31463062323` falhou nos testes.
3. A falha principal mostrou que `evaluate-agents` não pertence à taxonomia `READ_ONLY`. A política não foi afrouxada; a operação passou para `inspect-agent-evaluation`.
4. Uma asserção textual legada do Lot 4-A foi ajustada ao erro generalizado, sem alterar comportamento.
5. Um commit gerado pelo próprio `GITHUB_TOKEN` (`0a4a5cfd60856de3b1e829650bdf33bd594e42a3`) produziu workflows `action_required`/zero jobs; um commit normal do conector gerou `791ed0f8114dd9d6e071fc668d4c9be2536dffa4` para validação real.

## Validação intermediária
- Foundation `31463343756`: PASS.
- Container Smoke `31463343759`: PASS.
- Server: 115 arquivos / 470 testes PASS.
- Ops: 20 PASS.
- Web: 5 PASS.
- Vitest artifact: `9090619768`.
- Digest: `sha256:ce2e9e0eb697a4891d60da8ad9e08a82513f4e9bf65c00fb8aa73f32761ad41e`.

Esses resultados são históricos/intermediários. O commit PRF terá novo SHA e deve ser revalidado integralmente.

## Governança
- revisão Beatriz: PENDING;
- revisão Sofia: PENDING;
- revisão Renato: PENDING;
- revisão Júlia: PENDING;
- auditoria independente Emily: PENDING;
- gate técnico Léo: PENDING;
- merge autorizado: false;
- HUMAN_GATE LEANDRO: NOT_REQUIRED;
- human_operator_actions: 0.

## Segurança
- `READ_ONLY`: PRESERVED;
- produção: BLOCKED;
- live staging adapter: DISABLED;
- C1/C2 real write: NOT_EXPANDED;
- HDF bypass: false.

## Próxima ação
Rodar Foundation e Container Smoke no SHA exato do PRF. Somente depois executar revisão, auditoria e gate.
