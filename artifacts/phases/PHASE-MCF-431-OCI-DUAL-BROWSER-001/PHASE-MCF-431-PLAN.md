# Plano da fase — MCF-431 OCI + Dual Browser

**Issue:** https://github.com/leon337/multiagent-collaboration-framework/issues/431  
**Fase:** PHASE-MCF-431-OCI-DUAL-BROWSER-001  
**Estado:** IN_PROGRESS  
**Data:** 2026-10-09 (BRT)

## Objetivo
Concluir diagnóstico e validação do browser remoto OCI, transporte CDP/SSE e observabilidade visual SentinelX, preservando a VM atual e a sessão autenticada. Não declarar PASS sem evidência live.

## Escopo
- Validar contrato vigente MCF e runtime discovery antes de operar Dual Browser.
- Validar SentinelX captura e readback de imagem com menor privilégio.
- Validar Dual Browser 0.6.9, Agent Bridge e SSE local com testes automatizados e testes negativos de autenticação/identidade.
- Inventariar OCI read-only; avaliar A1.Flex, cota, capacidade e custo antes de provisionar.
- Validar túnel remoto, serviço cloud-browser, persistência e CDP/SSE ponta a ponta.
- Atualizar documentação e issue com evidências verificáveis.

## Guardrails
- Preservar mudanças pré-existentes no checkout MCF principal; trabalhar neste worktree isolado.
- Não apagar/redimensionar a VM atual antes de plano de preservação e substituta validada.
- Não contornar MFA, políticas OCI, permissões ou bloqueios da camada de segurança.
- Não expor tokens, cookies, IPs públicos/privados ou credenciais.
- Usar CDP/DOM como canal primário; screenshot somente como fallback/validação visual.

## Critérios de aceite
1. SentinelX visual permission corrigida; captura real devolvida e inspecionada.
2. Dual Browser estável; testes CDP/SSE e reconexão passam; benchmark antes/depois quando baseline disponível.
3. VM provisionada dentro dos limites pretendidos, ou impossibilidade A1 comprovada por evidência live de cota/capacidade.
4. Browser OCI remoto acessível pelo Dual Browser com sessão segura.
5. Persistência segura, sem segredos em logs.
6. Relatório final, PRF e handoff rastreáveis.

## Plano sequencial
1. Recuperar estado live e ler protocolo/manual/contrato de UI.
2. Diagnosticar SentinelX e validar captura/readback real.
3. Executar testes locais e live da Bridge/SSE.
4. Inventariar OCI e verificar capacidade/custo sem mutação.
5. Restaurar túnel por caminho autorizado e validar browser remoto.
6. Implementar somente mudanças sustentadas por evidência; testar regressão.
7. Gerar relatório/manifest e atualizar issue; auditoria/gate antes de fechamento.
