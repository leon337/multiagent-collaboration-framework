# MCF Mission Control — contrato de observação independente (Issue #141)

## Contexto e autoridade
- Branch: feat/mcf-mission-control-read-only-141-20261116
- Baseline exato: main b88ccda900a477fd5490a8897bd663069354f6cd
- Origem: autorização direta de LEANDRO em 2026-11-16 para fase de implementação isolada e investigação da recuperação do PostgreSQL.
- Estado do discovery na Issue #141: DISCOVERY_IN_PROGRESS; não se presume que o PIP foi integralmente alinhado.
- Nenhum merge, deploy ou promoção é autorizado por este artefato.

## Fronteira de leitura
GET /v1/mcf/mission-control/read/latest?repository=owner/repository
Authorization: Bearer (MCF_MISSION_CONTROL_READ_TOKEN)

- A credencial é opcional na configuração; ausente ou vazia desativa a rota de leitura (fail closed).
- É uma credencial distinta de MCF_MISSION_CONTROL_TOKEN, MCF_RUNTIME_TOKEN, MCF_RECEIPT_SECRET e RATE_LIMIT_KEY_SECRET.
- A rota preserva o corpo canônico retornado por MissionControlService.latest; não cria um ledger derivado nem executa fases.
- O endpoint histórico GET /v1/mcf/mission-control/latest permanece com seu guard original, apenas para compatibilidade.
- POST /v1/mcf/mission-control/dispatch mantém o guard original; a credencial de leitura não é aceita no POST.
- O adapter local deve projetar somente campos sanitizados; não expor payload bruto, assinatura, segredo ou raciocínio.
- Atualização contínua e SSE são evolução posterior, condicionada à restauração do runtime.
- A versão atual fornece apenas a missão mais recente vinculada ao repositório, não o portfólio completo.

## Segurança
- Não atribuir online ou heartbeat a currentAgentId; é apenas atribuição materializada.
- Não admitir HUMAN_GATE, alteração de missão, criação de execução nem write path na observação.
- A falha da API deve resultar em SOURCE_UNAVAILABLE, limpando a projeção anterior; nunca substituir dados ausentes por simulações apresentadas como reais.
- Sem banco novo, sem migração, sem alteração na autoridade do MissionRuntime, sem fallback de API paga.

## Ativação posterior
1. Recuperar a persistência canônica usando dump e manifesto verificados em destino isolado; confirmar migrações, missões, eventos e receipts.
2. Executar os testes E2E contra uma instância real restaurada, isolada e autenticada.
3. Provisionar um valor aleatório para MCF_MISSION_CONTROL_READ_TOKEN distinto de todos os outros segredos, sem armazenar no Git, na UI ou nos logs.
4. Atualizar o adaptador local com a mesma chave de leitura, mantida em arquivo owner-only 0600.
5. Realizar auditoria independente, PRF e gates de promoção. Nenhum merge/deploy nesta fase.

## Diagnóstico de origem em 2026-11-16
- Render staging service mcf-runtime-staging-api tem histórico de falha DNS ENOTFOUND para o host PostgreSQL.
- A consulta à conta Render não retornou instâncias PostgreSQL disponíveis.
- Buscas no host local e no Drive conectado não localizaram um dump e manifesto verificáveis.
- O projeto Neon mcf-central-operacoes tem tabelas próprias e não representa o ledger canônico do MissionRuntime.
- Consequentemente: restauração real não efetuada e histórico de missões não declarado como recuperado.
