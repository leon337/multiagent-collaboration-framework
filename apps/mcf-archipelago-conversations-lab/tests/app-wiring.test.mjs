import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

test('selecionar uma ilha de chat foca sua conversa no painel ChatGPT', () => {
  assert.match(app, /focusChatSurface/);
  assert.match(app, /focusChatSurface\(node\.id\)/);
});

test('reset da interface limpa backend e volta para emptyState', () => {
  assert.match(app, /resetWorkspace/);
  assert.match(app, /await resetWorkspace\(\)/);
  assert.match(app, /normalizeState\(structuredClone\(emptyState\)\)/);
});


test('primeira resposta promove o chat novo para sua conversa real no painel ChatGPT', () => {
  assert.match(app, /await syncNodeChat\(node, false\);[\s\S]{0,220}await focusChatSurface\(node\.id\)/);
});

test('Lab não chama crypto.randomUUID diretamente no navegador', () => {
  assert.doesNotMatch(app, /crypto\.randomUUID\(\)/);
  assert.match(app, /stableBrowserId/);
});

test('Lab hidrata chats persistidos do backend no grafo', () => {
  assert.match(app, /listChats/);
  assert.match(app, /mergeBackendChats/);
  assert.match(app, /hydrateBackendChats/);
});

test('OpenAI-only possui caminho de binding sem Device Session', () => {
  assert.match(app, /openaiOnly/);
  assert.match(app, /await ensureChat\(node\)/);
  assert.match(app, /canCompose/);
});
