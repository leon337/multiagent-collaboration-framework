# MCF-DEC-042-RC-001 — Auditoria de Operação, Backup, Restauração e Observabilidade

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Coordenação:** Mestre  
**PR:** #34  
**Estado:** CONCLUÍDO

## Escopo auditado

- biblioteca operacional de conexão PostgreSQL;
- backup custom com manifesto e SHA-256;
- escrita temporária e renomeação atômica;
- credenciais fora dos argumentos de processo;
- restauração protegida por confirmação destrutiva;
- validação do manifesto e ledger de migrações;
- testes operacionais com `node:test`;
- telemetria HTTP global minimizada;
- runbooks de incidente, backup/restore, rollback e SLO/alertas;
- documentação e exclusão de dumps do Git.

## Evidências

```yaml
head_tecnico: b6555fd5fe972073a7301a2f99c6def3789ccf0a
workflow_tecnico: 30795204694
workflow_documental: 30795204718
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_first_run: PASS
migrations_second_run: PASS
operations_unit_tests: PASS
telemetry_minimization_tests: PASS
regression_tests: PASS
build: PASS
documentation_validation: PASS
ci_permissions: READ_ONLY
```

## Controles confirmados

- senha PostgreSQL é fornecida por variável de ambiente e não por argumento;
- dump usa formato custom, sem owner e sem privilégios;
- dump e manifesto são preparados em arquivos temporários antes da publicação;
- manifesto registra tamanho, SHA-256, formato e versão da ferramenta;
- divergência de tamanho ou checksum bloqueia restauração;
- restauração exige `ALLOW_DESTRUCTIVE_RESTORE=YES`;
- o ledger `_rsa_migrations` é validado após restore;
- logs HTTP usam template da rota, status, duração e correlação;
- corpo, query, cabeçalhos, token, IP e URL concreta não integram o evento;
- procedimentos de incidente e rollback distinguem rollback de aplicação de restore do banco;
- dumps locais são ignorados pelo Git;
- a CI final não possui permissão de escrita.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 7
```

- **LOW-001:** `pg_dump`, `pg_restore` e `psql` dependem de instalação compatível no ambiente operacional e ainda não estão encapsulados em imagem imutável;
- **LOW-002:** o fluxo de backup não possui agendamento automático;
- **LOW-003:** não existe armazenamento externo, imutável ou geograficamente separado para dumps e manifestos;
- **LOW-004:** a CI testa a biblioteca e o manifesto, mas não executa um ciclo real completo de dump e restore;
- **LOW-005:** a telemetria é emitida em `stdout`, sem coletor, retenção ou consulta centralizada configurados;
- **LOW-006:** alertas e escalonamento ainda não estão conectados a um canal operacional real;
- **LOW-007:** RPO, RTO e SLO são provisórios e ainda não foram calibrados por dados de piloto.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
merge_blocked: false
slice_1_9c_aprovavel: true
restore_de_producao_testado: false
alertas_reais_ativos: false
producao_pronta: false
deploy_publico_imediato: false
```

O Slice C estabelece uma base operacional verificável e pode seguir ao gate de Léo. O primeiro rollout continua condicionado à infraestrutura real, ao armazenamento de backup, à coleta de telemetria, aos alertas e a um ensaio completo de restauração.
