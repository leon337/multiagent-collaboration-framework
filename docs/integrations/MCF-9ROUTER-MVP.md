# MCF / 9Router — Integração experimental (Issue #496)

## Limite de responsabilidades
O MissionRuntime do MCF, o Human Delegation Firewall e o Execution Binding são os únicos donos da autorização. O 9Router é exclusivamente um transporte de inferência; ele não recebe permissão para executar skills, ferramentas ou operações materiais.

## Implementação instalada
- Relay OCI Always Free (1 GB): 9Router 0.5.112 com Node v22.23.4, pacote fixado e arquivo Node verificado por SHA256.
- Usuário opc, serviço systemd --user mcf-9router.service; porta 127.0.0.1:20128.
- Variáveis privadas em /home/opc/.local/share/mcf-9router/9router.env (0600); DATA_DIR restrito.
- CPUQuota=90%, MemoryMax=700M, MemorySwapMax=240M, restart on failure. Serviço persistente via linger.
- Notebook: túnel systemd --user mcf-9router-oci-tunnel.service, 127.0.0.1:20129 para 127.0.0.1:20128 remoto.
- A instalação anterior do 9Router no notebook em 127.0.0.1:20128 permanece intacta.

## Adaptador
Arquivo: apps/rede-social-agentes/apps/server/src/mcf-runtime/nine-router-model-gateway.adapter.ts
- Habilitação explícita e ausência de chave falham em fechado;
- Endereço permitido somente http://127.0.0.1:20129/v1 (túnel privado);
- Lista explícita de modelos gratuitos **verificados** pelo operador;
- Limites de tamanho, tempo, tokens e resposta, sem fallback automático controlado pelo adaptador;
- Modelo reportado fora da lista de verificados é rejeitado;
- Telemetria sem prompt nem segredo, mas NÃO é um receipt assinado do MCF;
- O adaptador NÃO está conectado ao runtime de produção nem ao ProviderAdapterRegistry.

Importante: o roteamento interno do 9Router ainda precisa ser configurado para não selecionar provedores pagos. Uma lista no adaptador não consegue provar custos internos zero. A gratuidade exige confirmação de provedor, cotas e termos atuais.

## Teste e isolamento
- GET /api/health HTTP 200, via SSH e via túnel.
- GET /v1/models sem chave HTTP 401.
- Node --experimental-strip-types --test .../nine-router-model-gateway.adapter.test.mjs: oito testes sintéticos passaram.
- Nenhuma inferência real ou credencial de provedor usada.

## Operação e rollback
- Relay: systemctl --user status mcf-9router.service
- Relay: systemctl --user stop mcf-9router.service (rollback reversível; não apaga dados/segredos).
- Notebook: systemctl --user status mcf-9router-oci-tunnel.service
- Notebook: systemctl --user stop mcf-9router-oci-tunnel.service
- Nenhuma porta foi aberta na VCN para o gateway.
- O serviço de sistema criado primeiro e que falhou por SELinux 203/EXEC permanece como item de cleanup de engenharia; não remover cegamente.

## Browser Control
A solicitação MCF-9ROUTER-BROWSER-20261102, ID 04804257185e4f0b, foi marcada CONFLICT porque a missão OCI anterior ainda estava ativa para chatgpt-main. Somente o Electron pode encerrar/revogar essa autorização. Nova proposta exige resolução do conflito; não fazer bypass ao estado do gateway.

## Pendências antes do cutover dos agentes
1. Resolver HUMAN_GATE da missão de navegador no Electron.
2. Configurar provedores exclusivamente gratuitos, com credenciais legitimamente autorizadas e aferir cotas.
3. Testar inferência real em prompt sintético, streaming se necessário e resposta íntegra.
4. Conectar via contrato de Execution Binding com HDF e evidência/receipts, não por import informal.
5. Avaliação independente, rollback E2E, full typecheck, revisão em PR e gate de LÉO.
