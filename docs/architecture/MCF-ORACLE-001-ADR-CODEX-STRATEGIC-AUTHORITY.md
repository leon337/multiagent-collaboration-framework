# ADR — MCF-ORACLE-001: ORÁCULO estratégico via Codex CLI (PROPOSTA)

**Decisão real do ORÁCULO:** `MCF-ORACLE-001-DEC-002`, obtida em 2026-10-16 pelo Codex CLI autenticado com ChatGPT, `--model gpt-6-astra`, `--sandbox read-only`, resultado JSON estruturado com sucesso. O identificador local da sessão não é publicado.

**Status:** CANDIDATA, **não aprovada constitucionalmente**. A discussão, os testes com fixtures e a prova local não alteram a hierarquia oficial.

## Problema e resultado

O usuário define objetivos e aprova/rejeita os gates humanos; não opera credenciais, pipelines, variáveis ou ambientes. O ORÁCULO determina direção estratégica, seleção de especialistas, handoffs, critérios e replanejamento de missões; MESTRE comanda operacionalmente o MCF, obedecendo às decisões estratégicas que respeitem autoridade humana e guardrails. Agentes executam por suas competências e entregam evidência.

Hierarquia **proposta**: LEANDRO (autoridade humana final) > ORÁCULO (estratégia) > MESTRE (orquestração) > especialistas. Preservam-se autoridade operacional delegada LÉO, HDF/PermissionEngine, gate de merge/deploy, controle financeiro e rastreabilidade ESEV.

## Delta arquitetural mínimo

1. **Identidade != backend:** ORÁCULO é identidade/contrato do catálogo MCF; `gpt-6-astra` é seleção de modelo do executor Codex CLI. O backend pode evoluir sem modificar identidade ou constitucionalizar IDs de fornecedor.
2. **Camada estratégica:** `ChatMissionPlanner` e/ou estágio de planejamento de `MissionRuntimeService` devem solicitar uma decisão estruturada quando o recurso experimental estiver habilitado e autorizado. Não há segundo MissionRuntime.
3. **Executor tipado:** reutilizar `AgentExecutionService`, `ProviderAdapterRegistry`, `AuthorityEnvelope`, receipt/evidence, eventos e leases. Um `CodexOracleProviderAdapter` candidato delega comunicação ao bridge sem acesso aos segredos ChatGPT em GitHub/Render.
4. **Bridge local transport-agnostic:** CLI user-local invoca somente `codex exec` e `codex exec resume` suportados; sessão persistida por `mission_id` no storage privado do host. No modo inicial ChatGPT usa conector Remote Desktop Commander autorizado para acionar o bridge; qualquer transporte pull/cloud futuro exige threat model, autenticação delegada e gate próprios, e não está implícito.
5. **Cloud-first:** desenvolvimento, CI, artefatos e versionamento no GitHub/sandbox; notebook serve apenas de bridge autenticada e destino excepcional de instalação. `Codex` não usa `OPENAI_API_KEY`, segue conta ChatGPT autenticada localmente e limites próprios do plano.
6. **Fail-closed:** modelo ausente, conta não autenticada, timeout, sessão perdida, resposta inválida, repetição com payload diferente, interrupção com resultado incerto → `BLOCKED/UNKNOWN`, sem fallback pago, sem alteração de autoridade.
7. **Sem execução por texto:** resposta do ORÁCULO é dado não confiável a validar; ela só instrui o MESTRE. `ExternalActionDispatcher` / HDF decidem se uma ferramenta pode agir. Nenhum JSON permite autoaprovar gates.
8. **Portabilidade:** scripts, schemas, CI, contratos e manifests no GitHub. Variáveis não secretas declarativas; identidade OAuth do Codex e resultados locais de sessão não versionados. A migração para outro SSD exige login oficial e nova `session_epoch` quando não houver sessão válida.
9. **Observabilidade:** todos os jobs vinculam `mission_id, request_id, schema_version, session_epoch, thread_id (referência privada), attempt_id, SHA, modelo solicitado, cli_version, cost_policy, source` e resultado; registros sensíveis não são publicados no CI.
10. **Autonomia governada:** sem microconsultas humanas; comunicação operacional em eventos/recibos duráveis. Só abrir gate constitucional de aprovação/rejeição quando o pacote PRF e a revisão exata estiverem prontos.

## Decisão/autoridade (candidata)

| Ação | Pode determinar ORÁCULO? | Pode executar MESTRE? | Gate |
|---|---|---|---|
| Planejar missão, selecionar agentes, ordenar handoffs | Sim, na proposta | Sim, no MCF governado | Sem gate humano rotineiro |
| Criar branch, testes e PR draft | Sim | Sim | Autorização delegada do MCF |
| Criar variáveis não sensíveis via conectores | Sim | Somente após verificação de provider/escopo/custo | Gate se mudança reservada |
| Provisionar segredos ou novas autorizações | Recomendar caminho | Via store/integração autorizada; não extrair OAuth | Gate quando necessário |
| Alterar contrato constitucional/catálogo oficial | Propor | **Não antes da aprovação** | Leandro aprova/rejeita revisão exata |
| Fazer merge `main` ou deploy produção | Não autoriza por si | Somente após gates dedicados | HDF/LÉO/LEANDRO conforme contrato |
| Ativar fallback pago/alterar custo | **Não** | **Não** | Política financeira fail-closed |

## Fases da decisão ORÁCULO-DEC-002

P1 Sofia+Leonardo: ADR, schemas, delta de autoridade e rollback. P2 Ricardo+Sofia: fronteiras de segredo, idempotência, lease/expiração e rejeição de replay. P3 Gabriel+Sofia: bridge CLI e adapter experimental desativado, com mocks e prova real sintética. P4 Beatriz+Ricardo: testes de schema, timeout, resumibilidade, concorrência e costs. P5 Beatriz+Emily: CI/PRF e auditoria, resolver gates globais #427. P6: **único gate humano constitucional** sobre revisão exata, antes de qualquer ativação canônica.

## Riscos e trade-offs

- CLI local autenticado é portátil, mas não transforma sessão ChatGPT em API comercial ou executor do GitHub Actions; um serviço de jobs com autenticação própria poderá ser necessário para execução assíncrona remota. **Não prometer disponibilidade 24/7 sem scheduler e bridge online.**
- Sessão Codex por missão não é transação distribuída: o timeout pós-commit exige reconciliação; o wrapper nunca promete exatamente uma execução.
- `read-only` limita escrita do modelo, mas não isolamento completo de leitura/exfiltração. Ambiente filtrado e autenticação restrita são necessários; jamais entregar código arbitrário de PR ao Codex autenticado sem revisão.
- CI específico verde não substitui readiness global. PR #444 continua draft até gates constitucional e operacionais.

## Critérios para gate P6

Contratos e diff identificados por SHA, validação runtime/segurança/finanças, PRF, plano de rollback, modelo/custo comprovados, testes negativos, independência de host documentada e pendências explícitas. APROVAR/REJEITAR revisão exata; alterações posteriores exigem nova revisão. Nenhuma aprovação tácita.
