# PHASE-006-LOT-4-A-INTERNAL-CORE-SKILLS — Decisões

## D1 — Decompor o Lote 4
O Lote 4 permanece dividido por risco. Lot 4-A cobre somente quatro skills internas de núcleo.

## D2 — `READY_AGENT`
Trabalho de domínio interno não é bootstrap automático: depende do agente owner e de evidência real.

## D3 — Evidência semântica obrigatória
Recibo assinado sozinho não prova contexto, produto, experiência ou arquitetura. A execução exige `execution_evidence` específica e revalidação do recibo.

## D4 — Provider interno canonizado
Autorização, despacho e verificação usam a mesma canonicalização.

## D5 — Placeholders não contam como evidência
Arrays obrigatórios rejeitam strings vazias, `null`, arrays aninhados e objetos vazios.

## D6 — Registry único e declarativo
`skills/registry.yaml` continua sendo o único catálogo; a executabilidade é limitada por contrato tipado, executor, permissões e validação.

## D7 — Persistência faz parte do aceite
O teste integrado prova recibo, validação, handoff, eventos e versão 1→2 pelo `MissionRuntime`.

## D8 — Resolver CWD real do servidor
`SkillRegistryLoader` passou a alcançar o registry raiz a partir de `apps/rede-social-agentes/apps/server` sem duplicar o catálogo.

## D9 — `MCF-CLOSE-PHASE` reservado ao Lot 4-E
O conflito `handoff_to: Leandro` continua explícito e não recebeu bypass.

## D10 — Gate preso ao HEAD
Foundation, Smoke, reviews, auditoria e Léo foram vinculados a `e3e70fbbd2c940ee66a8de9c418e0e8d32a4c668`.

## D11 — Squash preservou a tree validada
O merge `67d20e24fd136f6334bfd835cb775426f6514403` e o candidato compartilham a tree `def5edf77be8bdc32939d2b4bd5b1fcbcca649ec`.

## D12 — Próximo boundary
`MCF-RUNTIME-006-LOT-4-B-EVALUATE-AGENTS`. Produção continua bloqueada e Gate C segue parcial.
