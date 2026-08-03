import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(appRoot, '../..');

async function read(path) {
  return readFile(path, 'utf8');
}

test('Render blueprint provisions a free API and static web without secrets in Git', async () => {
  const blueprint = await read(resolve(repositoryRoot, 'render.yaml'));

  assert.match(blueprint, /name: rsa-api-free\s+runtime: docker/u);
  assert.match(blueprint, /plan: free/u);
  assert.match(blueprint, /region: virginia/u);
  assert.match(blueprint, /healthCheckPath: \/health\/ready/u);
  assert.match(blueprint, /autoDeployTrigger: checksPass/u);
  assert.match(
    blueprint,
    /dockerCommand: sh -c 'node packages\/database\/scripts\/migrate\.mjs && exec node apps\/server\/dist\/main\.js'/u,
  );
  assert.doesNotMatch(blueprint, /preDeployCommand:/u);
  assert.match(blueprint, /key: RATE_LIMIT_KEY_SECRET\s+generateValue: true/u);
  assert.match(blueprint, /key: DATABASE_URL\s+sync: false/u);
  assert.match(blueprint, /key: MIGRATION_DATABASE_URL\s+sync: false/u);
  assert.match(blueprint, /key: ALLOWED_ORIGINS\s+sync: false/u);

  assert.match(blueprint, /name: rsa-web-free\s+runtime: static/u);
  assert.match(blueprint, /staticPublishPath: \.\/apps\/rede-social-agentes\/apps\/web\/dist/u);
  assert.match(blueprint, /key: VITE_API_BASE_URL\s+sync: false/u);
  assert.match(blueprint, /type: rewrite\s+source: \/\*\s+destination: \/index\.html/u);

  assert.doesNotMatch(blueprint, /npx wrangler deploy/u);
  assert.doesNotMatch(blueprint, /plan: (starter|standard|pro)/u);
  assert.doesNotMatch(blueprint, /postgresql:\/\//u);
  assert.doesNotMatch(blueprint, /\.onrender\.com/u);
});

test('migration runner supports a separate direct database connection', async () => {
  const migrator = await read(resolve(appRoot, 'packages/database/scripts/migrate.mjs'));

  assert.match(migrator, /process\.env\.MIGRATION_DATABASE_URL \?\? process\.env\.DATABASE_URL/u);
  assert.match(migrator, /pg_advisory_lock/u);
});

test('Cloudflare Pages assets remain available as an optional fallback', async () => {
  const publicRoot = resolve(appRoot, 'apps/web/public');
  const headers = await read(resolve(publicRoot, '_headers'));
  const redirects = await read(resolve(publicRoot, '_redirects'));

  assert.match(headers, /Content-Security-Policy:/u);
  assert.match(headers, /connect-src 'self' https:\/\/\*\.onrender\.com/u);
  assert.match(headers, /X-Frame-Options: DENY/u);
  assert.match(headers, /X-Robots-Tag: noindex, nofollow/u);
  assert.equal(redirects.trim(), '/* /index.html 200');
});
