# MCF-DEC-052 — Skills e Instrumentalização dos Agentes

**Data:** 4 de agosto de 2026  
**Autoridade humana:** Leandro  
**Autoridade operacional delegada:** Léo  
**Coordenação:** Mestre  
**Estado:** aprovado para implantação  
**Relacionadas:** MCF-DEC-050 e MCF-DEC-051

## 1. Problema

A equipe possui 29 agentes nomeados e um conjunto crescente de plugins, conectores e ferramentas. Sem um catálogo formal, agentes podem:

- escolher ferramentas por preferência;
- usar plugins redundantes sem critério;
- solicitar permissões excessivas;
- produzir resultados sem evidência verificável;
- depender de nomes ambíguos;
- interromper o fluxo quando uma ferramenta estiver indisponível;
- ignorar capacidades já habilitadas na plataforma.

## 2. Decisão

Ficam obrigatórios:

1. registro versionado de skills;
2. matriz Agente × Skill × Ferramenta;
3. política de permissões por categoria;
4. avaliação antes de incorporar novos plugins;
5. inventário de capacidades disponíveis;
6. fallback explícito para toda skill instrumentalizada;
7. evidência mínima por operação;
8. seleção da ferramenta por adequação, segurança e disponibilidade;
9. proibição de ferramenta inventada ou uso declarado sem execução real.

## 3. Conceitos

### Skill

Contrato reutilizável que transforma uma intenção em execução padronizada.

Cada skill define:

```yaml
skill_id:
name:
version:
purpose:
owner_agents: []
trigger_phrases: []
required_inputs: []
optional_inputs: []
allowed_tools: []
forbidden_tools: []
permission_profile:
execution_steps: []
required_evidence: []
expected_outputs: []
acceptance_criteria: []
failure_modes: []
fallback:
handoff_to:
```

### Ferramenta primária

Ferramenta preferida quando estiver disponível, conectada, autorizada e adequada ao objetivo.

### Alternativa

Ferramenta equivalente aceita quando a primária estiver indisponível ou inadequada.

### Fallback sem ferramenta

Procedimento seguro que preserva o trabalho possível sem fingir execução externa.

## 4. Regras de seleção

O agente deve escolher ferramenta na seguinte ordem:

```text
VERIFICAR NECESSIDADE REAL
→ CONSULTAR SKILL
→ CONSULTAR MATRIZ DO AGENTE
→ VALIDAR DISPONIBILIDADE
→ VALIDAR PERMISSÃO
→ EXECUTAR
→ REGISTRAR EVIDÊNCIA
→ PASSAR O BASTÃO
```

É proibido:

- selecionar plugin somente porque está instalado;
- usar ferramenta fora da matriz sem justificativa registrada;
- realizar escrita quando a skill autoriza somente leitura;
- declarar commit, PR, teste, e-mail, evento, deploy ou alteração não executada;
- expor credenciais, tokens ou dados sensíveis desnecessários;
- repetir a mesma operação externa sem mudança objetiva de parâmetros.

## 5. Perfis de permissão

```yaml
READ_ONLY:
  reads: allowed_when_relevant
  writes: forbidden

READ_AND_PROPOSE:
  reads: allowed_when_relevant
  drafts: allowed
  writes: require_gate

SCOPED_WRITE:
  reads: allowed_when_relevant
  reversible_writes: allowed_inside_authorized_scope
  destructive_or_public_actions: require_human_gate

SENSITIVE_CONTROLLED:
  reads: minimum_necessary
  writes: explicit_authorization
  secrets: never_expose

HUMAN_GATE:
  action: always_confirm_with_Leandro
```

Léo pode autorizar ações internas reversíveis já incluídas no objetivo. Ações externas irreversíveis, financeiras, jurídicas, públicas ou destrutivas permanecem reservadas conforme as decisões vigentes.

## 6. Evidência mínima

Toda execução instrumentalizada deve registrar, quando aplicável:

- ferramenta usada;
- recurso consultado ou alterado;
- ação executada;
- resultado retornado;
- identificador verificável;
- efeito confirmado;
- falha e recuperação;
- destinatário da passagem.

## 7. Plugins redundantes

Ferramentas com função semelhante devem possuir prioridade explícita.

Exemplos:

```yaml
meetings:
  primary: Granola
  alternatives: [Fireflies, MeetGeek]

product_analytics:
  primary: PostHog
  alternatives: [Amplitude, Mixpanel]

academic_research:
  primary: Consensus
  alternatives: [Sider_Scholar]

architecture_diagrams:
  primary: Mermaid_Chart
  alternatives: [Figma, Canva]
```

## 8. Responsabilidades

### Mestre

- selecionar agentes e skills;
- impedir participação decorativa;
- validar que cada agente conhece ferramenta, permissão e fallback.

### Sofia

- manter coerência estrutural da matriz;
- impedir sobreposição sem fronteiras.

### Rafael

- manter contratos de skill executáveis e testáveis.

### Miriam

- manter inventário, proveniência, versões e fonte de verdade.

### Júlia

- controlar permissões, dados, autonomia e responsabilidades.

### Augusto

- registrar uso de ferramentas, falhas, latência e passagens quando disponível.

### Beatriz

- avaliar qualidade, regressão e adequação das skills.

### Emily

- auditar evidências, permissões e conformidade.

### Léo

- aprovar inclusão, alteração, restrição ou desativação de skills e ferramentas.

## 9. Novos plugins

Nenhum plugin entra no catálogo oficial apenas por estar instalado.

A avaliação deve verificar:

```yaml
purpose_clear:
owner_agents_defined:
overlap_checked:
data_access_reviewed:
write_actions_reviewed:
evidence_supported:
fallback_defined:
test_scenario_passed:
verdict:
```

Vereditos:

- `APPROVED`;
- `APPROVED_WITH_RESTRICTIONS`;
- `EXPERIMENTAL`;
- `REJECTED`;
- `UNAVAILABLE`.

## 10. Auditorias externas

Auditorias produzidas por Claude ou outro avaliador externo devem ser preservadas como evidência independente.

Cada achado será classificado como:

- defeito confirmado;
- lacuna ainda em definição;
- funcionalidade planejada não implementada;
- divergência documental;
- exigência fora do escopo;
- falso positivo;
- risco aceito temporariamente.

Informar que o framework ainda está em definição contextualiza o resultado, mas não anula automaticamente os achados. O relatório original será analisado em missão separada, com rastreabilidade e resposta por item.

## 11. Artefatos oficiais

```text
skills/registry.yaml
templates/MCF-SKILL-CONTRACT.yaml
docs/tools/MCF-AGENT-TOOL-MATRIX.md
docs/tools/MCF-PLUGIN-PERMISSIONS.yaml
docs/tools/MCF-PLUGIN-EVALUATION.md
docs/tools/MCF-AVAILABLE-CAPABILITIES.md
```

## 12. Efeito imediato

```yaml
skills_formais: OBRIGATORIAS
selecao_aleatoria_de_ferramenta: PROIBIDA
matriz_agente_ferramenta: OBRIGATORIA
permissoes_por_categoria: OBRIGATORIAS
plugin_sem_avaliacao: EXPERIMENTAL
execucao_inventada: PROIBIDA
fallback_por_skill: OBRIGATORIO
evidencia_instrumental: OBRIGATORIA
gate_interno: Leo
```