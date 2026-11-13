# PHASE-MCF-CODEBUDDY-CONTROL-001

**Objetivo:** controlar CodeBuddy local via CLI de forma persistente, reversível e observável.

**Boundary autorizado:** host `leo-N43SM`, integração local; sem merge/deploy de produção; sem ações comerciais.

**Estado inicial comprovado:** CLI 2.181.0 instalada, `codebuddy-web.service` `disabled/inactive`; `http://127.0.0.1:46514/` recusava conexão; diretório confiável inexistente; modelo padrão global `gpt-5.6-sol` recusado pelo plano de conta.

**Implementação:** backups privados; correção de diretório; gateway em loopback e `--auth password`; modelo `fast-model` no serviço; `systemctl --user enable --now`; wrapper Python sem dependências externas e sem bypass de permissões.

**Evidências objetivas:** HTTP 200; processo CodeBuddy Serve escutando 127.0.0.1:46514; `doctor.ready=true`; 11/11 unittest; mensagem CLI executada com resposta exata de marcador e `is_error:false`; wrapper `prompt` e `resume` aprovados usando o mesmo session id. `Linger=yes`.

**Limites de evidência:** PWA gráfica e cliente ACP independente não são equivalentes ao E2E do CLI. Reinicialização do serviço testada; reboot completo não realizado. Não afirmar central runtime adapter publicado.

**Retorno:** documentação e scripts em `tools/mcf-codebuddy-control`; backup e artefatos operacionais locais em `~/agent-sandbox/runs/MCF-CODEBUDDY-CONTROL-001/`. `main` e produção não alterados.

**Rollback:** `bash tools/mcf-codebuddy-control/rollback-local.sh --baseline`.

**Atualização QA:** login PWA e espelhamento de prompts/respostas CLI verificados por screenshot do CodeBuddy; modelo Fast visível. Controle alternativo por SentinelX MCP validado E2E com resposta MCF_SENTINEL_MCP_OK; wrapper resolveu Node v22 contra Node v18. Instalação idempotente aprovada após correção do healthcheck.


**PR de revisão:** https://github.com/leon337/multiagent-collaboration-framework/pull/521 (draft, sem merge). Validação de branch/CI consultada ao vivo; integração em main permanece condicionada aos gates aplicáveis.
