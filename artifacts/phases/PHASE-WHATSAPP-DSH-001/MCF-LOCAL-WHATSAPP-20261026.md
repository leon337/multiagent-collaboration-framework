# WhatsApp Local + DSH — evidência de integração
**Data:** 2026-10-26 (America/Recife)
**Estado:** MVP E2E PARCIALMENTE VALIDADO / LATÊNCIA INSTÁVEL
**Responsável humano:** titular autorizado da sessão WhatsApp
**PR:** https://github.com/leon337/multiagent-collaboration-framework/pull/476

## Objetivo
Estabelecer canal direto entre o WhatsApp do celular do titular e o perfil DSH isolado, usando o notebook Linux Mint, 9Router e Step 5 Preview, sem contratar intermediários nem depender do provisionamento do número de teste da Meta.

## Implementação real
- **Ponte:** `apps/mcf-wa-local`, Node.js, Baileys 6.7.24, biblioteca não oficial baseada no protocolo WhatsApp Web. Requer sessão de *Dispositivos conectados* e está sujeita a possíveis mudanças/restrições da Meta.
- **Serviço local:** `mcf-wa-local-link.service` habilitado no `systemd --user`, porta loopback 127.0.0.1:38766, propriedade do usuário local, sem abrir novas portas na internet.
- **Pareamento:** QR real exibido em `http://127.0.0.1:38766/pair` no MCF Dual Browser Cockpit. PIN, senha e QR não são armazenados no GitHub nem enviados para terceiros além do protocolo WhatsApp.
- **Regras:** processa exclusivamente mensagens de texto `/mestre ...` **enviadas pelo próprio usuário na conversa “Mensagem para você”**. Ignora contatos, grupos, status, mensagens recebidas de terceiros, mensagens antigas e mensagens sem prefixo. STOP/START explícitos, máximo 3 prompts/minuto e 800 caracteres por prompt.
- **IA:** chama o DSH real pelo perfil `mcf-whatsapp-dsh` (ferramentas perigosas desativadas) e Step 5 Preview via 9Router; estado de sessão DSH persistido em JSON privado 0600. Não executa ferramentas no sistema operacional.
- **Governança:** versão dedicada no PR draft, sem merge e sem mexer em Nilton Bebidas nem em sessões WhatsApp pessoais adicionais.

## Evidência operacional (não confundir com teste simulado)
1. Serviço local vinculado ao WhatsApp às ~00:26:56 BRT após QR Code escaneado pelo usuário. Evento `whatsapp_linked`, estado `phase=connected`.
2. Primeiro comando real `/mestre` chegou ao MCF e foi processado; evento `reply_success` às ~00:30:12 BRT. Contador `processed=1`, `failed=0`, sessionId do DSH persistido. Envio foi aceito pelo cliente WhatsApp; **não foi comprovado recibo de leitura do celular**, apenas sucesso de `sendMessage`.
3. Segundo comando foi aceito e encaminhado ao DSH (9Router logou requisição ao modelo), mas o Step 5 excedeu o timeout configurado de 240s: `reply_failed:dsh_timeout` às ~00:37:06 BRT, `processed=1`, `failed=1`.
4. Atualizada a bridge para enviar confirmação amigável após ~12s de processamento, com aviso de falha amigável caso ocorra timeout. Dois testes adicionais foram criados, totalizando **18/18 PASS**. Essa melhoria ainda não foi validada numa terceira mensagem real.
5. Bibliotecas podem imprimir metadados de ratchet Signal nos logs. Para evitar recorrência, o serviço foi atualizado para `StandardOutput=null` e `StandardError=null`, e os eventos próprios sanitizados agora são guardados apenas no arquivo local `~/.local/share/mcf-wa-local/events.log` (0600). Não foram apagados logs históricos de outros processos.
6. O serviço foi reiniciado com preservação de sessão e reconectou sem novo QR (`phase=connected`), com contador preservado `processed=1, failed=1`. Pareamento ainda pode ser revogado pelo titular no próprio aplicativo.

