# Fase 1.9C — Operação, Backup, Restauração e Observabilidade

**Estado:** EM EXECUÇÃO  
**Branch:** `implementation/rede-social-operations-readiness`  
**Coordenação:** Mestre

## Resultado esperado

A aplicação emite telemetria HTTP mínima sem dados sensíveis, gera backup PostgreSQL com manifesto verificável e possui procedimento de restauração deliberadamente destrutivo, além de runbooks para incidente, rollback e alertas.

## Telemetria HTTP

Cada requisição concluída registra:

- evento fechado;
- método;
- template da rota;
- status HTTP;
- duração em milissegundos;
- resultado `SUCCESS` ou `ERROR`;
- `correlationId`.

Não registrar:

- corpo;
- query string;
- token ou cabeçalhos;
- IP;
- e-mail, nome ou IDs extraídos da URL concreta.

## Backup

1. validar `DATABASE_URL`;
2. criar diretório com permissão restrita;
3. executar `pg_dump` em arquivo temporário;
4. calcular SHA-256 e tamanho;
5. criar manifesto JSON;
6. renomear dump e manifesto de forma atômica;
7. nunca imprimir senha ou URL completa.

## Restauração

1. exigir `RESTORE_DATABASE_URL`;
2. exigir `ALLOW_DESTRUCTIVE_RESTORE=YES`;
3. ler manifesto;
4. validar nome, tamanho e SHA-256;
5. executar `pg_restore --clean --if-exists`;
6. consultar o ledger `_rsa_migrations`;
7. registrar somente metadados não sensíveis.

## Critérios de aceite

- logs não contêm URL concreta, query, corpo, token ou IP;
- sucesso e erro são registrados uma única vez;
- configuração PostgreSQL é convertida para variáveis de ambiente sem senha nos argumentos;
- backup usa arquivo temporário e manifesto;
- restauração falha sem confirmação destrutiva;
- checksum divergente bloqueia restauração;
- testes puros cobrem nomes, conexão, manifesto e checksum;
- runbooks possuem gatilho, contenção, recuperação, validação e encerramento;
- CI completa e build passam.

## Fora do slice

- provisionamento de bucket externo;
- credenciais reais de produção;
- integração com pager ou mensageria;
- execução real de restore em produção;
- deploy público.
