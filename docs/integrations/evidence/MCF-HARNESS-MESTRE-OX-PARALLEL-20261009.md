# MCF ↔ DSH — evidência de paralelismo e transporte WebSocket

**Data:** 2026-10-09
**Deployment testado:** DeepSeek Harness 0.1.1-rc.2, API local em loopback no notebook autorizado.
**Escopo:** validar RPC, sessões paralelas, downlinks de eventos e operações de subagentes sem expor credenciais nem conteúdo privado.

## Resultados

| Verificação | Resultado | Evidência |
|---|---|---|
| RPC de sessões (`session.create`, `session.prompt`, `session.list`, `session.history`) | PASS | Três sessões independentes do preset MCF concluíram; cada uma tinha `turn/end` no histórico e `running=false`. |
| Preset/skills MCF | PASS | `agentPreset.list` listou o preset de usuário `mcf`; `skill.list` listou `mcf-start-mission` e `mcf-operating-protocol`. |
| WebSocket `/api/events.mux` | PASS | Upgrade aberto, `session/subscribed` recebido e `turn/end` observado ao vivo para uma sessão de teste nova. |
| WebSocket `/api/events.host` | PASS | Upgrade aberto com sucesso. |
| HTTP GET para `/api/events.mux` | 426 esperado | O endpoint exige WebSocket upgrade; não deve ser diagnosticado como SSE quebrado. |
| HTTP RPC `subagent.list` / `subagent.history` | PASS | RPC read-only retornou `ok:true`; histórico filho recuperado. |
| HTTP RPC `subagent.prompt` | PASS limitado | Aceitou mensagem em subagente continuável; histórico subsequente contém eventos de turno terminal. A resposta exata do modelo não foi usada como único critério de sucesso. |
| HTTP RPC `subagent.interrupt` | PASS | Em um teste controlado, a rota respondeu `accepted:true` durante um turno ativo; `subagent.history` confirmou `turn/end` com motivo `aborted` / `user`. |
| Subagente nativo | EXECUTADO, qualidade insuficiente | Uma sessão filha real foi criada, mas a resposta continha falso positivo sobre o estado do host. Exigir validação independente de afirmações do agente. |
| Kilo pela UI do Harness | PASS | Uma sessão nova selecionou `Kilo - Cohere North Mini Code Free`, enviou `KILO_HARNESS_E2E_R3_PASS`; `session.history` confirmou `assistant/message` exato, `turn/end` concluído e replay state `provider=kilo`, `model=cohere/north-mini-code:free`; `session.list` confirmou `running=false`. O primeiro teste DOM foi tratado como insuficiente porque também via o texto do prompt. |

## Procedimento operacional correto

1. Consulte os schemas da versão instalada em `@deepseek-ai/dsh-host-apiproxy/lib/types/api` antes de inferir payloads.
2. Use HTTP JSON RPC em `POST /api/<method>` para operações unárias, com envelope `client-request` e `rpcId` único.
3. Use WebSocket em `/api/events.mux` para eventos por sessão e `/api/events.host` para eventos globais. Não use um GET SSE como teste de saúde desses endpoints.
4. Considere a execução encerrada somente após evidência terminal (`turn/end`) cruzada com `running=false` em `session.list` ou equivalente.
5. Trate saída de agentes como hipótese até validar fatos operacionais por ferramenta independente.
6. Para `subagent.interrupt`, não confie só no ACK `accepted:true`: confirme no histórico o evento terminal (`turn/end`) e seu motivo. O teste controlado desta execução confirmou `aborted` / `user`.
7. Para Kilo pela UI, não conte o texto ecoado do prompt como resultado; valide `assistant/message` no histórico persistido, `turn/end`, provider/model no replay state e `running=false`. Esse gate passou nesta execução para `cohere/north-mini-code:free`.

## Limites e persistência de aprendizado

- O relatório operacional local está em `/home/leo/Projetos/nvidia-api-lab/mcf-dsh-parallel-report.md`; scripts de teste locais não são artefatos públicos desta evidência.
- A capability oficial `cognitive-ledger.memory.read` é READ_ONLY e proíbe `memory.mutate`. O adapter de leitura declara `memory_payload_persisted_by_mcf: false`; não use esse endpoint como se gravasse memórias.
- A persistência oficial no Cognitive Ledger exige a capability write governada e seus gates próprios. Esta evidência documental não substitui essa integração nem registra conteúdo pessoal no repositório público.


### Atualização pós-teste (2026-10-09)

A verificação Kilo inicialmente detectou o marcador apenas no texto do usuário e foi considerada insuficiente. A inspeção posterior do histórico persistido da sessão confirmou que a mensagem do assistente continha o marcador exato, que o turno terminou com `reason.kind=completed`, que o replay state identificou o provider Kilo e o modelo `cohere/north-mini-code:free`, e que `session.list` retornou `running=false`. E2E pela UI: PASS.


### Evidência adicional de cancelamento ativo e Kilo E2E (2026-10-09)

- `subagent.prompt` retornou `messageId`; a chamada imediata a `subagent.interrupt` retornou `accepted:true`. A cauda de `subagent.history` registrou `turn/end` com `reason.kind=aborted` e `reason.reason.kind=user`, confirmando interrupção de um turno ativo no deployment testado.
- O verificador local `/home/leo/Projetos/nvidia-api-lab/verify-kilo-e2e-session.js` passou: histórico persistido confirma resposta exata do assistente, provider `kilo`, modelo `cohere/north-mini-code:free`, `turn/end=completed` e `running=false`.
