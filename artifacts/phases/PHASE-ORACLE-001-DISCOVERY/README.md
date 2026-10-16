# MCF-ORACLE-001 — P0: preflight de runtime canônico

- **Issue:** #443
- **Classificação:** Classe C; **somente descoberta, leitura e testes isolados nesta fase**.
- **Ambiente preferencial:** GitHub Actions / runner efêmero.
- **Baseline:** `main` na criação da branch `mission/mcf-oracle-001-runtime-preflight`; conferir SHA live ao revisar.
- **Gate humano:** permanece exigido antes de modificar autoridade, catálogo, policy, produção ou integrar o ORÁCULO como executor material.
- **Nenhuma alteração em `main` ou produção está implícita neste PR.**

## Execução real vs simulação

O teste `oracle-runtime-preflight.test.ts` **executa código real** de `AgentExecutionService` e `ProviderAdapterRegistry`. O executor de teste é um **adapter determinístico in-process**; isso verifica o contrato existente de lifecycle, autorização e fail-closed, mas **não executa o ORÁCULO cognitivo, não seleciona GPT-6 Astra e não cria uma missão na base PostgreSQL canônica**.

Não confundir:
1. Teste real de componentes MCF (prova a integração contratual);
2. MissionRuntime/DB E2E (não executado por este preflight);
3. Sessão Codex autenticada (não provada por este preflight);
4. Execução multiagente cognitiva independente (não alegada).

## Host Codex: verificação

Em Linux Mint 22.1, o pacote oficial `@openai/codex@0.163.0` foi instalado em prefixo **de usuário** (`~/.local/bin/codex`). `codex --version` retornou `codex-cli 0.163.0`. `codex login status` retornou `Not logged in`. Portanto o **OAuth/ChatGPT Plus, modelo-alvo e primeira sessão Oracle estão pendentes**, sem usar chave de API comercial nem divulgar segredos.

## Etapas seguintes, condicionadas a evidência

1. Rodar o teste de lifecycle e o conjunto existente de testes do MCF em runner GitHub Actions, registrar check/run/SHA.
2. Reconciliar catálogo oficial (29 agentes), modelo de autoridade de LÉO, matriz e protocolo ESEV antes de formalizar o contrato ORÁCULO.
3. Provar autenticação ChatGPT/Codex pelo fluxo suportado. Não importar cookies/chaves nem contornar login/MFA.
4. Submeter mudança de autoridade em revisão exata para **APROVAR ou REJEITAR**; sem presumir autorização por este documento.
5. Somente depois do gate de autoridade, implantar o bridge real e testar uma sessão ORÁCULO por missão com receipts.

## Política de custo e credenciais

- `paid_ai_api = false`, `paid_fallback = false`, `max_paid_ai_cost = 0`.
- Runners GitHub e conectores externos devem permanecer em cotas já autorizadas; uma operação desconhecida é bloqueada, não considerada grátis por inferência.
- Segredos não entram em prompts, Issues, artefatos ou logs de CI.
