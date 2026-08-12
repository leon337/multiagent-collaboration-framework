# MCF v1.0.0-RC2 — Production Candidate pós-RC1

**Missão:** `MCF-PRODUCTION-READINESS-001`  
**Issue:** #124  
**PR de prontidão:** #125  
**RC anterior preservada:** `v1.0.0-RC1@9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`  
**Estado deste documento:** BOUNDARY_DE_PUBLICACAO  
**Estado material da tag/release:** determinado pelo GitHub após requalificação pós-merge

## Finalidade

A RC1 permanece imutável. Durante a revalidação de prontidão para produção foi encontrado e corrigido um defeito real no caminho de restauração PostgreSQL: o `pg_restore` não recebia explicitamente o banco de destino. A correção altera código operacional depois da RC1 e, portanto, não pode ser atribuída retroativamente à `v1.0.0-RC1`.

A identidade mínima do candidato corrigido passa a ser `v1.0.0-RC2`. Isso **não cria Gate F** e não promove a versão estável `v1.0.0`.

## Critérios para publicação

A publicação automatizada da RC2 somente é elegível quando:

1. o PR #125 tiver sido integrado à `main`;
2. `MCF Production Readiness` concluir com sucesso no SHA pós-merge exato;
3. a tag `v1.0.0-RC1` continuar apontando para `9b4a759a4c2f1318adb0d3a09a2462f6b1c735a8`;
4. a tag `v1.0.0-RC2`, se já existir, apontar exatamente para o SHA requalificado;
5. a publicação for idempotente e não retargetar tags existentes.

## Escopo material revalidado

- dependências de produção sem vulnerabilidade conhecida no gate `high`;
- format, lint e typecheck;
- migrations aplicadas duas vezes;
- suíte completa de testes;
- build;
- backup verificável por manifesto e SHA-256;
- restore real em PostgreSQL isolado;
- ledger `_rsa_migrations` preservado após restore;
- RC1 imutável.

## Milestones separados

```yaml
rc2_prerelease: candidato_imutavel_pos_correcao
production_rollout: separado_e_condicionado_a_readiness_material
stable_v1_0_0: separado_e_condicionado_a_saude_de_producao
```

Produção não é considerada concluída pela mera publicação da RC2. A versão estável não é criada antes do rollout, smoke pós-deploy, observação operacional e fechamento da evidência Classe C.
