# PHASE-006-GATE-E-RELEASE-CANDIDATE — PLAN

## Contrato

```yaml
mission_id: MCF-RELEASE-CANDIDATE-GATE-E
parent_mission_id: MCF-RUNTIME-006
phase_id: PHASE-006-GATE-E-RELEASE-CANDIDATE
title: Qualificação e publicação da v1.0.0-RC1
objective: Qualificar o estado integrado do MCF como primeira Release Candidate sem autorizar produção ou versão estável.
expected_outcome: RC1 verificável, auditada e publicada somente se todos os gates materiais forem satisfeitos.
risk_class: C
current_state: IN_PROGRESS
cycle: 1
source_of_truth:
  - GitHub
baseline_sha: c5758c2e38b599ae1673cda2691ef2ce0dc2a411
candidate_sha: PENDING
decision_authority: Leo
human_final_authority: Leandro
phase_artifact_directory: artifacts/phases/PHASE-006-GATE-E-RELEASE-CANDIDATE
```

## Escopo

- reconciliar o estado canônico anterior;
- congelar candidato por SHA exato;
- validar 16/16/0 skills;
- executar Foundation, migrations, testes, build e Container Smoke aplicáveis;
- validar documentação;
- validar staging no SHA exato, readiness e version;
- revisar HDF, TEAM_FIRST, permissões, receipts/ledger, idempotência, CAF, observabilidade, handoffs e close-phase;
- avaliação final de agentes;
- revisão arquitetural e de segurança;
- governança Classe C;
- auditoria independente;
- produzir PRF e release notes;
- publicar `v1.0.0-RC1` somente após decisão aprovadora de Léo.

## Fora do escopo

- produção;
- `v1.0.0` estável;
- novas funcionalidades sem blocker causal do Gate E;
- alteração material de finalidade, público ou autoridade;
- ação destrutiva;
- gasto novo;
- exposição de segredo;
- uso de evidência de SHA supersedido como gate final.

## Entradas

- `main@c5758c2e38b599ae1673cda2691ef2ce0dc2a411`;
- Issue #121;
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`;
- `README.md`;
- `skills/registry.yaml`;
- protocolo operacional v1.1;
- políticas de versão e publicação;
- PRFs e evidências dos Gates A–D e Lotes 4-A–E.

## Agentes selecionados

| Agente | Responsabilidade no Gate E |
|---|---|
| Mestre | orquestração e encerramento |
| Miriam | recuperação e reconciliação da fonte de verdade |
| Sofia | arquitetura e regressão estrutural |
| Renato | testes, build, migrations, smoke e staging |
| Beatriz | avaliação de agentes e automação decisória |
| Ricardo | segurança e risco residual |
| Augusto | ESEV, handoffs, CAF e mission trace |
| Carmem | PRF e consistência documental |
| Julia | governança Classe C, HDF e publicação |
| Emily | auditoria independente e reteste final |
| Léo | gate interno final |
| Gabriel | integridade de branch/PR/tag/release após gate |

## Fluxo ESEV

```text
Mestre abre contrato
→ Miriam reconcilia baseline
→ Sofia revisa boundary e arquitetura
→ Gabriel materializa branch/PRF/PR
→ Renato executa validação técnica
→ Beatriz avalia comportamento dos agentes
→ Ricardo revisa segurança
→ Augusto audita trace/CAF/handoffs
→ Carmem fecha consistência do PRF
→ Julia verifica governança/autorização
→ Emily realiza auditoria independente e reteste
→ Léo decide Gate E
→ Gabriel publica RC se e somente se Gate E aprovar
→ Mestre reconcilia e fecha checkpoint
```

## Critérios de aceite

Todos os critérios registrados na Issue #121 são obrigatórios. Qualquer alteração do SHA candidato invalida evidência de gate anterior que dependa do conteúdo alterado e exige reteste proporcional.

## Validação planejada

- Documentation validation;
- Rede Social Foundation;
- Rede Social Container Smoke;
- MCF runtime integration/E2E aplicáveis;
- migrations duas vezes;
- lint/typecheck/test/build conforme workflow canônico;
- staging exact SHA com `/health/ready` e `/health/version`;
- revisão manual dos invariantes canônicos;
- manifest SHA-256 do PRF;
- auditoria independente.

## CAF

```text
CAPTURAR
→ CLASSIFICAR
→ VERIFICAR EFEITO
→ ESCOLHER RECUPERAÇÃO
→ CORRIGIR SOMENTE O NECESSÁRIO
→ REVALIDAR NOVO SHA
→ RETORNAR AO GATE E
```

Nenhuma repetição cega de ação mutável é permitida.

## HUMAN_GATE

Nenhum HUMAN_GATE adicional é necessário no início. Escalar exclusivamente a LEANDRO se surgir gatilho canônico novo.
