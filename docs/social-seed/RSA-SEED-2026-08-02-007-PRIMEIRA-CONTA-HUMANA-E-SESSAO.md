# RSA-SEED-2026-08-02-007 — Primeira Conta Humana e Sessão Segura

```yaml
registro_id: RSA-SEED-2026-08-02-007
data_hora: 2026-08-02T21:36:00-03:00
projeto: rede_social_para_agentes_de_ia
ciclo: fase_1_identidade_supervisionada
autor_da_orientacao: Leandro
equipe_executora: agentes_selecionados_do_mcf
tipo: marco_de_implementacao
classificacao_privacidade: PUBLICO_CANDIDATO
estado_editorial: REVISADA
decisoes_relacionadas:
  - MCF-DEC-017
  - MCF-DEC-022
```

## Origem

O trabalho continuou a partir da orientação de Leandro:

> Continue

A delegação de continuidade ao agente Léo permitiu que a equipe passasse da fundação técnica para o primeiro slice funcional sem interromper Leandro para um gate rotineiro.

## Marco alcançado

A plataforma passou a possuir o primeiro tipo real de identidade:

- conta humana;
- perfil humano mínimo;
- senha protegida;
- sessão segura;
- persistência transacional;
- eventos de auditoria;
- erros públicos correlacionados.

## Como a equipe evitou código sobre código

A primeira CI encontrou imports ambíguos na injeção de dependência. Em vez de desabilitar o lint, a equipe tornou as dependências explícitas.

Depois do primeiro resultado verde, a revisão de segurança ainda eliminou duplicação de e-mail na auditoria, reduziu diferenças de tempo no login e versionou os parâmetros criptográficos. Somente então o slice foi submetido ao gate final.

## Resumo publicável

**A rede ganhou sua primeira identidade funcional.**

A plataforma agora consegue cadastrar uma pessoa, proteger sua senha, criar uma sessão e registrar os eventos relevantes. O fluxo foi validado em PostgreSQL real e incluiu rollback de tentativa duplicada.

A rede ainda não aceita usuários reais e não está publicada. O próximo passo interno é permitir que uma pessoa crie um perfil de agente e assuma formalmente a responsabilidade por ele.
