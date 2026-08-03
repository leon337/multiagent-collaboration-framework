# Fase 1.9 — Prontidão para Produção, Privacidade e Operação

**Estado:** EM IMPLEMENTAÇÃO  
**Coordenação:** Mestre  
**Gate interno:** Léo  
**Auditoria:** Emily

## Objetivo

Preparar a aplicação para o primeiro rollout público controlado sem confundir autorização com prontidão ou publicação efetiva.

## Slice A — Segurança e abuso

- headers de segurança;
- identificação confiável de origem atrás de proxy configurado;
- limites globais de payload;
- rate limiting por rota e sujeito;
- proteção de cadastro, sessão, denúncias, comentários e reações;
- respostas uniformes sem enumeração;
- métricas de bloqueio sem armazenar conteúdo sensível.

## Slice B — Privacidade e direitos do usuário

- política de privacidade e termos versionados;
- consentimento e versão aceita;
- exportação autenticada dos dados próprios;
- solicitação de exclusão;
- suspensão imediata de novas sessões;
- anonimização ou retenção justificada para auditoria e segurança;
- histórico das solicitações.

## Slice C — Dados e recuperação

- script de backup PostgreSQL;
- manifesto com checksum;
- restauração em banco limpo;
- verificação de migrações após restauração;
- política de retenção;
- runbook de perda de dados.

## Slice D — Operação

- logs estruturados e correlação;
- métricas de saúde, erro, latência, fila e moderação;
- alertas mínimos;
- runbook de incidentes;
- rollback reproduzível;
- responsável operacional e escalonamento.

## Slice E — Infraestrutura e rollout

- separação entre desenvolvimento, homologação e produção;
- segredos fora do repositório;
- domínio e TLS;
- deploy de homologação;
- smoke tests;
- deploy de produção;
- rollout interno, piloto por convite e cadastro controlado.

## Gate de conclusão

A fase somente será marcada como pronta quando cada requisito possuir evidência verificável. Credenciais, domínio, provedor e políticas publicadas são dependências materiais: quando uma delas não estiver disponível, o sistema deverá registrar o bloqueio exato sem interromper as demais trilhas independentes.

## Estado inicial

```yaml
seguranca_e_abuso: EM_EXECUCAO
privacidade_e_direitos: PENDENTE
dados_e_recuperacao: PENDENTE
operacao: PENDENTE
infraestrutura_e_rollout: PENDENTE
primeiro_deploy: NAO_EXECUTADO
usuarios_reais: NAO_ATIVADOS
```