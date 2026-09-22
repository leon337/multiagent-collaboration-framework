import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function waitForReady(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server timeout')), 5000);
    child.stdout.on('data', chunk => {
      if (String(chunk).includes('MCF Archipelago API v1 em')) {
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
  const dataDir = path.join(root, '.archipelago-data-test-' + process.pid);
  fs.rmSync(dataDir, { recursive:true, force:true });
  const child = spawn(process.execPath, ['server.cjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), OPENAI_API_KEY: '', MCF_BASE_URL: '', MCF_SESSION_COOKIE: '', ARCHIPELAGO_DATA_DIR: dataDir },
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

    const health = await fetch('http://127.0.0.1:' + port + '/api/v1/health').then(r => r.json());
    assert.equal(health.api, 'mcf-archipelago');
    assert.equal(health.version, 1);

    const deviceResponse = await fetch('http://127.0.0.1:' + port + '/api/v1/device/session', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({deviceId:'test-device',instanceId:'archipelago-test',transport:'test-http'})
    });
    assert.equal(deviceResponse.status, 201);
    const device = (await deviceResponse.json()).session;
    assert.equal(device.status, 'connected');

    const atomic = await fetch('http://127.0.0.1:' + port + '/api/v1/chat-sessions', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        id:'atomic-chat',
        islandId:'atomic-chat',
        title:'Chat Atômico',
        projectId:'mcf',
        deviceSessionId:device.id
      })
    });
    assert.equal(atomic.status, 201);
    const atomicBody = await atomic.json();
    assert.equal(atomicBody.state, 'READY');
    assert.equal(atomicBody.connection.status, 'connected');

    const connection = await fetch('http://127.0.0.1:' + port + '/api/v1/chat-sessions/atomic-chat/connection').then(r => r.json());
    assert.equal(connection.connection.deviceId, 'test-device');
    assert.equal(connection.connection.status, 'connected');

    const heartbeat = await fetch('http://127.0.0.1:' + port + '/api/v1/device/session/' + encodeURIComponent(device.id) + '/heartbeat', {method:'POST'});
    assert.equal(heartbeat.status, 200);

    const created = await fetch('http://127.0.0.1:' + port + '/api/v1/chats', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:'island-test',islandId:'island-test',title:'Chat Teste',projectId:'mcf'})
    });
    assert.equal(created.status, 201);
    assert.equal((await created.json()).chat.id, 'island-test');

    const message = await fetch('http://127.0.0.1:' + port + '/api/v1/chats/island-test/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:'Olá API própria'})
    });
    assert.equal(message.status, 201);
    assert.equal((await message.json()).message.role, 'user');

    const history = await fetch('http://127.0.0.1:' + port + '/api/v1/chats/island-test/messages').then(r => r.json());
    assert.equal(history.messages.length, 1);
    assert.equal(history.messages[0].text, 'Olá API própria');

    const noProvider = await fetch('http://127.0.0.1:' + port + '/api/v1/chats/island-test/responses', {method:'POST'});
    assert.equal(noProvider.status, 503);
    assert.equal((await noProvider.json()).code, 'OPENAI_NOT_CONFIGURED');

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
    fs.rmSync(dataDir, { recursive:true, force:true });
  }
});
