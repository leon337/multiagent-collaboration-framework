# MCF #496 — Relatório factual
MCF issue #496 criada; branch isolada feat/mcf-496-9router-gateway-mvp.
Browser Control: missão MCF-9ROUTER-BROWSER-20261102 proposta; pedido 04804257185e4f0b resultou em conflito com concessão OCI ainda ativa no mesmo cliente. Não ativada.
9Router@0.5.112 fixado; Node 22.23.4 obtido por HTTPS e SHA256 do upstream verificado.
VPS Relay Oracle Micro (1 GB), OCI Always Free: 9Router como serviço systemd do usuário opc; 700 MB RAM, 240 MB swap, CPU 90%; loopback 127.0.0.1:20128.
Node/9Router instalados em /home/opc/.local/share/mcf-9router/ com dados/segredos restritos. Inicialização do primeiro serviço de sistema falhou por contexto SELinux 203/EXEC; serviço do usuário iniciou, sem desativar SELinux. Unidade de sistema falhada permanece para limpeza administrativa posterior.
Linger de opc habilitado para persistir serviço após logout; túnel SSH em systemd no notebook 127.0.0.1:20129 -> Relay 127.0.0.1:20128.
Instância 9Router preexistente do notebook 127.0.0.1:20128 foi preservada.
GET /api/health retornou 200 remoto e por túnel; GET /v1/models sem chave retornou 401. Nenhuma inferência real executada.
dnf usado para consulta consumiu excessiva RAM e swap; apenas processos de dnf iniciados nesta missão foram interrompidos; sistema normalizado.
Adapter MCF experimental implementado; não conectado ao runtime ou produção.
