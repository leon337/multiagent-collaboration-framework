# Gate humano proposto — Cloud G2-B / VPS

**Status:** `PROPOSED_NOT_AUTHORIZED`  
**Tipo:** promoção e validação antes de qualquer acesso remoto  
**Este documento executa ações na VPS:** `false`

## Decisão pedida futuramente

LEANDRO deverá autorizar um SHA candidato novo e limpo para uma missão delimitada. A autorização
precisa separar, no mínimo:

1. reconstrução/replay local do candidato;
2. validação local descartável;
3. eventual transporte read-only;
4. eventual instalação na VPS;
5. primeiro write controlado;
6. rollback/revoke;
7. promoção ou produção.

Aprovar um item não aprova os seguintes.

## Baseline auditado

- Cloud `main@ce829067a9a04eceaa6eaefd9553899b2ce14da1`;
- integration train `mcf/mission-001-control-bridge-g1@420ee7d26bc40159e3040a5319b16b21a6f02499`;
- o delta de `38cd22e0a814bdf4957edcf5bb30506a4810bda0` para `420ee7d2` é somente o
  Capsule/evidência do PR #38, validado por CI; ele não promove a integração para `main`;
- G2-B remoto publicado `codex/control-bridge-g2b@fbef3d407dbd9b7947b6c100a63d098eaebe2b6a`;
- preservação SSH `recovery/g2b-ssh-local-preservation-20260828@7fa9ab996be6cdffd4ea3913c082e3da7090fff4`;
- patch local predecessor `ef2d10a` deve ser avaliado separadamente;
- MCF canônico `main@0b900ee03a05153e2e4a795fce7b457f5b4bb812`.

Essas linhas divergem. Nenhuma delas é, por si só, o candidato autorizado.

## Boundary recomendado para a próxima autorização

```yaml
gate_id: MCF-CLOUD-G2B-LOCAL-REPLAY-001
allowed:
  - create_clean_branch_from_human_selected_cloud_target
  - selectively_replay_reviewed_g2b_ssh_changes
  - reconcile_contract_schema_grant_and_runbook
  - run_local_disposable_tests
  - run_ansible_syntax_checks
  - run_secret_scan_and_ci
forbidden:
  - ssh_or_vps_access
  - install_or_modify_node01
  - real_workspace_write
  - sudoers_or_helper_activation
  - credential_rotation
  - provider_or_production_activation
  - paid_ai_api
```

## Checklist de entrada

- [ ] target Cloud canônico escolhido explicitamente por LEANDRO;
- [ ] `origin/main` e todos os lineages relidos no momento do gate;
- [ ] branch/worktree limpa criada no SHA aprovado;
- [ ] diff do recovery revisado arquivo a arquivo;
- [ ] necessidade do patch `ef2d10a` decidida separadamente;
- [ ] nenhum segredo real presente no candidato;
- [ ] request/result schemas e grant comparados com o MCF;
- [ ] helper, sudoers, rollback, revoke e replay documentados;
- [ ] CI da Task 8/linha substituta verde no SHA candidato;
- [ ] MCF preparation tests verdes e sem adapter live registrado.

## Checklist de saída do gate local

- [ ] 13/13 testes SSH PASS;
- [ ] 7/7 testes bootstrap PASS;
- [ ] 4/4 Ansible syntax checks PASS;
- [ ] scanner de segredos real PASS;
- [ ] `git diff --check` PASS;
- [ ] CI requerida PASS no SHA exato;
- [ ] fingerprints e cleanup do laboratório registrados;
- [ ] nenhum socket, túnel, sessão SSH ou recurso VPS criado;
- [ ] Capsule/evidência atualizadas sem declarar conexão/ativação;
- [ ] novo gate humano aberto para qualquer passo remoto.

## Gate remoto posterior

Mesmo depois do gate local verde, o primeiro acesso remoto exige outra autorização contendo:

- host e identidade exatos;
- operação exata (`status` antes de mutação);
- credencial/boundary aprovados sem expor segredo;
- request id, digest, MCF mission/phase e source SHA vinculados;
- janela, timeout, stop conditions e responsável humano;
- read-back, Receipt, rollback e revoke;
- regra para `UNKNOWN` sem retry cego;
- confirmação explícita de que nenhum fallback pago será usado.

## Stop conditions

Interromper sem contorno se houver drift de contrato, segredo no diff/log, host ambíguo, CI não verde,
Ansible ausente, helper/sudoers divergente, authority não vinculada, Receipt incompleto, efeito
`UNKNOWN`, ou qualquer necessidade de ampliar o escopo.

## Texto mínimo de autorização futura

> Autorizo somente o gate `MCF-CLOUD-G2B-LOCAL-REPLAY-001`, no target e SHA indicados no checkpoint
> contemporâneo, limitado a replay local, contratos, testes, Ansible syntax, secret scan e CI. Não
> autorizo SSH, VPS, instalação, write real, credenciais, provider, produção ou API paga.

Sem texto equivalente e SHA contemporâneo, o estado continua `PROPOSED_NOT_AUTHORIZED`.
