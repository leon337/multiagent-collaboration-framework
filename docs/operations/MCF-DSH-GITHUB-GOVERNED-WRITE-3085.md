# MCF-GH-WRITE-3085-001 — Evolução GitHub: propostas de agentes e execução governada

**Fase:** implementação de proposta E2E, candidato de executor autenticado (desabilitado)
**Base:** PR #562 (GitHub MCP read-only)
**Identidade:** LEANDRO autoridade humana final; MESTRE coordenação; LÉO é agente distinto.

## Contexto e objetivo

O DSH 3085 acessa o GitHub público por MCP e subagentes executam leituras em paralelo. A evolução cria uma forma de subagentes produzirem propostas de branches/commits/PRs para revisão; a execução futura deve acontecer somente pelo MissionRuntime canônico, com PermissionEngine, HDF, ExternalActionDispatcher, EvidenceValidator e ledger, **sem dar um token pessoal do GH ao DSH**.

## Implementado

- Nova ferramenta no servidor MCP `github_submit_proposal`: recebe missão, fase, agente, branch, SHA de base, PR draft e 1..6 arquivos em `tools/` ou `docs/`. Valida namespace `agent/dsh3085/`, extensão, conteúdo e tamanho, e rejeita caminhos especiais/segredos aparentes.
- Normaliza um envelope imutável com `version=1`, `approval_state=PROPOSED_UNAUTHORIZED`, `effect_class=github-draft-pr` e SHA-256 canônico.
- Persiste a proposta de modo exclusivo em arquivo 0600, sob diretório privado 0700, retorna UUID e digest. **Nenhuma mutação GitHub é possível por essa ferramenta.**
- `app_executor.py` separado, **não registrado na composição DSH**, é um adaptador candidato para consumo por componente confiável do MissionRuntime. Falha fechado sem callback independente de autorização; o modelo não consegue fabricar autorização passando JSON.
- GitHub App com chave privada somente fora do workspace DSH, por identidade de serviço separada. Tokens de instalação efêmeros solicitados para 1 repositório e só com `contents:write` e `pull_requests:write`; valida escopo retornado.
- Executor candidato só pode criar branch em `agent/dsh3085/*`, verificar o SHA exato da `main`, criar novos arquivos e abrir PR em `draft=true`. Não implementa merge, force-push, comentários externos, alteração de arquivos existentes ou deploy. Reserva efeito no ledger antes da primeira mutação, exige read-back do PR e bloqueia retries se `EFFECT_UNKNOWN`.

## Governança

A autoridade de escrita NÃO vem do DSH, do tool schema nem de um campo `AUTHORIZED` gerado pelo modelo. Uma integração real deve:

1. Resolver missionId/phaseId no MissionRuntime autenticado e validar decisão no PermissionEngine/HDF.
2. Utilizar o ExternalActionDispatcher/ledger canônico para a reserva e idempotência; o `Ledger` de amostra dentro de `app_executor.py` não pode substituir o ledger principal em produção.
3. Prover ao adaptador somente um callback confiável emitido pelo próprio runtime e vinculado ao digest + SHA + escopo. Nunca passar um callback através de HTTP/MCP público.
4. Implementar reconciliação read-back após falhas e recibos duráveis com identidade de execução `github-app-installation:<id>`.
5. Manter `main`, workflows, regras de proteção, produção e merges fora da capability. Gate separado para qualquer ampliação.

### Dependência externa — HUMAN_GATE uma única vez para instalar GitHub App

O `gh` do host está autenticado como `leon337` (conta humana), sem prova de credencial GitHub App para esta missão. Não usar esse token na instância 3085.

A GitHub App precisa ser criada/instalada em **apenas** `leon337/multiagent-collaboration-framework`, pelo proprietário da conta. Solicitar:
- Repository permissions: **Contents: Read and write; Pull requests: Read and write; Metadata: Read** (Metadata automático).
- Repository access: **Only select repositories**, selecionar somente o MCF.
- Sem permissões Actions, Administration, Secrets ou Webhooks adicionais.
- Guardar a chave privada em cofre/usuário confiável fora de `sentinelx`; permissão 0600; não registrar conteúdo em logs, prompts ou Git.
- Capturar de forma segura **App ID**, **Installation ID** e **caminho da chave** (não compartilhar a chave no chat). O executor usa as variáveis `MCF_GITHUB_APP_ID`, `MCF_GITHUB_INSTALLATION_ID` e `MCF_GITHUB_APP_PRIVATE_KEY_FILE` do usuário confiável, nunca do DSH.

Somente após esse gate e a integração ao dispatcher canônico, executar E2E autenticado com branch de teste e PR draft, sempre em branch isolada e com rastreabilidade de SHA; não fazer merge/deploy.

## Evidência desta fase

- Testes locais de validação/propostas/bloqueios/execução simulada: **26 PASS**.
- Subagente na instância 3085 invocou a ferramenta MCP nativa e criou um envelope de proposta local real:
  - `proposal_id = 015a2a9b-465a-4434-b2f8-cae4a927824a`
  - `digest_sha256 = e47784848d490029896bd1fb35f6a41857bb1f88a207b6b8dd2de8ab108e22f0`
  - `approval_state = PROPOSED_UNAUTHORIZED`; `effect = NO_GITHUB_WRITE`
  - A proposta foi relida no host e confrontada com o retorno do agente.
- Execução simulada do executor: cria referência, adiciona arquivo, abre PR draft, verifica o read-back; bloqueia ausência de autorização, SHA divergente, falta de identidade e efeito repetido.
- **Não houve teste real de escrita com GitHub App**: nenhum App ID/Installation ID/chave dedicados foram provisionados e a ligação ao ExternalActionDispatcher ainda é pendente.

## Critérios de conclusão da evolução inteira

- [x] Proposta local criada por ferramenta MCP nativa e validada em subagente.
- [x] Contrato de proposta com escopo, SHA, digest, spool privado e validação.
- [x] Executor GitHub App modelado e testado com transporte simulado.
- [ ] Identidade GitHub App dedicada provisionada/instalada e verificada.
- [ ] Vínculo real ao MissionRuntime/PermissionEngine/HDF/ExternalActionDispatcher e receipt canônico.
- [ ] Teste E2E autenticado de branch, commit e PR draft com App em repo autorizado.
- [ ] Revisão independente de segurança.
- [ ] CI qualificado no SHA do PR; revisão/merge somente por gate apropriado.

Este artefato é **candidato**, não uma liberação de escrita autônoma no GitHub.
