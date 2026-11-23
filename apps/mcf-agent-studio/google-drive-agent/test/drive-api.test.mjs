import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const configDir = await mkdtemp(path.join(tmpdir(), 'mcf-google-drive-agent-'));
process.env.MCF_GOOGLE_DRIVE_CONFIG_DIR = configDir;
await mkdir(configDir, { recursive: true, mode: 0o700 });
await writeFile(path.join(configDir, 'oauth-client.json'), JSON.stringify({
  installed: { client_id: 'test-client.apps.googleusercontent.com', client_secret: 'test-secret' }
}), { mode: 0o600 });
const { saveTokens, invoke, isAllowedOperation } = await import('../drive-api.mjs');
const originalFetch = globalThis.fetch;
let account = 'drive-agent-test@example.com';
let mode = 'default';
let lastUpload = null;
await saveTokens({ refresh_token: 'refresh-token-test', access_token: 'access-token-test', scope: 'openid email https://www.googleapis.com/auth/drive.file', expires_at: Date.now() + 3600000 });

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  if (url.hostname === 'openidconnect.googleapis.com')
    return Response.json({ email: account, email_verified: true });
  if (url.hostname !== 'www.googleapis.com') throw Error('unexpected host');
  if (url.pathname.endsWith('/files') && init.method === 'POST') {
    if (url.pathname.startsWith('/upload/')) {
      lastUpload = { headers: init.headers, body: Buffer.from(init.body) };
      return Response.json({
        id: 'created-file-0001', name: 'README.md', mimeType: 'text/plain',
        webViewLink: 'https://drive.google.com/file/d/created-file-0001/view'
      });
    }
    return Response.json({
      id: 'created-folder-0001', name: 'Project', mimeType: 'application/vnd.google-apps.folder'
    });
  }
  if (url.pathname.endsWith('/files') && init.method !== 'POST') {
    if (mode === 'duplicate') return Response.json({ files: [{ id: 'existing-file-0001', name: 'README.md', mimeType: 'text/plain' }] });
    return Response.json({ files: [] });
  }
  if (url.pathname.endsWith('/created-file-0001') && url.searchParams.get('alt') === 'media')
    return new Response('hello from Drive', { status: 200, headers: { 'content-type': 'text/plain' } });
  if (url.pathname.endsWith('/created-file-0001'))
    return Response.json({ id: 'created-file-0001', name: 'README.md', mimeType: 'text/plain' });
  throw Error('unexpected request: ' + url.pathname + ' ' + init.method);
};
after(async () => {
  globalThis.fetch = originalFetch;
  delete process.env.MCF_GOOGLE_DRIVE_CONFIG_DIR;
  await rm(configDir, { recursive: true, force: true });
});

test('encrypted token store is private and does not expose refresh token', async () => {
  const raw = await readFile(path.join(configDir, 'tokens.enc'));
  assert.equal(raw.includes('refresh-token-test'), false);
  assert.equal((await stat(path.join(configDir, 'tokens.enc'))).mode & 0o077, 0);
  assert.equal((await stat(path.join(configDir, 'key'))).mode & 0o077, 0);
});

test('status confirms expected Google identity and least-privilege scope', async () => {
  const result = await invoke('google_drive.status', {}, 'drive-agent-test@example.com');
  assert.equal(result.result.connected, true);
  assert.equal(result.result.account, 'drive-agent-test@example.com');
  assert.equal(result.result.scope, 'drive.file');
});

test('search returns only app-accessible Drive metadata', async () => {
  const result = await invoke('google_drive.search', { query: 'Project', limit: 5 }, 'drive-agent-test@example.com');
  assert.deepEqual(result.result.files, []);
  assert.equal(result.result.accessScope, 'drive.file');
});

test('folder creation is idempotent and uses the root when no parent is supplied', async () => {
  const result = await invoke('google_drive.create_folder', { name: 'Project' }, 'drive-agent-test@example.com');
  assert.equal(result.result.created, true);
  assert.equal(result.result.file.id, 'created-folder-0001');
});

test('text file creation uses multipart upload and never overwrites an existing file', async () => {
  const result = await invoke('google_drive.create_text_file', {
    name: 'README.md', content: '# Project\n'
  }, 'drive-agent-test@example.com');
  assert.equal(result.result.created, true);
  assert.match(String(lastUpload.headers['content-type']), /multipart\/related/);
  assert.match(lastUpload.body.toString('utf8'), /# Project/);
  mode = 'duplicate';
  await assert.rejects(
    invoke('google_drive.create_text_file', { name: 'README.md', content: 'new content' }, 'drive-agent-test@example.com'),
    error => error.code === 'FILE_ALREADY_EXISTS'
  );
  mode = 'default';
});

test('text file reader returns content only for supported text MIME types', async () => {
  const result = await invoke('google_drive.read_text_file', { fileId: 'created-file-0001' }, 'drive-agent-test@example.com');
  assert.equal(result.result.content, 'hello from Drive');
  assert.equal(result.result.file.id, 'created-file-0001');
});

test('account mismatch blocks Drive writes', async () => {
  account = 'wrong-account@gmail.com';
  await assert.rejects(
    invoke('google_drive.create_folder', { name: 'Blocked' }, 'drive-agent-test@example.com'),
    error => error.code === 'GOOGLE_ACCOUNT_MISMATCH'
  );
  account = 'drive-agent-test@example.com';
});

test('unknown and destructive operations are denied', async () => {
  assert.equal(isAllowedOperation('google_drive.create_folder'), true);
  assert.equal(isAllowedOperation('google_drive.delete_file'), false);
  await assert.rejects(invoke('google_drive.delete_file', { fileId: 'x' }), error => error.code === 'OPERATION_NOT_ALLOWED');
});

test('invalid names and oversized text are rejected before API writes', async () => {
  await assert.rejects(
    invoke('google_drive.create_folder', { name: '../outside' }, 'drive-agent-test@example.com'),
    error => error.code === 'INVALID_NAME'
  );
  await assert.rejects(
    invoke('google_drive.create_text_file', { name: 'large.txt', content: 'x'.repeat(200001) }, 'drive-agent-test@example.com'),
    error => error.code === 'INVALID_OR_TOO_LARGE_CONTENT'
  );
});