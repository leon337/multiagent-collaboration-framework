# Skills do Multiagent Collaboration Framework

## Finalidade

Esta pasta contém contratos reutilizáveis para impedir execução improvisada ou ambígua.

## Fonte de verdade

- `registry.yaml` — catálogo declarativo das skills oficiais ativas;
- `../templates/MCF-SKILL-CONTRACT.yaml` — modelo para novas skills;
- `../docs/tools/MCF-AGENT-TOOL-MATRIX.md` — agentes e ferramentas;
- `../docs/tools/MCF-PLUGIN-PERMISSIONS.yaml` — limites de ação;
- `../docs/tools/MCF-PLUGIN-EVALUATION.md` — aprovação de plugins;
- `../docs/tools/MCF-AVAILABLE-CAPABILITIES.md` — inventário observado.

O `registry.yaml` define contrato, owner, entradas, ferramentas, permissão, evidência, fallback e handoff. A capacidade de uma skill ser executada pelo runtime não é representada por um campo `executable` no registry: ela é limitada pelo contrato tipado `McfExecutableSkillId`, pelo `SkillExecutor`, pelas permissões e pelos validadores de evidência do runtime.

## Fluxo obrigatório

```text
IDENTIFICAR INTENÇÃO
→ SELECIONAR SKILL
→ VALIDAR ENTRADAS
→ SELECIONAR AGENTES
→ VERIFICAR FERRAMENTA E PERMISSÃO
→ EXECUTAR
→ COLETAR EVIDÊNCIA
→ VALIDAR ACEITE
→ PASSAR O BASTÃO
```

## Comando explícito

Quando necessário, Leandro ou Léo podem solicitar:

```text
EXECUTAR_SKILL MCF-START-MISSION
EXECUTAR_SKILL MCF-DEBUG-INCIDENT
EXECUTAR_SKILL MCF-GIT-PR-RELEASE
EXECUTAR_SKILL MCF-CLOSE-PHASE
```

O comando explícito não substitui os requisitos da skill.

## Estado de execução no runtime

O conjunto executável deve ser lido no código e validado por teste no mesmo SHA do candidato.

O incremento `MCF-RUNTIME-006-LOT-4-A` já integrou as quatro capacidades abaixo ao runtime governado:

- `MCF-RECOVER-CONTEXT`;
- `MCF-DEFINE-PRODUCT`;
- `MCF-DESIGN-EXPERIENCE`;
- `MCF-DESIGN-ARCHITECTURE`.

Essas quatro skills usam provider `internal` governado, exigem `execution_evidence` semântica produzida pelo agente owner e não podem ser concluídas pelo chat bridge por fabricação automática de conteúdo. Evidência ausente ou inválida deve produzir recuperação, sem handoff de sucesso.

O incremento candidato `MCF-RUNTIME-006-LOT-4-B-EVALUATE-AGENTS` adiciona `MCF-EVALUATE-AGENTS` ao mesmo modelo governado, sujeito à validação, auditoria e gate do PR correspondente. A skill permanece `READ_ONLY`, usa operação interna de inspeção (`inspect-agent-evaluation`), fica em `READY_AGENT`, exige `test_cases`, `scores` e `regressions`, e só pode produzir handoff para Emily após evidência semântica válida. `regressions` é obrigatória como coleção de evidência, podendo ser vazia quando nenhuma regressão é observada.

## Regras

- uma skill não concede autorização externa;
- ferramenta instalada não significa ferramenta aprovada;
- agente deve seguir permissão e evidência da matriz;
- indisponibilidade exige alternativa ou fallback;
- nenhuma ação externa pode ser inventada;
- alterações de skill exigem versão, avaliação e gate de Léo.

## Estados

```yaml
DRAFT: em definição
EXPERIMENTAL: teste controlado
ACTIVE: aprovada para uso
RESTRICTED: uso com limitações
DEPRECATED: substituída
RETIRED: não utilizar
```
