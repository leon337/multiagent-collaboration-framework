# MCF — Adapter governado de leitura Gemini ↔ MissionRuntime (F1)

**Missão:** `MCF-GEMINI-MISSION-ADAPTER-F1-20261122`

**Classificação:** `EXPERIMENTAL / LAB_VERIFIED` — código de integração local, **não** deploy de produção

**Origem:** revisão colaborativa entre MESTRE (ChatGPT), MESTRE (DSH) e Gemini; implementação em branch isolada, teste E2E local independente

**Papéis:** LEANDRO — autoridade humana; MESTRE — orquestrador; LÉO — agente distinto.

## Objetivo e limites

Integrar uma capacidade **somente leitura** ao `ExternalActionDispatcher` e ao `PermissionEngine` já existentes no MissionRuntime TypeScript. O adapter `GeminiConversationReadAdapter` está registrado no `McfRuntimeModule` e é descoberto por `AdapterRegistry`. A skill `MCF-GEMINI-CONVERSATION-READ` está declarada em `skills/registry.yaml` com perfil `READ_ONLY`.

A implantação padrão está **desabilitada**; não existe permissão nova para envio de mensagens, navegação, ferramentas genéricas de navegador, criação de contas ou alterações externas. Mesmo habilitado, o adapter expõe apenas hashes e estados, nunca texto de conversa em recibo de execução. O token, URL, conta e chat de destino não são passados pelo modelo, e são responsabilidade exclusiva do broker privado autorizado.

## Contrato de entrada

| Campo             | Significado                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| `mission_id`      | Missão MCF; deve coincidir com `request.context.missionId`                           |
| `request_id`      | ID do turno no broker previamente autorizado                                         |
| `correlation_id`  | Correlação entre missão, consulta e recibo                                           |
| `idempotency_key` | Identificador da operação de leitura; uma chave com parâmetros diferentes é conflito |
| `policy_scope`    | Valor literal `approved-conversation`                                                |
| `evidence_ref`    | Referência privada da evidência, publicada no recibo apenas como hash                |

**Provider:** `mcf-gemini-conversation` · **Recurso:** `approved-conversation` · **Operações:** `read-status` e `read-reply`. Qualquer outra operação (incluindo `send`, `write`, `navigate` ou `execute`) é negada no `PermissionEngine`, na interface do adapter e no contrato de transporte.

A resposta do transporte deve comprovar `identity_verified`, `conversation_verified`, correspondência exata dos quatro identificadores de missão/requisição/correlação/idempotência, operação solicitada e status. Para `read-reply`, exige resposta concluída e não truncada. O texto é processado apenas para gerar SHA-256 na evidência; o conteúdo não entra em `McfToolReceipt.metadata`.

## Transporte local, opt-in

O transporte `LocalGeminiConversationTransport` chama a interface **read-only** de um módulo privado preexistente e vinculado à conversa autorizada, sem oferecer JS arbitrário, URLs, caminhos ou IDs de conta como parâmetros dos agentes. O operador configura as variáveis **fora do repositório**, usando caminhos privados próprios:

```text
MCF_GEMINI_CONVERSATION_READ_ENABLED=true
MCF_GEMINI_BROKER_MODULE_PATH=<diretorio-privado>/conversation-broker.cjs
MCF_GEMINI_BROKER_LEDGER_DIR=<diretorio-privado>/ledger
MCF_GEMINI_BROKER_APPROVED_MISSION_ID=<missao-aprovada>
MCF_GEMINI_BROKER_APPROVED_REQUEST_ID=<mensagem-aprovada>
```

O código valida módulo regular não simbólico com nome fixo, diretório privado pertencente ao usuário e ledger privado. O transporte exige que `mission_id` e `request_id` coincidam com a vinculação privada do operador **antes** de carregar o módulo. Apenas `status()` ou `readReply(request_id)` são invocados; `sendMessage` não é exposto. O broker é responsável por validar sua própria conta e conversa de destino no navegador. Se qualquer configuração faltar, o adapter falha fechado — mesmo que a flag seja `true`.

