# PHASE-PRODUCTION-READINESS-001 — DECISIONS

## D-001 — Boundary da missão

**Decisão:** reutilizar o boundary canônico `Prontidão para Produção`; não criar `Gate F`, `GA Gate` ou equivalente.

## D-002 — Evidência histórica

**Decisão:** evidências pré-RC1 são baseline de investigação, nunca `PASS` atual automático.

## D-003 — Separação de milestones

**Decisão:** produção e promoção estável `v1.0.0` permanecem milestones distintos.

## D-004 — Governança vigente

**Decisão:** seguir o protocolo vigente: Emily = auditoria independente; Augusto = mission-trace; Júlia = governança Classe C; LÉO = decisão interna; LEANDRO = autoridade humana final.

## D-005 — Human gate

**Decisão:** MCF-DEC-031 já registra a autorização material de produção condicionada à prontidão. Nenhum novo gate nominal/humano foi inventado.

## D-006 — Imutabilidade RC1

**Decisão:** `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8` permanece imutável.

## D-007 — Identidade RC2

**Decisão:** correções operacionais pós-RC1 usam identidade separada `v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719`.

## D-008 — Identidade de deploy Render

**Decisão:** no piloto Render-from-Git, a identidade operacional é SHA Git qualificado + deploy Render + probes de saúde, sem relaxar a imutabilidade das tags.

## D-009 — Alerta do piloto

**Decisão:** GitHub Issues é o canal de alerta zero-custo. O monitor de readiness a cada cinco minutos é habilitado no closeout porque a API pública já existe.

## D-010 — Materialização Blueprint

**Resultado:** a dependência externa foi resolvida por LEANDRO no Render Blueprint; `rsa-api-free` e `rsa-web-free` estão materializados.

## D-011 — Cadastro controlado

**Achado:** o primeiro rollout permitia criação pública de conta sem convite.

**Decisão:** produção exige `REGISTRATION_ALLOWLIST`; cadastro não convidado é negado, cadastro convidado é aceito pelos testes. O valor operacional do convite não é persistido no PRF.

## D-012 — Convergência dos dois failures finais

**Achados:** run `31597139401` falhou em Prettier; run `31597139353` falhou no container smoke sem allowlist.

**Decisão:** PR #126 corrige os dois findings e só foi integrado depois dos gates verdes. O pós-merge `main@cf6cf42bdff923e44ccc7603058edc66f079f369` passou Production Readiness `31602905916` e staging deploy `31602905900`.

## D-013 — Validade da janela canário

**Decisão:** a janela canário funcional é vinculada ao deploy `dep-d9u6f3jncjis7385cdvg` em `cce371417308b92409131c5b40bb4968d0d5ba85`, observado por aproximadamente 90 minutos.

**Fundamento:** a comparação até `cf6cf42...` não altera `registration-policy.ts` nem o fluxo funcional de criação de conta; as mudanças posteriores são validação de boot, testes, Render config, smoke e formatação. Assim, a observação funcional não é invalidada por hardening não semântico posterior. O head final foi adicionalmente implantado e submetido a health/log verification.

## D-014 — Closeout de produção

**Decisão interna LÉO:** `PRODUCTION_READINESS=PASS`.

**Condição:** 16/16 dimensões PASS, canário >= 60 minutos, post-deploy smoke PASS, zero blocker material, recovery/observability ativos.

**Resultado:** `production=COMPLETE`.

**Limite:** `v1.0.0` estável continua `NOT_PROMOTED` e deve ser avaliada separadamente.
