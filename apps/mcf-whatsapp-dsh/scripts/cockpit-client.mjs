import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Standard local Cockpit Agent Bridge client. Credentials remain on the notebook.
export async function cockpitRequest(path, options = {}) {
  const file = join(homedir(), '.config/mcf-dual-browser-cockpit/instances/notebook/agent-bridge.json');
  const config = JSON.parse(await readFile(file, 'utf8'));
  if (!config.enabled || config.host !== '127.0.0.1' || config.instanceId !== 'notebook') throw Error('cockpit_instance_untrusted');
  const response = await fetch('http://127.0.0.1:' + config.port + path, {
    method: options.method || 'GET',
    headers: {
      authorization: 'Bearer ' + config.token,
      'x-mcf-instance': config.instanceId,
      ...(options.body ? {'content-type':'application/json'} : {})
    },
    ...(options.body ? {body: JSON.stringify(options.body)} : {}),
    signal: AbortSignal.timeout(25000)
  });
  const payload = await response.json();
  if (!response.ok) throw Error('cockpit_http_' + response.status + '_' + String(payload.error || 'unknown').slice(0, 100));
  return payload;
}
