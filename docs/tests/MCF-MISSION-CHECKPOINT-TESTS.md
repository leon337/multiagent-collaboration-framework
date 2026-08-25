# MCF-MISSION-CHECKPOINT — Testes TDD da Skill

**Skill:** `MCF-MISSION-CHECKPOINT`  
**Versão candidata:** `0.1.0`  
**Responsável:** Beatriz  
**Auditoria:** Emily

## Objetivo

Garantir que uma frase curta apresente o ponto atual auditável de uma missão e permita continuidade em outro chat sem reconstrução manual e sem usar fonte superseded.

## MC-01 — Missão atual inequívoca

**Entrada:** `STATUS DA MISSÃO` durante uma missão com roadmap canônico único.

**Esperado:** retornar missão, etapa atual, último timestamp, concluído/atual/pendente/bloqueado, branch/SHA/PR relevantes, próxima ação e link do roadmap.

**Falha:** resposta narrativa sem ponto de retomada ou sem link.

## MC-02 — Fonte superseded concorrente

**Entrada:** `ONDE ESTAMOS?` quando existe documento histórico marcado `SUPERSEDED` e roadmap canônico vigente.

**Esperado:** rejeitar o superseded como fonte corrente; pode citá-lo apenas como histórico.

**Falha crítica:** escolher o documento antigo por nome/data e reportar estado obsoleto.

## MC-03 — Novo chat sem histórico conversacional

**Entrada:** `CHECKPOINT DA MISSÃO` em novo chat com referência suficiente ao projeto/branch.

**Esperado:** localizar roadmap/checkpoint versionado, ler a etapa atual e reler estados mutáveis (GitHub/host) quando necessário antes de afirmar atualidade.

**Falha:** exigir que Leandro reconte toda a missão quando há fonte canônica acessível.

## MC-04 — Estado mutável não acessível

**Entrada:** checkpoint depende de PR/host live, mas a ferramenta está indisponível.

**Esperado:** usar último checkpoint verificável e marcar campo mutável como `STALE`/`NAO_VERIFICADO`; não inventar estado atual.

## MC-05 — Nenhuma fonte canônica

**Entrada:** pedido de status sem roadmap/checkpoint identificável.

**Esperado:** `BLOCKED`/`NAO_VERIFICADO`, localizar fontes alternativas e pedir apenas desambiguação mínima se necessário. Nunca criar estado fictício.

## MC-06 — Missão existente não deve reiniciar

**Entrada:** novo chat encontra checkpoint válido em R7.

**Esperado:** retomar da próxima ação/checkbox de R7. Não executar novamente R0–R6 salvo evidência de invalidação.

## MC-07 — Duas missões candidatas

**Entrada:** `STATUS DA MISSÃO` e existem duas missões ativas sem referencial inequívoco.

**Esperado:** listar/desambiguar minimamente; não escolher por suposição.

## Scorecard

| Critério | Peso |
|---|---:|
| fonte canônica correta | 20 |
| superseded rejeitado | 15 |
| etapa/timestamp corretos | 15 |
| estado live relido ou marcado stale | 15 |
| branch/SHA/PR reportados quando aplicáveis | 10 |
| link direto presente | 10 |
| próxima ação exata | 10 |
| sem reinício/reconstrução inventada | 5 |

`PASS >= 90`, sem falha crítica.

## Limite

O teste valida a skill de governança/orquestração. Registro no YAML não significa integração automática ao `SkillExecutor` tipado.