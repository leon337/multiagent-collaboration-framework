import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const dsh = process.env.DSH_BIN || join(homedir(), 'Aplicativos/dsh/node_modules/.bin/dsh');
const p = spawnSync(dsh, ['--profile', 'mcf-whatsapp-dsh', '--dump-config'], { encoding: 'utf8', timeout: 30000, maxBuffer: 2_000_000 });
if (p.error || p.status !== 0 || p.stderr.trim()) throw Error('dsh_profile_composition_failed');
const config = p.stdout;
if (!config.includes('mcf-9router') || !config.includes('agente de conversação do MCF')) throw Error('dsh_model_or_persona_missing');
const required = [
  'tool-plugin-manager','tool-bash','tool-pwsh','tool-jobs','tool-fs','tool-fs-search',
  'tool-skill','tool-subagent','tool-subagent-control','tool-subagent-list-agents',
  'tool-subagent-fork','tool-workflow','tool-web','tool-todo','tool-goal','tool-ralph',
  'commands','subagent','agent-instructions','skill','goal','web-search-deepseek','web-fetch-http'
];
for (const id of required) {
  const marker = '\n- id: ' + id + '\n';
  const start = config.indexOf(marker);
  if (start < 0) throw Error('missing_policy_component_' + id);
  const rest = config.slice(start + marker.length);
  const end = rest.search(/\n- id: |\n# == /);
  const block = end < 0 ? rest : rest.slice(0, end);
  if (!block.includes('disabled: true')) throw Error('enabled_unsafe_component_' + id);
}
const allowedToolIds = new Set([...required, 'tool-result-pruner']);
for (const match of config.matchAll(/\n- id: (tool-[a-z0-9-]+)\n/g)) {
  if (!allowedToolIds.has(match[1])) throw Error('unexpected_tool_component_' + match[1]);
}
console.log('PASS: DSH mcf-whatsapp-dsh, 9Router configurado, 23 componentes de ferramentas desabilitados.');
