# MCF — F3 Network Egress: prova de isolamento, sem falsa liberação

**Missão:** MCF-GEMINI-LIVE-EVOLUTION-20261116-001 (Issue #527).
**Origem de trabalho:** correção de consentimento P1 do PR #550, empilhada no PR #546.
**Modo desta prova:** verificação somente de **deny-all network namespace**, não implementação de navegação pública em produção.
**Executor:** MESTRE ChatGPT, em host Linux autorizado; papéis Emily/LÉO executados analiticamente por simulação mediante solicitação expressa de LEANDRO. Isso não autentica agentes MCF.

## Ameaça existente

O gateway em apps/gemini-live-studio/mcp-playwright-gateway.cjs rejeita URLs com IPs privados literais e bloqueia redirecionamento após a navegação. Isso **não garante isolamento de rede**: DNS rebinding pode resolver hostname aprovado para endereço interno depois do preflight, e páginas públicas podem criar subrequests, redirecionamentos ou conexões para endereços privados antes de uma verificação pós-fato. A credencial de permissão por voz não é autenticação HDF nem autorização do usuário contra replay.

## Mitigação demonstrada neste passo

O script ops/security/mcf-f3-netns-egress-probe.py cria um **namespace de rede Linux separado** com unshare -Urn, sem interfaces de saída, em um subprocesso temporário. Testa conectividade TCP de dentro do namespace para:

- loopback IPv4 do host, em porta efêmera criada pela prova;
- endpoint de metadados link-local 169.254.169.254;
- IPv4 privado 10.15.15.15;
- IPv4 público 1.1.1.1 (mostra que o modo é deny-all);
- loopback IPv6 ::1 (se socket for suportado).

A prova confere a identidade diferente do network namespace e que o host não recebeu conexão. Usa timeouts, não requer root na máquina e não modifica regras de firewall, serviços ou produção. Caso unshare seja proibido, retorna falha explícita.

**Resultado observado no host de teste:** namespace separado e os cinco destinos bloqueados; saída em artifacts/phases/PHASE-GEMINI-LIVE-EVOLUTION-03/F3-NETNS-DENY-ALL-20261117.json.

## O que isso NÃO prova

- **NÃO é navegação HTTPS pública funcional.** O namespace impede *toda* a rede, inclusive páginas legítimas.
- **NÃO é sandbox produtivo anti SSRF/DNS rebinding:** requer ligar o processo @playwright/mcp ao namespace, definir proxy de saída fora do isolamento com allow/deny por DNS/IP em cada conexão, bloquear bypass e resolver cada redirecionamento/subrequest, impor IPv4/IPv6, auditar firewall egress e testar ataques adversariais reais.
- **NÃO comprova HDF/PermissionEngine, identidade/autorização de origem, segurança de microfone, leitor de tela ou gate formal.**
- **NÃO autoriza** desativar o bloqueio de produção, expor o Studio na internet ou integrar PRs na main.

## Próxima etapa de engenharia

1. Construir proxy de egress com política central (TLS CONNECT, resolução controlada e proteção contra IPs privados, link-local, IPv6 e mudanças de DNS) e recibos de conexão; não usar apenas regex de URLs.
2. Colocar o browser MCP em namespace sem saída direta; conectar somente ao proxy supervisionado por canal autorizado e comprovadamente restrito. Rejeitar execução se proxy/política não estiverem ativos (*fail-closed*).
3. Testar public HTTPS permitido e negar loops, metadados, file://, redirects para privado, hostname público rebindado para privado, DNS dual-stack e recursos de página.
4. Integrar a autorização contextual do PermissionEngine/HDF e validar testes físicos de voz, com auditoria independente posterior.
5. Manter F3.7, F0.8, F1.6, F2.6 e F4.6 abertos até cumprimento dos critérios canônicos.

## Teste reprodutível

python3 -B ops/security/mcf-f3-netns-egress-probe.py

O retorno passed=true significa **exclusivamente** sucesso da prova de bloqueio completo de rede no namespace. O retorno JSON inclui, separadamente, ssrf_dns_rebinding_protection_qualified=false e public_https_navigation_supported=false. Não transformar nenhum desses dois campos em verdadeiro sem nova implementação e evidência.
