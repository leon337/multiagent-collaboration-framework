# PHASE-01 — Decisões

## 2026-10-11 — D1: Não contornar a autenticação da Agent Bridge
**Decisão:** não tentar reconstruir/extrair o token da memória do processo nem inventar credencial.
**Justificativa:** o protocolo fornece descriptor local como mecanismo suportado; o descriptor não foi localizado.
**Efeito:** discovery autenticado fica bloqueado até encontrar o caminho de persistência correto.

## 2026-10-11 — D2: Não reiniciar o Cockpit nesta fase
**Decisão:** preservar o processo e as sessões existentes enquanto o estado persistente não puder ser verificado.
**Justificativa:** processo ativo e launcher esperado divergem em porta/instância; o diretório de dados esperado não está visível e reiniciar pode perder estado em memória.
**Efeito:** investigação segue por leitura; reinício exige plano de preservação e validação.

## 2026-10-11 — D3: Não inferir uma API DSH a partir do bundle
**Decisão:** não enviar mensagens a endpoints REST inferidos nem tratar RPC interno do cliente como API externa.
**Justificativa:** probes REST testados retornaram 404 e não foi encontrada documentação de endpoint externo autorizado.
**Efeito:** teste E2E permanece bloqueado; continuar buscando contrato de conexão suportado.

## 2026-10-11 — D4: Participação de agentes não presumida
**Decisão:** papéis listados na Issue #434 permanecem planejados até existir entrega real.
**Justificativa:** nenhuma convocação/entrega independente foi comprovada nesta fase.
