# PHASE-STABLE-RELEASE-001 — REPORT

## Estado qualificado

- missão: `MCF-STABLE-RELEASE-001`;
- Issue: #131;
- PR operacional de publicação: #133;
- `main`/RC3 qualificada: `7f741e10d0e745a90c732e084400b11e3f5e6794`;
- RC1: `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`, preservada;
- RC2: `v1.0.0-RC2@d73d936a63cc9462a95bcf481f4b8e1d4b255719`, preservada;
- RC3: `v1.0.0-RC3@7f741e10d0e745a90c732e084400b11e3f5e6794`, publicada como prerelease e preservada;
- Production Readiness da RC3: run `31653194401`, PASS;
- health monitor mais recente verificado antes da correção do boundary: run `31671899893`, PASS;
- `v1.0.0`: NÃO PUBLICADA;
- HUMAN_GATE: NÃO APROVADO por decisão explícita de LEANDRO.

## Motivo de RC3

RC2 ficou atrás do estado efetivamente qualificado para produção e não contém todas as mudanças materiais pós-RC2. A RC3 congelou o SHA realmente requalificado e operado. A eventual stable `v1.0.0` permanece obrigada a apontar ao mesmo SHA da RC3; commits posteriores do PR #133 pertencem apenas ao control plane de publicação e não substituem o release target.

## Correção do boundary de publicação

A auditoria do PR #133 registrou dois P1s:

1. **P1-1 — Authenticate the human-gate comment author**: o predicado antigo aceitava a mera presença de uma substring em qualquer comentário. O workflow foi alterado para exigir login `leon337`, GitHub user id `25374535`, corpo exatamente igual a `LEANDRO_HUMAN_GATE: APPROVED` e exatamente um recibo qualificante.
2. **P1-2 — Seed the publication workflow before relying on it**: o run antigo `31654604049` comprovava descoberta do workflow em evento `pull_request`, mas ficou `SKIPPED` e não comprovava execução dos passos. O workflow agora possui job read-only de prova de proveniência/evento/ref e controles. O P1 somente será encerrado após um run real `SUCCESS` desse job em `pull_request/synchronize`.

Os dois P1s permanecem formalmente abertos enquanto essa prova e a revisão independente não forem concluídas.

## Imutabilidade

- **governança:** tags/releases versionadas são identidades públicas e não devem ser retargetadas;
- **proteção técnica observada:** a RC3 expôs `immutable: false` e o repositório não apresentou rulesets ativos no snapshot auditado;
- portanto, não é feita alegação de undeletability técnica pelo GitHub. A invariante é de governança, reforçada por verificações fail-closed no mecanismo de publicação.

## Estado atual

```yaml
state: IN_PROGRESS_HUMAN_GATE_NOT_APPROVED
qualified_rc3_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
publication_P1_count: 2
publication_P0_count: 0
HUMAN_GATE: NAO_APROVADO
stable_v1_0_0: NAO_PUBLICADA
publication_authorized: false
```

A contagem de P1 só poderá ir a zero após prova executável de eliminação dos dois cenários reportados e nova revisão independente do head corrigido.
