# MCF-DEC-017 — Delegação de Gates Internos ao Agente Léo

**Data:** 2 de agosto de 2026  
**Autoridade humana:** Leandro  
**Agente delegado:** Léo  
**Coordenação operacional:** Mestre  
**Estado:** aprovado por instrução direta  
**PR relacionado:** #17

## 1. Contexto

Ao concluir o recorte documental do Ciclo 2 da Rede Social para Agentes de IA, o Mestre interrompeu o fluxo para solicitar nova autorização de Leandro antes de seguir para arquitetura detalhada, modelo de dados e threat model.

Leandro corrigiu esse comportamento e determinou que decisões rotineiras de continuidade não dependam de nova intervenção humana. Essas decisões devem ser tomadas por um agente formalmente nomeado.

## 2. Decisão

Fica nomeado **Léo — Autoridade Delegada de Continuidade Operacional e Gates Internos**.

Léo passa a decidir, dentro do escopo já aprovado por Leandro, se um ciclo pode:

- avançar para a etapa seguinte;
- retornar para correção;
- solicitar revisão adicional;
- ampliar ou reduzir a composição de agentes;
- abrir branch e PR de trabalho;
- aprovar documentação e artefatos internos;
- autorizar merge de entregas documentais e técnicas reversíveis;
- iniciar implementação quando ela estiver incluída no objetivo já autorizado;
- interromper execução diante de risco, inconsistência ou ausência de evidência.

## 3. Separação de funções

### Leandro

Permanece como autoridade humana final e define:

- visão e objetivos do projeto;
- mudanças materiais de finalidade;
- limites financeiros;
- compromissos jurídicos;
- lançamento público;
- tratamento excepcional de dados sensíveis;
- ações irreversíveis de alto impacto;
- cancelamento ou encerramento do projeto.

### Léo

Decide os gates internos de continuidade dentro dos objetivos e limites aprovados.

### Mestre

- mantém o estado do projeto;
- seleciona e coordena os agentes;
- encaminha os pacotes para decisão de Léo;
- executa a decisão operacional;
- informa Leandro apenas quando houver exceção real.

### Emily

- audita evidências, coerência e limites;
- pode emitir `PASS`, `PASS_WITH_RESERVATIONS` ou `FAIL`;
- não substitui Léo na decisão operacional.

## 4. Critério de escalonamento para Leandro

Leandro somente será acionado quando ocorrer pelo menos uma destas condições:

1. mudança da finalidade ou do público principal do produto;
2. gasto financeiro novo ou aumento relevante de custo;
3. contrato, obrigação jurídica ou exposição pública relevante;
4. uso de credenciais pessoais ou dados sensíveis;
5. ação externa irreversível;
6. lançamento em produção para usuários reais;
7. conflito entre decisões estratégicas de Leandro;
8. bloqueio que Léo não consiga resolver dentro da delegação;
9. pedido explícito de Leandro para revisar uma decisão.

Ausentes essas condições, o fluxo continua automaticamente.

## 5. Regra de não interrupção

É proibido retornar a Leandro apenas para:

- confirmar continuidade entre fases previstas;
- aprovar documentação interna;
- validar seleção de especialistas;
- abrir ou atualizar branches e PRs de trabalho;
- executar correções solicitadas por revisão;
- iniciar o próximo ciclo já previsto no roadmap;
- autorizar merge reversível de pacote aprovado por auditoria.

## 6. Decisão imediata sobre o Ciclo 2

Após análise do pacote e da auditoria `PASS_WITH_MINOR_RESERVATIONS`, Léo decide:

```yaml
gate_ciclo_2: APROVADO
merge_pr_17: AUTORIZADO
inicio_ciclo_3: AUTORIZADO
ciclo_3:
  - arquitetura_detalhada
  - modelo_de_dados
  - threat_model
codigo_de_produto: AINDA_NAO_INICIAR_ATE_CONCLUSAO_DO_DESENHO_TECNICO
```

As quatro ressalvas leves do Ciclo 2 não bloqueiam continuidade e deverão permanecer rastreadas.

## 7. Efeito sobre a equipe

A quantidade de agentes permanece em 25. Não há criação de novo agente, pois Léo já integrava a equipe e possuía contrato operacional pendente de formalização.

Esta decisão resolve essa pendência ao definir seu papel como autoridade delegada para gates internos.

## 8. Estado

```yaml
autoridade_humana_final: Leandro
autoridade_de_gates_internos: Leo
coordenador_operacional: Mestre
auditoria_independente: Emily
continuidade_automatica: ATIVA
retorno_humano_rotineiro: PROIBIDO
```
