# MCF-ORACLE-001 — RELATÓRIO DE QUALIFICAÇÃO P4/P5 (NÃO É ENCERRAMENTO)

**Estado:** P4 EXERCITADO / P5 BLOQUEADO PELO GATE DE SEGURANÇA GLOBAL / P6 CONSTITUCIONAL NÃO SUBMETIDO. **Issue:** #443, **PR draft:** #444. A missão não pode ser declarada concluída ou implantada.

## Execução confirmada (não simulação de respostas de agentes)

- MESTRE executou o GitHub Actions no commit `40d76512dc3e53afc4cf195cc9d16fd424d85659` em cloud.
- [Run da execução real do MCF, PostgreSQL efêmero e testes negativos](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38959045300): **SUCCESS**. MCF canônico `AgentExecutionService` → provider experimental **habilitado somente em fixture de teste** → cliente Node local real → subprocesso Python bridge real → **Codex simulado em fixture determinística**; em paralelo `MissionRuntimeService` executou 8 processos OS reais e persistiu eventos/receipts no PostgreSQL 16 efêmero. Esses processos **não** são LLMs independentes.
- **17 testes Python + 33 Vitest integração/contrato + 3 E2E PostgreSQL = 53 testes direcionados aprovados**, com typecheck e migrations PASS.
- GitHub Actions testou bootstrap `bootstrap-linux-mint.sh --staging-only` em `HOME` Linux vazio: **PASS**. Isso não equivale a instalar/testar um segundo SSD Linux Mint real.
- Notebook `leo-N43SM`: bridge e schemas instalados a partir do commit exato acima sem copiar credenciais, testes locais **17/17 PASS**, `codex-cli 0.163.0`, **Logged in using ChatGPT**, sessão MCF-ORACLE-001 `READY, epoch=1` e consulta idempotente `CACHED` com decision `MCF-ORACLE-001-DEC-004`. O modelo `gpt-6-astra` já respondeu anteriormente em sessões reais via Codex CLI; interno provider routing NÃO VERIFICADO.
- Mudanças de código apenas em branch PR draft #444. ORÁCULO **não consta** no catálogo normativo de 29 agentes e não foi habilitado no módulo MCF produtivo.

## Evolução após DEC-004

1. Reconciliação segura de crash pós-resposta: Python `reconcile` só restaura o `READY` quando recibo validado, fingerprint e thread pré-registrada existem; senão retorna BLOCKED. **Não reexecuta o modelo silenciosamente.**
2. Cache com digest verificado, sessão/epoch incluídos, prevenção de idempotency_key repetida com payload distinto.
3. `LocalCodexOracleBridgeClient` por subprocesso Node sem shell/HTTP, argv restrito, environment allowlist, stdout limitado, stderr descartado, timeout e home local autenticado. Mantém payload e deadline estáveis no estado privado para que reload do MCF não repita turnos.
4. Cliente ligado ao `CodexOracleProviderAdapter` nos testes do `AgentExecutionService`; adapter permanece desligado por padrão e NÃO registrado na DI da instância hospedada.
5. Novos testes de input fora de esquema, deadline expirado, repetições, sessão em voo, thread desconhecida, troca de identidade, ação não autorizada, timeout e recovery.
6. Pacote de proposta constitucional em `proposals/MCF-ORACLE-001/` (contrato de ORÁCULO e gate binário); **não é norma vigente**.

## CI em SHA vinculado

| Check | Evidência no commit 40d76512 | Estado |
|---|---|---|
| MCF Oracle P0 Runtime Qualification | [run 38959045300](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38959045300) | SUCCESS 53/53 |
| Rede Social Container Smoke | [run 38959045395](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38959045395) | SUCCESS |
| Documentation validation | [run 38959045313](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38959045313) | SUCCESS |
| Rede Social Foundation | [run 38959045331](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38959045331) | SUCCESS |
| MCF v1.1 Qualification | [run 38959045325](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38959045325) | SUCCESS |
| MCF Production Readiness | [run 38959045326](https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38959045326) | **FAIL — dependency audit** |

**Atenção:** esses runs verificam o SHA `40d76512...`. Este próprio documento tem SHA posterior, exigindo reconciliação final dos checks antes de abrir gate/merge. Não inferir sucesso futuro.

## Segurança e dívida remanescente

- Baseline #427: 27 findings (1 critical/10 high); correção isolada em `security/mcf-427-cve-remediation` obteve 20 findings (4 high, 16 moderate), mas ficou sem PR aberto e sem check de aprovação; ferramentas GitHub bloquearam certas escritas e criação do PR. **Não contornar restrições de ferramentas.**
- Sem `OPENAI_API_KEY` comercial obrigatório e sem fallback pago; os serviços externos continuam sujeitos às próprias quotas e limites. Nenhuma autorização de despesa foi criada.
- Sem host-prod cloud→notebook bridge transacional verificado, sem modo contínuo agendado para executar tarefas indefinidamente após esta sessão ChatGPT. Recursos disponíveis neste chat não equivalem a máquina de execução 24/7.
- Não testar em segundo SSD Linux Mint, não modificar variáveis de Vercel/Render/Neon/Supabase sem necessidade/autorização por provider.
- Auditoria cognitiva independente sob papel Emily: NÃO VERIFICADO; a verificação documental, contratos e CI foi realizada pela mesma sessão + ferramentas reais.

## Condição de parada e retomada

A execução técnica da bridge P4 está demonstrada; **a missão ampla #443 continua BLOQUEADA para integração final** por Production Readiness vermelho, PR de segurança #427 ainda pendente e gate constitucional. Não abrir checkpoints humanos de rotina. Quando esses bloqueios forem sanados, exigir CI completo na revisão SHA exata, auditoria, aprovação binária constitucional e gates de merge/deploy aplicáveis.
