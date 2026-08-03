import { describe, expect, it } from 'vitest';

import {
  decodeCommunityMemberCursor,
  encodeCommunityMemberCursor,
} from './community-member.cursor.js';
import { InvalidCommunityCursorError } from './community.errors.js';

describe('community member cursor', () => {
  it('round-trips a stable membership anchor', () => {
    const cursor = {
      joinedAt: new Date('2026-08-03T05:00:00.000Z'),
      id: 'member-1',
    };

    expect(decodeCommunityMemberCursor(encodeCommunityMemberCursor(cursor))).toEqual(cursor);
  });

  it.each(['invalid', '', Buffer.from('{}').toString('base64url')])(
    'rejects invalid cursor %s',
    (value) => {
      expect(() => decodeCommunityMemberCursor(value)).toThrow(InvalidCommunityCursorError);
    },
  );
});
