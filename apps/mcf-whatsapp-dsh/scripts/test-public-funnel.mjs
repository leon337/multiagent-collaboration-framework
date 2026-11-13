import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const env = (await readFile(join(homedir(), '.config/mcf-whatsapp-dsh/env'), 'utf8'))
  .split('\n')
  .filter(row => /^[A-Z][A-Z0-9_]*=/.test(row));
const token = env.find(row => row.startsWith('WA_VERIFY_TOKEN='))?.slice('WA_VERIFY_TOKEN='.length);
if (!token || token.length < 32) throw Error('missing_meta_challenge_token');
const challenge = '38124567';
const url = new URL('https://mcf-leo-n43sm.tail582305.ts.net/webhook');
url.searchParams.set('hub.mode', 'subscribe');
url.searchParams.set('hub.verify_token', token);
url.searchParams.set('hub.challenge', challenge);
const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
const content = await res.text();
if (res.status !== 200 || content !== challenge) throw Error('challenge_handshake_failed_status_' + res.status);
console.log('PASS: public Meta webhook TLS + valid challenge; token not printed.');
