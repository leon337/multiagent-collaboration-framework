import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
for (const dir of ['extension','host','tests','scripts']) for (const name of readdirSync(new URL(dir + '/', root))) {
  if (!name.endsWith('.js')) continue;
  const r = spawnSync(process.execPath, ['--check', new URL(dir + '/' + name, root).pathname], { encoding: 'utf8' });
  if (r.status !== 0) { process.stderr.write(r.stderr); process.exit(1); }
}
const m = JSON.parse(readFileSync(new URL('extension/manifest.json', root)));
if (m.manifest_version !== 3 || JSON.stringify(m.permissions) !== JSON.stringify(['activeTab','scripting','nativeMessaging']) || m.host_permissions || m.content_scripts) throw Error('MANIFEST_POLICY');
JSON.parse(readFileSync(new URL('host/com.mcf.browser_bridge.json.template', root)));
console.log('PASS: JavaScript syntax, MV3 permissions, host template JSON');
