#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { FrameParser, encode } from './framing.js';
import { createSession, validCaller } from './session.js';
// No secrets, request bodies or page content are logged. stdout is protocol-only.
try {
  const config = JSON.parse(readFileSync(new URL('./config.local.json', import.meta.url), 'utf8'));
  if (!validCaller(process.argv[2], config.extensionId)) throw Error('CALLER_DENIED');
} catch { process.stderr.write('Bridge configuration/caller denied.\n'); process.exit(1); }
const handle = createSession();
let closed = false;
const stop = () => { if (closed) return; closed = true; clearTimeout(timer); process.stdin.destroy(); process.stdout.end(); };
const timer = setTimeout(stop, 60000);
const parser = new FrameParser(r => {
  if (closed) return;
  if (!process.stdout.write(encode(handle(r)))) stop(); // bounded: no unbounded output queue
});
process.stdin.on('data', chunk => { try { parser.push(chunk); } catch { process.stderr.write('Invalid native frame.\n'); stop(); } });
process.stdin.on('end', () => { try { parser.end(); } catch { process.stderr.write('Truncated native frame.\n'); process.exitCode = 1; } clearTimeout(timer); stop(); });
process.stdin.on('error', stop);
process.stdout.on('error', stop);
