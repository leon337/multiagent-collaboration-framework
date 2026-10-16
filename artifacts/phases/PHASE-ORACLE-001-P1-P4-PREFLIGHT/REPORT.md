# MCF-ORACLE-001 — P1/P2/P3 e P4 parcial: execução verificável

**Missão:** Issue #443 · **PR:** draft #444 · **Autoridade:** Leandro e LÉO preservados, ORÁCULO como PROPOSTA até gate constitucional Classe C.

## MESTRE ↔ ORÁCULO REAL (Codex autenticado)

**Modelo solicitado:** `gpt-6-astra`, instalado Codex CLI `0.163.0`; `codex login status: Logged in using ChatGPT`. As chamadas realmente concluíram, sem API comercial de IA nem copiar tokens para GitHub.

- `MCF-ORACLE-001-DEC-002`: planejamento estratégico com schema JSON via `codex exec --model gpt-6-astra --sandbox read-only`. SHA256 local do output `a51c234c097c1aa5ffdb44eb20d1af200002099f9b619980144c6fbf92c4d312`.
- `MCF-ORACLE-001-DEC-003`: retomada **da mesma thread real** via bridge local `codex exec resume`; estratégia P4 registrada com request `P3-review-001`, `mission_id=MCF-ORACLE-001`. SHA256 local do envelope de resposta `74aeb53740a3a7f68c95d689446e4f5ac8a74e7b0d231da37fe2b6847a3a4d87`.
- A associação privada `mission_id / session_epoch=1 / thread_id` é mantida **somente no Linux Mint**; nenhuma cópia de token, cookie, thread ID bruto ou contexto privado vai ao GitHub. Status `READY`, 1 solicitação retomada com prova no estado do bridge.
- Smoke separado `MCF-ORACLE-001-SMOKE`: duas chamadas reais ao mesmo contexto, respostas `COMPLETED` e replay `CACHED` sem nova invocação de modelo. SHA256 locais dos envelopes: primeiro `ad712ee45fbc6c6c30126101c9eff3e4dcd1bd0a8d1844e4c7ee12371f53d888`, segundo `dd00302eff24865c583f8aad70877241d5b4c6e22db4cb8c77bd70966e572fa6`, cache `ba2f020a0da979c1da152f39604923d6fa681ce8a3f349da55900f33aad589ca`.

**Precisão:** `gpt-6-astra` foi o ID solicitado e aceito pela CLI; este PRF não tem acesso a telemetria interna que garanta detalhes ocultos de roteamento do provedor.

## Entregas por competência efetivamente implementadas

| Competência | Artefato | Verificação |
|---|---|---|
| Sofia + Leonardo, P1 | ADR de autoridade e schemas de request/decision em `docs/architecture/` e `schemas/` | Fontes versionadas; ainda não constitucionalizadas |
| Ricardo, P2 | Threat model em `docs/security/` | Sem OAuth/secret no GitHub; política read-only, request idempotente e fail-closed |
| Gabriel + Sofia, P3 | `tools/oracle-bridge/oracle_bridge.py`: wrapper CLI portátil, locks, estado privado, schema, replay, epoch, timeout e resume | Duas chamadas reais + idempotência, Linux Mint |
| Gabriel + Sofia, P3 | `codex-oracle-provider.adapter.ts`, implementing `AgentExecutionProviderAdapter` | 6 testes mocks; **não conectado ao módulo produtivo**, disabled por padrão |
| Beatriz + Ricardo, P4 parcial | Testes de deadlines, chaves divergentes, modelos/login inválidos, concorrência, sessão em voo/UNKNOWN, isolamento de missões | Python 12 + Vitest adapter 6 e runtime canônico (evidência CI) |
| Emily, auditoria documental | Limitações documentadas e hashes locais de outputs | **Não** representa auditoria cognitiva independente |

## CI e evidências

**GitHub Actions qualificação:** https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38953974919

**Commit candidato executado:** `daccd4640368d74ec530a69aa5670826157fc18a`.

- Bridge Python com CLI simulada e ambiente filtrado: **12/12 PASS**.
- AgentExecutionService + adapter ORÁCULO candidato + contrato/LocalAgentTeam: **28/28 PASS**.
- MissionRuntimeService real + ExternalActionDispatcher + 8 processos OS + receipts/PostgreSQL 16 efêmero: **3/3 PASS**.
- **Total targeted: 43/43 PASS**, PostgreSQL migrations PASS, server typecheck PASS.
- Teste local Linux Mint com mock: **12/12 PASS** após instalar código versionado pelo commit.
- Contexto real Codex/GPT-6 Astra: duas consultas na thread de smoke, replay em cache, e uma retomada de sessão da missão com decisão DEC-003; teste local **não** prova execução em CI (CI usa mock).
- CI global: `MCF Production Readiness`, `Rede Social Foundation` e `MCF v1.1 Qualification` **FAIL** (issues pré-existentes, Issue #427). Não aprovar merge/prod com esses gates vermelhos.

## Estado de conclusão por fase

- P1: especificação candidata **pronta para revisão**, sem novo agente oficial.
- P2: threat model e isolamento **documentados**, transporte remoto geral ainda não comprovado.
- P3: bridge CLI real e adapter tipado candidato **demonstrados separadamente**, conexão integrada runtime hospedado→bridge local ainda **NÃO VERIFICADA**.
- P4: testes negativos básicos positivos, **incompleta** validação de crash após resposta, reconciliador canônico de `UNKNOWN`, lease distribuído e transporte cloud↔notebook.
- P5: CI específico verde, CI global vermelho, auditoria final e rollback constitucional pendentes.
- P6: **gate humano constitucional NÃO SOLICITADO**, porque a revisão exata e readiness ainda não atendem os critérios.

**Princípio:** provas reais separadas de mocks, testes determinísticos separados de agentes LLM, sem alteração de `main`, produção ou autoridade.
