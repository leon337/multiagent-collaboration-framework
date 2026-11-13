# MCF CodeBuddy Control — plano de implementação

> Missão: MCF-CODEBUDDY-CONTROL-001. Execução local autorizada por LEANDRO. Sem merge ou deploy de produção.

**Objetivo:** permitir ao MESTRE comandar o CodeBuddy Code já instalado por CLI e observar o Gateway local ACP/Web com autenticação, persistência, trilha de evidências e rollback.

**Fonte de verdade:** documentação vigente de `leon337/multiagent-collaboration-framework` e estado do host `leo-N43SM`.

**Arquitetura:** Remote Desktop Commander/SentinelX (executor remoto governado) → `mcf-codebuddy` (wrapper seguro) → CLI CodeBuddy 2.181.0 → modelo/ferramentas; em paralelo, `codebuddy-web.service` → HTTP 127.0.0.1:46514 → Web/ACP. Não declarar integração direta ACP end-to-end sem handshake verificado.

**Restrições:** não instalar outro CodeBuddy; preservar credenciais; jamais `--auth none`; evitar porta pública; não alterar `main`; sem git merge/deploy; não usar `--dangerously-skip-permissions`; preservar permissões do CodeBuddy.

## Entregáveis

- [x] Identificar CLI e serviço existentes; comprovar estado inicial (serviço disabled/inactive e porta recusando conexão).
- [x] Criar backups privados do settings e unidade systemd.
- [x] Corrigir trusted directory desatualizado e proteger HTTP gateway com senha preexistente.
- [x] Habilitar e iniciar serviço systemd do usuário.
- [x] Comprovar listener `127.0.0.1:46514` e HTTP 200.
- [x] Criar wrapper CLI com comandos `doctor`, `status`, `start`, `restart`, `prompt`, `resume`.
- [x] Testes unitários da configuração, segurança, construção de comando e inspeção.
- [x] Teste headless real controlado com resposta de marcador; registrar resultado sem segredos.
- [x] Documentar capability operacional no MCF, critérios de aceite, rollback e limitações.
- [ ] Validar serviço persistente após `restart` controlado e status final, commit isolado e eventual PR sem merge.

## Critérios de aceite

1. Serviço `enabled+active` e gateway autenticado apenas em loopback.
2. `mcf-codebuddy doctor` fornece status sem credenciais.
3. `mcf-codebuddy prompt` consegue efetuar ao menos uma mensagem real (se o provedor estiver autenticado). Caso contrário, declarar bloqueio de autenticação sem simular sucesso.
4. Scripts versionados e testados; cópias locais instaladas; rollback documentado.
5. Nenhum push/merge/deploy ou publicação comercial sem gate compatível.

## Falhas a verificar

- Unit presente, mas inativa após reboot: status, enable, restart, journal.
- Usuário remoto sem DBUS_SESSION_BUS_ADDRESS: resolver por /run/user/1000/bus.
- Credencial de gateway ausente: recusar inicialização insegura.
- Prompt não interativo aguarda permissão: usar `dontAsk`, sem bypass.
- Diretório confiável inexistente ou alterado: validar antes de invocar.

## Agentes funcionais

MESTRE coordena; Sofia (arquitetura), Rafael (engenharia), Renato (QA) e Emily (auditoria) são responsabilidades propostas de revisão — sem atribuir ações ou aprovações fictícias a agentes não invocados.
