# MCF-DEC-057 — Expansão de skills executáveis e recibos semânticos

## Estado

```yaml
status: CANDIDATA_PARA_GATE
mission: MCF-RUNTIME-004
owner: Leo
human_final_authority: Leandro
```

## Contexto

O runtime executável inicial reconhecia somente:

- `MCF-START-MISSION`;
- `MCF-IMPLEMENT-CHANGE`;
- `MCF-RUN-TESTS`.

O registro oficial já continha 16 skills, mas declarar uma skill no YAML não a torna executável. Era necessário ampliar o recorte sem transformar afirmações textuais em execução externa.

## Decisão

O primeiro lote amplia o conjunto executável de três para oito skills:

```yaml
internal_execution:
  - MCF-START-MISSION
  - MCF-SELECT-AGENTS
  - MCF-TRACE-MISSION
external_receipt_required:
  - MCF-IMPLEMENT-CHANGE
  - MCF-REVIEW-CODE
  - MCF-RUN-TESTS
  - MCF-GIT-PR-RELEASE
  - MCF-DEPLOY-VALIDATE
```

## Fluxo padrão de mudança

```text
Mestre inicia missão
→ Mestre seleciona agentes
→ Rafael implementa
→ Vinicius revisa
→ Renato valida
→ Gabriel controla PR e gate
→ Augusto registra trace
```

`MCF-DEPLOY-VALIDATE` é incluída somente quando o objetivo exigir ambiente, deploy, publicação ou rollback.

## Bloco interno causal

O Chat-to-Runtime Bridge executa somente as skills internas consecutivas no início do plano. Ele interrompe no primeiro passo externo.

Estados de planejamento:

```yaml
PLANNED_INTERNAL: skill interna ainda não executada
COMPLETED: skill interna executada com recibo válido
READY_EXTERNAL: ferramenta externa e recibo ainda necessários
```

Uma skill interna posicionada depois de uma fase externa não é antecipada. Por exemplo, `MCF-TRACE-MISSION` permanece `PLANNED_INTERNAL` até que as fases anteriores sejam concluídas.

## Handoff dinâmico

`MCF-SELECT-AGENTS` usa `selected_domain_agent` no registro. O runtime exige uma entrada explícita e persiste o destinatário real. O marcador textual não pode ser gravado como agente.

## Recibos semânticos

Além de assinatura HMAC, digest, data, provider, operação e recurso, as seguintes skills exigem conteúdo específico:

### MCF-REVIEW-CODE

```yaml
provider: github
required:
  - commitSha
  - metadata.findingsCount
  - metadata.verdict
  - metadata.reviewedFiles
```

### MCF-GIT-PR-RELEASE

```yaml
provider: github
required:
  - externalId
  - commitSha
  - metadata.ciStatus: success
  - metadata.gateDecision: approved
  - metadata.prState
```

### MCF-DEPLOY-VALIDATE

```yaml
providers: [render, vercel, cloudflare]
required:
  - externalId
  - commitSha
  - metadata.deploymentStatus: [live, ready, success]
  - metadata.smokeStatus: [pass, success]
  - metadata.rollbackAvailable: true
```

## Gates de segurança

- execução interna é limitada a início, seleção e observabilidade;
- revisão de código usa operação somente leitura `inspect-code`;
- PR/release exige CI verde e gate aprovado no recibo;
- deploy de staging exige escopo autorizado;
- deploy para `production` ou `produção` exige `humanGateApproved: true`;
- escrita direta na `main` continua proibida;
- Leandro continua bloqueado como agente executor pelo HDF;
- ferramentas externas sem recibo permanecem `WAITING_EVIDENCE`.

## Limites

As outras oito skills do registro continuam documentadas, mas não executáveis pelo `SkillExecutor`. A ampliação futura será feita em lotes com contratos, permissões e evidências próprias.

O runtime valida recibos produzidos por integrações confiáveis. Esta decisão não cria, por si só, conectores autônomos de GitHub, Render, Vercel ou Cloudflare dentro do servidor.

## Critérios de aceite

```yaml
executable_skills: 8
internal_selection: verified
internal_trace: verified
dynamic_handoff: verified
review_receipt_semantics: verified
pr_receipt_semantics: verified
deploy_receipt_semantics: verified
production_gate: verified
risk_downgrade: blocked
leandro_as_executor: blocked
format_lint_typecheck: required
migrations_twice: required
tests_build: required
container_smoke: required
staging_e2e: required_before_final_closure
```
