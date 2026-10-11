# PHASE-01 — Decisões

## 2026-10-11 — D1: Usar descriptor suportado, sem expor segredo
**Decisão:** ler o descriptor da instância ativa e usar o token somente em memória para chamadas GET autenticadas.
**Justificativa:** o descriptor existe no userData restrito da instância principal; o contrato exige autenticação.
**Controle:** o token não foi impresso, copiado para artefatos nem usado em chamadas de mutação. Não extrair tokens de memória de processo.

## 2026-10-11 — D2: Não reiniciar o Cockpit nesta fase
**Decisão:** preservar o processo e as sessões existentes enquanto a origem canônica do helper e a persistência completa da sessão não forem reconciliadas.
**Justificativa:** o processo ativo usa a instância principal, o launcher documenta notebook, e a configuração do helper aponta para um caminho inexistente. Há estado persistido, mas reiniciar ainda pode interromper panes restaurados.
**Efeito:** investigação segue por leitura; reinício exige plano de preservação e validação.

## 2026-10-11 — D3: Não inferir uma API DSH a partir do bundle
**Decisão:** não enviar mensagens a endpoints REST inferidos nem tratar RPC interno do cliente como API externa.
**Justificativa:** probes REST testados retornaram 404 e não foi encontrada documentação de endpoint externo autorizado.
**Efeito:** teste E2E permanece bloqueado; continuar buscando contrato de conexão suportado.

## 2026-10-11 — D4: Participação de agentes não presumida
**Decisão:** papéis listados na Issue #434 permanecem planejados até existir entrega real.
**Justificativa:** nenhuma convocação/entrega independente foi comprovada nesta fase.
**Efeito:** nenhuma mensagem será considerada entregue sem turno real, identidade e URL de conversa verificadas.

## 2026-10-11 — D5: Não reconfigurar o helper para clone ainda não reconciliado
**Decisão:** não alterar o processo ativo nem apontar `MCF_REPO_PATH` para um clone local sem escolher e validar a origem canônica.
**Justificativa:** o clone principal visível está 282 commits atrás de origin/main e tem alterações locais; o clone de continuidade está numa branch histórica.
**Efeito:** discovery canônica permanece parcialmente degradada até resolver a origem do checkout.
