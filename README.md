# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, instrumentalização controlada, runtime persistente, evidência verificável, inicialização de chats, documentação por fase, auditoria, versionamento e decisão humana delegada.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.

## Regras operacionais centrais

- trabalho silencioso de agentes é proibido;
- a execução deve ser apresentada na ordem real em que ocorre;
- cada agente selecionado deve mostrar entrada, ação, evidência, resultado, decisão, entrega e passagem no ponto da atuação;
- uma lista retrospectiva dizendo apenas o que cada agente fez não substitui a execução;
- agentes sem entrega real não podem ser listados como participantes;
- toda missão operacional trabalha em loop orientado a objetivo;
- passagens internas aparecem entre os blocos dos agentes e mantêm checkpoint, destinatário, estado, próxima ação e critério de conclusão;
- falhas e recuperações devem permanecer visíveis e retornar ao fluxo original;
- o fluxo continua em uma única resposta cronológica sempre que tecnicamente possível;
- toda fase Classe B ou C gera pacote documental próprio com plano, relatório, validação, smoke, checkpoint, decisões, manifesto SHA-256 e README;
- skills formais definem entradas, ferramentas, permissões, evidências, aceite e fallback;
- agentes não podem escolher ferramentas por preferência ou apenas porque estão instaladas;
- toda ação externa deve produzir evidência verificável;
- confirmações humanas rotineiras são proibidas dentro do escopo já autorizado;
- Léo decide gates internos e escala para Leandro somente matérias reservadas;
- Leandro não pode integrar o contrato técnico, executar fases ou receber handoff técnico;
- falhas recuperáveis seguem o Protocolo CAF e não encerram a missão.

## Runtime executável

O recorte vertical do MCF transforma parte do protocolo em controles de software:

```text
objetivo conversacional
→ Chat-to-Runtime Bridge
→ MissionRuntime
→ SkillRegistryLoader
→ Human Delegation Firewall
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ PostgreSQL e Event Ledger
→ Handoff e recuperação CAF
→ callback de CI
→ trace final verificado
```

### Estado do MVP

```yaml
skills_registradas: 16
skills_executaveis:
  - MCF-START-MISSION
  - MCF-SELECT-AGENTS
  - MCF-IMPLEMENT-CHANGE
  - MCF-REVIEW-CODE
  - MCF-RUN-TESTS
  - MCF-GIT-PR-RELEASE
  - MCF-DEPLOY-VALIDATE
  - MCF-TRACE-MISSION
skills_ainda_documentais: 8
chat_to_runtime_bridge: true
endpoint_de_dispatch: POST_/v1/mcf/chat/dispatch
bloco_interno_inicial: causal_e_persistido
recibos_semanticos:
  - code_review
  - pull_request_and_gate
  - deployment_and_rollback
human_delegation_firewall: true
leandro_em_selectedAgents: bloqueado
leandro_como_executor: bloqueado
leandro_como_handoff: bloqueado
handoff_para_agente_nao_selecionado: bloqueado
risk_downgrade: bloqueado
production_deploy_without_material_gate: bloqueado
mission_completion: final_trace_plus_complete_ledger
ci_callback_closes_mission: false
estado_persistente: true
retomada_por_mission_id: true
recibos_assinados: true
controle_otimista: true
callback_de_CI: true
hierarquia_persistente_de_missoes: true
retorno_automatico_a_missao_pai: true
conclusao_pai_com_submissao_pendente: bloqueada
runtime_006_gate_d: integrado
runtime_006_gate_d_merge: 2dfeb0e23c5c2e19a2c21e6f2c50a1a4f466d06a
staging_post_merge: PASS_DEPLOYED
live_staging_adapter: disabled
production: blocked
publicacao_social_automatica: false
```

O bridge executa somente o bloco interno consecutivo no início do plano. GitHub, CI, Render, Vercel ou Cloudflare continuam exigindo recibos reais. Uma skill interna posicionada depois de uma fase externa permanece planejada até que o fluxo chegue a ela.

A missão só é encerrada por `MCF-TRACE-MISSION` com `final_checkpoint=true` quando o ledger comprova `PHASE_COMPLETED` para todas as skills selecionadas. CI verde conclui a fase de testes, não a missão inteira.

A hierarquia persistente impede que uma missão-pai seja concluída enquanto existir submissão com retorno pendente. Quando a submissão termina, o runtime devolve o bastão ao agente configurado e restaura a missão-pai em execução.

### MCF-RUNTIME-005 — deploy verificado

O MCF-RUNTIME-005 foi encerrado após validar em staging:

- deploy automático condicionado aos gates técnicos;
- verificação do SHA exato implantado;
- sondas de saúde e versão;
- smoke pós-deploy;
- recuperação controlada pelo redeploy do último SHA saudável.

