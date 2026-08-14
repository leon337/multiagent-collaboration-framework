# Changelog

Marcos materiais do **MCF — Multiagent Collaboration Framework**. GitHub live, tags/releases e PRFs prevalecem para detalhes operacionais. Estados antigos como `BLOCKED`, `NOT_PUBLISHED` e `NOT_APPROVED` descrevem o momento histórico correspondente quando aparecem em artifacts anteriores.

## [Não publicado]

### Reconciliação documental pós-stable — 2026-08-14

- estado documental atualizado após a publicação oficial de `v1.0.0`;
- `docs/MCF-CURRENT-STATE.md`, README raiz, runtime README e índices reconciliados com o estado pós-stable;
- Issue #131 registrada como `CLOSED/COMPLETED` e PR #133 como `CLOSED/UNMERGED`;
- HUMAN_GATE registrado como `CONSUMED_PROTECTED`, com approval commit e consumption lock preservados como evidência;
- NextGen permanece `UNDER_STUDY`.

## [v1.0.0] — 2026-08-14

- stable publicada exatamente em `7f741e10d0e745a90c732e084400b11e3f5e6794`, o mesmo SHA da RC3 qualificada;
- GitHub Release `MCF v1.0.0` publicada como não-draft e não-prerelease;
- `v1.0.0` tornou-se a Release `latest`;
- HUMAN_GATE de LEANDRO foi consumido/protegido pelo publication control plane;
- approval commit: `786d2535b70584762b45ae0512d43872d492b715`;
- consumption lock: `22548bed68df93819a65d26027da353eeb0f8285`;
- `MCF-STABLE-RELEASE-001` / Issue #131 encerrada como `CLOSED/COMPLETED`;
- PR #133 encerrado `CLOSED/UNMERGED`, preservado como control plane histórico de publicação.

### Contexto histórico pré-publicação

Antes de 2026-08-14, a documentação registrava corretamente a stable como não publicada e o HUMAN_GATE como não aprovado. Essas afirmações permanecem válidas apenas como `HISTORICAL` quando vinculadas ao boundary anterior à publicação.

## [v1.0.0-RC3] — 2026-08-13

- prerelease publicada em `7f741e10d0e745a90c732e084400b11e3f5e6794`;
- candidato final após convergência de segurança, deploy e monitoramento pós-RC2;
- `main` qualificada no mesmo SHA;
- produção operando no lineage qualificado;
- stable ainda estava gated nesse marco histórico; o estado foi superado pela publicação de `v1.0.0` em 2026-08-14.

## [v1.0.0-RC2] — 2026-08-12

- prerelease publicada em `d73d936a63cc9462a95bcf481f4b8e1d4b255719`;
- RC separada para correções operacionais pós-RC1;
- RC1 preservada sem retarget;
- readiness, migrations, testes, build e backup/restore requalificados.

## Produção / Production Readiness — 2026-08-12

- `MCF-PRODUCTION-READINESS-001` concluída sem criar Gate F;
- infraestrutura pública, canário/smoke, observabilidade, backup/restore e readiness verificados;
- Production Readiness automatizado consolidado;
- produção concluída sem promover automaticamente a stable naquele boundary histórico.

## [v1.0.0-RC1] — 2026-08-12

- primeira Release Candidate formal em `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`;
- Gate E concluído após PRF Classe C, validações, staging, auditoria e gate interno;
- 16 skills registradas / 16 executáveis / 0 somente documentais;
- produção e stable estavam bloqueadas naquele marco; esse estado foi depois superado.

## MCF-RUNTIME-006

### Gate C — provider write

- dispatcher/adapters qualificados para escrita GitHub real sob boundary governado;
- read-back, idempotência, receipts e reconciliação pós-write comprovados.

### Gate D — deploy/staging

- staging integrado ao runtime;
- SHA/readiness/version verificados;
- recovery por redeploy de SHA saudável comprovado.

### Observabilidade e cobertura total de skills

- observabilidade de missões bloqueadas e recuperação integrada;
- skills internas restantes convertidas para execução;
- estado pré-Gate-E consolidado em 16/16/0.

## Runtime persistente e evidência confiável

- MissionRuntime persistente, event ledger, receipts e handoffs;
- hierarquia de missões e retorno à missão-pai;
- Skill Registry, Permission Engine e Human Delegation Firewall;
- Chat-to-Runtime Bridge, dispatcher e evidência semântica verificável.

## Governança operacional unificada

- MCF-DEC-050: agentes de controle e padrão operacional;
- MCF-DEC-051: execução sequencial visível e rastreabilidade por fase;
- MCF-DEC-052: skills e instrumentalização;
- protocolo unificado com ESEV, CAF, PRF, handoffs e gates;
- composição documental consolidada em 29 agentes nomeados, com LEANDRO fora da contagem.

## Fundação executável e aplicação hospedeira

- evolução da aplicação `apps/rede-social-agentes/` com API, web, worker e persistência;
- runtime MCF materializado em `apps/rede-social-agentes/apps/server/src/mcf-runtime/`;
- migrações, backup/restore, deploy e rollout controlado adicionados ao ciclo operacional.

## Fundação documental inicial

- inicialização do repositório, constituição, autoridade, fluxo, decisões e contratos iniciais;
- auditoria/remediação v0.1;
- `telefone-sem-fio-001`: evidência experimental de preservação/handoff, sem comprovação de independência cognitiva entre agentes.

## Referências

- estado atual: `docs/MCF-CURRENT-STATE.md`;
- runtime: `docs/runtime/`;
- decisões: `docs/decisions/`;
- releases: `docs/releases/` + GitHub Releases;
- PRFs: `artifacts/phases/`.
