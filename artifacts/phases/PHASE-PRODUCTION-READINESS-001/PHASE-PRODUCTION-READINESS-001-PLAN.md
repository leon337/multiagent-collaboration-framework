# PHASE-PRODUCTION-READINESS-001 — PLAN

## Contrato

```yaml
mission_id: MCF-PRODUCTION-READINESS-001
parent_mission_id: MCF-RUNTIME-006
phase_id: PHASE-PRODUCTION-READINESS-001
title: Revalidação Classe C de Prontidão para Produção pós-RC1
objective: Revalidar com evidência atual a prontidão do candidato RC1 para um primeiro rollout de produção controlado, preservando a RC1 imutável e separando deploy de produção da eventual promoção estável v1.0.0.
expected_outcome: Production Readiness Matrix fechada, PRF Classe C, auditoria independente, decisão de Léo e checkpoint explícito para rollout ou bloqueio.
risk_class: C
current_state: IN_PROGRESS
cycle: 1
source_of_truth:
  - GitHub
baseline_main_sha: e46de554f1340edc3bd842e28f17bab5aaec7e6c
immutable_rc1_tag: v1.0.0-RC1
immutable_rc1_sha: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
release_state: prerelease
decision_authority: Leo
human_final_authority: Leandro
phase_artifact_directory: artifacts/phases/PHASE-PRODUCTION-READINESS-001
```

## Boundary canônico

Esta fase reutiliza o boundary já existente de **Prontidão para Produção**, especialmente MCF-DEC-031, MCF-DEC-038, MCF-DEC-043, MCF-DEC-044, MCF-DEC-045, MCF-DEC-058 e MCF-DEC-062. Não cria `Gate F`, `GA Gate` ou outro gate numérico posterior ao Gate E.

Evidência histórica é baseline de investigação e não recebe `PASS` atual sem revalidação compatível com o candidato corrente.

## Escopo

- preservar `v1.0.0-RC1` e seu target;
- revalidar integridade de artefatos e proveniência;
- revalidar CI, Foundation, Container Smoke e E2E aplicáveis;
- revisar segurança, configuração, secrets e infraestrutura;
- comprovar staging/pré-produção no SHA elegível;
- revalidar migrações, backup/restore e recuperação/rollback;
- revalidar observabilidade, health/readiness/liveness e resposta a incidente;
- validar estratégia de deploy/rollout por SHA exato;
- manter produção e `v1.0.0` estável como milestones separados;
- gerar PRF Classe C, auditoria independente e decisão de Léo;
- somente executar rollout real se todos os gates materiais aplicáveis estiverem satisfeitos.

## Fora do escopo

- alterar ou mover a tag `v1.0.0-RC1`;
- criar `v1.0.0` estável por inferência;
- declarar produção pronta usando apenas evidência histórica;
- executar rollout antes da prontidão material;
- expor segredos;
- criar gate posterior não previsto pelo MCF.

## Equipe inicial selecionada

| Agente | Responsabilidade |
|---|---|
| Mestre | orquestração, ESEV e encerramento |
| Miriam | retomada, fontes, proveniência e checkpoint |
| Rafael | integração técnica do runtime e correções de engenharia |
| Bruno | CI/CD, ambientes, SRE, observabilidade e rollback |
| Ricardo | segurança, secrets e risco residual |
| Manoel | banco, migrações, backup e restore |
| Renato | testes, validação, smoke e staging |
| Beatriz | avaliação de automação, agentes e tool-calling quando aplicável |
| Augusto | mission-trace, handoffs, falhas e CAF |
| Júlia | governança obrigatória Classe C e efeito externo |
| Carmem | consistência do PRF |
| Gabriel | branch, commit, PR, integração e release |
| Emily | auditoria independente |
| Léo | decisão do gate interno |

A seleção é dinâmica. Participação decorativa é proibida.

## Fluxo ESEV

```text
Mestre abre contrato
→ Miriam reconcilia fontes e baseline
→ Gabriel materializa branch/PRF/PR
→ Bruno/Rafael inventariam runtime, workflows, staging e deploy
→ Manoel revalida banco, migrations, backup e restore
→ Renato executa validações e smoke aplicáveis
→ Ricardo revisa segurança e secrets
→ Beatriz avalia automação/tool-calling quando aplicável
→ Augusto valida trace, handoffs e CAF
→ Júlia valida governança Classe C
→ Carmem fecha consistência do PRF
→ Emily executa auditoria independente
→ Léo decide prontidão
→ rollout controlado somente se elegível
→ evidência pós-deploy
→ avaliação separada de v1.0.0
```

## Production Readiness Matrix

A matriz obrigatória cobre 16 dimensões: integridade; CI; segurança; configuração/secrets; infraestrutura; staging; DB/migração; observabilidade; backup/recovery; rollback; health; deploy; release/version/tag; incidente; smoke pós-deploy; aprovação/auditoria.

Nenhuma dimensão recebe `PASS` sem identificador verificável ou `NAO_APLICAVEL` justificado.

## Critérios de aceite

1. Todas as 16 dimensões classificadas com evidência atual ou justificativa de não aplicabilidade.
2. Zero achado crítico/alto aberto em segurança e auditoria.
3. Staging comprova SHA exato, readiness e smoke do candidato elegível.
4. Migração, backup/restore e recovery/rollback possuem evidência atual compatível.
5. Configuração/secrets e infraestrutura material resolvidas sem exposição.
6. Rollout identifica versão exata, condição de recuperação e critério de aborto.
7. PRF Classe C completo e manifesto SHA-256 verificável.
8. Emily emite auditoria independente.
9. Léo emite decisão explícita.
10. Deploy de produção e eventual `v1.0.0` estável permanecem decisões separadas.

## Validação planejada

- Documentation Validation;
- Rede Social Foundation;
- Rede Social Container Smoke;
- MCF Runtime Integration/E2E aplicáveis;
- migrations duas vezes quando aplicável;
- build/lint/typecheck/test conforme workflow canônico;
- staging exact SHA com `/health/version` e `/health/ready`;
- prova de backup/restore e recuperação compatível;
- revisão de segurança e secrets sem revelar valores;
- prova de observabilidade e alertas;
- manifesto SHA-256 do PRF;
- auditoria independente.

## CAF

```text
CAPTURAR
→ CLASSIFICAR
→ VERIFICAR EFEITO
→ ESCOLHER RECUPERAÇÃO
→ EXECUTAR CORREÇÃO OBJETIVA
→ REVALIDAR
→ RETORNAR AO FLUXO
```

Nenhuma repetição cega de ação mutável é permitida.

## HUMAN_GATE

A autorização material registrada em MCF-DEC-031 é entrada vigente. Nenhum HUMAN_GATE adicional é necessário para descoberta, revalidação e correções internas. Escalar exclusivamente a LEANDRO se surgir gatilho reservado não coberto pelas autorizações vigentes.