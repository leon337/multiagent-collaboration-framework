# MCF-DEC-010 — Separação entre Leandro e Léo e Justificativa de Seleção de Agentes

**Data:** 2 de agosto de 2026  
**Autoridade humana:** Leandro  
**Responsável pela orquestração:** Mestre  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** aprovado para uso operacional e revisão crítica  
**PR relacionado:** #15

## 1. Contexto

Durante a retomada do projeto **Rede Social para Agentes de IA**, ocorreu uma confusão entre o usuário humano Leandro e o agente Léo. Também foi solicitada uma explicação explícita sobre quais agentes foram selecionados para a missão, suas funções e os motivos da seleção e da não seleção dos demais.

A composição técnica oficial já está registrada na `MCF-DEC-003 — Composição Técnica Definitiva da Equipe`. Esta decisão não substitui a MCF-DEC-003. Ela complementa a metodologia com regras de identidade, seleção e transparência.

## 2. Numeração e preservação histórica

A numeração `MCF-DEC-003` não pode ser reutilizada, pois já identifica a decisão de composição técnica definitiva da equipe.

Este novo registro recebe o índice `MCF-DEC-010`, seguindo a sequência existente no PR #15, que já contém as decisões MCF-DEC-002 até MCF-DEC-009.

## 3. Separação obrigatória entre Leandro e Léo

Fica estabelecido que:

- **Leandro** é a pessoa humana, proprietário do projeto e autoridade humana final;
- **Léo** é um agente integrante da equipe permanente;
- Leandro não entra na contagem dos agentes;
- Léo não deve ser tratado como sinônimo, apelido ou identidade de Leandro;
- Léo somente exerce autoridade decisória quando houver delegação explícita de Leandro;
- referências históricas a “Léo como autoridade final” devem ser interpretadas como autoridade operacional delegada, até que os documentos afetados sejam harmonizados.

## 4. Equipe permanente disponível

A equipe permanente possui **17 agentes nomeados**:

1. Léo — agente de representação e decisão operacional delegada;
2. Mestre — ponte oficial e orquestração;
3. Leonardo — produto e requisitos;
4. Carlos — inovação e riscos futuros;
5. Evelyn — gestão de Design e Experiência;
6. Laura — UX;
7. Isabela — UI;
8. Marina — Acessibilidade;
9. Sofia — Arquitetura de Software;
10. Rafael — Engenharia de Software;
11. Manoel — Banco de Dados;
12. Renato — Qualidade e Testes;
13. Bruno — Plataforma, DevOps e SRE;
14. Ricardo — Segurança;
15. Gabriel — Integração, Versionamento e Release;
16. Carmem — Documentação Técnica;
17. Emily — Auditoria Independente.

Os especialistas Backend, Frontend, Mobile, IA e Machine Learning e Engenharia de Dados continuam classificados como especialistas por demanda e não entram na contagem permanente enquanto não forem formalmente incorporados.

## 5. Regra de seleção por missão

O Mestre deve selecionar apenas os agentes cuja competência seja necessária para produzir uma entrega vinculada ao objetivo da missão.

A seleção deve informar:

- quantidade total de agentes disponíveis;
- quantidade de agentes selecionados;
- nome e função oficial de cada selecionado;
- motivo objetivo da seleção;
- entrega esperada de cada selecionado;
- quantidade de agentes não selecionados;
- nome e função oficial de cada não selecionado;
- motivo objetivo da não seleção.

A não seleção:

- não representa exclusão da equipe;
- não reduz a autoridade funcional do agente;
- não significa que a competência seja irrelevante para o projeto inteiro;
- significa apenas que não existe trabalho necessário para aquele agente no ciclo atual.

## 6. Proibições

Não é permitido:

