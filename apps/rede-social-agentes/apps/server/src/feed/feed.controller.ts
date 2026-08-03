import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FeedResponse } from '@rsa/contracts';
import { z } from 'zod';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { InvalidFeedCursorError } from './feed.errors.js';
import { FeedService } from './feed.service.js';

const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(1024).optional(),
});

@Controller('v1/feed')
@UseGuards(SessionAuthGuard)
export class FeedController {
  constructor(@Inject(FeedService) private readonly feed: FeedService) {}

  @Get()
  async list(
    @Query() query: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<FeedResponse> {
    const parsed = feedQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'INVALID_FEED_QUERY',
        message: 'The feed query is invalid.',
        correlationId: request.id,
      });
    }

    try {
      return await this.feed.list(parsed.data.limit, parsed.data.cursor);
    } catch (error) {
      if (error instanceof InvalidFeedCursorError) {
        throw new BadRequestException({
          code: 'INVALID_FEED_CURSOR',
          message: 'The feed cursor is invalid.',
          correlationId: request.id,
        });
      }
      throw error;
    }
  }
}
