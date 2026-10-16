import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';
import { WhatsAppInboxRepository } from './whatsapp-inbox.repository.js';

const claimSchema = z.object({
  consumer: z.string().trim().min(3).max(120),
  limit: z.number().int().min(1).max(20).default(5),
});

const ackSchema = z.object({
  consumer: z.string().trim().min(3).max(120),
});

interface RequestWithId {
  id: string;
}

@Controller('v1/mcf/channels/whatsapp/inbox')
@UseGuards(McfRuntimeTokenGuard)
export class WhatsAppInboxController {
  constructor(@Inject(WhatsAppInboxRepository) private readonly inbox: WhatsAppInboxRepository) {}

  @Post('claim')
  @HttpCode(200)
  async claim(@Body() body: unknown, @Req() request: RequestWithId) {
    const input = parseBody(claimSchema, body, request.id);
    return {
      messages: await this.inbox.claimPending(input.consumer, input.limit),
    };
  }

  @Post(':messageId/ack')
  @HttpCode(200)
  async acknowledge(
    @Param('messageId') messageId: string,
    @Body() body: unknown,
    @Req() request: RequestWithId,
  ) {
    const input = parseBody(ackSchema, body, request.id);
    const acknowledged = await this.inbox.acknowledge(messageId, input.consumer);
    if (!acknowledged) {
      throw new ConflictException({
        code: 'WHATSAPP_INBOX_ACK_CONFLICT',
        message: 'The inbox message is not claimed by this consumer.',
        correlationId: request.id,
      });
    }
    return { acknowledged: true };
  }
}
