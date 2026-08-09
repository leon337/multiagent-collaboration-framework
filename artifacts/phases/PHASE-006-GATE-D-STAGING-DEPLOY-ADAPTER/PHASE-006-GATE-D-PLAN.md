# PHASE-006-GATE-D — Plano de Execução

## Missão

`MCF-RUNTIME-006-GATE-D`

Issue: `#83`

Base: `1c58b4ba280bd32f587c2f042e35a2dba1a123a9`

Objetivo: implementar o adapter formal de deploy verificado para **staging** no runtime do MCF, reutilizando o mecanismo comprovado pelo RUNTIME-005 e mantendo a ativação real do provider fora desta fase de implementação.

## Equipe selecionada

- Mestre — orquestração e continuidade do loop;
- Sofia — arquitetura e fronteiras de segurança;
- Rafael — implementação do adapter/runtime;
- Gabriel — branch, commits, PR e integração;
- Renato — testes, CI e regressões;
- Ricardo — segurança de credenciais, permissões e fail-closed;
- Emily — auditoria independente/gate técnico;
- Augusto — rastreabilidade e observabilidade da missão;
- Léo — gate operacional delegado.

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
14. provider live permanece desativado.

## Fora do escopo

- produção;
- inserir `RENDER_DEPLOY_HOOK_URL` no runtime;
- rollback nativo do Render;
- deploy real disparado pelo novo adapter durante implementação;
- adicionar o staging adapter ao `AdapterRegistry` live;
- mudanças destrutivas de banco;
- repetir A1/A2/C1/C2.

## Critérios de aceite

Os critérios canônicos são os definidos na issue #83.

## Fluxo

```text
Mestre
→ Sofia
→ Rafael
→ Renato
→ Ricardo
→ Emily
→ Léo
→ Mestre
```

Handoffs podem retornar a agentes anteriores quando um achado exigir remediação.

## Estado atual pré-gate

```yaml
objective_state: CANDIDATE_UNDER_VALIDATION
implementation: APPLIED
live_registry: DISABLED
real_provider_dispatch_test: NOT_AUTHORIZED_IN_IMPLEMENTATION_PHASE
production: BLOCKED
final_exact_head_ci: PENDING
independent_review_exact_head: PENDING
leo_gate: PENDING
```
