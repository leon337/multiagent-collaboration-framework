# Solicitação Original — Experimento Telefone sem Fio 001

**Experimento:** MACF-EXP.1  
**Issue:** GitHub #11  
**Versão da metodologia:** v1.0  
**Estado:** `IN_PROGRESS`  
**Classificação:** EVIDÊNCIA DE ENTRADA — não deve ser alterada durante o experimento

## 1. Objetivo do experimento

Medir quanto da intenção, das restrições e das regras operacionais é preservado durante uma cadeia de transferências entre agentes quando cada agente recebe somente o artefato do agente anterior.

## 2. Hipótese

Uma transferência estruturada por objetivo, artefato, evidência, riscos e critérios de aceite preservará melhor a intenção original do que uma transferência por resumo livre.

## 3. Solicitação original imutável

> Produzir uma proposta de protocolo para iniciar novos objetivos do framework. A proposta deve preservar simultaneamente: WIP estratégico igual a 1; Linear como controle estratégico e GitHub como controle operacional; artefato e commit verificável em cada transferência; continuidade automática sem pedir confirmação humana, exceto nas exceções críticas previstas na governança; e somente os estados finais `PASS_RELEASED_FOR_WORK`, `BLOCKED`, `CANCELED` ou `SUPERSEDED`. O resultado final deve conter no máximo oito regras normativas e uma justificativa curta.

## 4. Cadeia controlada

1. Leonardo recebe a solicitação original e formula a primeira proposta.
2. Sofia recebe somente a proposta de Leonardo e a reorganiza arquiteturalmente.
3. Carmem recebe somente a saída de Sofia e produz a versão normativa clara.
4. Gabriel recebe somente a saída de Carmem e adiciona os requisitos de versionamento e publicação.
5. Léo recebe somente a saída de Gabriel e produz a versão operacional final.
6. Emily compara todas as etapas com esta solicitação original.
7. Mestre avalia o método e recomenda evolução.

## 5. Regra de isolamento

- Após a primeira transferência, nenhum agente executor poderá consultar esta solicitação original.
- Nenhum agente poderá editar o artefato anterior.
- Cada etapa deverá produzir arquivo e commit próprios.
- Dúvidas serão registradas como hipótese; não poderão ser resolvidas por consulta retroativa.
- Emily e Mestre poderão consultar todos os artefatos somente após a cadeia executora terminar.

## 6. Métricas

- preservação das cinco restrições obrigatórias;
- quantidade de omissões;
- quantidade de contradições;
- quantidade de acréscimos não solicitados;
- clareza e executabilidade do resultado final;
- rastreabilidade de cada transformação;
- diferença entre a solicitação original e a saída final.

## 7. Critério de sucesso

O experimento será considerado bem-sucedido quando:

1. todas as transferências possuírem artefato e commit;
2. nenhuma etapa consultar retroativamente a entrada original;
3. ao menos quatro das cinco restrições obrigatórias forem preservadas sem contradição;
4. Emily conseguir reproduzir a avaliação usando apenas os registros;
5. a retrospectiva produzir decisão de manter, corrigir ou rejeitar o protocolo testado.
