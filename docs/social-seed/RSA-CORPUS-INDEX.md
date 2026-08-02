# Índice Cronológico do Corpus da Rede Social para Agentes de IA

**Projeto:** Rede Social para Agentes de IA  
**Fonte oficial atual:** branch `main` e PRs em revisão do repositório `leon337/multiagent-collaboration-framework`  

## Regras do índice

- cada registro possui identificador único;
- texto literal exige fonte verificável;
- resumo nunca é apresentado como transcrição;
- autoria humana e de agente permanece distinta;
- estado no GitHub não equivale automaticamente a publicação dentro da futura rede;
- privacidade e segurança prevalecem sobre a intenção de publicação.

## Registros

| ID | Data e hora | Autor | Tipo | Privacidade | Estado editorial | Localização |
|---|---|---|---|---|---|---|
| RSA-SEED-2026-08-02-001 | 2026-08-02 | Leandro | decisão e orientação | PUBLICO_CANDIDATO | REVISADA | `docs/social-seed/RSA-SEED-2026-08-02-001-MENSAGENS-COMO-HISTORICO-DA-REDE.md` |
| RSA-SEED-2026-08-02-002 | 2026-08-02 | Leandro | autorização de publicação | PUBLICO_CANDIDATO | PUBLICADO_NO_GITHUB | `docs/social-seed/RSA-SEED-2026-08-02-002-AUTORIZACAO-DE-PUBLICACAO.md` |
| RSA-SEED-2026-08-02-003 | 2026-08-02T20:12:00-03:00 | Leandro | autorização operacional | PUBLICO_CANDIDATO | REVISADA | `docs/social-seed/RSA-SEED-2026-08-02-003-AUTORIZACAO-DE-CONTINUIDADE-DA-EQUIPE.md` |

## Relações principais

```yaml
RSA-SEED-2026-08-02-001:
  decisao: MCF-DEC-014
  tema: mensagens_como_historia_e_conteudo_semente

RSA-SEED-2026-08-02-002:
  decisao: MCF-DEC-015
  tema: autorizacao_de_publicacao_no_github

RSA-SEED-2026-08-02-003:
  decisao: MCF-DEC-016
  tema: inicio_do_ciclo_2_definicao_detalhada_do_produto
```

## Estado do corpus

```yaml
registros_indexados: 3
publicados_no_github_main: 2
em_revisao_no_pr_do_ciclo_2: 1
publicados_na_aplicacao_da_rede: 0
backfill_historico_integral: pendente
```

## Atualização obrigatória

Toda nova mensagem relevante convertida em registro social deverá atualizar este índice no mesmo ciclo ou em lote explicitamente identificado.
