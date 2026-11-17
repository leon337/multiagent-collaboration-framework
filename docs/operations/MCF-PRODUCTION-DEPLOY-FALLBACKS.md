# MCF — Publicação sem dependência da Vercel: GitHub + Render + Neon

**Estado:** orientação operacional versionada + política pura de classificação com testes (não substitui HDF/PermissionEngine).  
**Criado:** 2026-11-17.  
**Gatilho:** falha `Vercel – mcf-ecosystem-roadmap` ou `Vercel – mcf-rede-social-agentes-web` com `build-rate-limit`, ou pedido de "outra forma de deploy" após atualização no MCF.

## 1. O que foi verificado em 17/11/2026

- `main@b10edfced251ef6a6494262c1319d93107eb7fc4` contém a skill documental `MCF-PROJECT-DRIVE-BACKUP`; documentação e fontes do repositório **público** são acessíveis sem Vercel.
- PR #555: `Documentation validation`, `Rede Social Container Smoke` e `MCF Production Readiness` concluíram com sucesso; merge em main confirmado.
- O workflow de staging #44153721333 concluiu `DEPLOYED` para o SHA exato `b10edfce…`. **Staging não é produção.**
- Os contextos Vercel associados reportaram `failure` com URL `upgradeToPro=build-rate-limit`. Isso descreve limitação da Vercel, **não** reprovação de CI GitHub nem da API Render.
- `render.yaml` define `rsa-api-free` (API Node/Docker) e `rsa-web-free` (site estático), `autoDeployTrigger: off`, health `/health/ready`. `ops/production-monitoring.json` aponta `https://rsa-api-free.onrender.com`.
- Neon conectado possui os projetos `rede-social-agentes-ia` e `mcf-central-operacoes`. O Neon é **PostgreSQL/persistência**, não hospeda o frontend ou o servidor Node; **verificar em tempo real** se o `DATABASE_URL` do serviço Render aponta para qual projeto/branch, sem imprimir credenciais ou a URL.
- Nas branches principal e staging consultadas do Neon `rede-social-agentes-ia`, a contagem de `mcf_missions`, `mcf_phases` e `mcf_events` era zero em 17/11/2026. Esse resultado não prova que a produção Render usa a mesma conexão, mas **não** permite afirmar que exista um gate persistido válido nesse banco.
- O workflow `.github/workflows/mcf-runtime-production-deploy.yml` exige `release_sha` exato, `mission_id`, `phase_id`, autorização persistida de LEANDRO e decisão operacional de LÉO. Não substituir por mero comentário, prompt ou aprovação genérica.

## 2. Roteamento canônico por superfície

| Superfície | Principal | Quando Vercel atingir o limite |
|---|---|---|
| Documentação pública/skills descobertas por novos chats | `GitHub main` (links `blob/main` ou raw, SHA verificado) | Publicar e ler diretamente no GitHub; **sem build Vercel** |
| Runtime/API do MCF | `Render rsa-api-free` | Consultar saúde, SHA e o workflow de promoção governada **do Render**, nunca a Vercel |
| Frontend web | `Render rsa-web-free` (alvo no `render.yaml`) | Verificar existência, deploy e saúde do serviço; promover pelo mecanismo autorizável específico da interface; se não há evidência de serviço ativo, **não** alegar publicação |
| Persistência | Neon **se o vínculo real do ambiente estiver confirmado** | Neon continua banco, não troca por hospedagem web |
| Vercel | Serviço opcional, sujeito a cota | Classificar `DEGRADED_OPTIONAL`, registrar status e não repetir builds/pedidos de upgrade cegamente |

## 3. Procedimento do MESTRE (sem pedir roteiro novamente)

1. Ler `AGENTS.md`, este manual, `render.yaml`, `ops/production-monitoring.json`, `.github/workflows/mcf-runtime-production-deploy.yml`, regras de autorização vigentes e estado ao vivo de GitHub/Render/Neon.
2. Verificar o tipo da mudança:
   - Apenas documentação/AGENTS, sem contrato de runtime: após PR, CI e merge aprovado em `main`, os arquivos públicos do GitHub **já são a superfície de publicação** para outros chats. Não disparar deploy do runtime ou build Vercel apenas para atualizar o conhecimento.
   - `skills/registry.yaml`, contratos YAML de skills, `apps/rede-social-agentes/**`, `render.yaml`: tratar como **potencial impacto no runtime**, requer CI e gates. Uma skill EXPERIMENTAL registrada não significa que foi implantado um adapter nativo.
3. Consultar `ops/deployment-provider-routing.mjs` e executar `node --test ops/deployment-provider-routing.test.mjs`. Essa função é **decisão de roteamento**, não permite escrita em produção.
4. Se os status checks da Vercel informarem `build-rate-limit`, não iniciar builds repetidos nem mudar Neon. Separar status Vercel de CI, Render staging e gate de produção.
5. Para publicação de frontend, confirmar serviço `rsa-web-free` no workspace Render autorizado, build da versão e disponibilidade. Não usar hook do `rsa-api-free` como se promovesse automaticamente o frontend.
6. Para promoção de API, verificar `/health/version` e `/health/ready` do Render em HTTPS com tolerância a cold start; conferir SHA instalado; confirmar `MISSION_ID` e `PHASE_ID` reais, autorização humana **persistida** para SHA exato e gate de LÉO; então executar somente o workflow canônico `MCF Runtime Production Deploy`. Antes de retry após timeout, reconciliar resultado do provider.
7. Conferir na fonte do provider o ambiente, SHA, deploy, saúde e receipts; se não houver autorização, marcar `PRODUCTION_BLOCKED_GATE`, preservando ambiente saudável anterior.
8. Não reconfigurar banco (Neon/Render), trocar `DATABASE_URL`, alterar domínio, serviço ou transferir dados só para remover um status check Vercel.

## 4. Estado de entrega sem exageros

- `KNOWLEDGE_PUBLISHED_GITHUB`: merge/arquivo verificado em `main`, disponível aos novos chats; **não** prova deploy do runtime.
- `STAGING_DEPLOYED`: workflow e health verificados no staging para SHA exato.
- `PRODUCTION_DEPLOYED`: somente com gate persistido, workflow governado `DEPLOYED` e `/health/version` + `/health/ready` confirmados pelo provider.
- `VERCEL_LIMITED_OPTIONAL`: Vercel sem build, outras superfícies independentes preservadas.
- `PRODUCTION_BLOCKED_GATE`: não tentar alternativa de host sem as mesmas exigências de autoridade.

## 5. Antirregressão

O arquivo `ops/deployment-provider-routing.mjs` contém um resolvedor de rota **puro**. Seus testes verificam que: Neon nunca é tratado como runtime; publicação de docs usa GitHub; limitação Vercel não libera produção; alterações em registry seguem boundary de runtime; SHA inválido bloqueia; mesmo com gates válidos, o resolver **não executa** deploy.

**Princípio:** `VERCEL_RATE_LIMIT != NEON_PRODUCTION_HOST` e `DOCUMENTATION_PUBLISHED != RUNTIME_PRODUCTION_DEPLOYED`.
