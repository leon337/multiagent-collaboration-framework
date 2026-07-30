# Etapa 01 — Leonardo

**Experimento:** MACF-EXP.1  
**Issue:** GitHub #11  
**Agente:** Leonardo  
**Entrada permitida:** `SOLICITACAO.md`  
**Classificação:** ARTEFATO EXPERIMENTAL  
**Estado:** `COMPLETED`

## Proposta inicial de protocolo

1. **Manter WIP estratégico igual a 1.** Apenas um objetivo estratégico pode permanecer ativo; novos objetivos ficam em backlog até liberação da capacidade.
2. **Separar controle estratégico de controle operacional.** Linear registra objetivo, prioridade, estado e decisões; GitHub registra tarefas, artefatos, commits, revisões e evidências.
3. **Versionar toda transferência.** Cada passagem entre agentes deve gerar artefato próprio, commit verificável e vínculo com o objetivo em execução.
4. **Executar continuidade automática.** Quando a próxima etapa estiver definida, autorizada e sem bloqueio, Léo deve promovê-la sem pedir nova confirmação humana.
5. **Restringir intervenção humana às exceções críticas.** Leandro será consultado somente diante de mudança estratégica, risco crítico, conflito normativo ou ação irreversível não delegada.
6. **Registrar cada transição.** Toda promoção deve identificar estado, responsável, evidência, riscos, ressalvas e próxima etapa.
7. **Usar somente estados finais autorizados.** Um objetivo termina exclusivamente como `PASS_RELEASED_FOR_WORK`, `BLOCKED`, `CANCELED` ou `SUPERSEDED`.
8. **Liberar somente após os gates objetivos.** A promoção para `PASS_RELEASED_FOR_WORK` exige critérios de aceite atendidos, evidências localizáveis e revisões obrigatórias concluídas.

## Justificativa curta

O protocolo combina foco estratégico, separação de responsabilidades, rastreabilidade documental e continuidade operacional. As regras impedem trabalho paralelo descontrolado, preservam evidências em cada transferência e evitam interrupções humanas desnecessárias sem remover os controles críticos.