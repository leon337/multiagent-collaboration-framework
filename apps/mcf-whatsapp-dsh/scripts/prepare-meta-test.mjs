import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const dir = join(homedir(), '.config/mcf-whatsapp-dsh');
const path = join(dir, 'env');
await mkdir(dir, { recursive: true, mode: 0o700 });
let content;
try {
  content = await readFile(path, 'utf8');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  const secret = randomBytes(32).toString('hex');
  content = [
    '# WhatsApp Cloud API — test sender only. Never commit this file.',
    'WA_META_TEST_MODE=1',
    'WA_APP_SECRET=',
    'WA_VERIFY_TOKEN=' + secret,
    'WA_ACCESS_TOKEN=',
    'WA_PHONE_NUMBER_ID=',
    'WA_GRAPH_API_VERSION=',
    'WA_ALLOW_FROM=',
    'MCF_WHATSAPP_PORT=38764',
    ''
  ].join('\n');
  await writeFile(path, content, { mode: 0o600, flag: 'wx' });
}
await chmod(path, 0o600);
const values = Object.fromEntries(content.split('\n').filter(s => /^[A-Z][A-Z0-9_]*=/.test(s)).map(s => {
  const n = s.indexOf('=');
  return [s.slice(0, n), s.slice(n + 1)];
}));
const needed = ['WA_APP_SECRET','WA_VERIFY_TOKEN','WA_ACCESS_TOKEN','WA_PHONE_NUMBER_ID','WA_GRAPH_API_VERSION','WA_ALLOW_FROM'];
const missing = needed.filter(k => !values[k]);
console.log('Meta test mode:', values.WA_META_TEST_MODE === '1' ? 'ON' : 'OFF');
console.log('Private file:', path);
console.log('Missing fields:', missing.length ? missing.join(', ') : 'NONE');
console.log('Token values are intentionally hidden.');
console.log('Meta app setup: https://developers.facebook.com/apps/');
console.log(missing.length ? 'State: WAITING_FOR_META_TEST_ACCOUNT_SETUP' : 'State: LOCAL_FIELDS_PRESENT_REQUIRES_META_VALIDATION');
