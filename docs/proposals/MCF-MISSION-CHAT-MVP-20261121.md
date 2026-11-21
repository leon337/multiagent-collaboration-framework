# Sala de Missão MCF — MVP (candidato)

**Status:** implementação em branch isolada. **Não implantado em produção.**
Escopo aprovado no chat: criar um MVP de comunicação visível entre humano e time MCF.
Este incremento reutiliza o PostgreSQL, a autenticação de sessões humanas e o token já
existente do runtime. Não cria um novo executor, broker, identidade de agente ou fonte
de verdade para as missões.

## Entrega

- Sala `geral` e lista das 30 missões mais recentemente atualizadas.
- Mensagens humanas autenticadas: `MESSAGE`, `TASK`, `RESULT`, `BLOCKER`,
  `HANDOFF` (informativo), `APPROVAL_REQUEST`.
- Armazenamento append-only no PostgreSQL; cursor global sequencial por mensagem;
  histórico das últimas 100 por sala e novos itens paginados por cursor.
- SSE autenticado (polling de DB a cada 2 segundos para sobreviver a múltiplas instâncias)
  com fallback de polling no navegador quando streams não estão disponíveis.
- Endpoint de publicação pelo runtime, protegido com `MCF_RUNTIME_TOKEN` existente
  e idempotência por UUID. A identidade do agente é **reportada**, não validada
  por broker ou handshake: a UI sempre identifica essa limitação.
- Interface responsiva no aplicativo web piloto, acessível por `/?mission-chat`.

## Como executar no ambiente de desenvolvimento

Requer Node/pnpm compatíveis com o monorepo e PostgreSQL de desenvolvimento
configurado (não use a base de produção).

1. No diretório `apps/rede-social-agentes`, configure `DATABASE_URL` e as
   configurações documentadas em `.env.example`.
2. Execute `pnpm install --frozen-lockfile` se necessário.
3. Execute `pnpm --filter @rsa/database db:migrate`.
4. Execute o servidor: `pnpm --filter @rsa/server build` e
   `pnpm --filter @rsa/server start`.
5. Execute `pnpm --filter @rsa/web dev`, com
   `VITE_API_BASE_URL=http://127.0.0.1:3000` no ambiente do web.
6. Abra `http://127.0.0.1:5173/?mission-chat` e autentique-se com
   conta humana previamente criada pelo fluxo `POST /v1/accounts` /
   `POST /v1/sessions`. A conta precisa respeitar
   `RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID` quando configurado.
   O token da sessão fica somente na memória do navegador.

### API

| Operação | Endpoint | Autenticação |
| --- | --- | --- |
| Listar salas | `GET /v1/mcf/mission-chat/rooms` | Bearer de sessão humana |
| Histórico | `GET /v1/mcf/mission-chat/rooms/:id/messages?after=0` | Bearer de sessão humana |
| Enviar do humano | `POST /v1/mcf/mission-chat/rooms/:id/messages` | Bearer de sessão humana |
| Stream | `GET /v1/mcf/mission-chat/rooms/:id/stream?after=0` | Bearer de sessão humana |
| Relatar do runtime | `POST /v1/mcf/mission-chat/runtime/rooms/:id/messages` | Header `x-mcf-runtime-token` |

Corpo humano:
```json
{"kind":"MESSAGE","content":"Precisamos revisar o plano."}
```

Corpo runtime (somente adaptador autorizado; não usar token no navegador):
```json
{"agentId":"SOFIA","agentLabel":"Sofia","kind":"RESULT","content":"Relato técnico, ainda sem prova de ACK/execução.","idempotencyKey":"00000000-0000-4000-8000-000000000001"}
```

`:id` é `geral` ou o UUID real de uma missão persistida. Os parâmetros e
a sessão são validados no servidor. A lista mostra no máximo 30 missões,
sem busca avançada nesta versão.

## Segurança, semântica e limites

- **Não é um canal de execução.** Texto, menção `@agente`, `HANDOFF` ou
  `APPROVAL_REQUEST` **não despacham trabalho, não constituem ACK, não
  concedem autorização e não alteram** `mcf_missions`, gates ou recibos.
- `AGENT_REPORTED` indica somente que um chamador com token do runtime postou
  uma mensagem que alegou um nome. Não equivale a identidade do agente,
  presença de sessão, confirmação de entrega ou execução verificada.
- O acesso humano exige sessão válida e, onde configurado, a conta da
  autoridade humana reservada; em produção essa reserva é obrigatória.
- A UI não grava tokens em localStorage e não automatiza reenvios após
  falhas ambíguas. O backend de mensagens de runtime deduplica por chave
  de idempotência e rejeita reuso com payload divergente.
- Não anexar segredos, transcrições privadas, arquivos ou credenciais.
- SSE usa conexão de leitura autorizada e dura no máximo aproximadamente
  cinco minutos; o cliente recorre a polling após o encerramento.
- MVP single-tenant sob o boundary atual da autoridade humana. Adoção
  multiusuário, permissões por sala, buscas, retenção/expurgo, analytics
  e integração broker/identidades exigem nova revisão de arquitetura.
- A publicação de produção requer o **fluxo governado** do MCF, com gates e
  SHA exato; este PR não realiza merge ou deploy.

## Validação

- Executar `pnpm --filter @rsa/server test`, `pnpm --filter @rsa/server typecheck`,
  `pnpm --filter @rsa/web typecheck` e `pnpm --filter @rsa/web build`.
- Validar a migração em PostgreSQL descartável. Não aplicá-la em produção
  durante a avaliação do MVP.
- No teste E2E futuro, verificar sessão humana, sala geral, sala de missão,
  mensagens concorrentes, SSE, revogação, reenvio idempotente e ausência
  de ACK/execução falsa.

**Referência de governança:** Issue #492, protocolo operacional unificado
e MCF-CURRENT-STATE. Esta implementação não encerra a Issue #492 nem
declara cumprido seu escopo de broker, ACK ou execução real.
