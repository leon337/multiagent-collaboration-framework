# F0 — Smoke reforçado e vínculo de execução

**Teste local:** `f0/baseline-strong.cjs` com Chrome headless + dispositivos sintéticos, API Gemini Live real e função `get_current_time`. Executado novamente após inserir hashes dos cinco arquivos de origem e do próprio script no resultado.

**Resultado:** `13/13 PASS`, `0 FAIL`. [Resultado sanitizado](repro/f0/BASELINE-STRONG.json), [script](repro/f0/baseline-strong.cjs), [manifesto da reprodução](repro/REPRO-MANIFEST.json).

**Asserções mais fortes que no primeiro smoke:** 18 frames PCM de entrada (49.140 bytes), um JPEG da câmera virtual, um JPEG da tela simulada, uma imagem PNG sintética convertida e enviada, chamada e resposta nominativa `get_current_time`, 99 blocos PCM de saída (234.240 bytes), transcrição e turno concluído, três tracks com `readyState=ended`, e handshakes Live 2.5/3.8/Extended. Sem erro JS.

**Escopo:** não houve captura de microfone ou câmera pessoais nem gravação da tela real. Esta evidência **não valida a qualidade dos dispositivos físicos, interrupções barge-in nem sessões longas**. Autorização/escopo físico segue pendente.

**Integridade:** cinco hashes de fonte e um do script constam no próprio JSON gerado durante a execução; foram comparados com arquivos publicados (6/6). O manifesto abrange a cópia sanitarizada atual e não equivale a prova criptográfica independente da API.

**Governança:** PR em draft, sem autorização para merge, produção ou encerramento formal de F0. Recomendação externa anterior de `RETORNAR_PARA_CORRECAO` não é revogada por este adendo; re-revisão do novo SHA necessária.
