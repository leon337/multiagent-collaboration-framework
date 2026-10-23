# MCF-20261022-AGENT-STUDIO-MVP-001

Missão: https://github.com/leon337/multiagent-collaboration-framework/issues/467
Autoridade humana: LEANDRO
Coordenador: MESTRE
Risco: B — laboratório local reversível
Base verificável: main@460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615

## Objetivo
Construir primeiro MVP do Agent Studio, aplicação que edita por conversa e painel visual os rascunhos de agentes do DeepSeek Harness, com testes e restauração sem tocar no preset ativo.

## Plano de fases

| Fase | Entrega | Aceite |
|---|---|---|
| 01 PLAN | Requisitos, MVP, limites | Contrato aprovado pela solicitação |
| 02 STRATEGY | Arquitetura e proteção do perfil DSH | Escrita exclusiva no rascunho |
| 03 REGISTER | Issue #467, branch isolada | Missão rastreável |
| 04 IMPLEMENT | UI, API local e fluxo de edições | Código executa |
| 05 VALIDATE | Testes automatizados, HTTP e interface | Resultado comprovado |
| 06 HANDOFF | README, checkpoint e PR | Evidência e próximos passos |

## Decisões e riscos
- Reuso do Hello World Agent; nunca sobrescrever fonte nem arquivo ativo do perfil Web.
- Node.js padrão, sem dependências npm, bind no 127.0.0.1:4317.
- Interpretador guiado offline; 9Router opcional com chave apenas em memória.
- Propostas ficam pendentes até aceite; histórico versionado e restauração.
- Ferramentas permitidas apenas calculadora e relógio; outras recusadas.
- Publicação do preset ativo, plugins arbitrários, APIs externas destrutivas e deploy público estão fora do MVP.

## ESEV — evidência cronológica
1. MESTRE confirmou o GitHub remoto e HEAD local clean; leu Handbook e Protocolo Unificado.
2. MESTRE definiu fluxo produto e mitigou riscos de aplicação de código não confiável.
3. MESTRE registrou Issue #467 e abriu branch isolada.
4. MESTRE implementou backend, interface, testes e documentação.
5. Validação foi executada com Node.js e HTTP; resultados no checkpoint final.
6. Handoff mantém o laboratório isolado de produção e preserva o gate humano para publicação futura.

## Critérios
- [x] Issue de missão no MCF.
- [x] UI web conversacional e painel visual.
- [x] Gerar e visualizar proposta antes de aplicar.
- [x] Salvamento com versões e restauração.
- [x] Teste de resposta e ferramentas locais.
- [x] Bloqueio de ferramentas e comandos desconhecidos.
- [x] 9Router opcional com chave efêmera.
- [ ] Teste 9Router com chave real: opcional, não bloqueia laboratório offline.
- [ ] Instalar novos presets no DSH: adiado, exige fluxo separado de publicação.

## Continuidade
Próximo incremento possível: geração de bundle DSH, dry-run isolado, validação de montagem, diff de código e gate de publicação controlado por LEANDRO.

## Checkpoint adicional — integração real do DSH (2026-10-22)

A limitação inicial de rascunhos foi removida **somente para o preset Hello World do perfil Web**. Novo adaptador Cordis dsh-plugin-v2.mjs; publicação controlada por proposta, revisão, confirmação, SHA256 e backup íntegro; nova sessão DeepSeek Harness lê revisão publicada via HMR. Foi comprovada a mudança de resposta Hello World! para MCF Agent Studio integrado! e, em etapa posterior, execução real da ferramenta agent_studio_calculator retornando 30 para (8+7)*2. Uma chamada não aprovada a list_agents foi bloqueada em runtime. Publicação e reversão foram verificadas pela interface com CDP.

- Evidência: docs/missions/MCF-20261022-AGENT-STUDIO-REAL-INTEGRATION.md
- Serviço: mcf-agent-studio.service, somente 127.0.0.1:4317, habilitado e ativo.
- Aplicação: testes Node e browser com cenários de rollback, guard e publicação.
- Não afirmar finalização de geração por 9Router no Studio: /v1/models listou 129 IDs, mas geração necessita chave própria informada pelo operador. O DSH usou seu modelo já configurado.
- O PR #468 permanece em rascunho, sem autorização de merge ou exposição pública.
