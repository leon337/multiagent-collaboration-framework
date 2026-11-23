import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { saveTokens } from './drive-api.mjs';

const configDir = process.env.MCF_GOOGLE_DRIVE_CONFIG_DIR || path.join(homedir(), '.config', 'mcf-google-drive-agent');
const clientFile = process.env.MCF_GOOGLE_DRIVE_OAUTH_CLIENT_FILE || path.join(configDir, 'oauth-client.json');
const expectedEmail = (process.env.MCF_GOOGLE_DRIVE_EXPECTED_EMAIL || '').toLowerCase();
const redirectUri = process.env.MCF_GOOGLE_DRIVE_REDIRECT_URI || '';
const callbackUrl = redirectUri ? new URL(redirectUri) : null;
const callbackPath = callbackUrl?.pathname || '/oauth/callback';
const listenHost = '127.0.0.1';
const listenPort = Number(process.env.MCF_GOOGLE_DRIVE_OAUTH_PORT || 4380);
const noBrowser = process.env.MCF_GOOGLE_DRIVE_NO_BROWSER === '1';
const scope = 'openid email https://www.googleapis.com/auth/drive';
const timeoutMs = 10 * 60 * 1000;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(expectedEmail)) throw Error('MCF_GOOGLE_DRIVE_EXPECTED_EMAIL_REQUIRED');
if (!callbackUrl || callbackUrl.protocol !== 'https:' || callbackUrl.username || callbackUrl.password || callbackUrl.search || callbackUrl.hash)
  throw Error('MCF_GOOGLE_DRIVE_HTTPS_REDIRECT_URI_REQUIRED');
if (!Number.isInteger(listenPort) || listenPort < 1024 || listenPort > 65535) throw Error('MCF_GOOGLE_DRIVE_OAUTH_PORT_INVALID');

async function readClient() {
  const parsed = JSON.parse(await readFile(clientFile, 'utf8'));
  const client = parsed.web || parsed.installed || parsed;
  if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client?.client_id || ''))
    throw Error('OAuth client inválido.');
  if (!Array.isArray(client.redirect_uris) || !client.redirect_uris.includes(redirectUri))
    throw Error('O redirect URI não corresponde ao cliente OAuth autorizado.');
  if (parsed.web && !client.client_secret) throw Error('O cliente OAuth Web não possui client_secret.');
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
    let finished = false;
    let timer;
    const server = createServer(async (req, res) => {
      let url;
      try { url = new URL(req.url || '/', 'http://127.0.0.1'); }
      catch {
        res.writeHead(400).end('Callback inválido.');
        return;
      }
      if (req.method !== 'GET' || (url.pathname !== callbackPath && url.pathname !== '/')) {
        res.writeHead(404).end('Not found');
        return;
      }
      if (url.searchParams.get('state') !== state) {
        res.writeHead(400, { 'cache-control': 'no-store' }).end('Estado OAuth inválido.');
        return;
      }
      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400, { 'cache-control': 'no-store' }).end('Consentimento cancelado.');
        finish(Error('OAUTH_DECLINED'));
        return;
      }
      try {
        const form = new URLSearchParams({
          client_id: client.id,
          client_secret: client.secret,
          code,
          code_verifier: verifier,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        });
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: form,
          redirect: 'error',
          signal: AbortSignal.timeout(20000)
        });
        if (!tokenResponse.ok) throw Error('TOKEN_EXCHANGE_FAILED');
        const tokens = await tokenResponse.json();
        if (!tokens.refresh_token || !tokens.access_token) throw Error('REFRESH_TOKEN_MISSING');

        const grantedScope = tokens.scope || scope;
        const scopes = new Set(grantedScope.split(' ').filter(Boolean));
        if (!scopes.has('https://www.googleapis.com/auth/drive')) throw Error('DRIVE_SCOPE_MISSING');

        const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { authorization: 'Bearer ' + tokens.access_token },
          redirect: 'error',
          signal: AbortSignal.timeout(12000)
        });
        if (!userResponse.ok) throw Error('IDENTITY_CHECK_FAILED');
        const user = await userResponse.json();
        if (user.email?.toLowerCase() !== expectedEmail || user.email_verified !== true)
          throw Error('GOOGLE_ACCOUNT_MISMATCH');

        await saveTokens({
          ...tokens,
          scope: grantedScope,
          expires_at: Date.now() + Number(tokens.expires_in || 3500) * 1000
        });
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Google Drive conectado</title><h2>Google Drive conectado.</h2><p>Conta confirmada. Você pode fechar esta janela.</p></html>');
        finish(null);
      } catch (error) {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
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

    server.on('error', () => finish(Error('OAUTH_LISTENER_FAILED')));
    server.listen(listenPort, listenHost, () => {
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      for (const [key, value] of Object.entries({
        client_id: client.id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        access_type: 'offline',
        prompt: 'consent select_account',
        login_hint: expectedEmail,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
      })) url.searchParams.set(key, value);

      process.stdout.write('Aguardando consentimento OAuth para ' + expectedEmail + ' com escopo drive (acesso completo ao Drive da conta).\n');
      if (noBrowser) process.stdout.write('MCF_GOOGLE_DRIVE_AUTH_URL=' + url.toString() + '\n');
      else openBrowser(url.toString());
      timer = setTimeout(() => finish(Error('OAUTH_TIMEOUT')), timeoutMs);
      timer.unref();
    });
  });
}

authorize().then(() => {
  process.stdout.write('OAuth concluído; token salvo cifrado e identidade validada.\n');
}).catch(error => {
  process.stderr.write('OAUTH_FAILED ' + error.message + '\n');
  process.exitCode = 1;
});
