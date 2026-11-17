# Codex CLI externo, perfil Emily — segunda auditoria

SHA revisado: 7a11ad6ede8fb2ac931839c4167c729c80f89b66.
Decisão no SHA revisado: PASS_WITH_RESERVATIONS (nenhum HIGH/MEDIUM, um LOW).
Executor: CODEX_CLI_EXTERNAL_EMILY_PROFILE, native_mcf_agent_session=false.
Codex thread: 01a1e783-5465-7281-9570-25c95e485bde
O LOW foi corrigido APÓS este SHA; não atribuir reauditoria dessa mudança a este parecer.
F0/F1/F2.6 gates formais permanecem abertos.

---

**Parecer técnico: PASS_WITH_RESERVATIONS**, no SHA exato `7a11ad6ede8fb2ac931839c4167c729c80f89b66`.

No escopo auditado, não identifiquei vulnerabilidade **HIGH/MEDIUM** nem regressão grave. As cinco correções anteriores estão presentes: redirects bloqueados, limpeza remota após URI inválida, seleção manual de modelo, catálogo single-flight e isolamento dos resultados entre sessões Live.

**Achado residual — LOW:** [vision-adapter.cjs:68](/tmp/mcf-f2-vision-rereview/apps/gemini-live-studio/vision-adapter.cjs:68). Se o finalize retornar HTTP 200 com JSON `null`, ocorre `TypeError` sem aviso de retenção remota incerta. Reproduzido com mock offline. Recomendo validar o objeto antes de acessar `info.file` e preservar o aviso de exclusão não confirmada.

Verificações realizadas:

- Comando solicitado `node --test tests/gemini-live-f2/*.test.cjs`: aprovado. Execuções individuais confirmaram **17/17 visão + 11/11 MediaPolicy**.
- Ambos os manifests F2: **todos os hashes OK**, conferidos no diretório correto.
- Evidências de browser: **14/14 + F2.1 11/11** registrados; todos os hashes de fontes coincidem com o checkout.
- JSON pós-remediação: hash do adaptador coincide; registra mídia sintética, **HTTP 200 imagem/vídeo** e **DELETE remoto do vídeo confirmado**.
- `git status --porcelain=v1` vazio; `git diff --exit-code` aprovado.

Browser e Google **não foram reexecutados**. Sem rede, não confirmei o estado vivo da Issue #527 ou PR #539.

Revisão externa CLI sob o perfil EMILY, sem identidade de Agent Session MCF autenticada. Gates formais **F0/F1/F2.6 permanecem abertos**; quota/preços não verificados e vídeos acima de 24 MiB sem implementação. Este parecer **não autoriza merge em main nem produção**.
