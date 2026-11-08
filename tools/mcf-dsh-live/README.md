# MCF — Adaptador nativo do DSH para Gemini Live

**Estado:** snapshot da implementação local testada em 2026-11-08; proposta em PR, **sem deploy no runtime MCF central**.

## Problema e decisão

O DeepSeek Harness usa Chat Completions para chat e ferramentas; `gemini-3.8-live-extended-thinking` usa o protocolo Google Live com ferramentas assíncronas `NON_BLOCKING`, falas intermediárias e encerramento de interação em `IDLE`. Na instância local, o modelo Extended respondia a conversas simples, mas em tarefas com ferramentas ficava em `IN_PROGRESS` e excedia o timeout sem chamar uma função.

O **roteador híbrido** implementado em `app/extended-tool-router.mjs` mantém Extended Thinking para raciocínio e elaboração da resposta. Nas mensagens com ferramentas declaradas, `gemini-3.8-live` pode atuar como planejador: seleciona uma função permitida e devolve um `tool_call` compatível com o DSH. **Ele não executa a função**; cabe ao DSH executá-la sob os controles de permissão existentes. A resposta do resultado ao DSH retorna ao Extended Thinking para síntese. Não é chamada de função nativa feita pelo Extended: a delegação é explícita em `mcf_execution_mode`, no cabeçalho `X-MCF-Tool-Planning-Model` e no log `extended_tool_planner`.

## Proteções

- Usa exclusivamente os nomes de funções declarados pela solicitação DSH; descarta funções desconhecidas e chamadas duplicadas já concluídas no histórico.
- O resultado da ferramenta é dado não confiável, não uma nova instrução para o planejador.
- No máximo dois planejamentos concorrentes, timeout de 11 s, sem repetição automática de ações.
- Se não houver chamada, a resposta continua com Extended; o planejador não inventa execução.
- Falhas e latência são registradas com metadados, sem gravar prompts, áudio ou credenciais no SQLite.
- O adaptador HTTP local exige token Bearer e escuta apenas em `127.0.0.1:3100`. A API Google continua sujeita a cotas e erros 429.

## Evidências locais

- DSH real: Extended selecionou `mcf_shared_inspect`, o DSH executou a leitura e Extended produziu a resposta em ~10,4 s; relatório `extended_tool_planner` registrou decisão em ~1,5 s.
- DSH real: pergunta conceitual concluída sem invocar ferramentas (15 s após a otimização).
- 22/22 testes de regressão locais passaram, incluindo 7 verificações do roteador híbrido.
- DSH, gateway de voz e adaptador ativos nas portas 3098, 3099 e 3100.
- Riscos remanescentes: variação de latência e limites da API; falta teste de carga/sessões concorrentes, de ferramentas de escrita e de microfone físico. **Não declarar autonomia total desses fluxos.**

## Executar e adaptar

Os arquivos nesta proposta refletem a árvore da instância isolada: `app/dsh-native-adapter.mjs` carrega `app/observability.mjs` e `app/extended-tool-router.mjs`. Para validar o módulo: `npm ci` (após gerar um lockfile) ou `npm install`, e `npm test`. O adaptador resolve a raiz isolada a partir de `MCF_DSH_LIVE_ROOT`; na ausência, usa `~/.local/share/mcf-gemini38-agent` do usuário de execução. O diretório deve conter `secrets/gemini-api-key` e `secrets/bridge-internal-token` com permissão `0600`; os eventos SQLite ficam em `observability/`. **Não publicar segredos nem executar em outro computador sem provisionar os diretórios e revisar a unidade systemd.** Nunca adicionar os arquivos de `secrets/` ao Git.

Execução atualmente ativa e verificada está no notebook remoto em `/home/leo/.local/share/mcf-gemini38-agent/app`; não reiniciar nem substituir a instância a partir do checkout desta PR sem nova validação. Os cinco modelos de texto Google permanecem cadastrados no DSH, e a seleção padrão pode ser alterada pelo usuário.

Referências técnicas:
- https://ai.google.dev/gemini-api/docs/live-api/thinking
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/live-api/asynchronous-function-calling
