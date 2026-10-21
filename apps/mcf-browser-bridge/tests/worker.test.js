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

test('agent worker: opt-in and deferred revocation before/after snapshot; malformed/replay/busy deny', { timeout: 5000 }, async () => {
  for (const scenario of ['before-opt-in','stop','popup-close','tab-switch','expiry','after-snapshot','success','replay','busy','malformed','wrong-ref','document-drift']) {
    const onMessage = event(), onConnect = event(), activated = event();
    const reached = deferred(), resume = deferred();
    let native, armed = false, snapshots = 0;
    const results = [], denials = [], tab = { id: 1, url: 'file:///tmp/fixtures/bridge-fixture.html' };
    const summary = { title: 'Synthetic', url: 'file:///[LOCAL_FIXTURE]', text: 'Synthetic', truncated: false, visited: 1, untrusted: true };
    const chrome = { runtime: { id: 'a'.repeat(32), getURL: p => `chrome-extension://${'a'.repeat(32)}/${p}`, onMessage, onConnect,
      connectNative: () => {
        const handle = createSession();
        native = { onMessage: event(), onDisconnect: event(), disconnected: false,
          disconnect() { this.disconnected = true; this.onDisconnect.fire(); },
          postMessage(r) {
            if (r.type === 'agent_read_result') { results.push(r); reached.resolve(); return; }
            if (r.type === 'agent_read_denied') { denials.push(r); return; }
            const response = handle(r);
            if (r.action === 'agent-allow') response.consentRef = 'consent-1';
            queueMicrotask(() => this.onMessage.fire(response));
          } };
        return native;
      },
    }, tabs: { onActivated: activated, onUpdated: event(), onRemoved: event(), query: async () => [tab] },
    scripting: { executeScript: async spec => {
      if (spec.func.name === 'snapshot') {
        snapshots++;
        if (armed && scenario === 'after-snapshot') { reached.resolve(); await resume.promise; }
        return [{ documentId: 'doc-1', result: summary }];
      }
      if (spec.target.frameIds) return [{ documentId: 'doc-1', result: { url: tab.url, fixture: true } }];
      if (armed && !['success','replay','malformed','wrong-ref','before-opt-in','expiry','after-snapshot','document-drift'].includes(scenario)) { reached.resolve(); await resume.promise; }
      return [{ documentId: 'doc-1', result: armed && scenario === 'document-drift' ? 'file:///changed' : tab.url }];
    } } };
    globalThis.chrome = chrome;
    try {
      await import(`../extension/background.js?agent-${scenario}`);
      const sender = { id: chrome.runtime.id, url: chrome.runtime.getURL('popup.html') };
      const send = command => new Promise(resolve => [...onMessage.handlers][0]({ command }, sender, resolve));
      const popup = { name: 'popup', sender, onDisconnect: event() }; onConnect.fire(popup);
      assert.equal((await send('connect')).status, 'CONNECTED');
      if (scenario !== 'before-opt-in') assert.equal((await send('agent-allow')).agentReadAllowed, true);
      armed = true;
      const r = { type: 'agent_read_request', protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-03', actionId: 'agent-1', consentRef: scenario === 'wrong-ref' ? 'forged' : 'consent-1', expiresAt: Date.now() + (scenario === 'expiry' ? -1 : 4500), target: { tabId: tab.id, documentId: 'doc-1', url: tab.url, origin: 'file://' }, budget: { maxChars: 4000, maxNodes: 2000, timeoutMs: 4500 } };
      delete r.target.id;
      if (scenario === 'malformed') r.extra = true;
      native.onMessage.fire(r);
      if (['stop','popup-close','tab-switch','busy','after-snapshot'].includes(scenario)) {
        await reached.promise;
        if (scenario === 'popup-close') popup.onDisconnect.fire();
        else if (scenario === 'tab-switch') activated.fire();
        else if (scenario === 'busy') native.onMessage.fire({ ...r, actionId: 'agent-2' });
        else await send('stop');
        resume.resolve();
      }
      // Drain controlled async probes and post-capture revalidation.
      for (let i = 0; i < 30; i++) await Promise.resolve();
      if (['success','replay'].includes(scenario)) {
        assert.equal(results.length, 1); assert.equal(snapshots, 1);
        if (scenario === 'replay') { native.onMessage.fire(r); for (let i = 0; i < 10; i++) await Promise.resolve(); assert.equal(results.length, 1); assert.equal(native.disconnected, true); }
      } else {
        assert.equal(results.length, 0, scenario);
        assert.equal(snapshots, scenario === 'after-snapshot' ? 1 : 0, scenario);
        assert.equal(native.disconnected, true, scenario);
      }
      if (['stop','popup-close','tab-switch','after-snapshot'].includes(scenario)) assert.equal(denials.length, 0, 'no response after revocation');
      if (scenario === 'document-drift') { assert.equal(denials.length, 1); assert.equal(denials[0].failureCode, 'CONTEXT_CHANGED'); }
      await send('stop');
    } finally { resume.resolve(); delete globalThis.chrome; }
  }
});

test('native rpc ignores typed unsolicited request and rejects unknown/malformed host data', async () => {
  const onMessage = event(), onConnect = event();
  globalThis.chrome = { runtime: { onMessage, onConnect }, tabs: { onActivated: event(), onUpdated: event(), onRemoved: event() } };
  try {
    const { rpc } = await import('../extension/background.js?rpc-interleavings');
    const target = { tabId: 1, documentId: 'doc-1', url: 'file:///tmp/fixtures/bridge-fixture.html', origin: 'file://' };
    const request = { protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-02', actionId: 'rpc-1', action: 'hello', sessionId: null, expiresAt: Date.now() + 4000, target, budget: { maxChars: 4000, maxNodes: 2000, timeoutMs: 4000 } };
    const unsolicited = { type: 'agent_read_request', protocolVersion: 1, missionId: 'MCF-BROWSER-BRIDGE-001', phaseId: 'PHASE-03', actionId: 'agent-1', consentRef: 'consent-1', expiresAt: Date.now() + 4000, target, budget: { maxChars: 4000, maxNodes: 2000, timeoutMs: 4000 } };
    const port = { onMessage: event(), onDisconnect: event(), postMessage() {} };
    let completed = false;
    const promise = rpc(port, request).then(r => { completed = true; return r; });
    port.onMessage.fire(unsolicited); await Promise.resolve(); assert.equal(completed, false);
    port.onMessage.fire(createSession()(request)); assert.equal((await promise).state, 'VALIDATED');
    for (const invalid of [{ ...unsolicited, extra: true }, { type: 'unknown' }, { ...unsolicited, target: { ...target, url: 'https://example.com' } }]) {
      const denial = rpc(port, request); port.onMessage.fire(invalid); await assert.rejects(denial);
    }
  } finally { delete globalThis.chrome; }
});