**Atenção:** este transporte requer broker e MissionRuntime **co-localizados** na mesma máquina e capazes de acessar o módulo privado. Ele não é uma ponte de rede genérica e não torna a sessão do Brave acessível a serviços externos. A chamada explícita de leitura ao broker pode usar a ponte Playwright e afetar a aba selecionada; atualizações visuais passivas são uma capacidade separada.

## Idempotência e estados

`READ_ONLY` não implica “bloquear polling”: consultas com a mesma chave e os mesmos parâmetros podem ser repetidas para recuperar uma resposta que ficou pendente. Reutilizar a chave com outra requisição gera `RESERVATION_CONFLICT`. O mapa usado na instância do adapter é local ao processo e limitado; não substitui o `ExternalActionLedger` canônico nem fornece garantia distribuída após reinício.

`read-status` pode retornar metadados `pending` ou `complete`; `read-reply` só gera recibo de sucesso para conteúdo concluído e correlacionado. Resposta não verificada/truncada, identidade divergente, falha de rede e timeout não devem promover um evento a `REPLY_COMPLETE`. Em caso de efeito incerto do broker ou de política, não disparar novo envio; escalar HUMAN_GATE do fluxo original para LEANDRO.

## Evidência e execução

- Fonte: `apps/rede-social-agentes/apps/server/src/mcf-runtime/gemini-conversation-{read.adapter,local-transport}.ts`.
- Contratos governados: `PermissionEngine`, `AdapterRegistry`, `McfRuntimeModule`, catálogo de skills.
- Testes automatizados: adapter, transporte privado, negação de operação indevida, agente incorreto, configuração desligada, reconsulta idempotente, mensagens cruzadas, truncamento, timeout, symlink, operação de backend não permitida e regressão do Google Bridge.
- Prova local: o código TypeScript compilado consultou uma **resposta real previamente enviada** via broker DSH; o `PermissionEngine` autorizou a leitura, o recibo continha apenas SHA-256 e a repetição não provocou novo envio. O assinador de prova foi **stub laboratorial**, não uma assinatura produtiva.
- Evidências brutas, identificadores de conversa e logs de execução: armazenados **fora do repositório público**, em diretório privado sob custódia humana.

Os testes de software e E2E local **não** equivalem a qualificação do MissionRuntime central em produção. Não publicar URLs privadas de chats, identidades da conta, capturas autenticadas ou segredos.

## Desativação e reversibilidade

A flag é `false` por padrão. Para rollback em uma futura implantação autorizada, desabilitar `MCF_GEMINI_CONVERSATION_READ_ENABLED` no ambiente do runtime e reiniciar somente o serviço governado correspondente, sob o gate operacional. O adapter deixa de aceitar consultas externas; não interrompe nem exclui a conversa original e preserva evidências para reconciliação. A presente missão **não** alterou configurações de serviços, fez merge ou deploy.

## Pendências de promoção

1. Auditoria independente do código e da capacidade real de co-localização, com verificação de armazenamento, isolamento de processos e política de retenção.
2. E2E com `EvidenceValidator` real e `ExternalActionLedger`/PostgreSQL canônicos, sem stub de assinatura e com telemetria correlacionada.
3. Prova de fail-closed em reinício/carga e troca real de conversa quando seguro, além dos testes simulados.
4. Integração de envio controlado **somente em fase futura**, com autorização verificável do PermissionEngine, HUMAN_GATE e recibo durável; não usar booleanos de modelo como aprovação.
5. Revisão/CI da branch, gate de LÉO e decisão humana de LEANDRO para mudanças de escopo e produção.

Ver também [o experimento documental anterior (PR #565)](https://github.com/leon337/multiagent-collaboration-framework/pull/565), proposto em PR independente. A referência não deve ser tratada como arquivo já presente em `main` enquanto seu PR não for integrado.
