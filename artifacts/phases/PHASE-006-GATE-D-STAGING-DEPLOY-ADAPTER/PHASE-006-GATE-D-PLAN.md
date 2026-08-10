# PHASE-006-GATE-D — Plano de Execução

## Missão

`MCF-RUNTIME-006-GATE-D`

Issue: `#83`

Base: `1c58b4ba280bd32f587c2f042e35a2dba1a123a9`

Objetivo: implementar o adapter formal de deploy verificado para **staging** no runtime do MCF, reutilizando o mecanismo comprovado pelo RUNTIME-005 e mantendo a ativação real do provider fora desta fase de implementação.

## Ciclo 1 — implementação histórica

Equipe registrada na execução original:

- Mestre — orquestração e continuidade do loop;
- Sofia — arquitetura e fronteiras de segurança;
- Rafael — implementação do adapter/runtime;
- Gabriel — branch, commits, PR e integração;
- Renato — testes, CI e regressões;
- Ricardo — segurança de credenciais, permissões e fail-closed;
- Emily — auditoria independente/gate técnico;
- Augusto — rastreabilidade e observabilidade da missão;
- Léo — gate operacional delegado.

Esse registro é preservado como histórico e não é reescrito retroativamente.

## Ciclo 2 — retomada e reconciliação metodológica

A retomada de 2026-08-10 aplica o protocolo operacional 1.1 e a matriz oficial de 29 agentes. A seleção continua dinâmica: agentes sem entrega concreta não são convocados apenas para simular participação.

Classificação conservadora desta retomada: **Classe C**, porque o Gate D trata autonomia/tool calling com potencial efeito externo em staging, ainda que o provider live permaneça desativado durante a implementação.

Equipe do ciclo 2:

- Mestre — reabre o contrato, mantém ESEV e coordena os handoffs;
- Miriam — obrigatória na retomada; reconcilia fonte de verdade, histórico e checkpoint;
- Sofia — confirma fronteiras arquiteturais do control plane;
- Rafael — responde por eventuais correções técnicas do runtime;
- Bruno — owner da skill `MCF-DEPLOY-VALIDATE`; valida CI/CD, staging, recuperação e confiabilidade;
- Gabriel — co-owner da skill, responsável por GitHub/PR/release e integração;
- Renato — valida CI, smoke, regressões e inevitabilidade de qualquer fallback;
- Ricardo — valida segredos, permissões e fail-closed;
- Carmem — coordena consistência e completude do PRF;
- Augusto — obrigatório em Classe C e na retomada; verifica trace, handoffs, falhas e HDF;
- Beatriz — obrigatória por autonomia/tool calling; avalia comportamento do fluxo automatizado e regressões do agente/runtime;
- Júlia — obrigatória em Classe C e autonomia/tool calling; valida governança, responsabilidade, permissões e limites;
- Emily — auditoria independente do processo, evidências, PRF e HDF;
- Léo — autoridade operacional do gate e continuidade.

Os demais agentes oficiais permanecem disponíveis, mas não entram neste ciclo sem lacuna objetiva de competência, conforme a regra `agente_sem_entrega: proibido`.

## Escopo

1. GitHub Actions como control plane do deploy;
2. Render permanece atrás do deploy hook protegido no Actions;
3. correlação determinística `request_id + release_sha + mission_id + phase_id`;
4. SHA exato e staging-only;
5. precondition `/health/version` + `/health/ready`;
6. reconciliação idempotente antes de retry;
7. timeout inferior ao lease externo de 10 minutos;
8. reconciliação assíncrona durável quando o workflow ultrapassa o deadline do adapter;
9. verificação pós-workflow do SHA e readiness;
10. recuperação somente como redeploy do SHA saudável anterior;
11. driver de deploy executado a partir da revisão confiável do control plane, separado do release alvo;
12. receipt assinado, evidence binding e ledger;
13. testes unitários/integrados/segurança;
14. provider live permanece desativado;
15. reconciliar o PRF com a metodologia vigente antes do Gate de Léo.

## Fora do escopo

- produção;
- inserir `RENDER_DEPLOY_HOOK_URL` no runtime;
- rollback nativo do Render;
- deploy real disparado pelo novo adapter durante implementação;
- adicionar o staging adapter ao `AdapterRegistry` live;
- mudanças destrutivas de banco;
- repetir A1/A2/C1/C2;
- convocar os 29 agentes de forma decorativa.

## Critérios de aceite

Os critérios técnicos canônicos são os definidos na issue #83.

Critérios de governança adicionados pela retomada:

- fonte de verdade reconciliada por Miriam;
- owners da skill de deploy representados no ciclo ativo;
- gatilhos de Augusto, Beatriz e Júlia cumpridos;
- PRF consistente e auditável;
- HDF com `human_operator_actions: 0` enquanto houver alternativa de equipe;
- CI e revisão independente novamente vinculadas ao HEAD final após esta reconciliação documental.

## Fluxo do ciclo 2

```text
Mestre
→ Miriam
→ Sofia
→ Bruno/Gabriel
→ Rafael (se houver correção técnica)
→ Renato
→ Ricardo
→ Beatriz
→ Júlia
→ Carmem
→ Augusto
→ Emily
→ Léo
→ Mestre
```

Handoffs podem retornar a agentes anteriores quando um achado exigir remediação.

## Estado atual pré-gate

O HEAD técnico `7b2b4184d3475fd741e4951f0373897a78b12030` obteve Foundation e Container Smoke em PASS e revisão Codex sem major issues. A reconciliação metodológica altera apenas documentação/PRF e, portanto, cria novo HEAD que deve receber novamente CI e revisão independente antes de qualquer decisão de prova real em staging.

```yaml
objective_state: GOVERNANCE_RECONCILIATION
implementation: APPLIED
live_registry: DISABLED
real_provider_dispatch_test: NOT_AUTHORIZED_IN_IMPLEMENTATION_PHASE
production: BLOCKED
previous_exact_head_ci: PASS
previous_independent_review_exact_head: PASS_NO_MAJOR_ISSUES
reconciled_exact_head_ci: PENDING
reconciled_independent_review_exact_head: PENDING
leo_gate: PENDING
human_operator_actions: 0
```
