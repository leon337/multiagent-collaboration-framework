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

**Proteção condicional:** contratos legados sem o flag e sem roster preservam o comportamento anterior. A orquestração confiável precisa registrar todo agente obrigatório efetivamente convocado. Os adapters do ChatGPT nativo e Cockpit devem ser ligados a este contrato com provas autenticadas — **não demonstrado** neste PR. O Cockpit externo e a geração da resposta textual do MESTRE não estão sob controle do `MissionRuntimeService` desta aplicação; portanto não alegar bug resolvido ponta a ponta. Também falta persistir automaticamente o motivo de `AGUARDANDO_AGENTE` como checkpoint/recibo, tratamento de reinício/idempotência de rosters dinâmicos e testar concorrência interprocesso. A verificação de recibos depende da confiabilidade real dos adapters e NÃO substitui revisão independente.

## Plano mínimo de aceite

- [ ] SOFIA `RUNNING` e EMILY `COMPLETED`: nenhum encerramento.
- [ ] Ausência de recibo, handoff verificado ou artefato: nenhum encerramento.
- [ ] Sessão diferente, provider ausente, timeout ou `UNKNOWN`: nenhum encerramento.
- [ ] STOP/PAUSE, cancelamento, reboot/replay: pendências e checkpoint recuperáveis.
- [ ] Todas execuções terminais e handoffs verificados + auditoria, LÉO, aceites: permitir conclusão.
- [ ] Aplicar o mesmo gate no **controlador real do Cockpit** e na emissão de resposta final de MESTRE.
- [ ] RENATO QA, EMILY auditoria independente do SHA exato, CI verde; merge e pós-merge são missão posterior e exigem autorização.

**Fontes:** [Issue #483](https://github.com/leon337/multiagent-collaboration-framework/issues/483), `docs/agentes/MESTRE.md`, `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md` e `docs/protocols/MCF-MECANISMO-A-SUBAGENTES-NATIVOS.md`.
