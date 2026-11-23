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
let lastDocsBatch = null;
await saveTokens({ refresh_token: 'refresh-token-test', access_token: 'access-token-test', scope: 'openid email https://www.googleapis.com/auth/drive', expires_at: Date.now() + 3600000 });

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  if (url.hostname === 'openidconnect.googleapis.com')
    return Response.json({ email: account, email_verified: true });
  if (url.hostname === 'docs.googleapis.com') {
    if (url.pathname.endsWith('/documents/google-doc-0001'))
      return Response.json({ documentId: 'google-doc-0001', body: { content: [{ endIndex: 25 }] } });
    if (url.pathname.endsWith('/documents/google-doc-0001:batchUpdate')) {
      lastDocsBatch = JSON.parse(init.body);
      return Response.json({ replies: [{}] });
    }
    throw Error('unexpected Docs API request: ' + url.pathname);
  }
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
  if (url.pathname.endsWith('/google-doc-0001/export'))
    return new Response('Exported Google Docs content', { status: 200, headers: { 'content-type': 'text/plain' } });
  if (url.pathname.endsWith('/google-doc-0001') && init.method === 'PATCH')
    return Response.json({ id: 'google-doc-0001', name: 'RENAMED.doc', mimeType: 'application/vnd.google-apps.document' });
  if (url.pathname.endsWith('/google-doc-0001'))
    return Response.json({ id: 'google-doc-0001', name: 'Spec.doc', mimeType: 'application/vnd.google-apps.document' });
  if (url.pathname.endsWith('/created-file-0001') && init.method === 'PATCH')
    return Response.json({ id: 'created-file-0001', name: 'UPDATED.md', mimeType: 'text/plain' });
  if (url.pathname.endsWith('/created-file-0001') && init.method === 'DELETE')
    return new Response(null, { status: 204 });
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

test('status confirms expected Google identity and full Drive scope', async () => {
  const result = await invoke('google_drive.status', {}, 'drive-agent-test@example.com');
  assert.equal(result.result.connected, true);
  assert.equal(result.result.account, 'drive-agent-test@example.com');
  assert.equal(result.result.scope, 'drive');
});

test('search returns only app-accessible Drive metadata', async () => {
  const result = await invoke('google_drive.search', { query: 'Project', limit: 5 }, 'drive-agent-test@example.com');
  assert.deepEqual(result.result.files, []);
  assert.equal(result.result.accessScope, 'drive');
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

test('text file reader supports UTF-8 files and Google Docs export', async () => {
  const result = await invoke('google_drive.read_text_file', { fileId: 'created-file-0001' }, 'drive-agent-test@example.com');
  assert.equal(result.result.content, 'hello from Drive');
  assert.equal(result.result.file.id, 'created-file-0001');
});

test('Google Docs reader exports the document as text/plain', async () => {
  const result = await invoke('google_drive.read_text_file', { fileId: 'google-doc-0001' }, 'drive-agent-test@example.com');
  assert.equal(result.result.file.mimeType, 'application/vnd.google-apps.document');
  assert.equal(result.result.exported, true);
  assert.equal(result.result.exportMime, 'text/plain');
  assert.equal(result.result.content, 'Exported Google Docs content');
});

test('Google Docs content update uses Docs API batchUpdate', async () => {
  const result = await invoke('google_drive.update_text_file', {
    fileId: 'google-doc-0001', content: 'New document body'
  }, 'drive-agent-test@example.com');
  assert.equal(result.result.documentUpdated, true);
  assert.deepEqual(lastDocsBatch.requests[0], {
    deleteContentRange: { range: { startIndex: 1, endIndex: 24 } }
  });
  assert.deepEqual(lastDocsBatch.requests[1], {
    insertText: { location: { index: 1 }, text: 'New document body' }
  });
});

test('Google Docs rename updates Drive metadata without replacing document content', async () => {
  const result = await invoke('google_drive.update_text_file', {
    fileId: 'google-doc-0001', name: 'RENAMED.doc'
  }, 'drive-agent-test@example.com');
  assert.equal(result.result.renamed, true);
  assert.equal(result.result.file.name, 'RENAMED.doc');
});

test('text file update supports metadata and content changes', async () => {
  const result = await invoke('google_drive.update_text_file', {
    fileId: 'created-file-0001', name: 'UPDATED.md', content: 'updated content'
  }, 'drive-agent-test@example.com');
  assert.equal(result.result.updated, true);
  assert.equal(result.result.file.name, 'UPDATED.md');
});

test('file deletion validates the target and confirms deletion', async () => {
  const result = await invoke('google_drive.delete_file', {
    fileId: 'created-file-0001'
  }, 'drive-agent-test@example.com');
  assert.equal(result.result.deleted, true);
  assert.equal(result.result.fileId, 'created-file-0001');
  await assert.rejects(
    invoke('google_drive.delete_file', { fileId: 'bad' }, 'drive-agent-test@example.com'),
    error => error.code === 'INVALID_FILE_ID'
  );
});

test('account mismatch blocks Drive writes', async () => {
  account = 'wrong-account@gmail.com';
  await assert.rejects(
    invoke('google_drive.create_folder', { name: 'Blocked' }, 'drive-agent-test@example.com'),
    error => error.code === 'GOOGLE_ACCOUNT_MISMATCH'
  );
  account = 'drive-agent-test@example.com';
});

test('unknown operations are denied while explicit delete is registered', async () => {
  assert.equal(isAllowedOperation('google_drive.create_folder'), true);
  assert.equal(isAllowedOperation('google_drive.delete_file'), true);
  assert.equal(isAllowedOperation('google_drive.unknown'), false);
  await assert.rejects(invoke('google_drive.unknown', {}), error => error.code === 'OPERATION_NOT_ALLOWED');
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
