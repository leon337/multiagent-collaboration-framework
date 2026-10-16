# MCF-ORACLE-001 — Relatório factual da Fase P0

**Data:** 2026-10-16 · **Issue:** #443 · **PR draft:** #444.

## Ações realizadas
1. Notebook `leo-N43SM`, Linux Mint 22.1, Node 24.22: instalado pacote oficial `@openai/codex@0.163.0` em `~/.local/bin/codex` sem sudo e sem OpenAI API paga.
2. `codex --version` retornou `codex-cli 0.163.0`. `codex login status` retornou `Not logged in`. Tentativa suportada de login sem chave de API expirou após 60 segundos; não houve autenticação, token exportado ou chamada ao ORÁCULO.
3. Criada branch `mission/mcf-oracle-001-runtime-preflight` e PR draft #444, sem alterar `main`.
4. Executados contratos de `AgentExecutionService` e `ProviderAdapterRegistry` contra adapter exclusivamente de teste.
5. Foi detectada falha preexistente de compilação no `main`: fechamento ausente em teste do `AuthorityEnvelope` e tipo `AgentExecutionProviderContract` inexistente em `ProviderAdapterRegistry`. Corrigidos **somente na branch**; falha também documentada na Issue #427 e PR #426.
6. Realizado workflow `.github/workflows/oracle-p0-runtime-qualification.yml` com PostgreSQL 16 efêmero, migrations, testes reais do runtime e workers do sistema operacional.
7. Execuções iniciais encontraram configurações reais incorretas: argumento de shell com barras duplicadas; registry não localizada; e duas skills web EXPERIMENTAL sem `fallback` nem `handoff_to`. Foram aplicadas correções pontuais e fechadas em escopo no PR.
8. **Run aprovado:** GitHub Actions `38948847194`, job `117134792530`, candidato `fff73690c629a99446eaffcf6dcb156e052c02ba`.

## Resultados verificados
- Grupo A: 4 test files, **22/22 PASS**; contrato de lifecycle, scopes, efeitos desconhecidos, tokens de governança e workers OS.
- Grupo B: 2 test files, **3/3 PASS**; `MissionRuntimeService`, `SkillExecutor`, `ExternalActionDispatcher`, oito processos reais, receipts e tentativa persistida no PostgreSQL temporário.
- Migrations no PostgreSQL efêmero: **PASS**. Typecheck do servidor: **PASS**. Workflow específico `MCF Oracle P0 Runtime Qualification`: **SUCCESS**.
- `Rede Social Container Smoke` e `Documentation validation`: **SUCCESS** no mesmo SHA.
- Gates gerais `MCF Production Readiness`, `MCF v1.1 Qualification` e `Rede Social Foundation`: **FAIL**. Readiness reproduz 27 vulnerabilidades (16 moderadas, 10 altas, 1 crítica), rastreadas na Issue #427; format/global checks não estão verdes. **Não liberar merge/produção.**

## Não demonstrado
- **ORÁCULO GPT-6 Astra não executado:** autenticação Codex está ausente.
- Nenhum provider Oracle conectado ao MCF em serviço hospedado.
- Os oito workers rodaram processos determinísticos, **não oito LLMs independentes**.
- A missão e os receipts persistiram apenas durante testes no banco PostgreSQL efêmero, depois removidos pelo teardown.
- Teste em segundo SSD/Linux Mint, integração com providers, CI global e auditoria independente: **NÃO VERIFICADOS**.

## Próxima ação
Investigar autenticação Codex sem expor credenciais; elaborar contrato e adapter de autoridade em proposta (sem implantação constitucional); reconciliar falhas gerais CI por missão específica. Gate humano único na revisão exata quando a autoridade estratégica estiver formalizada.
