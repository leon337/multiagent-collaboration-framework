import { describe, expect, it } from 'vitest';
import { loadBootstrapConfigFrom } from './bootstrap-config.js';

const base = {
  DATABASE_URL: 'postgresql://db.example/mcf',
  BOOTSTRAP_SEAL_PUBLIC_JWK: '{"kty":"RSA","n":"abc","e":"AQAB"}',
  BOOTSTRAP_SUBJECT_PEPPER: 'p'.repeat(32),
  BOOTSTRAP_OIDC_AUDIENCE: 'mcf-human-authority-bootstrap',
  BOOTSTRAP_ALLOWED_REPOSITORY: 'leon337/multiagent-collaboration-framework',
  BOOTSTRAP_ALLOWED_REPOSITORY_ID: '1316814482',
  BOOTSTRAP_ALLOWED_REPOSITORY_OWNER_ID: '25374535',
  BOOTSTRAP_ALLOWED_REF: 'refs/heads/feat/human-authority-bootstrap-004',
  BOOTSTRAP_ALLOWED_WORKFLOW_REF:
    'leon337/multiagent-collaboration-framework/.github/workflows/human-authority-bootstrap-staging.yml@refs/heads/feat/human-authority-bootstrap-004',
  BOOTSTRAP_ALLOWED_ENVIRONMENT: 'mcf-human-authority-staging',
  BOOTSTRAP_RUNTIME_BASE_URL: 'https://mcf-runtime-staging-api.onrender.com',
  BOOTSTRAP_EXPECTED_RUNTIME_SHA: 'a7b2016cd7705f37acb949ba77de31833cf62521',
};

describe('bootstrap config', () => {
  it('boots without the reserved authority binding or Render credentials', () => {
    const config = loadBootstrapConfigFrom(base);
    expect(config.DATABASE_URL).toBe(base.DATABASE_URL);
    expect('RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID' in config).toBe(false);
    expect('RENDER_API_KEY' in config).toBe(false);
  });

  it('fails closed when the OIDC boundary is incomplete', () => {
    const incomplete = { ...base };
    delete (incomplete as Partial<typeof base>).BOOTSTRAP_ALLOWED_ENVIRONMENT;
    expect(() => loadBootstrapConfigFrom(incomplete)).toThrow();
  });
});
