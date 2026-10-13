# PHASE-01 — Plano de autópsia histórica MCF

Mission: MCF-20261013-DOTS-MCF-AUTOPSY-001
Issue: https://github.com/leon337/multiagent-collaboration-framework/issues/441
Snapshot atual: main SHA 460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615

## Objetivo
Reconstruir a evolução do MCF por decisões, commits, releases, protocolos, código e CI. Separar presença de implementação, teste executado e estado live.

## Escopo
DEC-007, DEC-050, DEC-051, DEC-066; tags v1.0.0-RC1 até v1.5.1; runtime de missão/skills, provider execution, external action ledger, evidence validator, human control e workflow de readiness; confronto de audits históricos e código atual.

## Fora de escopo
Alterar runtime/dependências, resolver Issue #427, merge, deploy, release ou escrita em produção. Não inferir funcionamento live de código/documentação apenas presente.

## Critérios de aceite
1. Linha do tempo com datas, SHAs, tags e fontes.
2. Mapa de arquitetura baseado em arquivos e SHAs.
3. Riscos e lacunas classificados por força de evidência.
4. Estado de CI e limitações de testes documentados.
5. PRF e checkpoint com hashes válidos.
6. Auditoria independente marcada como pendente até que ocorra de verdade.

## Método
VERIFIED_FACT, SECONDARY_EVIDENCE, INFERENCE, HYPOTHESIS e UNKNOWN. Toda conclusão declara seu escopo e o que não demonstra.