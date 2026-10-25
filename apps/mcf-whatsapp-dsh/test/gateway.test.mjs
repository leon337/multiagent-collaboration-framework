import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createService, verifySignature } from '../src/gateway.mjs';
import { cloudSender } from '../src/whatsapp-cloud.mjs';

const from = '5581999991234';
const secret = 'dev-secret-only';
function payload(id, sender = from, text = 'Olá') {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
    metadata: { phone_number_id: '12345678901' },
    messages: [{ id: 'wamid.' + id, from: sender, type: 'text', text: { body: text } }]
  } }] }] };
}
function signed(raw, key = secret) {
  return 'sha256=' + createHmac('sha256', key).update(raw).digest('hex');
}
const pause = ms => new Promise(ok => setTimeout(ok, ms));
async function until(fn, timeout = 3000) {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > timeout) throw Error('test_timeout');
    await pause(10);
  }
}
async function setup(t, extra = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'mcf-wa-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const calls = [], sent = [];
  const cfg = {
    secret, verifyToken: 'verify-private', phoneNumberId: '12345678901',
    allowFrom: [from], storePath: join(dir, 'state.json'),
    invokeDsh: async (text, id) => {
      calls.push({ text, id });
      return { sessionId: id || 'session-12345678-abcd', answer: 'Resposta: ' + text };
    },
    sendWhatsApp: async (to, text) => { sent.push({ to, text }); return 'wamid.sent'; },
    ...extra
  };
  const svc = await createService(cfg);
  await new Promise(ok => svc.server.listen(0, '127.0.0.1', ok));
  const url = 'http://127.0.0.1:' + svc.server.address().port;
  t.after(async () => svc.stop());
  async function post(data, signature = signed(JSON.stringify(data))) {
    return fetch(url + '/webhook', {
      method: 'POST',
      headers: { 'x-hub-signature-256': signature, 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
  return { ...svc, url, cfg, calls, sent, post };
}
test('assinatura HMAC em bytes originais é obrigatória', () => {
  const raw = Buffer.from('{"a":"é"}');
  assert.equal(verifySignature(raw, signed(raw), secret), true);
  assert.equal(verifySignature(raw, signed(raw, 'outro'), secret), false);
  assert.equal(verifySignature(raw, 'sha256=x', secret), false);
  assert.equal(verifySignature(raw, undefined, secret), false);
});
test('GET handshake verifica token e recusa token incorreto', async t => {
  const s = await setup(t);
  const ok = await fetch(s.url + '/webhook?hub.mode=subscribe&hub.verify_token=verify-private&hub.challenge=45687');
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '45687');
  const no = await fetch(s.url + '/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=45687');
  assert.equal(no.status, 403);
});
test('POST sem assinatura correta recusa processamento', async t => {
  const s = await setup(t);
  const p = payload('sig001');
  const bad = await s.post(p, signed(JSON.stringify(p), 'wrong'));
  assert.equal(bad.status, 401);
  assert.equal(s.calls.length, 0);
});
test('allowlist rejeita remetentes não autorizados', async t => {
  const s = await setup(t);
  const resp = await s.post(payload('foreign001', '5581988885555'));
  assert.equal(resp.status, 200);
  assert.equal((await resp.json()).accepted, 0);
  assert.equal(s.calls.length, 0);
});
test('turnos reais persistem sessão por remetente e deduplicam mensagem', async t => {
  const s = await setup(t);
  const first = await s.post(payload('first123', from, 'oi'));
  assert.equal((await first.json()).accepted, 1);
  await until(() => s.state.messages['wamid.first123']?.status === 'sent');
  const again = await s.post(payload('first123', from, 'oi'));
  assert.equal((await again.json()).accepted, 0);
  const second = await s.post(payload('second123', from, 'continue'));
  assert.equal((await second.json()).accepted, 1);
  await until(() => s.state.messages['wamid.second123']?.status === 'sent');
  assert.equal(s.calls.length, 2);
  assert.equal(s.calls[0].id, null);
  assert.equal(s.calls[1].id, 'session-12345678-abcd');
  assert.equal(s.sent[1].text, 'Resposta: continue');
  const health = await (await fetch(s.url + '/health')).json();
  assert.equal(health.sessions, 1);
  assert.equal(JSON.stringify(health).includes(from), false);
});
test('estado persiste após reinício e não reenvia mensagens antigas', async t => {
  const s = await setup(t);
  await s.post(payload('persist111'));
  await until(() => s.state.messages['wamid.persist111']?.status === 'sent');
  const reloaded = await createService(s.cfg);
  assert.equal(reloaded.state.sessions[from], 'session-12345678-abcd');
  assert.equal(reloaded.state.messages['wamid.persist111'].status, 'sent');
  assert.equal(reloaded.state.messages['wamid.persist111'].text, undefined);
});
test('falha DSH não é anunciada como mensagem enviada', async t => {
  const s = await setup(t, { invokeDsh: async () => { throw Error('dsh_failed'); } });
  await s.post(payload('fail111'));
  await until(() => s.state.messages['wamid.fail111']?.status === 'failed');
  assert.equal(s.sent.length, 0);
  assert.equal(s.state.messages['wamid.fail111'].failure, 'dsh_failed');
});
test('Cloud API envia ao telefone certo e valida resposta HTTP', async () => {
  let url, opts;
  const send = cloudSender({ version: 'v23.0', phoneNumberId: '12345678901', accessToken: 'test-token' }, async (u, o) => {
    url = u; opts = o;
    return { ok: true, status: 200, json: async () => ({ messages: [{ id: 'wamid.ack' }] }) };
  });
  assert.equal(await send(from, 'resposta'), 'wamid.ack');
  assert.equal(url, 'https://graph.facebook.com/v23.0/12345678901/messages');
  assert.equal(JSON.parse(opts.body).to, from);
  assert.equal(opts.headers.authorization, 'Bearer test-token');
  assert.throws(() => cloudSender({ version: '', phoneNumberId: '12345678901', accessToken: 'x' }), /version/);
});
test('IDs com caracteres base64 e payloads estruturalmente inválidos', async t => {
  const s = await setup(t);
  const yes = await s.post(payload('abc+ID/123='));
  assert.equal((await yes.json()).accepted, 1);
  await until(() => s.state.messages['wamid.abc+ID/123=']?.status === 'sent');
  const no = await s.post({ object: 'whatsapp_business_account', entry: { not: 'array' } });
  assert.equal((await no.json()).accepted, 0);
});
test('sem segredo e allowlist o gateway falha fechado', async () => {
  await assert.rejects(createService({}), /not_configured/);
});
