import test from 'node:test';
import assert from 'node:assert/strict';

async function loadRuntime() {
  return import('../src/lab-runtime.js').catch(() => null);
}

test('gera device id mesmo sem crypto.randomUUID', async () => {
  const runtime = await loadRuntime();
  assert.ok(runtime, 'lab-runtime precisa existir');
  const data = new Map();
  const storage = {
    getItem: key => data.get(key) || null,
    setItem: (key, value) => data.set(key, value)
  };
  const id = runtime.stableBrowserId(storage, {});
  assert.match(id, /^browser-/);
  assert.equal(runtime.stableBrowserId(storage, {}), id);
});

test('OpenAI-only libera composer sem Device Session', async () => {
  const runtime = await loadRuntime();
  assert.ok(runtime, 'lab-runtime precisa existir');
  const node = { type:'chat', connectionState:'OFFLINE' };
  const providers = { openai:{configured:true}, chatgptBrowser:{configured:false} };
  assert.equal(runtime.canCompose(node, providers, false), true);
});
test('hidrata no grafo chats que já existem no backend', async () => {
  const runtime = await loadRuntime();
  assert.ok(runtime, 'lab-runtime precisa existir');
  const state = {
    nodes:[{ id:'mcf', type:'project', title:'MCF', x:0, y:0, r:82, parentId:null, tags:[], messages:[] }],
    edges:[]
  };
  runtime.mergeBackendChats(state, [{
    id:'e2e-backend', islandId:'e2e-backend', title:'E2E Persistência', projectId:'mcf_lab',
    metadata:{ openai:{ conversationId:'conv_test' } }, messageCount:1
  }]);
  const chat = state.nodes.find(node => node.id === 'e2e-backend');
  assert.ok(chat);
  assert.equal(chat.type, 'chat');
  assert.equal(chat.connectionState, 'READY');
  assert.equal(chat.openaiConversationId, 'conv_test');
});
