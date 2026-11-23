import { randomBytes, createCipheriv, createDecipheriv, randomUUID } from 'node:crypto';
import { mkdir, readFile as readDiskFile, writeFile, stat, rename, unlink, link, appendFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const CONFIG_DIR = process.env.MCF_GOOGLE_DRIVE_CONFIG_DIR || path.join(homedir(), '.config', 'mcf-google-drive-agent');
const CLIENT_FILE = path.join(CONFIG_DIR, 'oauth-client.json');
const TOKEN_FILE = path.join(CONFIG_DIR, 'tokens.enc');
const KEY_FILE = path.join(CONFIG_DIR, 'key');
const AUDIT_FILE = path.join(CONFIG_DIR, 'audit.jsonl');
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';
const SCOPE = 'https://www.googleapis.com/auth/drive';
const TIMEOUT_MS = 12000;
const MAX_TEXT_BYTES = 200000;

export class DriveError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
const validName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 120 && !value.includes('/') && !value.includes(String.fromCharCode(92)) && ![...value].some(ch => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127);
const validId = value => typeof value === 'string' && (value === 'root' || /^[A-Za-z0-9_-]{10,200}$/.test(value));
const safeLimit = value => {
  const n = Number(value ?? 10);
  if (!Number.isInteger(n) || n < 1 || n > 25) throw new DriveError('INVALID_LIMIT');
  return n;
};
const escapeQuery = value => value.split(String.fromCharCode(92)).join(String.fromCharCode(92).repeat(2)).split("'").join(String.fromCharCode(92) + "'");
const fields = 'id,name,mimeType,modifiedTime,webViewLink,parents';

async function ensureDir() { await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 }); }
async function secureRead(file) {
  const info = await stat(file).catch(e => e.code === 'ENOENT' ? null : Promise.reject(e));
  if (!info) return null;
  if (!info.isFile() || (info.mode & 0o077) !== 0) throw new DriveError('INSECURE_FILE_PERMISSIONS', 500);
  return readDiskFile(file);
}
async function storeKey() {
  await ensureDir();
  let value = await secureRead(KEY_FILE);
  if (value) {
    if (value.length !== 32) throw new DriveError('INVALID_STORE_KEY', 500);
    return value;
  }
  const temp = path.join(CONFIG_DIR, '.key-' + randomUUID() + '.tmp');
  value = randomBytes(32);
  try {
    await writeFile(temp, value, { flag: 'wx', mode: 0o600 });
    try { await link(temp, KEY_FILE); return value; }
    catch (e) { if (e.code !== 'EEXIST') throw e; }
    const existing = await secureRead(KEY_FILE);
    if (!existing || existing.length !== 32) throw new DriveError('INVALID_STORE_KEY', 500);
    return existing;
  } finally { await unlink(temp).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
}
async function loadClient() {
  const raw = await secureRead(CLIENT_FILE);
  if (!raw) throw new DriveError('OAUTH_CLIENT_NOT_CONFIGURED', 401);
  let data;
  try { data = JSON.parse(raw.toString('utf8')); } catch { throw new DriveError('OAUTH_CLIENT_INVALID', 500); }
  const client = data.installed || data.web || data;
  if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client?.client_id || ''))
    throw new DriveError('OAUTH_CLIENT_INVALID', 500);
  if (client.client_secret && typeof client.client_secret !== 'string')
    throw new DriveError('OAUTH_CLIENT_INVALID', 500);
  return { clientId: client.client_id, clientSecret: client.client_secret || '' };
}
export async function saveTokens(tokens) {
  if (!tokens || typeof tokens.refresh_token !== 'string' || !tokens.refresh_token)
    throw new DriveError('REFRESH_TOKEN_REQUIRED', 401);
  validateDriveScope(tokens);
  const key = await storeKey(), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()]);
  const blob = Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), encrypted]);
  const temp = path.join(CONFIG_DIR, '.tokens-' + randomUUID() + '.tmp');
  try {
    await writeFile(temp, blob, { flag: 'wx', mode: 0o600 });
    await rename(temp, TOKEN_FILE);
  } finally { await unlink(temp).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
}
async function loadTokens() {
  const blob = await secureRead(TOKEN_FILE);
  if (!blob) return null;
  if (blob.length < 30 || blob[0] !== 1) throw new DriveError('TOKEN_STORE_INVALID', 500);
  const key = await storeKey(), decipher = createDecipheriv('aes-256-gcm', key, blob.subarray(1, 13));
  decipher.setAuthTag(blob.subarray(13, 29));
  try { return JSON.parse(Buffer.concat([decipher.update(blob.subarray(29)), decipher.final()]).toString('utf8')); }
  catch { throw new DriveError('TOKEN_STORE_DECRYPT_FAILED', 500); }
}

