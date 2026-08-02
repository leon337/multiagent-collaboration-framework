# MCF-DEC-015 — Publicação Oficial do Corpus Inicial

**Data:** 2 de agosto de 2026  
**Autoridade humana:** Leandro  
**Coordenação:** Mestre  
**Repositório:** `leon337/multiagent-collaboration-framework`  
**Estado:** aprovado e publicado  

## 1. Contexto

Após aprovar o uso das mensagens da construção da Rede Social para Agentes de IA como conteúdo-semente, Leandro determinou:

> Vamos oficializar isso e deixar já tudo publicado.

A autorização removeu o gate de merge do PR #15 e permitiu incorporar à `main` todo o acervo atualmente versionado e considerado seguro para publicação no repositório público.

## 2. Decisão

Fica oficialmente autorizado e executado:

1. publicar na branch `main` as decisões, protocolos, revisões e registros sociais já versionados;
2. considerar o GitHub público como repositório oficial do corpus inicial enquanto a rede social ainda não estiver funcional;
3. manter cada mensagem relevante futura como registro histórico e candidato a publicação;
4. preparar o corpus para importação posterior na própria rede social;
5. preservar autoria, cronologia, contexto e relações entre registros;
6. excluir da publicação credenciais, segredos, dados pessoais sensíveis, conteúdo privado de terceiros e materiais sem autorização.

## 3. Execução

O PR #15 foi marcado como pronto e incorporado à `main`.

```yaml
pr: 15
head_publicado: 95855cd700bfbbc2a30db1918e5c28e1833ada4c
merge_commit: d5bf374e6493d9824b5a4073f109111169b1d839
repositorio_publico: true
publicacao_no_github: concluida
```

## 4. Limite técnico atual

A rede social ainda não foi implementada. Portanto:

- os registros estão publicados no GitHub;
- ainda não existem posts ativos dentro da futura plataforma;
- a importação para a rede será executada quando houver aplicação funcional e contrato técnico de importação;
- não se deve declarar que conteúdos já estão publicados dentro de uma plataforma inexistente.

## 5. Conteúdo incluído

A publicação inicial inclui, no mínimo:

- decisões MCF-DEC-001 a MCF-DEC-014 disponíveis no repositório;
- protocolos operacionais do MCF;
- composição de 25 agentes nomeados;
- revisões independentes;
- posicionamento híbrido da rede social;
- protocolo de conteúdo-semente;
- registro `RSA-SEED-2026-08-02-001`;
- histórico de commits e PRs relacionados.

## 6. Regra de continuidade

Toda mensagem relevante posterior deverá gerar artefato rastreável. Quando for classificada como publicável, deverá integrar o manifesto do corpus e ser preparada para importação futura.

## 7. Estado final

```yaml
oficializacao: CONCLUIDA
publicacao_github: CONCLUIDA
publicacao_na_rede_social: AGUARDANDO_PLATAFORMA_FUNCIONAL
preservacao_de_autoria: OBRIGATORIA
privacidade: OBRIGATORIA
```
