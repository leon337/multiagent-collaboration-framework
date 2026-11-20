# MCF — Google Bridge no MissionRuntime (MVP read-only)

**Missão:** MCF-GOOGLE-BRIDGE-RUNTIME-READONLY-20261120  
**Responsável:** MESTRE, sob autorização de LEANDRO.  
**Base:** `main` verificada antes da branch; implementação isolada e sem deploy.

## Problema e limite

O computador `mcf-gpu-x99` tem a Google Bridge local na porta `127.0.0.1:8755`, com OAuth Workspace e ADC Cloud autentificados. O MissionRuntime central não possuía adaptador governado para essa Bridge. Este MVP adiciona um adaptador **somente de leitura de projetos Cloud e status**, sem ampliar a superfície de escrita. Não implementa interação direta de chat livre ou uso de Gemini pago.

## Contrato de execução

- Skill: `MCF-GOOGLE-CLOUD-READ`, perfil `READ_ONLY`, dona `Mestre`.
- Provider: `mcf-google-bridge`, recurso: `google-cloud`.
- Operações: `status` -> `google.status`; `list-projects` -> `google.cloud.projects`.
- O `PermissionEngine` restringe explicitamente skill + provider + recurso + operação, antes de qualquer conexão.
- O `AdapterRegistry` inclui `GoogleBridgeReadAdapter`; `ExternalActionDispatcher` usa sua reserva de ação e ledger canônico; `EvidenceValidator` assina o recibo contendo trace ID, contagem, projetos ou indicadores de status.
- O adaptador monta requisições fixas `{operation,args:{}}`: nunca encaminha `inputs` arbitrários de agentes à Bridge.
- Há validação de formato, tamanho máximo de resposta, timeout e erros tipados. Somente projetos com `projectId`, `displayName` e `state` válidos entram no recibo; não se grava token/refresh token nem conteúdo Gmail/Drive no ledger.

## Habilitação local deliberada

**Desligado por padrão.** Ativar `MCF_GOOGLE_BRIDGE_RUNTIME_ENABLED=true` apenas no processo do **MissionRuntime co-localizado no computador que já executa a Bridge**, sob controle do operador. Não configurar essa variável em Render/Vercel ou outro host sem a Bridge local; `localhost` de um servidor remoto não aponta para o `mcf-gpu-x99`.

A Bridge deve permanecer ouvindo **somente** `127.0.0.1:8755`. Não usar tunnels públicos, Tailscale Serve, proxy reverso ou encaminhamento externo para contornar autenticação; será necessária nova arquitetura com identidade de workload, autorização, TLS e HDF se o runtime remoto precisar do serviço. O adaptador usa somente a URL local fixa e lê token do arquivo `~/.config/mcf-google-bridge/http-token`, sem registrar seu valor; arquivo deve ser regular, pertencente ao processo e com permissões 0600 ou mais restritas.

Ao habilitar em um runtime local com ledger, solicitar a skill com provider e recurso exatos. A consulta produz recibo assinado, somente leitura. **Ativar a variável não inicia missão, não publica serviço, não faz merge/deploy e não autoriza ações em contas Google.**

## Verificações de aceitação

1. `pnpm --filter @rsa/server typecheck` e testes focados do adaptador + composição do módulo.
2. Falha fechada quando desativado; nenhum request à Bridge sem `enabled=true`.
3. Bloqueio de `generate`, `search-gmail`, `write-project`, recursos/providers diferentes e skills não autorizadas.
4. Teste de `status` e `list-projects` com transporte simulado: JSON exato, resposta tipada e recibo sem segredos.
5. E2E no host co-localizado: `/healthz` e `google.cloud.projects` retornam HTTP 200 usando credenciais privadas mantidas no host. Não publicar logs com Bearer.
6. Não declarar produção ou dispatcher distribuído concluídos sem integração E2E de missão autenticada, banco/ledger e gate operacional no runtime-alvo.

## Futuras fases (fora deste PR)

- Integração segura entre runtime remoto e host local, usando workload identity e canal autenticado, depois de análise de ameaça.
- Leitura governada de Workspace (Drive/Gmail/Calendar), incluindo política de dados pessoais e retenção do ledger.
- Descoberta de modelos Gemini; geração paga opt-in explícito e controle de quota.
- UI do Painel Central e observabilidade de saúde, sem expor credenciais.

## Evidência de formatação

Os quatro arquivos TypeScript alterados foram formatados por Prettier 3.9.6 em uma execução isolada do GitHub Actions, e o workflow temporário de formatação foi removido pelo mesmo commit. A suíte final deve ser aferida novamente no SHA posterior a essa execução; nenhum CI histórico de SHA anterior substitui essa verificação.
