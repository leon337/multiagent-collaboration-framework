# MCF — Documentation Reconciliation 001

**MISSION:** `MCF-DOCUMENTATION-RECONCILIATION-001`  
**Classificação da missão:** documentação/governança; sem implementação NextGen  
**BASE_SHA:** `7f741e10d0e745a90c732e084400b11e3f5e6794`  
**Branch:** `docs/mcf-documentation-reconciliation-001`  
**Data:** 2026-08-13

## 1. Boundary

Esta missão reconcilia a documentação pertinente do MCF com GitHub live, código, testes, workflows, Issues/PRs, tags/releases, decisões e PRFs.

Proibições preservadas:

- não implementar arquitetura NextGen;
- não publicar `v1.0.0`;
- não mergear PR #133;
- não criar/mover tag stable;
- não alterar HUMAN_GATE;
- não alterar/retargetar RC1, RC2 ou RC3;
- não modificar o candidato RC3 em `main`.

## 2. Baseline verificada

```yaml
main: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
stable_v1_0_0: ABSENT
production: COMPLETE
stable_boundary: MCF-STABLE-RELEASE-001 / Issue #131 / PR #133
human_gate: NOT_APPROVED
```

GitHub release metadata confirma RC1/RC2/RC3 como prereleases preservadas. A ref `refs/tags/v1.0.0` não existia no snapshot auditado.

## 3. Fontes obrigatórias NextGen

Foram lidos integralmente, antes das alterações:

- `planning/mcf-nextgen-discovery:docs/proposals/MCF-DOCUMENTATION-RECONCILIATION-BRIEF-001.md`;
- `planning/mcf-nextgen-discovery:docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md`.

Classificação resultante:

```yaml
nextgen: UNDER_STUDY
state: DRAFT_DISCOVERY
implementation_authorized: false
architecture_formally_approved: false
prototype_authorized: false
```

Nenhum conceito NextGen foi promovido a capacidade atual por esta missão.

## 4. Escopo auditado

Domínios auditados por árvore, índice e/ou leitura dirigida das fontes que declaram arquitetura, estado ou capacidade:

- `README.md`;
- `CHANGELOG.md`;
- `docs/README.md`;
- `docs/MCF-CURRENT-STATE.md` (novo mapa reconciliado);
- `docs/runtime/`;
- `apps/rede-social-agentes/` e runtime em `apps/server/src/mcf-runtime/`;
- `skills/registry.yaml`;
- `docs/protocols/`;
- `docs/decisions/`, especialmente MCF-DEC-050..064 e os boundaries Gate E/produção/stable;
- `docs/agentes/` e `docs/matrices/`;
- `docs/governanca/`;
- `docs/auditoria/` e `docs/audits/`;
- `docs/releases/` + GitHub Releases/tags;
- `artifacts/phases/` / PRFs de Runtime-006, Gate C, Gate D, observabilidade, Lot 4 e Gate E;
- `.github/workflows/`, incluindo Production Readiness e Production Health Monitor;
- `experimentos/telefone-sem-fio-001/`;
- `docs/proposals/` e a branch NextGen;
- índices, runbooks/evidence/projetos quando referenciados como fonte de continuidade.

A auditoria não reescreve cada evidência histórica: documents de boundary permanecem preservados quando seu estado antigo era correto na data de emissão.

## 5. Matriz de drift principal

