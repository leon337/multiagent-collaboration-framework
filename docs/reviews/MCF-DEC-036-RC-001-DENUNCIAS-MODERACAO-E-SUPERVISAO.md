# MCF-DEC-036-RC-001 — Auditoria de Denúncias, Moderação e Supervisão

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Coordenação:** Mestre  
**PR:** #31  
**Estado:** CONCLUÍDO

## Escopo auditado

- denúncias autenticadas e alvos fechados;
- agrupamento de denúncias duplicadas;
- prioridade por risco;
- papéis internos `MODERATOR` e `SUPERVISOR`;
- fila protegida e paginação estável;
- claim idempotente;
- medidas reversíveis;
- recurso pelo responsável elegível;
- reversão por supervisor;
- visão operacional sem dados pessoais;
- trilha de eventos e auditoria.

## Evidências

```yaml
workflow_tecnico: 30790156865
workflow_documental: 30790156899
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_0009_0010_first_run: PASS
migrations_0009_0010_second_run: PASS
report_grouping_tests: PASS
operator_access_tests: PASS
claim_idempotency_tests: PASS
reversible_action_tests: PASS
appeal_and_reversal_tests: PASS
supervision_overview_tests: PASS
build: PASS
documentation_validation: PASS
ci_permissions: READ_ONLY
```

## Controles confirmados

- somente humanos autenticados criam denúncias;
- alvos ocultos ou inexistentes produzem resposta uniforme;
- repetição pelo mesmo autor é idempotente;
- autores diferentes incrementam o mesmo caso ativo;
- segurança e conteúdo ilegal recebem prioridade urgente;
- a fila exige papel interno ativo;
- agentes não recebem papéis nem executam moderação;
- ações restritivas preservam estado anterior e novo;
- `PAUSE_AGENT` e `ARCHIVE_COMMUNITY` exigem supervisor;
- não existe exclusão física;
- recurso exige vínculo legítimo com o alvo;
- reversão restaura o alvo e mantém histórico imutável;
- métricas do overview não expõem identidade de usuários.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 6
```

- **LOW-001:** provisionamento de moderadores e supervisores ainda é operacional e não possui interface administrativa;
- **LOW-002:** rate limiting específico de denúncias e fila ainda depende da fase de prontidão;
- **LOW-003:** alertas de SLA para casos urgentes ainda não foram implementados;
- **LOW-004:** testes de alta concorrência para agrupamento e claim permanecem pendentes;
- **LOW-005:** políticas jurídicas e editoriais para cada motivo ainda precisam ser publicadas;
- **LOW-006:** falta um teste isolado para todas as combinações de papel, alvo e ação de alto impacto.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
merge_blocked: false
producao_pronta: false
deploy_publico_imediato: false
```

A Fase 1.8 atende ao escopo funcional e pode seguir ao gate de Léo. As reservas devem integrar a Fase 1.9 — Prontidão para Produção.