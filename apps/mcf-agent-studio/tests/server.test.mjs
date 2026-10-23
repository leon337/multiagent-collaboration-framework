import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = dirname(dirname(fileURLToPath(import.meta.url)));
const port = 43190;
const origin = 'http://127.0.0.1:' + port;
let root;
let child;
let profile;
async function call(route, method = 'GET', data, headers = {}) {
  const result = await fetch(origin + route, {
    method,
    headers: { ...(data !== undefined ? { 'content-type': 'application/json', origin } : {}), ...headers },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  return { status: result.status, body: await result.json() };
}
test('MVP end-to-end: criar proposta, validar, salvar, testar e restaurar', async (t) => {
  root = await mkdtemp(join(tmpdir(), 'mcf-agent-studio-test-'));
  profile = join(root, 'cordis.patch.yml');
  const source = join(root, 'index.js');
  const initialProfile = 'id: preset-hello-world-agent\nresponse: Hello World!\n';
  await writeFile(profile, initialProfile);
  await writeFile(source, 'export const RESPONSE = "Hello World!";\n');
  child = spawn(process.execPath, [join(base, 'server.mjs')], {
    cwd: base, env: { ...process.env, AGENT_STUDIO_PORT: String(port),
      AGENT_STUDIO_DATA: join(root, 'state.json'), AGENT_STUDIO_PROFILE: profile,
      AGENT_STUDIO_AGENT: source, AGENT_STUDIO_API_KEY: '', NINEROUTER_API_KEY: ''
    }, stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    child.kill('SIGTERM');
    await rm(root, { recursive: true, force: true });
  });
  let ready = false;
  for (let i = 0; i < 45; i++) {
    try { const r = await call('/health'); if (r.status === 200) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 70));
  }
  assert.equal(ready, true, 'servidor inicia');
  let r = await call('/api/state');
  assert.equal(r.status, 200);
  assert.equal(r.body.current.response, 'Hello World!');
  assert.equal(r.body.integration.published, false);
  assert.equal(r.body.integration.profileReadable, true);
  const firstRevision = r.body.revision;
  assert.equal((await call('/api/preview', 'POST', { message: 'oi' })).body.answer, 'Hello World!');

  r = await call('/api/propose', 'POST', { prompt: 'Altere a resposta para "Bom dia!"' });
  assert.equal(r.status, 200);
  assert.equal(r.body.source, 'guided');
  assert.equal(r.body.next.response, 'Bom dia!');
  const id = r.body.id;
  assert.equal((await call('/api/preview', 'POST', { message: 'oi', proposalId: id })).body.answer, 'Bom dia!');
  assert.equal((await call('/api/state')).body.current.response, 'Hello World!', 'proposta não é aplicada automaticamente');

  r = await call('/api/apply', 'POST', { id });
  assert.equal(r.status, 200);
  assert.equal(r.body.revision, firstRevision + 1);
  assert.equal((await call('/api/preview', 'POST', { message: 'oi' })).body.answer, 'Bom dia!');

  r = await call('/api/propose', 'POST', { prompt: 'Adicione a ferramenta calculadora' });
  assert.deepEqual(r.body.next.tools, ['calculator']);
  await call('/api/apply', 'POST', { id: r.body.id });
  assert.equal((await call('/api/preview', 'POST', { message: 'calcule 8*7' })).body.answer, '56');
  assert.equal((await call('/api/preview', 'POST', { message: 'calcule (4+5)*3' })).body.answer, '27');

  r = await call('/api/propose', 'POST', { direct: { mode: 'echo', tools: [] } });
  assert.equal(r.status, 200);
  await call('/api/apply', 'POST', { id: r.body.id });
  assert.equal((await call('/api/preview', 'POST', { message: 'minha mensagem' })).body.answer, 'minha mensagem');

  const history = (await call('/api/state')).body.history;
  assert.ok(history.length >= 4);
  const original = history.find(h => h.revision === firstRevision);
  r = await call('/api/restore', 'POST', { id: original.id });
  assert.equal(r.status, 200);
  assert.equal(r.body.current.response, 'Hello World!');
  assert.equal(r.body.current.mode, 'fixed');
  assert.equal((await call('/api/export')).body.warning.includes('não é um preset instalado'), true);
  assert.equal(await readFile(profile, 'utf8'), initialProfile, 'perfil original permanece intacto');

  const blocked = await call('/api/propose', 'POST', { direct: { tools: ['shell'] } });
  assert.equal(blocked.status, 400);
  const unknown = await call('/api/propose', 'POST', { prompt: 'execute rm -rf' });
  assert.equal(unknown.status, 422);
  const missingKey = await call('/api/propose', 'POST', { prompt: 'faça isso', useAi: true });
  assert.equal(missingKey.status, 422);
  const unauthorizedTest = await call('/api/provider/test', 'POST', {});
  assert.equal(unauthorizedTest.status, 422, 'test requires an authorized key');
  const missingCredentialState = (await call('/api/state')).body.provider;
  assert.equal(missingCredentialState.verified, false, 'no connection is claimed without a real API call');
  const badOrigin = await call('/api/propose', 'POST', { prompt: 'abc' }, { origin: 'http://attacker.example' });
  assert.equal(badOrigin.status, 403);
  const pathTraversal = await fetch(origin + '/../../etc/passwd');
  assert.equal(pathTraversal.status, 404);
  const doc = await fetch(origin + '/');
  assert.equal(doc.status, 200);
  assert.match(await doc.text(), /Agent Studio/);
  assert.equal((await fetch(origin + '/app.js')).status, 200);
  assert.equal((await fetch(origin + '/style.css')).status, 200);
});