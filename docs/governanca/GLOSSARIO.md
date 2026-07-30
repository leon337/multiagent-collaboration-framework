# Glossário do Framework Multiagente

**Versão:** 0.1-remediação  
**Classificação:** REGRA NORMATIVA DE TERMINOLOGIA  
**Objetivo:** LEA-274

## Termos oficiais

**Agente:** papel especializado com missão, entradas, saídas, autoridade, limites e evidências definidas.

**Artefato:** entrega verificável e localizável, como documento, código, relatório, commit ou registro.

**Auditoria:** verificação formal de critérios, evidências, conformidade e limitações.

**Bloqueio:** impedimento que interrompe avanço e possui causa, impacto e condição de desbloqueio.

**Checkpoint:** registro informativo de progresso. Não é, por si só, ponto de parada.

**Critério de aceite:** condição objetiva utilizada para verificar se uma entrega pode avançar.

**Decisão aprovada:** escolha autorizada e registrada, com efeito operacional ou normativo.

**Evidência verificada:** informação sustentada por fonte identificável e conferida.

**Gate:** condição obrigatória para promoção de estado ou liberação.

**Hipótese em validação:** explicação ou proposta ainda não aceita como regra ou fato.

**Loop:** ciclo de trabalho orientado a objetivo, do planejamento ao fechamento.

**Não conformidade:** diferença entre o estado observado e uma regra ou critério aplicável.

**Objetivo:** resultado explícito que organiza tarefas, critérios, responsáveis e evidências.

**Parecer:** conclusão de um agente dentro de sua competência, acompanhada de critérios e evidências.

**Passagem de bastão:** transferência formal de trabalho entre agentes com artefato, estado, evidência e receptor.

**Reconciliação:** correção de divergências entre fontes de verdade ou registros.

**Regra normativa:** obrigação vigente derivada da Constituição ou decisão aprovada.

**Remediação:** correção controlada de não conformidade, seguida de reteste.

**Release:** versão publicada após gates, revisão, reconciliação e autorização.

**Risco crítico novo:** condição não coberta pela autorização existente, com potencial de invalidar a liberação.

**Fonte de verdade:** sistema oficialmente responsável por uma classe de informação.

**WIP:** limite de trabalho estrutural simultaneamente em execução.

## Estados oficiais

`BACKLOG`, `READY`, `IN_PROGRESS`, `IN_REVIEW`, `REMEDIATION`, `BLOCKED`, `PASS_RELEASED_FOR_WORK`, `CANCELED`, `SUPERSEDED`.

## Termos proibidos como estado

`QUASE_PRONTO`, `PRATICAMENTE_FEITO`, `AGUARDANDO SÓ UM DETALHE` e equivalentes.
