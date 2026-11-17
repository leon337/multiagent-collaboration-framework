# Pre-remediation voice audit

External Codex profile, independent READ ONLY, reviewed prior SHA 7e38d7b41d72c93ee4a3318069958666e3c36a66. RETURN_FOR_CORRECTION; fixes below are subsequent and not represented as approved. No native MCF gate.

**Veredito: RETURN_FOR_CORRECTION**, inclusive para qualificar o piloto local com aprovação por voz. Há um caminho de exposição do código ao próprio modelo e falhas de exclusividade do microfone.

Auditoria externa em perfil EMILY, somente leitura, no SHA detached `7e38d7b41d72c93ee4a3318069958666e3c36a66`. Issue #527 e PR #540 são referências fornecidas; não consultei seu estado no GitHub. Este parecer não constitui sessão nativa MCF, gate LÉO, HUMAN_GATE/HDF ou autorização de merge/release.

1. **HIGH — Compartilhamento de tela pode permitir autoaprovação pelo modelo.**

   O desafio aparece no diálogo em [playwright-tools.js:47](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/public/playwright-tools.js:47), mas a aprovação pausa apenas o microfone e limpa o áudio já recebido. O compartilhamento visual continua: [app.js:507](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/public/app.js:507) captura e envia frames ao Gemini sem verificar se há aprovação pendente.

   Se a região compartilhada contiver o diálogo, o modelo poderá receber o código. Simultaneamente, [app.js:237](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/public/app.js:237) continua encaminhando novos blocos de áudio para reprodução. Assim, existe um caminho para o modelo conhecer o desafio e pronunciar a frase durante a escuta Web Speech.

   **Constatação estática; não executei exploração acústica.** Omitir o código do TTS e do prompt textual não fecha esse caminho. Antes de mostrar o desafio, suspender envio visual e reprodução de áudio do modelo durante toda a aprovação, com restauração vinculada à sessão correta.

2. **MEDIUM — A pausa do microfone não cobre inicialização pendente; a retomada não está vinculada à sessão original.**

   [playwright-tools.js:50](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/public/playwright-tools.js:50) considera somente `state.micStream`. Se `startMic()` estiver aguardando `getUserMedia()` ou o AudioWorklet, `hadGeminiMic` será falso e `stopMic()` não será chamado. A inicialização poderá concluir durante a escuta da autorização; veja [app.js:439](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/public/app.js:439).

   Além disso, o timer de retomada em [playwright-tools.js:74](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/public/playwright-tools.js:74) testa apenas a existência de alguma sessão conectada. Não compara sessão, geração ou intenção atual do usuário.

   Implementar um bloqueio explícito de captura durante a aprovação, invalidar inicializações pendentes e condicionar a retomada à mesma sessão e intenção de microfone. O efeito atual pode ser transmissão simultânea da autorização ao Gemini ou reativação indevida após troca rápida de sessão.

3. **MEDIUM — Hosts reservados com ponto final escapam da validação lexical.**

   [mcp-playwright-gateway.cjs:30](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/mcp-playwright-gateway.cjs:30) não remove o ponto terminal do hostname antes de comparar nomes e sufixos. Pela lógica atual, `https://localhost./` e `https://servico.internal./` passam pelas verificações destinadas a bloquear esses nomes.

   Isso identifica um desvio da política de URL; **não demonstra conexão bem-sucedida**, que depende de DNS/TLS. Canonicalizar o hostname antes da classificação e cobrir essas variantes nos testes.

   Permanece também a limitação arquitetural: não há controle de resolução DNS, subrecursos ou redirects intermediários. A checagem posterior em [mcp-playwright-gateway.cjs:254](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/mcp-playwright-gateway.cjs:254) pode impedir retorno do conteúdo, mas ocorre depois do tráfego. A aprovação humana do destino não transforma isso em isolamento de rede.

4. **MEDIUM — A substituição dos manifestos históricos ainda deixa fontes sem cobertura.**

   O workflow F2 agora efetivamente valida o manifesto F3, corrigindo a antiga dispensa por mera existência: [mcf-gemini-live-f2.yml:40](/tmp/mcf-f3-voice-independent-review/.github/workflows/mcf-gemini-live-f2.yml:40). Os filtros F3 também foram ampliados.

   Contudo, o [manifesto atual](/tmp/mcf-f3-voice-independent-review/artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-03/PHASE-03-SOURCE-MANIFEST.sha256:1) não cobre, por exemplo, `media-policy.js`, `vision-adapter.cjs`, `capability-router.cjs`, `vision-ui.js` e testes F1/F2, embora substitua a conferência das fontes anteriores. Portanto, não sustenta a alegação de cobertura completa. Completar a cobertura ou preservar verificações específicas desses arquivos.

   As expressões estáticas de credenciais são controles parciais: não comprovam ausência de senhas ou de outros formatos de segredo. Hashes válidos comprovam correspondência dos arquivos listados, sem provar a veracidade das evidências.

As correções anteriores são relevantes: o backend verifica época após inicialização e antes/depois da chamada; o frontend invalida lotes no cancelamento/desconexão; novas preparações removem aprovações expiradas; clique/digitação exigem caminho TodoMVC, referência e snapshot de preflight. Essas correções são coerentes por inspeção, mas os testes de inicialização não ficaram verdes neste ambiente.

A ausência de autenticação humana continua sendo uma **reserva MEDIUM no piloto local**, independente dos bloqueantes acima. [server.js:58](/tmp/mcf-f3-voice-independent-review/apps/gemini-live-studio/server.js:58) exige origem local, JSON e header específico, mas um processo local pode reproduzi-los e enviar `allow:true`. Isso não demonstra ataque remoto por uma página comum nem exposição à Internet. Web Speech também não prova identidade, biometria ou presença humana e pode transmitir áudio ao serviço do navegador; a interface informa essas limitações.

**Validação efetivamente executada:**

- SHA e estado detached confirmados; worktree limpo antes/depois. `.private` ausente na raiz e na aplicação.
- Ambos os manifestos Phase03: **21/21 fontes e 13/13 artefatos OK**.
- `node --check`: aprovado nos cinco arquivos JS de implementação e nos três testes solicitados de voz/site público.
- Comando `node --test` solicitado: suíte de voz passou; suíte do gateway falhou.
- Reexecução diagnóstica com `--test-isolation=none`: **16 passes, 9 falhas**, incluindo **6/6 testes de voz aprovados**. As falhas atingem caminhos de inicialização que criam diretório temporário neste sandbox somente leitura; a saída não expôs a causa interna de cada `UNKNOWN`. Não contabilizo esses caminhos como aprovados nem como nove regressões comprovadas.

Os resultados preservados de **7/7 Chrome** usam ASR/TTS e respostas HTTP simulados. Python.org registra MCP real, porém com `allow:true` fornecido pelo harness — **não voz humana**. O Gemini Live real pertence a fontes históricas diferentes; o harness atual exige entrega com receipt, mas o artefato histórico não comprova resposta correta posterior sobre o título.

Não executei browser, rede, API, instalação, acesso a credenciais ou QA de microfone físico.

**A mitigação atual não basta para qualificar a combinação multimodal de voz no piloto local.** Corrigidos os achados de isolamento da aprovação e canonicalização, um piloto local restrito poderá ser reavaliado com reservas explícitas de autenticação, replay/ASR e egress. A ampliação para HTTPS arbitrário continua bloqueante para produção sem esses controles e a governança aplicável.