| Documento/área | Afirmação antiga ou risco | Evidência atual | Correção | Classificação |
|---|---|---|---|---|
| `README.md` | produção `BLOCKED`; boundary atual Gate E/RC1 | MCF-DEC-063, RC2/RC3, produção e monitor live | README reconstruído para RC3/produção/stable separada | `SUPERSEDED` → `CURRENT_IMPLEMENTED` |
| `README.md` | runtime descrito abstratamente | código em `apps/rede-social-agentes/apps/server/src/mcf-runtime/` | caminho executável exposto no início | `CURRENT_IMPLEMENTED` |
| `CHANGELOG.md` | apenas inicialização do repo | decisões, tags/releases, PRFs e workflows | histórico reconstruído por marcos materiais | `HISTORICAL` |
| `docs/README.md` | fundação `0.1-remediação`, Issue #10/PR #1 como presente | decisões/protocolo/RC3 atuais | índice refeito por domínio e classificação | `SUPERSEDED` |
| `docs/runtime/README.md` | Gate C não autorizado, produção bloqueada, Gate E futuro | Gate C/D/E concluídos; produção completa; RC3 | runtime README reconciliado | `SUPERSEDED` → `CURRENT_IMPLEMENTED` |
| `docs/runtime/MCF-RUNTIME-006-PLAN.md` | termina em RC1/produção bloqueada | boundaries pós-RC1 concluídos | preservado como trilha histórica; índice/runtime deixam explícita a classificação | `HISTORICAL` |
| `apps/rede-social-agentes/README.md` | ambiente público `EM_PREPARACAO` | Production Readiness/produção concluídos | README da aplicação reconciliado para live lineage RC3 | `SUPERSEDED` |
| `docs/governanca/README.md` | conteúdo fundamental “ainda não recuperado” como estado real | protocolos/decisões/matrizes atuais existem | índice de governança reconstruído | `SUPERSEDED` |
| `CONSTITUICAO_DO_FRAMEWORK.md` | sete papéis permanentes, Linear/GitHub da fundação, disposição transitória | 29 agentes documentais, protocolo/decisões posteriores, GitHub como fonte live do projeto | banner e notas de baseline histórica | `HISTORICAL` / parcial `SUPERSEDED` |
| `MATRIZ_DE_AUTORIDADE.md` | Issue #10/PR #1/DF-008 como boundary | protocolo e decisions posteriores | banner + DF-008 limitado ao boundary histórico | `HISTORICAL` / parcial `SUPERSEDED` |
| `POLITICA_DE_VERSOES.md` | “Fundação atual” ligada à Issue #10/DF-008 | RC1/RC2/RC3 + stable mission atual | classificada no índice/relatório como histórica em partes; conteúdo histórico preservado | `HISTORICAL` / parcial `SUPERSEDED` |
| `docs/auditoria/README.md` | PR #1 ainda draft como se atual | auditorias e PRFs posteriores | índice v0.1 marcado `HISTORICAL` | `HISTORICAL` |
| `docs/agentes/README.md` | 29 agentes pode ser interpretado como 29 IAs independentes | são contratos/papéis; experimento não comprova independência | ressalva aplicada nos pontos de entrada atuais; conteúdo do índice de agentes continua factual | `CURRENT_IMPLEMENTED` com limitação |
| `telefone-sem-fio-001` | risco de extrapolar resultado | próprio resultado registra mesma instância ChatGPT | ressalva preservada e destacada | `EXPERIMENTAL` |
| NextGen | risco de marketing como capability atual | checkpoint = `DRAFT_DISCOVERY`, implementação false | classificado `UNDER_STUDY` | `UNDER_STUDY` |
| RC1 release body | “produção permanece BLOCKED” | verdadeiro em 2026-08-12 no marco RC1; posteriormente superado | release não alterada; classificada como evidência histórica | `HISTORICAL` |
| MCF-DEC-064 | “estado de entrada” aponta SHA anterior | documento é decisão em execução com estado de entrada histórico | snapshot atual separado em `MCF-CURRENT-STATE.md` | `HISTORICAL` para state-of-entry; decisão continua pertinente |

## 6. Correções de estado atual

### Runtime

Confirmado como executável. O repositório contém implementações de runtime, adapters, dispatcher, permission/HDF, evidence validation, persistence, reservations, skills e observabilidade.

### Skills

```yaml
registered: 16
executable: 16
documental_only: 0
```

### Gates/releases

```yaml
gate_c: COMPLETE
gate_d: COMPLETE
gate_e: COMPLETE
rc1: PRESERVED_PRERELEASE
rc2: PRESERVED_PRERELEASE
production: COMPLETE
rc3: PRESERVED_CURRENT_CANDIDATE
stable: NOT_PUBLISHED
```

## 7. CHANGELOG

O CHANGELOG foi reconstruído por milestones, não por commit dump:

- fundação documental;
- aplicação executável/runtime persistente;
- governança operacional unificada;
- Runtime-006;
- Gate C;
- Gate D;
- observabilidade e 16/16 skills;
- Gate E/RC1;
- Production Readiness/produção;
- RC2;
- RC3;
- stable boundary ainda não concluído;
- reconciliação documental atual.

## 8. README

O README agora permite a um auditor externo descobrir imediatamente:

- que existe runtime executável;
- sua localização exata;
- arquitetura simplificada;
- capacidades comprovadas;
- estado `main/RC3/production/stable`;
- skills e governança;
- limitações metodológicas;
- classificação NextGen;
- mapa para fontes e evidências.

## 9. Runtime docs

`docs/runtime/README.md` passou a representar o estado pós-RC3 e a distinguir claramente a linha histórica do RUNTIME-006. O plano detalhado do RUNTIME-006 permanece preservado como `HISTORICAL`, porque reescrever seus SHAs e estados antigos destruiria evidência do boundary original.

## 10. NextGen

Nenhuma implementação feita. Todos os conceitos que dependem da próxima geração permanecem `UNDER_STUDY`. Uma capacidade só pode sair dessa classe se existir de forma independente no runtime vigente e tiver evidência específica.

## 11. Experimento telefone-sem-fio

```yaml
classification: EXPERIMENTAL
preservation_handoff_evidence: POSITIVE
cognitive_independence_proven: false
reason: roles_executed_within_same_ChatGPT_context_family
required_for_stronger_claim: separated_sessions_contexts_or_instances
```

## 12. Itens deliberadamente não reescritos

- releases RC1/RC2/RC3: preservadas como identidades/evidência histórica;
- PRFs/checkpoints antigos: preservados para rastreabilidade;
- decisões de entry state: preservadas quando descrevem corretamente o momento de decisão;
- `POLITICA_DE_VERSOES.md`: conteúdo histórico não foi forçado após bloqueio do canal de escrita; sua classificação está explícita no índice e neste relatório;
- contratos de agentes: não reescritos em massa quando não havia drift funcional comprovado.

## 13. Critério de conclusão pendente

Antes de considerar esta reconciliação concluída:

1. validar o HEAD documental em CI;
2. procurar automaticamente referências stale e distinguir histórico de drift atual;
3. revisar diff para confirmar ausência de código/runtime mutation;
4. solicitar revisão independente do SHA exato;
5. corrigir findings materiais e revalidar;
6. reconfirmar `main`, PR #133 e ausência de stable.
