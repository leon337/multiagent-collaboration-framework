import type { BootstrapDatabaseService } from './bootstrap-database.service.js';

const STAGING_BOOTSTRAP_ISSUER_SERVICE = 'mcf-human-authority-bootstrap-staging';

export const STAGING_CATALOG_PROBE_SQL = `
select
  current_setting('server_version_num')::integer >= 180000 as "postgres18OrNewer",
  session_user = current_user as "directSessionIdentity",
  coalesce((select r.rolsuper from pg_catalog.pg_roles r where r.rolname = session_user), false) as "sessionRoleSuperuser",
  coalesce((select r.rolcreaterole from pg_catalog.pg_roles r where r.rolname = session_user), false) as "sessionRoleCreateRole",
  coalesce((select r.rolcreatedb from pg_catalog.pg_roles r where r.rolname = session_user), false) as "sessionRoleCreateDb",
  coalesce((select r.rolreplication from pg_catalog.pg_roles r where r.rolname = session_user), false) as "sessionRoleReplication",
  coalesce((select r.rolbypassrls from pg_catalog.pg_roles r where r.rolname = session_user), false) as "sessionRoleBypassRls",
  exists (
    select 1 from pg_catalog.pg_database d
    join pg_catalog.pg_roles r on r.oid = d.datdba
    where d.datname = current_database() and r.rolname = session_user
  ) as "sessionRoleOwnsDatabase",
  (
    exists (
      select 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
    ) and not exists (
      select 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      join pg_catalog.pg_roles r on r.oid = c.relowner
      where n.nspname = 'public' and c.relkind in ('r', 'p') and r.rolname <> session_user
    )
  ) as "sessionRoleOwnsAllPublicTables",
  exists (select 1 from pg_catalog.pg_roles r where r.rolname = 'mcf_authority_owner') as "authorityOwnerRoleExists",
  exists (select 1 from pg_catalog.pg_roles r where r.rolname = 'mcf_bootstrap_issuer_staging') as "bootstrapIssuerRoleExists",
  exists (select 1 from pg_catalog.pg_roles r where r.rolname = 'mcf_runtime_staging') as "runtimeRoleExists",
  exists (
    select 1 from pg_catalog.pg_auth_members m
    join pg_catalog.pg_roles granted on granted.oid = m.roleid
    join pg_catalog.pg_roles member on member.oid = m.member
    where member.rolname = 'mcf_bootstrap_issuer_staging' and granted.rolname = 'mcf_authority_owner'
  ) as "issuerMemberOfAuthorityOwner",
  exists (
    select 1 from pg_catalog.pg_auth_members m
    join pg_catalog.pg_roles granted on granted.oid = m.roleid
    join pg_catalog.pg_roles member on member.oid = m.member
    where member.rolname = 'mcf_runtime_staging' and granted.rolname = 'mcf_authority_owner'
  ) as "runtimeMemberOfAuthorityOwner",
  exists (
    select 1 from pg_catalog.pg_auth_members m
    join pg_catalog.pg_roles granted on granted.oid = m.roleid
    join pg_catalog.pg_roles member on member.oid = m.member
    where member.rolname = 'mcf_runtime_staging' and granted.rolname = 'mcf_bootstrap_issuer_staging'
  ) as "runtimeMemberOfBootstrapIssuer",
  exists (
    select 1 from pg_catalog.pg_auth_members m
    join pg_catalog.pg_roles granted on granted.oid = m.roleid
    join pg_catalog.pg_roles member on member.oid = m.member
    where member.rolname = 'mcf_bootstrap_issuer_staging' and granted.rolname = 'mcf_runtime_staging'
  ) as "bootstrapIssuerMemberOfRuntime",
  exists (
    select 1 from pg_catalog.pg_namespace n where n.nspname = 'mcf_authority'
  ) as "authoritySchemaExists"
`;

type ProbeRow = {
  postgres18OrNewer: boolean;
  directSessionIdentity: boolean;
  sessionRoleSuperuser: boolean;
  sessionRoleCreateRole: boolean;
  sessionRoleCreateDb: boolean;
  sessionRoleReplication: boolean;
  sessionRoleBypassRls: boolean;
  sessionRoleOwnsDatabase: boolean;
  sessionRoleOwnsAllPublicTables: boolean;
  authorityOwnerRoleExists: boolean;
  bootstrapIssuerRoleExists: boolean;
  runtimeRoleExists: boolean;
  issuerMemberOfAuthorityOwner: boolean;
  runtimeMemberOfAuthorityOwner: boolean;
  runtimeMemberOfBootstrapIssuer: boolean;
  bootstrapIssuerMemberOfRuntime: boolean;
  authoritySchemaExists: boolean;
};

const probeKeys = [
  'postgres18OrNewer',
  'directSessionIdentity',
  'sessionRoleSuperuser',
  'sessionRoleCreateRole',
  'sessionRoleCreateDb',
  'sessionRoleReplication',
  'sessionRoleBypassRls',
  'sessionRoleOwnsDatabase',
  'sessionRoleOwnsAllPublicTables',
  'authorityOwnerRoleExists',
  'bootstrapIssuerRoleExists',
  'runtimeRoleExists',
  'issuerMemberOfAuthorityOwner',
  'runtimeMemberOfAuthorityOwner',
  'runtimeMemberOfBootstrapIssuer',
  'bootstrapIssuerMemberOfRuntime',
  'authoritySchemaExists',
] as const satisfies ReadonlyArray<keyof ProbeRow>;

export class StagingCatalogProbeDisabledError extends Error {
  constructor() {
    super('staging catalog probe disabled');
    this.name = 'StagingCatalogProbeDisabledError';
  }
}

export class StagingCatalogProbeQueryError extends Error {
  constructor() {
    super('staging catalog probe unavailable');
    this.name = 'StagingCatalogProbeQueryError';
  }
}

type QueryOnlyDatabase = Pick<BootstrapDatabaseService, 'query'>;

export class StagingCatalogProbeService {
  constructor(
    private readonly database: QueryOnlyDatabase,
    private readonly serviceName = process.env.RENDER_SERVICE_NAME,
  ) {}

  async run() {
    if (this.serviceName !== STAGING_BOOTSTRAP_ISSUER_SERVICE) {
      throw new StagingCatalogProbeDisabledError();
    }

    let row: ProbeRow | undefined;
    try {
      const result = await this.database.query<ProbeRow>(STAGING_CATALOG_PROBE_SQL);
      row = result.rows[0];
    } catch {
      throw new StagingCatalogProbeQueryError();
    }

    if (!row || probeKeys.some((key) => typeof row?.[key] !== 'boolean')) {
      throw new StagingCatalogProbeQueryError();
    }

    const checks = Object.fromEntries(probeKeys.map((key) => [key, row[key]])) as ProbeRow;
    return {
      schema: 'mcf-staging-catalog-probe/v1' as const,
      status: 'ok' as const,
      checks,
    };
  }
}
