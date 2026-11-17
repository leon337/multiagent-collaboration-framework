# Auditoria EXTERNA Codex CLI — F2.2/F2.3 anterior à correção

Reviewed SHA: a1a51d54e215254632dcce7538bc8a34d504a44e
Executor: CODEX_CLI_EXTERNAL_EMILY_PROFILE, não Agent Session MCF nativa.
Thread: 01a1e778-9d6b-7c70-a7f5-c4068a554b29
Decisão emitida: RETURN_FOR_CORRECTION (um HIGH, quatro MEDIUM).
Esta revisão ocorreu ANTES das correções. Não a reinterpretar como PASS do SHA novo.

---

**Parecer técnico: RETURN_FOR_CORRECTION para F2.2/F2.3.** Revisão externa sob o perfil normativo EMILY, sem autoridade para aprovar gates ou produção.

HEAD conferido: `a1a51d54e215254632dcce7538bc8a34d504a44e`.

Achados, por prioridade:

- **HIGH — redirecionamentos escapam da allowlist.** [vision-adapter.cjs:39](/tmp/mcf-f2-vision-audit/apps/gemini-live-studio/vision-adapter.cjs:39), também no DELETE:85 e [capability-router.cjs:34](/tmp/mcf-f2-vision-audit/apps/gemini-live-studio/capability-router.cjs:34). A URL inicial é validada, mas `fetch` mantém redirecionamentos automáticos. Uma resposta 307/308 pode encaminhar mídia e o cabeçalho personalizado da chave para outro destino. Risco condicional à resposta upstream; nenhum vazamento real foi executado. **Correção mínima:** `redirect:'error'` em todas as chamadas ao provedor e teste negativo específico.

- **MEDIUM — limpeza remota incompleta e falha omitida.** [vision-adapter.cjs:64](/tmp/mcf-f2-vision-audit/apps/gemini-live-studio/vision-adapter.cjs:64), :121–126. Se o finalize falha ou retorna nome válido com URI inválida, `uploaded` permanece nulo e não há DELETE. Quando geração e DELETE falham, o erro devolvido omite a limpeza malsucedida. Confirmado com mocks offline. **Correção:** registrar o identificador assim que validado, limpar também após erro de metadados e devolver estado estruturado de exclusão; finalize ambíguo deve indicar retenção remota desconhecida.

- **MEDIUM — escolha de modelo não é explícita.** [vision-ui.js:35](/tmp/mcf-f2-vision-audit/apps/gemini-live-studio/public/vision-ui.js:35). O primeiro modelo compatível com a heurística é selecionado automaticamente. **Correção:** manter a opção vazia até escolha do usuário; ajustar o teste que atualmente depende dessa pré-seleção.

- **MEDIUM — corrida na atualização do catálogo libera controles durante análise.** [vision-ui.js:21](/tmp/mcf-f2-vision-audit/apps/gemini-live-studio/public/vision-ui.js:21), :39. Duas atualizações concorrentes permitem que a resposta tardia execute `setBusy(false)` durante um POST em andamento. Reproduzido em Node/VM, sem navegador. **Correção:** serializar atualizações, descartar respostas obsoletas e separar o estado de catálogo do estado de análise.

- **MEDIUM — resultado permanece entre sessões Live.** [vision-ui.js:106](/tmp/mcf-f2-vision-audit/apps/gemini-live-studio/public/vision-ui.js:106), :119 e [app.js:550](/tmp/mcf-f2-vision-audit/apps/gemini-live-studio/public/app.js:550). Encerrar/reabrir Live não limpa nem vincula `s.last` à sessão; uma resposta tardia também pode reaparecer depois do encerramento. Continua exigindo clique para compartilhar, mas falta isolamento de memória. **Correção:** definir vínculo de sessão, invalidar respostas antigas e limpar resultado/compartilhamento no encerramento.

Verificações favoráveis: limites de JSON e mídia, assinatura/MIME, consentimento antes da leitura/envio no fluxo normal, concorrência servidor limitada a uma análise, conteúdo renderizado por `textContent`, compartilhamento separado somente de texto e rótulo de conteúdo não confiável. Os formatos REST inspecionados usam `inlineData`, `fileData`, upload resumable, polling e DELETE. Não observei persistência local de mídia nesse caminho. O catálogo não comprova capacidade visual, preço ou quota; não há fallback automático.

Comandos executados:

```text
node --test tests/gemini-live-f2/*.test.cjs
node tests/gemini-live-f2/vision-adapter.test.cjs
node tests/gemini-live-f2/media-policy.test.cjs
```

Passaram: **13/13 visão e 11/11 MediaPolicy**. No diretório PHASE-02, ambos passaram:

```text
sha256sum -c PHASE-02-ARTIFACT-MANIFEST.sha256
sha256sum -c PHASE-02-SOURCE-MANIFEST.sha256
```

Os hashes das fontes registrados nas evidências de browser coincidem com este checkout. Os resultados **10/10 browser, 11/11 Chrome e 88/88 agregados** são evidências registradas; não reexecutei essas suítes. A evidência sintética de provedor registra HTTP 200 e exclusão remota, mas declara execução anterior ao ajuste final; não foi reexecutada nem prova execução neste HEAD.

`git status --porcelain=v1` vazio e `git diff --exit-code` aprovado ao final. Nenhuma edição, rede, credencial, captura, merge ou deploy.

**Gates separados:** quota/custo F2.3 não verificados; F2.4–F2.6 incompletos; quatro gates históricos F0/F1 continuam abertos conforme o contexto fornecido. Estado vivo de Issue/PR não consultado pela restrição de rede. Este parecer não autoriza merge em main nem produção.
