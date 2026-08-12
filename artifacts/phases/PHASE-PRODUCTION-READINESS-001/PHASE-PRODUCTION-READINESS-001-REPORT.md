# PHASE-PRODUCTION-READINESS-001 — REPORT

## Estado

```yaml
mission: MCF-PRODUCTION-READINESS-001
issue: 124
state: IN_PROGRESS_EXTERNAL_BOUNDARY
cycle: 2
production_deploy: NOT_EXECUTED
stable_v1_0_0: NOT_PROMOTED
immutable_rc1: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
next_candidate: v1.0.0-RC2
```

## Resultado da revalidação técnica

A fase deixou de ser uma descoberta apenas documental. O workflow `MCF Production Readiness` foi criado e executado em PostgreSQL limpo, com auditoria de dependências, verificações de qualidade, migrations, testes, build, backup e restore isolado.

### Finding PRD-001 — migrations depois dos testes

A primeira execução revelou 56 falhas de integração causadas por tabelas inexistentes. Não era defeito dos 56 cenários: o workflow chamava a suíte antes das migrations. A ordem foi corrigida para aplicar migrations duas vezes antes dos testes.

### Finding PRD-002 — restore sem `--dbname`

O ensaio real de recovery revelou que `pg_restore` não recebia explicitamente o database alvo. A ferramenta foi endurecida para exigir banco alvo, usar `--dbname` e possuir teste de regressão. O ensaio subsequente restaurou o dump em `rsa_restore`, validou checksum e confirmou o ledger `_rsa_migrations`.

### Evidência verde

Run `31583249988`:

- dependency audit `high`: PASS;
- format/lint/typecheck: PASS;
- migrations twice: PASS;
- full tests: PASS;
- build: PASS;
- backup: PASS;
- isolated restore: PASS;
- migration ledger after restore: PASS;
- ops regression tests: PASS.

## Estado dos provedores

### Render

Workspace confirmado por LEANDRO: `Leandro's workspace` (`tea-d2u2msje5dus73eb6ehg`).

Inventário atual relevante:

- `mcf-runtime-staging-api`: existe, separado e com auto-deploy desativado;
- `rsa-web-free`: existe e usa o repositório oficial;
- `rsa-api-free`: **ainda não existe**.

O `render.yaml` vigente define `rsa-api-free` como Web Service Docker gratuito e `rsa-web-free` como Static Site. O conector Render disponível não suporta criação de Web Service Docker, portanto a materialização da API pública depende do Blueprint do painel Render.

### Neon

Projeto dedicado verificado:

```yaml
project_id: silent-sun-03230384
name: rede-social-agentes-ia
database: neondb
postgres: 17
permission: ADMIN
```

Nenhum banco de outro produto será reutilizado.

## Release boundary

A RC1 não pode receber a correção de restore retroativamente. Foi formalizado o boundary mínimo `v1.0.0-RC2`, sem criar Gate F. A publicação será automática e idempotente somente depois que o workflow de readiness passar no SHA pós-merge da `main`.

## Operação preparada

- runbooks de incidentes, rollback, canário, SLO/alertas e backup/restore revalidados;
- canário: 1–10%, observação mínima de 60 minutos;
- monitor de readiness a cada 5 minutos preparado com alerta por GitHub Issues;
- monitor permanece desabilitado até existir endpoint público, evitando falsos alertas.

## Próximo boundary material

Antes do efeito de produção:

1. fechar checks do head final do PR #125;
2. integrar o PR com proteção de expected-head;
3. requalificar a `main` pós-merge;
4. verificar publicação imutável da RC2;
5. materializar `rsa-api-free` pelo Blueprint Render;
6. configurar Neon, CORS e URLs sem expor credenciais;
7. coletar snapshot/backup pré-rollout;
8. smoke público + monitor + canário de 60 minutos;
9. fechar PRF Classe C e decisão de produção;
10. somente depois avaliar `v1.0.0` estável.
