# MCF-RECOVER-CLOUD-PROJECT — Procedimento do MESTRE

**Capability:** mcf.cloud-project-recovery.v1 · **ID:** `MCF-RECOVER-CLOUD-PROJECT` · **Versão:** `0.1.0` · **Estado:** `EXPERIMENTAL` · **Permissão:** `SCOPED_WRITE`

Use esta skill quando LEANDRO pedir **reconciliar o projeto com o remoto**, **restaurar em outro computador**, **recuperar um backup GitHub/Google Drive**, **eliminar cópia manual de chave** ou **retomar um projeto sem o dispositivo original**.

## Entrada em outra sessão

1. Consultar o repositório oficial do MCF, `AGENTS.md`, `docs/MCF-CURRENT-STATE.md` e `skills/registry.yaml`. Verificar no GitHub a branch, SHA, PR e CI atuais.
2. Ler o contrato em `skills/cloud/MCF-RECOVER-CLOUD-PROJECT.yaml`, a declaração `context/capabilities/cloud-project-recovery.yaml` e o runbook `docs/operations/MCF-CLOUD-PROJECT-RECOVERY.md`.
3. Descobrir o repositório **do projeto real** e a implementação disponível. **Não assumir** que qualquer aplicação possui o mesmo formato de backup ou os mesmos scripts.
4. Verificar se a sessão possui GitHub, Drive e acesso ao destino. Sem autorização ou sem ferramentas, produzir um diagnóstico e um handoff, sem fingir executar.

## Sequência operacional (sem improvisação)

`DISCOVER → INSPECT → AUTHORIZE → BACKUP/RESTORE → VERIFY → RECEIPT`

- **DISCOVER/INSPECT (READ_ONLY):** validar identidade, ownership, branch, SHA, software e artefatos; comparar estado local e remoto; localizar último backup e o contrato do provedor.
- **AUTHORIZE:** autenticação e consentimento OAuth exigem HUMAN_GATE do titular; substituição de dados, alterações de permissões, publicação externa e ações destrutivas exigem o gate vigente do MCF.
- **BACKUP:** pausar/concluir jobs, conferir snapshot consistente e criptografia, manter key material fora do Git, publicar somente com escopo autorizado e recibo real.
- **RESTORE:** checar a máquina e dependências, obter configuração OAuth por mecanismo seguro, autenticar a conta correta, recuperar chave do espaço privado do aplicativo, verificar backup, restaurar com proteção contra sobrescrita e sem duas instâncias escritoras simultâneas.
- **VERIFY:** comprovar integridade do SQLite, arquivo(s) de mídia, contagem de projetos, saúde da API e equivalência de SHA. Evidências precisam referenciar o provedor e a execução real.
- **RECEIPT/HANDOFF:** documentar referência de backup, SHA, ambiente, ferramenta, gate aplicado, testes, divergências e próximo passo; **nunca** incluir segredo, token OAuth ou chave.

## Exemplo de provider implementado — Estúdio Binaural

Repositório privado: `leon337/estudio-binaural-3d`. A implementação externa é a v5.8 (verificar SHA/versão live). Consultar os próprios `scripts/portable.mjs`, `scripts/remote-state.mjs`, `scripts/drive-recovery.mjs` e `docs/RECUPERACAO_GOOGLE_DRIVE_V58.md` antes de executar.

Com o host autorizado e autenticação GitHub/Google efetiva, o projeto oferece `npm run doctor`, `npm run state:list`, `npm run state:pull` e `npm run state:push`. **Não executar comandos contra outro projeto** sem adapter compatível validado.

- O snapshot criptografado está em release GitHub privado; a chave de backup pertence ao `appDataFolder` da conta Google OAuth **específica do projeto**.
- Uma nova máquina exige consentimento Google. Índices `/u/N/` do navegador não são identidades estáveis entre dispositivos.
- `state:pull` não é sincronização multiusuário em tempo real. Sem snapshot recente, a recuperação pode perder alterações posteriores.
- Sem prova de backend ativo e prova de restore: reportar `DECLARED/NOT_VERIFIED`, não `ACTIVE`.

## O que esta skill NÃO concede

O cadastro no MCF **não provisiona um MCP remoto, não dá acesso ao computador, não instala conectores e não libera o runtime central**. O cadastro é suficiente para *descoberta e roteamento assistido* somente nas sessões que consultarem o repositório. Uma futura execução automática exigirá adapter, autorização, avaliação de segurança, gate de LÉO e evidências E2E.

**Contrato completo e casos negativos:** `docs/operations/MCF-CLOUD-PROJECT-RECOVERY.md`.
