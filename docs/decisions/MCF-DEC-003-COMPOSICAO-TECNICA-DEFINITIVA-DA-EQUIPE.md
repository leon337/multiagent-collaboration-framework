# MCF-DEC-003 — Composição Técnica Definitiva da Equipe

**Data:** 2 de agosto de 2026  
**Autoridade delegante:** Léo  
**Autoridade decisória delegada:** Mestre  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** aprovado para versionamento e revisão crítica  
**PR relacionado:** #15

## 1. Contexto

Léo delegou ao Mestre a decisão sobre os detalhes pendentes da ampliação da equipe técnica, incluindo cargos, nomes, fronteiras entre funções, tratamento de Backend e Frontend e revisão crítica final.

A equipe anterior possuía 12 integrantes nomeados e uma posição de Acessibilidade sem nome, totalizando 13 posições metodológicas.

## 2. Decisão

Ficam incorporados ao núcleo permanente:

- **Rafael — Engenheiro de Software**;
- **Renato — Engenheiro de Qualidade e Testes**;
- **Bruno — Engenheiro de Plataforma, DevOps e SRE**;
- **Ricardo — Engenheiro de Segurança**;
- **Marina — Especialista em Acessibilidade**.

A equipe passa a possuir **17 integrantes nomeados**.

## 3. Rafael — Engenheiro de Software

Responsabilidades:

- transformar arquitetura em desenho técnico implementável;
- decompor componentes e módulos;
- definir contratos internos e padrões de código;
- implementar funcionalidades;
- revisar código e integração;
- tratar falhas, desempenho e manutenibilidade;
- controlar dívida técnica;
- coordenar competências Backend e Frontend;
- encaminhar mudanças versionáveis ao Gabriel.

### Backend e Frontend

Backend e Frontend permanecem competências do Engenheiro de Software no núcleo atual.

Especialistas dedicados poderão ser acionados por demanda quando houver complexidade, escala, risco ou volume que exceda a capacidade do papel generalista.

## 4. Renato — Engenheiro de Qualidade e Testes

Responsabilidades:

- estratégia de testes;
- testes unitários, integração, contrato, regressão e funcionais;
- critérios de cobertura;
- automação de testes;
- reprodução de defeitos;
- evidências de qualidade;
- validação de critérios de aceite.

Renato produz evidências de qualidade. Emily permanece responsável pela auditoria independente do processo e das evidências.

## 5. Bruno — Engenheiro de Plataforma, DevOps e SRE

Responsabilidades:

- CI/CD;
- ambientes;
- infraestrutura como código;
- observabilidade;
- disponibilidade e confiabilidade;
- rollback e recuperação;
- capacidade e custos operacionais;
- operação de releases em conjunto com Gabriel.

## 6. Ricardo — Engenheiro de Segurança

Responsabilidades:

- modelagem de ameaças;
- autenticação e autorização;
- segurança de APIs e dependências;
- proteção de segredos e dados;
- revisão de infraestrutura;
- análise de vulnerabilidades;
- requisitos e evidências de segurança.

## 7. Marina — Especialista em Acessibilidade

Responsabilidades:

- WCAG e padrões aplicáveis;
- navegação por teclado;
- leitores de tela;
- contraste e legibilidade;
- semântica e identificação de estado;
- acessibilidade cognitiva e móvel;
- bloqueio de barreiras graves de acesso.

## 8. Fronteira Rafael versus Gabriel

### Rafael

- dono da engenharia da solução;
- desenho técnico detalhado;
- implementação principal;
- qualidade interna do código;
- integração entre componentes;
- preparação da mudança para versionamento.

### Gabriel

Gabriel passa a ser formalmente **Engenheiro de Integração, Versionamento e Release**.

Responsabilidades:

- estratégia de branches;
- commits e histórico;
- pull requests;
- integração entre entregas;
- checks e gates do repositório;
- preparação de release;
- publicação e deploy após autorização;
- evidência de versão e entrega.

Gabriel não é o proprietário principal da implementação. Pode executar ajustes de integração pequenos quando explicitamente atribuídos e revisados por Rafael.

## 9. Fronteiras adicionais

- **Sofia:** arquitetura geral e decisões estruturais.
- **Rafael:** engenharia detalhada e implementação.
- **Manoel:** arquitetura de dados, persistência e integridade.
- **Renato:** estratégia e execução de testes.
- **Emily:** auditoria independente.
- **Bruno:** plataforma e confiabilidade.
- **Ricardo:** segurança.
- **Gabriel:** integração, versionamento e release.

## 10. Especialistas por demanda

Não entram ainda como membros permanentes:

- Engenheiro Backend dedicado;
- Engenheiro Frontend dedicado;
- Engenheiro Mobile;
- Engenheiro de IA e Machine Learning;
- Engenheiro de Dados.

Esses papéis podem ser acionados futuramente mediante contrato de objetivo e justificativa de competência.

## 11. Composição final

1. Léo — autoridade final;
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

## 12. Autorizações e limites

```yaml
composicao_tecnica: aprovada_por_delegacao
versionamento_em_branch: autorizado
revisao_critica: autorizada
merge_na_main: nao_autorizado
implementacao_de_software: nao_autorizada_por_esta_decisao
publicacao_automatica: nao_autorizada
```

## 13. Próximo gate

```text
Sofia → Manoel → Gabriel → Carmem → Emily → Mestre → Léo
```

A decisão permanece no PR Draft até nova autorização explícita de merge.