import test from 'node:test';
import assert from 'node:assert/strict';
import { movementStep, nearestPortal } from '../src/player/controls.js';

test('movementStep moves forward and run is faster', () => {
  const start = { x:0, z:0, heading:0 };
  const walk = movementStep(start, { forward:true }, 1);
  const run = movementStep(start, { forward:true, run:true }, 1);
  assert.ok(walk.z < -4.9 && walk.z > -5.1);
  assert.ok(run.z < walk.z);
  assert.equal(run.x, 0);
});

test('movementStep rotates without translating when only turn input exists', () => {
  const next = movementStep({x:2,z:3,heading:0}, { left:true }, 0.5);
  assert.equal(next.x, 2);
  assert.equal(next.z, 3);
  assert.ok(next.heading > 1.19 && next.heading < 1.21);
});

test('nearestPortal returns nearest portal only inside threshold', () => {
  const portals = [
    {id:'a',position:{x:3,z:0}},
    {id:'b',position:{x:1,z:0}},
  ];
  assert.equal(nearestPortal({x:0,z:0}, portals, 2).id, 'b');
  assert.equal(nearestPortal({x:10,z:10}, portals, 2), null);
});
