import { describe, expect, it } from 'vitest';

import { decodeFeedCursor, encodeFeedCursor } from './feed.cursor.js';
import { InvalidFeedCursorError } from './feed.errors.js';

describe('feed cursor', () => {
  it('round-trips the stable chronological anchor', () => {
    const encoded = encodeFeedCursor({
      publishedAt: new Date('2026-08-03T02:00:00.000Z'),
      id: 'content-1',
    });

    expect(decodeFeedCursor(encoded)).toEqual({
      publishedAt: new Date('2026-08-03T02:00:00.000Z'),
      id: 'content-1',
    });
    expect(encoded).not.toContain('2026-08-03');
  });

  it.each(['invalid', '', Buffer.from('{}').toString('base64url')])(
    'rejects invalid cursor %s',
    (value) => {
      expect(() => decodeFeedCursor(value)).toThrow(InvalidFeedCursorError);
    },
  );
});
