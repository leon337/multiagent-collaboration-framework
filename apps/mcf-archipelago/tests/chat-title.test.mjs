import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveChatTitle } from '../src/chat-title.js';

test('deriveChatTitle usa a primeira frase curta', () => {
  assert.equal(
    deriveChatTitle('Vamos revisar o runtime do MCF. Depois vemos a UI.'),
    'Vamos revisar o runtime do MCF'
  );
});

test('deriveChatTitle limita título sem cortar palavra quando possível', () => {
  const title = deriveChatTitle('Implementar conexão atômica do Archipelago com o ChatGPT real usando o Dual Browser');
  assert.ok(title.length <= 52);
  assert.equal(title, 'Implementar conexão atômica do Archipelago com o');
});

test('deriveChatTitle preserva fallback para texto vazio', () => {
  assert.equal(deriveChatTitle('   '), 'Novo chat');
});
