# Decisões de segurança

Fonte de verdade: MissionRuntime, PermissionEngine, DEC-055/HDF e repositório MCF.

A. Identidade da leitura:
  - MCF_MISSION_CONTROL_READ_TOKEN opcional, exclusiva; rota sem token => 503.
  - Somente GET da missão mais recente do repositório oficial.
  - Bearer do dispatch não autentica a leitura e vice-versa.
  - Configuração rejeita segredo reutilizado entre fronteiras.

B. Contexto v1.1:
  - Não inferir metodologia ou PIP a partir de diálogo, prompt ou proposta.
  - PIP + recibo são obtidos em arquivos oficiais e validados pela mesma
    implementação de MissionV11ContextGuard que usa o MissionRuntime.
  - Cache local é 0600 e expira; adulteração invalida contexto.
  - Localmente verificado != admissão remota verificada.
  - Preflight remoto exige SessionAuthGuard e não faz INSERT no runtime.

C. PermissionEngine / LÉO / HDF:
  - Nenhum bearer de voz, checkbox ou rascunho constitui HUMAN_GATE.
  - Boolean authorizedScope enviado pelo cliente é INSUFICIENTE para
    permitir SCOPED_WRITE. Exigir prova atestada pelo runtime canônico,
    escopo, identidade da missão persistida e gate de LÉO.
  - Mantemos o executor Pet sem verificador conectado e sem rota de write.
  - Futuro emissor de recibos deve chamar PermissionEngine e HDF com
    estado de missão/gate obtido de fontes canônicas, jamais do payload.
  - Uma autorização para preview NÃO pode ser promovida a autorização de
    escrita sem recibo verificável e independente.

D. Render:
  - A ferramenta da conta não permitiu listar serviços sem que LEANDRO
    confirme o workspace. Não selecionar um workspace por inferência.
  - Sem acesso autorizado aos segredos de staging, nenhum token foi criado,
    copiado ou implantado e nenhuma rota remota foi testada ao vivo.
