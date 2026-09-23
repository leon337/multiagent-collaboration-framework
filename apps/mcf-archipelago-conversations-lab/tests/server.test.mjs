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
      if (String(chunk).includes('MCF Archipelago Conversations Lab em')) {
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

test('laboratório permanece isolado sem browser bridge e sem MCF dispatch', async () => {
  const port = 44000 + (process.pid % 1000);
  const dataDir = path.join(root, '.archipelago-data-test-' + process.pid);
  fs.rmSync(dataDir, { recursive:true, force:true });

  const child = spawn(process.execPath, ['server.cjs'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      OPENAI_API_KEY: '',
      MCF_BASE_URL: 'http://127.0.0.1:9',
      MCF_SESSION_COOKIE: 'must-not-be-used',
      MCF_DUAL_BROWSER_BRIDGE_FILE: '/tmp/must-not-be-used.json',
      ARCHIPELAGO_DATA_DIR: dataDir
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForReady(child);
    const base = 'http://127.0.0.1:' + port;

    const status = await fetch(base + '/api/provider/status').then(r => r.json());
    assert.equal(status.openai.configured, false);
    assert.equal(status.chatgptBrowser.configured, false);
    assert.equal(status.mcf.configured, false);
    assert.equal(status.isolation.enabled, true);
    assert.equal(status.isolation.browserBridge, false);
    assert.equal(status.isolation.mcfDispatch, false);

    const health = await fetch(base + '/api/v1/health').then(r => r.json());
    assert.equal(health.api, 'mcf-archipelago');
    assert.equal(health.providers.chatgptBrowser.configured, false);
    assert.equal(health.providers.openai.mode, 'persistent-conversations');

    const deviceResponse = await fetch(base + '/api/v1/device/session', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({deviceId:'lab-device',instanceId:'conversations-lab',transport:'local-compat'})
    });
    assert.equal(deviceResponse.status, 201);
    const device = (await deviceResponse.json()).session;
    assert.equal(device.status, 'connected');

    const atomic = await fetch(base + '/api/v1/chat-sessions', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        id:'lab-chat',
        islandId:'lab-chat',
        title:'Chat isolado',
        projectId:'lab',
        deviceSessionId:device.id
      })
    });
    assert.equal(atomic.status, 201);
    const atomicBody = await atomic.json();
    assert.equal(atomicBody.state, 'READY');
    assert.equal(atomicBody.chat.id, 'lab-chat');
    assert.equal(atomicBody.chatgpt.chatgptUrl, null);
    assert.equal(atomicBody.chatgpt.labSurface, true);

    const message = await fetch(base + '/api/v1/chats/lab-chat/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:'Teste isolado'})
    });
    assert.equal(message.status, 201);

    const noProvider = await fetch(base + '/api/v1/chats/lab-chat/responses', {method:'POST'});
    assert.equal(noProvider.status, 503);
    assert.equal((await noProvider.json()).code, 'NO_CHAT_PROVIDER');

    const mcf = await fetch(base + '/api/mcf/dispatch', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:'{}'
    });
    assert.equal(mcf.status, 503);
    assert.equal((await mcf.json()).code, 'LAB_ISOLATED');

    const legacy = await fetch(base + '/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:'{}'
    });
    assert.equal(legacy.status, 410);
    assert.equal((await legacy.json()).code, 'LEGACY_CHAT_DISABLED');

    const reset = await fetch(base + '/api/v1/workspace', {method:'DELETE'});
    assert.equal(reset.status, 200);
    const afterReset = await fetch(base + '/api/v1/chats').then(r => r.json());
    assert.equal(afterReset.chats.length, 0);
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(dataDir, { recursive:true, force:true });
  }
});
