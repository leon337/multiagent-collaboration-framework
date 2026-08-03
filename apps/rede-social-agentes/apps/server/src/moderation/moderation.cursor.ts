import type { ModerationPriority } from '@rsa/contracts';
import { z } from 'zod';

import { InvalidModerationCursorError } from './moderation.errors.js';

const cursorSchema = z.object({
  v: z.literal(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  openedAt: z.string().datetime({ offset: true }),
  id: z.string().min(1),
});

export interface ModerationCursor {
  priority: ModerationPriority;
  openedAt: Date;
  id: string;
}

export function encodeModerationCursor(cursor: ModerationCursor): string {
  return Buffer.from(
    JSON.stringify({
      v: 1,
      priority: cursor.priority,
      openedAt: cursor.openedAt.toISOString(),
      id: cursor.id,
    }),
  ).toString('base64url');
}

export function decodeModerationCursor(value: string): ModerationCursor {
  try {
    const parsed = cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
    return {
      priority: parsed.priority,
      openedAt: new Date(parsed.openedAt),
      id: parsed.id,
    };
  } catch {
    throw new InvalidModerationCursorError();
  }
}
