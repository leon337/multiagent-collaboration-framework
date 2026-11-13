# PHASE-01 — Plano

- Missão: MCF-CHATGPT-SESSION-GATEWAY-MVP-001
- Classe: B (código experimental, sem produção).
- Autoridade humana: LEANDRO, autorização explícita nesta conversa para implementar.
- Orquestrador: MESTRE.
- Objetivo: conectar o MCF a sessões do ChatGPT usando o Agent Bridge já implementado no Dual Browser.
- Escopo: CLI Node 22, contrato de descoberta, abertura de sessão independente, despacho de missão em pane, leitura de receipt/result, testes e documentação.
- Fora do escopo: merge, deploy, uso de API paga, autenticação de usuário, força de bootstrap, envio de tarefas a sessões independentes sem rota oficial, modificação do runtime central.
- Critérios: isolado em branch; 0 alterações de produção; pelo menos 8 testes; descoberta real segura; falha fechada quando identidade não READY; documentação de limites.
- Riscos: estado de sessão, retry duplicado, token de Bridge, false-green de composer draft, rota externa não suportada, alterações de UI.
- Governança: nenhuma ação externa irreversível; não contornar HUMAN_GATE; auditoria independente pendente.
