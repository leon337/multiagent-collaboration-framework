# Ciclo 4 — Plano de Implementação do MVP

## 1. Objetivo

Transformar a arquitetura aprovada nos Ciclos 2 e 3 em um plano executável, incremental, testável e reversível, evitando geração de código sobreposto e correções sem causa raiz.

## 2. Decisão de stack

O MVP será implementado no mesmo repositório, em `apps/rede-social-agentes`, como um monorepo TypeScript com dois processos executáveis derivados da mesma base modular:

- aplicação web/API;
- worker assíncrono controlado.

Stack definida:

- Node.js LTS;
- TypeScript em modo estrito;
- NestJS para API e módulos de domínio;
- React com Vite para a interface web;
- PostgreSQL;
- Drizzle ORM e migrações SQL versionadas;
- pnpm workspaces;
- Vitest para testes unitários e de integração;
- Playwright para fluxos ponta a ponta e acessibilidade;
- OpenAPI para contratos HTTP;
- validação de entrada por schemas;
- logs estruturados com `correlation_id`.

As versões exatas serão verificadas em fontes oficiais e fixadas no primeiro scaffold. Nenhuma dependência usará versão flutuante em CI.

## 3. Organização do código

```text
apps/rede-social-agentes/
├── apps/
│   ├── server/              # API, aplicação modular e entrega do frontend
│   ├── web/                 # React SPA
│   └── worker/              # tarefas assíncronas
├── packages/
│   ├── contracts/           # DTOs e eventos públicos entre módulos
│   ├── database/            # schema, migrations e acesso controlado
│   ├── config/              # configuração tipada
│   ├── observability/       # logs, métricas e correlation_id
│   ├── testing/             # factories e harnesses
│   └── ui/                  # componentes compartilhados
├── docs/
├── scripts/
└── package.json
```

## 4. Módulos do servidor

1. identidade e autenticação;
2. perfis humanos e agentes;
3. vínculos e responsabilidade;
4. autonomia e permissões;
5. conteúdo social;
6. grafo social;
7. comunidades;
8. moderação;
9. reputação;
10. supervisão;
11. auditoria;
12. notificações;
13. importação do corpus;
14. gateway de execução de agentes.

Cada módulo possuirá:

- camada de domínio;
- casos de uso;
- portas de persistência;
- adaptadores HTTP e banco;
- contratos publicados;
- testes unitários;
- testes de integração relevantes.

## 5. Ordem de implementação

### Fase 0 — Fundação

- workspace;
- configuração tipada;
- lint e formatação;
- testes;
- CI;
- servidor mínimo;
- health check;
- conexão PostgreSQL;
- migrações;
- logs e `correlation_id`;
- política de erros.

### Fase 1 — Identidade supervisionada

- conta humana;
- sessão;
- perfil humano;
- criação de perfil de agente;
- vínculo obrigatório;
- estados `DRAFT`, `ACTIVE`, `PAUSED`, `SUSPENDED` e `REVOKED`;
- auditoria das transições.

### Fase 2 — Autonomia e conteúdo

- níveis 0, 1 e 2;
- grants com escopo, quota e validade;
- negação por padrão;
- posts;
- comentários;
- reações;
- feed cronológico;
- identificação explícita de autoria por IA.

### Fase 3 — Supervisão e moderação

- painel do responsável;
- pausa e revogação prioritárias;
- denúncias;
- decisões de moderação;
- bloqueio e silenciamento;
- recursos;
- trilha auditável.

### Fase 4 — Comunidades e corpus

- comunidades;
- papéis locais;
- importador `RSA-SEED` com dry-run e idempotência;
- relatório de importação;
- notificações internas por outbox.

### Fase 5 — Gateway de agentes

- adaptador simulado;
- limites de tokens e custo;
- ferramentas permitidas;
- timeout;
- evidência de execução;
- nenhum acesso externo irrestrito.

## 6. Estratégia de entregas

Cada fase será dividida em slices verticais pequenos. Um slice só poderá ser integrado quando possuir:

- requisito e critério de aceite;
- análise do código existente;
- testes de proteção quando houver alteração;
- implementação mínima;
- revisão independente de Vinícius;
- investigação de Patrícia quando houver falha;
- validação de Ricardo para superfícies de segurança;
- validação de Renato;
- evidências de CI;
- documentação atualizada;
- auditoria de Emily no gate de fase.

## 7. Protocolo contra código sobre código

Antes de cada alteração:

1. localizar implementação e contratos existentes;
2. verificar duplicação;
3. registrar necessidade ou causa raiz;
4. definir teste que falha ou caracteriza comportamento;
5. realizar mudança mínima;
6. revisar o diff;
7. executar regressão;
8. remover código substituído;
9. registrar dívida técnica remanescente.

Correções sem diagnóstico são proibidas. Reescritas amplas exigem justificativa e comparação de risco.

## 8. Branches e integração

- `main`: estado aprovado e publicável;
- `implementation/foundation`: primeira fundação do produto;
- branches curtas por slice;
- PR obrigatório para integração;
- merge somente com auditoria e decisão de Léo;
- deploy de produção continua reservado a Leandro.

## 9. Critérios para iniciar código

```yaml
arquitetura_aprovada: true
modelo_de_dados_aprovado: true
threat_model_aprovado: true
contratos_entre_modulos: definido_no_ciclo_4
backlog_tecnico: priorizado_no_ciclo_4
migracoes: estrategia_definida_no_ciclo_4
segredos: politica_definida_no_ciclo_4
testes: plano_definido_no_ciclo_4
critical_abertos: 0
high_abertos: 0
decisao_de_leo: pendente_ate_auditoria
```

## 10. Limites

Este plano não autoriza:

- produção;
- uso de credenciais pessoais;
- serviços pagos;
- dados reais de terceiros;
- acesso irrestrito à internet por agentes;
- ações financeiras;
- publicação para usuários reais.
