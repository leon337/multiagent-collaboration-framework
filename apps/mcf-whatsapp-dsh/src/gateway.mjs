import http from 'node:http';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';

export function verifySignature(raw, header, secret) {
  if (typeof header !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(header || '')) return false;
  const actual = Buffer.from(header.slice(7), 'hex');
  const expected = createHmac('sha256', secret).update(raw).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
async function bodyBytes(req, limit = 256 * 1024) {
  const chunks = [];
  let length = 0;
  for await (const c of req) {
    length += c.length;
    if (length > limit) throw Error('body_too_large');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}
function reply(res, code, data, type = 'application/json') {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(data) : String(data));
}
function extract(payload, phoneId) {
  if (payload?.object !== 'whatsapp_business_account') return [];
  const result = [];
  for (const entry of (Array.isArray(payload.entry) ? payload.entry : [])) for (const change of (Array.isArray(entry?.changes) ? entry.changes : [])) {
    if (change.field !== 'messages') continue;
    const value = change.value;
    if (phoneId && value?.metadata?.phone_number_id !== phoneId) continue;
    for (const m of (Array.isArray(value?.messages) ? value.messages : [])) {
      if (m?.type !== 'text' || typeof m.text?.body !== 'string') continue;
      if (!/^wamid\.[A-Za-z0-9_+=/.\-]{3,250}$/.test(m.id || '')) continue;
      if (!/^\d{8,15}$/.test(m.from || '') || !m.text.body.trim() || m.text.body.length > 4000) continue;
      result.push({ id: m.id, from: m.from, text: m.text.body.trim() });
    }
  }
  return result;
}
export async function createService(cfg) {
  if (!cfg.secret || !cfg.verifyToken || !cfg.allowFrom?.length || !cfg.storePath ||
    typeof cfg.invokeDsh !== 'function' || typeof cfg.sendWhatsApp !== 'function') throw Error('gateway_not_configured');
  const allowFrom = new Set(cfg.allowFrom);
  if ([...allowFrom].some(x => !/^\d{8,15}$/.test(x))) throw Error('invalid_allowlist');
  const state = { sessions: {}, messages: {} };
  try {
    const restored = JSON.parse(await readFile(cfg.storePath, 'utf8'));
    if (restored?.sessions && restored?.messages) {
      Object.assign(state.sessions, restored.sessions);
      Object.assign(state.messages, restored.messages);
    }
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  for (const record of Object.values(state.messages)) {
    if (record.status === 'processing') record.status = 'interrupted';
  }
  let saving = Promise.resolve(), working = false;
  function persist() {
    const snapshot = JSON.stringify(state);
    const path = cfg.storePath;
    saving = saving.then(async () => {
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      const temp = path + '.' + process.pid + '-' + randomUUID() + '.tmp';
      await writeFile(temp, snapshot, { mode: 0o600 });
      await rename(temp, path);
    });
    return saving;
  }
  await persist();
  async function pump() {
    if (working) return;
    working = true;
    try {
      while (true) {
        const next = Object.values(state.messages).find(r => r.status === 'pending');
        if (!next) break;
        if (!allowFrom.has(next.from)) {
          next.status = 'rejected_unauthorized';
          delete next.text;
          await persist();
          continue;
        }
        next.status = 'processing';
        await persist();
        try {
          const result = await cfg.invokeDsh(next.text, state.sessions[next.from] || null);
          if (typeof result?.sessionId !== 'string' || typeof result.answer !== 'string' || !result.answer.trim())
            throw Error('invalid_dsh_result');
          state.sessions[next.from] = result.sessionId;
          next.status = 'answer_ready';
          delete next.text;
          await persist(); // record DSH ownership before external delivery
          const deliveryId = await cfg.sendWhatsApp(next.from, result.answer);
          next.deliveryId = deliveryId;
          next.status = 'sent';
          await persist();
        } catch (e) {
          next.status = 'failed';
          next.failure = String(e.message || 'gateway_failed').slice(0, 90).replace(/[^\w-]/g, '_');
          delete next.text;
          await persist();
        }
      }
    } finally { working = false; }
  }
  const server = http.createServer(async (req, res) => {
    try {
      const parsed = new URL(req.url || '/', 'http://localhost');
      if (req.method === 'GET' && parsed.pathname === '/health') {
        const counts = {};
        for (const row of Object.values(state.messages)) counts[row.status] = (counts[row.status] || 0) + 1;
        return reply(res, 200, { service: 'mcf-whatsapp-dsh', status: 'ready', working, sessions: Object.keys(state.sessions).length, messages: counts });
      }
      if (parsed.pathname !== '/webhook') return reply(res, 404, { error: 'not_found' });
      if (req.method === 'GET') {
        if (parsed.searchParams.get('hub.mode') !== 'subscribe' ||
            parsed.searchParams.get('hub.verify_token') !== cfg.verifyToken ||
            !/^\d{1,250}$/.test(parsed.searchParams.get('hub.challenge') || ''))
          return reply(res, 403, { error: 'verification_failed' });
        return reply(res, 200, parsed.searchParams.get('hub.challenge'), 'text/plain');
      }
      if (req.method !== 'POST') return reply(res, 405, { error: 'method_not_allowed' });
      const raw = await bodyBytes(req);
      if (!verifySignature(raw, req.headers['x-hub-signature-256'], cfg.secret)) return reply(res, 401, { error: 'invalid_signature' });
      let payload;
      try { payload = JSON.parse(raw.toString('utf8')); } catch { return reply(res, 400, { error: 'bad_json' }); }
      let count = 0;
      for (const m of extract(payload, cfg.phoneNumberId)) {
        if (!allowFrom.has(m.from) || Object.hasOwn(state.messages, m.id)) continue;
        state.messages[m.id] = { ...m, status: 'pending', receivedAt: new Date().toISOString() };
        count++;
      }
      if (count) await persist();
      reply(res, 200, { accepted: count });
      if (count) setImmediate(() => { pump().catch(() => {}); });
    } catch (e) {
      if (!res.headersSent) reply(res, e.message === 'body_too_large' ? 413 : 500, { error: 'request_failed' });
    }
  });
  return { server, state, drain: pump, stop: () => new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve())) };
}
