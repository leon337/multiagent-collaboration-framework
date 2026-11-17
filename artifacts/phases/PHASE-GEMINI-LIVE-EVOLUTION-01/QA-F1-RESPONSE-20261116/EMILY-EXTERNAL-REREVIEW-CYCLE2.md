# Segunda auditoria externa com contrato EMILY

Revisão iniciada no SHA 2344cdf02f228b9982219228718d0beeff874417, checkout mudou durante a revisão para 8cffb50f00175443d7954b039d908b26a6f26650 (somente manifestos mudaram). Não equivale a uma auditoria imutável do código posterior.
Executor: CODEX_CLI_EXTERNAL_EMILY_PROFILE. Agent Session nativa: FALSE.
Thread: 01a1e72e-a404-79f3-8531-dd8fc57b9d2a. Decisão: RETURN_FOR_CORRECTION, anterior às novas correções.

---

**Parecer técnico independente: RETURN_FOR_CORRECTION.**

Missão `MCF-GEMINI-LIVE-EVOLUTION-20261116-001`. Revisão externa read-only sob os contratos EMILY e protocolo unificado; não constitui Agent Session autenticada nem aprovação do gate LÉO. GitHub/PR não foram consultados, conforme proibição de rede.

Persistem os seguintes achados **MÉDIOS**:

1. **Terminal antigo ainda pode cancelar o watchdog novo.** Reproduzi em Node/VM: texto A → PCM válido → `generationComplete` → avanço de 601 ms → texto B → `turnComplete` de A. B estava pendente e foi encerrado como silencioso. A liberação em [app.js:219](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:219), combinada com o intervalo de [app.js:487](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:487), permite a sequência; [app.js:224](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:224) limpa B. O intervalo de 500 ms não garante reconciliação. É reprodução com eventos injetados, não ocorrência observada no provedor real.

2. **VAD manual pode enviar um turno sem monitorá-lo.** Com `voiceResponseSeen=true` da resposta anterior, dois frames de fala seguidos de silêncio emitiram `activityStart` e `activityEnd`, mas nenhum watchdog. O VAD começa com dois frames em [app.js:375](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:375); a flag só é reiniciada após três em [app.js:342](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:342). Assim, a chamada de [app.js:389](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:389) é rejeitada pela flag antiga.

3. **Interrupção pode marcar a nova fala como respondida.** Reproduzi: quatro frames de fala → `interrupted` → silêncio local. Nenhum monitor foi armado, pois [app.js:210](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:210) define `voiceResponseSeen=true`; o fim de fala consulta essa flag em [app.js:352](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:352). Interrupção da geração anterior não comprova resposta à fala que a interrompeu.

4. **A serialização tem caminhos sem proteção.** A sonda confirmou envio de texto com `micStarting=true`: [app.js:484](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:484) verifica apenas `micStream`, que só é preenchido após a inicialização assíncrona. Por inspeção, o envio de imagem em [app.js:497](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:497) também envia um novo `clientContent` sem verificar mic, geração pendente ou playback e sem armar watchdog. O caminho de imagem não foi executado.

A remediação deve manter o turno protegido até sua conclusão reconciliada, separar interrupção anterior de resposta à nova fala e aplicar a mesma proteção a todos os emissores de turnos. Essas sequências precisam de regressões específicas.

**Correções confirmadas:** as sondas passaram para resposta precoce seguida de silêncio, rejeição de WAV/PCM ímpar e ocultação da recuperação após PCM válido. A recuperação explícita chama `disconnect()` e exige nova sessão/pergunta, conforme [app.js:498](/tmp/mcf-f1-response-gate/apps/gemini-live-studio/public/app.js:498).

**Validação e rastreabilidade**

- Reexecutei o comando solicitado de testes: saída zero. A execução detalhada com `--test-isolation=none --test-reporter=tap` confirmou **23/23 PASS**.
- `sha256sum -c` confirmou **31/31 fontes e 52/52 artefatos no checkout**.
- Inspecionei os registros **13/13 mock** e **17/17 Gemini real**, conferindo seus hashes de fontes e, para o E2E real, o hash do harness. **Não reexecutei esses ensaios.** A cobertura não resolve as sequências acima.
- O registro físico confirma **1493 frames e zero drops**. Apenas o Worklet coincide com a fonte final; o app diverge. O RMS máximo `0,016582` ficou abaixo do limiar `0,027`, portanto não qualifica o detector final.

**Há uma ressalva material de integridade do SHA.** O HEAD começou em `2344cdf02f228b9982219228718d0beeff874417`, com workflow modificado, e mudou externamente durante a revisão para `8cffb50f00175443d7954b039d908b26a6f26650`, com status limpo. Não executei escrita. Entre os commits, somente os dois manifests mudaram; código e testes revisados são idênticos. A conferência direta dos objetos Git mostrou que o manifest de `2344cdf` declara para o workflow hash `0c9723…`, mas o arquivo comprometido tem `2ec9db…`. Portanto, o PASS dos manifests do checkout não comprova integridade integral do SHA originalmente solicitado.

**F1.5/F0.8 continuam abertas:** 30 amostras físicas de fim de voz→som audível, QA acústica de eco/barge-in, rotação da chave adiada por LEANDRO e segurança Classe C. Este parecer não encerra F1 nem concede automaticamente o gate de implementação F2.

Nenhum arquivo foi alterado por esta execução; nenhuma ação ficou em segundo plano. **Parecer ENTREGUE.**
