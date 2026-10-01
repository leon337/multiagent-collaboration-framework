import test from 'node:test';
import assert from 'node:assert/strict';
import { focusChatSurface, resetWorkspace } from '../src/chat-api.js';

test('focusChatSurface solicita foco do chat selecionado', async () => {
  const originalFetch = globalThis.fetch;
  let seen = null;
  globalThis.fetch = async (url, options = {}) => {
    seen = { url, options };
    return new Response(JSON.stringify({ ok:true, url:'https://chatgpt.com/c/chat-1' }), {
      status:200,
      headers:{'Content-Type':'application/json'}
    });
  };
  try {
    const result = await focusChatSurface('chat-1');
    assert.equal(seen.url, '/api/v1/chats/chat-1/focus');
    assert.equal(seen.options.method, 'POST');
    assert.equal(result.ok, true);
  } finally { globalThis.fetch = originalFetch; }
});

test('resetWorkspace solicita limpeza persistente do Archipelago', async () => {
  const originalFetch = globalThis.fetch;
  let seen = null;
  globalThis.fetch = async (url, options = {}) => {
    seen = { url, options };
    return new Response(JSON.stringify({ ok:true, clearedChats:3 }), {
      status:200,
      headers:{'Content-Type':'application/json'}
    });
  };
  try {
    const result = await resetWorkspace();
    assert.equal(seen.url, '/api/v1/workspace');
    assert.equal(seen.options.method, 'DELETE');
    assert.equal(result.clearedChats, 3);
  } finally { globalThis.fetch = originalFetch; }
});
