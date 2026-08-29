import { describe, expect, it } from 'vitest';

import {
  StagingCatalogProbeDisabledError,
  StagingCatalogProbeQueryError,
  StagingCatalogProbeService,
} from './staging-catalog-probe.service.js';

type ProbeRow = Record<string, unknown>;

class QueryRecorder {
  readonly calls: Array<{ text: string; values: readonly unknown[] }> = [];

  constructor(
    private readonly row: ProbeRow | null,
    private readonly failure?: Error,
  ) {}

  async query(text: string, values: readonly unknown[] = []) {
    this.calls.push({ text, values });
    if (this.failure) throw this.failure;
    return { rows: this.row ? [this.row] : [], rowCount: this.row ? 1 : 0 } as never;
  }
}

const successfulRow = {
  postgres18OrNewer: true,
  directSessionIdentity: true,
  sessionRoleSuperuser: false,
  sessionRoleCreateRole: true,
  sessionRoleCreateDb: false,
  sessionRoleReplication: false,
  sessionRoleBypassRls: false,
  sessionRoleOwnsDatabase: true,
  sessionRoleOwnsAllPublicTables: true,
  authorityOwnerRoleExists: false,
  bootstrapIssuerRoleExists: false,
  runtimeRoleExists: false,
  issuerMemberOfAuthorityOwner: false,
  runtimeMemberOfAuthorityOwner: false,
  runtimeMemberOfBootstrapIssuer: false,
  bootstrapIssuerMemberOfRuntime: false,
  authoritySchemaExists: false,
};

describe('StagingCatalogProbeService', () => {
  it('fails closed before querying outside the exact staging runtime', async () => {
    const database = new QueryRecorder(successfulRow);
    const service = new StagingCatalogProbeService(database, 'mcf-runtime-production-api');

    await expect(service.run()).rejects.toBeInstanceOf(StagingCatalogProbeDisabledError);
    expect(database.calls).toEqual([]);
  });

  it('executes one fixed SELECT with no caller-controlled values', async () => {
    const database = new QueryRecorder(successfulRow);
    const service = new StagingCatalogProbeService(database, 'mcf-runtime-staging-api');

    await service.run();

    expect(database.calls).toHaveLength(1);
    expect(database.calls[0]?.values).toEqual([]);
    const sql = database.calls[0]?.text ?? '';
    expect(sql.trimStart().toLowerCase()).toMatch(/^select\b/u);
    expect(sql).not.toMatch(/\$[1-9][0-9]*/u);
    expect(sql).not.toContain(';');
    expect(sql.toLowerCase()).not.toMatch(
      /\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|copy|call|do|execute)\b/u,
    );
  });

  it('returns only the fixed sanitized boolean evidence shape', async () => {
    const database = new QueryRecorder({
      ...successfulRow,
      sessionUser: 'should-never-leak',
      databaseUrl: 'RAW_DATABASE_DETAIL_SHOULD_NOT_LEAK',
    });
    const service = new StagingCatalogProbeService(database, 'mcf-runtime-staging-api');

    const result = await service.run();
    expect(result).toEqual({
      schema: 'mcf-staging-catalog-probe/v1',
      status: 'ok',
      checks: successfulRow,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('should-never-leak');
    expect(serialized).not.toContain('RAW_DATABASE_DETAIL_SHOULD_NOT_LEAK');
    expect(Object.values(result.checks).every((value) => typeof value === 'boolean')).toBe(true);
  });

  it('replaces database errors with a fixed sanitized failure', async () => {
    const database = new QueryRecorder(
      null,
      new Error('RAW_DATABASE_DETAIL_SHOULD_NOT_LEAK permission denied for hidden_role'),
    );
    const service = new StagingCatalogProbeService(database, 'mcf-runtime-staging-api');

    let observed: unknown;
    try {
      await service.run();
    } catch (error) {
      observed = error;
    }

    expect(observed).toBeInstanceOf(StagingCatalogProbeQueryError);
    expect(String(observed)).toBe(
      'StagingCatalogProbeQueryError: staging catalog probe unavailable',
    );
    expect(String(observed)).not.toContain('RAW_DATABASE_DETAIL_SHOULD_NOT_LEAK');
    expect(String(observed)).not.toContain('hidden_role');
  });
});
