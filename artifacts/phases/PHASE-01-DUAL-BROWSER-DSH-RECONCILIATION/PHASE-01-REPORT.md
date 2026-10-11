# PHASE-01 — Relatório de execução

## Resultado
A discovery autenticada do Dual Browser foi concluída em modo somente leitura, e o canal DSH JSON-RPC + WebSocket passou por um smoke E2E neutro. A reconciliação entre o DSH e os panes do Dual Browser permanece incompleta: as identidades dos panes estão `UNBOUND`, não há missões ativas no snapshot, o registry canônico não é resolvido pelo helper em sua configuração atual e o socket do adaptador legado não tem listener.

## Execução cronológica
1. Consultados o estado atual MCF, protocolo operacional v1.1, protocolo de discovery Dual Browser, manual de UI, contrato semântico e Issue #431.
2. Criada a missão persistente MCF-CUIDABEM-002 na Issue #434 e aberta a PR documental #435.
3. Verificado `GET http://127.0.0.1:47831/health`: HTTP 200, serviço `mcf-dual-browser-agent-bridge`, versão 1.
4. Confirmada a existência do descriptor restrito em `/home/leo/.config/mcf-dual-browser-cockpit/instances/principal/agent-bridge.json`. O token foi usado somente em memória para chamadas GET autenticadas; seu valor não foi impresso nem incluído nos artefatos.
5. Discovery autenticada `GET /v1/discovery`: HTTP 200, schema `mcf-dual-browser-runtime-discovery/v1`, instância `principal`, perfil `audit-architecture`, `paused=false`, `busy=false`, `queueDepth=0`.
6. Estado dos panes: `chat` em ChatGPT, título `Teste de integração MCF`; `workspace` em Claude, título `MCF Dual Browser Cockpit evolution - Claude`. Ambos estavam sem carregamento. Não houve interação com os panes.
7. `GET /v1/agents`: Emily (`chat`) e Sofia (`workspace`) estão `UNBOUND`; `handshakeVerified=false`, sem session/trace/digest vinculados. `GET /v1/missions` retornou zero missões. `/v1/live/snapshot` retornou HTTP 200, zero eventos, dois agentes e zero missões.
8. `GET /v1/agent-sessions` retornou 92 registros históricos: 28 `PENDING_OPEN`, 47 `OPEN` e 17 `FAILED`. Os 47 registros marcados com bootstrap/evidência não demonstram janelas abertas agora: `windowOpen=false` em todos. Dois registros mais recentes de 2026-10-10 estão `PENDING_OPEN`, sem bootstrap enviado. Esses registros não foram tratados como sessões atuais.
9. O helper `/home/leo/.local/bin/mcf-agent-session` falha na discovery canônica porque seu `DEFAULT_REPO` aponta para `/home/leo/Documentos/GitHub/multiagent-collaboration-framework`, caminho inexistente. O processo DSH em 3091 não tem `MCF_REPO_PATH` configurado. Com `MCF_REPO_PATH` explícito, o helper lista 29 agentes em clones locais, mas não foi escolhido um destino de configuração: o clone `workspaces/multiagent-collaboration-framework` está 282 commits atrás de `origin/main` e tem alterações locais; o clone de continuidade está numa branch de missão histórica.
10. Outro clone local limpo em `/home/leo/mcf-workspaces/leo/multiagent-collaboration-framework` está em `main` no commit `47315de9` (2026-09-18), com `origin/main` local em `23107958` (2026-09-20), 33 commits à frente. O remote usa o alias `github-mcf-leo`; isso não corresponde ao `main` atual do GitHub, SHA `460d6e6f` (2026-10-09). Esse clone também não foi considerado atual o suficiente para configurar o runtime.
11. O socket `/home/leo/.config/dual-browser-ai/sentinel.sock` existe, mas o adapter SentinelX `dual_browser_ai.discovery` falhou `endpoint_unreachable` / `connect failed: [Errno 111] Connection refused`; não foi encontrado listener Unix correspondente.
12. DSH em `127.0.0.1:3091` responde HTTP 200 na raiz. Probes REST não documentados para `/api/health`, `/openapi.json`, `/api/openapi.json`, `/health` e `/v1/models` retornaram 404; isso não testa o contrato JSON-RPC documentado.
13. Conforme `docs/integrations/MCF-HARNESS-MESTRE-OX-CHANNEL.md` no `main@460d6e6f`, as chamadas operacionais usam `POST /api/<method>` com envelope JSON-RPC `client-request`, e eventos usam WebSocket em `/api/events.mux`/`/api/events.host`.
14. Smoke E2E neutro no DSH: `agentPreset.list` confirmou o preset `mcf`; `session.create` criou sessão de teste `session-a2c17442-8f20-4a59-84f5-74074a1d6688` em `/tmp`; `session.prompt` foi aceito; `/api/events.mux` recebeu `session/event` e evento terminal; `session.history` confirmou o marcador `MCF_CUIDABEM_002_DSH_E2E_ACK_20261011` em `assistant/message`, `turn/end` com `reason.kind=completed` no `seq=58`, `running=false`, e zero eventos `tool/call`/`tool/result`. A sessão de teste permanece registrada como concluída.
15. A build-fonte local do Cockpit continua identificada como AppImage 0.6.9 Streaming ORCA, SHA-256 `9c56e750db058a76f86d23d95ecb950c4f0884588a6e2f8b0b16171b3140bc3a`; a suíte local previamente executada passou com 6 testes e 0 falhas. Isso valida a suíte da fonte, não a integração E2E.
16. Nenhuma mensagem foi enviada aos panes restaurados nem aos agentes Emily/Sofia; o único prompt enviado foi o marcador neutro para a sessão de teste DSH acima. Nenhuma configuração operacional foi editada e nenhum processo foi reiniciado.

## Análise
A autenticação da bridge está funcionando. A causa da falha de `canonicalAgents` foi localizada: o helper usa um caminho padrão inexistente porque `MCF_REPO_PATH` não está configurado no processo que serve a integração. Não é seguro apontar esse processo para um clone local sem reconciliar a origem canônica: o clone principal visível está desatualizado e com working tree suja, enquanto o clone de continuidade está numa branch histórica. O clone limpo adicional também está baseado em refs de setembro e não acompanha o `main` atual do GitHub. O adapter de socket legado também não está em execução, apesar do arquivo de socket persistente.

A API DSH documentada foi confirmada com uma sessão de teste independente e terminal comprovado. Isso valida o transporte DSH, mas não reconcilia as identidades dos panes do Dual Browser. Os panes atuais estão preservados e desassociados de suas identidades; o protocolo de discovery proíbe inferir entrega a partir de drafts ou de registros históricos.

## Estado
**AGUARDANDO_DEPENDENCIA_EXTERNA** para reconciliação segura das identidades dos panes, seleção de checkout canônico e resolução do adapter legado. O smoke E2E do transporte DSH passou; o objetivo Dual Browser ↔ DSH ponta a ponta ainda não foi atingido.

## Próxima sequência segura
1. Determinar o checkout canônico atualizado sem tocar nas working trees locais sujas/históricas.
2. Definir, por mecanismo suportado, `MCF_REPO_PATH`/`MCF_AGENT_SESSION_TOOL` para a próxima inicialização controlada do Cockpit; não reiniciar até haver plano de preservação da sessão.
3. Identificar se o socket `dual-browser-ai` é um componente legado que deve ser iniciado por procedimento documentado ou se deve ser retirado do caminho de integração.
4. Após resolver esses pontos, vincular somente sessões/agentes com evidência de identidade e autorização; verificar turno real e URL de conversa antes de declarar entrega.
