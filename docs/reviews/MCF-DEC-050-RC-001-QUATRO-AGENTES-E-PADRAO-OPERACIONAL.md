# MCF-DEC-050 — RC-001 — Quatro Agentes e Padrão Operacional Unificado

**Data:** 4 de agosto de 2026  
**Revisora por papel:** Emily — Auditoria Independente  
**Natureza da independência:** documental e procedimental; os papéis podem ser executados pela mesma instância técnica  
**Branch:** `docs/mcf-dec-050-controle-multiagente`  
**Estado:** revisão concluída

## 1. Objeto

Revisar:

- criação de Augusto, Beatriz, Miriam e Júlia;
- composição ampliada de 25 para 29 agentes;
- fronteiras com os agentes existentes;
- trabalho visível e proibição de execução silenciosa;
- loop orientado a objetivo;
- passagem de bastão contínua;
- fluxo em uma única resposta;
- delegação de decisões internas a Léo;
- redução de intervenções rotineiras de Leandro;
- compatibilidade com MCF-DEC-016 e MCF-DEC-017.

## 2. Evidências

- `docs/decisions/MCF-DEC-050-QUATRO-AGENTES-DE-CONTROLE-E-PADRAO-OPERACIONAL-UNIFICADO.md`;
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`;
- `docs/matrices/MCF-MATRIZ-CONSOLIDADA-DE-COMPETENCIAS-29-AGENTES.md`;
- `templates/MCF-UNIFIED-MISSION.yaml`;
- `docs/protocols/MCF-PROMPT-PORTATIL-INICIALIZACAO-NOVO-PROJETO.md`;
- `README.md`;
- MCF-DEC-016 — Fluxo Resiliente e Continuidade Automática;
- MCF-DEC-017 — Delegação de Gates Internos ao Agente Léo;
- comparação da branch contra `main`.

## 3. Contagem e identidade

```yaml
agentes_anteriores: 25
novos_agentes: 4
total: 29
resultado_aritmetico: PASS
nomes_colidentes: 0
Leandro_incluido_na_contagem: false
```

## 4. Cobertura das quatro lacunas

| Lacuna | Agente | Resultado |
|---|---|---|
| observabilidade do funcionamento multiagente | Augusto | PASS |
| avaliação contínua dos agentes | Beatriz | PASS |
| memória institucional e conhecimento | Miriam | PASS |
| governança e compliance de IA | Júlia | PASS |

Cada agente possui função, responsabilidades, entregas padrão, fronteiras e gatilhos de acionamento.

## 5. Fronteiras

### Augusto

Não substitui Bruno na observabilidade de infraestrutura, Lucas no desempenho do software ou Emily na auditoria.

### Beatriz

Não substitui Renato nos testes de software, Tiago na engenharia de IA ou Emily na auditoria.

### Miriam

Não substitui Manoel na persistência, Daniela nos pipelines ou Tiago na memória técnica de IA.

### Júlia

Não substitui Ricardo na segurança, Emily na auditoria, Léo nos gates internos ou Leandro na autoridade humana final.

**Resultado:** PASS.

## 6. Trabalho visível

A decisão exige por agente:

1. entrada;
2. ação ou consulta;
3. evidência;
4. achados;
5. análise resumida;
6. decisão;
7. entrega;
8. passagem de bastão.

A decisão diferencia corretamente transparência operacional de exposição de raciocínio privado, credenciais ou segredos.

**Resultado:** PASS.

## 7. Loop e passagem de bastão

O protocolo exige:

- contrato da missão;
- número de ciclo;
- progresso contra critérios de aceite;
- destinatário real;
- entrega e evidência;
- próxima ação;
- critério de conclusão;
- retorno à missão-pai;
- continuidade na mesma resposta.

A estrutura é compatível com o CAF e impede passagem para estado abstrato, auto-passagem e encerramento com ação pendente.

**Resultado:** PASS.

## 8. Resposta única

O fluxo determina que todas as contribuições executáveis, correções, passagens, avaliações, governança, auditoria e decisão de Léo sejam apresentadas em uma única resposta quando tecnicamente possível.

Não é permitido pedir `continue` para trabalho já autorizado.

**Resultado:** PASS.

## 9. Autoridade e intervenção humana

A MCF-DEC-050 não cria autoridade concorrente. Ela reafirma:

- Leandro como autoridade humana final;
- Léo como autoridade delegada para gates internos;
- Mestre como coordenador;
- Emily como auditora.

Os gatilhos de escalonamento permanecem materiais e explícitos. Pedidos de confirmação rotineira são classificados como não conformidade.

**Resultado:** PASS.

## 10. Atualização dos pontos de entrada

O README passa a indicar 29 agentes. O prompt portátil deixa de carregar a lista antiga de 17 agentes e incorpora o protocolo unificado.

**Resultado:** PASS.

## 11. Ressalvas

### LOW-01 — Validação ainda principalmente documental

O template YAML padroniza a execução, mas ainda não existe schema ou validador automatizado bloqueando campos ausentes e passagens inválidas.

### LOW-02 — Documentos históricos permanecem com contagens antigas

Registros de 17, 22 ou 25 agentes representam estados históricos. Eles não devem ser reescritos silenciosamente. Documentos operacionais ativos devem apontar para a matriz consolidada de 29 agentes.

### LOW-03 — Independência cognitiva não comprovada

Quando os papéis forem executados pela mesma instância técnica, a separação é metodológica e documental. Instâncias separadas poderão ser adotadas futuramente.

### LOW-04 — Métricas quantitativas dependem de baseline

Latência, custo, tokens, qualidade e regressão exigem baseline por projeto. A decisão não inventa limites universais.

## 12. Não conformidades abertas

```yaml
critical: 0
high: 0
medium: 0
low: 4
merge_blocked: false
```

## 13. Veredito

```text
PASS_WITH_MINOR_RESERVATIONS
```

A MCF-DEC-050 está coerente com a governança vigente, cobre as quatro lacunas e cria um padrão operacional suficiente para adoção imediata.

## 14. Recomendação ao Léo

```yaml
decision_recommended: APROVAR_COM_RESSALVAS
merge_reversivel: AUTORIZAR_APOS_PR
adocao_operacional: IMEDIATA
proximo_trabalho:
  - criar_schema_e_validador_automatizado
  - harmonizar_documentos_operacionais_ativos
  - definir_baselines_por_projeto
human_gate_required: false
```
