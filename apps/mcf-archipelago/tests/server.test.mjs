import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function waitForReady(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server timeout')), 5000);
    child.stdout.on('data', chunk => {
      if (String(chunk).includes('MCF Archipelago em')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on('data', chunk => {
      const text = String(chunk);
      if (text.trim()) reject(new Error(text));
    });
    child.on('exit', code => reject(new Error('server exited: ' + code)));
  });
}

test('backend local falha fechado sem API key', async () => {
  const port = 43000 + (process.pid % 1000);
  const child = spawn(process.execPath, ['server.cjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), OPENAI_API_KEY: '', MCF_BASE_URL: '', MCF_SESSION_COOKIE: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForReady(child);
    const status = await fetch('http://127.0.0.1:' + port + '/api/provider/status').then(r => r.json());
    assert.equal(status.openai.configured, false);
    assert.equal(status.mcf.configured, false);

    const badConfig = await fetch('http://127.0.0.1:' + port + '/api/provider/configure', {
      method:'POST',
      headers:{'Content-Type':'application/json','Origin':'http://127.0.0.1:' + port},
      body:JSON.stringify({openaiApiKey:'invalid',openaiModel:'gpt-5.6-luna'})
    });
    assert.equal(badConfig.status, 400);
    assert.equal((await badConfig.json()).code, 'INVALID_OPENAI_KEY');

    const response = await fetch('http://127.0.0.1:' + port + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title:'Teste', messages:[{role:'user',text:'Olá mundo'}] })
    });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, 'OPENAI_NOT_CONFIGURED');
  } finally {
    child.kill('SIGTERM');
  }
});
