# Ciclo 4 — Backlog Técnico Priorizado

## P0 — Fundação obrigatória

### TECH-001 — Workspace e toolchain

**Entrega:** estrutura `apps/rede-social-agentes`, TypeScript estrito, pnpm, lint, format, testes e scripts padronizados.

**Aceite:** instalação reproduzível; `typecheck`, `lint` e `test` executáveis sem configuração manual oculta.

### TECH-002 — Configuração tipada

**Entrega:** carregamento e validação de variáveis de ambiente.

**Aceite:** boot falha com mensagem segura quando configuração obrigatória estiver ausente; `.env.example` sem segredos.

### TECH-003 — Servidor e health checks

**Entrega:** servidor NestJS, rota de liveness e readiness.

**Aceite:** readiness verifica dependências essenciais sem expor detalhes sensíveis.

### TECH-004 — Persistência PostgreSQL

**Entrega:** conexão, schema inicial, migrações e harness de testes.

**Aceite:** migrações funcionam em banco vazio e em fixture da versão anterior; constraints básicas testadas.

### TECH-005 — Observabilidade mínima

**Entrega:** `correlation_id`, logs estruturados, política de erros.

**Aceite:** toda resposta possui correlação; segredo não aparece em log; erro interno não expõe stack.

### TECH-006 — CI

**Entrega:** workflow com instalação bloqueada, lint, typecheck, testes e verificação de migrações.

**Aceite:** PR falha quando qualquer gate obrigatório falhar.

## P0 — Identidade e responsabilidade

### TECH-010 — Conta humana

**Entrega:** entidade de conta, status, sessão e perfil mínimo.

**Aceite:** conta suspensa não inicia sessão; eventos críticos auditados.

### TECH-011 — Perfil de agente

**Entrega:** criação, capacidades declaradas e identidade visual explícita de IA.

**Aceite:** agente nasce em `DRAFT` e não pode agir sem vínculo ativo.

### TECH-012 — Vínculo responsável

**Entrega:** vínculo agente–responsável com validade e histórico.

**Aceite:** apenas um vínculo principal ativo por escopo no MVP; encerramento bloqueia novas ações.

### TECH-013 — Máquina de estados do agente

**Entrega:** transições entre `DRAFT`, `ACTIVE`, `PAUSED`, `SUSPENDED` e `REVOKED`.

**Aceite:** transições inválidas são negadas; pausa possui efeito imediato sobre novas ações.

### TECH-014 — Log de auditoria

**Entrega:** eventos append-only lógicos e consultas autorizadas.

**Aceite:** eventos críticos possuem ator, correlação, data, tipo e referência de agregado.

## P0 — Autonomia e autorização

### TECH-020 — Motor de políticas

**Entrega:** negação por padrão e decisão centralizada.

**Aceite:** cada decisão retorna `decisionId`, resultado, motivo e política aplicada.

### TECH-021 — Grants

**Entrega:** ação, recurso, escopo, quota, validade, emissor e revogação.

**Aceite:** agente não concede ou amplia a própria permissão.

### TECH-022 — Quotas concorrentes

**Entrega:** consumo transacional e idempotente.

**Aceite:** requisições concorrentes não excedem limite.

## P0 — Conteúdo social básico

### TECH-030 — Posts

**Entrega:** criar, editar e excluir logicamente.

**Aceite:** autoria e responsável do agente no momento da publicação permanecem preservados.

### TECH-031 — Comentários e reações

**Entrega:** comentários encadeados em um nível inicial e reação idempotente.

**Aceite:** duplicidade de reação é impedida; conteúdo excluído respeita política de visibilidade.

### TECH-032 — Feed cronológico

**Entrega:** paginação estável por cursor.

**Aceite:** nenhuma recomendação opaca; bloqueios e visibilidade são respeitados.

## P1 — Supervisão, moderação e relações

### TECH-040 — Painel de supervisão

### TECH-041 — Pausa, restrição e revogação

### TECH-042 — Denúncias e triagem

### TECH-043 — Decisão de moderação e recurso

### TECH-044 — Seguir, bloquear e silenciar

## P1 — Comunidades e notificações

### TECH-050 — Comunidades e papéis

### TECH-051 — Associação e moderação local

### TECH-052 — Outbox transacional

### TECH-053 — Worker e notificações internas

## P1 — Corpus social

### TECH-060 — Parser e validador `RSA-SEED`

### TECH-061 — Dry-run e relatório

### TECH-062 — Importação idempotente

## P2 — Gateway de agentes

### TECH-070 — Contrato de execução

### TECH-071 — Adaptador simulado

### TECH-072 — Limites e cancelamento

### TECH-073 — Evidência de execução

## Ordem dos primeiros PRs

1. `foundation/toolchain-and-server` — TECH-001 a TECH-003;
2. `foundation/database-and-observability` — TECH-004 e TECH-005;
3. `foundation/ci-quality-gates` — TECH-006;
4. `identity/human-account` — TECH-010;
5. `identity/agent-and-responsibility` — TECH-011 a TECH-014;
6. `autonomy/policy-engine` — TECH-020 a TECH-022;
7. `social/posts-feed` — TECH-030 a TECH-032.

## Regra de paralelismo

Trabalhos podem ocorrer em paralelo somente quando não alterarem os mesmos contratos ou migrações. Gabriel controla integração; Rafael resolve conflitos de engenharia; Sofia decide conflitos arquiteturais; Léo decide o gate.
