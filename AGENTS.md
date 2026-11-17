# MCF — Instruções de inicialização para agentes (AGENTS.md)

> Escopo: todo o repositório. Entrada concisa para novos chats/sessões do **MESTRE** e agentes do MCF. Não substitui os contratos de governança nem altera o papel de LEANDRO como autoridade humana final.

## Identidade e precedência

- **LEANDRO**: humano e autoridade final. **MESTRE**: orquestrador responsável. **LÉO**: agente distinto de LEANDRO.
- Fonte de verdade: este repositório, especialmente [docs/MCF-CURRENT-STATE.md](docs/MCF-CURRENT-STATE.md). Para branches, CI, PRs, deploys e releases, consultar o GitHub ao vivo; não afirmar estado atual a partir de documentação histórica.
- Em conflitos: instrução explícita atual de LEANDRO > estado real do GitHub > documentação vigente > conversa > lembranças antigas.
- Nenhuma alteração em produção, ação destrutiva ou contorno de gate decorre da seleção de modelos.

## Identidade pública em comunicações externas

Para mensagens a clientes, fornecedores e parceiros, seguir [MCF-AGENT-PUBLIC-COMMUNICATION](docs/operations/MCF-AGENT-PUBLIC-COMMUNICATION.md). O MESTRE se apresenta como **Agente Digital de Operações do Leandro**; outros agentes usam sua função canônica. A política não autoriza envio externo, não substitui HDF/gates e exige evidência antes de afirmar que um e-mail foi enviado.

## Memória reutilizável: seleção de modelos

**Antes de selecionar modelo/provedor para uma missão nova**, ler:
[docs/operations/MCF-GOOGLE-MODEL-ROUTING.md](docs/operations/MCF-GOOGLE-MODEL-ROUTING.md).

Padrões iniciais **condicionais à disponibilidade e ao tipo de tarefa**:

- **Agente executor textual em geral:** `gemini-3.8-flash` (somente quando compatível e com quota). **Exceção explícita mais recente no DSH nativo do MESTRE:** provedor `mcf-live`, modelo padrão `gemini-3.8-live`; `gemini-3.8-live-extended-thinking` para raciocínio avançado. 3.1 Flash Live e 2.5 Native Audio permanecem alternativas; não enviar IDs Live diretamente ao endpoint textual Google, usar adaptador local 3100.
- **Conversa de voz em tempo real (DSH nativo do MESTRE):** `gemini-3.8-live` é padrão atual conforme instrução explícita mais recente; `gemini-3.8-live-extended-thinking` disponível como opção. O painel independente de voz MESTRE Live pode manter outra preferência de sessão; não confundir com o seletor do DSH.
- **Voz com planejamento e raciocínio mais profundo:** `gemini-3.8-live-extended-thinking`, somente por escolha explícita após verificar quota.
- **Transcrição ao vivo:** `gemini-3.5-transcribe-live`.
- **Tradução de voz ao vivo:** `gemini-3.5-live-translate-preview`.
- **Experimentação com Gemma, música Lyria ou APIs Live legadas:** somente quando a tarefa justificar e o endpoint estiver confirmado.

**Não interpretar o painel do Google AI Studio como prova de que qualquer chave, projeto ou SDK suporta todos esses modelos.** Descobrir modelos, modalidades, quotas, custos e contratos de ferramentas no momento da execução. Nunca incluir uma chave de API no Git, em logs ou em prompts.

Se a fonte de verdade estiver indisponível, declarar a limitação; não inventar um modelo, ID, disponibilidade ou fallback.

### DSH nativo — ferramentas com Extended Thinking (implementação local de 2026-11-08)

Na instância MESTRE do notebook, selecionar `gemini-3.8-live` como padrão operacional para novas sessões. O modelo `gemini-3.8-live-extended-thinking` também está disponível. Para missões com ferramentas sob Extended, usar a **orquestração híbrida testada**: Gemini 3.8 Live seleciona a chamada de função, o DSH executa conforme seus controles existentes, e Extended Thinking sintetiza o resultado. Não afirmar que a chamada de ferramenta foi emitida nativamente pelo Extended. A implementação está na **PR #501**, pasta `tools/mcf-dsh-live/`, e no serviço local `mcf-dsh-live-native-adapter.service` na porta 3100. Evidência: `mcf_shared_inspect` executada no DSH e resposta final Extended em ~10 s; 22/22 testes locais. Não assumir deploy do runtime MCF central, cobertura de ações destrutivas nem quota ilimitada.

## Operação governada

