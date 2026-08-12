# PHASE-PRODUCTION-READINESS-001 — DECISIONS

## D-001 — Boundary da missão

**Decisão:** reutilizar o boundary canônico `Prontidão para Produção`; não criar `Gate F`, `GA Gate` ou equivalente.

**Fundamento:** Gate E encerra MCF-RUNTIME-006 sem autorizar boundary posterior automaticamente; MCF-DEC-038 e decisões correlatas já definem o domínio de prontidão para produção.

## D-002 — Evidência histórica

**Decisão:** tratar evidências pré-RC1 como baseline de investigação, nunca como `PASS` atual automático.

**Consequência:** cada dimensão da matriz exige evidência verificável atual ou justificativa explícita.

## D-003 — Separação de milestones

**Decisão:** produção e promoção estável `v1.0.0` permanecem milestones distintos.

**Consequência:** saúde de produção não cria automaticamente a tag estável.

## D-004 — Governança vigente

**Decisão:** seguir protocolo operacional unificado v1.1 e matriz consolidada de 29 agentes.

**Aplicação:** Emily = auditoria independente; Augusto = mission-trace; Júlia = governança obrigatória Classe C; Léo = decisão de gate interno; LEANDRO = autoridade humana final.

## D-005 — Human gate

**Decisão:** nenhum HUMAN_GATE adicional para descoberta, documentação, correções internas e revalidação técnica desta fase.

**Fundamento:** MCF-DEC-031 registra autorização material de produção, condicionada à prontidão. Gatilhos humanos reservados continuam vigentes e são dirigidos exclusivamente a LEANDRO.

## D-006 — Imutabilidade RC1

**Decisão:** `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8` é entrada imutável e não será movida ou reescrita nesta missão.

## D-007 — Nova identidade do candidato corrigido

**Achado:** a revalidação revelou defeito real no restore PostgreSQL: o `pg_restore` não recebia banco alvo explícito. A correção altera código operacional após a RC1.

**Decisão:** a correção não será atribuída à RC1. O próximo candidato imutável é `v1.0.0-RC2`, sem criação de novo gate nominal. A RC2 só pode ser publicada após merge e requalificação do SHA exato da `main`.

## D-008 — Identidade de deploy no piloto gratuito Render

**Decisão:** para o piloto público gratuito aprovado em `LEO-DEC-002-BLUEPRINT-FULL-STACK-GRATUITO`, a identidade operacional será o commit Git exato qualificado + registro de deploy Render + probes de versão/saúde. O requisito histórico de registry OCI por digest da MCF-DEC-044 não é usado para bloquear a arquitetura Render-from-Git aprovada posteriormente.

**Limite:** isso não autoriza deploy por branch mutável sem registrar o SHA efetivamente implantado, nem relaxa a imutabilidade da tag de release.

## D-009 — Alerta do piloto

**Decisão:** GitHub Issues será o canal de alerta zero-custo para indisponibilidade de readiness, alimentado por workflow a cada cinco minutos. O monitor permanece desabilitado até a URL pública existir, evitando falso incidente antes do provisionamento.

## D-010 — Dependência externa do Blueprint

**Decisão:** o conector Render atual não consegue criar Web Service Docker. O `rsa-api-free` deve ser materializado pelo Blueprint do Render já aprovado e apontado para o repositório oficial. Essa única ação externa será solicitada a LEANDRO apenas quando o candidato pós-merge estiver qualificado, para evitar publicação prematura.
