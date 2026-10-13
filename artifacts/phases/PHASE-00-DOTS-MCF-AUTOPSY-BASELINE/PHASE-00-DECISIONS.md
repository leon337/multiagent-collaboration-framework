# PHASE-00 — Decisões e questões abertas

## Decisões
- D-001: Issue #441 é o controle operacional; artefatos técnicos ficam versionados no repositório MCF.
- D-002: PR #438 segue separada; não editar sua branch nem absorver seu conteúdo silenciosamente.
- D-003: Manual tem REST/MCP documentados como read-only; este teste usou REST e não testou MCP.
- D-004: Health e equivalência do DEP-002 publicado com seed foram verificadas via REST; nenhum write no Neon foi feito.
- D-005: MCF Production Readiness falhou no audit de dependências; issue #427 continua separada. Não desativar nem afrouxar o gate.
- D-006: PR #438 contém literal \n em uma tabela de README; registrar sem corrigir nessa branch.
- D-007: Arquitetura interna do Dots não publicada = UNKNOWN, não preencher por especulação.
- D-008: Baseline consolidado, mas fase não fecha sem revisão do PRF e checagem independente.

## Respondidas
1. DEP-002 foi lido integralmente? Sim: seed e endpoint JSON; o conteúdo coincide.
2. Health live foi verificado? Sim, o endpoint retornou status ok / database connected.
3. Estado de PR #438/checks? Aberta/não merged; Vercel e Document validation passaram; readiness falhou em dependency audit.
4. MCP foi testado? Não.

## Em aberto
- Revisar o diff do PR #442 e confirmar os hashes do manifesto.
- Completar a autópsia histórica e catalogar fontes oficiais Dots.
- Obter auditoria independente real, sem atribuir trabalho a agentes que não o executaram.
- Avaliar testes de runtime em ambiente seguro; não são parte deste smoke.
- Manter vulnerabilidades em trilha separada Issue #427.