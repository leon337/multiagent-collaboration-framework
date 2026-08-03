# Runbook — Backup e Restauração PostgreSQL

**Responsável primário:** Bruno  
**Banco de dados:** Manoel  
**Auditoria:** Emily

## Pré-requisitos

- `pg_dump`, `pg_restore` e `psql` compatíveis com a versão do servidor;
- acesso mínimo necessário ao banco;
- diretório de backup com permissão restrita;
- destino de restauração isolado para testes;
- espaço suficiente para dump, manifesto e restauração.

## Criar backup

```bash
DATABASE_URL='postgresql://...' \
BACKUP_DIRECTORY='./var/backups' \
pnpm ops:backup
```

A execução deve produzir:

- `<nome>.dump` em formato custom;
- `<nome>.manifest.json` com tamanho, SHA-256, versão da ferramenta e identidade não secreta do banco.

A saída não deve conter URL completa nem senha.

## Verificar backup

1. confirmar presença do dump e manifesto;
2. conferir permissões do diretório e arquivos;
3. validar que o `dumpFile` do manifesto corresponde ao arquivo;
4. recalcular tamanho e SHA-256;
5. copiar dump e manifesto como uma unidade;
6. registrar local, horário e responsável.

## Restaurar em ambiente isolado

```bash
RESTORE_DATABASE_URL='postgresql://...' \
BACKUP_MANIFEST='./var/backups/<nome>.manifest.json' \
ALLOW_DESTRUCTIVE_RESTORE=YES \
pnpm ops:restore
```

A ferramenta deve:

- bloquear execução sem confirmação explícita;
- validar manifesto antes do primeiro comando destrutivo;
- executar `pg_restore --clean --if-exists --exit-on-error`;
- confirmar a existência e contagem do ledger `_rsa_migrations`.

## Teste pós-restauração

- executar `/health/ready` contra a instância restaurada;
- validar login com conta de teste dedicada;
- validar leitura do feed e comunidade de teste;
- validar fila de moderação com operador de teste;
- validar exportação de privacidade de uma conta de teste;
- registrar versão, quantidade de migrações e resultado.

## Política operacional inicial

```yaml
frequencia_minima_piloto: DIARIA
backup_antes_de_migracao: OBRIGATORIO
retencao_local_recomendada: 7_DIAS
copia_externa: PENDENTE_DE_PROVEDOR
teste_de_restore: SEMANAL_NO_PILOTO
rpo_provisorio: 24_HORAS
rto_provisorio: 4_HORAS
```

Os valores são provisórios e devem ser calibrados após medição de volume, custo e criticidade.

## Proibições

- não restaurar diretamente sobre produção para testar um arquivo;
- não guardar dump em Git;
- não separar dump de manifesto;
- não ignorar divergência de checksum;
- não afirmar recuperação válida sem teste pós-restauração.
