# MCF-DEC-044-RC-001 — Auditoria de Infraestrutura, Deploy e Rollout Controlado

**Data:** 3 de agosto de 2026  
**Revisora:** Emily  
**Coordenação:** Mestre  
**PR:** #35  
**Estado:** CONCLUÍDO

## Escopo auditado

- imagens do servidor e da web;
- execução não-root e filesystem somente leitura;
- proxy interno da web para API e health;
- migração separada da inicialização do servidor;
- stack de smoke com PostgreSQL limpo;
- stack de rollout por imagens imutáveis;
- gate material de release;
- workflow manual de publicação candidata;
- SBOM e proveniência;
- runbook de rollout canário;
- correção de injeção do `DatabaseService` validada no runtime real.

## Evidências

```yaml
head_tecnico: 44c4e6fc9728a41a719ace937731994a08b4eddb
workflow_aplicacao: 30796925162
workflow_container_smoke: 30796925121
workflow_documental: 30796925079
format: PASS
lint: PASS
typecheck: PASS
migrations_first_run: PASS
migrations_second_run: PASS
application_tests: PASS
operations_and_release_gate_tests: PASS
application_build: PASS
compose_smoke_validation: PASS
compose_rollout_validation: PASS
server_image_build: PASS
web_image_build: PASS
clean_postgres_migration: PASS
server_runtime_bootstrap: PASS
liveness: PASS
readiness: PASS
web_proxy: PASS
security_header: PASS
server_non_root: PASS
web_non_root: PASS
documentation_validation: PASS
ci_permissions: READ_ONLY
```

## Controles confirmados

- o smoke usa PostgreSQL vazio e executa todas as migrações `0000` a `0012`;
- migração e servidor são processos separados;
- o servidor inicia em `NODE_ENV=production` e resolve todas as dependências no contêiner;
- liveness, readiness, documento web e proxy são verificados;
- servidor e web executam como usuários não-root;
- capabilities são removidas e `no-new-privileges` é aplicado;
- o gate rejeita imagens sem digest, banco sem TLS, segredo fraco, URL sem HTTPS, backup local, restore expirado e rollout acima de 10%;
- erros do gate não incluem valores secretos;
- o workflow de publicação exige commit completo pertencente à `main` e confirmação explícita;
- publicação candidata gera SBOM, proveniência e referências por digest;
- não existe workflow que execute deploy automaticamente;
- a CI final não possui permissão de escrita.

## Achados

```yaml
critical: 0
high: 0
medium: 0
low: 8
```

- **LOW-001:** as imagens-base dos Dockerfiles usam versões fixadas por tag, mas ainda não por digest no código-fonte;
- **LOW-002:** a imagem de runtime do servidor copia o workspace completo, incluindo dependências e arquivos além do mínimo necessário;
- **LOW-003:** ainda não existe scanner de vulnerabilidades com política de bloqueio;
- **LOW-004:** imagens candidatas ainda não foram publicadas no registry real nem verificadas por digest externo;
- **LOW-005:** assinatura criptográfica das imagens ainda não foi configurada;
- **LOW-006:** o smoke cobre inicialização, health e web, mas não percorre fluxos autenticados completos dentro dos contêineres;
- **LOW-007:** o worker ainda não integra um ciclo operacional persistente de produção;
- **LOW-008:** banco externo, domínio, backup externo, coletor de logs, alertas e segredos reais ainda não foram materialmente confirmados.

## Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
merge_blocked: false
slice_1_9d_artifacts_aprovavel: true
publicacao_candidata_executada: false
canario_materialmente_pronto: false
deploy_publico_autorizado: false
```

Os artefatos de infraestrutura e rollout podem ser integrados. A aprovação não autoriza publicação de imagens, criação de ambiente público ou ativação de usuários. Essas ações permanecem condicionadas à confirmação dos recursos externos, execução do gate material e nova evidência operacional.