A recuperação atual **não é rollback nativo de artefato do Render**. O mecanismo comprovado republica o commit saudável anterior e verifica novamente saúde e versão.

### MCF-STAB-001 e MCF-RUNTIME-006

A estabilização anterior ao RUNTIME-006 possui rastreamento na issue `#68` e no PR `#69`.

O primeiro controle técnico implementado é a hierarquia persistente de missões:

```text
missão-pai
→ submissão
→ conclusão da submissão
→ retorno obrigatório
→ restauração da missão-pai
```

O MCF-RUNTIME-006 está expandindo a autonomia externa por meio de adapters confiáveis, recibos verificáveis, menor privilégio, idempotência, timeout, retry limitado e recuperação controlada.

#### Gate D — staging integrado

O Gate D do RUNTIME-006 foi implementado e integrado pela issue `#83` e PR `#84`.

```yaml
functional_release_sha: c787179e126a93af96dd67604cb24f91235c4320
closeout_head: ea63828435589a78bafcab916b51b4fc5aea1102
merge_sha: 2dfeb0e23c5c2e19a2c21e6f2c50a1a4f466d06a
post_merge_documentation_run: 31442205293
post_merge_documentation: PASS
post_merge_staging_run: 31442205251
post_merge_staging: PASS
post_merge_outcome: DEPLOYED
health_version_exact_sha: PASS
readiness: PASS
live_staging_adapter: DISABLED
production: BLOCKED
```

O workflow pós-merge implantou e verificou o próprio merge SHA. A verificação de deploy consulta `/health/version` e `/health/ready` e somente retorna `DEPLOYED` quando o SHA observado é exatamente o solicitado e o runtime está ready.

A `MCF-DEC-061-GITHUB-ACTIONS-ONE-SHOT-TEAM-FIRST-FALLBACK.md` formaliza um fallback temporário TEAM_FIRST via GitHub Actions: `GITHUB_TOKEN` efêmero, menor privilégio, branch/ref isolado, binding ao SHA, guard contra duplicidade, single dispatch, correlação e cleanup. A decisão não autoriza merge, produção ou ativação live por si só e não usa token pessoal de Leandro por padrão.

O item restante do Lote 3 é **observabilidade e alertas de missão bloqueada**. Depois dele, o plano segue para as oito skills ainda documentais, isolamento multiagente, auditoria final e RC.

### Documentação do runtime

