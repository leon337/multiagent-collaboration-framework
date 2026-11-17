# MCF — Recuperação de projetos em nuvem (v1)

**Capability:** `mcf.cloud-project-recovery.v1` · **Skill:** `MCF-RECOVER-CLOUD-PROJECT@0.1.0` · **Estado no runtime MCF:** `DECLARED / NOT_AUTHORIZED / DISCONNECTED / BLOCKED / NOT_VERIFIED`.

**Autoridade:** LEANDRO (humano), MESTRE (orquestrador); Miriam (contexto), Sofia (arquitetura), Rafael (integração), Renato (QA) e Emily (auditoria).

## Objetivo

Permitir que novas sessões do MESTRE descubram e reutilizem uma sequência comprovável para recuperar um projeto em outro computador, com código GitHub, backup cifrado e chave em Google Drive `appDataFolder`, sem transporte manual de chave.

O MCF é responsável por **descoberta, decisão, política e evidência**. A execução concreta pertence ao adapter do projeto autorizado. O registro não cria uma conexão MCP, não concede credenciais e não ativa o `SkillExecutor`.

## Entradas e descoberta

1. Consultar `AGENTS.md`, `docs/MCF-CURRENT-STATE.md`, `skills/registry.yaml`, `skills/cloud/MCF-RECOVER-CLOUD-PROJECT.yaml` e `context/capabilities/cloud-project-recovery.yaml`.
2. Ler `skills/cloud/mcf-project-recovery/SKILL.md` e este runbook.
3. Identificar `project_reference`, `recovery_goal` (inspect / backup / restore), `authorized_scope`, destino e fonte de verdade.
4. Verificar owner, privacidade, SHA, release e CI atuais no GitHub e checar o adapter presente na implementação do projeto. Não presumir que scripts do Estúdio Binaural existem em outro projeto.
5. Se uma ferramenta/credencial estiver indisponível, registrar `AGUARDANDO_DEPENDENCIA_EXTERNA`; nunca alegar execução simulada.

## Fluxo canônico

`DISCOVER → INSPECT → AUTHORIZE → BACKUP/RESTORE → VERIFY → RECEIPT → HANDOFF`

### Discover e Inspect — somente leitura

- Verificar repo, branch e commit de origem, integridade do SQLite, ocupação de disco, existência dos arquivos e data/tag do último snapshot.
- Verificar um único escritor/ambiente ativo. O backup não garante sincronização simultânea de duas instâncias SQLite.
- Confirmar que o próprio projeto dispõe de formato de backup, contrato de recuperação, estratégia de conflito e teste de retorno.
- `gh repo view OWNER/REPO`, `gh api repos/OWNER/REPO/commits/main --jq .sha` e `gh release list -R OWNER/REPO` são exemplos de **leitura**, nunca provas de acesso ao computador.

### Authorize — governança

| Operação | Gate necessário |
| --- | --- |
| Consultar docs e estado público | READ_ONLY |
| Ler repo privado ou Drive | Acesso autenticado e autorizado do titular |
| Consentimento OAuth, 2FA, CAPTCHA | HUMAN_GATE do titular; não automatizar nem contornar |
| Publicar backup cifrado/release | SCOPED_WRITE, autorização de missão e recibo |
| Configurar ou transmitir segredo do GitHub Actions | SCOPED_WRITE sensível, revisão de escopo e gate separado |
| Restaurar em destino vazio | Autorização para escrita no dispositivo e evidência do alvo |
| Substituir dados com `--replace` | HUMAN_GATE explícito, backup prévio e plano de rollback |
| Merge, deploy ou rotação de credenciais | Gates independentes, não concedidos por esta skill |

**Proibido:** credenciais/tokens/cookies/chaves no Git, no chat, em PRs ou em logs. URLs com `/u/N/` do navegador não comprovam a identidade da conta entre computadores.

### Backup — quando autorizado

- Esperar jobs serem concluídos/pausados; verificar integridade do snapshot consistente do banco, mídia e manifesto.
- Criptografar antes de upload. Publicar apenas arquivo cifrado no release privado permitido, com identificador e hash verificáveis.
- Garantir que a chave do backup fica fora do GitHub e que o provedor do projeto controla o `appDataFolder` privado da conta Google autorizada.
- Registrar `backup_tag`, SHA e verificação de leitura; não presumir que um upload equivale a backup restaurável.

### Restore — quando autorizado

- Confirmar identidade do projeto, máquina, sistema, dependências e diretório-alvo; falhar fechado com dados pré-existentes sem gate.
- Preparar cliente OAuth por canal seguro autenticado pelo projeto, nunca em texto aberto no Git; obter consentimento no Google.
- Validar identidade da conta retornada pelo OAuth. Recuperar chave do `appDataFolder` do aplicativo; rejeitar divergência de chaves.
- Baixar e autenticar backup AES-GCM; comparar manifesto/hash; restaurar em ambiente isolado ou destino autorizado, sem concorrência de escritores.
- Verificar SQLite, projetos, mídias, saúde de API e retorno operacional. Proteger o estado anterior e registrar rollback.

### Receipt / Handoff — após cada tentativa

```yaml
capability: mcf.cloud-project-recovery.v1
skill: MCF-RECOVER-CLOUD-PROJECT
project_reference: OWNER/REPO
source_sha: null
backup_ref: null
destination: null
authorization_scope: null
human_gate: NOT_REQUESTED
tools_verified: []
actions_executed: []
integrity_check: NOT_RUN
sqlite_check: NOT_RUN
api_smoke: NOT_RUN
rollback_ref: null
limitations: []
status: DISCOVERY_ONLY
handoff_to: Mestre
```

Não declarar `PASS` sem evidência real no SHA/ambiente testados.

## Provider já existente: Estúdio Binaural v5.8

Projeto privado `leon337/estudio-binaural-3d`. **Sempre verificar a versão/commit atuais ao vivo** e ler os arquivos existentes:

- `docs/RECUPERACAO_GOOGLE_DRIVE_V58.md`
- `scripts/portable.mjs`, `scripts/remote-state.mjs`, `scripts/drive-recovery.mjs`

Fluxo de referência no computador autorizado (dependências e contas precisam estar configuradas):

```bash
gh auth login
gh repo clone leon337/estudio-binaural-3d
cd estudio-binaural-3d
npm run doctor
npm run state:list
npm run state:pull
npm start
```

O projeto também possui `state:push` para publicar snapshot privado cifrado após produzir novas histórias. No destino, o comando pode recuperar configuração OAuth e chave usando GitHub Actions/Google Drive; depende de consentimento e permissões próprias.

**Atenção:** a implementação foi validada no projeto do Estúdio; não foi testada como adapter do runtime MCF. Para outro produto, primeiro construir e qualificar o adapter, contrato de dados, retenção e rollback específicos. Não copiar bancos nem credenciais entre aplicações.

## Critérios de aceite e evolução

**MVP:** uma nova sessão consegue descobrir a skill via `AGENTS.md` e registry, ler instruções completas, verificar o provider, distinguir leitura/escrita, encontrar gates e produzir receipt rastreável. A capability adota o schema tipado v1 e permanece `DECLARED`.

**Futuro:** adapter `CloudProjectRecoveryAdapter` tipado e avaliado no runtime, idempotência, isolamento por projeto, receipts reais, QA E2E com segundo computador e gate de LÉO. Somente depois de validação e autorização específica alterar estados para `IMPLEMENTED / ACTIVE`.
