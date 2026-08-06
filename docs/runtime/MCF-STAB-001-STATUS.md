# MCF-STAB-001 — Estado da estabilização

## Autorização

Autorizado por Leandro em 5 de agosto de 2026.

## Base auditada

```yaml
repository: leon337/multiagent-collaboration-framework
base_branch: main
base_sha: 058ed2eb136b36ec85590b30587043aa181a42ef
working_branch: chore/mcf-stab-001-runtime-006
tracking_issue: 68
```

## Resultados iniciais

### Backlog legado

- issue #13: conteúdo do Screen Assistant; encerrada como `not_planned` no backlog do MCF;
- issue #14: Fase 6 do Screen Assistant; encerrada como `not_planned` no backlog do MCF;
- os conteúdos foram preservados e podem ser migrados para repositório próprio.

### PR #22

```yaml
assunto: trabalho_visivel_e_auditavel
estado: DRAFT_ABERTO
mergeable: false
incorporacao_parcial_na_main: true
acao: RECONCILIAR_SEM_MERGE_DIRETO
```

A regra central já aparece no README e em decisões posteriores. Os artefatos históricos e o validador automático proposto ainda precisam ser comparados com o runtime atual.

### PR #29

```yaml
assunto: retorno_obrigatorio_a_missao_pai
estado: DRAFT_ABERTO
mergeable: false
incorporacao_na_main: false
reserva: ENFORCEMENT_MEDIO
acao: PORTAR_E_AUTOMATIZAR_NO_RUNTIME
```

O schema presente na `main` ainda não contém:

- `parent_mission_id`;
- `return_to`;
- `return_status`.

A correção não deve ser tratada apenas como documentação. O MCF-RUNTIME-006 deverá implementar gerenciamento automático da pilha de missões e impedir encerramento global enquanto existir missão-pai ativa.

## Drift documental confirmado

O README da `main` ainda encerra sua lista principal na MCF-DEC-057. Deve ser atualizado para incluir:

- MCF-DEC-058;
- encerramento do MCF-RUNTIME-005;
- deploy automático de staging validado;
- recovery por redeploy do SHA saudável anterior;
- ausência de rollback nativo comprovado;
- MCF-RUNTIME-006 como próxima missão.

## Próximas ações

1. reconciliar os artefatos do PR #22;
2. portar o contrato hierárquico do PR #29 para o runtime atual;
3. adicionar testes de missão-pai/submissão;
4. atualizar README;
5. abrir PR draft da estabilização;
6. executar CI e registrar evidências.

## Estado

```yaml
backlog_legado: CLASSIFICADO
issues_13_14: ENCERRADAS_COM_HISTORICO
pr_22: EM_RECONCILIACAO
pr_29: PENDENCIA_TECNICA_CONFIRMADA
readme: PENDENTE
runtime_006_plan: CRIADO
fase_0: EM_EXECUCAO
```
