# PHASE-01 — Decisões

## 2026-10-11 — D1: Usar descriptor suportado, sem expor segredo
**Decisão:** ler o descriptor da instância ativa e usar o token somente em memória para chamadas GET autenticadas.
**Justificativa:** o descriptor existe no userData restrito da instância principal; o contrato exige autenticação.
**Controle:** o token não foi impresso, copiado para artefatos nem usado em chamadas de mutação. Não extrair tokens de memória de processo.

## 2026-10-11 — D2: Não reiniciar o Cockpit nesta fase
**Decisão:** preservar o processo e as sessões existentes enquanto a origem canônica do helper e a persistência completa da sessão não forem reconciliadas.
**Justificativa:** o processo ativo usa a instância principal, o launcher documenta notebook, e a configuração do helper aponta para um caminho inexistente. Há estado persistido, mas reiniciar ainda pode interromper panes restaurados.
**Efeito:** investigação segue por leitura; reinício exige plano de preservação e validação.

## 2026-10-11 — D3: Usar o contrato documentado do DSH
**Decisão:** usar HTTP JSON-RPC em POST /api/<method> e WebSocket em /api/events.mux e /api/events.host; não tratar 404 em rotas REST não documentadas como falha do canal.
**Justificativa:** o contrato oficial atualizado no main@460d6e6f descreve esse transporte.
**Evidência:** sessão de teste neutra completou com assistant/message, turn/end e running=false.
**Limite:** o teste valida o transporte DSH, não o binding de identidades dos panes.

## 2026-10-11 — D4: Participação de agentes não presumida
**Decisão:** papéis listados na Issue #434 permanecem planejados até existir entrega real.
**Justificativa:** nenhuma convocação/entrega independente foi comprovada para Emily/Sofia nesta fase.
**Efeito:** nenhuma mensagem será considerada entregue sem turno real, identidade e URL de conversa verificadas.

## 2026-10-11 — D5: Não reconfigurar o helper para clone ainda não reconciliado
**Decisão:** não alterar o processo ativo nem apontar MCF_REPO_PATH para um clone local sem escolher e validar a origem canônica.
**Justificativa:** o clone principal visível está 282 commits atrás de origin/main e tem alterações locais; o clone limpo usa refs de setembro; o clone de continuidade está numa branch histórica.
**Efeito:** discovery canônica permanece parcialmente degradada até resolver a origem do checkout.

## 2026-10-11 — D6: Smoke E2E neutro no DSH passou
**Decisão:** registrar a prova de transporte sem confundi-la com a reconciliação completa.
**Evidência:** sessão session-a2c17442-8f20-4a59-84f5-74074a1d6688, preset mcf, marcador MCF_CUIDABEM_002_DSH_E2E_ACK_20261011 confirmado no histórico; turn/end completed; running=false; zero tool calls/results.
**Limite:** a sessão de teste está em /tmp e não vincula Emily/Sofia aos panes Dual Browser.

## 2026-10-11 — D7: Preservar conversas restauradas não vinculadas
**Decisão:** não executar bootstrap nem enviar prompts aos panes atuais enquanto Emily/chat e Sofia/workspace estiverem UNBOUND.
**Justificativa:** as conversas restauradas não têm evidência suficiente de correspondência com as identidades canônicas.
**Efeito:** reconciliação dos panes exige um fluxo de binding autorizado e verificável.
