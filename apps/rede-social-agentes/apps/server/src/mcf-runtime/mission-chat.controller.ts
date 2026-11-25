import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
  BadRequestException,
  type MessageEvent,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { concatMap, interval, map, startWith, take } from 'rxjs';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { MissionChatService } from './mission-chat.service.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';

const roomSchema = z.union([z.literal('geral'), z.string().uuid()]);
const messageKind = z.enum(['MESSAGE', 'TASK', 'RESULT', 'BLOCKER', 'HANDOFF', 'APPROVAL_REQUEST']);
const humanMessage = z.object({
  kind: messageKind.default('MESSAGE'),
  content: z.string().trim().min(1).max(4_000),
});
const runtimeMessage = humanMessage.extend({
  agentId: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/u),
  agentLabel: z.string().trim().min(2).max(100),
  idempotencyKey: z.string().uuid(),
});

function roomId(raw: string): string {
  const result = roomSchema.safeParse(raw);
  if (!result.success) {
    throw new BadRequestException({ code: 'MCF_CHAT_ROOM_INVALID' });
  }
  return result.data;
}

function cursor(raw: string | undefined): string {
  const value = raw ?? '0';
  if (!/^(0|[1-9][0-9]{0,17})$/u.test(value)) {
    throw new BadRequestException({ code: 'MCF_CHAT_CURSOR_INVALID' });
  }
  return value;
}

@Controller('v1/mcf/mission-chat')
@UseGuards(SessionAuthGuard)
export class MissionChatController {
  constructor(@Inject(MissionChatService) private readonly chat: MissionChatService) {}

  @Get('rooms')
  rooms(@Req() request: AuthenticatedHumanRequest) {
    this.chat.assertHumanAuthority(request.authenticatedHuman.accountId);
    return this.chat.rooms();
  }

  @Get('rooms/:roomId/messages')
  async messages(
    @Param('roomId') rawRoom: string,
    @Query('after') rawAfter: string | undefined,
    @Req() request: AuthenticatedHumanRequest,
  ) {
    this.chat.assertHumanAuthority(request.authenticatedHuman.accountId);
    return { messages: await this.chat.messages(roomId(rawRoom), cursor(rawAfter)) };
  }

  @Post('rooms/:roomId/messages')
  @HttpCode(201)
  async send(
    @Param('roomId') rawRoom: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ) {
    this.chat.assertHumanAuthority(request.authenticatedHuman.accountId);
    const input = parseBody<z.infer<typeof humanMessage>>(humanMessage, body, request.id);
    return this.chat.send(
      roomId(rawRoom),
      {
        kind: 'HUMAN',
        id: request.authenticatedHuman.accountId,
        label: request.authenticatedHuman.displayName,
      },
      input.kind,
      input.content,
    );
  }

  /**
   * SSE is an authorized read-only view. It polls the database to work across
   * multiple server instances; it is never evidence of agent delivery or ACK.
   */
  @Sse('rooms/:roomId/stream')
  stream(
    @Param('roomId') rawRoom: string,
    @Query('after') rawAfter: string | undefined,
    @Req() request: AuthenticatedHumanRequest,
  ): Observable<MessageEvent> {
    this.chat.assertHumanAuthority(request.authenticatedHuman.accountId);
    const room = roomId(rawRoom);
    let after = cursor(rawAfter);
    return interval(2_000).pipe(
      startWith(0),
      take(150),
      concatMap(() => this.chat.messages(room, after)),
      map((messages): MessageEvent => {
        if (messages.length) after = messages[messages.length - 1]!.sequence;
        return { type: 'messages', data: { messages } };
      }),
    );
  }
}

/**
 * This endpoint is only an ingress for a trusted runtime caller. An agent
 * name supplied by that caller is still REPORTED, not identity-verified.
 * Posting here never dispatches a skill, authorizes a gate or records ACK.
 */
@Controller('v1/mcf/mission-chat/runtime')
@UseGuards(McfRuntimeTokenGuard)
export class MissionChatRuntimeController {
  constructor(@Inject(MissionChatService) private readonly chat: MissionChatService) {}

  @Post('rooms/:roomId/messages')
  @HttpCode(201)
  async send(
    @Param('roomId') rawRoom: string,
    @Body() body: unknown,
    @Req() request: { id: string },
  ) {
    const input = parseBody<z.infer<typeof runtimeMessage>>(runtimeMessage, body, request.id);
    return this.chat.send(
      roomId(rawRoom),
      { kind: 'AGENT_REPORTED', id: input.agentId, label: input.agentLabel },
      input.kind,
      input.content,
      input.idempotencyKey,
    );
  }
}
