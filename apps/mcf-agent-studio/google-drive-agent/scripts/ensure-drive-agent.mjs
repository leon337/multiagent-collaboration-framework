import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const appData = process.env.MCF_STUDIO_DATA || join(homedir(), 'MCF MISSIONS', 'mcf-chatgpt-workspace', 'apps', 'mcf-agent-studio', '.data');
const token = (await readFile(join(appData, 'dsh-bridge-token'), 'utf8')).trim();
if (!/^[a-f0-9]{64}$/.test(token)) throw Error('DSH bridge token inválido.');
const base = 'http://127.0.0.1:4319';
async function call(path, method = 'GET', body) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'X-Agent-Studio-Bridge': token,
      ...(body === undefined ? {} : { 'content-type': 'application/json' })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok) throw Error('DSH bridge HTTP ' + response.status + ': ' + (data.error || 'falha'));
  return data;
}
const state = await call('/workspace/ensure', 'POST', {});
const agent = await call('/google-drive/status');
process.stdout.write(JSON.stringify({
  isolationValid: state.isolationValid,
  workspace: state.presets['mcf-google-drive-agent'],
  session: agent.sessionId,
  ready: agent.ready
}, null, 2) + '\n');