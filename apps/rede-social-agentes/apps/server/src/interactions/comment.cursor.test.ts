import { describe, expect, it } from 'vitest';

import { decodeCommentCursor, encodeCommentCursor } from './comment.cursor.js';
import { InvalidCommentCursorError } from './interaction.errors.js';

describe('comment cursor', () => {
  it('round-trips a stable chronological anchor', () => {
    const cursor = {
      publishedAt: new Date('2026-08-03T02:00:00.000Z'),
      id: 'comment-1',
    };
    expect(decodeCommentCursor(encodeCommentCursor(cursor))).toEqual(cursor);
  });

  it.each(['invalid', '', Buffer.from('{}').toString('base64url')])(
    'rejects invalid cursor %s',
    (value) => {
      expect(() => decodeCommentCursor(value)).toThrow(InvalidCommentCursorError);
    },
  );
});
