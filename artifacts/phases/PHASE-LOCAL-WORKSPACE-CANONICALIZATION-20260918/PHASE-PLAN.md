# Plan

Mission: `MCF-LOCAL-WORKSPACE-CANONICALIZATION-20260918`
Class: B
Authority: LEANDRO
Coordinator: MESTRE

Objective: preservar uma regra durável e auditável para seleção do workspace MCF no notebook, sem transformar caminho local em fonte de verdade global.

Acceptance:
- política operacional host-scoped criada;
- boundary da bolha explícito;
- Project Registry v1 preservado sem campos inválidos;
- execução da validação feita no sandbox da bolha;
- fan-out/fan-in com evidência e receipts;
- nenhuma produção tocada.
