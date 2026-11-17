# MCF — Procedimento governado: enviar projeto para Google Drive

**Versão:** 0.1.0  
**Classificação:** `EXPERIMENTAL / DOCUMENTED_AGENT_WORKFLOW`  
**Dono:** MESTRE; execução especializada conforme `skills/registry.yaml` e permissões vigentes.  
**Gatilho canônico:** `enviar o projeto para o google drive`.

> Este é um **procedimento recuperável para novas sessões**. Não é um novo provider conectado nem um adapter executável do MissionRuntime. Ferramentas, autorização HDF/PermissionEngine, disponibilidade e identidade do destino devem ser verificadas ao vivo.

## Sem questionário: decisão inicial do MESTRE

Ao receber a frase canônica ou equivalente, **inicie a execução**. Reutilize o contexto disponível: URL local, aplicação discutida, host, repositório e a última escolha explícita de conta. A conta chamada **Potiguar** no Drive conectado pode ser o destino padrão quando já estabelecida pelo humano, mas seu e-mail deve ser confirmado pelo conector em cada sessão. Não publicar endereço privado, IDs de pastas e caminhos pessoais em artefatos públicos.

Somente solicite intervenção humana se não houver como distinguir aplicações candidatas ou contas autorizadas, se não existir ferramenta de acesso, para novo consentimento de conta/credencial ou gate adicional exigido pelas políticas. Não repita explicações de rotina nem use `localhost` do ambiente ChatGPT como se fosse o computador remoto.

## F0 — Escopo e segurança

1. Identifique a missão, o host exato (ID de dispositivo online), a origem, o destino e o tipo de dado. Anote instante UTC, OS, arquitetura, espaço livre e retenção.
2. Separe `LEANDRO_AUTHORIZED_DESTINATION` de permissões técnicas do conector; verificar escrita real no Drive. A instrução de backup privada autoriza criar arquivos nesse destino, não autoriza compartilhar publicamente nem copiar projetos alheios.
3. Descubra dados sensíveis antes de compactar: tokens, cookies, segredos de API, dados pessoais, gravações, dumps e git history. Use pasta privada no Drive, criptografia adequada para materiais classificados quando exigível, nunca arquivo público.
4. Defina `backup_id` determinístico por `projeto + origem + HEAD + timestamp`; preveja reenvio idempotente e manifesto.

## F1 — Identificar aplicativo e reconciliar Git

Quando houver URL `http://127.0.0.1:PORTA/` no computador autorizado:

- Ler socket/processo da porta no **host correto** (`ss -ltnp`, `ps`, `/proc/PID/cwd` no Linux); confirmar resposta HTTP `GET` sem inferir Git a partir de nome da URL.
- Subir até o `git rev-parse --show-toplevel` para descobrir o projeto; conferir `git remote -v` com URLs sanitizadas.
- Consultar `git status --porcelain=v1 -b`, `git branch -avv`, `git worktree list`, `git stash list`, refs/tags e log. Executar `git fetch --tags` quando permitido e comparar `git rev-list --left-right --count branch...origin/branch`.
- **Nunca** usar `git reset --hard`, `push --force`, excluir branches, alterar `main` ou descartar arquivos para "igualar" sem escopo separado. Untracked relevantes entram no backup; temporários e caches são inventariados.
- Para mudanças publicáveis autorizadas: testes → seleção explícita de arquivos não secretos → commit → push em branch apropriada → reconciliação remota. Não tratar commit/push como requisito para preservar worktree privada: o backup deve incluir pendências relevantes e manifestá-las, sem subir segredos para GitHub.

**Critério F1:** HEAD local/remoto e divergências conhecidos; nada perdido ou publicado sem revisão.

## F2 — Inventário completo de recuperação

Classifique cada item como `INCLUDED`, `RECONSTRUCTABLE`, `EXCLUDED_SECRET`, `EXTERNAL_UNAVAILABLE` ou `REQUIRES_SNAPSHOT`:

| Categoria | Exemplos | Tratamento |
|---|---|---|
| Código/histórico | fontes, configs, notebooks, submodules, Git refs, tags, LFS | snapshot da worktree + histórico Git verificável ou `git bundle --all`; obter submodules/LFS separadamente |
| Dados persistentes | SQLite/PostgreSQL, volumes, arquivos enviados, anexos, filas | snapshot transacional do mecanismo correto; não copiar DB ativo a seco |
| Dados do usuário | áudios, fotos, relatórios, projetos, presets | pasta privada, inventário e proteção apropriada |
| Modelos/execução | pesos IA, binários e diretórios externos à worktree | pacote separado com hashes/versões, licença e compatibilidade |
| Host/serviço | systemd, ports, jobs, variáveis não secretas, libs, drivers | manifestos e guia de provisionamento; não copiar chaves |
| Software reconstruível | `.venv`, `node_modules`, build caches | excluir **somente** com lockfiles, versões e instalador testável |
| Segredos | `.env`, tokens OAuth, cookies, SSH, API keys | excluir do pacote padrão, redigir mapa de reautenticação; criptografia quando obrigatório |

