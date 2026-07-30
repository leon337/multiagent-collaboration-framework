# Etapa 02 — Sofia

**Experimento:** MACF-EXP.1  
**Issue:** GitHub #11  
**Agente:** Sofia  
**Entrada permitida:** `ETAPA_01_LEONARDO.md`  
**Classificação:** ARTEFATO EXPERIMENTAL  
**Estado:** `COMPLETED`

## Arquitetura do protocolo

### Camada A — Controle estratégico

1. **Capacidade estratégica unitária.** O sistema mantém somente um objetivo estratégico ativo; os demais permanecem em backlog.
2. **Fonte estratégica.** Linear concentra objetivo, prioridade, estado agregado e decisões de direção.

### Camada B — Execução e evidência

3. **Fonte operacional.** GitHub concentra tarefas, artefatos, commits, revisões e evidências.
4. **Transferência versionada.** Cada passagem produz um artefato próprio, um commit verificável e um vínculo com o objetivo.
5. **Registro de transição.** Toda mudança informa estado, responsável, evidência, riscos, ressalvas e próximo passo.

### Camada C — Continuidade e autoridade

6. **Continuidade automática.** Léo promove a próxima etapa quando ela estiver definida, autorizada e sem bloqueio, sem nova confirmação humana.
7. **Escalonamento excepcional.** Leandro participa somente diante de mudança estratégica, risco crítico, conflito normativo ou ação irreversível não delegada.

### Camada D — Encerramento

8. **Fechamento controlado.** O objetivo termina apenas como `PASS_RELEASED_FOR_WORK`, `BLOCKED`, `CANCELED` ou `SUPERSEDED`; a liberação exige critérios atendidos, evidências localizáveis e revisões concluídas.

## Justificativa curta

A separação em camadas reduz conflito entre decisão, execução e validação. O protocolo preserva foco, rastreabilidade e avanço automático, mas mantém escalonamento humano para exceções de alto impacto.