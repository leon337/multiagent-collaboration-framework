# MCF-DEC-062 — Gate E e Release Candidate v1.0.0-RC1

**Status:** EM_REVISÃO  
**Classificação:** DECISÃO OPERACIONAL CLASSE C  
**Missão:** MCF-RELEASE-CANDIDATE-GATE-E  
**Issue:** #121  
**Baseline:** `main@c5758c2e38b599ae1673cda2691ef2ce0dc2a411`

## 1. Problema observado

O MCF concluiu os boundaries técnicos previstos antes do Release Candidate, mas ainda não possui uma versão candidata formal, tag/release registrada nem um Gate E executado sobre evidência nova vinculada ao SHA exato do candidato.

## 2. Regra anterior

O plano canônico do `MCF-RUNTIME-006` encerra em `Release Candidate / Gate E` como próximo boundary e mantém produção bloqueada.

## 3. Mudança proposta

Executar uma fase de qualificação de release, sem expansão funcional, para produzir a primeira versão candidata:

`v1.0.0-RC1`

A RC somente pode ser publicada depois que os critérios da Issue #121 forem satisfeitos no SHA candidato exato e Léo emitir decisão aprovadora.

## 4. Boundary

Permitido:

- documentação e PRF do Gate E;
- validação integral aplicável;
- reteste e auditoria independente;
- staging no SHA exato do candidato;
- correção mínima via CAF quando um blocker real impedir a RC;
- branch, PR, merge governado, tag e GitHub Release da RC após gate aprovador.

Proibido:

- produção;
- promoção para `v1.0.0` estável;
- nova funcionalidade sem relação causal com blocker do Gate E;
- mudança de autoridade, finalidade ou público;
- ação destrutiva;
- sucesso com evidência de SHA supersedido.

## 5. Critérios materiais

A promoção para RC exige simultaneamente:

- `16` skills registradas;
- `16` skills executáveis;
- `0` skills documentais;
- Foundation, build, migrations e testes aplicáveis em PASS;
- Container Smoke em PASS;
- documentação em PASS;
- staging vinculada ao SHA candidato com readiness/version verificadas;
- HDF, TEAM_FIRST, permissões, receipts/ledger, idempotência, CAF, observabilidade, handoffs e close-phase sem regressão bloqueante;
- arquitetura, avaliação de agentes, segurança e governança em PASS;
- zero finding crítico ou alto aberto;
- PRF Classe C completo e auditável;
- auditoria independente de Emily em PASS;
- decisão aprovadora de Léo;
- limitações conhecidas registradas.

## 6. Impacto

A decisão cria apenas o boundary formal de qualificação da RC. Ela não altera os contratos de execução do runtime nem concede nova autoridade de produção.

## 7. Riscos e controles

- **stale SHA:** qualquer mudança invalida evidência anterior e exige reteste do novo SHA;
- **release prematura:** tag/release só após Gate E aprovador;
- **scope creep:** alteração funcional só por CAF ligado a blocker demonstrável;
- **regressão oculta:** reteste final e auditoria independente obrigatórios;
- **confusão RC/estável:** `v1.0.0` estável e produção permanecem bloqueados.

## 8. Versão de vigência

Esta decisão permanece `EM_REVISÃO` durante a qualificação e só se torna `VIGENTE` quando reconciliada após a publicação válida da `v1.0.0-RC1`.

## 9. Artefatos afetados

- Issue #121;
- `artifacts/phases/PHASE-006-GATE-E-RELEASE-CANDIDATE/`;
- `docs/releases/MCF-v1.0.0-RC1.md`;
- documentação canônica de estado após conclusão.
