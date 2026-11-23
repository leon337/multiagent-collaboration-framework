import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { saveTokens } from './drive-api.mjs';

const configDir = process.env.MCF_GOOGLE_DRIVE_CONFIG_DIR || path.join(homedir(), '.config', 'mcf-google-drive-agent');
const clientFile = path.join(configDir, 'oauth-client.json');
const expectedEmail = (process.env.MCF_GOOGLE_DRIVE_EXPECTED_EMAIL || '').toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedEmail)) throw Error('MCF_GOOGLE_DRIVE_EXPECTED_EMAIL_REQUIRED');
const scope = 'openid email https://www.googleapis.com/auth/drive.file';
const timeoutMs = 180000;

async function readClient() {
  const parsed = JSON.parse(await readFile(clientFile, 'utf8'));
  const client = parsed.installed || parsed.web || parsed;
  if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client?.client_id || ''))
    throw Error('OAuth client inválido.');
  return { id: client.client_id, secret: client.client_secret || '' };
}
function openBrowser(url) {
  const child = spawn('brave-browser', ['--profile-directory=Default', '--new-window', url], {
    stdio: 'ignore', detached: true
  });
  child.once('error', () => {
    const fallback = spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
    fallback.unref();
  });
  child.unref();
}
async function authorize() {
  const client = await readClient();
  const state = randomBytes(32).toString('hex');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  await new Promise((resolve, reject) => {
    let finished = false, timer;
    const server = createServer(async (req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      if (req.method !== 'GET' || url.pathname !== '/oauth/callback') {
        res.writeHead(404).end('Not found'); return;
      }
      if (url.searchParams.get('state') !== state) {
        res.writeHead(400).end('State inválido.'); return;
      }
      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400).end('Consentimento cancelado.');
        finish(Error('OAUTH_DECLINED')); return;
      }
      try {
        const form = new URLSearchParams({
          client_id: client.id, code, code_verifier: verifier,
          redirect_uri: 'http://127.0.0.1:' + server.address().port + '/oauth/callback',
          grant_type: 'authorization_code'
        });
        if (client.secret) form.set('client_secret', client.secret);
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: form, redirect: 'error', signal: AbortSignal.timeout(20000)
        });
        if (!tokenResponse.ok) throw Error('TOKEN_EXCHANGE_FAILED');
        const tokens = await tokenResponse.json();
        if (!tokens.refresh_token || !tokens.access_token) throw Error('REFRESH_TOKEN_MISSING');
        const grantedScope = tokens.scope || scope;
        const scopes = new Set(grantedScope.split(' ').filter(Boolean));
        if (!scopes.has('https://www.googleapis.com/auth/drive.file')) throw Error('DRIVE_FILE_SCOPE_MISSING');
        if (scopes.has('https://www.googleapis.com/auth/drive') ||
            scopes.has('https://www.googleapis.com/auth/drive.readonly')) throw Error('DRIVE_SCOPE_TOO_BROAD');
        const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { authorization: 'Bearer ' + tokens.access_token },
          redirect: 'error', signal: AbortSignal.timeout(12000)
        });
        if (!userResponse.ok) throw Error('IDENTITY_CHECK_FAILED');
        const user = await userResponse.json();
        if (user.email?.toLowerCase() !== expectedEmail || user.email_verified !== true)
          throw Error('GOOGLE_ACCOUNT_MISMATCH');
        await saveTokens({ ...tokens, scope: grantedScope, expires_at: Date.now() + Number(tokens.expires_in || 3500) * 1000 });
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Google Drive conectado</title><h2>Google Drive conectado.</h2><p>Conta confirmada. Você pode fechar esta janela.</p></html>');
        finish(null);
      } catch (error) {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('A autorização não foi concluída. Verifique a conta e as permissões.');
        finish(error);
      }
    });
    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      server.close();
      error ? reject(error) : resolve();
    }
    server.on('error', () => finish(Error('OAUTH_LOOPBACK_FAILED')));
    server.listen(0, '127.0.0.1', () => {
      const redirect = 'http://127.0.0.1:' + server.address().port + '/oauth/callback';
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      for (const [key, value] of Object.entries({
        client_id: client.id, redirect_uri: redirect, response_type: 'code',
        scope, access_type: 'offline', prompt: 'consent select_account',
        login_hint: expectedEmail, state, code_challenge: challenge,
        code_challenge_method: 'S256'
      })) url.searchParams.set(key, value);
      process.stdout.write('Aguardando consentimento OAuth para ' + expectedEmail + ' com escopo drive.file.\n');
      openBrowser(url.toString());
      timer = setTimeout(() => finish(Error('OAUTH_TIMEOUT')), timeoutMs);
      timer.unref();
    });
  });
}
authorize().then(() => {
  process.stdout.write('OAuth concluído; token de renovação salvo cifrado e identidade validada.\n');
}).catch(error => {
  process.stderr.write('OAUTH_FAILED ' + error.message + '\n');
  process.exitCode = 1;
});