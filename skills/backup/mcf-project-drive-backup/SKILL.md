---
name: mcf-project-drive-backup
description: Executa backup portátil de uma aplicação para uma conta Google Drive autorizada, com reconciliação Git, dados persistentes, instalação e evidências de upload.
whenToUse: Quando LEANDRO disser "enviar o projeto para o google drive", "backup completo no Drive", "cópia portátil da aplicação", "salvar projeto no Drive" ou variação equivalente.
metadata:
  mcf_skill_id: MCF-PROJECT-DRIVE-BACKUP
  version: 0.1.0
  owner: Mestre
  status: EXPERIMENTAL
  risk_class: SCOPED_EXTERNAL_WRITE
user-invocable: true
disable-model-invocation: false
---

# MCF — Backup portátil para Google Drive

**Invocação padrão:** "enviar o projeto para o google drive". Esta frase é uma instrução operacional, não uma pergunta sobre como fazer. O MESTRE deve usar as ferramentas presentes e executar a missão até a verificação de sucesso ou bloqueio real, sem solicitar que LEANDRO repita o procedimento.

## Descoberta em cada sessão

1. Consultar `AGENTS.md`, `skills/registry.yaml` e `docs/operations/MCF-PROJECT-DRIVE-BACKUP.md` do repositório oficial na revisão GitHub ao vivo.
2. Determinar a aplicação referida **pelo contexto ou pela URL local fornecida**, validando porta → PID → comando → diretório → repositório. Nunca assumir que "o projeto" é o MCF se a URL aponta para outra aplicação.
3. Localizar uma máquina autorizada **online** via Remote Desktop Commander (ou conector equivalente), usando device ID real. Inspecionar processos e estado sem alterar o serviço.
4. Resolver a conta de Drive pelo pedido atual e pela conta conectada. Quando a sessão já indicar a conta **Potiguar**, usá-la como destino preferencial; conferir o e-mail no conector antes de escrever. Não registrar e-mails privados, tokens ou IDs de pastas pessoais no repositório público. Se essa identidade não estiver acessível, não escolher outra conta silenciosamente.
5. Verificar ferramentas Git, acesso ao Drive, quota/espaço, integridade dos dados e disponibilidade de destino. Sem acesso de escrita efetivo, preparar pacote local e marcar upload `BLOCKED`.

## Sequência executiva

Seguir **na ordem** o [manual operacional](../../../docs/operations/MCF-PROJECT-DRIVE-BACKUP.md):

- **F1 — Reconciliação Git:** `git status`, `git remote -v` sem divulgar credenciais, `git fetch`, refs locais/remotas, ahead/behind, commits, worktrees/stashes; nunca usar reset/force-push, deletar branches, publicar dados sensíveis ou fazer merge/deploy implícito. Com autorização para publicar alterações, testar, commitar apenas arquivos selecionados e publicar a branch sem mexer em `main`.
- **F2 — Inventário de recuperação:** código e histórico Git; dados fora do repo; bancos consistentes; uploads, referências, modelos e arquivos de configuração sem segredo; serviços, processos, drivers, dependências, OS/arquitetura; marcar dependências não reproduzíveis.
- **F3 — Pacote privado:** versões rastreáveis + dados, instalador **não destrutivo**, README PT-BR, `SHA256SUMS`, inventário e checklist; separar arquivos grandes e material sensível, sem exportar credenciais. Para Git, considerar `git bundle --all` ou snapshot integral com revisão dos riscos de histórico.
- **F4 — Transferência:** criar pasta privada idempotente na conta correta, usar o Google Drive conectado para upload de referências compatíveis ou navegador autenticado autorizado se a ferramenta só aceitar referências que não representem arquivos do host. Não declarar upload feito antes de comprová-lo.
- **F5 — Aceite:** conferir listagem/metadata de cada arquivo no Drive (nome, tamanho, pasta/conta, privacidade), SHA-256 local, verificação de integridade, evidência de restaurabilidade; executar teste de restauração isolado quando tecnicamente disponível e classificá-lo como `RESTORE_NOT_TESTED` caso contrário.
- **F6 — Recibo:** apresentar pasta, arquivos, tamanho, SHA/versionamento, status da restauração, exclusões, riscos e pendências. Registrar erro e estado `PARTIAL` ou `BLOCKED` quando houver falhas.

## Limites invariantes

- **Permissão:** a ordem do humano autoriza o backup para o destino informado, **não** leitura de outros projetos nem publicação pública, merge, deploy, alteração destrutiva ou exportação de credenciais. O gate HDF/PermissionEngine continua obrigatório onde aplicável. A skill **não é** nativamente executável no `McfExecutableSkillId`/MissionRuntime sem adapter próprio.
- **Privacidade:** projeto privado ou gravações pessoais permanecem privados. Nunca enviar tokens OAuth, chaves de API, cookies, `.env`, credentials, chaves SSH, sessões de navegador ou segredos de banco em texto aberto. Históricos Git e dumps podem conter segredos: classificar antes de enviar; criptografar com segredo fornecido e protegido pelo usuário quando necessário ou bloquear envio.
- **Integridade:** não arquivar banco SQLite/Postgres ativo com simples `tar` como se fosse snapshot consistente; produzir snapshot por mecanismo próprio (`sqlite3 .backup`, `pg_dump`, etc.) e verificar.
- **Idempotência:** usar identificador estável por projeto/revisão/data, checar uploads já presentes e reconciliar falhas/timeout antes de retransmitir, evitando cópias incorretas.
- **Portabilidade:** arquitetura/driver/GPU e credenciais podem impedir execução em qualquer máquina; distinguir backup íntegro de restauração realmente testada.
- **Falha de ferramenta:** nunca inventar a execução. Prosseguir até limite verificável e informar precisamente o bloqueio.

## Evidência mínima para `COMPLETE`

`source_project`, `local_repo`, `remote_head`, `manifest`, `excluded_secret_classes`, `local_archive_checksums`, `drive_account_verified`, `drive_folder_ref`, `remote_files_with_sizes`, `privacy_verified`, `restore_test_status`, `service_preserved`, `timestamp`.

**Origem empírica:** procedimento validado no caso AVATAR LEANDRO em 17/11/2026: cópia com fontes, Git, áudios, pesos/runtime GPU e instalador, hashes e CRC locais, uploads conferidos no Drive; **restauração em outro computador não testada**. Os links e dados privados desse backup não integram o catálogo público.
