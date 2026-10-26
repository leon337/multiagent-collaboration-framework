import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const home = homedir();
const target = join(home, '.dsh/profiles/mcf-whatsapp-dsh');
const webPatch = join(home, '.dsh/profiles/web/cordis.patch.yml');
function block(text, id) {
  const lines = text.split('\n');
  const start = lines.findIndex(x => x === '- id: ' + id);
  if (start < 0) throw Error('web_profile_missing_' + id);
  let end = start + 1;
  while (end < lines.length && !lines[end].startsWith('- id: ') && !lines[end].startsWith('- insert:')) end++;
  return lines.slice(start, end).join('\n').trimEnd() + '\n';
}
const web = await readFile(webPatch, 'utf8');
const provider = block(web, 'llm-pi-ai');
const model = block(web, 'agent-default-model');
const selectedModel = 'nvidia/stepfun-ai/step-5-preview';
if (!provider.includes('- id: ' + selectedModel)) throw Error('step5_not_registered_in_9router');
if (!provider.includes('mcf-9router') || !model.includes('provider: mcf-9router')) throw Error('9router_not_configured_in_dsh_web');
const selected = model.match(/^\s*model:\s*([^\s#]+)/m)?.[1];
if (!selected) throw Error('dsh_web_default_model_missing');
const pinnedModel = model.replace(/^([ \t]*model:)[^\n]+/m, '$1 ' + selectedModel);
if (!pinnedModel.includes('model: ' + selectedModel)) throw Error('step5_model_patch_failed');
await mkdir(target, { recursive: true, mode: 0o700 });
await writeFile(join(target, 'package.json'), await readFile(join(app, 'dsh/package.json')), { mode: 0o600 });
const policy = await readFile(join(app, 'dsh/cordis.patch.yml'), 'utf8');
// Provider credentials stay on this computer in a mode 0600 private file; never in Git.
await writeFile(join(target, 'cordis.patch.yml'), policy + '\n# Local 9Router provider material copied from the installed DSH Web profile.\n' + provider + pinnedModel, { mode: 0o600 });
await chmod(join(target, 'cordis.patch.yml'), 0o600);
console.log('Installed private mcf-whatsapp-dsh profile using the current DSH Web 9Router provider.');
