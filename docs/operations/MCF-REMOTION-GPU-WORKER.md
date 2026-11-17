# MCF — Remotion GPU Worker privado

**Estado observado:** runner privado ONLINE; capability do MissionRuntime ainda NÃO EXECUTÁVEL.  
**Data da observação:** 2026-11-17T05:45:46Z.  
**Missão relacionada:** Issue #545 — MCF-REMOTION-PRODUCTION-ACTIVATION.

## 1. Separação de repositórios

| Repositório | Visibilidade | Responsabilidade |
|---|---|---|
| [multiagent-collaboration-framework](https://github.com/leon337/multiagent-collaboration-framework) | PUBLIC | Contratos, skill, capability manifest, governança e instruções reutilizáveis por outros chats |
| [mcf-remotion-mcp](https://github.com/leon337/mcf-remotion-mcp) | PRIVATE | Worker MCP local, workflow e runner GPU |
| [mcf-remotion-studio](https://github.com/leon337/mcf-remotion-studio) | PRIVATE | Composições e Studio Remotion |

**Regra:** nunca registrar um runner self-hosted no repositório público MCF. O runner pertence exclusivamente ao repositório privado `leon337/mcf-remotion-mcp`. O repositório público documenta como descobrir e governar essa capacidade; não recebe acesso ao computador.

## 2. Registro verificado do runner

| Campo | Valor observado |
|---|---|
| Runner ID | `2` |
| Nome | `leo-N43SM-remotion-gpu` |
| Repositório | `leon337/mcf-remotion-mcp` |
| Estado | `online`, `busy=false` |
| Versão | `2.338.2` |
| Labels | `self-hosted`, `Linux`, `X64`, `mcf-remotion-gpu`, `amd-rx580`, `remotion` |
| Host | `leo-N43SM`, Linux Mint 22.1, x86_64 |
| GPU | AMD Radeon RX 580 |
| Serviço | `systemd --user`, `mcf-remotion-gpu-runner.service` |
| Boot | serviço enabled; `Linger=yes` confirmado |
| Conta de execução | usuário Linux `leo`; **não isolada** |

O binário oficial Actions Runner `v2.338.2` teve SHA-256 conferido com o digest do release GitHub: `baebf204307bac6193480852732f0aba2ae97b6c5597c244f4d5558390147c40`.

A evidência de registro é a resposta autenticada da API de runners do repositório privado. Para reconfirmar em qualquer sessão com acesso ao repositório:

```bash
gh api repos/leon337/mcf-remotion-mcp/actions/runners
```

A ausência de autenticação ou permissão ao repositório privado deve ser tratada como `UNKNOWN`, nunca como runner offline.

## 3. Segurança e restrições

O runner foi registrado no nível do repositório privado, não no nível da organização. Na inspeção, somente `leon337` aparecia como colaborador do repositório privado.

O runner executa como o usuário Linux `leo`. Portanto, qualquer workflow que chegue a esse executor herda permissões desse usuário e não deve ser tratado como sandbox. A instalação de uma conta de sistema dedicada ficou pendente porque a interface remota usada para esta instalação bloqueou elevação administrativa.

Até existir isolamento por conta de sistema:

1. Usar somente workflows declarados no repositório privado.
2. Aceitar apenas `workflow_dispatch` e branch `main`.
3. Não adicionar `pull_request`, `pull_request_target`, `issue_comment`, `workflow_run`, `schedule` ou gatilhos de terceiros.
4. Não aceitar comandos, shell, paths, scripts ou expressões arbitrárias como inputs.
5. Manter permissões mínimas no workflow e fixar actions externas por SHA.
6. Não imprimir registration tokens, MCP bearer token ou chaves Gemini.
7. Não compartilhar o runner com outros repositórios.
8. Nunca instalar esse runner no repositório público MCF.

A API de branch protection do GitHub retornou HTTP 403 informando que proteção de branches para esse repositório privado requer upgrade do plano ou tornar o repositório público. Não afirmar que `main` está protegida; usar revisão humana e o escopo privado como controles atuais.

## 4. Workflow de health check

O PR privado [#1](https://github.com/leon337/mcf-remotion-mcp/pull/1) propõe `.github/workflows/remotion-gpu-worker-health.yml` com:

- gatilho exclusivo `workflow_dispatch`;
- execução somente em `refs/heads/main`;
- runner label `mcf-remotion-gpu`;
- `permissions: contents: read`;
- sem checkout, inputs, secrets ou chamadas Gemini;
- verificação do hostname, `remotion-mcp.service`, `127.0.0.1:4777/health` e encoders VA-API;
- nenhuma criação de projeto, renderização, síntese de voz ou operação de escrita.

**Estado:** PR privado #1 foi MERGED em `main@4951d2e2650e75ab9825eb127f3c281b878a5e62`. O workflow foi executado por `workflow_dispatch` na `main`: [run #44028059898](https://github.com/leon337/mcf-remotion-mcp/actions/runs/44028059898), job `health` #133853084207, conclusão SUCCESS em 11 segundos.

O log comprova hostname, serviço `remotion-mcp.service`, endpoint local `ready`, binário Remotion no Studio e encoders `h264_vaapi` / `hevc_vaapi`. O workflow tinha `contents: read`, sem checkout, inputs, secrets ou actions externas. Não executou render, síntese de voz ou escrita MCP e não consumiu quota Gemini. Isso é um E2E de disponibilidade do worker, não um E2E de produção de vídeo ou de integração MissionRuntime.

## 5. Estado real da GPU e do worker

Evidências locais observadas:

- `remotion-mcp.service`: active e enabled;
- `http://127.0.0.1:4777/health`: resposta `ready`;
- FFmpeg anuncia `h264_vaapi` e `hevc_vaapi`;
- jobs anteriores têm `encoder=vaapi`, comprovando codificação por hardware;
- o diagnóstico do Remotion/Chrome informa Canvas/Rasterization software, WebGL e WebGPU desativados;
- o código atual passa `--hardware-acceleration=disable` ao Remotion.

Conclusão: **codificação AMD VA-API está disponível; composição dos frames por GPU não está comprovada**. Não descrever o pipeline como GPU end-to-end até corrigir o caminho de composição e medir o resultado.

A máquina estava com aproximadamente 3,8 GiB livres no momento do registro; manter reserva de pelo menos 1,5 GiB e evitar render 4K longo.

## 6. Fronteira do MCF MissionRuntime

O runner é transporte/infraestrutura, não autorização.

- `tools/remotion-mcf-adapter/adapter.mjs` conecta ao MCP local e permite somente operações da allowlist read-only.
- O adapter recebe `authorizeWrite=null` no estado atual; tentativa de escrita retorna `MCF_HDF_PERMISSION_ENGINE_NOT_CONNECTED`.
- `MCF-REMOTION-VIDEO-PRODUCE` continua skill experimental/documental.
- `McfExecutableSkillId`, `SkillRegistryLoader`, `PermissionEngine`, `ExternalActionDispatcher` e ledger ainda não executam a capability de vídeo.
- Não há integração de dispatch assinada do MissionRuntime ao workflow privado.
- Runner online não equivale a E2E de produção, autorização humana persistida, gate operacional de LÉO ou deploy.

Próxima evolução de runtime, em branch isolada: adapter dedicado no dispatcher; envelope assinado e limitado (missionId, phaseId, operation, projectId, idempotencyKey, expiry); allowlist de ferramentas; reserva idempotente; reconciliação após timeout; cancelamento/retomada; receipt com SHA-256, metadados e evidência persistida; testes negativos sem HDF e positivos com autorização válida; revisão independente. Escrita permanece fail-closed até essas provas.

## 7. Cold start para outros chats MESTRE

Ao retomar a capacidade em uma nova sessão:

1. Ler `AGENTS.md`, esta documentação, `context/capabilities/remotion-video-engine-local.yaml` e `skills/video/MCF-REMOTION-VIDEO-PRODUCE.yaml` no branch atual de `main`.
2. Consultar GitHub ao vivo para os SHAs dos três repositórios, estado/visibilidade do repositório privado, runner ID/nome/labels e workflows.
3. Confirmar que a sessão tem autorização real para o host `leo-N43SM`; não presumir que o computador da sessão atual é o host da GPU.
4. Confirmar `systemctl --user is-active remotion-mcp.service`, health local e discovery read-only. Não expor a porta 4777.
5. Distinguir `runner online`, `workflow health passed`, `MCP read-only connected` e `MissionRuntime executable`; são estados diferentes.
6. Se a sessão não tiver acesso ao repositório privado ou ao host, declarar `PRIVATE_DEPENDENCY_UNAVAILABLE` e apresentar instruções, sem simular execução.
7. Não produzir, sintetizar voz paga, publicar ou escrever no runtime sem a autorização/gates aplicáveis.

## 8. Estado de referência observado

- MCF public main: `97d79ee8152ead27564d2bf634ad63df5cc284e6`.
- Worker private main: `4951d2e2650e75ab9825eb127f3c281b878a5e62`.
- Studio private main: `433b9f75a0eeb70eaafa40f64310475101373e04`.
- Runner: ID `2`, online no repositório privado.
- Workflow de health: integrado à main privada; run #44028059898 SUCCESS.
- MissionRuntime write: bloqueado sem HDF.
- Produção: não autorizada por este registro.
