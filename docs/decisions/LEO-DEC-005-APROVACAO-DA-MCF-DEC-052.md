# LEO-DEC-005 — Aprovação da MCF-DEC-052

**Data:** 4 de agosto de 2026  
**Autoridade operacional delegada:** Léo  
**Objeto:** skills, matriz de ferramentas, permissões e avaliação de plugins

## 1. Entradas

- autorização de Leandro;
- MCF-DEC-052;
- registro com 16 skills;
- matriz dos 29 agentes;
- política de permissões;
- inventário de capacidades;
- protocolo de avaliação de plugins;
- 14 testes de conformidade;
- RC-001 de Emily.

## 2. Decisão

```yaml
mcf_dec_052: APPROVED
skills_registry: ACTIVE
agent_tool_matrix: ACTIVE
plugin_permissions_policy: ACTIVE
plugin_evaluation_protocol: ACTIVE
available_capabilities_inventory: ACTIVE
runtime_plugin_status: EXPERIMENTAL_UNTIL_TESTED
random_tool_selection: FORBIDDEN
fabricated_external_execution: FORBIDDEN
fallback_per_skill: REQUIRED
adoption: IMMEDIATE
merge: AUTHORIZED_AFTER_GREEN_CI
human_gate_required: false
```

## 3. Interpretação

A partir desta decisão:

```text
MISSÃO
→ SKILL
→ AGENTE
→ FERRAMENTA PRIMÁRIA OU ALTERNATIVA JUSTIFICADA
→ PERMISSÃO
→ EXECUÇÃO REAL
→ EVIDÊNCIA
→ HANDOFF
```

Instalação ou presença na interface não constitui aprovação automática.

## 4. Plugins

Plugins observados podem ser usados conforme a matriz somente quando:

- estiverem disponíveis no contexto;
- a conexão estiver funcional;
- a skill permitir;
- a permissão for suficiente;
- a operação produzir evidência.

Caso contrário, usar alternativa ou fallback e declarar a limitação.

## 5. Auditoria do Claude

A reprovação externa será tratada em missão separada após Leandro fornecer o relatório ou a conversa completa.

O fato de o framework estar em definição será registrado como contexto. Cada achado continuará sujeito a classificação e resposta objetiva.

## 6. Próxima ação

```text
Gabriel cria PR
→ Renato acompanha CI
→ Gabriel integra se os gates estiverem verdes
→ Mestre apresenta o resultado
→ próxima fase testa as skills e plugins em chat novo
```