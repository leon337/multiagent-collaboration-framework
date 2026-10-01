import test from 'node:test';
import assert from 'node:assert/strict';
import { browserTransition, portalPositionAhead } from '../src/browser/browser-flow.mjs';

test('browserTransition preserves url while open and clears it when returning to world', () => {
  let state = browserTransition({ open:false, url:null }, { type:'open', url:'https://example.com/' });
  assert.deepEqual(state, { open:true, url:'https://example.com/' });
  state = browserTransition(state, { type:'navigate', url:'https://github.com/' });
  assert.deepEqual(state, { open:true, url:'https://github.com/' });
  state = browserTransition(state, { type:'close' });
  assert.deepEqual(state, { open:false, url:null });
});

test('browserTransition rejects navigation without an open browser', () => {
  assert.throws(() => browserTransition({ open:false, url:null }, { type:'navigate', url:'https://example.com/' }), /not open/i);
});

test('portalPositionAhead places a new location ahead of PET heading', () => {
  const p0 = portalPositionAhead({ x:2, z:3, heading:0 }, 6);
  assert.ok(Math.abs(p0.x - 2) < 1e-9);
  assert.ok(Math.abs(p0.z + 3) < 1e-9);
  const p90 = portalPositionAhead({ x:2, z:3, heading:Math.PI/2 }, 6);
  assert.ok(Math.abs(p90.x + 4) < 1e-9);
  assert.ok(Math.abs(p90.z - 3) < 1e-9);
});