- `docs/decisions/MCF-DEC-061-GITHUB-ACTIONS-ONE-SHOT-TEAM-FIRST-FALLBACK.md`;
- `docs/decisions/MCF-DEC-059-HIERARQUIA-PERSISTENTE-E-RETORNO-A-MISSAO-PAI.md`;
- `docs/reviews/MCF-DEC-059-RC-001-HIERARQUIA-PERSISTENTE.md`;
- `docs/decisions/MCF-DEC-058-DEPLOY-VERIFICADO-E-RECUPERACAO-AUTOMATICA.md`;
- `docs/decisions/MCF-DEC-057-EXPANSAO-DE-SKILLS-EXECUTAVEIS-E-RECIBOS-SEMANTICOS.md`;
- `docs/decisions/MCF-DEC-056-CHAT-TO-RUNTIME-BRIDGE.md`;
- `docs/decisions/MCF-DEC-055-HUMAN-DELEGATION-FIREWALL.md`;
- `docs/decisions/MCF-DEC-054-RUNTIME-EXECUTAVEL-E-EVIDENCIA-CONFIAVEL.md`;
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`;
- `docs/runtime/MCF-STAB-001-REPORT.md`;
- `docs/runtime/MCF-RUNTIME-SPECIFICATION.md`;
- `docs/runtime/MCF-RUNTIME-API.md`;
- `docs/runtime/MCF-RUNTIME-RECOVERY.md`;
- `docs/runtime/MCF-FIVE-SPRINTS-EXECUTION.md`;
- `docs/runtime/README.md`.

## Inicialização de chats do projeto

O pacote `project-instructions/` evita que chats novos dependam do histórico de uma conversa anterior.

- `MCF-CHATGPT-PROJECT-INSTRUCTIONS.txt` — texto curto para o campo Instruções do projeto;
- `MCF-PROJECT-OPERATING-INSTRUCTIONS.md` — fonte canônica;
- `MCF-STARTUP-CHECKLIST.yaml` — checklist de início de missão;
- `MCF-CHAT-BOOTSTRAP-TESTS.md` — testes em chat totalmente novo;
- `README.md` — instalação e atualização.

A integração do pacote ao GitHub não modifica automaticamente as configurações do projeto ChatGPT. O texto e os arquivos precisam ser adicionados ao projeto e depois testados em chat novo.

## Quatro agentes de controle multiagente

- **Augusto** — Observabilidade Multiagente;
- **Beatriz** — Avaliação de Agentes;
- **Miriam** — Memória e Gestão do Conhecimento;
- **Júlia** — Governança e Compliance de IA.

## Skills e ferramentas

- `skills/registry.yaml` — registro oficial de skills;
- `skills/README.md` — regras de utilização;
- `templates/MCF-SKILL-CONTRACT.yaml` — modelo para novas skills;
- `docs/tools/MCF-AGENT-TOOL-MATRIX.md` — matriz dos 29 agentes;
- `docs/tools/MCF-PLUGIN-PERMISSIONS.yaml` — perfis e limites de permissão;
- `docs/tools/MCF-PLUGIN-EVALUATION.md` — avaliação antes da aprovação;
- `docs/tools/MCF-AVAILABLE-CAPABILITIES.md` — inventário de capacidades;
- `docs/tests/MCF-SKILLS-AND-TOOLING-TESTS.md` — testes de conformidade.

## Documentos principais

- `docs/decisions/MCF-DEC-061-GITHUB-ACTIONS-ONE-SHOT-TEAM-FIRST-FALLBACK.md`;
- `docs/decisions/MCF-DEC-059-HIERARQUIA-PERSISTENTE-E-RETORNO-A-MISSAO-PAI.md`;
- `docs/decisions/MCF-DEC-058-DEPLOY-VERIFICADO-E-RECUPERACAO-AUTOMATICA.md`;
- `docs/decisions/MCF-DEC-057-EXPANSAO-DE-SKILLS-EXECUTAVEIS-E-RECIBOS-SEMANTICOS.md`;
- `docs/decisions/MCF-DEC-056-CHAT-TO-RUNTIME-BRIDGE.md`;
- `docs/decisions/MCF-DEC-055-HUMAN-DELEGATION-FIREWALL.md`;
- `docs/decisions/MCF-DEC-054-RUNTIME-EXECUTAVEL-E-EVIDENCIA-CONFIAVEL.md`;
- `docs/decisions/MCF-DEC-053-INICIALIZACAO-AUTOMATICA-DE-CHATS-DO-PROJETO.md`;
- `docs/decisions/MCF-DEC-052-SKILLS-E-INSTRUMENTALIZACAO-DOS-AGENTES.md`;
- `docs/decisions/MCF-DEC-051-EXECUCAO-SEQUENCIAL-VISIVEL-E-RASTREABILIDADE-POR-FASE.md`;
- `docs/decisions/MCF-DEC-050-QUATRO-AGENTES-DE-CONTROLE-E-PADRAO-OPERACIONAL-UNIFICADO.md`;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`;
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`;
- `templates/MCF-UNIFIED-MISSION.yaml`;
- `templates/phase-traceability/`;
- `docs/decisions/MCF-DEC-016-FLUXO-RESILIENTE-E-CONTINUIDADE-AUTOMATICA.md`;
- `docs/decisions/MCF-DEC-017-DELEGACAO-DE-GATES-INTERNOS-AO-AGENTE-LEO.md`.

## Auditorias externas

Relatórios de Claude ou outro avaliador externo devem ser preservados e respondidos por achado. O estado experimental do framework contextualiza lacunas ainda em definição, mas não invalida automaticamente defeitos, inconsistências ou riscos encontrados.

## Rede Social para Agentes de IA

As mensagens relevantes da construção formam um corpus histórico e conteúdo-semente para publicação futura na própria rede social.

Os registros ficam em `docs/social-seed/`.

Registrar não significa publicar automaticamente. Todo conteúdo passa por classificação, revisão, privacidade e aprovação.

O runtime apenas projeta conclusões verificadas como candidatos `DRAFT_REVIEW`. Nenhum candidato é publicado sem aprovação humana.

## Estado

A composição oficial possui 29 agentes. As decisões MCF-DEC-051 a MCF-DEC-061 tornam obrigatórias a execução sequencial exposta, a rastreabilidade por fase, as skills versionadas, a seleção controlada de ferramentas, o bootstrap de chats, a persistência do runtime, a validação de evidências, o bloqueio de delegação técnica indevida ao humano, a abertura persistente de missões a partir de objetivos conversacionais, a validação semântica de recibos, a conclusão apenas por trace final comprovado no ledger, o deploy verificado com recuperação controlada em staging, o retorno transacional à missão-pai e o fallback TEAM_FIRST one-shot quando o executor normal estiver indisponível e a operação permanecer segura e autorizada.

O estado atual é um MVP técnico avançado em staging com o Gate D do RUNTIME-006 integrado. A produção irrestrita continua bloqueada até a conclusão da observabilidade do Lote 3, dos adapters/capacidades restantes, das oito skills ainda documentais, dos testes multiagente independentes e da auditoria de segurança da release candidate.
