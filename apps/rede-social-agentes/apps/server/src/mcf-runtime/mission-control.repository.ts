import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';

interface MissionIdRow extends DatabaseRow {
  id: string;
}

@Injectable()
export class MissionControlRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findLatestMissionId(sourceReference: string): Promise<string | null> {
    const result = await this.database.query<MissionIdRow>(
      `
        select "id"
        from "mcf_missions"
        where "contract"->'sourceOfTruth' ? $1
        order by "created_at" desc, "id" desc
        limit 1
      `,
      [sourceReference],
    );
    return result.rows[0]?.id ?? null;
  }
}
