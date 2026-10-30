# MCF — Gate P0 de conclusão coletiva (Issue #483)

**Estado:** CONTRATO CANDIDATO EM PR DRAFT; não constitui integração na `main` nem prova de controle sobre a interface ChatGPT/Cockpit. **Papéis:** MESTRE orquestra; RAFAEL implementa; RENATO testa; EMILY audita SHA exato; LÉO decide gates aplicáveis; LEANDRO mantém autoridade final.

## Invariante

```text
required = execuções realmente convocadas, cada uma com agentId, surface, contractRef,
           runId, providerId, providerExecutionId vinculados à missão
can_finalize = every(required) has bound provider status COMPLETED
            && every(required) has verified artifact + receipt + received/verified handoff
            && independent review, LÉO and acceptance checks pass when applicable
requested|running|unknown|paused|failed|cancelled|blocked => FINALIZE_DENIED
```

O encerramento de EMILY não prova que SOFIA concluiu. `completed` sem artefato ou handoff recebido não é `accepted`. Progresso pode ser informado; alegação de conclusão não. STOP/PAUSE, retomada, timeout ou indisponibilidade de ferramenta não autorizam converter ausência de sinal em sucesso. Em impossibilidade de aguardar: `AGUARDANDO_AGENTE` ou `BLOQUEADO_COM_CHECKPOINT`, participantes pendentes, evidência, motivo e próxima ação; não simular espera infinita.

## Patch de máquina candidato

O contrato `McfMissionContract` aceita `collectiveCloseoutRequired` e `requiredAgentExecutions` (identidades reais **por execução**, não tabela de papéis). Para `MCF-CLOSE-PHASE` ou `MCF-TRACE-MISSION` com `final_checkpoint=true`, o `MissionRuntimeService` consulta o `AgentExecutionService` antes da execução e novamente, **após awaits, antes da persistência versionada**. Cada adapter precisa retornar status `COMPLETED` do handle exato e duas evidências vinculadas: `ARTIFACT` com ref/digest e `RECEIPT` com ref/digest, `missionId`, `runId`, `agentId`, `surface`, `contractRef`, `handoffReceived=true`, `handoffVerified=true`.

Relações incorretas, duplicatas, estado não terminal, evidência insuficiente, timeout ou adapter ausente geram erro `AGUARDANDO_AGENTE` e **não persistem o encerramento**; o checkpoint da missão anterior permanece recuperável. Timeout é limitado por consulta. O contrato estende JSON já persistido; não se cria ledger paralelo nem nova migration. Reversão: reverter commits da branch candidata ou descartar o PR.

## Cobertura e limites obrigatórios

**Proteção fail-closed para delegação:** contratos sem roster não podem fechar missões multiagente; apenas execução interna não delegada demonstrável por conjunto restrito de skills e contrato sem missão-pai usa a compatibilidade legada. A orquestração confiável precisa registrar todo agente obrigatório efetivamente convocado. Os adapters do ChatGPT nativo e Cockpit devem ser ligados a este contrato com provas autenticadas — **não demonstrado** neste PR. O Cockpit externo e a geração da resposta textual do MESTRE não estão sob controle do `MissionRuntimeService` desta aplicação; portanto não alegar bug resolvido ponta a ponta. Também falta persistir automaticamente o motivo de `AGUARDANDO_AGENTE` como checkpoint/recibo, tratamento de reinício/idempotência de rosters dinâmicos e testar concorrência interprocesso. A verificação de recibos depende da confiabilidade real dos adapters e NÃO substitui revisão independente.

## Plano mínimo de aceite

- [ ] SOFIA `RUNNING` e EMILY `COMPLETED`: nenhum encerramento.
- [ ] Ausência de recibo, handoff verificado ou artefato: nenhum encerramento.
- [ ] Sessão diferente, provider ausente, timeout ou `UNKNOWN`: nenhum encerramento.
- [ ] STOP/PAUSE, cancelamento, reboot/replay: pendências e checkpoint recuperáveis.
- [ ] Todas execuções terminais e handoffs verificados + auditoria, LÉO, aceites: permitir conclusão.
- [ ] Aplicar o mesmo gate no **controlador real do Cockpit** e na emissão de resposta final de MESTRE.
- [ ] RENATO QA, EMILY auditoria independente do SHA exato, CI verde; merge e pós-merge são missão posterior e exigem autorização.

