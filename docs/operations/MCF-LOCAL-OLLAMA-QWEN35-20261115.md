# MCF — Inferência local Qwen 3.5 via Ollama (candidata isolada)

- **Missão:** `MCF-LOCAL-OLLAMA-QWEN35-20261115`
- **Fase:** `F1-LOCAL-INFERENCE-ADAPTER`
- **Baseline:** `main@b88ccda900a477fd5490a8897bd663069354f6cd` (verificado em 2026-11-15)
- **Branch:** `feat/mcf-local-ollama-qwen35-20261115`
- **Autoridade:** LEANDRO; orquestração: MESTRE
- **Classificação:** `EXPERIMENTAL`, **não produção**, não deployada
- **Objetivo:** conectar um Qwen 3.5 4B em GPU local ao contrato `AgentExecutionService → ProviderAdapterRegistry` sem ampliar permissões de execução

## Escopo / arquitetura

```text
GUI Open WebUI (localhost:3000) ──────────┐
VS Code + Continue (Ollama) ───────────────┼→ Ollama 127.0.0.1:11434 → Qwen 3.5 4B / Vulkan / AMD RX 580
MCF AgentExecutionService → ProviderAdapterRegistry → LocalOllamaProviderAdapter ──────┘
```

A interface web e o Continue consomem Ollama diretamente, e não herdam automaticamente autoridade, gates ou a política de ferramentas do runtime MCF. A integração **candidata** do runtime é um provider de inferência textual; não executa ferramentas, comandos, alterações em arquivos nem browser automation.

## Controles

- Desativado por padrão: `MCF_LOCAL_OLLAMA_ENABLED=false`.
- Rejeitado quando `NODE_ENV=production` e a flag estiver ativa.
- Exige `AuthorityEnvelope` autenticado no pipeline do MCF com ação `llm.generate` e escopo de provider `mcf-ollama-qwen35-local`.
- Endpoint `/api/chat` fixo e limitado a `127.0.0.1:11434`, modelo `qwen3.5:4b` allowlisted; nenhuma URL fornecida pela missão é usada.
- Contexto 4096, geração máxima 384 tokens, prompt até 8.000 caracteres, output até 16.000 caracteres, timeout configurável até 120 segundos.
- 1 inferência simultânea, deduplicação idempotente por `missionId+runId`, erro em conflito de prompt, receipt com SHA-256, sem side effects.
- `resume` não repete um prompt automaticamente; execuções e receipts estão **somente em memória**. Perda de processo/restart perde handles; sem prova de continuidade durável.
- Não registra o prompt no receipt; o output aparece em `collectEvidence().metadata.output`. Tratar o conteúdo como dado de origem não confiável, não como instrução.
- A UI do Open WebUI possui autenticação separada da governança MCF; primeira conta admin precisa ser registrada pelo usuário.

## Uso local e validação

```bash
node tools/mcf-local-ollama/probe.mjs health
node tools/mcf-local-ollama/probe.mjs infer 'Quanto é 2+2?'
node --test tools/mcf-local-ollama/test/probe.test.mjs
cd apps/rede-social-agentes
npx pnpm@11.17.0 --filter @rsa/server typecheck
npx pnpm@11.17.0 --filter @rsa/server exec vitest run src/mcf-runtime/local-ollama.provider.test.ts
```

Para experimentar o adapter no runtime MCF local, disponibilizar `DATABASE_URL` de um banco de **teste isolado**, `NODE_ENV=development`, `MCF_LOCAL_OLLAMA_ENABLED=true` e iniciar o servidor conforme o README da aplicação hospedeira. **Não habilitar na produção nem no servidor público**.

## Critérios de aceite

1. Ollama detecta Qwen 3.5 e aceleração RX 580: evidência de `ollama ps` em host local.
2. Open WebUI responde HTTP 200 no loopback; criar admin pela UI ainda é um gate humano.
3. Continue está instalado e há configuração no usuário VS Code; a verificação visual da extensão em janela requer teste de GUI.
4. Client CLI read-only responde `health READY` e `infer` com hash.
5. Provider MCF compila, testes Vitest cobrem idempotência, autoridade, modelo allowlisted, falhas e cancelamento.
6. Sem merge/deploy de produção. Sem alteração de modelos/serviços preexistentes.

## Riscos e limitações

O Qwen 4B não equivale a agente executor de ferramentas. O adapter não tem persistência de handles/retry durável, portanto não é provider de missões de longa duração. O endpoint Ollama e o Open WebUI permanecem limitados ao host; acesso remoto seguro precisaria de autenticação e um túnel explícitos. Esta branch requer revisão independente, CI e gate antes de qualquer integração com produção. Não interpretar a existência do adapter como ativação do runtime central.

## Diagnóstico de inferência (2026-11-15)

O E2E inicial via `/api/generate` expirou em 120 s durante concorrência com uma longa geração em `/api/chat` que ocupou a única fila da GPU, chegando ao limite de contexto de 4096 tokens. A alternativa `/api/chat` com `think:false` e resposta curta foi validada em seguida: CLI real respondeu `4` em 0,637 s, e E2E real `AgentExecutionService → ProviderAdapterRegistry → LocalOllamaProviderAdapter → Qwen 3.5 Vulkan` completou em 0,542 s; `8/8` testes Vitest passaram, `3/3` testes Node passaram, compilação dos packages e typecheck do servidor passaram. A disputa por uma única GPU segue risco operacional: não permitir chats longos concorrentes no mesmo modelo sem fila/limite. Não é evidência de operação durável do runtime central com banco de dados.

### Evidências da estação de desenvolvimento

- Ollama `qwen3.5:4b`, `ollama ps` → `100% GPU`, RX 580 Vulkan.
- Open WebUI 0.13.3: HTTP 200 em `127.0.0.1:3000`, endpoint de autenticação anônimo responde HTTP 401, serviço `open-webui-local.service` ativo e habilitado.
- Continue 2.0.0 instalado; YAML local validado, sem teste visual do painel de extensão nesta fase.
- Registros locais: `~/.local/state/mcf-local-ai/` (não versionados, não publicados).
- O primeiro usuário deve fazer cadastro na interface para se tornar admin e configurar `Thinking Off` nas preferências do Qwen se quiser respostas rápidas.
- Branch local isolada, sem produção e sem qualquer credencial salva no Git.
