# MCF — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED`  
**Natureza:** snapshot documental reconciliado; GitHub live prevalece sobre valores voláteis  
**Baseline auditada:** `main@7f741e10d0e745a90c732e084400b11e3f5e6794`  
**Data da reconciliação:** 2026-08-13

## 1. Como ler este repositório

Este arquivo é o ponto de entrada para o **estado atual** do MCF. Ele não substitui GitHub live, decisões históricas, PRFs nem evidências de execução.

Em caso de divergência, use esta ordem:

1. instrução explícita atual de LEANDRO;
2. estado real verificável no GitHub;
3. código, testes, workflows e evidências do SHA aplicável;
4. decisões/protocolos vigentes;
5. documentos históricos.

Classificações usadas nesta documentação:

- `CURRENT_IMPLEMENTED` — existe no código/infraestrutura e possui evidência verificável;
- `EXPERIMENTAL` — foi experimentado, sem equivaler a capacidade geral comprovada;
- `PLANNED` — boundary/atividade formalmente prevista, ainda não materializada;
- `UNDER_STUDY` — hipótese/discovery, sem autorização de implementação;
- `HISTORICAL` — verdade de um momento anterior preservada como evidência;
- `SUPERSEDED` — afirmação/processo substituído por evidência ou decisão posterior.

## 2. Estado verificável do release boundary

```yaml
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc1: v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8
rc2: v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719
rc3: v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794
production: COMPLETE_LIVE_ON_RC3_LINEAGE
stable_v1_0_0: NOT_PUBLISHED
stable_boundary: MCF-STABLE-RELEASE-001 / Issue #131 / PR #133
human_gate: NOT_APPROVED
```

RC1, RC2 e RC3 são prereleases preservadas. `v1.0.0` estável é um milestone separado e não existe enquanto o HUMAN_GATE final não for validamente concedido.

## 3. O que o MCF é hoje

O MCF é um framework multiagente com duas camadas complementares:

1. **governança/coordenação** — contratos de agentes, autoridade, gates, PRFs, handoffs, CAF, Human Delegation Firewall e evidência rastreável;
2. **runtime executável** — persistência de missões/fases/eventos/receipts, skills executáveis, adapters externos, dispatcher, reconciliação, observabilidade e integrações de deploy/CI/GitHub.

A existência do runtime não é apenas conceitual. O código está em:

`apps/rede-social-agentes/apps/server/src/mcf-runtime/`

A aplicação hospedeira é um workspace Node/pnpm em `apps/rede-social-agentes/`, com API, web, worker, pacotes de persistência/contratos e testes.

## 4. Capacidades atuais comprovadas

### `CURRENT_IMPLEMENTED`

- runtime persistente de missões, fases, eventos, handoffs e receipts;
- hierarquia missão-pai/submissão e retorno persistente;
- External Action Dispatcher e contratos de adapters;
- validação semântica de evidências e separação entre tentativa e sucesso;
- Human Delegation Firewall e perfis de permissão;
- 16 skills registradas, 16 executáveis, 0 somente documentais no boundary RC1+;
- adapters/read paths de revisão de código e consulta de CI;
- escrita GitHub reversível e Gate C real concluído sob boundary governado;
- deploy de staging com verificação de SHA/readiness/version e recovery por redeploy de SHA saudável;
- observabilidade de missões bloqueadas e recuperação orientada a evidência;
- Production Readiness automatizado, incluindo dependency audit, lint/typecheck, migrations, testes, build e backup/restore isolado;
- produção pública materializada e monitorada no lineage qualificado da RC3;
- health monitor recorrente de produção via GitHub Actions.

## 5. Limitações atuais

- `v1.0.0` estável **não foi publicada**;
- a identidade pública de releases é tratada como imutável por governança; isso não equivale a alegar undeletability técnica no GitHub;
- recovery por deploy/redeploy de SHA saudável não deve ser descrito como rollback nativo do provider quando esse mecanismo não foi comprovado;
- os 29 contratos de agentes representam papéis e responsabilidades do MCF; não provam que 29 processos/modelos cognitivos independentes estejam sempre executando simultaneamente;
- a experiência `telefone-sem-fio-001` não comprova independência cognitiva real;
- materiais NextGen não são capacidades atuais por simples presença na branch de discovery.

