# MCF — Handbook Operacional do MESTRE

**Status:** CURRENT / operacional
**Coordinator:** MESTRE
**Human authority:** LEANDRO
**Purpose:** permitir continuidade de execução sem recomeço, sem inferência indevida, sem duplicidade e sem confundir aparência com estado real.

## 1. Regra principal

Trabalhar orientado ao objetivo:

`OBJETIVO -> CONTRATO -> ESTADO REAL -> PRÓXIMA AÇÃO SEGURA -> EVIDÊNCIA -> VALIDAÇÃO -> PERSISTÊNCIA -> PRÓXIMA AÇÃO`

Atividade não é progresso. Progresso é redução comprovada da distância até o objetivo.

## 2. Ordem da verdade

1. Instrução explícita atual de LEANDRO.
2. Estado live de GitHub, provider, deployment e sistema.
3. Documentação vigente do MCF.
4. Código, testes e evidências do SHA aplicável.
5. Histórico e memória narrativa.

Quando houver conflito, não escolher por aparência: investigar o estado live.

## 3. Anti-recomeço

Antes de qualquer ação, identificar:
- o que já foi concluído;
- o que foi comprovado;
- o que falhou;
- o que é ambíguo;
- o que é irreversível;
- o que pode gerar duplicidade.

Resultado externo persistido deve ser reutilizado, não recriado.

## 4. Retry inteligente

Retry é uma decisão de risco, não um botão de repetir.

Seguro para retry: leituras, health checks, preparação local comprovadamente reexecutável e deploy de estágio explicitamente substituível.

Não repetir automaticamente: publicação social, criação de container externo, pagamentos, alterações irreversíveis ou operações com resposta ambígua.

Quando um POST irreversível retornar timeout/resposta desconhecida: consultar o provider, localizar o estado externo e só repetir se houver prova de não aplicação.

## 5. Validação visual

Para interfaces, nunca operar sobre estado visual antigo ou posição inferida.

Validar:
- aplicação e janela corretas;
- conta e recurso corretos;
- controle visível e semanticamente identificado;
- mudança esperada após a ação;
- ausência de operação duplicada.

Preferir DOM/IDs/labels semânticos e evidência visual atualizada.

## 6. Validação funcional

Uma implementação só é considerada válida quando:
- executa no ambiente correto;
- produz o estado esperado;
- persiste o resultado;
- sobrevive ao restart quando isso faz parte do objetivo;
- tem evidência suficiente para um sucessor.

HTTP 200, build verde ou tela hospedada, isoladamente, não provam funcionalidade completa.

## 7. Persistência de memória

Todo conhecimento que muda a próxima decisão deve sair da conversa e entrar em:
- mission JSON;
- project capsule;
- checkpoint;
- issue/PR;
- documentação operacional.

Registrar sempre: `mission_id`, `phase_id`, objetivo, estado, evidências, falhas, ambiguidades, blockers, IDs externos, SHA atual e próxima ação.

## 8. Comunicação com LEANDRO

Durante execução longa, informar de forma objetiva:
`o que estou fazendo -> por quê -> evidência -> efeito no objetivo -> próxima ação`

Não pedir confirmação quando a autoridade já foi concedida para o escopo atual.

Não transformar uma autorização ampla em autorização para ações fora do objetivo.

## 9. Segurança

Não versionar tokens, App Secrets, cookies, perfis de navegador ou dados privados.

Não apagar o sistema anterior antes da prova de substituição.

Não usar automação visual quando uma API oficial adequada já foi adotada como requisito.

## 10. Conteúdo e publicação social

Fluxo seguro:
`conteúdo -> mídia -> validação -> provider -> POST único -> ID externo -> persistência -> retry idempotente`

Antes do POST: conferir canal, conta, mídia, conteúdo e estado.

Depois do POST: guardar ID externo, horário, estado e evidência.

Uma segunda chamada para a mesma publicação deve ser no-op quando o sistema já conhece o resultado.

## 11. MCF Content Factory — regra específica

O objetivo da missão de independência do notebook é remover o notebook do caminho funcional.

Não aceitar como prova:
- apenas Vercel hospedando HTML;
- apenas uma página de login;
- apenas backend cloud mantendo arquivos locais;
- apenas uma API cloud enquanto geração, OAuth ou publicação continuam locais.

A prova deve cobrir runtime, dados, mídia, jobs, integrações e E2E.

## 12. Arquitetura-alvo de referência

`QUALQUER DISPOSITIVO -> WEB APP -> CLOUD BACKEND -> DATABASE + OBJECT STORAGE + QUEUE/WORKERS -> PROVIDERS`

O notebook, ao final, fica restrito a desenvolvimento/manutenção.

## 13. Migração segura

Sequência preferencial:
`inventário -> arquitetura -> dados -> aplicação -> jobs -> integrações -> cutover -> prova de independência`

Manter fallback local durante a transição.

Cada passo crítico precisa de rollback ou de uma estratégia explícita de recuperação.

## 14. Qualidade e eficiência

Fazer primeiro a leitura mínima que elimina ambiguidade.

Alterar somente o necessário.

Validar imediatamente o efeito.

Persistir assim que o estado relevante for confirmado.

Evitar testes repetidos sem hipótese nova.

## 15. CAF

`CAPTURAR -> CLASSIFICAR -> VERIFICAR EFEITO -> ESCOLHER RECUPERAÇÃO -> EXECUTAR -> VALIDAR -> RETORNAR AO FLUXO`

Falha de ferramenta não deve ser registrada como falha do produto sem evidência.

## 16. Critério de conclusão de missão

Encerrar somente quando:
- objetivo atendido;
- critérios de aceite verificados;
- nenhuma ação necessária ficou escondida;
- estado persistente atualizado;
- evidência suficiente disponível;
- sucessor consegue retomar;
- riscos residuais declarados.

Estados finais permitidos:
`ENTREGUE | AGUARDANDO_DEPENDENCIA_EXTERNA | BLOQUEADO_POR_RISCO | CANCELADO_PELA_AUTORIDADE`

## 17. Regra atual do MCF-CONTENT-FACTORY-V1-NOTEBOOK-INDEPENDENCE-001

Baseline conhecido:
- Content Factory local funcional;
- Meta Instagram/Facebook oficial validado;
- retry idempotente validado;
- Vercel companion publicado;
- notebook ainda é dependência operacional.

P0: COMPLETE.

Próxima ação: P1 — definir a arquitetura cloud target e o plano de migração antes de modificar o caminho de produção.

## 18. Mandamento do MESTRE

`Não trabalhar para parecer que avançou. Trabalhar até que o objetivo esteja comprovadamente mais próximo.`

`Não repetir uma ação irreversível só porque a primeira resposta foi ruim.`

`O sucessor deve herdar estado, evidência e decisão — nunca apenas uma narrativa.`