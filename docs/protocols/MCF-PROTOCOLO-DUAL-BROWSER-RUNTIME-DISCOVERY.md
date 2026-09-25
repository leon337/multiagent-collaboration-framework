# Protocolo de Discovery do MCF Dual Browser para o MESTRE

**Classificação:** REGRA NORMATIVA OPERACIONAL
**Aplicação:** missões executadas em MCF Dual Browser, Agent Bridge ou Agent Session
**Autoridade humana final:** LEANDRO
**Orquestrador:** MESTRE

## 1. Finalidade

Eliminar descoberta manual do funcionamento da Execution Surface. Um MESTRE novo deve consultar o runtime real antes de operar panes, agentes, novas conversas ou Agent Sessions.

A memória de chats anteriores é auxiliar. O runtime live é a fonte operacional primária.

## 2. Startup obrigatório

Quando o Dual Browser fizer parte da missão, o MESTRE deve:

1. identificar a instância correta;
2. ler o descriptor local da instância;
3. chamar `GET /v1/discovery`;
4. reconciliar panes, agentes, Agent Sessions e warnings retornados;
5. só então escolher o mecanismo e despachar trabalho.

É proibido inferir mecanismos apenas por histórico de chat quando o discovery estiver disponível.

## 3. Descriptor

No Linux:

```text
~/.config/mcf-dual-browser-cockpit/instances/<instance-id>/agent-bridge.json
```

O token do Bridge é credencial efêmera: pode autenticar chamadas locais, mas não deve ser exposto em chat, commit ou relatório.

## 4. Endpoint canônico

```text
GET /v1/discovery
```

Headers esperados:

```text
Authorization: Bearer <bridge-token>
X-MCF-Instance: <instance-id>
```

Schema:

```text
mcf-dual-browser-runtime-discovery/v1
```

O payload descreve instância, `agentProfile`, pause/busy/queue, agentes vinculados aos panes, agentes canônicos elegíveis para Agent Session, Agent Sessions conhecidas, mecanismos, rotas e warnings.

## 5. Mecanismos

### 5.1 Pane Agents

Dois panes persistentes por instância: `chat` e `workspace`. Os agentes vinculados dependem do `agentProfile`.

Rotas principais: `GET /v1/agents`, `POST /v1/agents/bootstrap`, `POST /v1/mission-envelope`, `GET /v1/missions`, `GET /v1/mission-status` e `GET /v1/mission-result`.

### 5.2 Agent Session

Uma Agent Session abre uma janela ChatGPT independente e cria uma sessão persistida pelo broker `mcf-agent-session`.

Rotas: `GET /v1/agent-sessions` e `POST /v1/agent-session/open`.

Ela instancia operacionalmente um agente já registrado; não cria automaticamente um novo contrato de agente.

### 5.3 Automação direta de pane

Rotas semânticas/programáticas incluem `/v1/state`, `/v1/text`, `/v1/interactive`, `/v1/navigate`, `/v1/message`, `/v1/messages/broadcast`, `/v1/find-click`, `/v1/click`, `/v1/type` e `/v1/capture`.

### 5.4 Canal live

`GET /v1/live/snapshot` e `GET /v1/live/stream` são observacionais/read-only. Não executam missão nem decidem terminalidade.

## 6. Invariante de criação de conversa

**Texto presente no composer não é evidência de envio.**

Uma Agent Session só é considerada criada com bootstrap entregue quando coexistem:

1. turno real de usuário fora do composer contendo marker e `session_id`;
2. bootstrap ausente do composer;
3. URL com identidade `/c/<conversation-id>`.

Se qualquer condição falhar, o resultado deve ser fail-closed como `chat_conversation_not_created`.

É proibido promover sucesso com base em `document.body.innerText`, marker presente em draft ou clique presumido no botão de envio.

## 7. Sessões legadas

Builds anteriores podiam persistir `surfaceState=OPEN` com o bootstrap ainda no composer. O discovery moderno deve sinalizar:

```text
deliveryVerified: false
stateWarning: open_without_conversation_evidence
```

Esse warning bloqueia conclusão automática de que a sessão foi criada corretamente.

## 8. Retomada pelo MESTRE

```text
RECUPERAR CONTRATO
→ IDENTIFICAR EXECUTION SURFACE
→ LER DESCRIPTOR
→ GET /v1/discovery
→ INVENTARIAR PANES + AGENTES + AGENT SESSIONS
→ RECONCILIAR WARNINGS
→ SELECIONAR MECANISMO
→ EXECUTAR
```

## 9. Regra para futuras extensões

Novo mecanismo do Dual Browser só fica disponível para uso geral quando estiver exposto no discovery, tiver critério de sucesso verificável, teste de regressão e documentação persistente.

## 10. Autoridade

Discovery é descritivo. Não altera gates, escopo, autorização de merge/produção nem contratos dos agentes. `false_green_allowed=false` permanece invariante.