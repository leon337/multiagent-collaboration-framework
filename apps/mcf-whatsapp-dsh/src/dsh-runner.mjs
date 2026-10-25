import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export async function invokeDeepSeek(text, sessionId, cfg) {
  if (typeof text !== 'string' || text.length < 1 || text.length > 4000) throw Error('invalid_prompt');
  if (sessionId && !/^session-[a-zA-Z0-9-]{8,100}$/.test(sessionId)) throw Error('invalid_session_id');
  const args = [...(cfg.preArgs || []), '--profile', cfg.profile, '--json'];
  if (sessionId) args.push('--session-id', sessionId);
  args.push('-');
  const child = spawn(cfg.command, args, {
    cwd: cfg.cwd,
    env: { ...process.env, DSH_TOOLS_MODE: 'native' },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });
  let output = '', stderrBytes = 0, tooLarge = false, timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, cfg.timeoutMs ?? 120000);
  const finished = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => resolve(code));
  });
  child.stdout.on('data', chunk => {
    output += chunk.toString('utf8');
    if (output.length > 1024 * 1024) { tooLarge = true; child.kill('SIGKILL'); }
  });
  child.stderr.on('data', chunk => { stderrBytes += chunk.length; }); // never persist model reasoning
  child.stdin.on('error', () => {});
  child.stdin.end(text);
  let code;
  try { code = await finished; } finally { clearTimeout(timeout); }
  if (timedOut) throw Error('dsh_timeout');
  if (tooLarge) throw Error('dsh_output_limit');
  if (code !== 0) {
    let quota = false;
    for (const line of output.split('\n')) {
      try { const event = JSON.parse(line); if (event.type === 'status' && event.status?.error?.code === 'QUOTA') quota = true; } catch {}
    }
    throw Error(quota ? 'dsh_quota_exhausted' : 'dsh_failed');
  }
  let id = null, answer = null, toolsSeen = false, statusError = false;
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { throw Error('dsh_invalid_stream'); }
    if (event.type === 'session') id = event.sessionId;
    if (event.type === 'final') answer = event.text;
    if (event.type === 'error') statusError = true;
    if (event.type === 'tool_call') toolsSeen = true;
  }
  if (statusError || toolsSeen) throw Error(toolsSeen ? 'dsh_tool_boundary_broken' : 'dsh_reported_error');
  if (!/^session-[a-zA-Z0-9-]{8,100}$/.test(id || '') || (sessionId && id !== sessionId)) throw Error('dsh_session_mismatch');
  if (typeof answer !== 'string' || !answer.trim()) throw Error('dsh_empty_answer');
  return { sessionId: id, answer: answer.slice(0, 3900) };
}
