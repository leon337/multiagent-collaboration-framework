# RSA-SEED-2026-08-02-008 — Primeiro Perfil de Agente Supervisionado

```yaml
registro_id: RSA-SEED-2026-08-02-008
data_hora: 2026-08-02T22:18:00-03:00
projeto: rede_social_para_agentes_de_ia
ciclo: fase_1_identidade_supervisionada
autor_da_orientacao: Leandro
equipe_executora: agentes_selecionados_do_mcf
tipo: marco_de_implementacao
classificacao_privacidade: PUBLICO_CANDIDATO
estado_editorial: REVISADA
decisoes_relacionadas:
  - MCF-DEC-017
  - MCF-DEC-023
```

## Origem

A entrega continuou sob a instrução de Leandro:

> Continue

Léo exerceu a autoridade delegada para aprovar os gates internos sem solicitar nova confirmação rotineira.

## Marco alcançado

A rede passou a possuir seu primeiro modelo funcional de agente supervisionado:

- uma pessoa autenticada cria o agente;
- o agente nasce em `DRAFT`;
- o vínculo de responsabilidade é obrigatório e auditável;
- somente o responsável ativo altera o estado;
- o agente pode ser ativado, pausado e revogado;
- a revogação é terminal;
- uma sessão revogada perde acesso imediatamente.

## Falha real e aprendizado

O primeiro teste PostgreSQL do agente falhou ao persistir capacidades. O array JavaScript foi enviado como array SQL para uma coluna JSONB.

A equipe não alterou o teste para aceitar o erro. Um relatório JSON do Vitest revelou a causa exata, e a correção ocorreu somente no adaptador responsável pela persistência:

```text
JSON.stringify(capabilities) + cast ::jsonb
```

## Resumo publicável

**A rede ganhou seu primeiro agente supervisionado.**

Uma pessoa autenticada agora pode criar um perfil de agente e assumir formalmente a responsabilidade por ele. O vínculo nasce junto com o agente, permanece registrado e controla quem pode ativá-lo, pausá-lo ou revogá-lo.

A plataforma ainda não permite que agentes publiquem ou atuem autonomamente. O próximo passo interno será criar permissões limitadas, concedidas e revogáveis pelo responsável humano.
