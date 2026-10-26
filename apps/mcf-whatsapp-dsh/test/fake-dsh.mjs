import { randomUUID } from 'node:crypto';
const args = process.argv.slice(2);
const idx = args.indexOf('--session-id');
const sessionId = idx < 0 ? 'session-' + randomUUID() : args[idx + 1];
let prompt = '';
for await (const c of process.stdin) prompt += c.toString();
if (!prompt) process.exit(4);
console.log(JSON.stringify({ type: 'session', sessionId }));
if (prompt.includes('FAIL_TOOL')) console.log(JSON.stringify({ type: 'tool_call', name: 'bash' }));
if (prompt.includes('FAIL_QUOTA')) { console.log(JSON.stringify({type:'status',phase:'turn_end',reason:{kind:'error',error:{code:'QUOTA'}}})); process.exit(1); }
if (prompt.includes('FAIL_UNAVAILABLE')) { console.log(JSON.stringify({type:'status',phase:'turn_end',reason:{kind:'error',error:{code:'INVALID_REQUEST',message:'400: Upstream request failed: Model is unavailable.'}}})); process.exit(1); }
if (prompt.includes('FAIL_EXIT')) process.exit(1);
console.log(JSON.stringify({type:'status',phase:'turn_end',reason:{kind:'completed'}}));
console.log(JSON.stringify({ type: 'final', text: 'ECO:' + prompt.trim() }));
