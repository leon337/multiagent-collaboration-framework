# Parecer externo pós-remediação no SHA anterior

SHA auditado 0f93855e23190aec0c7df0eec471657691a0ea42. PASS_WITH_RESERVATIONS para merge local em main, NOT_APPROVED para produção pública. Ajustes de sessão revogada, documentação e asserções E2E foram feitos APÓS este SHA.
Revisor Codex CLI externo com perfil EMILY; não é Agent Session nem gate formal LÉO.

**Parecer técnico: PASS_WITH_RESERVATIONS para merge em `main` com uso exclusivamente local. Produção pública: NOT_APPROVED.**

SHA revisado: `0f93855e23190aec0c7df0eec471657691a0ea42`, detached, comparado com `d56d701`. Perfil normativo [EMILY](/tmp/mcf-f3-navfix-independent-review/docs/agentes/EMILY.md), executado por Codex CLI externo. Este parecer não representa Agent Session nativa, gate LÉO ou HUMAN_GATE. PR #544 e Issue #527 são referências fornecidas; não consultei GitHub.

Os dois HIGH anteriores estão corrigidos no código inspecionado:

- **Inicialização/encerramento:** `startingClient`, invalidação por `epoch`, descarte do cliente obsoleto e verificações antes da execução e após seu retorno impedem navegação tardia e falso `SUCCESS`. Ver [gateway:137](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/mcp-playwright-gateway.cjs:137), linhas 137–175, 216–266 e 282–289.
- **Cancelamento/lotes:** `mcpEpoch` e `connectionGeneration` interrompem ferramentas restantes e respostas tardias; cancelamento, desconexão e fechamento do WebSocket encerram a sessão MCP. O diálogo pendente é resolvido e fechado. Ver [app.js:224](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/public/app.js:224), linhas 224–232 e 254–280; [playwright-tools.js:62](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/public/playwright-tools.js:62).

Permanecem os seguintes **MEDIUM**, com remediação necessária ou aceitação formal para o piloto:

1. **`prepare` atrasado pode recriar uma sessão já encerrada e bloquear a seguinte.** Reproduzi sem rede: `endSession(S1)` retorna `true`; um `prepare(S1)` atrasado ocupa o backend; `prepare(S2)` continua recebendo `409` após 50 segundos. A verificação de sessão ocorre antes da expiração. Referências: [gateway:177](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/mcp-playwright-gateway.cjs:177), linhas 177–188 e 275–278. **Correção:** revogar IDs encerrados ou exigir geração de sessão emitida pelo servidor; rejeitar preparações antigas e testar essa ordem de eventos.

2. **Política anunciada diverge da implementada.** O código aceita qualquer destino HTTPS validado após aprovação, sem allowlist; a UI ainda anuncia revisão de lista, e documentos/evidências afirmam “12 origens” e bloqueio de hosts desconhecidos. Referências: [gateway:120](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/mcp-playwright-gateway.cjs:120), [UI:105](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/public/playwright-tools.js:105), [remediação:18](/tmp/mcf-f3-navfix-independent-review/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-03/REMEDIATION-AUDIT-CYCLE1.md:18). **Correção:** alinhar UI, arquitetura, threat model e evidências à política efetiva, registrando a ampliação de escopo.

3. **E2E ainda permite aprovação com apenas navegação.** O artefato arquivado registra dois resultados `SUCCESS`, com URL/título, para `navigate` e `snapshot`. Entretanto, a expressão `report.pass` exige somente `navigate`; reproduzi seu retorno `true` sem snapshot. Referência: [E2E:62](/tmp/mcf-f3-navfix-independent-review/tests/gemini-live-f3/real-gemini-live-tool-e2e.cjs:62), linhas 62–85. **Correção:** aguardar e exigir ambas as ferramentas, resultados bem-sucedidos e correlação dos IDs. A instrumentação intercepta o envio; não comprova confirmação de recebimento pelo Google.

4. **Aprovação local não autentica o humano; egress continua sem isolamento efetivo.** Headers falsificáveis por processos locais não constituem HDF. Validação textual de URL e conferência posterior não bloqueiam DNS privado, redirects intermediários ou subrecursos. Referências: [server:58](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/server.js:58), [gateway:51](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/mcp-playwright-gateway.cjs:51) e linhas 147–157. **Correção antes de exposição pública:** identidade/autorização vinculadas ao runtime e controle de rede sobre todas as requisições do navegador.

5. **Preflight reduz, mas não elimina, corrida de clique/digitação.** Path TodoMVC, refs `eN`, URL real e correspondência sensível são verificados; a página pode mudar entre snapshot e ação. Referência: [gateway:229](/tmp/mcf-f3-navfix-independent-review/apps/gemini-live-studio/mcp-playwright-gateway.cjs:229), linhas 229–242. **Correção para ampliar escrita:** validar documento, destino e elemento no momento da execução, com reconciliação de efeitos indeterminados.

A expiração abandonada no próximo `prepare` foi implementada para a mesma sessão. F1/F2 agora executam a conferência do manifesto F3, e os filtros F3 cobrem alterações em testes F1/F2/F3, ops e workflows relacionados.

**Validação efetivamente executada:**

- `git rev-parse`, `status`, `symbolic-ref`, `remote -v`, `diff`, `log`, `ls-tree` e `merge-base`: SHA confirmado, checkout detached e limpo.
- `sha256sum -c PHASE-03-SOURCE-MANIFEST.sha256`: **50/50 OK**; manifesto de artefatos: **11/11 OK**. Hashes internos das duas evidências E2E também coincidem.
- `node --check` nos quatro arquivos principais e no E2E Gemini: aprovado.
- `node --test --test-isolation=none` nas quatro suítes F0/F1 inspecionadas: **64/64**, com dados sintéticos.
- Suíte F3 original: **não iniciou por `MODULE_NOT_FOUND` do SDK**, antes de alcançar eventual limitação `EROFS`.
- Harness Node em memória, com imports SDK e operações temporárias substituídos por dublês: **18/18 testes F3**. A primeira tentativa do harness apresentou problemas de contexto VM; corrigido o harness, passou. Isso não equivale a MCP real.
- Probes em memória confirmaram os achados 1 e 3.

Os **111/111**, **2/2 HTTP/MCP**, **1/1 TodoMVC**, **9/9 UI simulada** e **duas ferramentas Gemini reais** são evidências anteriores inspecionadas, não reexecutadas.

O servidor permanece em loopback. A chave usa arquivo local com permissões restritas, sem comprovação de cofre criptográfico; `.private` está ausente deste checkout. A aplicação está ausente da referência local armazenada de `origin/main`; isso não confirma o GitHub atual. Não identifiquei destino Vercel desta aplicação, e o rate limit informado de outro preview não demonstra aptidão para deploy.

A recomendação de merge limita-se à incorporação do piloto local, com registro e tratamento das ressalvas. **F0/F1/F2/F3 continuam com gates abertos.** O pedido de LEANDRO para merge/deploy não substitui esses gates. Nenhuma edição, autenticação, chamada Google, navegação, alteração GitHub ou implantação foi realizada.
