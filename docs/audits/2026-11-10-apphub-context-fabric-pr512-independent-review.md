# PR #512 — Auditoria independente e validação acelerada por GPU

**Data:** 2026-11-10 (horário America/Recife)
**Missão:** MCF-APPHUB-CONTEXT-FABRIC-READ-001 / Issue #511
**Repositório:** `leon337/multiagent-collaboration-framework`
**Baseline da revisão:** `origin/main@0bcea84`
**Código examinado:** árvore local do branch `feat/mcf-apphub-context-fabric-read-20261110`, derivada de `8ce1dc6`, **incluindo** a correção não commitada para token dedicado. O SHA final após o commit deve ser validado separadamente pelo CI.
**Autoridade:** LEANDRO. **Orquestrador:** MESTRE.
**Escopo:** leitura local do App Hub, sem efeitos de escrita no Google Cloud e sem deploy.

## Independência e parecer principal

- **Agente:** Codex CLI (sessão separada de auditoria, `--ignore-user-config --ephemeral -s read-only`, configuração MCP vazia, stdin encerrado); nenhuma edição realizada pelo revisor.
- **Escopo entregue:** diff Git da feature + alterações locais não commitadas, guard dedicado, controller, service, módulo NestJS e controles adjacentes.
- **Resultado declarado pelo revisor:** **PASS para a árvore local auditada**. Não identificou vulnerabilidades reais no escopo examinado.
- **Confirmações no parecer:** token exclusivo, rejeição de cabeçalhos repetidos, serviço fail-closed em produção, URL fixa sem redirects, invocação do Google SDK sem shell, limites de resposta e paginação.
- **Ressalva expressa do Codex:** o commit remoto antigo `8ce1dc6` não incluía a correção de token dedicado; o PASS só vale para a árvore corrigida. A auditoria foi **estática**, sem testes ou acesso ao Google Cloud pelo agente revisor.
- **Fonte local verificável da resposta:** `/tmp/mcf-pr512-codex-review-3.md` no notebook do executor, saída `CODEX_REVIEW_RC=0`.

O parecer de modelo independente não é assinatura criptográfica, nem revisão humana nem autorização para deploy. O resultado só se aplica aos arquivos e à versão delimitados acima.

## Revisão complementar por GPU física (realmente executada)

**Hardware observado:** AMD Radeon RX 580 2048SP, 8 GiB VRAM, driver Mesa RADV, backend Vulkan. A placa discreta foi enumerada por `vulkaninfo` e por `llama.cpp --list-devices` como `Vulkan0`.

**Ambiente isolado:** `llama.cpp b12248` (binário Vulkan do GitHub) e modelo `Qwen2.5-Coder-3B-Instruct-GGUF`, quantização `Q4_K_M` (aprox. 1,95 GiB), em `/home/leo/agent-sandbox/`. Não houve instalação de drivers, serviços globais ou alteração de provedores MCF.

| Prova | Resultado |
| --- | --- |
| `llama-cli --device Vulkan0 -ngl all` | Inferência real concluída |
| Revisão de auth/controller/módulo/abuse | Resposta `PASS`, porém sem fundamentação detalhada |
| Revisão de service/fetch/tests | Resposta `VEREDITO: PASS`, porém sem fundamentação detalhada |
| `llama-bench -dev Vulkan0 -ngl 99 -p 256 -n 128 -r 1` | `backend=Vulkan`, `dev=Vulkan0`, `ngl=99` |
| Taxa de processamento do prompt (`pp256`) | `396,74 tokens/s` |
| Taxa de geração (`tg128`) | `58,77 tokens/s` |

**Limitação:** o Qwen local de 3,4B parâmetros apenas respondeu PASS sem explicação. Ele NÃO é uma auditoria suficiente por si só, e seus resultados não substituem o Codex, testes, CI ou revisão humana. O benchmark demonstra uso do backend Vulkan na GPU física; não diz que o treinamento ou serviço Google Cloud utilizou a placa.

## Verificações independentes do executor

- ESLint: PASS.
- Vitest: **34/34 testes** unitários/de segurança/contrato PASS na árvore corrigida.
- TypeScript `tsc --noEmit`: PASS.
- Build TypeScript `tsc -p tsconfig.json`: PASS.
- E2E real opt-in, NestJS/Fastify loopback e Google App Hub: **1/1 PASS**. Inclui GET autorizado 200, sem token 401, query injetada 400, POST negado 404.
- `McfAppHubInventoryReadTokenGuard` é separado de `McfContextReadTokenGuard`; bloqueia repetição de cabeçalho, segredos reutilizados, entrada malformada e ausência de configuração.
- Inventário real observado no laboratório: 0 aplicações / 7 serviços (5 APIs + 2 MCP servers) / 0 workloads.
- Sem chaves, tokens de acesso, perfis de navegador ou credenciais nos commits e neste documento.

## Controle de saída

- O CI no **SHA final** precisa passar antes da mudança de status do PR.
- O MCF pode escolher exigências adicionais de governança/human gate para merge. Esta auditoria é informativa e documentada; **não autoriza merge ou deploy automaticamente**.
- O adaptador permanece desativado por padrão e explicitamente bloqueado em `NODE_ENV=production`. Nenhuma mudança no billing ou IAM Google foi realizada por esta etapa.
- Se novos diffs de código relevantes forem introduzidos após esta revisão, repetir auditoria dos trechos modificados e testes pertinentes.
