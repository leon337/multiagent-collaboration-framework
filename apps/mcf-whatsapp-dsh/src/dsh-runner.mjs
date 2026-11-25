import { spawn } from 'node:child_process';

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
  let output = '', tooLarge = false, timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, cfg.timeoutMs ?? 120000);
  const finished = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => resolve(code));
  });
  child.stdout.on('data', chunk => {
    output += chunk.toString('utf8');
    if (output.length > 1024 * 1024) { tooLarge = true; child.kill('SIGKILL'); }
  });
  child.stderr.on('data', () => {}); // never persist model reasoning or credentials
  child.stdin.on('error', () => {});
  child.stdin.end(text);
  let code;
  try { code = await finished; } finally { clearTimeout(timeout); }
  if (timedOut) throw Error('dsh_timeout');
  if (tooLarge) throw Error('dsh_output_limit');
  let id = null, answer = null, toolsSeen = false, statusError = false, finalReason = null;
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { throw Error('dsh_invalid_stream'); }
    if (event.type === 'session') id = event.sessionId;
    if (event.type === 'final') answer = event.text;
    if (event.type === 'error') statusError = true;
    if (event.type === 'tool_call') toolsSeen = true;
    if (event.type === 'status' && event.phase === 'turn_end') finalReason = event.reason;
  }
  if (toolsSeen) throw Error('dsh_tool_boundary_broken');
  if (finalReason?.kind === 'error') {
    const errorCode = finalReason.error?.code;
    if (errorCode === 'QUOTA') throw Error('dsh_quota_exhausted');
    if (errorCode === 'INVALID_REQUEST' && /model is unavailable/i.test(finalReason.error?.message || '')) {
      throw Error('dsh_model_unavailable');
    }
    if (errorCode === 'INVALID_REQUEST') throw Error('dsh_invalid_request');
    throw Error('dsh_provider_error');
  }
  if (code !== 0 || statusError) throw Error('dsh_failed');
  if (finalReason?.kind !== 'completed') throw Error('dsh_incomplete_turn');
  if (!/^session-[a-zA-Z0-9-]{8,100}$/.test(id || '') || (sessionId && id !== sessionId)) throw Error('dsh_session_mismatch');
  if (typeof answer !== 'string' || !answer.trim()) throw Error('dsh_empty_answer');
  return { sessionId: id, answer: answer.slice(0, 3900) };
}
