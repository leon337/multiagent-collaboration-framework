# MCF Agent Studio — MVP com integração real ao DeepSeek Harness

Missão: https://github.com/leon337/multiagent-collaboration-framework/issues/467
Pull request de revisão: https://github.com/leon337/multiagent-collaboration-framework/pull/468

## Estado e acesso

- Interface local: http://127.0.0.1:4317
- DeepSeek Harness Web: http://127.0.0.1:3080 (exige autenticação já configurada)
- Preset administrado: **Hello World Agent** (`preset-hello-world-agent`), somente no perfil Web.
- Serviço de usuário: `mcf-agent-studio.service`; reinicia em falha e inicia no login do Linux.
- O processo usa Node.js >= 22, sem instalação de dependências npm para o Studio.

## Como iniciar e verificar

Instalação idempotente como serviço do usuário:

```bash
cd "/home/leo/MCF MISSIONS/mcf-chatgpt-workspace/apps/mcf-agent-studio"
bash scripts/install-user-service.sh
systemctl --user status mcf-agent-studio.service
npm test
```

O script resolve o caminho com espaço (`MCF MISSIONS`) por um link local controlado em `~/.local/share/mcf-agent-studio`; não remove nem substitui links preexistentes incompatíveis.

## Ciclo de edição e publicação

1. Faça um pedido ao chat guiado em PT-BR ou edite os campos no painel visual.
2. Gere a proposta e inspecione **Antes/Depois**.
3. Aplique ao rascunho e use o painel **Teste imediato** para a prévia local, que **não** representa uma sessão real do Harness.
4. Acesse **Publicar** (barra lateral no desktop ou menu móvel). Clique **Revisar publicação no DSH**.
5. Leia a configuração e digite `PUBLICAR HELLO WORLD` na confirmação.
6. O backend verifica o hash do perfil, cria backup, modifica exclusivamente a entrada do Hello World Agent e registra a revisão publicada.
7. Abra uma **nova conversa no DeepSeek Harness**, selecione Hello World Agent e faça o teste. Sessões antigas não recebem mudanças de preset.
8. Use **Reverter última publicação** para restaurar o backup, com confirmação textual e proteção contra alterações externas.

## Comportamento e ferramentas reais

O plugin Cordis `dsh-plugin-v2.mjs` é carregado no escopo do preset. Ele interpreta somente campos validados: nome, modo, resposta, instruções e lista de ferramentas aprovadas. Modos:
- `fixed`: responde sempre o texto configurado;
- `echo`: devolve a mensagem do usuário;
- `instructed`: segue instruções em conversa com o modelo configurado no DSH.

Ferramentas implementadas: `agent_studio_calculator` (operações aritméticas restritas, sem eval) e `agent_studio_clock` (hora local). O runtime usa um guard para negar execução de outras ferramentas herdadas, inclusive se o modelo tentar chamá-las. Não é um editor de código arbitrário ou instalador geral de plugins.

**Evidências reais:** [Relatório de integração](../../docs/missions/MCF-20261022-AGENT-STUDIO-REAL-INTEGRATION.md). Foram observados no Harness a resposta modificada `MCF Agent Studio integrado!`, o resultado `30` por chamada real da calculadora e bloqueio real de `list_agents`.

## 9Router opcional (edição por IA)

O Studio consulta modelos do 9Router local em `127.0.0.1:20128/v1/models` (129 IDs na auditoria realizada, sujeitos a mudança). No painel **Configurar conexão**, insira ID de modelo e sua própria chave para usar **Usar IA via 9Router**. A chave é mantida apenas na memória do processo; reiniciar o serviço apaga essa configuração. O modo guiado funciona sem chave. Para configurar, abra o painel **Configurar conexão**, selecione um dos IDs listados, informe a chave do 9Router no campo protegido e clique **Salvar e testar conexão**. O teste de autenticação chama o endpoint real de chat do 9Router; somente depois de receber resposta o indicador de conexão fica ativo. O botão não declara sucesso apenas por salvar a chave. **Não compartilhe a chave no chat do MCF, no GitHub nem em arquivos do projeto.** O serviço apaga a chave ao reiniciar.

**Limitação validada:** foi verificada a listagem de modelos, mas a geração sem credencial retornou HTTP 401. Não foi concluído um teste fim a fim de proposta gerada por LLM a partir do Studio. Isso não altera os ensaios do agente real no DSH, cujo modelo já estava configurado.

## Arquitetura e segurança

```text
Navegador: chat/painel, diff, histórico, preview local
   → API Node.js 127.0.0.1:4317
   → proposta validada (modo guiado ou 9Router com chave)
   → rascunho versionado em .data/state.json
   → plano de publicação + hash SHA256
   → confirmação humana exata
   → backup íntegro e gravação atômica do preset permitido
   → DSH HMR → nova sessão → plugin Cordis scoped + guard
```

Endpoints adicionais: `GET /api/models`, `GET /api/publish/status`, `POST /api/publish/plan`, `POST /api/publish/commit` e `POST /api/publish/rollback`. Também há `GET /health`, `GET /api/state`, `POST /api/provider`, `POST /api/propose`, `POST /api/apply`, `POST /api/restore`, `POST /api/preview` e `GET /api/export`.

Os dados, backups e registros de publicação ficam em `.data/`, ignorados pelo Git. O servidor escuta exclusivamente em localhost e valida Host/Origin, entradas e ferramentas. Não há autenticação multiusuário: **não exponha a porta 4317 diretamente na rede**. Publicações futuras devem manter autorização e isolamento.

## Testes e limites

`npm test` cobre proposta, salvar, restaurar, versão, publicação, negação de confirmação, proteção contra conflito de edição, backup, reversão e registro de ferramentas. Testes de navegador cobriram desktop, tablet e celular sem overflow horizontal. O relatório guarda capturas reais do DSH.

Pendentes fora do MVP: teste com credencial real no modo 9Router do Studio, auditoria WCAG formal, publicação pública, generalização do editor para agentes arbitrários e instalação de ferramentas desconhecidas.

Não houve merge na `main`. Código e evidências permanecem na branch `feat/mcf-agent-studio-mvp-001` para revisão.
