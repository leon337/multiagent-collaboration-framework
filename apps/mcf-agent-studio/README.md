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

## IA pela sessão do DeepSeek Harness — padrão (sem nova chave)

O Agent Studio agora utiliza uma **sessão de IA dedicada dentro do DSH** para interpretar as solicitações em linguagem natural. O modelo, a autenticação e o roteamento continuam administrados pelo próprio Harness. Não é necessário fornecer uma segunda chave.

- Plugin DSH: `dsh-session-bridge.mjs`, montado com `sessionController` no perfil Web.
- Preset: `mcf-studio-brain`, isolado dos agentes de trabalho.
- Ponte HTTP local: `127.0.0.1:4319`, acessível mediante token aleatório em `.data/dsh-bridge-token` (não versionado).
- Studio: `POST /api/propose` com `useAi:true` envia a instrução à sessão DSH; `GET /api/dsh/status` exibe a conexão.
- Interação: o checkbox **Usar IA pela sessão do DSH** já inicia marcado.
- Qualquer proposta continua exigindo revisão e aceite no rascunho antes de ser publicada.

**Teste fim a fim real:** `POST /api/propose` retornou proposta com `source=ai` e a resposta modificada solicitada, em ~1 s; verificado também no Brave via DOM, sem posições absolutas e sem exceções JS. O DSH continuou intacto até uma publicação explícita.

## 9Router opcional (edição por IA)

O Studio consulta modelos do 9Router local em `127.0.0.1:20128/v1/models` (129 IDs na auditoria realizada, sujeitos a mudança). No painel **Configurar conexão**, insira ID de modelo e sua própria chave para usar **Usar IA via 9Router**. A chave é mantida apenas na memória do processo; reiniciar o serviço apaga essa configuração. O modo guiado funciona sem chave. Para configurar, abra o painel **Configurar conexão**, selecione um dos IDs listados, informe a chave do 9Router no campo protegido e clique **Salvar e testar conexão**. O teste de autenticação chama o endpoint real de chat do 9Router; somente depois de receber resposta o indicador de conexão fica ativo. O botão não declara sucesso apenas por salvar a chave. **Não compartilhe a chave no chat do MCF, no GitHub nem em arquivos do projeto.** O serviço apaga a chave ao reiniciar.

**Limitação validada:** foi verificada a listagem de modelos, mas a geração sem credencial retornou HTTP 401. Não foi concluído um teste fim a fim de proposta gerada por LLM a partir do Studio. Isso não altera os ensaios do agente real no DSH, cujo modelo já estava configurado.

## Compatibilidade com respostas 9Router (JSON e streaming)

Alguns modelos 9Router devolvem Server-Sent Events (linhas iniciadas por `data:`) mesmo quando a requisição não marca `stream: true`. O backend agora interpreta tanto JSON OpenAI quanto chunks SSE e recompõe `choices[].delta.content`, rejeitando eventos inválidos com erro HTTP 502 legível, em vez do genérico "Erro interno".

Reprodução automatizada sem expor chaves: `tests/9router-sse.test.mjs` inicia um gateway HTTP local simulado que produz SSE em vários chunks. O teste chama `/api/provider/test` e `/api/propose` com chave de laboratório, confirma autenticação e extração da proposta IA, e garante que o rascunho não muda sem aprovação. `npm test` executa essa suíte juntamente com os testes de publicação e de reversão.

**Depois de reiniciar o serviço**, informe novamente a chave no painel de configuração, pois ela permanece somente em memória e não é persistida no disco. Esse teste com modelo real depende da credencial inserida pelo operador.

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

## Publicação verificada automaticamente

O botão **Publicar** não confirma apenas escrita de YAML: respeita a janela de estabilização da configuração HMR do DSH, abre uma **nova sessão real** do preset Hello World Agent, valida a resposta esperada nos modos fixo e eco, registra `runtimeVerified` e a identidade da sessão de teste. Se não conseguir comprovar a ativação, restaura automaticamente o backup e informa o erro; nunca declara sucesso prematuramente. Reverter também espera a estabilização do HMR. O selo **Verificado no DSH** só aparece quando existe registro persistido dessa confirmação.

A prévia conversacional isolada (`mcf-studio-preview`) utiliza a autenticação já existente no DSH e não publica alterações. A opção de 9Router direto é secundária e fica recolhida na interface.

## Testes e limites

`npm test` cobre proposta, salvar, restaurar, versão, publicação, negação de confirmação, proteção contra conflito de edição, backup, reversão e registro de ferramentas. Testes de navegador cobriram desktop, tablet e celular sem overflow horizontal. O relatório guarda capturas reais do DSH.

Pendentes fora do MVP: teste com credencial real no modo 9Router do Studio, auditoria WCAG formal, publicação pública, generalização do editor para agentes arbitrários e instalação de ferramentas desconhecidas.

Não houve merge na `main`. Código e evidências permanecem na branch `feat/mcf-agent-studio-mvp-001` para revisão.

