---
name: mcf-acesso-remoto-domestico
description: Configurar e recuperar acesso remoto doméstico autorizado com noVNC e Tailscale, evitando digitação repetida de senha. Usar para acesso pelo celular, redes diferentes, sessão persistente, erro 502, falha de senha e sendCredentials.
---

# Acesso remoto doméstico do MCF

Contrato: MCF-REMOTE-ACCESS-HOME, versão 1.0.0. Owner: MESTRE.
Consultar AGENTS.md, skills/registry.yaml e docs/tools/MCF-PLUGIN-PERMISSIONS.yaml na revisão atual do repositório. Esta skill orienta o agente; não adiciona executor ao runtime nem fornece acesso por si mesma.

## Escopo e decisões

- Confirmar sentido da conexão (celular → computador ou computador → celular), dispositivo, conta e autorização já existente. Não repetir pedido de autorização para o mesmo escopo.
- Distinguir autenticação da rede, autenticação VNC, login da conta TeamViewer e desbloqueio da sessão Linux. Não prometer que uma elimina as demais.
- Preferir ferramentas já conectadas e autorizadas; descobrir disponibilidade real antes de pedir ao humano que opere comandos.
- Reutilizar sessão válida ou chaves quando suportadas. Para noVNC legado, admitir envio automático de credencial somente atrás da identidade privada verificada.
- Não remover autenticação, abrir VNC publicamente, habilitar Funnel nem desativar bloqueio do Linux como atalho.
- Tratar endpoints, usuários, portas e IDs como configuração local descoberta, nunca como constantes universais.

## Diagnóstico por camadas

1. Inventariar ferramentas e alcançar o dispositivo correto; comprovar identidade do host.
2. Inspecionar Tailscale, identidade autorizada, regras de acesso e rotas Serve existentes. Preservar todos os caminhos não relacionados.
3. Inspecionar serviços VNC, websockify, frontend e sessão gráfica. Verificar bind em loopback, portas, usuário de execução e arquivo de credenciais sem imprimir seu conteúdo.
4. Distinguir falhas: 502 indica upstream/proxy indisponível; falha de senha exige verificar a credencial VNC; erro JavaScript exige inspecionar versão e estado do frontend. Uma tela de login TeamViewer não prova falha do VNC.
5. Testar HTTP e WebSocket correto. Para diagnóstico manual de Upgrade, usar HTTP/1.1; resposta 200 não comprova autenticação nem desktop.
6. Registrar causa, mudança mínima, backup protegido, resultado e limitações. Duas falhas iguais exigem mudar a abordagem, não clicar indefinidamente.

## Implementação autorizada

- Preservar acesso funcional durante a manutenção; guardar backup local protegido e definir reversão antes de editar.
- Preferir API RFB e evento credentialsrequired quando a versão instalada oferecer integração adequada.
- Se reutilizar interface noVNC em iframe da mesma origem, esperar o diálogo real de credenciais: classe noVNC_open em noVNC_credentials_dlg. Conferir os IDs e comportamento no código instalado.
- Nunca usar somente getClientRects(), existência do input ou timer como prova de conexão pronta. Campos ocultos podem ter geometria; envio prematuro causa leitura de sendCredentials em objeto indefinido.
- Enviar uma vez por solicitação, permitir nova tentativa apenas diante de novo estado e limitar reconexões em falha de autenticação.
- Não incluir senha em URL, query, fragmento, repositório, evidência, console ou histórico de comandos. Obter segredo de armazenamento local autorizado com permissões restritas.
- Se uma página fornecer a credencial ao navegador, declarar que isso é preenchimento automático, não autenticação sem senha nem segredo invisível ao cliente.
- Servir essa página somente por proxy privado que injete identidade confiável; validar allowlist e negar identidade ausente/incorreta. Headers de identidade são confiáveis apenas vindo do proxy controlado. Bind em loopback não protege contra processos locais maliciosos: registrar essa fronteira de confiança.
- Usar HTTPS, Cache-Control: no-store, Referrer-Policy: no-referrer, proteção contra enquadramento e arquivos/diretórios restritos. Não registrar corpo com segredo.
- Reiniciar somente o serviço alterado. Configurar recuperação e início automático no contexto correto; distinguir início de sessão de início do sistema. Não habilitar linger ou modificar boot sem necessidade e escopo.
- Rotação de senha: atualizar dependências autorizadas, testar e remover cópias antigas conforme a política local; não reutilizar segredos presentes em conversas.

## Critérios de aceite

Registrar cada item como PASS, FAIL ou NÃO TESTADO:
- identidade autorizada consegue abrir; identidade ausente/incorreta é negada;
- proxy e WebSocket chegam ao destino correto;
- conexão VNC autenticada e área de trabalho real observada;
- entrada de teclado/ponteiro testada com ação reversível, caso controle tenha sido pedido;
- recarga/reconexão não exige digitação e não dispara sendCredentials antes da hora;
- rotas anteriores e proteção de rede preservadas;
- persistência declarada no nível realmente verificado (reinício de serviço não prova reboot);
- teste no notebook não é descrito como teste no celular;
- evidências sanitizadas e rollback disponível.

Não fechar com sucesso apenas por HTTP 200, porta aberta, screenshot antigo ou serviço ativo.
Entregar link sem segredo, requisitos mínimos de uso, alterações e limitações comprovadas.

## Alternativas e bloqueios

Avaliar conforme evidência: (1) sessão remota já autenticada; (2) conector de desktop autorizado; (3) SSH/chave já provisionada; (4) noVNC pela rede privada; (5) ferramenta de suporte já instalada e autorizada; (6) recuperação local assistida quando não existir canal.
Não instalar seis ferramentas por rotina. Mudar de rota por falha técnica não permite contornar uma negativa de acesso.
Se nenhum canal estiver disponível, registrar AGUARDANDO_DEPENDENCIA_EXTERNA e solicitar apenas a intervenção indispensável, sem alegar que acessou.

## Caso que originou a skill

Em 2026-11-09, uma página privada tentou clicar no formulário antes de o RFB existir. A correção passou a aguardar noVNC_open no diálogo de credenciais. A conexão autenticada e a tela foram observadas no navegador do notebook; validação específica no celular e após reboot não foi comprovada por esse teste. Generalizar o procedimento, não os segredos ou identificadores daquela instalação.
