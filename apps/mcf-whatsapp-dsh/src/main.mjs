import { join } from 'node:path';
import { homedir } from 'node:os';
import { createService } from './gateway.mjs';
import { cloudSender } from './whatsapp-cloud.mjs';
import { invokeDeepSeek } from './dsh-runner.mjs';

if (process.env.WA_META_TEST_MODE !== '1') throw Error('meta_test_mode_required');
const base = process.env.MCF_WHATSAPP_DATA_DIR || join(homedir(), '.local/share/mcf-whatsapp-dsh');
const appRoot = new URL('..', import.meta.url).pathname;
const dsh = {
  command: process.env.DSH_BIN || join(homedir(), 'Aplicativos/dsh/node_modules/.bin/dsh'),
  profile: 'mcf-whatsapp-dsh',
  cwd: process.env.DSH_WORKSPACE || join(appRoot, 'workspace'),
  timeoutMs: 120000
};
const config = {
  secret: process.env.WA_APP_SECRET,
  verifyToken: process.env.WA_VERIFY_TOKEN,
  phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
  allowFrom: (process.env.WA_ALLOW_FROM || '').split(',').map(s => s.trim()).filter(Boolean),
  storePath: join(base, 'state.json'),
  invokeDsh: (text, session) => invokeDeepSeek(text, session, dsh),
  sendWhatsApp: cloudSender({
    version: process.env.WA_GRAPH_API_VERSION,
    phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
    accessToken: process.env.WA_ACCESS_TOKEN
  })
};
const { server, drain } = await createService(config);
const host = '127.0.0.1'; // never bind directly to the public network
const port = Number(process.env.MCF_WHATSAPP_PORT || 38764);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('invalid_port');
server.listen(port, host, () => {
  console.log('MCF WhatsApp DSH gateway READY at http://' + host + ':' + port + '/health');
  drain().catch(() => {});
});
