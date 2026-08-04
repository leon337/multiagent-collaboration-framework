# MCF-DEC-052 — RC-001 — Skills e Instrumentalização

**Data:** 4 de agosto de 2026  
**Revisora por papel:** Emily  
**Branch:** `docs/mcf-dec-052-skills-and-tooling`  
**Estado:** concluída

## 1. Escopo

Auditar:

- decisão MCF-DEC-052;
- registro de skills;
- contrato padrão de skill;
- matriz dos 29 agentes;
- política de permissões;
- inventário de capacidades;
- protocolo de avaliação de plugins;
- testes de conformidade;
- atualização do README.

## 2. Evidências

```yaml
changed_files_before_review: 10
registered_skills: 16
mapped_agents: 29
permission_policy: present
plugin_evaluation_protocol: present
test_scenarios: 14
```

## 3. Achados positivos

### A — Skills deixam de ser comandos vagos

Cada skill possui entradas, agentes, ferramentas, passos, evidências, aceite, falhas, fallback e handoff.

**Resultado:** PASS.

### B — Todos os agentes possuem instrumentalização

A matriz cobre os 29 agentes oficiais e preserva as fronteiras da matriz de competências.

**Resultado:** PASS.

### C — Plugin instalado não equivale a autorização

A decisão e a política distinguem presença na interface, disponibilidade, aprovação e permissão.

**Resultado:** PASS.

### D — Escrita externa é controlada

GitHub, Gmail, Calendar, bancos, deploy, acesso e privacidade possuem regras mais restritivas do que uma permissão genérica da interface.

**Resultado:** PASS.

### E — Ferramentas redundantes possuem prioridade

Reuniões, analytics, pesquisa e diagramas possuem ferramenta primária e alternativas.

**Resultado:** PASS.

### F — Execução inventada é explicitamente proibida

A skill deve registrar evidência e usar fallback quando a ferramenta estiver indisponível.

**Resultado:** PASS.

### G — Auditoria externa foi incorporada

O framework não descarta uma reprovação do Claude por estar em desenvolvimento; exige classificação item a item.

**Resultado:** PASS.

## 4. Ressalvas

### LOW-01 — Conexão real ainda precisa de testes

A presença dos plugins nas capturas não comprova que todas as funções estão autenticadas e disponíveis em todo chat.

### LOW-02 — Algumas ferramentas usam nomes lógicos

Nomes como `Documents`, `PDF`, `Presentations` e `Spreadsheets` podem variar conforme a plataforma. O inventário deve preservar o nome exposto no contexto.

### LOW-03 — Permissões da interface podem divergir

A política MCF é normativa, mas não altera automaticamente a configuração da plataforma. Configurações reais devem ser verificadas e ajustadas separadamente.

### LOW-04 — Skills ainda não foram executadas ponta a ponta

Os 14 cenários foram definidos, mas os testes reais devem ocorrer em chat novo e com ferramentas conectadas.

### LOW-05 — Registro YAML depende de validação automatizada

A CI atual deve validar formatação; um schema dedicado para skills é evolução recomendada.

## 5. Não conformidades

```yaml
critical: 0
high: 0
medium: 0
low: 5
merge_blocked: false
```

## 6. Veredito

```text
PASS_WITH_MINOR_RESERVATIONS
```

## 7. Recomendação

```yaml
decision_recommended: APROVAR_COM_RESSALVAS
merge: AUTORIZAR_APOS_CI_VERDE
adoption: IMMEDIATE_FOR_DOCUMENTED_SKILLS
plugins: KEEP_EXPERIMENTAL_UNTIL_RUNTIME_TEST
next_actions:
  - validar_YAML_e_documentacao_na_CI
  - executar_testes_em_chat_novo
  - analisar_relatorio_original_do_Claude
  - criar_schema_automatizado_de_skills
human_gate_required: false
```