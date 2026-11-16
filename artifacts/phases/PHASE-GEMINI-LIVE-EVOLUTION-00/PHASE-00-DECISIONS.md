# PHASE-00 — Decisões e pendências de autoridade

## 2026-11-16 — MESTRE (decisões de condução comprovadas)
1. Executar F0 sobre aplicação real e preservar os serviços existentes.
2. Usar dispositivo virtual/mídia sintética no smoke, evitando captura e publicação acidental de voz, vídeo ou tela pessoais.
3. Não tratar HTTP 200 do catálogo como capacidade completa nem apresentação “ilimitado” como quota/custo garantidos.
4. Instalar telemetria apenas em memória com whitelist de campos, sem coleta externa.
5. Criar Git local da aplicação com .private, logs e F0 ignorados; não publicar credenciais.
6. Criar sincronizador de PR/CI com comentário opt-in, modo dry-run padrão e nenhuma capacidade de marcar checkboxes.
7. Não abrir rede pública nem trocar o boundary do runtime MCF em F0.
8. Registrar gaps e bloquear promoção sem review/gate aplicáveis.

## Decisões explicitamente não obtidas
- Emily — auditoria independente: PENDING_REAL_EXECUTION; não há parecer emitido.
- LÉO — gate operacional F0: PENDING_REAL_EXECUTION; não há decisão emitida.
- LEANDRO — ação adicional para divulgar servidor, credencial, custo ou operação externa: NÃO SOLICITADA nesta fase.

## Riscos residuais para encaminhamento
Alta: chave persistente texto em claro; ausência de autenticação própria (backend loopback); token sem restrição específica por modelo; a chave que apareceu na conversa anterior deve ser rotacionada.
F1: AudioWorklet e benchmark com dispositivos reais. F2: consentimento/retention. F3: HDF, idempotência e receipt.

## Gate proposto (não é decisão do LÉO)
Recomendação MESTRE: APROVAR_COM_RESSALVAS somente o trabalho documental/diagnóstico de F0; reter a conclusão formal da fase até auditoria independente e gate, sem merge nem deploy.
