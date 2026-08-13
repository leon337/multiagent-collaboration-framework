# MCF — Multiagent Collaboration Framework

O **MCF** é um framework para coordenação governada de agentes de IA, com papéis explícitos, seleção por competência, execução rastreável, handoffs, skills versionadas, runtime persistente, evidência verificável, recuperação de falhas e gates de autoridade.

> **Estado documental:** reconciliado contra `main`, código, workflows, releases e evidências do GitHub. Para valores voláteis, GitHub live prevalece. O snapshot canônico está em [`docs/MCF-CURRENT-STATE.md`](docs/MCF-CURRENT-STATE.md).

## O que existe hoje

### `CURRENT_IMPLEMENTED`

O MCF possui **runtime executável**, não apenas metodologia documental.

Código principal:

```text
apps/rede-social-agentes/apps/server/src/mcf-runtime/
```

A aplicação hospedeira está em [`apps/rede-social-agentes/`](apps/rede-social-agentes/) e usa Node.js/pnpm, API, web, worker, PostgreSQL e workflows de validação/deploy.

Fluxo técnico simplificado:

```text
objetivo / missão
      ↓
MissionRuntime + persistência
      ↓
Skill registry + planner
      ↓
Human Delegation Firewall / Permission Engine
      ↓
Skill Executor / External Action Dispatcher
      ↓
adapter interno ou externo
      ↓
Evidence Validator + receipts + event ledger
      ↓
handoff / CAF / gate / checkpoint
```

Capacidades comprovadas no lineage atual incluem:

- missões, fases, eventos, receipts e handoffs persistentes;
- hierarquia missão-pai/submissão;
- Human Delegation Firewall e perfis de permissão;
- dispatcher de ações externas e adapters com evidência verificável;
- **16 skills registradas, 16 executáveis, 0 apenas documentais**;
- leitura de revisão de código e CI;
- escrita GitHub reversível e Gate C real concluído;
- staging/deploy com verificação de SHA, readiness/version e recovery por redeploy;
- observabilidade de missões bloqueadas;
- Production Readiness automatizado;
- produção pública materializada e monitorada no lineage da RC3.

Fontes: [`docs/runtime/`](docs/runtime/), [`skills/registry.yaml`](skills/registry.yaml), [`artifacts/phases/`](artifacts/phases/) e [workflows](.github/workflows/).

## Estado atual verificável

Snapshot reconciliado em 2026-08-13:

```yaml
main: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
production: COMPLETE
stable_v1_0_0: NOT_PUBLISHED
stable_mission: MCF-STABLE-RELEASE-001
stable_issue: 131
stable_pr: 133
human_gate: NOT_APPROVED
```

A `v1.0.0-RC3` é a candidata qualificada atual. **`v1.0.0` estável não foi publicada.** A produção e a release estável são boundaries distintos; publicar stable exige a governança específica da missão ativa e HUMAN_GATE de LEANDRO.

Para estado live, consulte GitHub antes de usar os SHAs acima como dado operacional.

## Governança

- **LEANDRO** — autoridade humana final; não é agente do MCF.
- **LÉO** — agente com autoridade operacional delegada para continuidade e gates internos dentro do boundary vigente.
- **MESTRE** — orquestrador responsável pela condução da missão e exposição do fluxo.
- **Emily** — auditoria independente conforme os gatilhos aplicáveis.

Existem **29 agentes nomeados**, selecionados por competência. Essa composição descreve papéis/contratos do MCF; não prova 29 modelos cognitivos independentes em execução simultânea. LEANDRO não entra nessa contagem.

Protocolo operacional vigente:
[`docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`](docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md)

Princípios centrais:

- evidência antes de declaração de sucesso;
- ESEV para execução visível e verificável;
- CAF para falhas recuperáveis;
- PRF para fases Classe B/C;
- gate e review vinculados ao estado/SHA aplicável;
- LEANDRO não é executor técnico padrão;
- ação externa irreversível ou publicação pública relevante exige autoridade compatível com o boundary.

## Skills

O registro canônico está em [`skills/registry.yaml`](skills/registry.yaml).

```yaml
registered: 16
executable: 16
documental_only: 0
```

Skills atuais:

`MCF-START-MISSION`, `MCF-SELECT-AGENTS`, `MCF-RECOVER-CONTEXT`, `MCF-DEFINE-PRODUCT`, `MCF-DESIGN-EXPERIENCE`, `MCF-DESIGN-ARCHITECTURE`, `MCF-IMPLEMENT-CHANGE`, `MCF-REVIEW-CODE`, `MCF-RUN-TESTS`, `MCF-GIT-PR-RELEASE`, `MCF-DEPLOY-VALIDATE`, `MCF-TRACE-MISSION`, `MCF-EVALUATE-AGENTS`, `MCF-SECURITY-REVIEW`, `MCF-DEBUG-INCIDENT` e `MCF-CLOSE-PHASE`.

