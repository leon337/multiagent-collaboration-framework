---
name: mcf-mission-checkpoint
description: Use when Leandro asks where a mission stands, requests its status/checkpoint, or needs a current mission resumed in another chat without reconstructing its history manually.
---

# MCF Mission Checkpoint

## Princípio

Responder com a **fotografia auditável da missão**, usando uma única fonte canônica para o estado de continuidade e relendo estados mutáveis quando necessário. Um documento `SUPERSEDED` pode ser histórico, nunca estado corrente.

## Gatilhos

- `ONDE ESTAMOS?`
- `STATUS DA MISSÃO`
- `CHECKPOINT DA MISSÃO`

Se a missão atual for inequívoca, não pedir ao usuário para explicar o contexto novamente. Se existirem duas ou mais missões candidatas, pedir somente a desambiguação mínima.

## Fluxo obrigatório

1. Identificar a missão.
2. Localizar o roadmap/checkpoint operacional canônico.
3. Rejeitar fontes marcadas `SUPERSEDED` para estado corrente.
4. Ler `Etapa atual`, último registro cronológico e próxima ação.
5. Identificar campos mutáveis: branch/HEAD, PR, deploy, host, gate etc.
6. Reler o estado live quando ele for material para a resposta e a ferramenta estiver disponível.
7. Quando a releitura não for possível, manter o último valor verificável marcado `STALE`/`NAO_VERIFICADO`.
8. Entregar status compacto e acionável.

## Saída mínima

```text
Missão
Estado
Etapa atual
Última atualização
Concluído
Atual
Pendente
Bloqueios
Branch / SHA / PR relevantes
Fonte canônica + link
Próxima ação exata
Campos STALE / NÃO VERIFICADO
```

## Regras críticas

- Não reiniciar missão enquanto existir checkpoint válido.
- Não escolher roadmap por nome/data quando a canonicidade não estiver comprovada.
- Não converter último estado conhecido em estado live atual sem releitura ou marcador de staleness.
- Não exigir que Leandro reconte uma missão cuja fonte canônica está acessível.
- Falta de fonte canônica = `BLOCKED`/`NAO_VERIFICADO`, não reconstrução inventada.

## Testes

Ver `docs/tests/MCF-MISSION-CHECKPOINT-TESTS.md`.

## Limite de executabilidade

Esta versão é uma skill de governança/orquestração `EXPERIMENTAL`. Registro no `skills/registry.yaml` não a inclui automaticamente no `McfExecutableSkillId`/`SkillExecutor`. Promoção runtime é uma mudança separada.