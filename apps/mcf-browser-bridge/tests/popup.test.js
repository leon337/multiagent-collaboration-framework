import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createSession } from '../host/session.js';
function event() { const handlers = new Set(); return { addListener: h => handlers.add(h), removeListener: h => handlers.delete(h), fire: (...args) => { for (const h of [...handlers]) h(...args); }, handlers }; }
test('real popup code + worker: connect/reset preserves consent, enables read; STOP/drift revoke', async () => {
  const onMessage = event(), onConnect = event(), activated = event(), events = [], natives = [];
  const id = 'a'.repeat(32), sender = { id, url: `chrome-extension://${id}/popup.html` };
  const tab = { id: 1, url: 'file:///tmp/fixtures/bridge-fixture.html' };
  const chrome = { runtime: { id, getURL: p => `chrome-extension://${id}/${p}`, onMessage, onConnect,
    connectNative() {
      const handle = createSession();
      const port = { disconnected: false, onMessage: event(), onDisconnect: event(), disconnect() { this.disconnected = true; this.onDisconnect.fire(); }, postMessage(r) { const response = handle(r); if (r.action === 'agent-allow') response.consentRef = 'ref-1'; queueMicrotask(() => this.onMessage.fire(response)); } };
      natives.push(port); return port;
    },
  }, tabs: { onActivated: activated, onUpdated: event(), onRemoved: event(), query: async () => [tab] }, scripting: { executeScript: async spec => [{ documentId: 'doc-1', result: spec.target.frameIds ? { url: tab.url, fixture: true } : spec.func.name === 'snapshot' ? { text: 'Synthetic', untrusted: true } : tab.url }] } };
  globalThis.chrome = chrome;
  try {
    await import('../extension/background.js?popup-integration');
    const elements = Object.fromEntries(['status','consent','summary','agent-consent','agent-state','connect','stop'].map(k => [k, { checked: false, disabled: ['summary','agent-consent'].includes(k), textContent: '' }]));
    const uiPort = { onMessage: event(), onDisconnect: event() };
    const workerPort = { name: 'popup', sender, onDisconnect: event(), postMessage(m) { events.push(m); uiPort.onMessage.fire(m); } };
    const requests = [];
    const popupChrome = { runtime: {
      connect() { onConnect.fire(workerPort); return uiPort; },
      sendMessage(m) { const p = new Promise(resolve => [...onMessage.handlers][0](m, sender, resolve)); requests.push(p); return p; },
    } };
    vm.runInNewContext(readFileSync(new URL('../extension/popup.js', import.meta.url), 'utf8'), { chrome: popupChrome, document: { querySelector: selector => elements[selector.slice(1)] } });
    const click = async key => { assert.equal(elements[key].disabled, false); elements[key].onclick(); await requests.at(-1); await Promise.resolve(); };
    elements.consent.checked = true;
    await click('connect');
    assert.deepEqual(events.map(m => m.status), ['SESSION_RESET']);
    assert.equal(elements.consent.checked, true); assert.equal(elements.summary.disabled, false);
    await click('summary'); assert.equal(JSON.parse(elements.status.textContent).status, 'VALIDATED');
    elements['agent-consent'].checked = true; elements['agent-consent'].onchange(); await requests.at(-1); await Promise.resolve();
    assert.match(elements['agent-state'].textContent, /agent read allowed: true/);
    const previous = natives.at(-1), count = events.length;
    await click('connect');
    assert.equal(previous.disconnected, true);
    assert.deepEqual(events.slice(count).map(m => m.status), ['SESSION_RESET']);
    assert.equal(elements['agent-consent'].checked, false);
    assert.equal(elements.consent.checked, true); assert.equal(elements.summary.disabled, false);
    await click('stop');
    assert.equal(events.at(-1).status, 'REVOKED'); assert.equal(elements.consent.checked, false); assert.equal(elements.summary.disabled, true);
    elements.consent.checked = true; await click('connect'); activated.fire();
    assert.equal(events.at(-1).status, 'REVOKED'); assert.equal(elements.consent.checked, false); assert.equal(elements.summary.disabled, true);
    elements.consent.checked = true; await click('connect'); workerPort.onDisconnect.fire();
    assert.equal(natives.at(-1).disconnected, true);
  } finally { delete globalThis.chrome; }
});
