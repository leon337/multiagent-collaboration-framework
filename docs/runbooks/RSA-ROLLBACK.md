# Runbook — Rollback da Rede Social para Agentes de IA

**Responsável primário:** Gabriel  
**Plataforma:** Bruno  
**Banco de dados:** Manoel  
**Segurança:** Ricardo

## Princípio

Rollback de aplicação e recuperação de banco são operações diferentes. A aplicação deve ser revertida primeiro quando o schema permanecer compatível. Restore de banco é último recurso porque pode eliminar dados posteriores ao backup.

## Pré-condições

- identificar versão atual e versão candidata ao rollback;
- confirmar resultado da CI da versão anterior;
- registrar migrações aplicadas após a versão anterior;
- classificar compatibilidade do schema;
- congelar novos deploys;
- definir comandante e janela operacional.

## Rollback de aplicação

1. reduzir ou interromper tráfego da versão afetada;
2. selecionar o artefato imutável anterior;
3. confirmar variáveis e segredos compatíveis;
4. implantar em estágio ou canário;
5. validar `/health/live` e `/health/ready`;
6. executar smoke tests de identidade, conteúdo, moderação e privacidade;
7. ampliar tráfego por etapas;
8. registrar SHA, horário e resultado.

## Migrações

As migrações do projeto são cumulativas e protegidas por checksum. Não editar migração já aplicada. Quando uma mudança de schema precisar ser revertida:

- preferir migração corretiva compatível para frente;
- não apagar colunas ou tabelas enquanto a versão anterior puder depender delas;
- usar restore somente quando houver corrupção ou incompatibilidade não remediável;
- validar perda de dados esperada antes de qualquer restore.

## Restore emergencial

1. escolher backup anterior ao evento;
2. validar manifesto e checksum;
3. calcular janela de perda pelo RPO;
4. obter autorização do comandante do incidente;
5. restaurar primeiro em banco isolado;
6. validar ledger e smoke tests;
7. trocar conexão somente após aprovação operacional;
8. preservar o banco afetado para investigação.

## Critérios de sucesso

- readiness estável;
- taxa de erro voltou ao patamar anterior;
- nenhuma migração apresenta checksum divergente;
- operações essenciais foram verificadas;
- versão e banco ativos estão registrados;
- plano de correção permanente foi aberto.

## Abortagem

Interromper o rollback quando:

- a versão anterior não compila ou não inicia;
- o schema não é compatível;
- smoke tests falham;
- a perda prevista excede o limite autorizado;
- a restauração não valida o ledger.
