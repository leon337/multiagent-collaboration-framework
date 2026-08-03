# MCF-DEC-016-A1 — Retorno obrigatório à missão-pai

## Estado

`CORRECAO_APROVADA_PARA_RC`

## Incidente

Após a autorização de merge do ciclo do Screen Assistant, o subfluxo `MERGE-CURRENT-CYCLE` foi concluído corretamente, porém o Mestre marcou o checkpoint geral como `ENCERRADO` e informou `proxima_acao: nenhuma`.

Isso contradizia o estado já publicado da missão-pai `SCREEN-PHASE-22A-FIRST-SCREEN`, que permanecia em execução e tinha como próxima ação implementar o wireframe aprovado.

## Causa

O checkpoint CAF original registrava apenas uma missão por vez. Ele não distinguia:

- missão-pai;
- submisão temporária;
- destinatário de retorno após a submisão.

Consequentemente, o encerramento válido do subfluxo foi propagado indevidamente para a missão-pai.

## Decisão

Toda submisão deve declarar:

```yaml
parent_mission_id: identificador_da_missao_pai
return_to: agente_ou_checkpoint_da_missao_pai
return_status: PENDING
```

Ao concluir uma submisão:

1. validar o resultado da submisão;
2. alterar `return_status` para `COMPLETED`;
3. restaurar o checkpoint da missão-pai;
4. repassar o bastão a `return_to`;
5. continuar a missão-pai na mesma resposta quando tecnicamente possível.

## Regra de encerramento

Uma missão com `parent_mission_id` não nulo só pode usar `ENCERRADO` quando:

```yaml
return_status: COMPLETED
return_to: destinatario_valido
```

O estado `ENCERRADO` conclui apenas o escopo identificado por `objetivo`. Ele nunca encerra automaticamente a missão-pai.

## Checkpoint hierárquico

```yaml
objetivo: MERGE-CURRENT-CYCLE
parent_mission_id: SCREEN-PHASE-22A-FIRST-SCREEN
return_to: Rafael
return_status: PENDING
estado: EM_EXECUCAO
ultimo_sucesso: PRs_validados
falha_atual: nenhuma
classe_da_falha: NENHUMA
efeito_confirmado: nenhum_efeito_indesejado
recuperacao_escolhida: nenhuma
proxima_acao: executar_merge_autorizado
destinatario: Gabriel
artefatos:
  - tipo: pull_request
    referencia: PR_12
```

Após o merge:

```yaml
objetivo: MERGE-CURRENT-CYCLE
parent_mission_id: SCREEN-PHASE-22A-FIRST-SCREEN
return_to: Rafael
return_status: COMPLETED
estado: ENCERRADO
ultimo_sucesso: merge_concluido
falha_atual: nenhuma
classe_da_falha: NENHUMA
efeito_confirmado: main_atualizada
recuperacao_escolhida: nenhuma
proxima_acao: nenhuma
destinatario: Rafael
artefatos:
  - tipo: commit
    referencia: merge_commit
```

Em seguida, o Mestre restaura:

```yaml
objetivo: SCREEN-PHASE-22A-FIRST-SCREEN
parent_mission_id: null
return_to: null
return_status: NOT_APPLICABLE
estado: EM_EXECUCAO
proxima_acao: implementar_wireframe
 destinatario: Rafael
```

## Regras do Mestre

O Mestre deve manter uma pilha de missões:

```text
missão-pai
→ submisão
→ conclusão da submisão
→ retorno obrigatório
→ continuação da missão-pai
```

Antes de declarar `ENCERRADO`, deve verificar:

- existe missão-pai ativa?;
- existe `return_to` pendente?;
- existe ação registrada no checkpoint pai?;
- a resposta atual devolveu o bastão ao fluxo original?.

Se qualquer resposta for positiva, o Mestre não pode encerrar o fluxo global.

## Compatibilidade

Checkpoints antigos sem os novos campos continuam válidos como missões independentes. Novos subfluxos devem usar os campos hierárquicos.

## Governança

```yaml
merge: exige_autorizacao_do_Leo
aplicacao_operacional: imediata
incidente_corrigido: sim
```
