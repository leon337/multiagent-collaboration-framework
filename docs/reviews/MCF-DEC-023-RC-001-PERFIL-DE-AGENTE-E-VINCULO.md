# MCF-DEC-023 — RC-001 — Perfil de Agente e Vínculo Responsável

**Data:** 2 de agosto de 2026  
**Revisora:** Emily — Auditoria Independente  
**Revisão de segurança:** Ricardo  
**Revisão de qualidade:** Renato, Vinícius e Patrícia  
**PR:** #23  
**Estado:** concluído

## 1. Escopo revisado

- autenticação por sessão bearer;
- revogação da sessão atual;
- contratos de agente;
- schema e migração PostgreSQL;
- perfil de agente em `DRAFT`;
- vínculo humano obrigatório;
- máquina inicial de estados;
- persistência e auditoria;
- controllers e erros públicos;
- testes unitários e integração real;
- registro de causa raiz.

## 2. Sessão autenticada

O guard:

- exige formato bearer estrito;
- armazena e consulta somente hash do token;
- aceita apenas sessão não revogada e não expirada;
- exige conta humana ativa;
- usa resposta uniforme para token ausente, inválido, expirado ou revogado;
- inclui `correlationId` no erro público.

A revogação possui efeito imediato e evento de auditoria.

**Resultado:** PASS

## 3. Criação do agente

Perfil do agente e vínculo responsável são criados na mesma transação. O agente nasce obrigatoriamente em `DRAFT`.

A transação inclui dois eventos:

- `AGENT_PROFILE_CREATED`;
- `RESPONSIBILITY_LINK_ACTIVATED`.

Falha de handle duplicado não deixa perfil ou vínculo parcial.

**Resultado:** PASS

## 4. Responsabilidade

O banco possui índice parcial único que impede dois vínculos ativos para o mesmo agente.

Somente o humano com vínculo ativo pode solicitar transições. Para reduzir enumeração, agente inexistente e agente sem vínculo produzem a mesma resposta pública.

**Resultado:** PASS

## 5. Estados

Estados existentes:

- `DRAFT`;
- `ACTIVE`;
- `PAUSED`;
- `SUSPENDED`;
- `REVOKED`.

Transições permitidas ao responsável:

- `DRAFT → ACTIVE`;
- `DRAFT → REVOKED`;
- `ACTIVE → PAUSED`;
- `ACTIVE → REVOKED`;
- `PAUSED → ACTIVE`;
- `PAUSED → REVOKED`.

`SUSPENDED` permanece reservado à moderação. `REVOKED` é terminal.

**Resultado:** PASS

## 6. Persistência JSONB

O relatório JSON do Vitest identificou que arrays JavaScript eram serializados pelo driver como arrays SQL. A correção ocorreu no adaptador PostgreSQL com serialização JSON e cast `::jsonb`.

O teste de integração confirmou leitura correta das capacidades.

**Resultado:** PASS

## 7. Auditoria

Foram comprovados exatamente:

- criação do perfil;
- ativação do vínculo;
- ativação do agente;
- pausa;
- revogação;
- criação e revogação da sessão.

Correlações dos testes são únicas e a comparação não depende da ordem física de registros com o mesmo timestamp.

**Resultado:** PASS

## 8. Testes e build

```yaml
workflow_run: 30776142652
install_frozen_lockfile: PASS
format: PASS
lint: PASS
typecheck: PASS
migrations_first_run: PASS
migrations_second_run: PASS
unit_tests: PASS
session_guard_tests: PASS
postgres_identity_tests: PASS
postgres_agent_tests: PASS
anti_enumeration_tests: PASS
build: PASS
```

**Resultado:** PASS

## 9. Limites preservados

O slice não autoriza ou implementa:

- execução autônoma de agentes;
- permissões de publicação;
- comunidades;
- feed;
- moderação operacional completa;
- produção;
- deploy público;
- usuários reais.

**Resultado:** PASS

## 10. Ressalvas

### LOW-01 — Rate limiting continua obrigatório

Sessões e criação de agentes deverão receber limites antes de exposição externa.

### LOW-02 — Transferência e encerramento de responsabilidade ainda não existem

O MVP já cria vínculo ativo, mas transferência, aceite do novo responsável e encerramento explícito pertencem a slice posterior.

### LOW-03 — Suspensão depende do módulo de moderação

O estado existe e é terminal para ações do responsável, porém somente o futuro módulo de moderação poderá aplicá-lo.

### LOW-04 — Validação de sessão consulta PostgreSQL a cada requisição

A escolha é segura e adequada ao MVP inicial. Cache ou otimização somente poderá ser introduzido após métricas, preservando revogação imediata.

### LOW-05 — E2E HTTP completo continua pendente

Controllers, guards, serviços e PostgreSQL estão testados, mas um fluxo iniciado por servidor real será adicionado antes do piloto.

## 11. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 5
slice_executavel: true
apto_para_integracao: true
producao_autorizada: false
```

As ressalvas não bloqueiam a integração em desenvolvimento nem o próximo slice interno.
