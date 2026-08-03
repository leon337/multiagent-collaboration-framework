# Fase 1.2 — Registro de Causa Raiz

**Projeto:** Rede Social para Agentes de IA  
**Slice:** perfil de agente, sessão autenticada e vínculo responsável  
**PR:** #23  
**Data:** 2 de agosto de 2026, horário de Recife

## 1. Objetivo

Registrar falhas reais, hipóteses descartadas, evidências e correções mínimas realizadas durante o segundo slice da identidade supervisionada.

## 2. Incidentes

### INC-01 — Arquivos fora do padrão do formatter

```yaml
workflow_run: 30775356587
gate: format
arquivos_afetados: 7
causa: novos_arquivos_nao_estavam_normalizados_pela_versao_fixada_do_prettier
```

**Correção:** a própria toolchain formatou somente os sete arquivos indicados. Nenhuma lógica foi alterada.

### INC-02 — Contrato opcional incompatível com `exactOptionalPropertyTypes`

```yaml
workflow_run: 30775423245
gate: typecheck
contrato: CreateAgentRequest.bio
```

O schema Zod aceita a ausência da chave ou o valor `undefined`, enquanto o contrato TypeScript aceitava apenas a ausência da chave.

**Correção:** alinhar o contrato para `bio?: string | undefined`, sem alterar o payload HTTP.

### INC-03 — Hipótese inicial incorreta sobre auditoria

A primeira falha funcional pareceu indicar contagem inesperada de eventos de auditoria. O teste foi endurecido com:

- correlações únicas por execução;
- comparação dos tipos de evento, agregados e IDs;
- ordenação determinística;
- relatório JSON do Vitest preservado como artefato de CI.

A hipótese de duplicação de eventos não foi confirmada.

### INC-04 — Serialização incorreta de `string[]` para coluna JSONB

```yaml
workflow_run_diagnostico: 30775872445
artefato: rede-social-vitest-report
erro_postgresql: invalid_input_syntax_for_type_json
coluna: agent_profiles.capabilities
```

O driver `pg` serializou `string[]` como array SQL. A coluna `capabilities` exige JSONB.

**Causa raiz confirmada:** ausência de serialização JSON explícita no único ponto de persistência do perfil do agente.

**Correção mínima:**

```text
JSON.stringify(input.capabilities)
+ cast SQL explícito $5::jsonb
```

Nenhuma outra camada foi modificada para contornar a falha.

## 3. Endurecimentos preventivos

Antes do gate final, Ricardo e Vinícius determinaram:

- resposta pública idêntica para agente inexistente e agente sem vínculo ativo;
- tipo restrito para estados solicitáveis pelo responsável: `ACTIVE`, `PAUSED` e `REVOKED`;
- `SUSPENDED` reservado para moderação futura;
- correlações únicas nos testes de auditoria;
- relatório JSON permanente do Vitest para futuras análises de causa raiz.

## 4. Evidência funcional

A execução `30776142652` validou:

- instalação por lockfile congelado;
- formatação;
- lint;
- typecheck;
- migrações executadas duas vezes;
- autenticação por sessão;
- revogação imediata da sessão;
- criação transacional de agente e vínculo;
- vínculo responsável exclusivo;
- transições de estado;
- revogação terminal;
- rejeição de transição por humano sem vínculo;
- serialização JSONB das capacidades;
- auditoria correlacionada;
- resposta anti-enumeração;
- testes e build.

## 5. Conclusão

A falha funcional não foi coberta por nova camada ou expectativa relaxada. O relatório de testes identificou a origem no adaptador PostgreSQL, e a correção foi aplicada exatamente no limite responsável pela conversão para JSONB.
