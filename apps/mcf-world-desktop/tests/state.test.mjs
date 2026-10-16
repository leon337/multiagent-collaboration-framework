import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHttpUrl, PortalRegistry } from '../src/browser/portal-registry.mjs';
import { createWorldState } from '../src/state/world-state.mjs';

test('normalizeHttpUrl adds https and accepts http(s)', () => {
  assert.equal(normalizeHttpUrl('example.com'), 'https://example.com/');
  assert.equal(normalizeHttpUrl('http://example.com/a'), 'http://example.com/a');
});

test('normalizeHttpUrl rejects privileged or invalid protocols', () => {
  for (const value of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,x', 'not a url with spaces']) {
    assert.throws(() => normalizeHttpUrl(value));
  }
});

test('PortalRegistry creates unique portal ids and deduplicates exact url-position pairs', () => {
  const registry = new PortalRegistry([]);
  const a = registry.add({ name:'Example', url:'example.com', position:{x:1,z:2} });
  const b = registry.add({ name:'Example again', url:'https://example.com/', position:{x:1,z:2} });
  assert.equal(registry.list().length, 1);
  assert.equal(a.id, b.id);
  assert.equal(a.url, 'https://example.com/');
});

test('world state serializes and restores player camera portals and browser url', () => {
  const memory = new Map();
  const storage = { getItem:k=>memory.get(k) ?? null, setItem:(k,v)=>memory.set(k,v) };
  const state = createWorldState(storage);
  state.save({
    player:{x:3,y:0,z:8,heading:1.2},
    camera:{mode:'third-person',distance:7},
    portals:[{id:'p1',name:'Example',url:'https://example.com/',position:{x:4,z:5},createdAt:'2026-09-23T00:00:00.000Z'}],
    activePortalId:'p1', browserUrl:'https://example.com/'
  });
  const restored = createWorldState(storage).load();
  assert.equal(restored.player.x, 3);
  assert.equal(restored.camera.distance, 7);
  assert.equal(restored.portals[0].id, 'p1');
  assert.equal(restored.browserUrl, 'https://example.com/');
});