**Fontes:** [Issue #483](https://github.com/leon337/multiagent-collaboration-framework/issues/483), `docs/agentes/MESTRE.md`, `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` e `docs/protocols/MCF-MECANISMO-A-SUBAGENTES-NATIVOS.md`.

## Correções após review independente EMILY (Issue #483 / PR #484)

**Estado: implementado somente no candidato NestJS, sujeito a CI, revisão EMILY nova e gates.**
- `missionContractSchema.strict()` no HTTP inclui flag, `rosterRevision`, identificadores e superfícies; não descarta campos desconhecidos.
- Regra independente de opt-in do cliente: missões multiagente ou com skill delegadora não podem fechar sem roster completo. Só preserva legado de uma execução interna comprovável (incluindo `Carmem→Mestre` estritamente `MCF-CLOSE-PHASE`). Um `false` malicioso não ignora delegação.
- O roster versão 1 é registrado no evento `MISSION_CREATED` com SHA-256 dos bindings e `selectedAgents`; entradas faltantes, duplicadas e substituições não autorizadas são recusadas. Revisão de roster/reatribuição futura exige mecanismo governado não incluído aqui: permanecer bloqueado em vez de remover agente pendente.
- Negação do fechamento produz `GATE_REJECTED` no `mcf_events` original sob lock/version e idempotência; preserva agentes obrigatórios, motivo, roster hash, fase e próxima ação. `persistExecution` compara ainda o JSONB integral do contrato no UPDATE versionado (CAS contra edição silenciosa durante awaits).
- Rejeita `COMPLETED` com `observedAt` defasado (>60s), evidencia sem artefato, handoff sem ACK separado, sessão/attempt diferente, timeout e provider indisponível.
- Testes: HTTP real Nest/Fastify com autenticação e `fastify.inject` exercitam criação, rota de fechamento, resposta 403, não execução, checkpoint idempotente, subset e alteração silenciosa. Testes Postgres em CI cobrem replay durável e comparação transacional do contrato; sem Postgres local são explicitamente SKIPPED.

### Gaps que permanecem bloqueantes
1. `MISSION_CREATED` demonstra **snapshot de intenção contratual**, **não** prova de dispatch real. Não há adapter nativo/Cockpit registrado no servidor nem reconciliação confiável das convocações que ocorreram fora do runtime. Um agente omitido também de `selectedAgents` permanece invisível: essa limitação exige integração efetiva do bridge e telemetria de dispatch, não pode ser corrigida apenas pelo parser HTTP.
2. O ACK separado no `AgentExecutionEvidence` é estrutural, **não tem assinatura/autenticidade independente demonstrada**; ainda exige validação pelo adaptador de origem e prova do receptor na superfície real.
3. O Cockpit tem repositório próprio `leon337/mcf-web-panel-gateway`. Em `main`, `agent-lifecycle.mjs::parentMissionStatus` computa `closable` sobre **somente invocações registradas**, sem handoff/aceite/auditoria; `agent-runtime.mjs::getRecoveryCheckpoint` é por pane e `bridge.mjs::/v1/message` valida recovery mas não gate coletivo. Existe o candidato **draft PR #11** (P0-ARCH-03) neste repositório, ainda não integrado e com `triOperationalSendQualified=false`. Exigir proteção de emissão de `ENTREGUE`, roster persistido antes de dispatch, CAS do epoch do roster e ACK do receptor em `bridge.sendMessage` / HTTP / IPC e `TriHandoffDispatcher` sob teste Electron, sem ativar transporte real antes da revisão.
4. O emissor **ChatGPT MESTRE** fora deste NestJS pode responder sem consultar `assertCollectiveCloseoutReady`. Não se pode comprovar proteção ponta a ponta nem dar aceite à Issue até existir gate neste emissor real, respeitando os limites de ferramentas.

**Não criar segundo ledger, não fazer merge, não acionar deploy.** EMILY deve revisar de novo o HEAD exato e executar matriz A01–A14, com RENATO QA e decisão LÉO quando pertinente.

### Restart epoch 2 — correção JSONB/CI do PR #484 (Issue #483)

O Postgres armazena `mcf_missions.contract` e `mcf_events.payload` em `jsonb`, que não preserva a ordem de inserção das chaves de objetos JS. A implementação anterior fazia `JSON.stringify` do roster com os objetos originais: hashes distintos para o mesmo conjunto de bindings depois do round-trip JSONB. Resultado verificável do SHA `904aef47...`: Foundation #40610621304, Qualification #40610621282, Production Readiness #40610621300 reprovaram o teste `collective-closeout-postgres.integration.test.ts:95` por falso bloqueio `persisted immutable roster snapshot missing or changed`, mesmo com SOFIA em RUNNING.

**Correção candidata:** serialização canônica recursiva das chaves de objetos para o SHA-256, preservando arrays/identidades; registro do `parentMissionId` no evento de criação; confronto do SHA tanto com os bindings salvos no evento como com o contrato atual. Sem fallback que transforme hash divergente, identidade adulterada ou roster omitido em aprovação.

**Regressão:** teste unitário prova invariância sob reordenação recursiva das chaves (com campos e ordem de inserção diferentes); testes adversariais alteram provider ID, execution ID, run ID, superfície, referência de contrato e omissão de agente e exigem hash diferente. Teste HTTP rejeita payload do ledger adulterado com digest antigo. Testes PostgreSQL executados em CI com `DATABASE_URL` verificam round-trip JSONB, preservação dos identificadores originais, negação `SOFIA RUNNING`, checkpoint idempotente e corrida determinística pós-await em que a mutação de `providerExecutionId` dispara CAS, sem `MISSION_COMPLETED`.

**Limites mantidos:** não demonstra convocação real fora do NestJS nem controla a emissão textual de MESTRE/Bridge. Reconciliar gateway Issue #12 e review EMILY/QA RENATO sobre HEAD exato antes de qualquer integração; não rearmar STOP/PAUSE, não ativar transporte tri não qualificado.
