import { z } from 'zod';

import { InvalidFeedCursorError } from './feed.errors.js';

const cursorSchema = z.object({
  version: z.literal(1),
  publishedAt: z.string().datetime({ offset: true }),
  id: z.string().min(1).max(128),
});

export interface FeedCursor {
  publishedAt: Date;
  id: string;
}

export function encodeFeedCursor(cursor: FeedCursor): string {
  return Buffer.from(
    JSON.stringify({
      version: 1,
      publishedAt: cursor.publishedAt.toISOString(),
      id: cursor.id,
    }),
    'utf8',
  ).toString('base64url');
}

export function decodeFeedCursor(value: string): FeedCursor {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const parsed = cursorSchema.parse(JSON.parse(decoded));
    return { publishedAt: new Date(parsed.publishedAt), id: parsed.id };
  } catch {
    throw new InvalidFeedCursorError();
  }
}
