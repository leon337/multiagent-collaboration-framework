# Fase de autoridade canônica do Pet

O fluxo foi dividido deliberadamente em três provas diferentes:

1. Fonte de observação: token de leitura distinto do dispatch.
2. Fonte do projeto: PIP + recibo de alinhamento verificados localmente
   e subsequentemente pelo MissionRuntime remoto em sessão humana real.
3. Fonte de autorização operacional: PermissionEngine e LÉO/HDF,
   que ainda NÃO possuem emissor/verificador conectado ao Pet.

O sistema não afirma missão criada, token configurado ou gate aprovado
sem evidência observável. Não houve merge nem deploy central nessa fase.

Os rascunhos exportados antes desta evolução não são reescritos. Um novo
rascunho de proposta já revisada pode conter contexto local verificado,
mas requer novo preflight no runtime remoto. Sem token específico no host
o estado de missões continua AUTH_NOT_CONFIGURED.
