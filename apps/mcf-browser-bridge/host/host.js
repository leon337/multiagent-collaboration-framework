#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { FrameParser, encode } from './framing.js';
import { createAgentBroker } from './agent-broker.js';
import { createSession, validCaller } from './session.js';
// No secrets, request bodies or page content are logged. stdout is protocol-only.
try {
  const config = JSON.parse(readFileSync(new URL('./config.local.json', import.meta.url), 'utf8'));
  if (!validCaller(process.argv[2], config.extensionId)) throw Error('CALLER_DENIED');
} catch { process.stderr.write('Bridge configuration/caller denied.\n'); process.exit(1); }
const handle = createSession();
let closed = false, handling = false;
const send = r => { if (closed || !process.stdout.write(encode(r))) stop(); };
let broker = null;
try { if (process.env.MCF_BRIDGE_AGENT_SOCKET_DIR) broker = createAgentBroker(process.env.MCF_BRIDGE_AGENT_SOCKET_DIR, send); } catch { process.stderr.write('Agent directory denied.\n'); process.exit(1); }
const stop = () => { if (closed) return; closed = true; broker?.revoke(); clearTimeout(timer); process.stdin.destroy(); process.stdout.end(); };
const timer = setTimeout(stop, 60000);
const parser = new FrameParser(r => {
  if (closed) return;
  if (r?.type) { try { broker.result(r); } catch { stop(); } return; }
  if (handling) { stop(); return; }
  const response = handle(r);
  if (r?.action !== 'agent-allow' || response.state !== 'VALIDATED') { send(response); return; }
  if (!broker) { send({ protocolVersion: 1, actionId: r.actionId, state: 'DENIED', failureCode: 'AGENT_UNAVAILABLE', retryable: false }); return; }
  handling = true;
  broker.allow({ target: response.observedTarget, expiresAt: response.expiresAt }).then(grant => {
    if (closed) { broker.revoke(); return; }
    send({ ...response, ...grant });
  }).catch(() => stop()).finally(() => { handling = false; });
});
process.stdin.on('data', chunk => { try { parser.push(chunk); } catch { process.stderr.write('Invalid native frame.\n'); stop(); } });
process.stdin.on('end', () => { try { parser.end(); } catch { process.stderr.write('Truncated native frame.\n'); process.exitCode = 1; } clearTimeout(timer); stop(); });
process.stdin.on('error', stop);
process.stdout.on('error', stop);

for (const signal of ['SIGINT','SIGTERM']) process.on(signal, stop);
process.on('exit', () => broker?.revoke());
