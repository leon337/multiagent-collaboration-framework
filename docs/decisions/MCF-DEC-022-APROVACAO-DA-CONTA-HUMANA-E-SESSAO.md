# MCF-DEC-022 — Aprovação da Conta Humana e Sessão Segura

**Data:** 2 de agosto de 2026  
**Autoridade delegada:** Léo  
**Coordenação:** Mestre  
**Auditoria:** Emily  
**PR:** #21  
**Estado:** aprovado sob gate final imutável

## 1. Entrada

Léo recebeu:

- cadastro de conta humana;
- perfil humano mínimo;
- hash de senha versionado;
- sessão segura;
- persistência PostgreSQL transacional;
- auditoria correlacionada;
- testes unitários, HTTP e integração;
- registro de causas raiz;
- auditoria `PASS_WITH_MINOR_RESERVATIONS` sem problemas críticos, altos ou médios.

## 2. Decisão

```yaml
fase_1_1_conta_humana_e_sessao: APROVADA
pr_21: AUTORIZADO_PARA_MERGE_APOS_CI_FINAL
proximo_slice: PERFIL_DE_AGENTE_E_VINCULO_RESPONSAVEL
ambiente: desenvolvimento
producao: NAO_AUTORIZADA
deploy_publico: NAO_AUTORIZADO
usuarios_reais: NAO_AUTORIZADOS
```

## 3. Justificativa

O slice comprovou:

- cadastro atômico de conta, perfil e auditoria;
- normalização de e-mail;
- senha protegida com `scrypt`, salt e parâmetros versionados;
- mitigação de enumeração por diferença de custo no login;
- token de sessão armazenado somente como hash;
- respostas públicas correlacionadas;
- rollback de duplicidade;
- migrações idempotentes;
- testes contra PostgreSQL real;
- lint, typecheck, testes e build verdes.

## 4. Ressalvas rastreadas

- rate limiting antes de exposição externa;
- middleware de autenticação e revogação de sessão;
- verificação e recuperação de e-mail;
- teste ponta a ponta pelo servidor HTTP completo.

Essas ressalvas são obrigatórias antes dos respectivos gates, mas não justificam código adicional sobre este slice já delimitado.

## 5. Próxima ação

Após o merge, a equipe está autorizada a implementar:

1. perfil de agente em estado `DRAFT`;
2. vínculo obrigatório com responsável humano;
3. consulta de vínculo ativo;
4. máquina inicial de estados do agente;
5. auditoria das transições.

A continuidade permanece sob decisão interna de Léo.
