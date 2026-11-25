# MCF Local Ollama — CLI de diagnóstico

Ferramenta local, sem dependências NPM. Usa somente `http://127.0.0.1:11434`, com modelo fixo `qwen3.5:4b` e resposta de texto. Não executa comandos via LLM nem altera arquivos do usuário.

```sh
node tools/mcf-local-ollama/probe.mjs health
node tools/mcf-local-ollama/probe.mjs infer 'Quanto é 2 mais 2?'
node --test tools/mcf-local-ollama/test/probe.test.mjs
```

A saída `infer` inclui recibo `mcf-local-inference-receipt/v1` com `missionId`, `traceId`, saída e hash SHA-256. Os recibos são apenas impressos, não persistidos no ledger central. A integração candidata real com `AgentExecutionService` está em `apps/rede-social-agentes/apps/server/src/mcf-runtime/local-ollama.provider.ts`, desativada por padrão e proibida em produção. Consulte `docs/operations/MCF-LOCAL-OLLAMA-QWEN35-20261115.md`.
