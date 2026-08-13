# Multiagent Collaboration Framework

Framework experimental para colaboração entre múltiplos agentes de IA com papéis definidos, seleção por competência, execução sequencial visível, loop orientado a objetivo, passagem de bastão contínua, skills versionadas, runtime persistente, evidência verificável, auditoria e gates governados.

## Governança

- **Leandro** é a autoridade humana final e não entra na contagem dos agentes.
- **Léo** é a autoridade delegada de continuidade operacional e gates internos.
- **Mestre** coordena a equipe, mantém o mapa da missão e apresenta o fluxo completo.
- Existem **29 agentes nomeados**, selecionados dinamicamente por competência.
- O protocolo operacional vigente está em `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`.

## Regras centrais

- ESEV obrigatório: atuação real deve ser exposta cronologicamente;
- CAF obrigatório para falhas recuperáveis;
- PRF rastreável para fases Classe B/C;
- sucesso sem evidência é proibido;
- evidência de gate pertence ao SHA exato;
- Leandro não é executor técnico padrão nem destinatário de handoff técnico;
- produção, releases públicas e demais efeitos Classe C obedecem ao boundary e às autorizações aplicáveis.

## Runtime executável

```text
objetivo conversacional
→ Chat-to-Runtime Bridge
→ MissionRuntime
→ SkillRegistryLoader
→ Human Delegation Firewall
→ PermissionEngine
→ SkillExecutor
→ EvidenceValidator
→ PostgreSQL / Event Ledger
→ Handoff / CAF
→ trace final verificado
```

## Estado canônico atual

```yaml
skills_registradas: 16
skills_executaveis: 16
skills_documentais: 0
remaining_documental: []

runtime_006:
  gate_c_real_provider_write: COMPLETE
  lot_4e_close_phase: COMPLETE
  gate_e_release_candidate: COMPLETE

release_lineage:
  rc1:
    tag: v1.0.0-RC1
    sha: 9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
    state: PRESERVED_PRERELEASE
  rc2:
    tag: v1.0.0-RC2
    sha: d73d936a63cc9462a95bcf481f4b8e1d4b255719
    state: PRESERVED_PRERELEASE
  rc3:
    tag: v1.0.0-RC3
    sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
    state: PRESERVED_PRERELEASE_FINAL_PRODUCTION_CANDIDATE

production:
  state: LIVE
  qualified_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
  production_readiness_run: 31653194401
  production_readiness: PASS
  latest_health_verified_before_publication_boundary_fix_run: 31671899893
  latest_health_verified_before_publication_boundary_fix: PASS

stable_release_boundary:
  mission: MCF-STABLE-RELEASE-001
  issue: 131
  operational_pr: 133
  required_stable_target_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
  stable_v1_0_0: NAO_PUBLICADA
  human_gate: NAO_APROVADO
  publication_authorized: false
  publication_boundary_correction: IN_PROGRESS
```

Os commits do PR #133 pertencem somente ao **control plane de publicação**. Eles não mudam o SHA qualificado da RC3 nem o alvo permitido de uma eventual `v1.0.0`.

## Boundary atual — MCF-STABLE-RELEASE-001

A produção e a RC3 já foram qualificadas. A missão atual não cria um novo Gate F; ela trata a promoção estável como milestone Classe C separado, conforme `MCF-DEC-064`.

O HUMAN_GATE apresentado a LEANDRO foi **não aprovado**. A publicação de `v1.0.0` permanece proibida enquanto o boundary de publicação é corrigido e reauditado.

Dois findings P1 de review do PR #133 estão em ciclo de correção:

1. autenticação inequívoca da identidade GitHub de LEANDRO para o recibo do HUMAN_GATE;
2. prova executável de que o workflow introduzido no PR é realmente descoberto e executado pelo evento `pull_request`, sem depender de merge para `main`.

A prova executável read-only foi introduzida no workflow e deve ser validada por run real e revisão independente antes de a contagem formal de P1 ser reduzida.

Documentação corrente da missão:

- `docs/decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md`
- `docs/releases/MCF-v1.0.0-RC3.md`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PUBLICATION-BOUNDARY.md`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PHASE-STABLE-RELEASE-001-CHECKPOINT.yaml`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PHASE-STABLE-RELEASE-001-PRF.md`
- `artifacts/phases/PHASE-STABLE-RELEASE-001/PHASE-STABLE-RELEASE-001-REPORT.md`

## Imutabilidade de release

Para o MCF, tags/releases públicas versionadas são **identidades imutáveis por governança**: depois de publicadas, não devem ser retargetadas para outro SHA.

Isso não deve ser confundido com uma alegação de proteção administrativa absoluta no GitHub. No snapshot auditado antes da correção do boundary, a release RC3 expôs `immutable: false` e o repositório não apresentou rulesets ativos. Portanto, enquanto não houver configuração técnica adicional comprovada, a imutabilidade é uma invariante de governança/versionamento reforçada por controles fail-closed, não uma garantia de undeletability fornecida pelo GitHub.

## Skills executáveis

1. `MCF-START-MISSION`
2. `MCF-SELECT-AGENTS`
3. `MCF-RECOVER-CONTEXT`
4. `MCF-DEFINE-PRODUCT`
5. `MCF-DESIGN-EXPERIENCE`
6. `MCF-DESIGN-ARCHITECTURE`
7. `MCF-IMPLEMENT-CHANGE`
8. `MCF-REVIEW-CODE`
9. `MCF-RUN-TESTS`
10. `MCF-GIT-PR-RELEASE`
11. `MCF-DEPLOY-VALIDATE`
12. `MCF-TRACE-MISSION`
13. `MCF-EVALUATE-AGENTS`
14. `MCF-SECURITY-REVIEW`
15. `MCF-DEBUG-INCIDENT`
16. `MCF-CLOSE-PHASE`

Não há skill documental remanescente no runtime integrado.

## Marcos concluídos

### Gate C — real provider write

A capacidade de escrita GitHub do runtime foi comprovada em provider real, integrada e reconciliada canonicamente. Evidências e artefatos permanecem em:

- `artifacts/phases/PHASE-006-GATE-C-REAL-PROVIDER-WRITE/`

### Lot 4-E — Close Phase

`MCF-CLOSE-PHASE` opera como `READY_AGENT`, com Carmem como primary owner, Mestre como handoff técnico, HDF ativo e exigência de estado terminal verdadeiro. Evidências permanecem em:

- `artifacts/phases/PHASE-006-LOT-4-E-CLOSE-PHASE/`

### Gate E — Release Candidate

Gate E foi concluído com a publicação de `v1.0.0-RC1`. RC1 permanece preservada; RC2 e RC3 foram produzidas em boundaries posteriores sem retargetar as identidades anteriores.

Evidências históricas de Gate E permanecem em:

- `artifacts/phases/PHASE-006-GATE-E-RELEASE-CANDIDATE/`
- `docs/decisions/MCF-DEC-062-GATE-E-RELEASE-CANDIDATE.md`
- `docs/releases/MCF-v1.0.0-RC1.md`

## Documentação principal

- `docs/runtime/README.md`
- `docs/runtime/MCF-RUNTIME-006-PLAN.md`
- `skills/registry.yaml`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`

## Autorização vigente

```yaml
HUMAN_GATE: NAO_APROVADO
MERGE_PUBLICACAO_v1_0_0: NAO_AUTORIZADOS
stable_v1_0_0: NAO_PUBLICADA
```

Nenhum texto deste README constitui autorização para publicar `v1.0.0`.
