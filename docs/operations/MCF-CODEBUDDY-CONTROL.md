# MCF — Capability local de controle do CodeBuddy Code

**Missão:** `MCF-CODEBUDDY-CONTROL-001`
**Classificação:** `LOCAL_IMPLEMENTED` no host `leo-N43SM`; **não é** adapter integrado ao `MissionRuntime` central.
**Autoridade:** LEANDRO (humano, autoridade final); MESTRE (orquestrador); LÉO (agente distinto).
**Fonte:** `AGENTS.md`, `docs/MCF-CURRENT-STATE.md`, protocolo operacional vigente e estado live do host.

## Finalidade

Permitir que o MESTRE use o CodeBuddy já instalado no computador via uma ferramenta remota autorizada (Remote Desktop Commander ou SentinelX) e um wrapper de CLI, sem depender de cliques na PWA.

```text
MESTRE (sessão ChatGPT)
    └── executor remoto autorizado (MCP de computador)
         └── /home/leo/agent-sandbox/bin/mcf-codebuddy
              ├── doctor / status / start / restart
              ├── prompt -> codebuddy --print --permission-mode dontAsk
              └── resume -> codebuddy --resume SESSION
                  └── modelo / ferramentas do CodeBuddy
    (em paralelo)
    systemd --user: codebuddy-web.service
         └── 127.0.0.1:46514 (HTTP Web UI + ACP anunciado pelo CodeBuddy)
```

A presença do gateway HTTP não prova que um cliente ACP externo completou o handshake. **Controle comprovado nesta missão é por CLI headless.** Não confundir a PWA, sessão de CLI e o runtime persistente de missões do MCF.

## Inventário confirmado

- CodeBuddy versão `2.181.0` (`@tencent-ai/codebuddy-code`).
- CLI no Node v22.23.2: `/home/leo/.nvm/versions/node/v22.23.2/bin/codebuddy`.
- Serviço existente: `/home/leo/.config/systemd/user/codebuddy-web.service`.
- Gateway: `http://127.0.0.1:46514/`; `--auth password` e credencial preexistente em `~/.codebuddy/settings.json` (não copiar para logs).
- Modelo do serviço e do wrapper: `fast-model`; o modelo global `gpt-5.6-sol` permanece preservado mas foi recusado para a conta atual (`personal_free_user`).
- `trustedDirectories` corrigido para `/home/leo/multiagent-collaboration-framework`.
- `systemctl --user`: serviço habilitado/ativo; `loginctl show-user leo -p Linger`: `yes`.

## Operação

```bash
CB=/home/leo/agent-sandbox/bin/mcf-codebuddy

"$CB" doctor
"$CB" status
"$CB" prompt "Faça inventário somente leitura do projeto, sem alterar arquivos."
"$CB" resume SESSION_ID "Continue a análise."
"$CB" restart
```

O wrapper usa JSON do CodeBuddy e extrai somente o evento final `type=result`, sem imprimir o histórico completo de prompts/memórias (que pode conter material sensível). Retorna `ok`, `result`, `session_id`, duração e custo reportado. Tem timeout máximo de 300 s, restringe diretório a `trustedDirectories`, força `dontAsk` para não contornar permissões e recusa mensagens malformadas. Alterações de contas, publicação ou merge não são autorizadas automaticamente por este mecanismo.

Para comandar em outra sessão do MESTRE, usar o conector remoto e executar **o comando exato já instalado**, sem reinstalar Node/npm ou criar outro gateway.

## Reinstalação e rollback

Código versionado: `tools/mcf-codebuddy-control/`.

```bash
bash tools/mcf-codebuddy-control/install-local.sh
bash tools/mcf-codebuddy-control/rollback-local.sh --baseline
# Alternativa: --latest (última reinstalação, e não o estado original)
```

A instalação faz backup privado, preserva o JSON existente, usa `localhost` com senha e fixa um modelo efetivamente testado. Os backups, que contêm credenciais, ficam exclusivamente em `~/.codebuddy/backups/mcf-codebuddy-control-001/` (`0700`/arquivos `0600`), não entram no Git. Um recibo com **caminhos sem segredos** fica em `~/agent-sandbox/runs/MCF-CODEBUDDY-CONTROL-001/`.

O rollback `--baseline` restaura as duas configurações pré-missão e retorna `codebuddy-web.service` a `disabled/inactive`, como verificado no diagnóstico inicial. Não executá-lo quando houver outras sessões usando o gateway.

## Evidência da missão

- Estado anterior: CLI instalado, mas serviço `disabled/inactive`, porta `46514` com `ECONNREFUSED`, trusted directory antigo inexistente.
- Estado posterior: porta em `127.0.0.1:46514`, `HTTP 200`, serviço `enabled/active`, gateway autenticado.
- Teste não interativo `fast-model`: resultado `MCF_CODEBUDDY_READY_OK`, `is_error=false`, custo reportado US$ 0.
- Wrapper: `prompt` devolveu `CONTROLE_MCF_CODEBUDDY_PASS` e `resume` devolveu `CONTINUIDADE_MCF_PASS` no mesmo `session_id`.
- Testes unitários: `python3 -m unittest discover -s tools/mcf-codebuddy-control/tests -v` (11/11).
- Login da PWA confirmado visualmente por captura pós-autenticação; a tela exibiu as mensagens CONTROLE_MCF_CODEBUDDY_PASS e CONTINUIDADE_MCF_PASS enviadas pelo CLI e suas respostas. O seletor da PWA exibiu Fast. Isso não comprova handshake ACP de terceiro.
- Ainda não foi testado um **reboot real** (não reiniciar o computador sem necessidade). A persistência está configurada por `systemctl --user enable` + `Linger=yes`.

## Segurança e governança

- Nunca mudar para `--auth none` nem publicar a porta em `0.0.0.0`.
- Nunca incluir credencial em prompt, Git, journal, screenshot de código, logs ou recibos.
- Seguir HDF, gates, PRF, evidência e autorização exata para qualquer escrita externa.
- Não considerar `CLI OK` como prova de integração automática ao `MissionRuntime` ou a outras sessões PWA.
- Classificar como capacidade local disponível e testada; uma skill executável central depende de contrato/adapter/teste próprio.

## Rota MCP de contingência comprovada

Além do Remote Desktop Commander, o SentinelX conectado ao mesmo host aceita o prefixo de comando permitido sudo -H -u leo python3 (sem mudar allowlists). Para usar CodeBuddy quando o Desktop Commander não disponibilizar execução:

    sentinel_exec:
      host_id: host_6ce0886ba346c787
      command: sudo -H -u leo python3 /home/leo/agent-sandbox/bin/mcf-codebuddy doctor

Para enviar uma missão, substituir doctor por prompt 'TEXTO DA MISSÃO' --timeout 90. O wrapper seleciona o Node v22 do NVM no subprocesso, evitando o Node v18 do sistema. E2E confirmado: MCF_SENTINEL_MCP_OK, código de saída 0, controller_ok=true, sessão real e custo reportado US$ 0.

O SentinelX tem política de comandos por prefixo. A missão não ampliou sua allowlist nem reiniciou seu serviço. O wrapper conserva as permissões do CodeBuddy e restringe o diretório de trabalho aos caminhos confiáveis.
