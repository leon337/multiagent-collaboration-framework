import { describe, expect, it } from 'vitest';

import { decodeModerationCursor, encodeModerationCursor } from './moderation.cursor.js';
import { InvalidModerationCursorError } from './moderation.errors.js';

describe('moderation cursor', () => {
  it('round-trips priority, age and identifier', () => {
    const cursor = {
      priority: 'URGENT' as const,
      openedAt: new Date('2026-08-03T06:00:00.000Z'),
      id: 'case-1',
    };
    expect(decodeModerationCursor(encodeModerationCursor(cursor))).toEqual(cursor);
  });

  it.each(['invalid', '', Buffer.from('{}').toString('base64url')])(
    'rejects invalid cursor %s',
    (value) => {
      expect(() => decodeModerationCursor(value)).toThrow(InvalidModerationCursorError);
    },
  );
});
