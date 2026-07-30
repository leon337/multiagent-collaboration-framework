# Plano de Fundação do Framework v1.0

**Objetivo:** LEA-274  
**Branch de trabalho:** `foundation/framework-v1`  
**Autoridade final:** Leandro  
**Orquestração da fundação:** Mestre

## 1. Estratégia

A fundação será executada em loops sequenciais. Apenas um loop estrutural permanecerá ativo por vez, salvo atividades de consulta que não alterem artefatos.

## 2. Loops planejados

| Loop | Resultado esperado | Estado inicial |
|---|---|---|
| 0.1 | Auditoria e Constituição | IN_PROGRESS |
| 0.2 | Arquitetura documental e inventário | READY |
| 0.3 | Contratos dos agentes | BACKLOG |
| 0.4 | Protocolo de comunicação e orquestração | BACKLOG |
| 0.5 | Governança de execução, revisão e auditoria | BACKLOG |
| 0.6 | Templates, checklists e registros | BACKLOG |
| 0.7 | Integração operacional GitHub–Linear | BACKLOG |
| 0.8 | Treinamento operacional do Léo | BACKLOG |
| 0.9 | Experimento de validação a seco | BACKLOG |
| 0.10 | Auditoria final e PR de liberação | BACKLOG |

## 3. Inventário alvo inicial

### 3.1 Normativos

- `docs/governanca/CONSTITUICAO_DO_FRAMEWORK.md`
- `docs/governanca/PROTOCOLO_MULTIAGENTE.md`
- `docs/governanca/CONTRATO_DE_COMUNICACAO.md`
- `docs/governanca/CRITERIOS_DE_VALIDACAO.md`
- `docs/governanca/FLUXO_OPERACIONAL.md`
- `docs/governanca/LOOP_ORIENTADO_A_OBJETIVO.md`
- `docs/governanca/MATRIZ_DE_AUTORIDADE.md`
- `docs/governanca/PROCESSO_DE_PUBLICACAO.md`
- `docs/governanca/GOVERNANCA_GITHUB_LINEAR.md`
- `docs/governanca/GLOSSARIO.md`

### 3.2 Agentes

- `docs/agentes/LEO.md`
- `docs/agentes/LEONARDO.md`
- `docs/agentes/SOFIA.md`
- `docs/agentes/EMILY.md`
- `docs/agentes/CARMEM.md`
- `docs/agentes/GABRIEL.md`
- `docs/agentes/MESTRE.md`
- `docs/agentes/MATRIZ_RACI.md`

### 3.3 Operacionais e templates

- `templates/SOLICITACAO.md`
- `templates/PLANO_DE_EXECUCAO.md`
- `templates/ENTREGA_DE_ARTEFATO.md`
- `templates/REVISAO_CRITICA.md`
- `templates/RELATORIO_DE_AUDITORIA.md`
- `templates/LOG_DO_EXPERIMENTO.md`
- `templates/REGISTRO_DE_DECISAO.md`
- `templates/RETROSPECTIVA.md`
- `templates/CHECKLIST_DE_PUBLICACAO.md`
- `templates/CHECKLIST_DE_RECONCILIACAO.md`

### 3.4 Treinamento e experimentos

- `docs/treinamento/MANUAL_DO_LEO.md`
- `docs/treinamento/CENARIOS_DE_ORQUESTRACAO.md`
- `docs/treinamento/ANTI_PADROES.md`
- `docs/experimentos/EXPERIMENTO_0001_VALIDACAO_A_SECO.md`
- `docs/experimentos/LOG_EXPERIMENTO_0001.md`

## 4. Critério de qualidade por documento

Todo documento deve:

1. declarar finalidade e status;
2. identificar se é normativo, operacional, template ou histórico;
3. possuir escopo e limites;
4. definir entradas, saídas e responsáveis quando aplicável;
5. usar termos do glossário;
6. evitar conflitos com a Constituição;
7. possuir referências cruzadas;
8. estar vinculado a uma issue Linear e a um commit GitHub;
9. distinguir regra nova de evidência histórica;
10. ser compreensível por um agente sem depender deste chat.

## 5. Estratégia de revisão

Durante a fundação, Mestre simulará separadamente os papéis de autor, revisor arquitetural, auditor e editor. Cada revisão registrará:

- papel exercido;
- critérios usados;
- achados;
- correções exigidas;
- conclusão.

Essa simulação é transitória. Na operação normal, os agentes permanentes deverão executar seus próprios papéis.

## 6. Política de commits

Formato recomendado:

```text
<tipo>(<área>): <resultado> [LEA-XXX]
```

Exemplos:

```text
docs(governance): definir estados operacionais [LEA-275]
docs(agents): formalizar contrato do Léo [LEA-277]
fix(audit): remover ambiguidade de aprovação [LEA-280]
```

## 7. Política de pull request

A fundação será entregue por pull request em modo draft durante a execução. O PR somente ficará pronto para revisão quando:

- todos os loops obrigatórios estiverem concluídos;
- não houver divergências conhecidas sem registro;
- a auditoria final estiver anexada;
- os critérios de aceite de LEA-274 estiverem atualizados;
- Leandro tiver um resumo objetivo das decisões que exigem aprovação.

## 8. Métricas de prontidão

- cobertura de documentos obrigatórios: 100%;
- contratos de agentes completos: 7 de 7;
- links internos válidos: 100%;
- critérios de aceite rastreados: 100%;
- não conformidades críticas abertas: 0;
- divergências GitHub–Linear abertas: 0;
- aprovação humana final: obrigatória.