function validateDriveScope(tokens) {
  const scopes = new Set(String(tokens?.scope || '').split(' ').filter(Boolean));
  if (!scopes.has(SCOPE)) throw new DriveError('GOOGLE_DRIVE_SCOPE_MISSING', 403);
  if (scopes.has('https://www.googleapis.com/auth/drive.readonly'))
    throw new DriveError('GOOGLE_DRIVE_SCOPE_INSUFFICIENT', 403);
}
async function accessToken() {
  const client = await loadClient();
  const tokens = await loadTokens();
  if (!tokens?.refresh_token) throw new DriveError('GOOGLE_DRIVE_OAUTH_REQUIRED', 401);
  validateDriveScope(tokens);
  if (tokens.access_token && Number(tokens.expires_at) > Date.now() + 90000) return tokens.access_token;
  const form = new URLSearchParams({
    grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: client.clientId
  });
  if (client.clientSecret) form.set('client_secret', client.clientSecret);
  let response;
  try {
    response = await fetch(TOKEN_URL, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form, redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch { throw new DriveError('GOOGLE_TOKEN_TRANSPORT_FAILED', 502); }
  if (!response.ok) throw new DriveError('GOOGLE_TOKEN_REFRESH_FAILED', 401);
  const refreshed = await response.json();
  if (!refreshed.access_token) throw new DriveError('GOOGLE_TOKEN_RESPONSE_INVALID', 502);
  const next = {
    ...tokens, ...refreshed, refresh_token: tokens.refresh_token,
    expires_at: Date.now() + Number(refreshed.expires_in || 3500) * 1000
  };
  await saveTokens(next);
  return next.access_token;
}
async function identity() {
  const token = await accessToken();
  let response;
  try {
    response = await fetch(USERINFO_URL, {
      headers: { authorization: 'Bearer ' + token, accept: 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch { throw new DriveError('GOOGLE_IDENTITY_TRANSPORT_FAILED', 502); }
  if (!response.ok) throw new DriveError('GOOGLE_IDENTITY_FAILED', 401);
  const user = await response.json();
  if (typeof user.email !== 'string' || user.email_verified !== true)
    throw new DriveError('GOOGLE_IDENTITY_UNVERIFIED', 401);
  return { email: user.email.toLowerCase(), emailVerified: true };
}
async function assertIdentity(expectedEmail) {
  const user = await identity();
  if (expectedEmail && user.email !== expectedEmail.toLowerCase())
    throw new DriveError('GOOGLE_ACCOUNT_MISMATCH', 403);
  return user;
}
async function googleFetch(url, init = {}) {
  const parsed = new URL(url);
  if (!['www.googleapis.com', 'docs.googleapis.com'].includes(parsed.hostname) || parsed.protocol !== 'https:')
    throw new DriveError('GOOGLE_HOST_NOT_ALLOWED', 403);
  const token = await accessToken();
  try {
    const response = await fetch(url, {
      ...init, redirect: 'error',
      headers: { authorization: 'Bearer ' + token, accept: 'application/json', ...(init.headers || {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!response.ok) throw new DriveError('GOOGLE_DRIVE_HTTP_' + response.status, response.status);
    return response;
  } catch (error) {
    if (error instanceof DriveError) throw error;
    throw new DriveError('GOOGLE_DRIVE_TRANSPORT_FAILED', 502);
  }
}
async function googleJson(url, init = {}) {
  const response = await googleFetch(url, init);
  try { return await response.json(); } catch { throw new DriveError('GOOGLE_DRIVE_JSON_INVALID', 502); }
}
async function metadata(fileId) {
  if (!validId(fileId)) throw new DriveError('INVALID_FILE_ID');
  const url = new URL(DRIVE_BASE + '/' + encodeURIComponent(fileId));
  url.searchParams.set('fields', fields);
  return googleJson(url.toString());
}
function queryFor(name, parentId) {
  if (!validName(name)) throw new DriveError('INVALID_NAME');
  if (parentId !== undefined && !validId(parentId)) throw new DriveError('INVALID_PARENT_ID');
  const parent = parentId || 'root';
  return "name = '" + escapeQuery(name.trim()) + "' and '" + parent + "' in parents and trashed = false";
}
async function exactMatches(name, parentId) {
  const url = new URL(DRIVE_BASE);
  url.searchParams.set('q', queryFor(name, parentId));
  url.searchParams.set('pageSize', '2');
  url.searchParams.set('fields', 'files(' + fields + ')');
  const data = await googleJson(url.toString());
  const matches = data.files || [];
  if (matches.length > 1) throw new DriveError('DUPLICATE_NAME_AMBIGUOUS', 409);
  return matches[0] || null;
}
async function ensureParent(parentId) {
  const id = parentId || 'root';
  if (!validId(id)) throw new DriveError('INVALID_PARENT_ID');
  if (id !== 'root') {
    const parent = await metadata(id);
    if (parent.mimeType !== 'application/vnd.google-apps.folder')
      throw new DriveError('PARENT_IS_NOT_FOLDER');
  }
  return id;
}
async function searchFiles(query, limit = 10, parentId) {
  if (typeof query !== 'string' || !query.trim() || query.length > 100)
    throw new DriveError('INVALID_QUERY');
  if (parentId !== undefined && !validId(parentId)) throw new DriveError('INVALID_PARENT_ID');
  const url = new URL(DRIVE_BASE);
  const parts = ["name contains '" + escapeQuery(query.trim()) + "'", 'trashed = false'];
  if (parentId) parts.push("'" + parentId + "' in parents");
  url.searchParams.set('q', parts.join(' and '));
  url.searchParams.set('pageSize', String(safeLimit(limit)));
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('fields', 'nextPageToken,files(' + fields + ')');
  const data = await googleJson(url.toString());
  return { files: data.files || [], hasMore: Boolean(data.nextPageToken), accessScope: 'drive' };
}
async function createFolder(name, parentId) {
  const parent = await ensureParent(parentId);
  const existing = await exactMatches(name, parent);
  if (existing) return { created: false, alreadyExists: true, file: existing };
  const metadataBody = {
    name: name.trim(), mimeType: 'application/vnd.google-apps.folder',
    ...(parent === 'root' ? {} : { parents: [parent] })
  };
  const url = new URL(DRIVE_BASE);
  url.searchParams.set('fields', fields);
  const created = await googleJson(url.toString(), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(metadataBody)
  });
  if (!created.id || created.mimeType !== 'application/vnd.google-apps.folder')
    throw new DriveError('GOOGLE_FOLDER_CREATE_UNCONFIRMED', 502);
  return { created: true, alreadyExists: false, file: created };
}
async function createTextFile(name, content, parentId) {
  const parent = await ensureParent(parentId);
  if (!validName(name)) throw new DriveError('INVALID_NAME');
  if (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_TEXT_BYTES)
    throw new DriveError('INVALID_OR_TOO_LARGE_CONTENT', 413);
  const existing = await exactMatches(name, parent);
  if (existing) throw new DriveError('FILE_ALREADY_EXISTS', 409);
  const boundary = 'mcf-drive-' + randomBytes(16).toString('hex');
  const meta = {
    name: name.trim(), mimeType: 'text/plain',
    ...(parent === 'root' ? {} : { parents: [parent] })
  };
  const body = Buffer.from(
    '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(meta) + '\r\n--' + boundary +
    '\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n' + content +
    '\r\n--' + boundary + '--\r\n', 'utf8'
  );
  const url = new URL(UPLOAD_BASE);
  url.searchParams.set('uploadType', 'multipart');
  url.searchParams.set('fields', fields);
  const created = await googleJson(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'multipart/related; boundary=' + boundary },
    body
  });
  if (!created.id || created.name !== name.trim()) throw new DriveError('GOOGLE_FILE_CREATE_UNCONFIRMED', 502);
  return { created: true, file: created, bytes: Buffer.byteLength(content, 'utf8') };
}
async function readTextFile(fileId) {
  const file = await metadata(fileId);
  const exportMime = file.mimeType === 'application/vnd.google-apps.document'
    ? 'text/plain'
    : file.mimeType === 'application/vnd.google-apps.spreadsheet'
      ? 'text/csv'
      : null;
  if (!exportMime && !(file.mimeType?.startsWith('text/') || file.mimeType === 'application/json'))
    throw new DriveError('UNSUPPORTED_FILE_TYPE', 415);
  const url = new URL(DRIVE_BASE + '/' + encodeURIComponent(fileId) + (exportMime ? '/export' : ''));
  if (exportMime) url.searchParams.set('mimeType', exportMime);
  else url.searchParams.set('alt', 'media');
  const response = await googleFetch(url.toString(), {
    headers: { accept: exportMime || 'text/plain, application/json' }
  });
  const content = await response.text();
  if (Buffer.byteLength(content, 'utf8') > MAX_TEXT_BYTES) throw new DriveError('FILE_TOO_LARGE_TO_READ', 413);
  return { file, content, exported: Boolean(exportMime), exportMime };
}
async function replaceGoogleDocContent(fileId, content) {
  const docUrl = 'https://docs.googleapis.com/v1/documents/' + encodeURIComponent(fileId);
  const document = await googleJson(docUrl);
  const endIndex = Math.max(1, ...(document.body?.content || []).map(item => Number(item.endIndex || 1)));
  const requests = [];
  if (endIndex > 2) requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } });
  if (content.length) requests.push({ insertText: { location: { index: 1 }, text: content } });
  if (!requests.length) throw new DriveError('EMPTY_UPDATE');
  const result = await googleJson(docUrl + ':batchUpdate', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ requests })
  });
  return { updated: true, file: await metadata(fileId), documentUpdated: true, replies: result.replies || [] };
}


async function updateTextFile(fileId, name, content) {
  if (!validId(fileId)) throw new DriveError('INVALID_FILE_ID');
  const current = await metadata(fileId);
  if (current.mimeType === 'application/vnd.google-apps.document') {
    if (content !== undefined && (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_TEXT_BYTES))
      throw new DriveError('INVALID_OR_TOO_LARGE_CONTENT', 413);
    if (content !== undefined) return replaceGoogleDocContent(fileId, content);
    if (name !== undefined) {
      if (!validName(name)) throw new DriveError('INVALID_NAME');
      const url = new URL(DRIVE_BASE + '/' + encodeURIComponent(fileId));
      url.searchParams.set('fields', fields);
      const renamed = await googleJson(url.toString(), {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!renamed.id) throw new DriveError('GOOGLE_FILE_RENAME_UNCONFIRMED', 502);
      return { updated: true, file: renamed, renamed: true };
    }
    throw new DriveError('EMPTY_UPDATE');
  }
  if (!(current.mimeType?.startsWith('text/') || current.mimeType === 'application/json'))
    throw new DriveError('UNSUPPORTED_FILE_TYPE', 415);
  const meta = {};
  if (name !== undefined) {
    if (!validName(name)) throw new DriveError('INVALID_NAME');
    meta.name = name.trim();
  }
  if (content !== undefined && (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > MAX_TEXT_BYTES))
    throw new DriveError('INVALID_OR_TOO_LARGE_CONTENT', 413);
  if (!Object.keys(meta).length && content === undefined) throw new DriveError('EMPTY_UPDATE');
  let updated;
  if (content === undefined) {
    const url = new URL(DRIVE_BASE + '/' + encodeURIComponent(fileId));
    url.searchParams.set('fields', fields);
    updated = await googleJson(url.toString(), {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(meta)
    });
  } else {
    const boundary = 'mcf-drive-' + randomBytes(16).toString('hex');
    const body = Buffer.from(
      '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(meta) + '\r\n--' + boundary +
      '\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n' + content +
      '\r\n--' + boundary + '--\r\n', 'utf8'
    );
    const url = new URL(UPLOAD_BASE + '/' + encodeURIComponent(fileId));
    url.searchParams.set('uploadType', 'multipart');
    url.searchParams.set('fields', fields);
    updated = await googleJson(url.toString(), {
      method: 'PATCH', headers: { 'content-type': 'multipart/related; boundary=' + boundary }, body
    });
  }
  if (!updated.id) throw new DriveError('GOOGLE_FILE_UPDATE_UNCONFIRMED', 502);
  return { updated: true, file: updated };
}
async function deleteFile(fileId) {
  if (!validId(fileId)) throw new DriveError('INVALID_FILE_ID');
  await metadata(fileId);
  const url = new URL(DRIVE_BASE + '/' + encodeURIComponent(fileId));
  await googleFetch(url.toString(), { method: 'DELETE' });
  return { deleted: true, fileId };
}

const OPERATIONS = Object.freeze([
  'google_drive.status', 'google_drive.search', 'google_drive.create_folder',
  'google_drive.create_text_file', 'google_drive.read_text_file',
  'google_drive.update_text_file', 'google_drive.delete_file'
]);
export function isAllowedOperation(operation) { return OPERATIONS.includes(operation); }
async function getStatus(expectedEmail) {
  let configured = false, connected = false, account = null, accountMatches = false, error = null;
  try { await loadClient(); configured = true; } catch (e) { error = e.code || 'OAUTH_CLIENT_NOT_CONFIGURED'; }
  if (!configured) return { configured, connected, account, accountMatches, scope: 'drive', error };
  try {
    const tokens = await loadTokens();
    if (!tokens?.refresh_token) return { configured, connected, account, accountMatches, scope: 'drive', error: 'OAUTH_REQUIRED' };
    const user = await identity();
    account = user.email;
    accountMatches = !expectedEmail || account === expectedEmail.toLowerCase();
    connected = accountMatches;
    if (!accountMatches) error = 'GOOGLE_ACCOUNT_MISMATCH';
  } catch (e) { error = e.code || 'GOOGLE_STATUS_FAILED'; }
  return { configured, connected, account, accountMatches, scope: 'drive', error };
}
export async function invoke(operation, args = {}, expectedEmail = '') {
  if (!isAllowedOperation(operation)) throw new DriveError('OPERATION_NOT_ALLOWED', 403);
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new DriveError('INVALID_ARGUMENTS');
  const traceId = randomUUID(), started = Date.now();
  let outcome = 'ok';
  try {
    let result;
    if (operation === 'google_drive.status') {
      result = await getStatus(expectedEmail);
    } else {
      await assertIdentity(expectedEmail);
      switch (operation) {
        case 'google_drive.search':
          result = await searchFiles(args.query, args.limit, args.parentId);
          break;
        case 'google_drive.create_folder':
          if (!validName(args.name)) throw new DriveError('INVALID_NAME');
          result = await createFolder(args.name, args.parentId);
          break;
        case 'google_drive.create_text_file':
          result = await createTextFile(args.name, args.content, args.parentId);
          break;
        case 'google_drive.read_text_file':
          result = await readTextFile(args.fileId);
          break;
        case 'google_drive.update_text_file':
          result = await updateTextFile(args.fileId, args.name, args.content);
          break;
        case 'google_drive.delete_file':
          result = await deleteFile(args.fileId);
          break;
        default:
          throw new DriveError('OPERATION_NOT_ALLOWED', 403);
      }
    }
    return { traceId, operation, result };
  } catch (error) {
    outcome = error instanceof DriveError ? error.code : 'INTERNAL_ERROR';
    if (error instanceof DriveError) throw error;
    throw new DriveError('INTERNAL_ERROR', 500);
  } finally {
    try {
      await ensureDir();
      await appendFile(AUDIT_FILE, JSON.stringify({
        time: new Date().toISOString(), traceId, operation, outcome, elapsedMs: Date.now() - started
      }) + '\n', { encoding: 'utf8', mode: 0o600 });
    } catch { /* audit failure must never expose user data or tokens */ }
  }
}
export const driveConfig = Object.freeze({
  configDir: CONFIG_DIR, clientFile: CLIENT_FILE, tokenFile: TOKEN_FILE,
  scope: SCOPE, operations: OPERATIONS, maxTextBytes: MAX_TEXT_BYTES
});
