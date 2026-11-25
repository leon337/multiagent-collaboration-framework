# Decisões

1. LEANDRO: autorização explícita para implementar MVP neste chat.
2. MESTRE: construir extensão experimental em worktree separada; não alterar produção.
3. Engenharia: reutilizar Agent Bridge e protocolo de discovery existentes, em vez de novo browser control ou API paga.
4. Engenharia: tratar `openAgentSession` separadamente de `dispatchPaneMission`, pois o Bridge não oferece follow-up genérico para sessões independentes.
5. Segurança: não despachar no estado RECONCILING/ERROR; evitar retry de POST com resultado desconhecido.
6. Auditoria independente: PENDENTE, não simulada.
7. Decisão operacional formal de LÉO: PENDENTE, não simulada.
8. Merge/produção: NÃO AUTORIZADOS nesta fase.
