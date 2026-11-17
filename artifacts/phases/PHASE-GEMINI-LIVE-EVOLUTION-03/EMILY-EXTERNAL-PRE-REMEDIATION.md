# Parecer externo EMILY antes das correções

SHA d56d701e54bd26f460b6a76117a8e3863af74ee1. Veredito RETURN_FOR_CORRECTION. Codex CLI externo, não Agent Session nativa.

**Veredito técnico: RETURN_FOR_CORRECTION**, inclusive para qualificação do piloto local, pelas corridas de cancelamento abaixo.

SHA auditado: `d56d701e54bd26f460b6a76117a8e3863af74ee1`, detached, worktree limpo antes e depois. Missão `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`; Issue #527 e PR #540 são referências fornecidas, sem consulta ao GitHub. Identificador desta thread indisponível.

Auditoria externa em perfil EMILY, somente leitura. Este parecer não constitui gate LÉO, HUMAN_GATE/HDF ou autorização de produção.

1. **HIGH — Encerramento permite execução posterior à revogação da sessão.**
   `close()` fecha apenas `this.client`, sem cancelar ou aguardar `this.starting`. Se `/end` ocorrer durante `client.connect()`, a inicialização ainda publica o cliente e `decide()` prossegue com `callTool()`. Referências: [inicialização](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:137), [execução](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:198), [encerramento](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:236).
   **Reproduzido offline com cliente simulado:** `endSession()` retornou `true`; depois, a navegação retornou `SUCCESS`, com `calls=1`, `closed=0`, `session=null` e `ready=true`. Corrigir com invalidação da geração no backend, verificações após cada espera e descarte do cliente que terminar de conectar após cancelamento.

2. **HIGH — Cancelamento do Gemini não interrompe ações; lotes antigos continuam após reconexão.**
   `toolCallCancellation` apenas registra uma mensagem. `handleTools()` verifica `connectionGeneration` somente antes de enviar a resposta, depois de executar todo o lote. O fechamento do WebSocket também não encerra o gateway. Referências: [cancelamento](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/public/app.js:222), [lote](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/public/app.js:246), [WebSocket](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/public/app.js:140).
   **Reproduzido em VM, sem browser:** alterada a geração enquanto a primeira ferramenta aguardava, a segunda ainda executou; nenhuma `toolResponse` foi enviada. É necessário cancelar por ID, invalidar aprovações e verificar geração antes de cada ação. Uma operação já despachada deve receber estado indeterminado até reconciliação.

3. **MEDIUM no piloto; HIGH se usado como HUMAN_GATE — Aprovação HTTP não autentica o humano.**
   `Origin`, `X-MCF-UI-Intent`, `sessionId` escolhido pelo chamador e `allow:true` permitem que um processo local prepare e aprove sua própria ação. O teste HTTP existente utiliza exatamente esse mecanismo. Referências: [rotas](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/server.js:58), [sessão e decisão](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:168), [cliente HTTP de teste](/tmp/mcf-gemini-playwright-f3-audit/tests/gemini-live-f3/http-real-interaction.test.cjs:6).
   Isso não demonstra ataque remoto por uma página comum: há controles contra origem cruzada. Demonstra ausência de identidade e de prova humana contra chamadores locais. Manter essa limitação explícita e integrar autorização autenticada antes de ampliar o uso.

4. **MEDIUM no piloto; HIGH para expansão — Restrição de URL não constitui isolamento de rede.**
   O gateway valida a URL solicitada e verifica a origem observada depois da navegação. Isso não impede uma requisição intermediária a serviço privado, redirect ou resolução DNS inesperada. Referências: [validação](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:50), [flags MCP](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:147), [checagem posterior](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:208).
   A documentação instalada do MCP confirma que `--allowed-origins` não é fronteira de segurança e não afeta redirects. Não executei exploração de rede. A lista curta reduz a exposição atual; expansão exige controle efetivo de egress.

5. **MEDIUM — “Escrita somente TodoMVC” e bloqueio de campos sensíveis são mais amplos/fracos que o anunciado.**
   Clique e digitação são autorizados por **origem inteira**, `https://demo.playwright.dev`, sem restringir o caminho TodoMVC ou verificar a página atual imediatamente antes da ação. O bloqueio de campos sensíveis examina `target` e `element` fornecidos pelo chamador; não inspeciona o campo real. Referências: [origem autorizada](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:119), [política de interação](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:175), [argumentos](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:81).
   Os schemas documentados do MCP aceitam seletores em `target`, além de refs. Restringir a página de laboratório e validar o elemento efetivo; a descrição produzida pelo modelo não comprova que um campo é seguro.

