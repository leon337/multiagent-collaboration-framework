import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHttpUrl,
  movementVector,
  createLocalAhead,
  isWithinDistance,
} from '../src/world-domain.js';

test('normalizes a hostname to https', () => {
  assert.equal(normalizeHttpUrl('example.com'), 'https://example.com/');
});

test('rejects non-http URL schemes', () => {
  assert.throws(() => normalizeHttpUrl('javascript:alert(1)'), TypeError);
  assert.throws(() => normalizeHttpUrl('data:text/html,hello'), TypeError);
});

test('normalizes diagonal movement to unit length', () => {
  const result = movementVector({ forward: 1, right: 1 });
  assert.ok(Math.abs(Math.hypot(result.x, result.z) - 1) < 1e-9);
});

test('creates a Local ahead of the PET with canonical URL', () => {
  const local = createLocalAhead({
    id: 'demo',
    petPosition: { x: 2, y: 0, z: 3 },
    forward: { x: 0, z: -2 },
    distance: 5,
    url: 'example.com',
  });

  assert.deepEqual(local.position, { x: 2, y: 0, z: -2 });
  assert.equal(local.url, 'https://example.com/');
});

test('rejects zero-length Local forward vector', () => {
  assert.throws(
    () =>
      createLocalAhead({
        id: 'bad',
        petPosition: { x: 0, y: 0, z: 0 },
        forward: { x: 0, z: 0 },
        distance: 5,
        url: 'https://example.com',
      }),
    RangeError,
  );
});

test('proximity includes the exact interaction boundary', () => {
  assert.equal(isWithinDistance({ x: 0, z: 0 }, { x: 3, z: 4 }, 5), true);
});
