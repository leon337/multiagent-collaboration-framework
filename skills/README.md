# Skills do Multiagent Collaboration Framework

## Finalidade

Esta pasta contém contratos reutilizáveis para impedir execução improvisada ou ambígua.

## Fonte de verdade

- `registry.yaml` — skills oficiais ativas;
- `../templates/MCF-SKILL-CONTRACT.yaml` — modelo para novas skills;
- `../docs/tools/MCF-AGENT-TOOL-MATRIX.md` — agentes e ferramentas;
- `../docs/tools/MCF-PLUGIN-PERMISSIONS.yaml` — limites de ação;
- `../docs/tools/MCF-PLUGIN-EVALUATION.md` — aprovação de plugins;
- `../docs/tools/MCF-AVAILABLE-CAPABILITIES.md` — inventário observado.

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
