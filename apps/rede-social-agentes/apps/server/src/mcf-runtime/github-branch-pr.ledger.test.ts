import { describe, expect, it } from 'vitest';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const migrationPath = fileURLToPath(
  new URL(
    '../../../../packages/database/migrations/0019_mcf_external_action_idempotency.sql',
    import.meta.url,
  ),
);

describe('C1 external action idempotency schema', () => {
  it('persists idempotency_key and removes the one-attempt-per-phase legacy constraint', async () => {
    const migration = await readFile(migrationPath, 'utf8');
    expect(migration).toContain('add column if not exists "idempotency_key" text');
    expect(migration).toContain(
      'drop constraint if exists "mcf_external_action_attempts_mission_id_phase_id_key"',
    );
    expect(migration).toContain('mcf_external_action_attempts_idempotency_idx');
  });
});
