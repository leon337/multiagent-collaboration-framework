import assert from 'node:assert/strict';
import test from 'node:test';
import { clipMessage } from '../message-window.mjs';

test('large CodeBuddy user request retains latest instruction', () => {
  const marker = 'DIAG_MCF_MARKER_77';
  const text = 'Contexto anterior. '.repeat(1000) + marker;
  const clipped = clipMessage('user', text);
  assert.equal(clipped.length, 6500);
  assert.ok(clipped.endsWith(marker));
  assert.equal(clipped.includes(marker), true);
});

test('assistant history keeps earlier context, bounded to 6500', () => {
  const text = 'START-' + 'x'.repeat(14000) + '-END';
  const clipped = clipMessage('assistant', text);
  assert.ok(clipped.startsWith('START-'));
  assert.equal(clipped.includes('-END'), false);
  assert.equal(clipped.length, 6500);
});

test('short instructions remain unchanged', () => {
  assert.equal(clipMessage('user', 'Respond ONLY OK'), 'Respond ONLY OK');
});

test('invalid max length is rejected', () => {
  assert.throws(() => clipMessage('user', 'x', 0), RangeError);
});
