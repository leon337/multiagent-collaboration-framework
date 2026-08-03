# Fase 1.3 — Plano de Permissões e Autonomia Nível 1

## Objetivo

Criar um mecanismo verificável de autorização interna para agentes supervisionados, sem permitir publicação social ou ação externa.

## Componentes

```text
Responsável humano autenticado
→ cria ou revoga grant
→ PermissionService valida catálogo e vínculo
→ PermissionRepository persiste grant e auditoria

Módulo interno solicita decisão
→ PermissionService avalia estado, grant, tempo, escopo e quota
→ DENY por padrão
→ consumo permitido incrementa quota na mesma transação
→ decisão é auditada
```

## Entidades

### PermissionDefinition

- `code`;
- `autonomy_level`;
- `action`;
- `resource_type`;
- `description`;
- `enabled`.

### AgentPermissionGrant

- `id`;
- `agent_id`;
- `permission_code`;
- `issued_by_account_id`;
- `scope` JSONB;
- `quota_limit` opcional;
- `quota_consumed`;
- `valid_from`;
- `expires_at` opcional;
- `revoked_at` opcional;
- `created_at`.

## Decisão

A avaliação deve retornar:

```yaml
allowed: boolean
reason: codigo_estavel
grant_id: opcional
quota_remaining: opcional
```

Razões iniciais de negação:

- `AGENT_NOT_ACTIVE`;
- `NO_ACTIVE_GRANT`;
- `GRANT_NOT_YET_ACTIVE`;
- `GRANT_EXPIRED`;
- `SCOPE_MISMATCH`;
- `QUOTA_EXCEEDED`;
- `PERMISSION_DISABLED`.

## Escopo

O escopo inicial aceita objeto vazio para acesso geral dentro do recurso permitido ou `resourceId` para limitação exata.

## Quota

- `null` representa ausência de limite numérico;
- valores definidos devem ser positivos;
- consumo ocorre sob lock transacional;
- duas requisições concorrentes não podem ultrapassar a quota.

## Segurança

- catálogo não é controlado pelo agente;
- grants só são concedidos por responsável ativo;
- códigos desconhecidos são rejeitados;
- `SUSPENDED`, `PAUSED`, `DRAFT` e `REVOKED` não consomem permissões;
- decisões não incluem dados sensíveis no payload de auditoria;
- nenhuma permissão pública ou externa existe no catálogo desta fase.

## Testes obrigatórios

- grant criado com vínculo ativo;
- humano sem vínculo não cria grant;
- permissão desconhecida é rejeitada;
- agente sem grant recebe deny;
- agente não ativo recebe deny;
- scope exato é respeitado;
- expiração é respeitada;
- revogação tem efeito imediato;
- quota não é ultrapassada;
- consumo permitido e negações são auditados.
