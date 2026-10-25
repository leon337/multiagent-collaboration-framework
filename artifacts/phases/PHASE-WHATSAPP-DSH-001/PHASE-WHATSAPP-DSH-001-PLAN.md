# MCF-WHATSAPP-DSH-001 — Plano da fase

- mission_id: MCF-WHATSAPP-DSH-001
- phase_id: PHASE-WHATSAPP-DSH-001
- cycle: 1
- risk_class: C — identificação de remetente, mensagens privadas e integração externa
- current_state: AGUARDANDO_DEPENDENCIA_EXTERNA
- objective: criar agente que responda pelo WhatsApp usando sessão real do DeepSeek Harness no notebook
- expected_outcome: texto recebido autenticado → sessão DSH persistente → resposta devolvida por WhatsApp
- branch: feat/mcf-whatsapp-dsh-20261025, originada do main 460d6e6 em 2026-10-25
- repository: leon337/multiagent-collaboration-framework
- human_authority: LEANDRO
- operational_authority: LÉO (gates internos sob boundary vigente)
- orchestrator: MESTRE
- evidence: README canônico, protocolo operacional de agentes, DSH 0.2.0-rc.2 instalado, gateway ativo no notebook

## Escopo autorizado

Implementar um gateway local isolado; autenticar webhooks; permitir lista explícita de remetentes; persistir identidade de sessão DSH; construir perfil headless conversacional com ferramentas desativadas; testar localmente sem custos pagos; preparar configuração da Meta.

## Fora de escopo e proibições

Não tocar no perfil `nilton-lab`, nos projetos de Nilton Bebidas, nas credenciais de terceiros, no DSH Web em execução, nos presets ativos, nem em deploys/serviços de produção. Não executar ordens remotas do WhatsApp, não usar modelos pagos automaticamente, não liberar endpoint público sem autenticação e TLS, não afirmar que o WhatsApp foi testado sem prova.

## Equipe / trilhas

MESTRE — execução técnica e rastreabilidade, com ferramentas de GitHub e Remote Desktop Commander. Trilhas previstas: Renato (testes), Beatriz (comportamento/modelo), Júlia (dados pessoais/segurança), Augusto (trace), Carmem (PRF), Gabriel (integração), Emily (auditoria). **A participação cognitiva independente desses agentes não foi executada nem simulada.** Os critérios dessas trilhas permanecem sujeitos a revisão independente.

## Critérios de aceite

1. Gateway recebe GET/POST e verifica Meta HMAC e allowlist — PASS, testes locais.
2. Persistência, retomada de sessão e deduplicação — PASS com fake DSH.
3. Perfil isolado DSH com ferramentas perigosas desativadas — PASS em configuração efetiva.
4. Resposta real DSH através do 9Router — BLOCKED, rota free selecionada recebeu 429/QUOTA.
5. Conversa real ida-volta WhatsApp — BLOCKED, falta conta Meta, token, identificador de número, endpoint HTTPS e número autorizável.
6. Integridade Nilton/produção — preservada (nenhuma alteração/restart realizado).
7. Gate classe C e autorização de publicação pública — NOT_AUTHORIZED.

## Dependências / HUMAN_GATE

LEANDRO deve indicar conta/número que deseja usar e habilitar Cloud API/credenciais oficiais em armazenamento local privado. Escolher modelo sem custo cujo limite ainda esteja disponível; se houver custo, solicitar autorização expressa antes de utilizá-lo. Somente ativar exposição pública depois de testes e governança.

## Autorização adicional — 2026-10-25

LEANDRO autorizou utilizar o número **de teste da Meta** como remetente do novo agente. Não autorizou converter o WhatsApp pessoal em número business/cloud, nem utilização de modelos pagos, publicação pública ou merge. A obtenção de tokens e a verificação de destinatário seguem pendentes.
