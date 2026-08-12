# Production Readiness Matrix — MCF-PRODUCTION-READINESS-001

**Baseline de abertura:** `main@e46de554f1340edc3bd842e28f17bab5aaec7e6c`  
**RC1 imutável:** `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`  
**Regra:** evidência histórica não equivale a `PASS` atual.

| # | Dimensão | Estado | Evidência/ação requerida |
|---:|---|---|---|
| 1 | Integridade / artefatos imutáveis | A_REVALIDAR | verificar tag, target, release, digests e proveniência |
| 2 | CI / Foundation / Container Smoke | A_REVALIDAR | runs atuais vinculados a SHA elegível |
| 3 | Segurança | A_REVALIDAR | revisão atual; zero critical/high aberto |
| 4 | Configuração / secrets | A_REVALIDAR | configuração segura, escopo mínimo e ausência de exposição |
| 5 | Infraestrutura | A_REVALIDAR | recursos reais, ambientes separados e dependências materiais |
| 6 | Staging / pré-produção | A_REVALIDAR | SHA exato saudável, readiness e version |
| 7 | Migração / DB | A_REVALIDAR | migrations repetíveis/compatíveis e integridade atual |
| 8 | Observabilidade | A_REVALIDAR | logs, métricas, alertas e correlação atuais |
| 9 | Backup / recovery | A_REVALIDAR | backup verificável e restore ensaiado |
| 10 | Rollback / recuperação | A_REVALIDAR | recuperação controlada comprovada; sem falsa alegação de rollback nativo |
| 11 | Health / readiness / liveness | A_REVALIDAR | probes atuais, sem vazamento de segredo |
| 12 | Estratégia de deploy | A_REVALIDAR | SHA exato, serialização, canário/controle, abort criteria |
| 13 | Release / versão / tag | A_REVALIDAR | RC1 → produção → avaliação estável como milestones separados |
| 14 | Resposta a incidente | A_REVALIDAR | runbooks e responsabilidades atuais |
| 15 | Smoke pós-deploy | BLOQUEADO_ATE_ROLLOUT | procedimento deve ser validado antes; evidência real somente após deploy |
| 16 | Aprovação / auditoria | A_REVALIDAR | PRF + Augusto trace + Júlia governança + Emily auditoria + Léo decisão |

## Baseline histórico reutilizável somente como referência

- MCF-DEC-043: ferramentas e procedimentos de backup/restore/observabilidade aprovados sob gate final, com dependências materiais externas ainda condicionais no momento histórico.
- MCF-DEC-045: artefatos de infraestrutura/rollout aprovados, porém sem prova material completa de registry, banco externo, domínio, backup externo, alertas, logs e segredos reais naquele boundary.
- MCF-DEC-058: deploy verificado e recuperação por redeploy de SHA saudável anterior validados em staging; banco não é automaticamente revertido.
- MCF-DEC-062/Gate E: RC1 qualificada e publicada como prerelease, sem autorização automática de boundary posterior.

## Regra de fechamento

Uma linha só pode migrar para `PASS` quando existir evidência verificável atual, identificada por SHA, run, recurso, teste, probe, artefato ou decisão aplicável. `FAIL`, `BLOCKED`, `PARTIAL` e `NAO_APLICAVEL` devem registrar justificativa e próximo passo.