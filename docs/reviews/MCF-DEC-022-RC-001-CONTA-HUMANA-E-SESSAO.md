# MCF-DEC-022 — RC-001 — Conta Humana e Sessão Segura

**Data:** 2 de agosto de 2026  
**Revisora:** Emily — Auditoria Independente  
**Revisão de segurança:** Ricardo  
**Revisão de qualidade:** Renato e Vinícius  
**PR:** #21  
**Estado:** concluído

## 1. Escopo revisado

- contratos públicos de cadastro e sessão;
- schema e migração PostgreSQL;
- repositório transacional;
- serviço de identidade;
- controller HTTP;
- hash de senha;
- tokens de sessão;
- auditoria;
- testes unitários, HTTP e integração real;
- histórico de causa raiz.

## 2. Persistência e transações

Conta, perfil humano e evento de auditoria são criados na mesma transação. Sessão e evento correspondente também são atômicos.

O teste de integração comprovou que uma tentativa com e-mail duplicado não deixa perfil parcial.

**Resultado:** PASS

## 3. Senhas

- algoritmo `scrypt`;
- salt aleatório por senha;
- parâmetros explícitos e versionados;
- comparação em tempo constante;
- senha original nunca é persistida;
- conta inexistente consome custo criptográfico equivalente antes da rejeição.

**Resultado:** PASS

## 4. Sessões

- token aleatório de alta entropia;
- somente o hash SHA-256 é armazenado;
- token bruto é entregue apenas na criação;
- validade explícita;
- criação transacional e auditável.

**Resultado:** PASS

## 5. Privacidade e auditoria

A auditoria preserva ator, agregado, correlação e evento. O e-mail não é duplicado no payload de auditoria, reduzindo dispersão de dado pessoal.

**Resultado:** PASS

## 6. Erros públicos

- validação inválida retorna código estável;
- autenticação de conta inexistente, senha incorreta ou conta indisponível usa a mesma resposta pública;
- erros incluem `correlationId`;
- detalhes internos do banco, hash e estado da conta não são expostos.

**Resultado:** PASS

## 7. Banco e migrações

A migração cria constraints de status, tamanho de nome, chaves estrangeiras e índices de sessão e auditoria. O conjunto completo de migrações passou duas vezes no mesmo banco.

**Resultado:** PASS

## 8. Testes

Foram validados:

- hash e verificação de senha;
- rejeição de hash inválido;
- custo de verificação para conta inexistente;
- normalização de e-mail;
- cadastro e sessão;
- credenciais incorretas;
- erros HTTP correlacionados;
- persistência real em PostgreSQL;
- rollback de duplicidade;
- eventos de auditoria;
- migração idempotente;
- build de todos os projetos.

**Resultado:** PASS

## 9. Limites operacionais

O slice não implementa:

- perfil de agente;
- autorização por bearer token;
- revogação de sessão por endpoint;
- recuperação de senha;
- verificação de e-mail;
- rate limiting;
- produção ou deploy público.

**Resultado:** limites preservados.

## 10. Ressalvas

### LOW-01 — Rate limiting antes de exposição pública

Cadastro e autenticação deverão receber limitação por origem, conta e janela antes de qualquer ambiente acessível externamente.

### LOW-02 — Ciclo completo de sessão ainda não existe

Validação do bearer token, consulta da sessão, encerramento e revogação serão implementados no próximo slice de identidade.

### LOW-03 — Verificação e recuperação de e-mail estão pendentes

Esses fluxos são obrigatórios antes de usuários reais, mas não bloqueiam o desenvolvimento interno atual.

### LOW-04 — Teste HTTP ainda não inicia o servidor completo

Controller, serviço e PostgreSQL possuem testes separados. Um teste ponta a ponta pela pilha HTTP completa deverá ser adicionado quando o middleware de autenticação for criado.

## 11. Veredito

```yaml
veredito: PASS_WITH_MINOR_RESERVATIONS
critical: 0
high: 0
medium: 0
low: 4
slice_executavel: true
apto_para_integracao: true
producao_autorizada: false
```

As ressalvas não bloqueiam o merge em desenvolvimento nem o próximo slice de identidade supervisionada.
