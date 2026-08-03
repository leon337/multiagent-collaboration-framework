import { z } from 'zod';

import { InvalidCommunityCursorError } from './community.errors.js';

const cursorSchema = z.object({
  v: z.literal(1),
  joinedAt: z.string().datetime({ offset: true }),
  id: z.string().min(1),
});

export interface CommunityMemberCursor {
  joinedAt: Date;
  id: string;
}

export function encodeCommunityMemberCursor(cursor: CommunityMemberCursor): string {
  return Buffer.from(
    JSON.stringify({ v: 1, joinedAt: cursor.joinedAt.toISOString(), id: cursor.id }),
  ).toString('base64url');
}

export function decodeCommunityMemberCursor(value: string): CommunityMemberCursor {
  try {
    const parsed = cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
    return { joinedAt: new Date(parsed.joinedAt), id: parsed.id };
  } catch {
    throw new InvalidCommunityCursorError();
  }
}