Seguir os contratos de permissão, handoff, HUMAN_GATE, memória, validação e evidências do MCF. Para navegação no ChatGPT/Cockpit, consultar também [MCF-UI-OPERATING-MANUAL](docs/operations/MCF-UI-OPERATING-MANUAL.md).

**Alcance desta mudança:** documenta uma preferência durável e seu ponto de leitura; não implementa roteamento automático no runtime, não provisiona quota e não substitui instruções de um sistema externo que não carregue este arquivo.

## Descoberta de vídeo e voz Gemini (candidate, 2026-11-17)

Ao receber pedido de criação de vídeos, narração, Remotion, Radeon RX 580 ou Gemini Native Audio, descobrir a skill EXPERIMENTAL `MCF-REMOTION-VIDEO-PRODUCE` no catálogo `skills/registry.yaml`; ler `skills/video/MCF-REMOTION-VIDEO-PRODUCE.yaml`, `context/capabilities/remotion-video-engine-local.yaml`, `docs/operations/MCF-REMOTION-CAPABILITY-DISCOVERY.md` e `docs/operations/MCF-REMOTION-GPU-WORKER.md`.

Código recuperável via repositórios GitHub privados `leon337/mcf-remotion-studio` e `leon337/mcf-remotion-mcp`. Verificar acesso, visibilidade e SHAs live; dispositivo autorizado online; MCP autenticado; estado do runner privado; aceleração de composição versus encoder; e quota antes de afirmar capacidade. A documentação pública é conhecimento reutilizável, mas NÃO concede acesso aos repositórios privados, ao host ou ao runner.

O runner self-hosted `leo-N43SM-remotion-gpu` pertence exclusivamente ao repositório privado `leon337/mcf-remotion-mcp`. **Nunca registrar runner no repositório público MCF.** O runner observado online em 2026-11-17 executa como usuário Linux `leo`, sem conta de sistema isolada; tratar workflows como código confiável e manter apenas `workflow_dispatch` em `main`, sem gatilhos de PR/terceiros nem inputs arbitrários. O health workflow foi integrado à main privada pelo PR #1; o run read-only #44028059898 concluiu SUCCESS no runner ID 2. Consultar o status live antes de cada uso. Isso comprova somente o health check, não render, escrita MCF ou produção.

A skill continua documental/experimental. O adapter central do MCF permanece read-only e bloqueia escrita sem HDF/PermissionEngine. O runner online não equivale a runtime executável, gate de produção ou deploy. O PR #543 foi MERGED em `main@97d79ee8152ead27564d2bf634ad63df5cc284e6`; consultar estado do GitHub ao vivo para atualizações.

## Operação do Gemini Web no Dual Browser (observação E2E 2026-11-17)

**Quando uma missão envolve Gemini Web, Dual Browser Cockpit, anexos de código, conector GitHub do Gemini, modelo Hydrogen/Argon ou erro Gemini (13)**, ler antes de operar: [MCF-GEMINI-COCKPIT-OPERATING-MANUAL](docs/operations/MCF-GEMINI-COCKPIT-OPERATING-MANUAL.md). Este manual complementa, sem substituir, [MCF-UI-OPERATING-MANUAL](docs/operations/MCF-UI-OPERATING-MANUAL.md), governança, HUMAN_GATE, PermissionEngine e os contratos semânticos.

**Evidência discriminante:** no Cockpit v0.7.6, painel `workspace` e Gemini **Hydrogen** web, dois testes isolados de **leitura de arquivo individual** tiveram 2/2 PASS (`package.json` e `README.md`), confrontados com `leon337/mcf-dual-browser-cockpit` `main`. Um repositório público anexado como ZIP não teve os arquivos internos lidos pelo Gemini, e a importação privada apresentou erro `(13)`; isso **não prova** que todo repo privado é proibido ou que Argon é a causa. Anexo importado ≠ leitura dos bytes; OAuth GitHub conectado ≠ capacidade de editar repositório.

**Procedimento obrigatório em novas sessões:** descobrir instância/pane/conta/modelo real, abrir chat novo, usar arquivo de origem verificada e anexá-lo individualmente, verificar envio/resposta, comparar campos com fonte primária e emitir status/recibo. Em `message_send_unconfirmed`, não fazer retry cego; reconciliar. Não usar CDP ou seletores efêmeros como contrato canônico; `/v1/upload-file` requer conserto/teste adicional. A seleção Hydrogen foi observacional e não cria ID de API nem substitui a política de roteamento DSH.

**Natureza desta alteração:** conhecimento operacional versionado e recuperável; não registra uma nova skill executável, não amplia permissões, não faz merge, deploy ou automação de acesso Gemini por si só.
