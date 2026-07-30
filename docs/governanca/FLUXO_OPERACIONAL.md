# Fluxo Operacional do Framework Multiagente

**Versão:** 0.1-remediação  
**Classificação:** REGRA NORMATIVA  
**Objetivo:** LEA-274  
**Remediação:** GitHub #10  
**PR:** #1

## 1. Finalidade

Definir os estados, as transições permitidas, as condições mínimas de avanço e as responsabilidades de controle do trabalho multiagente.

## 2. Estados oficiais

- `BACKLOG`: trabalho identificado, ainda sem prontidão.
- `READY`: objetivo, escopo, responsável, critérios e dependências definidos.
- `IN_PROGRESS`: execução autorizada e em curso.
- `IN_REVIEW`: artefato entregue e submetido à revisão exigida.
- `REMEDIATION`: revisão encontrou não conformidade corrigível.
- `BLOCKED`: impedimento externo ou interno impede avanço.
- `PASS_RELEASED_FOR_WORK`: critérios, evidências, revisões e autorização satisfeitos.
- `CANCELED`: trabalho encerrado por decisão autorizada.
- `SUPERSEDED`: trabalho substituído por outro objetivo identificado.

`QUASE_PRONTO`, `PRATICAMENTE_FEITO` e equivalentes são estados inválidos.

## 3. Matriz de transições

| Origem | Destino | Condição mínima | Autoridade de promoção |
|---|---|---|---|
| `BACKLOG` | `READY` | objetivo, escopo, critérios, responsável e evidência esperada definidos | Léo |
| `READY` | `IN_PROGRESS` | dependências resolvidas, WIP disponível e início registrado | Léo |
| `IN_PROGRESS` | `IN_REVIEW` | artefato versionado, commit e evidências vinculados | Léo |
| `IN_PROGRESS` | `BLOCKED` | causa, impacto, responsável e condição de desbloqueio registrados | Léo |
| `IN_REVIEW` | `REMEDIATION` | não conformidade corrigível registrada por revisor competente | Emily ou revisor designado |
| `IN_REVIEW` | `PASS_RELEASED_FOR_WORK` | critérios atendidos, evidências suficientes, revisões concluídas e autorização vigente | Léo executa; Gabriel publica |
| `REMEDIATION` | `IN_REVIEW` | correção versionada e reteste solicitado | Léo |
| `BLOCKED` | estado anterior ou `READY` | causa removida e reconciliação registrada | Léo |
| qualquer não terminal | `CANCELED` | justificativa e autorização de Leandro ou regra previamente delegada | Leandro |
| qualquer não terminal | `SUPERSEDED` | objetivo substituto identificado e vinculado | Leandro ou Léo sob decisão registrada |

## 4. Gates obrigatórios

Nenhum trabalho avança para `IN_REVIEW` sem:

1. artefato identificável;
2. commit ou versão;
3. vínculo com objetivo e issue;
4. critérios de aceite avaliáveis;
5. registro de riscos e ressalvas.

Nenhum trabalho alcança `PASS_RELEASED_FOR_WORK` sem:

1. não conformidades críticas e altas fechadas;
2. reteste concluído quando exigido;
3. divergências GitHub–Linear reconciliadas;
4. evidências localizáveis;
5. autorização vigente registrada.

## 5. WIP

Durante a fundação, apenas um loop estrutural pode permanecer em `IN_PROGRESS`. Trabalhos paralelos somente são permitidos quando pertencem ao mesmo loop e não alteram o mesmo artefato sem coordenação explícita.

## 6. Bloqueios

Todo bloqueio deve registrar:

- causa;
- impacto;
- responsável pela remoção;
- condição objetiva de desbloqueio;
- fonte de verdade;
- data do próximo checkpoint.

Bloqueio não encerra o trabalho.

## 7. Transferência de bastão

Toda transferência exige:

- objetivo;
- estado de origem;
- agente emissor;
- agente receptor;
- artefato;
- commit;
- parecer;
- riscos e ressalvas;
- estado solicitado;
- motivo da transferência.

## 8. Regra de continuidade

Quando uma etapa concluir e a próxima estiver definida, autorizada e sem bloqueio, Léo deve promover imediatamente o próximo estado. A produção de um relatório não é motivo para interromper o loop.

## 9. Regra da autorização antecipada

A decisão `DF-008` autoriza antecipadamente a liberação após todos os gates objetivos. A equipe não deve solicitar nova autorização humana ao final, salvo se surgir mudança de escopo, risco crítico novo ou conflito com a Constituição.
