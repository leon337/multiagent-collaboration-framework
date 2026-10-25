import { join } from 'node:path';
import { homedir } from 'node:os';
import { createService } from './gateway.mjs';
import { createBootstrapServer } from './bootstrap-webhook.mjs';
import { cloudSender } from './whatsapp-cloud.mjs';
import { invokeDeepSeek } from './dsh-runner.mjs';

if (process.env.WA_META_TEST_MODE !== '1') throw Error('meta_test_mode_required');
const host = '127.0.0.1'; // exclusively exposed through path-limited, TLS-terminated Funnel
const port = Number(process.env.MCF_WHATSAPP_PORT || 38764);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('invalid_port');
const mandatory = ['WA_APP_SECRET', 'WA_VERIFY_TOKEN', 'WA_ACCESS_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_GRAPH_API_VERSION', 'WA_ALLOW_FROM'];
const missing = mandatory.filter(name => !process.env[name]);
if (missing.length > 0 || process.env.WA_ACTIVATE_CHAT !== '1') {
  const bootstrap = createBootstrapServer(process.env.WA_VERIFY_TOKEN);
  bootstrap.listen(port, host, () => {
    console.log('MCF WhatsApp Meta test callback BOOTSTRAP_ONLY at ' + host + ':' + port + '; no incoming chat or outbound delivery enabled.');
  });
} else {
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
    allowFrom: process.env.WA_ALLOW_FROM.split(',').map(s => s.trim()).filter(Boolean),
    storePath: join(base, 'state.json'),
    invokeDsh: (text, session) => invokeDeepSeek(text, session, dsh),
    sendWhatsApp: cloudSender({
      version: process.env.WA_GRAPH_API_VERSION,
      phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
      accessToken: process.env.WA_ACCESS_TOKEN
    })
  };
  const { server, drain } = await createService(config);
  server.listen(port, host, () => {
    console.log('MCF WhatsApp DSH Meta TEST gateway READY at ' + host + ':' + port);
    drain().catch(() => {});
  });
}