## Limites e riscos
- WhatsApp Web não oficial não tem garantia de estabilidade e pode acarretar restrições à conta. O uso limita-se à própria conversa, sem marketing em massa, scraping, contatos ou grupos.
- Step 5 teve uma resposta validada de ~78s e outra chamada concluída via bridge em ~100s, mas a segunda consulta feita depois do pareamento excedeu 240s. **Não alegar latência estável.**
- Contagem de testes unitários prova políticas locais, não qualidade de geração, disponibilidade do serviço externo ou compatibilidade duradoura com o protocolo WhatsApp.
- `/mestre parar` bloqueia envio tardio mas não interrompe o subprocesso ativo imediatamente; ele encerra dentro de seu próprio limite.
- **Estado operacional desejado:** conexão estável, confirmação de processamento, resposta dentro do limite e conversa continuada por múltiplos comandos após reinício. Apenas a primeira mensagem e a reconexão foram comprovadas de ponta a ponta no nível do cliente.

## Próxima validação
- Enviar nova mensagem curta em `Mensagem para você` (por exemplo `/mestre status`) para provar canal rápido sem IA e, separadamente, `/mestre Responda apenas OK` para validar a nova confirmação de processamento.
- Conferir contador `processed` e `failed` no painel e eventos privados. Não usar outras conversas como alvo.
- Medir p50/p95 de tempo de resposta de múltiplas mensagens antes de declarar uso contínuo e considerar backend secundário **somente com critérios explícitos de custo/segurança**.

## Reversibilidade
- Pausar sem desligar: `/mestre parar` na conversa própria.
- Encerrar serviço: `systemctl --user stop mcf-wa-local-link.service`.
- Revogar vínculo: WhatsApp → Dispositivos conectados → desconectar sessão MCF.
- O serviço `mcf-whatsapp-meta-test.service` e todos os outros perfis continuam isolados.

**Sem fornecedores comerciais, pagamentos, envios em massa, publicações ou operações destrutivas.**

## Ciclo 7 — 26/10/2026, correção de conversação natural
- **Causa operacional reproduzida:** o filtro anterior exigia prefixo `/mestre` em TODA mensagem. Exemplo `Oi mestre` era ignorado com `no_command`, mesmo em `Mensagem para você`, contrariando UX desejada.
- **Correção em produção no serviço local:** uma solicitação inicial explícita `/mestre` ativa `naturalMode=true`; a partir daí, texto simples enviado pelo próprio titular no chat de auto-mensagens é aceito, sem prefixo, até `/mestre parar`. Migração do estado antigo realizada com base em sessão DSH preexistente e interação explícita já validada. Modo persiste após reinício.
- **Segurança preservada:** contatos, grupos, listas e mensagens recebidas de terceiros continuam fora de escopo; respostas do bot `MESTRE:` são descartadas de modo independente do ID, evitando loops até em caso de corrida no envio. IDs deduplicados e histórico sincronizado continuam filtrados.
- **Atenção à privacidade:** enquanto naturalMode estiver ativo, novas mensagens de texto que o titular guardar no chat pessoal `Mensagem para você` podem ser enviadas ao modelo externo. Pausar com `/mestre parar`; reativar com `/mestre iniciar`.
- **Prova após correção:** eventos `accepted_prompt` e `reply_success` sucessivos, total **7 solicitações concluídas e 1 falha histórica**, sem falhas adicionais durante a validação. Gateway conectado após dois reinícios governados com ociosidade confirmada antes de reiniciar; não houve novo QR.
- **21/21 testes aprovados**, incluindo conversa natural, migração de sessão, STOP, grupos/contatos e proteção contra eco.
- **Modelo:** Step 5 Preview permanece como principal via 9Router. Teste isolado de outro modelo gratuito listado retornou `UNKNOWN_MODEL` (não registrado no perfil DSH); outro modelo gratuito previamente cadastrado retornou `QUOTA`. Nenhum fallback pago ou não validado foi habilitado.
- **Autoteste externo:** a tentativa de disparar um diagnóstico próprio via acesso remoto foi bloqueada pelo mecanismo de segurança do conector; essa operação não foi executada. O endpoint extra de autoteste foi retirado do código, e o serviço reiniciado na versão enxuta.
- **Estado:** SELF-CHAT NATURAL CONVERSATION PASS, com latência ainda dependente da disponibilidade de Step 5; não declarar homologaçao WhatsApp oficial.