Revisar `.git` e backups legados antes de enviar: o histórico pode conter credenciais. O pacote deve indicar se o histórico Git completo foi incluído e riscos residuais.

## F3 — Empacotar e tornar instalável

1. Criar diretório isolado `BACKUP_ID` fora da aplicação, com permissões restritas; manter espaço suficiente e não interromper o serviço.
2. Criar artefatos separados: `projeto-e-dados.tar.gz`, `modelos-e-runtime.tar.gz` (se aplicável), `kit-instalacao.zip` (manual PT-BR, instalador, inventário, hashes, diagnóstico e instruções).
3. Não reutilizar caminhos `/home/<usuario>` como contrato do instalador. Preferir `$HOME` e argumentos explícitos, recusar sobreposição de destino existente, validar dependências/OS/arquitetura, usar cópia temporária e finalização atômica quando possível.
4. Capturar versão/revisão de banco, como restaurar serviços, portas, cota, backup de dados pessoais, e o procedimento manual para logins/tokens **sem incluir os valores**.
5. Gerar `SHA256SUMS` de todos os arquivos para baixar; verificar `sha256sum -c`, integridade de `tar`/`zip` e presença dos arquivos essenciais. Testar instalador com `bash -n` ou teste equivalente antes de publicar.
6. Sempre diferenciar `ARCHIVE_VERIFIED` de `RESTORE_TESTED`. Testar restauração em diretório/host descartável sem sobrescrever dados reais quando possível; registrar resultado ou `RESTORE_NOT_TESTED`.

## F4 — Upload privado e verificação remota

1. Usar **a conta de Drive autorizada e conferida** por consulta ao perfil da conexão. Criar subpasta privada `PROJETO — Backup portátil — DATA` ou reutilizar a mesma `backup_id` se já existir e for o mesmo conteúdo.
2. Preferir ferramenta Google Drive com upload de bytes referenciáveis. **Atenção:** referências `file_uri` do conector não são equivalentes a caminhos do computador remoto. Quando não houver ponte de arquivo válida, usar o navegador Drive autenticado autorizado no host, ou outro método de upload já legitimado e auditável; não inventar um `file_uri` nem extrair tokens do perfil Chrome.
3. Em upload que expira, **reler o diretório de destino antes de repetir**. Deduplicar por nome + tamanho + checksum quando disponível; nome sozinho não é prova.
4. Depois do upload, ler de volta metadata de cada objeto: nome, `file_id`, tamanho, parent folder, MIME, visibilidade/ACL e conta. Preferir hash remoto quando provedor fornecer. O tamanho sozinho não prova equivalência criptográfica com o original; não alegar hash remoto verificado se não foi.
5. Nunca alterar pasta para `anyone with link`; guardar links somente no recibo privado da missão.

## F5 — Critérios de conclusão e recibo

| Estado | Significado |
|---|---|
| `COMPLETE / RESTORE_TESTED` | todos os itens essenciais enviados e conferidos, restauração isolada executada com smoke positivo |
| `COMPLETE / RESTORE_NOT_TESTED` | arquivos, dados e instalação documentados, uploads e integridade local verificados; outro computador ainda não testado |
| `PARTIAL` | alguns arquivos transferidos; falta item essencial, metadata ou confirmação |
| `BLOCKED` | destino/identidade/permissão/risco de segredo impede prosseguir |
| `FAILED_RECOVERED` | upload/instalação falhou e estado anterior foi preservado |

Recibo obrigatório: `project_id`, `source_host_id`, `git_repo`, `local_sha`, `remote_sha`, `dirty_files_count`, `snapshot_method`, `files[] (name, bytes, sha256_local, drive_id, parent_id)`, `drive_account_verified`, `folder_url`, `visibility`, `restore_test`, `excluded_secrets`, `source_health_before_after`, `timestamp`, `blockers`.

## Evidência histórica (não é teste universal)

Em 2026-11-17, o AVATAR LEANDRO foi arquivado em dois pacotes (~44 MB de código/dados e ~768 MB de runtime/modelos) mais kit instalável, com hashes locais e metadados do Drive confirmados. **Não houve prova de restauração em outro computador**, nem comprovação criptográfica dos hashes do Drive. O aprendizado é a **sequência operacional**, não o reaproveitamento de credenciais, conta ou caminhos.

## Testes de aceitação da skill

- **Positivo:** URL local identifica repositório diferente do MCF; worktree suja preservada; dados e modelos externos enumerados; Drive na conta correta; uploads verificados; pacote instalável e hashes corretos.
- **Negativo:** host offline; duas aplicações iguais sem referencial; Drive conectado na conta errada; token ou `.env` detectado; banco ativo sem snapshot consistente; segundo upload ambíguo; espaço insuficiente; hash/size divergente; restore não testado; runtime MCF sem adapter HDF.
- **Invariante:** um pedido de backup **nunca** autoriza merge/deploy nem altera a versão de produção; se solicitado separadamente, seguir os gates existentes.

Ver também [skill operacional](../../skills/backup/mcf-project-drive-backup/SKILL.md) e [contrato](../../skills/backup/MCF-PROJECT-DRIVE-BACKUP.yaml).
