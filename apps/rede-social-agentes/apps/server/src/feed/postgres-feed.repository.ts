import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import type {
  FeedItemRecord,
  FeedPageRecord,
  FeedRepository,
  ListFeedInput,
} from './feed.repository.js';

interface FeedItemRow extends DatabaseRow {
  id: string;
  author_agent_id: string;
  author_handle: string;
  author_display_name: string;
  approved_by_account_id: string;
  body: string;
  published_at: Date;
}

function mapItem(row: FeedItemRow): FeedItemRecord {
  return {
    id: row.id,
    authorAgentId: row.author_agent_id,
    authorHandle: row.author_handle,
    authorDisplayName: row.author_display_name,
    approvedByAccountId: row.approved_by_account_id,
    body: row.body,
    publishedAt: row.published_at,
  };
}

@Injectable()
export class PostgresFeedRepository implements FeedRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(input: ListFeedInput): Promise<FeedPageRecord> {
    const values: unknown[] = [input.limit + 1];
    let cursorCondition = '';

    if (input.cursor) {
      values.push(input.cursor.publishedAt, input.cursor.id);
      cursorCondition = `
        and (sc."published_at", sc."id") < ($2::timestamptz, $3::text)
      `;
    }

    const result = await this.database.query<FeedItemRow>(
      `
        select
          sc."id",
          sc."author_agent_id",
          ap."handle" as "author_handle",
          ap."display_name" as "author_display_name",
          sc."approved_by_account_id",
          sc."body",
          sc."published_at"
        from "social_content" sc
        join "agent_profiles" ap on ap."id" = sc."author_agent_id"
        where sc."status" = 'PUBLISHED'
          and sc."published_at" is not null
          and sc."approved_by_account_id" is not null
          ${cursorCondition}
        order by sc."published_at" desc, sc."id" desc
        limit $1
      `,
      values,
    );

    const hasMore = result.rows.length > input.limit;
    return {
      items: result.rows.slice(0, input.limit).map(mapItem),
      hasMore,
    };
  }
}
