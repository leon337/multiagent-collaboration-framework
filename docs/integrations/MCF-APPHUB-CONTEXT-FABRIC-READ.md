# App Hub → MCF Context Fabric: local read-only inventory

- **Estado:** implementação candidata isolada; branch de feature, não mergeada
- **Contrato:** `MCF_APPHUB_CONTEXT_FABRIC_READ_V1`
- **Ambiente:** laboratório local, disabled-by-default, **não produção**
- **Autoridade:** LEANDRO; orquestrador MESTRE
- **Fonte de verdade do inventário:** Google Cloud App Hub consultado ao vivo
- **Projeto piloto aprovado:** `mcf-potiguar-gemini-261109`
- **O que NÃO faz:** criar aplicativos, alterar IAM, habilitar serviços, modificar billing, emitir chaves API, registrar cargas ou gerar memória sem evidência

## Integração

O módulo NestJS `mcf-context` fornece `GET /v1/mcf/context/cloud/apphub`, com `McfAppHubInventoryReadTokenGuard`, `Cache-Control: private, no-store` e consulta sem parâmetros. O projeto e a localização são fixos no ambiente confiável do servidor: clientes **não podem** informar projeto, local, URL, operação, filtro, token nem comando.

O serviço usa o Google Cloud SDK CLI já autenticado no host para obter, em processo filho sem shell, um token OAuth temporário. Com ele, realiza **somente GET** nos três endpoints REST v1 do App Hub:

- `projects/{project}/locations/global/applications`
- `projects/{project}/locations/global/discoveredServices`
- `projects/{project}/locations/global/discoveredWorkloads`

As três coleções são lidas ao vivo e paginadas com limites fixos (10 páginas/coleção, 100 elementos/página, no máximo 1.000 registros/coleção). A resposta é uma projeção de campos conhecidos, sem conteúdo arbitrário de payload, com timestamp, fonte, escopo e contagens. Um erro em qualquer etapa impede a publicação de um resultado parcial.

Trata-se de **leitura de infraestrutura**, não de estado de missão. O inventário não autoriza uma ação e não substitui `MissionRuntime`, Context Fabric, PostgreSQL, receipts, Truth Contract ou o Human Delegation Firewall. `LIVE_REQUIRED` significa que um inventário anterior não prova o estado atual. Não há escrita no provider nem persistência dos payloads pela camada de integração.

## Configuração segura

Somente em laboratório local sob controle explícito, fornecer:

```sh
MCF_APPHUB_INVENTORY_ENABLE=LOCAL_READ_ONLY
MCF_APPHUB_PROJECT_ID=mcf-potiguar-gemini-261109
MCF_APPHUB_ACCOUNT=potiguaradm23@gmail.com
MCF_APPHUB_GCLOUD_BIN=/absolute/path/to/gcloud
MCF_APPHUB_READ_TOKEN=<dedicated-random-token-of-at-least-32-characters>
```

**Nunca** publicar valores de `MCF_CONTEXT_READ_TOKEN`, access tokens, chaves, cookie, refresh token, arquivo de credenciais ou histórico local em repositório, CI, logs ou respostas. A API retorna 503 se a integração não estiver habilitada. Em `NODE_ENV=production` o adaptador sempre permanece desabilitado, independentemente de outras variáveis.

Apenas `MCF_APPHUB_READ_TOKEN` (diferente dos tokens Context/Cloud/Ledger) abre o endpoint via `x-mcf-apphub-read-token`, exatamente uma vez no cabeçalho bruto. Reutilizar segredos desativa o adaptador de entrada. A política global de abuso limita a rota a 10 requisições/minuto por peer do socket (com `Authorization` externo ignorado para segmentação de bucket). A conta OAuth precisa de permissões de leitura, não de papéis de administrador. Para recurso App Hub, usar o menor privilégio possível (por exemplo, permissões equivalentes a `roles/apphub.viewer`), sem elevar IAM automaticamente. A autenticação via gcloud é intencionalmente um recurso de laboratório: **não** é o desenho de credenciais para produção.

## Evidência e risco

- Testes cobrem fail-closed: serviço desativado, produção, projeto malformado, query injection, IAM negado, dados inesperados, duplicidade, paginação circular, timeout, concorrência, não vazamento de payload e GET fixo.
- A API retorna um **receipt informativo**, `read_only: true`, `material_action: false`, `evidence_only: true`. Isso não equivale ao receipt de execução governada de ação externa.
- A capacidade é registrada em `context/capabilities/gcp-apphub-inventory-read.yaml` como **INACTIVE / DISCONNECTED / HISTORICALLY_VERIFIED** após o teste local de 2026-11-10. Uma configuração formal do loader deve vincular o arquivo à sua revisão exata antes de apresentá-la como capacidade canônica ativa.
- O laboratório realizou consulta REST real ao provider e smoke de rota HTTP NestJS/Fastify em loopback: 200 com token, 401 sem token, 400 com parâmetro de projeto, 404 para POST; inventário 0 aplicações, 7 serviços, 0 workloads. Isso **não** prova produção ou smoke com AppModule completo e guard global.
- Não reiniciar serviços de produção, ativar billing ou subir infraestrutura para obter E2E. Todo efeito externo posterior requer seus próprios gates.

Fontes: [App Hub REST API](https://docs.cloud.google.com/app-hub/docs/reference/rest) e [App Hub IAM roles](https://docs.cloud.google.com/app-hub/docs/roles-permissions).

## Revisão independente e aceleração de GPU

A revisão independente Codex CLI (somente leitura) declarou PASS para a árvore local corrigida, com ressalva explícita de que o commit anterior da PR não incluía o token exclusivo. O Qwen2.5-Coder 3B foi executado de verdade na AMD RX 580 via Vulkan, mas sua resposta curta PASS não é suficiente como auditoria independente por si só. Evidência quantitativa e limites em `docs/audits/2026-11-10-apphub-context-fabric-pr512-independent-review.md`.
