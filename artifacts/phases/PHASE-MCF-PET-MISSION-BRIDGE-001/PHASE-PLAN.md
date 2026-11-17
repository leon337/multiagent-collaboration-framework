# MCF-PET-MISSION-BRIDGE-001 — plano de integração

Autoridade: LEANDRO. Orquestração: MESTRE.
Fonte canônica: leon337/multiagent-collaboration-framework.
Base de desenvolvimento: PR #535, dependente dos PRs #533 e #534.

Objetivo: disponibilizar leitura de missões reais e transformar uma proposta
revisada para planejamento num contrato local válido para a rota canônica
POST /v1/mcf/missions, SEM invocar essa rota nem simular uma missão criada.

MVP:
1. Reutilizar observador de missões que acessa via token de leitura
   exclusivamente o runtime canônico; sem fallback para dados fictícios.
2. Expor estado de disponibilidade, missão e fase verificadas no painel.
3. Exportar propostas reviewed_for_planning com controle de versão e
   idempotência para formato CreateMcfMissionRequest.
4. Persistir contrato somente como LOCAL_DRAFT_ONLY com SHA256; sem execução.
5. Registrar entrada no formato do Capability Registry com conexão INACTIVE.
6. Integrar à interface de revisão autenticada (cookie/CSRF/Origin).
7. Validar testes, revisão, rollback e ausência de alterações runtime.

Dependências para conexão operacional:
- endpoint do Mission Control read-only implantado e acessível;
- token dedicado read-only distinto de credenciais de dispatch/escrita,
  configurado em arquivo de modo 0600;
- autenticação humana canônica do MissionRuntime para posterior importação;
- PermissionEngine/HDF antes de criação ou execução de missão.
