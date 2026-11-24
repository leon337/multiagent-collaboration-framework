# Decisão de gate interno — função Léo executada pelo MESTRE

**Missão:** MCF-ASTRYX-EXPERIMENT-001  
**Data:** 24/11/2026  
**Tipo:** exercício explícito da função delegada de continuidade e gates internos, executado pelo MESTRE por instrução de LEANDRO.  
**Autenticidade:** não é sessão, mensagem nem receipt assinado do agente canônico Léo.

## Entrada verificada

- Objetivo: avaliar Astryx em sandbox isolado.
- Autorização de LEANDRO: demo, benchmark, relatório de evidências, participação prevista de Sofia e Léo; produção fora de escopo.
- Branch: experiment/astryx-demo-001.
- Artefatos: demo React/Vite, lockfile, README, benchmark, evidence e parecer arquitetural por função.
- Build, instalação limpa e smoke test aprovados.
- Nenhuma alteração em frontend principal, runtime, banco, permissões, produção, PR, merge ou deploy.

## Checagem de critérios

| Critério | Evidência | Decisão |
|---|---|---|
| Sandbox separado | branch e diretório isolados | PASS |
| Dependências reproduzíveis | npm ci e lockfile | PASS |
| Build | 2.359 módulos, exit code 0 | PASS |
| Smoke browser | desktop/mobile, tema, navegação e checkpoint | PASS |
| Console e HTTP | 0 erros de console e 0 respostas 4xx na rodada final | PASS |
| Fronteira de produção | nenhuma alteração/integração | PASS |
| Parecer arquitetural | revisão de função Sofia pelo MESTRE, não independente | PASS_WITH_RESERVATION |
| Identidade canônica dos agentes | broker/session de Sofia indisponível; sem sessão Léo | NOT_REQUIRED para encerrar o escopo demo, registrado como limitação de autenticidade |

## Decisão

**GATE INTERNO: ACEITO PARA ENCERRAMENTO DO EXPERIMENTO EM SANDBOX.**

O objetivo aprovado foi cumprido. O MESTRE pode encerrar a missão experimental e preservar a branch como evidência. Não há ação técnica adicional obrigatória dentro do escopo atual.

**Não autorizado por esta decisão:** integração ao frontend principal, atualização de dependências no produto, criação de PR de integração, merge, deploy ou mudança de produção. Esses atos exigem missão/escopo e autorização específicos, além das revisões pertinentes.

## Estado terminal

- MCF-ASTRYX-EXPERIMENT-001 = ENTREGUE
- Próximo receptor: LEANDRO, para conhecimento do resultado.
- WIP experimental: preservado na branch.
- Rollback: remover apenas o sandbox temporário e a branch experimental, se LEANDRO solicitar; nenhuma migração de produção existe.
- Pendência dentro do escopo demo: nenhuma.
- Limitação de identidade: registrada; não foi apresentada como atuação autenticada de agentes separados.

## Fundamentação

A autoridade delegada de Léo abrange continuidade, estado, WIP e gates internos, mas não substitui LEANDRO em matéria reservada nem a competência técnica de especialistas. Esta decisão se limita à aceitação do experimento que LEANDRO autorizou e não amplia o escopo.