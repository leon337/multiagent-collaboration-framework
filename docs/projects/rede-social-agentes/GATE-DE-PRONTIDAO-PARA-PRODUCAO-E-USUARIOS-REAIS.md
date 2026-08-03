# Gate de Prontidão para Produção e Usuários Reais

**Autorização:** MCF-DEC-031  
**Estado:** ABERTO  
**Coordenação:** Mestre  
**Decisão:** Léo  
**Auditoria:** Emily

## Objetivo

Converter a autorização material de produção em evidência verificável de que a aplicação pode ser publicada e utilizada por pessoas reais com segurança, reversibilidade e observabilidade.

## Estados

```yaml
AUTORIZADO: objetivo aprovado por Leandro
PRONTO: requisitos técnicos e operacionais aprovados
PUBLICADO: deploy público comprovado
ATIVO_COM_USUARIOS: usuários reais habilitados e monitorados
```

Nenhum estado posterior pode ser inferido do anterior.

## Checklist obrigatório

### Aplicação

- [ ] Fase funcional candidata concluída;
- [ ] lint, tipos, testes e build verdes;
- [ ] testes de integração no PostgreSQL;
- [ ] testes de autenticação, autorização e anti-enumeração;
- [ ] rate limiting e proteção contra abuso;
- [ ] validação de entradas e limites de payload;
- [ ] dependências verificadas e lockfile congelado.

### Dados

- [ ] migrações idempotentes;
- [ ] backup automatizado;
- [ ] restauração comprovada;
- [ ] política de retenção;
- [ ] exclusão e exportação de dados do usuário;
- [ ] separação entre ambientes de teste e produção.

### Segurança

- [ ] segredos fora do repositório;
- [ ] rotação e revogação de credenciais;
- [ ] TLS válido;
- [ ] headers de segurança;
- [ ] proteção contra abuso de sessão;
- [ ] auditoria sem achado crítico ou alto aberto.

### Operação

- [ ] domínio e infraestrutura definidos;
- [ ] health checks;
- [ ] logs estruturados e correlação;
- [ ] métricas e alertas;
- [ ] runbook de incidentes;
- [ ] rollback testado;
- [ ] responsável operacional definido.

### Usuários reais

- [ ] política de privacidade publicada;
- [ ] termos de uso publicados;
- [ ] consentimentos necessários;
- [ ] canal de suporte;
- [ ] suspensão e exclusão de conta;
- [ ] fluxo de denúncia e moderação;
- [ ] piloto limitado antes do cadastro público.

## Estratégia de liberação

```yaml
rollout_1:
  publico: EQUIPE_INTERNA
  criterio: SMOKE_TEST_E_OBSERVABILIDADE
rollout_2:
  publico: PILOTO_POR_CONVITE
  criterio: ESTABILIDADE_SEM_INCIDENTE_IMPEDITIVO
rollout_3:
  publico: CADASTRO_PUBLICO_CONTROLADO
  criterio: APROVACAO_DE_LEO_E_AUDITORIA_DE_EMILY
```

## Evidência de conclusão

O gate somente será marcado como `PASS` quando cada item obrigatório tiver referência para commit, workflow, configuração, relatório, URL pública ou teste reproduzível.