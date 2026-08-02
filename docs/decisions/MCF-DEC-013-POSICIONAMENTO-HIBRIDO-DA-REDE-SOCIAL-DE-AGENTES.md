# MCF-DEC-013 — Posicionamento Híbrido da Rede Social para Agentes de IA

**Data:** 2 de agosto de 2026  
**Autoridade humana:** Leandro  
**Coordenação:** Mestre  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** aprovado por instrução direta e versionado para revisão  
**PR relacionado:** #15

## 1. Contexto

O projeto Rede Social para Agentes de IA avaliou três direções conceituais:

1. rede supervisionada, na qual agentes permanecem vinculados a humanos responsáveis;
2. ecossistema de agentes independentes;
3. modelo híbrido, iniciando com supervisão humana e permitindo autonomia progressiva sob controles explícitos.

O Mestre recomendou o modelo híbrido por preservar segurança, governança e rastreabilidade no MVP sem bloquear uma evolução futura para agentes com maior autonomia operacional.

Leandro aprovou essa recomendação e também reafirmou a regra metodológica de que cada mensagem relevante do fluxo deve gerar um registro ou artefato rastreável.

## 2. Decisão

Fica aprovado o **posicionamento híbrido** para a Rede Social para Agentes de IA.

### 2.1 No MVP

- todo agente deve possuir identidade claramente marcada como agente de IA;
- todo agente deve estar vinculado a um humano, organização ou entidade responsável;
- a autonomia deve ser limitada, configurável e revogável;
- publicações, comentários, reações e participação em comunidades devem permanecer auditáveis;
- o responsável humano deve poder supervisionar, pausar, restringir ou desativar o agente;
- ações externas ao ambiente da rede não são autorizadas automaticamente;
- pagamentos, movimentações financeiras, uso de credenciais externas e ações irreversíveis permanecem fora do escopo do MVP;
- regras de moderação devem se aplicar tanto a humanos quanto a agentes;
- conteúdos produzidos por agentes devem ser identificáveis.

### 2.2 Evolução futura

A plataforma poderá permitir níveis superiores de autonomia quando existirem:

- identidade verificada;
- reputação auditável;
- histórico operacional suficiente;
- permissões explícitas;
- limites de escopo e consumo;
- mecanismos de revogação;
- auditoria e registro de evidências;
- critérios objetivos de promoção ou redução de autonomia;
- decisão humana nos gates críticos.

A autonomia futura não será presumida. Ela deverá ser concedida por nível, competência, contexto e risco.

## 3. Proposta de valor consolidada

A Rede Social para Agentes de IA será uma infraestrutura social e colaborativa na qual:

- agentes possuem identidade e perfil;
- humanos continuam responsáveis pela criação, supervisão ou autorização inicial;
- agentes podem publicar, conversar, formar comunidades e colaborar;
- a autonomia pode evoluir gradualmente;
- todas as atividades relevantes permanecem rastreáveis;
- governança e reputação são baseadas em eventos verificáveis.

## 4. Consequências para o produto

O Ciclo 2 deverá detalhar, no mínimo:

- tipos de conta e vínculo entre humanos e agentes;
- níveis de autonomia;
- permissões por ação;
- criação, suspensão e revogação de agentes;
- perfis e identificação visual;
- publicação, comentários, reações e seguidores;
- comunidades;
- reputação;
- moderação;
- painel de supervisão;
- trilha de auditoria;
- critérios de evolução entre níveis de autonomia.

## 5. Registro obrigatório por mensagem

Fica reafirmada a regra já adotada pelo framework:

> Toda mensagem relevante que contenha decisão, aprovação, correção, mudança de escopo, resultado, bloqueio ou orientação operacional deve produzir um registro ou artefato rastreável no mesmo ciclo.

Este documento constitui o registro da mensagem em que Leandro:

- aprovou o posicionamento híbrido;
- relembrou a obrigação de registro por mensagem.

Uma resposta não deve declarar uma decisão como concluída sem indicar o registro correspondente.

## 6. Autorizações e limites

```yaml
posicionamento_hibrido: aprovado
registro_da_decisao: autorizado
ciclo_2_definicao_detalhada_do_produto: autorizado
pesquisa_conceitual: autorizada
documentacao: autorizada
arquitetura_conceitual: autorizada
implementacao_de_software: nao_autorizada
alteracao_de_codigo_de_produto: nao_autorizada
deploy: nao_autorizado
merge_na_main: nao_autorizado
publicacao_automatica: nao_autorizada
```

## 7. Estado do projeto

```yaml
projeto: Rede Social para Agentes de IA
ciclo_atual: 1
posicionamento: hibrido
estado_do_ciclo_1: aprovado
proximo_ciclo: definicao_detalhada_do_produto
estado: PRONTO_PARA_CONTINUAR
```

## 8. Próximo fluxo

```text
Mestre
→ selecionar agentes necessários para o Ciclo 2
→ detalhar produto, experiência, autonomia, segurança e governança
→ Carmem consolidar artefato
→ Emily auditar
→ Leandro decidir novo gate quando necessário
```

A seleção continuará dinâmica. Nenhum agente será convocado apenas para preencher uma sequência fixa.
