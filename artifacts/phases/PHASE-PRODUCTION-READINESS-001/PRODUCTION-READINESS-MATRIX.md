# Production Readiness Matrix — MCF-PRODUCTION-READINESS-001

**Baseline de abertura:** `main@e46de554f1340edc3bd842e28f17bab5aaec7e6c`  
**RC1 imutável:** `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`  
**RC2 prerelease:** `v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719`  
**Head de produção qualificado:** `cf6cf42bdff923e44ccc7603058edc66f079f369`  
**Regra:** produção e versão estável são milestones separados.

| # | Dimensão | Estado final | Evidência |
|---:|---|---|---|
| 1 | Integridade / artefatos imutáveis | PASS | RC1 preservada em `9b4a759...`; RC2 possui identidade separada; head final `cf6cf42...` |
| 2 | CI / Foundation / Container Smoke | PASS | PR #126 convergiu Foundation/Container Smoke/Readiness; pós-merge run `31602905916` green e staging run `31602905900` green |
| 3 | Segurança | PASS | dependency audit sem high conhecida; controle de cadastro por allowlist; testes de convidado/não convidado; secrets fora do Git |
| 4 | Configuração / secrets | PASS | Render/Neon/CORS materializados; variáveis protegidas no provider; `REGISTRATION_ALLOWLIST` configurada sem registrar valor secreto no PRF |
| 5 | Infraestrutura | PASS | `rsa-api-free`, `rsa-web-free` e Neon dedicado materializados; API e web em LIVE |
| 6 | Staging / pré-produção | PASS | exact-SHA `cf6cf42...` implantado após convergência, deploy `dep-d9u7o3m417fc73fudeqg`; run `31602905900` PASS |
| 7 | Migração / DB | PASS | migrations duas vezes + full tests; backup/restore isolado preservou ledger |
| 8 | Observabilidade | PASS | logs estruturados/correlationId/readiness 200; métricas Render; monitor GitHub Issues a cada 5 min habilitado no closeout |
| 9 | Backup / recovery | PASS | snapshot Neon pré-rollout; backup SHA-256 + restore real isolado; sem restore destrutivo em produção |
| 10 | Rollback / recuperação | PASS | recovery por SHA validado em staging; deploy anterior identificável; runbooks vigentes; safety snapshot preservado |
| 11 | Health / readiness / liveness | PASS | `/health/ready` repetidamente 200 no provider; serviço final inicializou em production |
| 12 | Estratégia de deploy | PASS | rollout controlado executado; canário funcional observado por ~90 min, acima do mínimo de 60 min |
| 13 | Release / versão / tag | PASS | RC1 preservada; RC2 separada; produção vinculada a SHA qualificado; stable `v1.0.0` não promovida automaticamente |
| 14 | Resposta a incidente | PASS | RSA-INCIDENT-RESPONSE + RSA-SLO-AND-ALERTS + RSA-ROLLBACK + monitor por GitHub Issues |
| 15 | Smoke pós-deploy | PASS | API `rsa-api-free` LIVE, web `rsa-web-free` LIVE, readiness HTTP 200, zero logs `error` no intervalo de canário e no pós-deploy final verificado |
| 16 | Aprovação / auditoria | PASS | PRF Classe C reconciliado; trace, governança, documentação, audit role e decisão interna LÉO registrados no closeout |

## Findings tratados

### PRD-001 — ordem incorreta do readiness CI

Corrigido: migrations precedem a suíte de integração em PostgreSQL limpo.

### PRD-002 — restore sem banco alvo explícito

Corrigido: restore exige alvo explícito e foi ensaiado em PostgreSQL isolado.

### PRD-003 — cadastro público irrestrito

Encontrado no primeiro rollout. Corrigido com `REGISTRATION_ALLOWLIST` em produção, validação de configuração e testes de acesso convidado/não convidado.

### PRD-004 — formatação pós-remediação

Run `31597139401` falhou em `Verify formatting`. PR #126 aplicou saída canônica do Prettier. Pós-merge `31602905916`: PASS.

### PRD-005 — container smoke sem allowlist

Run `31597139353` falhou porque o smoke production-mode não tinha convite sintético. PR #126 adicionou configuração controlada. Pós-merge staging run `31602905900`: container smoke PASS e deploy PASS.

### PRD-006 — warning futuro de sslmode

Warning do cliente PostgreSQL sobre mudança futura de semântica. Estado atual não apresenta outage nem erro de TLS; acompanhar como dívida de upgrade não bloqueante.

## Resultado

```yaml
readiness_dimensions: 16
pass: 16
material_blockers: 0
production: COMPLETE
stable_v1_0_0: NOT_PROMOTED
```

A evidência detalhada do canário e do pós-deploy está em `PRODUCTION-CANARY-CLOSEOUT-EVIDENCE.md`.
