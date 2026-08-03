# MCF-DEC-038-RC-001 — Auditoria do Baseline de Segurança e Abuso

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Coordenação:** Mestre  
**PR:** #32  
**Estado:** CONCLUÍDO

## Escopo auditado

- configuração segura de produção;
- limite global de payload;
- correlação sanitizada;
- headers HTTP de segurança;
- HSTS em produção;
- seleção de políticas por risco e rota;
- rate limiting persistente no PostgreSQL;
- incremento atômico por janela;
- pseudonimização de IP ou token com HMAC;
- testes de configuração, política e persistência;
- CI sem permissão de escrita.

## Evidências

```yaml
head_tecnico: 93b3135b5a8965481c748dbacb3327b151a83739
workflow_tecnico: 30792374178
workflow_documental: 30792374155
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migration_0011_first_run: PASS
migration_0011_second_run: PASS
configuration_tests: PASS
policy_selection_tests: PASS
postgres_rate_limit_tests: PASS
regression_tests: PASS
build: PASS
documentation_validation: PASS
ci_permissions: READ_ONLY
```

## Controles confirmados

- produção recusa o segredo padrão de desenvolvimento;
- `RATE_LIMIT_KEY_SECRET` exige pelo menos 32 caracteres;
- IPs e tokens não são persistidos em texto claro;
- o contador usa `INSERT ... ON CONFLICT DO UPDATE` e incremento atômico;
- cadastro, login, denúncias, comentários, reações, moderação, mutações e leituras possuem políticas distintas;
- o limite de payload é configurável e limitado por faixa segura;
- IDs de correlação fornecidos pelo cliente são aceitos somente quando passam pelo padrão fechado;
- respostas recebem headers de proteção e `cache-control: no-store`;
- HSTS é emitido somente em produção;
- o guard é global e a liveness não depende do banco;
- a CI final não altera arquivos nem possui permissão de escrita.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 5
```

- **LOW-001:** a tabela de janelas expiradas ainda não possui rotina automática de limpeza;
- **LOW-002:** o algoritmo de janela fixa permite rajada na fronteira entre duas janelas;
- **LOW-003:** `TRUST_PROXY` é booleano e deve ser habilitado somente quando a topologia do proxy estiver formalmente definida;
- **LOW-004:** os limites iniciais são conservadores, mas ainda precisam ser calibrados com métricas do piloto;
- **LOW-005:** faltam testes HTTP completos para headers, resposta `429` e propagação de `retry-after` no aplicativo montado.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
merge_blocked: false
slice_1_9a_aprovavel: true
producao_pronta: false
deploy_publico_imediato: false
```

O Slice A atende ao escopo de baseline de segurança e abuso e pode seguir ao gate de Léo. As reservas devem integrar as trilhas de observabilidade, operação e rollout da própria Fase 1.9.
