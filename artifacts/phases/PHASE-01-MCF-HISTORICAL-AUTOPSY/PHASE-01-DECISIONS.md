# PHASE-01 — Decisões e questões históricas

## Decisões
- H-DEC-001: release tag prova uma referência versionada, não qual SHA está em produção.
- H-DEC-002: presença de código/teste não equivale a teste passando nem a comportamento live.
- H-DEC-003: audits históricos ficam vinculados à data, SHA e deployment de origem.
- H-DEC-004: Issue #427 permanece separada; não alterar dependências nesta branch de documentação.
- H-DEC-005: ligar ação pretendida, autoridade, attempt, receipt, recurso e postcondição para aceitar ação externa como verificada.
- H-DEC-006: não atribuir trabalho a agentes separados que não executaram revisão real.

## Respondidas
- Há runtime no repositório além de documentação? Sim, código de missão, bridge, executor, validação de evidência, action ledger e provider registry.
- Este código foi testado nesta missão? Não.
- O protocolo exige ESEV/PRF? Sim.
- Audit histórico de agosto prova outubro? Não.
- Readiness passou no run consultado? Não; dependency audit falhou e passos posteriores foram skipped.
- Previews Vercel estavam em erro? Não nos contexts consultados; ambos retornaram success.

## Em aberto
1. Executar testes de contratos atuais no SHA exato em ambiente autorizado.
2. Relacionar testes de idempotência, receipts, UNKNOWN e conflitos de versão às garantias.
3. Confirmar provenance do deployment live.
4. Reconstituir com maior profundidade commits/prs anteriores às releases.
5. Catalogar fontes Dots e criar matriz comparativa com UNKNOWN explícito.