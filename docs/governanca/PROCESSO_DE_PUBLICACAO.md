# Processo de Publicação

**Versão:** 0.1-remediação  
**Classificação:** REGRA NORMATIVA  
**Objetivo:** LEA-274  
**Remediação:** GitHub #10

## 1. Finalidade

Definir os gates e registros necessários para transformar uma branch de trabalho em versão liberada.

## 2. Pré-condições

- objetivo e versão identificados;
- branch e PR vinculados;
- artefatos completos;
- critérios de aceite avaliados;
- não conformidades críticas e altas fechadas;
- reteste aceito por Emily;
- parecer metodológico sem bloqueio;
- reconciliação GitHub–Linear concluída;
- autorização vigente.

## 3. Sequência

1. Gabriel verifica integridade da branch e do PR.
2. Léo confirma estados, critérios e evidências.
3. Sofia verifica coerência estrutural quando aplicável.
4. Carmem verifica índice, terminologia e referências.
5. Emily executa o reteste final.
6. Mestre emite parecer metodológico.
7. Gabriel executa validações automáticas e manuais.
8. Léo promove para `PASS_RELEASED_FOR_WORK`.
9. Gabriel marca o PR pronto, integra e registra a release.
10. Linear recebe o checkpoint final e o objetivo é encerrado.

## 4. Bloqueios de publicação

A publicação é impedida por:

- CI documental com falha;
- referência quebrada crítica;
- arquivo obrigatório ausente;
- não conformidade crítica ou alta aberta;
- divergência GitHub–Linear;
- ausência de autorização aplicável;
- risco crítico novo.

## 5. Autorização DF-008

A autorização final de Leandro já está registrada. Não é necessário solicitar nova aprovação quando todos os gates forem satisfeitos. Mudança de escopo, conflito constitucional ou risco crítico novo exige novo escalonamento.

## 6. Evidências da release

- commit final;
- resultado da validação;
- parecer de Emily;
- parecer do Mestre;
- PR e merge;
- tag ou release;
- atualização do Linear;
- lista de limitações conhecidas.

## 7. Falha após publicação

Falha relevante após release gera:

- issue de incidente;
- classificação de gravidade;
- decisão entre hotfix, rollback ou nova versão;
- preservação da release e das evidências anteriores.
