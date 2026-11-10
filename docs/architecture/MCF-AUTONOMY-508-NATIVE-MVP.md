# MCF-AUTONOMY-001 — núcleo de continuação observacional no runtime

> Issue [#508](https://github.com/leon337/multiagent-collaboration-framework/issues/508) · ADR proposta no [PR #509](https://github.com/leon337/multiagent-collaboration-framework/pull/509) · Implementação inicial: **somente observação; nenhuma automação de produção**.

## Problema resolvido neste slice

Quando um agente encontra a mesma dependência externa, o MCF precisa registrar o estado e continuar sem repetir a mesma solicitação para LEANDRO. O Mobile Lab implementou e verificou um protótipo funcional de SQLite + painel Tailscale. O runtime oficial agora recebe o **núcleo transacional Postgres** da mesma semântica, separado da autorização de produção.

- `MissionContinuationService`: valida goal, SHA, binding, blockers e fingerprint; somente duas saídas não terminais: `BLOCKED_EXTERNAL` e `WAITING_CANONICAL_GATE`.
- `PostgresMissionContinuationRepository`: `dedupe_key` único, registro idempotente e `UPDATE` transacional que incrementa notificações apenas se o fingerprint realmente muda.
- Migration `0032_mcf_autonomy_continuations.sql`: tabela dedicada de observação, constraints SHA, fingerprint, state, `gate_request_count=0` e índices.
- `McfRuntimeModule`: provider DI registrado; **nenhum endpoint ou job automático de produção foi ativado**. Ações externas, CRON/daemon, criação de gates oficiais e deploy continuam fora deste slice.

## Evidência

- Mobile Lab PR #4 mesclado, **147 testes PASS**; timer systemd de usuário habilitado e painel Tailscale ativo em `https://leo-n43sm.tail582305.ts.net:8446/autonomia`.
- O monitor real identificou quatro pendências do release `main@0bcea848...`, registrou 1 notificação, 0 gates, `BLOCKED_EXTERNAL`, e nenhuma alteração de provider.
- Tests TypeScript do núcleo: 100 polls idênticos => 1 notificação, 0 gates; same-goal/SHA/target dedupe; restart, normalize order, SHA diferente; falha fechada.
- Teste SQL isolado com PostgreSQL 18 executado em container descartável. Migrations aplicadas exclusivamente nessa instância, 100 consultas concorrentes e duas criações simultâneas resultaram em um registro e uma notificação; `WAITING_CANONICAL_GATE` não autoriza produção.

## Não confundir estado

`WAITING_CANONICAL_GATE` é apenas um sinal de prontidão do **observador**, não `AUTHORIZED`. Ele não cria evento LÉO, comprovante de decisão de LEANDRO, GateRequest real nem SHA aprovado.

A persistência de `mcf_mission_continuations` **não** é a fonte de verdade para autorização ou para modificar produção. Ela é um read model de execução observacional; o escritor material de deploy continua sendo o pipeline existente, com o resolver canônico.

## Evolução necessária

1. Vincular o observador a eventos/skills do `MissionRuntimeService` e ao painel de decisão, sem criar dois escritores materiais.
2. Introduzir `GateRequest` com credenciais, decisão assinada, ownership LÉO e idempotência conforme ADR. O protótipo de laboratório só aprova `LAB_SIMULATION`.
3. Descobrir o target real e remover a circularidade de bootstrap STAGING-only **via protocolo de confiança revisado**, não por supressão do gate.
4. E2E reiniciar o servidor oficial e verificar a persistência do mesmo registro. Antes de deploy real, resolver Issue #506, gates, backup e rollback.

**Este PR altera o código no repositório, mas não foi promovido ao contêiner oficial, que permanece saudável na imagem antiga.**