6. **MEDIUM — TTL não libera solicitações abandonadas; falta reconciliação idempotente.**
   A expiração só é processada em `decide()`. Uma aprovação abandonada continua bloqueando novos `prepare()` após 45 segundos. **Reproduzido com relógio simulado:** aos 50 segundos, nova preparação recebeu `409`, com uma solicitação ainda pendente. Referências: [bloqueio](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:171), [expiração](/tmp/mcf-gemini-playwright-f3-audit/apps/gemini-live-studio/mcp-playwright-gateway.cjs:189).
   O consumo único do `requestId` e o retorno `UNKNOWN` são controles úteis, mas não há consulta de resultado por chave idempotente nem deduplicação de nova solicitação equivalente. Implementar expiração independente e reconciliação antes de escrita além do laboratório.

7. **MEDIUM — O E2E Gemini permite falso positivo sobre uso do resultado.**
   O critério aceita qualquer mensagem contendo `/Example|Domain/i`; mencionar `https://example.com` no anúncio da intenção já satisfaz essa condição. Também não exige receipt `SUCCESS` vinculado à navegação. Referência: [asserção](/tmp/mcf-gemini-playwright-f3-audit/tests/gemini-live-f3/real-gemini-live-tool-e2e.cjs:64).
   O resumo preservado contém planejamento com a URL, insuficiente para demonstrar que o modelo respondeu corretamente ao título. Exigir resultado bem-sucedido correlacionado e uma resposta posterior verificável. A evidência continua limitada a uma chamada `playwright_navigate`, sem cadeia autônoma com snapshot.

8. **MEDIUM — A dispensa de integridade F2 depende apenas da existência de um arquivo.**
   O workflow F2 deixa de conferir seu manifesto de fontes quando encontra o manifesto F3. Entretanto, o workflow F3 não é disparado por alterações exclusivamente no workflow ou nos testes F2, e seu manifesto não cobre todas as fontes F2. Referências: [condicional F2](/tmp/mcf-gemini-playwright-f3-audit/.github/workflows/mcf-gemini-live-f2.yml:34), [filtros F3](/tmp/mcf-gemini-playwright-f3-audit/.github/workflows/mcf-gemini-live-f3.yml:3).
   Preservar F2 como histórico é correto; a substituição precisa garantir validação obrigatória e cobertura explícita das fontes atuais.

**Evidências executadas nesta auditoria:**

- `git rev-parse HEAD`, `git status --short` e verificação detached: SHA confirmado, nenhuma alteração.
- `sha256sum -c` dos dois manifestos Phase03: **16/16 fontes e 9/9 artefatos OK**. Isso confirma integridade, não a veracidade das afirmações.
- `node --test tests/gemini-live-f3/mcp-playwright-gateway.test.cjs`: falhou neste sandbox. Com `--test-isolation=none`: **9 passes, 4 falhas**; causa confirmada: `EROFS` em `mkdtemp`.
- Mesma suíte com somente as operações de diretório temporário substituídas por dublês em memória: **13/13 passes**. Esse resultado é simulado e não substitui a execução original.
- Probes em memória reproduziram os achados 1, 2 e 6.
- `node --check` dos quatro arquivos principais: aprovado.
- Lockfile v3: dependências diretas fixas; 98 entradas com integridade, URLs do registro npm e nenhum `hasInstallScript`. Playwright transitivo fixado em versão alpha.
- `npm audit --offline --omit=dev --audit-level=high --logs-max=0 --json`: retornou zero vulnerabilidades; **não comprova atualização dos advisories**.

Os resultados históricos de Chrome, HTTP/MCP real, Gemini real e regressão 106/106 foram apenas inspecionados nos artefatos. Não executei browser, API, rede, instalação ou leitura de credenciais.

O escopo permanece **laboratório local isolado**, dados sintéticos e sem sites autenticados. Há controles reais úteis — loopback, aliases limitados, argumentos filtrados, aprovação individual e receipts sem texto digitado —, mas falta corrigir o cancelamento antes de qualificar esse piloto. O gate F3 normativo permanece pendente: READ_ONLY canônico, HDF/HUMAN_GATE, idempotência e egress efetivo ainda não estão demonstrados.