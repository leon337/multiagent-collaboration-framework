import { z } from 'zod';

import { InvalidCommentCursorError } from './interaction.errors.js';

const cursorSchema = z.object({
  v: z.literal(1),
  publishedAt: z.string().datetime({ offset: true }),
  id: z.string().min(1),
});

export interface CommentCursor {
  publishedAt: Date;
  id: string;
}

export function encodeCommentCursor(cursor: CommentCursor): string {
  return Buffer.from(
    JSON.stringify({ v: 1, publishedAt: cursor.publishedAt.toISOString(), id: cursor.id }),
  ).toString('base64url');
}

export function decodeCommentCursor(value: string): CommentCursor {
  try {
    const parsed = cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
    return { publishedAt: new Date(parsed.publishedAt), id: parsed.id };
  } catch {
    throw new InvalidCommentCursorError();
  }
}