## Releases e marcos

| Marco | Classificação | Estado |
|---|---|---|
| Runtime persistente / evidence model | `CURRENT_IMPLEMENTED` | integrado |
| Gate C — provider write | `HISTORICAL` + capacidade preservada | concluído |
| Gate D — staging/deploy | `HISTORICAL` + capacidade preservada | concluído |
| Gate E | `HISTORICAL` | concluído |
| `v1.0.0-RC1` | `HISTORICAL` | prerelease preservada |
| Production Readiness pós-RC1 | `HISTORICAL` + workflow atual | concluído |
| `v1.0.0-RC2` | `HISTORICAL` | prerelease preservada |
| produção | `CURRENT_IMPLEMENTED` | completa/live |
| `v1.0.0-RC3` | `CURRENT_IMPLEMENTED` | prerelease candidata atual |
| `v1.0.0` | `PLANNED` / bloqueada por governança | não publicada |

Detalhes: [`CHANGELOG.md`](CHANGELOG.md), [`docs/releases/`](docs/releases/) e decisões [`MCF-DEC-062`](docs/decisions/MCF-DEC-062-GATE-E-RELEASE-CANDIDATE.md), [`MCF-DEC-063`](docs/decisions/MCF-DEC-063-PRODUCTION-READINESS-POST-RC1.md) e [`MCF-DEC-064`](docs/decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md).

## Experimentos

### `telefone-sem-fio-001` — `EXPERIMENTAL`

O experimento encontrou evidência positiva de preservação/handoff no protocolo testado. A ressalva metodológica é obrigatória: **os papéis foram executados no mesmo ChatGPT**, portanto o resultado não comprova independência cognitiva real entre agentes.

Fonte: [`experimentos/telefone-sem-fio-001/RESULTADO_FINAL.md`](experimentos/telefone-sem-fio-001/RESULTADO_FINAL.md).

## NextGen — `UNDER_STUDY`

Existe discovery separado na branch `planning/mcf-nextgen-discovery`.

O checkpoint de discovery declara explicitamente que a arquitetura não está formalmente aprovada e que implementação/protótipo não estão autorizados. Project Capsule, novas camadas de memória, model routing, DAG/paralelismo, Interaction Center, novos profiles de maturidade/delivery, gateways, caching/rate limiting, hardening adicional, VPS portátil e demais propostas **não devem ser lidos como capacidades atuais** sem evidência no runtime vigente.

A missão documental atual não implementa NextGen.

## Limitações importantes

- stable `v1.0.0` ainda não existe;
- “imutabilidade” de identidade de release é uma regra de governança; não é alegada como impossibilidade técnica absoluta de exclusão/retarget por administrador;
- recovery por SHA saudável não deve ser chamado de rollback nativo do provider quando isso não estiver comprovado;
- contratos de agentes não equivalem automaticamente a isolamento cognitivo entre instâncias/modelos;
- documentos de Gate/PRF antigos preservam o estado verdadeiro daquele momento e podem conter `BLOCKED` ou “próximo boundary” que são **históricos**, não o estado atual.

## Mapa rápido

| Pergunta | Fonte |
|---|---|
| Qual é o estado atual? | [`docs/MCF-CURRENT-STATE.md`](docs/MCF-CURRENT-STATE.md) + GitHub live |
| Onde está o runtime? | [`apps/rede-social-agentes/apps/server/src/mcf-runtime/`](apps/rede-social-agentes/apps/server/src/mcf-runtime/) |
| Como o runtime é documentado? | [`docs/runtime/README.md`](docs/runtime/README.md) |
| Quais skills existem? | [`skills/registry.yaml`](skills/registry.yaml) |
| Quem são os agentes? | [`docs/agentes/README.md`](docs/agentes/README.md) |
| Qual é o protocolo operacional? | [`docs/protocols/`](docs/protocols/) |
| Onde estão as decisões? | [`docs/decisions/`](docs/decisions/) |
| Onde está a governança? | [`docs/governanca/`](docs/governanca/) |
| Onde estão PRFs/evidências? | [`artifacts/phases/`](artifacts/phases/) e [`docs/evidence/`](docs/evidence/) |
| Qual é o histórico de releases? | [`CHANGELOG.md`](CHANGELOG.md) e [`docs/releases/`](docs/releases/) |
| Onde estão experimentos? | [`experimentos/`](experimentos/) |
| Onde estão propostas? | [`docs/proposals/`](docs/proposals/) e branches de planning |
| Qual é o índice completo? | [`docs/README.md`](docs/README.md) |

## Regra de fonte de verdade

Antes de afirmar estado atual de branch, SHA, PR, Issue, workflow, produção, tag ou release, consulte o **GitHub live**. Documentos neste repositório são evidência e orientação; snapshots não substituem o estado real verificável.