## 6. Agentes e skills

A composição documental oficial contém **29 agentes nomeados**; LEANDRO é autoridade humana final e não entra nessa contagem.

Fonte da composição:
- `docs/agentes/README.md`
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`

Skills:
- registro: `skills/registry.yaml`
- runtime/executores: `apps/rede-social-agentes/apps/server/src/mcf-runtime/`
- evidência de qualificação: PRFs do `MCF-RUNTIME-006` e Gate E.

## 7. Produção, readiness e releases

Estado histórico relevante:

- Gate C real — concluído;
- Gate D/staging — concluído;
- observabilidade + cobertura total de skills — concluídas no RUNTIME-006;
- Gate E — concluído;
- RC1 — publicada;
- Production Readiness pós-RC1 — concluído;
- RC2 — publicada após correção operacional;
- produção — concluída;
- RC3 — publicada e qualificada no mesmo SHA atualmente em `main`;
- stable `v1.0.0` — **não publicada**.

Evidências principais:
- `docs/decisions/MCF-DEC-062-GATE-E-RELEASE-CANDIDATE.md`
- `docs/decisions/MCF-DEC-063-PRODUCTION-READINESS-POST-RC1.md`
- `docs/decisions/MCF-DEC-064-QUALIFICACAO-DA-RELEASE-ESTAVEL-V1.0.0.md`
- `docs/releases/MCF-v1.0.0-RC1.md`
- `docs/releases/MCF-v1.0.0-RC2.md`
- `docs/releases/MCF-v1.0.0-RC3.md`
- `.github/workflows/mcf-production-readiness.yml`
- `.github/workflows/mcf-production-health-monitor.yml`
- `artifacts/phases/`

## 8. Experimentos

`experimentos/telefone-sem-fio-001` é `EXPERIMENTAL`.

Resultado preservado: houve evidência positiva de preservação de conteúdo/handoff no protocolo testado. Limitação obrigatória: os papéis foram executados dentro do mesmo ChatGPT; portanto o experimento **não demonstra independência cognitiva real entre agentes**. O próprio resultado final exige sessões/contextos/instâncias separados para validar essa hipótese.

## 9. NextGen / discovery

A branch `planning/mcf-nextgen-discovery` é `UNDER_STUDY`.

O checkpoint `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md` nessa branch registra explicitamente:

```yaml
state: DRAFT_DISCOVERY
implementation_authorized: false
architecture_formally_approved: false
prototype_authorized: false
```

Conceitos como Project Capsule, novas camadas de memória, model routing, DAG/paralelismo, Interaction Center, novos maturity/delivery profiles, gateways, caching/rate limiting, hardening adicional, VPS portátil e reestruturações similares devem permanecer `UNDER_STUDY`, salvo quando houver equivalente atual comprovado no runtime vigente.

A VPS é uma opção de infraestrutura futura/portátil, não requisito conceitual do MCF.

## 10. Mapa documental

- porta pública: `README.md`
- estado atual: `docs/MCF-CURRENT-STATE.md`
- índice documental: `docs/README.md`
- histórico de marcos: `CHANGELOG.md`
- runtime: `docs/runtime/` + `apps/rede-social-agentes/apps/server/src/mcf-runtime/`
- governança: `docs/governanca/`, `docs/protocols/`, decisões vigentes em `docs/decisions/`
- agentes: `docs/agentes/` e `docs/matrices/`
- releases: `docs/releases/`
- evidências/PRFs: `artifacts/phases/`, `docs/evidence/`, `docs/audits/`, `docs/auditoria/`
- experimentos: `experimentos/` e `docs/experimentos/`
- propostas/discovery: `docs/proposals/` e branches de planejamento; propostas não são implementação.

## 11. Regra de continuidade

Ao retomar o projeto:

1. consulte GitHub live (`main`, PRs, Issues, releases/tags e workflows);
2. leia este snapshot para orientação, nunca para substituir o live state;
3. leia a decisão/PRF correspondente ao boundary ativo;
4. use código/testes/workflows para comprovar capacidades;
5. classifique qualquer proposta não implementada como `PLANNED` ou `UNDER_STUDY`.
