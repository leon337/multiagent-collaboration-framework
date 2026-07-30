# Registro de Decisões

Este documento registra somente decisões sustentadas por evidência recuperada ou por commits do repositório.

## LEO-004 — Aprovação da proposta de Gabriel

**Estado:** recuperada por evidência histórica.

A proposta de Gabriel para organização e registro do projeto foi aprovada para a próxima versão da metodologia.

## LEO-005 — Separação entre metodologia e infraestrutura

**Estado:** recuperada por evidência histórica.

Foram aprovadas as seguintes diretrizes:

- separar metodologia de infraestrutura;
- tratar o GitHub como implementação, não como dependência obrigatória;
- manter a arquitetura independente da ferramenta.

## LEO-006 — Autoavaliação da metodologia

**Estado:** recuperada por evidência histórica.

A recomendação de criar um mecanismo de avaliação e correção da própria metodologia saiu do backlog e entrou no plano de evolução, com base em evidência prática.

## LEO-007 — Foco no primeiro experimento

**Estado:** recuperada por evidência histórica.

A fase de expansão foi encerrada. Novas ideias devem permanecer no backlog até a conclusão do primeiro experimento controlado de telefone sem fio.

Prioridades recuperadas:

1. publicar o repositório;
2. criar `SOLICITACAO.md`;
3. criar `LOG_DO_EXPERIMENTO.md`;
4. executar o primeiro teste;
5. medir resultados;
6. realizar retrospectiva e decidir a evolução da metodologia.

## LEO-008 — Retomada da orquestração e fonte de verdade

**Data:** 2026-07-30  
**Responsável:** Léo  
**Estado:** vigente

O repositório `leon337/multiagent-collaboration-framework` passa a ser a fonte oficial de verdade. Nenhuma decisão ou artefato será declarado restaurado, aprovado ou publicado sem evidência objetiva.

## DF-008 — Autorização antecipada para liberação da fundação v1.0

**Data:** 2026-07-30  
**Autoridade:** Leandro  
**Origem:** LEA-274 e declaração direta registrada durante a execução  
**Estado:** vigente

Leandro autorizou antecipadamente a liberação da fundação v1.0. A equipe não deverá interromper novamente o fluxo para solicitar uma segunda autorização humana ao final.

A autorização deverá ser executada automaticamente por Léo e Gabriel quando todas as condições objetivas abaixo estiverem satisfeitas:

1. remediações obrigatórias concluídas e versionadas;
2. nenhuma não conformidade crítica ou alta aberta;
3. reteste de Emily com evidências suficientes;
4. parecer metodológico final sem bloqueio;
5. critérios de aceite de LEA-274 reconciliados com o GitHub;
6. PR #1 tecnicamente pronto para revisão e integração.

Nesse ponto, Léo pode promover o objetivo para `PASS_RELEASED_FOR_WORK` e Gabriel pode concluir o processo de integração do PR #1 sem solicitar nova autorização a Leandro.

A autorização não elimina critérios de qualidade, revisão, evidência ou rastreabilidade. Caso qualquer condição falhe, o estado permanece `REMEDIATION` ou `BLOCKED`; não é necessária nova autorização para corrigir e retestar.