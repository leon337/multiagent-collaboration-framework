import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { WhatsAppWebhookService } from './whatsapp-webhook.service.js';

interface RequestWithRawBody {
  rawBody?: Buffer;
  body?: unknown;
  id?: string;
}

@Controller('v1/mcf/channels/whatsapp/webhook')
export class WhatsAppWebhookController {
  constructor(private readonly webhook: WhatsAppWebhookService) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') token: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
  ): string {
    const accepted = this.webhook.verifyChallenge(mode, token, challenge);
    if (accepted === null) {
      throw new ForbiddenException('WhatsApp webhook verification failed');
    }
    return accepted;
  }

  @Post()
  @HttpCode(200)
  receive(
    @Req() request: RequestWithRawBody,
    @Headers('x-hub-signature-256') signature: string | undefined,
  ): { received: true } {
    if (!this.webhook.verifySignature(request.rawBody, signature)) {
      throw new ForbiddenException('WhatsApp webhook signature is invalid');
    }

    const summary = this.webhook.summarize(request.body);
    console.info(
      JSON.stringify({
        level: 'info',
        service: 'rede-social-agentes',
        component: 'whatsapp-webhook',
        event: 'whatsapp_webhook_received',
        correlationId: request.id ?? null,
        ...summary,
      }),
    );
    return { received: true };
  }
}
