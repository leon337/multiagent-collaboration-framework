# PHASE-006-LOT-4-A-INTERNAL-CORE-SKILLS — Decisões

## D1 — Decompor o Lote 4
O Lote 4 foi dividido em incrementos menores. O Lot 4-A contém apenas quatro skills internas de núcleo, reduzindo blast radius e permitindo evidência específica por capacidade.

## D2 — Introduzir `READY_AGENT`
`READY_AGENT` representa trabalho que deve ser executado pelo agente responsável dentro do runtime governado. Ele não é bootstrap automático e não é ação externa.

## D3 — Recibo assinado não basta
Uma assinatura interna prova integridade do recibo, mas não prova que produto, arquitetura, UX ou contexto foram realmente produzidos. Por isso o runtime exige `execution_evidence` semântica e a revalida antes do sucesso.

## D4 — Canonizar o provider interno
O caminho de execução, a política de permissão e a validação do recibo usam a mesma canonicalização de provider para impedir divergência entre autorização e despacho.

## D5 — Rejeitar placeholders semânticos
Arrays obrigatórios devem conter itens com conteúdo real. Valores como string vazia, `null`, arrays aninhados ou objetos vazios não satisfazem evidência obrigatória.

## D6 — Registry continua declarativo
`skills/registry.yaml` continua definindo contrato, owner, entradas, ferramentas, permissão, evidência, fallback e handoff. A executabilidade é limitada pelo contrato tipado, `SkillExecutor`, permissões e validação de evidência; não foi criado campo `executable` artificial no registry.

## D7 — Persistência é parte do aceite
Foi adicionado teste integrado do `MissionRuntime` para provar que execução validada, recibo, eventos, handoff e incremento de versão atravessam a fronteira de persistência.

## D8 — `MCF-CLOSE-PHASE` fica para Lot 4-E
O conflito documental `handoff_to: Leandro` é incompatível com o HDF e será reconciliado no incremento dedicado. Nenhum bypass foi introduzido nesta fase.

## D9 — Sem ampliação de efeitos externos
Produção permanece bloqueada, o live staging adapter permanece desabilitado e nenhuma nova escrita externa foi autorizada pelo Lot 4-A.

## D10 — Resolver o registry a partir do CWD real do servidor
A validação integrada mostrou que `SkillRegistryLoader` não alcançava o registry raiz quando o pacote server executava com CWD em `apps/rede-social-agentes/apps/server`. Foi adicionado o candidato `../../../../skills/registry.yaml`, preservando `MCF_SKILL_REGISTRY_PATH` como precedência configurável e mantendo um único registry canônico.
