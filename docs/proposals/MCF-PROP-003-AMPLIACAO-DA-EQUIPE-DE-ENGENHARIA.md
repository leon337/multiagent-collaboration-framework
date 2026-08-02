# MCF-PROP-003 — Proposta de Ampliação da Equipe de Engenharia

**Data:** 2 de agosto de 2026  
**Autoridade solicitante:** Léo  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** proposta publicada para avaliação; não aprovada definitivamente  
**PR relacionado:** #15  

## 1. Decisão anterior preservada

Léo aprovou a `MCF-DEC-002`, mas não autorizou o merge do PR #15.

```yaml
metodologia: aprovada
merge_pr_15: nao_autorizado
main: intacta
```

## 2. Composição atual confirmada

A metodologia possui atualmente 12 integrantes nomeados e uma posição sem nome, totalizando 13 posições.

### Governança

1. **Léo** — autoridade final.
2. **Mestre** — orquestração, controle do loop e ponte oficial entre Léo e a equipe.

### Produto e inovação

3. **Leonardo** — produto, planejamento, decomposição e requisitos.
4. **Carlos** — oportunidades, hipóteses, inovação e riscos futuros.

### Design e experiência

5. **Evelyn** — gerente de Design e Experiência.
6. **Laura** — UX Designer.
7. **Isabela** — UI Designer.
8. **Especialista em Acessibilidade** — posição aprovada, nome pendente.

### Arquitetura, dados e entrega

9. **Sofia** — Arquiteta de Software.
10. **Manoel** — Especialista em Banco de Dados.
11. **Gabriel** — implementação, versionamento e publicação.

### Controle e documentação

12. **Carmem** — redação e documentação técnica.
13. **Emily** — auditoria independente.

## 3. Lacuna principal

Não existe um papel formal de **Engenheiro de Software**.

Gabriel possui responsabilidade de implementação, versionamento e publicação, mas isso não substitui integralmente a função de engenharia de software, que deve responder por:

- desenho técnico detalhado;
- decomposição de componentes;
- padrões de código;
- manutenibilidade;
- tratamento de erros;
- desempenho;
- integração entre módulos;
- estratégia de testes de implementação;
- dívida técnica;
- revisão técnica antes da publicação.

## 4. Especialidades recomendadas para inclusão definitiva

### Prioridade 1 — núcleo essencial

#### 4.1 Engenheiro de Software

Responsável por transformar arquitetura em solução implementável, definir componentes, contratos internos, padrões de código, tratamento de falhas, qualidade estrutural e manutenção.

**Participação:** praticamente toda funcionalidade ou correção de software.

#### 4.2 Engenheiro de Qualidade e Testes

Responsável por estratégia de testes, testes unitários, integração, regressão, contratos, testes funcionais, critérios de cobertura e evidência de qualidade.

**Participação:** toda alteração funcional, correção, migração ou publicação.

#### 4.3 Engenheiro de Plataforma, DevOps e SRE

Responsável por CI/CD, ambientes, observabilidade, disponibilidade, rollback, infraestrutura como código, segredos, custos operacionais e confiabilidade.

**Participação:** deploy, infraestrutura, automação, operação, incidentes e publicação.

#### 4.4 Engenheiro de Segurança

Responsável por threat modeling, autenticação, autorização, proteção de dados, dependências, segredos, segurança de APIs, auditoria e revisão de riscos.

**Participação:** usuários, dados sensíveis, integrações, pagamentos, autenticação, publicação e infraestrutura.

### Prioridade 2 — especialização por domínio

#### 4.5 Engenheiro Backend

Responsável por APIs, serviços, regras de negócio, filas, integrações, concorrência, desempenho e resiliência no servidor.

**Participação:** sistemas com backend, APIs ou integrações externas.

#### 4.6 Engenheiro Frontend

Responsável por arquitetura da interface, estado, componentes, desempenho, acessibilidade técnica, integração com APIs e qualidade do cliente web.

**Participação:** aplicações web, painéis, PWAs e interfaces ricas.

#### 4.7 Engenheiro Mobile

Responsável por arquitetura Android/iOS, permissões, câmera, armazenamento local, sincronização, modo offline, distribuição e desempenho móvel.

**Participação:** aplicativos móveis ou PWAs com forte uso de recursos do dispositivo.

#### 4.8 Engenheiro de IA e Machine Learning

Responsável por modelos, prompts, avaliações, dados de teste, custo, latência, segurança de IA, fallback, observabilidade e qualidade das respostas.

**Participação:** agentes, visão, voz, classificação, geração e automações inteligentes.

#### 4.9 Engenheiro de Dados

Responsável por pipelines, transformação, qualidade, linhagem, ingestão, eventos, analytics e integração entre fontes.

**Participação:** métricas, relatórios, processamento em lote, eventos ou múltiplas fontes de dados.

## 5. Especialidade já aprovada que precisa de nome

### Especialista em Acessibilidade

A função já existe conceitualmente e deve receber nome definitivo. Deve revisar WCAG, navegação por teclado, leitores de tela, contraste, semântica, legibilidade, barreiras cognitivas e acessibilidade móvel.

## 6. Recomendação de composição

### Inclusão imediata recomendada

- Engenheiro de Software;
- Engenheiro de Qualidade e Testes;
- Engenheiro de Plataforma, DevOps e SRE;
- Engenheiro de Segurança;
- nome definitivo para Especialista em Acessibilidade.

### Inclusão como especialistas acionados por demanda

- Engenheiro Backend;
- Engenheiro Frontend;
- Engenheiro Mobile;
- Engenheiro de IA e Machine Learning;
- Engenheiro de Dados.

## 7. Contagem projetada

```yaml
posicoes_atuais: 13
agentes_nomeados_atuais: 12
posicoes_sem_nome: 1
novas_posicoes_nucleo_recomendadas: 4
novas_posicoes_sob_demanda_recomendadas: 5
total_projetado_completo: 22
```

Se somente o núcleo essencial for aprovado, a equipe passará de 13 para **17 posições**.

Se todas as recomendações forem aprovadas, passará para **22 posições**.

## 8. Fronteiras iniciais

- **Sofia** define arquitetura geral; o Engenheiro de Software detalha a solução implementável.
- **Engenheiro de Software** define implementação; **Gabriel** executa versionamento e publicação, podendo também implementar quando designado.
- **Manoel** responde por banco de dados; **Engenheiro de Dados** responde por pipelines e movimentação analítica.
- **Emily** audita de forma independente; **Engenheiro de Qualidade** executa e estrutura testes.
- **Evelyn, Laura e Isabela** definem experiência e interface; **Frontend** implementa a arquitetura técnica da interface.
- **Plataforma/SRE** responde por operação; **Gabriel** publica somente após gates e autorizações.

## 9. Pendências para decisão definitiva

- definir nomes dos novos agentes;
- decidir se Backend e Frontend serão agentes separados ou competências do Engenheiro de Software;
- decidir se Gabriel continuará implementador ou ficará concentrado em versionamento e publicação;
- definir matriz RACI e critérios de acionamento;
- realizar RC da composição final;
- atualizar `MCF-DEC-001` e `MCF-DEC-002` após aprovação explícita de Léo.

## 10. Autorizações

```yaml
publicacao_da_proposta_em_branch: autorizada
inclusao_definitiva_na_metodologia: aguardando_decisao_do_leo
merge_na_main: nao_autorizado
alteracao_de_codigo: nao_autorizada
```
