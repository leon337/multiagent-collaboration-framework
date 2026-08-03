# MCF-DEC-031 — Autorização de Produção, Deploy Público e Usuários Reais

**Data:** 3 de agosto de 2026  
**Autoridade humana:** Leandro  
**Coordenação:** Mestre  
**Autoridade delegada:** Léo  
**Fase atual:** 1.6 — Comentários e Reações Supervisionadas  
**Estado:** APROVADO

## 1. Declaração recebida

```yaml
fase_1_6: EM_EXECUCAO
producao: AUTORIZADA
deploy_publico: AUTORIZADO
usuarios_reais: AUTORIZADOS
```

## 2. Interpretação operacional

Leandro remove os bloqueios de governança que impediam preparar e executar produção, deploy público e entrada de usuários reais.

A autorização permite:

- criar e configurar o ambiente de produção;
- configurar domínio, TLS, variáveis e serviços externos necessários;
- executar deploy público após o gate de prontidão;
- habilitar cadastro, autenticação e uso por pessoas reais;
- coletar telemetria operacional estritamente necessária;
- corrigir, reimplantar e reverter versões de produção;
- executar rollout gradual, canário ou acesso controlado;
- suspender o serviço quando segurança ou integridade exigirem.

## 3. Distinção obrigatória de estados

```yaml
autorizacao_de_producao: CONCEDIDA
prontidao_tecnica: PENDENTE_DE_EVIDENCIAS
deploy_publico_executado: NAO
usuarios_reais_ativados: NAO
```

A autorização não equivale a declarar o sistema pronto nem publicado. Nenhum relatório poderá apresentar produção, deploy ou usuários reais como concluídos sem evidência do ambiente correspondente.

## 4. Gate mínimo antes do primeiro deploy público

Léo somente poderá autorizar o primeiro deploy quando houver evidência de:

- CI completa e reprodutível no HEAD candidato;
- migrações testadas, backup e restauração;
- configuração segura de segredos e credenciais;
- TLS e domínio válidos;
- política de privacidade e termos aplicáveis;
- mecanismo de exclusão, suspensão e suporte ao usuário;
- rate limiting e proteção contra abuso;
- logs, métricas, alertas e correlação;
- rollback testado;
- teste de fumaça no ambiente público;
- auditoria independente de Emily sem achado crítico ou alto aberto.

## 5. Entrada de usuários reais

A entrada deverá ocorrer de forma gradual:

```yaml
etapa_1: OPERADORES_INTERNOS
etapa_2: USUARIOS_PILOTO_CONVIDADOS
etapa_3: CADASTRO_PUBLICO_CONTROLADO
```

Cada etapa exige estabilidade, observabilidade e ausência de incidente impeditivo na etapa anterior.

## 6. Autoridade operacional

```yaml
objetivo_producao: AUTORIZADO
objetivo_deploy_publico: AUTORIZADO
objetivo_usuarios_reais: AUTORIZADO
execucao_antes_do_gate: PROIBIDA
aprovacao_do_gate: LEO
coordenacao: MESTRE
auditoria: EMILY
rollback_em_incidente: PRE_AUTORIZADO
suspensao_em_risco: PRE_AUTORIZADA
```

## 7. Aplicação imediata

A Fase 1.6 permanece em execução. Seus artefatos e critérios passam a incluir prontidão para produção e uso real, sem reduzir os controles de supervisão dos agentes.