- atribuir função diferente da função oficial sem declarar delegação temporária;
- incluir um agente apenas para completar a cadeia;
- declarar participação sem mostrar entrega real;
- omitir o motivo de não seleção quando Leandro solicitar a composição completa;
- confundir Leandro com Léo;
- contar Leandro entre os 17 agentes;
- reutilizar índice de decisão já existente.

## 7. Correção da seleção da missão atual

Na primeira resposta do projeto **Rede Social para Agentes de IA**, Carlos foi apresentado como responsável por segurança. Essa atribuição não está alinhada à composição técnica oficial:

- **Carlos** é responsável por inovação e riscos futuros;
- **Ricardo** é responsável por segurança.

Para preservar coerência metodológica, a seleção correta do primeiro ciclo é composta por **7 agentes**:

1. **Mestre** — coordenação, seleção e consolidação;
2. **Leonardo** — problema, público, proposta de valor, MVP e requisitos iniciais;
3. **Laura** — experiência social e jornadas de interação;
4. **Sofia** — arquitetura conceitual;
5. **Ricardo** — segurança, permissões e limites de autonomia;
6. **Carmem** — consolidação do PROJECT-CHARTER;
7. **Emily** — auditoria independente.

Carlos não integra essa seleção corrigida porque o ciclo não possuía uma tarefa separada de inovação ou exploração de riscos futuros. Riscos operacionais e de segurança pertenciam ao escopo de Ricardo.

## 8. Justificativa dos não selecionados na missão atual

### Léo

Não selecionado como executor porque não existia decisão operacional delegada específica. A solicitação partiu diretamente de Leandro.

### Carlos

Não selecionado após a correção porque não havia tarefa independente de inovação, oportunidades ou riscos futuros.

### Evelyn

Não selecionada porque o ciclo não exigia coordenação de uma divisão completa de Design e Experiência.

### Isabela

Não selecionada porque não houve desenho visual detalhado, sistema de componentes ou especificação de interface.

### Marina

Não selecionada porque ainda não existia interface concreta para auditoria de acessibilidade. Sua participação será necessária na fase de fluxos e protótipos.

### Rafael

Não selecionado porque implementação e desenho técnico detalhado de software não estavam autorizados.

### Manoel

Não selecionado porque o ciclo tratou apenas de entidades conceituais, sem esquema de persistência, migrações ou integridade de dados.

### Renato

Não selecionado porque não existia software ou critério técnico implementado para teste.

### Bruno

Não selecionado porque infraestrutura, CI/CD, observabilidade, disponibilidade e deploy estavam fora do escopo.

### Gabriel

Não selecionado para a análise do produto porque não havia implementação, release ou publicação autorizada. Gabriel participa deste registro apenas como responsável pelo versionamento no GitHub, sem merge.

## 9. Critério para ciclos futuros

A composição deve ser reavaliada a cada novo ciclo.

Exemplos:

```text
Protótipo visual
→ Evelyn, Laura, Isabela, Marina e Sofia

Implementação do MVP
→ Sofia, Rafael, Manoel, Ricardo, Renato, Bruno e Gabriel

Integração de agentes de IA
→ Sofia, Rafael e especialista de IA por demanda, após incorporação ou contratação do papel

Revisão documental
→ Carmem e Emily
```

## 10. Autorizações e limites

```yaml
regra_operacional: aprovada
registro_em_branch: autorizado
revisao_critica: autorizada
correcao_da_selecao_atual: aprovada
merge_na_main: nao_autorizado
implementacao_de_software: nao_autorizada
publicacao_automatica: nao_autorizada
```

## 11. Efeito da decisão

A partir desta decisão, o Mestre deve consultar a composição oficial antes de atribuir funções e deve conseguir explicar, quando solicitado, tanto a seleção quanto a não seleção de cada agente disponível.

## 12. Próximo gate

```text
Carmem — validação documental
→ Emily — revisão crítica
→ Mestre — consolidação
→ Leandro — ciência ou nova decisão
```

O PR #15 permanece Draft e nenhum merge é autorizado por esta decisão.
