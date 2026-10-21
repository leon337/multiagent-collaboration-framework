import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../host/session.js';
function event() { const handlers = new Set(); return { addListener: h => handlers.add(h), removeListener: h => handlers.delete(h), fire: (...args) => { for (const h of [...handlers]) h(...args); }, handlers }; }
test('mocked worker: consent, read, STOP, missing permission, tab/document swaps and restart deny', async () => {
  const onMessage = event(), onConnect = event(), activated = event(), updated = event();
  let tab = { id: 1, url: 'file:///tmp/fixtures/bridge-fixture.html' }, permission = true, documentId = 'doc-1', summaries = 0, swapDuringRead = false;
  const chrome = { runtime: { id: 'a'.repeat(32), getURL: path => `chrome-extension://${'a'.repeat(32)}/${path}`, onMessage, onConnect, connectNative: () => {
    const handle = createSession(); const port = { onMessage: event(), onDisconnect: event(), disconnect() { this.onDisconnect.fire(); }, postMessage(r) { queueMicrotask(() => this.onMessage.fire(handle(r))); } }; return port;
  } }, tabs: { onActivated: activated, onUpdated: updated, onRemoved: event(), query: async () => [tab] }, scripting: { executeScript: async spec => {
    if (!permission) throw Error('permission');
    if (spec.target.documentIds && !spec.target.documentIds.includes(documentId)) throw Error('stale document');
    let result;
    if (spec.func.name === 'snapshot') { summaries++; result = { text: 'Synthetic', untrusted: true }; if (swapDuringRead) documentId = 'doc-swapped'; }
    else if (spec.target.frameIds) result = { url: tab.url, fixture: true };
    else result = tab.url;
    return [{ documentId, result }];
  } } };
  globalThis.chrome = chrome;
  await import('../extension/background.js?worker-test');
  const sender = { id: chrome.runtime.id, url: chrome.runtime.getURL('popup.html') };
  const send = command => new Promise(resolve => { [...onMessage.handlers][0]({ command }, sender, resolve); });
  assert.equal((await send('summary')).status, 'DENIED');
  assert.equal((await send('connect')).status, 'CONNECTED');
  assert.equal((await send('summary')).status, 'VALIDATED'); assert.equal(summaries, 1);
  activated.fire(); assert.equal((await send('summary')).status, 'DENIED');
  assert.equal((await send('connect')).status, 'CONNECTED');
  documentId = 'doc-2'; assert.equal((await send('summary')).status, 'DENIED'); assert.equal(summaries, 1);
  permission = false; assert.equal((await send('connect')).status, 'DENIED'); permission = true;
  assert.equal((await send('connect')).status, 'CONNECTED');
  swapDuringRead = true; assert.equal((await send('summary')).status, 'DENIED'); swapDuringRead = false;
  assert.equal((await send('connect')).status, 'CONNECTED');
  const popup = { name: 'popup', sender, onDisconnect: event() }; onConnect.fire(popup); popup.onDisconnect.fire(); assert.equal((await send('summary')).status, 'DENIED');
  assert.equal((await send('connect')).status, 'CONNECTED');
  assert.equal((await send('stop')).status, 'STOPPED'); assert.equal((await send('summary')).status, 'DENIED');
  tab = { ...tab, url: 'https://example.com' }; assert.equal((await send('connect')).status, 'DENIED');
  let responded = false; const handler = [...onMessage.handlers][0]; assert.equal(handler({ command: 'connect' }, { ...sender, url: 'https://forged.invalid' }, () => { responded = true; }), false); assert.equal(responded, false);
  // A new module instance models volatile worker initialization; no persisted grant.
  onMessage.handlers.clear(); await import('../extension/background.js?worker-restarted'); assert.equal((await send('summary')).status, 'DENIED');
  delete globalThis.chrome;
});

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
test('revocation during either awaited current() prevents scheduling any snapshot', { timeout: 3000 }, async () => {
  // Exercise both current() calls preceding capture, including the final one
  // after host authorization. Resolve the pending probe only after revocation.
  for (const revoke of ['stop', 'popup-close', 'tab-switch']) for (const checkpoint of [1, 2]) {
    const onMessage = event(), onConnect = event(), activated = event();
    const reached = deferred(), resume = deferred();
    let armed = false, probes = 0, snapshots = 0;
    const tab = { id: 1, url: 'file:///tmp/fixtures/bridge-fixture.html' };
    const chrome = { runtime: {
      id: 'a'.repeat(32), getURL: path => `chrome-extension://${'a'.repeat(32)}/${path}`,
      onMessage, onConnect,
      connectNative: () => {
        const handle = createSession();
        return { onMessage: event(), onDisconnect: event(),
          disconnect() { this.onDisconnect.fire(); },
          postMessage(r) { queueMicrotask(() => this.onMessage.fire(handle(r))); } };
      },
    }, tabs: { onActivated: activated, onUpdated: event(), onRemoved: event(), query: async () => [tab] },
    scripting: { executeScript: async spec => {
      if (spec.func.name === 'snapshot') {
        snapshots++;
        return [{ documentId: 'doc-1', result: { text: 'Synthetic', untrusted: true } }];
      }
      if (spec.target.frameIds) return [{ documentId: 'doc-1', result: { url: tab.url, fixture: true } }];
      if (armed && ++probes === checkpoint) { reached.resolve(); await resume.promise; }
      return [{ documentId: 'doc-1', result: tab.url }];
    } } };
    globalThis.chrome = chrome;
    try {
      await import(`../extension/background.js?revocation-${revoke}-${checkpoint}`);
      const sender = { id: chrome.runtime.id, url: chrome.runtime.getURL('popup.html') };
      const send = command => new Promise(resolve => { [...onMessage.handlers][0]({ command }, sender, resolve); });
      const popup = { name: 'popup', sender, onDisconnect: event() }; onConnect.fire(popup);
      assert.equal((await send('connect')).status, 'CONNECTED');
      armed = true;
      const reading = send('summary');
      await reached.promise;
      assert.equal(snapshots, 0);
      if (revoke === 'stop') assert.equal((await send('stop')).status, 'STOPPED');
      else if (revoke === 'popup-close') popup.onDisconnect.fire();
      else activated.fire();
      resume.resolve();
      assert.equal((await reading).status, 'DENIED', `${revoke} at probe ${checkpoint}`);
      assert.equal(snapshots, 0, `no snapshot scheduled after ${revoke} at probe ${checkpoint}`);
      assert.equal((await send('summary')).status, 'DENIED');
      assert.equal(snapshots, 0);
    } finally {
      resume.resolve();
      delete globalThis.chrome;
    }
  }
});