## Chat de Testes — Laboratório do agente real

Acesse a aplicação web em http://127.0.0.1:4317/lab ou pelo atalho "MCF - Chat do Agente" na área de trabalho. A interface é separada do editor. Ela conversa por uma sessão DSH persistente do preset publicado Hello World Agent, sem precisar de chave adicional do 9Router.

O navegador chama somente o backend Studio (`/api/lab/status`, `/api/lab/message`, `/api/lab/reset`), que se comunica com `dsh-session-bridge-v3.mjs` no próprio DSH. O token privado da ponte nunca vai para a interface. ID da sessão e últimas 80 mensagens são persistidos no arquivo não versionado `.data/dsh-trainee-session.json` (0600). O histórico retorna ao recarregar a página e a sessão pode continuar depois do reinício do DSH.

Para testar uma alteração: edite e publique no Agent Studio; depois use **Novo chat** para carregar a nova versão no DSH. Rascunho não publicado não modifica o comportamento do agente testado. A interface foi verificada em 1440/768/390/320 px e em conversas reais. Testes automatizados: `npm test`, 7/7 aprovados na entrega.

A configuração de comportamento e ferramentas é um ajuste de preset, **não** fine-tuning de pesos do modelo. Relatório: `docs/missions/MCF-20261023-AGENT-LAB-LIVE-CHAT.md`.

## Acessar o Chat de Testes no celular (Tailscale)

- No notebook: http://127.0.0.1:4317/lab
- No celular Android conectado à mesma rede Tailscale: https://mcf-leo-n43sm.tail582305.ts.net:8492/lab
- Ative a VPN pelo aplicativo Tailscale no Android; realme-9i apareceu offline durante a auditoria.
- O proxy exclusivo do laboratório usa 127.0.0.1:4323 e mcf-agent-lab-mobile.service habilitado no Linux.
- O acesso remoto é privado da tailnet (não Funnel público). Editor, publicação, chaves, tokens e serviços internos NÃO estão liberados pelo endereço móvel.
- A API de escrita exige Origin HTTPS da tailnet; endpoints fora da lista são negados.
- Teste em nó Android real não foi possível enquanto o celular estava offline. Acesso local e testes automatizados foram validados.
- Para desativar apenas este compartilhamento no notebook: tailscale serve --https=8492 off

**Compatibilidade com navegador integrado no Android:** parâmetros de rastreamento adicionados ao URL, por exemplo `/lab?u=...` e `/lab?utm_source=...`, são ignorados pelo proxy somente em GETs permitidos. O acesso a APIs administrativas continua bloqueado e requisições POST não aceitam query string. Correção validada em 23/10/2026 após erro HTTP 400 apresentado pelo Android.

**Formatação das respostas do agente:** o chat suporta negrito, itálico, código inline e expressões matemáticas simples em LaTeX convertidas para texto matemático legível, sem usar `innerHTML` ou executar tags fornecidas pela LLM. O parser é intencionalmente limitado: não é um renderizador científico completo (KaTeX/MathJax). O histórico existente é reformatado ao atualizar a página, sem alterar dados armazenados no DSH.


## Agent Architect — Guided Builder

Abrir localmente em http://127.0.0.1:4317/builder.

Criação e evolução de agentes em seis etapas: objetivo, comportamento, ferramentas, workspace, testes e revisão. O orientador usa a sessão DSH autenticada, sem segunda chave API, e guarda as recomendações dentro do workspace. Cada projeto possui pasta privada em .data/agent-workspaces/agent-UUID, configuração agent.json, README.md e versões.

Criar agente novo gera apenas um rascunho; este MVP não instala novos presets arbitrários. Evoluir Hello World permite simular alterações e encaminhar uma proposta para revisão no editor principal, sem aplicar ou publicar automaticamente.

Demonstração persistida: http://127.0.0.1:4317/builder?workspace=agent-f99e2930-8c4d-47e2-a024-cf76d79ea7cc

O Builder não é disponibilizado pelo proxy remoto Tailscale, que continua limitado ao chat do Agent Lab. Evidências e relatório em docs/missions/MCF-20261023-AGENT-BUILDER-GUIDED-MVP.md. Nove testes automatizados e teste completo de navegador aprovados.

## Workspace nativo do DSH (correção de Ungrouped)

Além do workspace privado de dados por agente, o Agent Studio deve estar registrado no Workspace Registry do próprio DeepSeek Harness. A ponte dsh-session-bridge-v3.mjs permite a auditoria e o registro nativos por endpoints locais autenticados com o token do Bridge. Após o registro inicial, utiliza workspaceId em sessionController.create, para que as próximas sessões sejam associadas diretamente ao grupo MCF Agent Studio — Agentes. A alteração não edita diretamente headers de sessão ou a base persistente do Harness. Diagnóstico, evidências e escopo em docs/missions/MCF-20261023-DSH-NATIVE-WORKSPACE-CORRECTION.md.
