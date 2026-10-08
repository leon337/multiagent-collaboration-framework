# MCF — WhatsApp Cloud API

## Objetivo

Integrar o WhatsApp Business Platform ao MCF como canal oficial de comunicação governada, mantendo ADB/scrcpy apenas como fallback operacional.

## Fluxo primário

LEANDRO → WhatsApp → Webhook Meta → MCF Runtime → Skill/Adapter governado → Meta Messages API → WhatsApp

## Fluxo de fallback

MCF → notebook → ADB → WhatsApp Business

O fallback só deve ser usado quando a Cloud API estiver indisponível e o escopo autorizado continuar válido.

## Boundary do runtime

- Skill: MCF-WHATSAPP-COMMUNICATE
- Provider: whatsapp
- Operation: send-text
- Resource: whatsapp-cloud-api
- Permission profile: SCOPED_WRITE
- Owner agent: Mestre

Entradas obrigatórias de envio:

- authorizedScope=true
- to em formato E.164, com sinal +
- body com 1 a 4096 caracteres

## Segurança de envio

Antes de qualquer escrita externa, o adapter persiste metadados de reconciliação no ledger do MCF.

Se o resultado da escrita ficar ambíguo por falha de rede ou resposta incompleta da Meta, o adapter retorna EXTERNAL_EFFECT_UNKNOWN e não faz retry cego. Isso evita mensagens duplicadas.

Nenhum token, App Secret ou corpo de mensagem é gravado no código.

## Webhook

Endpoint:

GET|POST /v1/mcf/channels/whatsapp/webhook

GET implementa o handshake de verificação da Meta usando o verify token configurado.

POST exige X-Hub-Signature-256 válida, calculada sobre o corpo bruto da requisição com o App Secret da Meta.

O log do webhook registra apenas metadados normalizados:

- quantidade de entries;
- quantidade de changes;
- quantidade de mensagens;
- quantidade de status;
- tipos de mensagem;
- phone_number_ids.

O conteúdo textual das mensagens não é escrito em log.

## Variáveis de ambiente

Todas desabilitadas por padrão:

- MCF_WHATSAPP_ENABLED=false
- MCF_WHATSAPP_API_VERSION=v26.0
- MCF_WHATSAPP_PHONE_NUMBER_ID=
- MCF_WHATSAPP_ACCESS_TOKEN=
- MCF_WHATSAPP_VERIFY_TOKEN=
- MCF_WHATSAPP_APP_SECRET=

Quando habilitado:

- todas as credenciais precisam estar presentes;
- credenciais de WhatsApp devem ser distintas entre si;
- credenciais de WhatsApp não podem reutilizar secrets internos do MCF.

## Configuração Meta

1. Usar o app Meta já associado ao Business Portfolio correto.
2. Manter o caso de uso Conectar no WhatsApp / Integrar com API.
3. Definir o callback HTTPS:
   https://<HOST_DO_RUNTIME>/v1/mcf/channels/whatsapp/webhook
4. Configurar na Meta o mesmo MCF_WHATSAPP_VERIFY_TOKEN usado no runtime.
5. Assinar o campo messages no webhook da WhatsApp Business Account.
6. Armazenar App Secret, access token e phone-number ID apenas no secret store do ambiente.
7. Validar o handshake do webhook.
8. Validar um evento inbound assinado.
9. Validar um envio outbound.
10. Confirmar entrega pelo webhook de status. Aceite da API não equivale a confirmação de entrega.

## Coexistência

O WhatsApp Business no telefone continua sendo o cliente humano. O onboarding/coexistência do mesmo número precisa ser concluído na Meta antes de habilitar MCF_WHATSAPP_ENABLED em produção.

## Evidências de validação

A suíte focada cobre:

- request oficial para Messages API;
- validação E.164;
- autenticação rejeitada pela Meta;
- efeito externo ambíguo sem retry;
- verify token;
- X-Hub-Signature-256;
- sumário privacy-safe do webhook;
- permission boundary;
- composição do Adapter Registry;
- configuração do runtime e separação de secrets.
