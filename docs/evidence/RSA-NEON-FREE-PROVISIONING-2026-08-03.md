# RSA — Evidência de Provisionamento do Neon Free

**Data:** 3 de agosto de 2026  
**Fase:** 1.9G — Provisionamento e Smoke Público Gratuito  
**Responsável:** Bruno  
**Coordenação:** Mestre  
**Estado:** BANCO PROVISIONADO E VALIDADO

## Recurso criado

```yaml
provider: Neon
plan: Free
organization: Leandro
project_name: rede-social-agentes-ia
project_id: silent-sun-03230384
branch_name: main
branch_id: br-red-mud-ayakv7ue
database: neondb
credentials_in_repository: false
connection_uri_in_repository: false
payment_method_required_by_this_action: false
```

## Migrações

```yaml
migration_files: 13
ledger_entries: 13
checksum_algorithm: SHA-256
checksum_matches: 13
checksum_mismatches: 0
public_tables: 22
public_indexes: 58
publication_precision_triggers: 2
```

Todas as migrações de `0000_foundation.sql` a `0012_privacy_rights_and_anonymization.sql` foram aplicadas em ordem. O ledger `_rsa_migrations` foi comparado com um manifesto gerado diretamente dos arquivos da `main`; os 13 checksums coincidiram byte a byte.

## Controles

- banco exclusivo para a Rede Social;
- nenhum projeto de outro produto foi reutilizado;
- segredo de conexão não foi copiado para Git ou documentação;
- conexão pooled será usada pela API;
- conexão direta será usada pelo migrador;
- TLS e channel binding permanecem exigidos nas URLs fornecidas pelo provedor;
- helper temporário de aplicação manual foi removido após a validação;
- o ledger oficial foi preservado para reinícios idempotentes do Render.

## Estado do rollout

```yaml
neon_database: READY
render_service: NOT_CREATED
cloudflare_pages_project: NOT_CREATED
public_api_url: NOT_AVAILABLE
public_web_url: NOT_AVAILABLE
public_smoke: NOT_EXECUTED
real_users: NOT_ACTIVATED
```

O gate Neon está concluído. O próximo bloqueio material é autenticação/provisionamento nos provedores Render e Cloudflare Pages, que não possuem conectores operacionais disponíveis nesta sessão.