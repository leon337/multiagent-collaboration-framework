# PHASE-01 — Relatório de execução

## Resultado
A discovery autenticada da bridge Dual Browser foi concluída em modo somente leitura, e o canal DSH JSON-RPC + WebSocket passou por smoke E2E neutro. A reconciliação entre DSH e panes do Dual Browser permanece incompleta: as identidades dos panes estão UNBOUND, o helper canônico não resolve o registry no ambiente atual, não existe estado persistido de identidades no userData da instância e o adapter legado não tem listener.

## Evidência verificada nesta retomada
1. Revalidada a Agent Bridge em `127.0.0.1:47831`: `/health` HTTP 200, `/v1/discovery` HTTP 200, `/v1/agents` HTTP 200 e `/v1/missions` HTTP 200 com zero missões.
2. Instância `principal`, perfil `audit-architecture`, `paused=false`, `busy=false`, `queueDepth=0`. Panes: ChatGPT com título `Teste de integração MCF` e Claude com título `MCF Dual Browser Cockpit evolution - Claude`; ambos sem carregamento.
3. Identidades expostas pela bridge continuam Emily/chat e Sofia/workspace, ambas `UNBOUND`, `handshakeVerified=false`.
4. Inspeção somente leitura da fonte local confirmou que `main.mjs` resolve a ferramenta de sessão via `MCF_AGENT_SESSION_TOOL` se definido; caso contrário usa `~/.local/bin/mcf-agent-session`. A ferramenta é executada com cópia de `process.env`.
5. O helper usa `MCF_REPO_PATH` ou, na ausência, `~/Documentos/GitHub/multiagent-collaboration-framework`. Esse caminho padrão não existe e `MCF_REPO_PATH` não está presente no ambiente do processo DSH/Cockpit observado. Logo, o registry canônico não pode ser lido por essa configuração.
6. O arquivo `agent-identities.json` não existe no userData da instância `principal`. O código local define o perfil `audit-architecture` como Emily/chat e Sofia/workspace, mas isso é apenas o mapeamento configurado, não prova de handshake em conversas.
7. O código de `/v1/agents/bootstrap` chama o runtime de bootstrap. Quando não há sessão reutilizável, o fluxo de bootstrap pode criar/abrir conversa nova e enviar o envelope de identidade ao pane. O plano de startup adia o bootstrap automático para conversas restauradas. Portanto, não foi chamado esse endpoint enquanto os panes restaurados continuam sem identidade confirmada.
8. O runtime de identidade verifica o registry canônico, digest do contrato, sessão, envio do bootstrap e marcador exato `MCF_AGENT_READY agent_id=... session_id=...`. Sem essas evidências, não há fundamento para marcar Emily ou Sofia como READY.
9. A fonte local do Cockpit não é um checkout Git em `active-app-inspection`; o clone limpo adicional continua na ref local `main@47315de9` e seu remote SSH usa alias `github-mcf-leo`. A consulta direta a esse alias não passou por verificação de host. Não foi alterada nenhuma configuração Git nem escolhido esse clone como fonte canônica atual.
10. O adapter `dual_browser_ai` continua com arquivo de socket, mas sem listener; a discovery autorizada anterior retornou connection refused.
11. O smoke DSH anteriormente verificado continua sendo evidência independente de transporte: sessão `session-a2c17442-8f20-4a59-84f5-74074a1d6688`, preset `mcf`, marcador `MCF_CUIDABEM_002_DSH_E2E_ACK_20261011` confirmado no histórico, `turn/end` concluído, `running=false`, zero eventos de ferramentas. Nenhum prompt foi enviado aos panes restaurados.

## Análise
O bloqueio do helper não é uma falha de autenticação da bridge: é uma configuração de caminho de repositório ausente/inválida no ambiente do processo. O ambiente do processo em execução não pode ser corrigido retroativamente apenas alterando o ambiente de uma shell; a fonte lê essas variáveis no processo e as propaga aos subprocessos. A mudança operacional exigiria mecanismo suportado de configuração/reinicialização ou alteração explícita do helper, após seleção de checkout canônico validado.

O estado de identidade também não pode ser corrigido com um simples binding declarativo: o runtime exige contrato canônico e digest, sessão rastreável, envio confirmado e handshake. A chamada de bootstrap é potencialmente mutativa e pode abrir uma conversa nova no pane. Como os panes atuais são conversas restauradas, a execução seria insegura antes de confirmar o checkout e decidir o procedimento de preservação/associação.

## Estado
**AGUARDANDO_DEPENDENCIA_EXTERNA**. O transporte DSH está validado separadamente. A reconciliação Dual Browser ↔ DSH e o binding Emily/Sofia permanecem bloqueados.

## Próxima sequência segura
1. Obter uma via autenticada e verificável para consultar/obter o `main` canônico atual do MCF no host, sem confiar no alias SSH com falha de host key nem nas refs locais de setembro.
2. Preparar e validar um checkout isolado e limpo contra o SHA do `main` oficial antes de apontar qualquer helper para ele.
3. Escolher mecanismo suportado para passar `MCF_REPO_PATH` ao helper sem modificar a configuração/processo ativo até existir plano de preservação das sessões.
4. Só então decidir, com evidência de identidade e autorização, se os panes restaurados podem ser preservados e reconciliados ou se novas conversas dedicadas devem ser abertas.
5. Diagnosticar o ciclo de vida do adapter `dual_browser_ai` sem iniciar serviços nem alterar o Cockpit até localizar o procedimento oficial.
